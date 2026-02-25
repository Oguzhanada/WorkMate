"use client";

import Link from 'next/link';
import {MouseEvent, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import VerifiedNavigationLink from '@/components/site/VerifiedNavigationLink';
import styles from './site.module.css';

export default function SiteHeader() {
  const router = useRouter();
  const t = useTranslations('header');
  const common = useTranslations('common');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    payload: Record<string, unknown>;
    created_at: string;
    read_at: string | null;
  }>>([]);

  const localized = (path: string) => path;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({data}) => {
      setIsAuthenticated(Boolean(data.user));
      setUserId(data.user?.id ?? '');
      setIsAdmin(false);
      setUserName((data.user?.user_metadata?.full_name as string | undefined) ?? '');
    });

    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
      setUserId(session?.user?.id ?? '');
      setUserName((session?.user?.user_metadata?.full_name as string | undefined) ?? '');
      if (!session?.user) {
        setIsAdmin(false);
        setUserName('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setNotifications([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    const loadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id,type,payload,created_at,read_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8);

      setNotifications((data as Array<{
        id: string;
        type: string;
        payload: Record<string, unknown>;
        created_at: string;
        read_at: string | null;
      }>) ?? []);
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 20000);

    return () => clearInterval(timer);
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setIsAdmin(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .limit(1)
      .then(({ data }) => setIsAdmin((data ?? []).length > 0));
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setUserName('');
      return;
    }
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle()
      .then(({data}) => {
        setUserName(data?.full_name ?? '');
      });
  }, [isAuthenticated, userId]);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const markAllRead = async () => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    setNotifications((current) =>
      current.map((item) => (item.read_at ? item : { ...item, read_at: new Date().toISOString() }))
    );
  };

  const deleteNotification = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('notifications').delete().eq('id', id).eq('user_id', userId);
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  const renderNotificationText = (type: string, payload: Record<string, unknown>) => {
    if (type === 'new_quote') {
      return 'New quote received';
    }
    if (type === 'new_message') {
      const sender = typeof payload.sender_name === 'string' ? payload.sender_name : 'User';
      const preview = typeof payload.preview === 'string' && payload.preview ? `: ${payload.preview}` : '';
      return `New message (${sender})${preview}`;
    }
    if (type === 'new_job_lead') {
      const title = typeof payload.title === 'string' ? payload.title : 'Listing';
      return `New job lead: ${title}`;
    }
    if (type === 'admin_verification_update') {
      const status = (payload as { status?: string }).status ?? 'updated';
      return `Verification review updated: ${status}`;
    }
    if (type === 'admin_document_update') {
      const docType = (payload as { document_type?: string }).document_type ?? 'document';
      const decision = (payload as { decision?: string }).decision ?? 'updated';
      return `${docType} review: ${decision}`;
    }
    return 'New notification';
  };

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(localized('/login'));
    router.refresh();
  };

  const onBecomeProviderClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    const {
      data: {user}
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(localized('/login'));
      return;
    }

    const {data: idDocument} = await supabase
      .from('pro_documents')
      .select('id')
      .eq('profile_id', user.id)
      .eq('document_type', 'id_verification')
      .limit(1)
      .maybeSingle();

    if (!idDocument?.id) {
      router.push(localized('/profile?message=identity_required#identity-verification'));
      return;
    }

    router.push(localized('/become-provider'));
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerBar}>
          <Link href={localized('/')} className={styles.logo} aria-label="WorkMate">
            <span className={styles.logoPill}>WM</span>
            <span className={styles.logoText}>WorkMate</span>
          </Link>

          <div className={styles.primaryCtaGroup}>
            <VerifiedNavigationLink href={localized('/jobs')} className={`${styles.ctaBig} ${styles.ctaBigSecondary}`}>
              {t('getService')}
            </VerifiedNavigationLink>
            <Link href={localized('/become-provider')} className={styles.ctaBig} onClick={onBecomeProviderClick}>
              {t('becomePro')}
            </Link>
          </div>

          <div className={styles.headerActions}>
            {isAuthenticated ? (
              <>
                <div className={styles.notificationWrap}>
                  <button
                    type="button"
                    className={styles.notificationButton}
                    aria-label="Notifications"
                    onClick={() => setNotificationsOpen((value) => !value)}
                  >
                    <i className="fa-regular fa-bell" />
                    {unreadCount > 0 ? <span className={styles.notificationBadge}>{unreadCount}</span> : null}
                  </button>
                  {notificationsOpen ? (
                    <div className={styles.notificationPanel}>
                      <div className={styles.notificationHeader}>
                        <strong>Notifications</strong>
                        {unreadCount > 0 ? (
                          <button type="button" onClick={markAllRead} className={styles.notificationMarkRead}>
                            Mark all as read
                          </button>
                        ) : null}
                      </div>
                      <div className={styles.notificationList}>
                        {notifications.length === 0 ? (
                          <p className={styles.notificationEmpty}>
                            No new notifications
                          </p>
                        ) : (
                          notifications.map((item) => (
                            <div key={item.id} className={styles.notificationItem}>
                              <Link
                                href={localized(
                                  item.type === 'new_quote'
                                    ? '/dashboard/customer'
                                    : item.type === 'new_message'
                                      ? '/messages'
                                      : '/notifications'
                                )}
                                onClick={() => setNotificationsOpen(false)}
                              >
                                <span>{renderNotificationText(item.type, item.payload)}</span>
                                <small>{new Date(item.created_at).toLocaleString()}</small>
                              </Link>
                              <button
                                type="button"
                                className={styles.notificationDelete}
                                onClick={() => deleteNotification(item.id)}
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <Link href={localized('/notifications')} className={styles.notificationInboxLink}>
                        Open inbox
                      </Link>
                    </div>
                  ) : null}
                </div>
                {!isAdmin ? (
                  <Link href={localized('/profile')} className={`${styles.linkButton} ${styles.desktopAction}`}>
                    {userName || t('profile')}
                  </Link>
                ) : null}
                {isAdmin ? (
                  <Link href={localized('/dashboard/admin')} className={`${styles.linkButton} ${styles.desktopAction}`}>
                    {t('adminPanel')}
                  </Link>
                ) : null}
                <button type="button" onClick={logout} className={`${styles.linkButton} ${styles.desktopAction} ${styles.linkButtonPlain}`}>
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link href={localized('/login')} className={`${styles.linkButton} ${styles.desktopAction}`}>
                {t('login')}
              </Link>
            )}
            <Link href={localized('/about')} className={`${styles.linkButton} ${styles.desktopAction}`}>
              {t('help')}
            </Link>
          </div>
        </div>

        <div className={styles.trustBar}>
          <span className={styles.trustItem}>
            <i className="fa-solid fa-circle-check" />
            {common('trusted')}
          </span>
          <span className={styles.trustItem}>
            <i className="fa-solid fa-lock" />
            {common('secure')}
          </span>
          <span className={styles.trustItem}>
            <i className="fa-solid fa-shield" />
            {common('guarantee')}
          </span>
        </div>
      </div>
    </header>
  );
}

