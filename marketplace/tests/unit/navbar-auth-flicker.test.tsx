import {act, render} from '@testing-library/react';
import {screen, waitFor} from '@testing-library/dom';
import type {ReactNode} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import Navbar from '@/components/home/Navbar';

const pushMock = vi.fn();
const replaceMock = vi.fn();
const refreshMock = vi.fn();

type AuthCallback = ((event: string) => Promise<void> | void) | null;

let authCallback: AuthCallback = null;
let getSessionMock: ReturnType<typeof vi.fn> = vi.fn();

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
}

vi.mock('next/link', () => ({
  default: ({children, href, ...rest}: {children?: ReactNode; href?: string; [key: string]: unknown}) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  )
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    refresh: refreshMock
  })
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({children}: {children?: ReactNode; [key: string]: unknown}) => children,
  motion: {
    div: ({children, initial: _initial, animate: _animate, variants: _variants, exit: _exit, transition: _transition, ...props}: {children?: ReactNode; [key: string]: unknown}) => (
      <div {...props}>{children}</div>
    )
  }
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: getSessionMock,
      getUser: vi.fn().mockResolvedValue({data: {user: null}}),
      onAuthStateChange: vi.fn((callback: AuthCallback) => {
        authCallback = callback;
        return {data: {subscription: {unsubscribe: vi.fn()}}};
      }),
      signOut: vi.fn().mockResolvedValue({})
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => {
          if (table === 'user_roles') return Promise.resolve({data: [{role: 'verified_pro'}]});
          return {
            maybeSingle: () => Promise.resolve({data: {full_name: 'Ada User'}})
          };
        }
      })
    })
  })
}));

describe('Navbar auth refresh behavior', () => {
  beforeEach(() => {
    authCallback = null;
    getSessionMock = vi.fn();
    pushMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
    window.localStorage.clear();
  });

  it('does not render auth skeleton during auth refresh events', async () => {
    const refreshDeferred = createDeferred<{data: {session: {user: {id: string}}}}>();

    getSessionMock
      .mockResolvedValueOnce({data: {session: {user: {id: 'user-1'}}}})
      .mockImplementationOnce(() => refreshDeferred.promise)
      .mockResolvedValue({data: {session: {user: {id: 'user-1'}}}});

    const {container} = render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByRole('link', {name: 'Dashboard'})).toBeInTheDocument();
    });

    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    expect(authCallback).not.toBeNull();

    act(() => {
      void authCallback?.('TOKEN_REFRESHED');
    });

    expect(screen.getByRole('link', {name: 'Dashboard'})).toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();

    await act(async () => {
      refreshDeferred.resolve({data: {session: {user: {id: 'user-1'}}}});
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole('link', {name: 'Dashboard'})).toBeInTheDocument();
    });
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });

  it('renders cached profile name immediately while auth refresh resolves', async () => {
    window.localStorage.setItem(
      'workmate.nav.auth.snapshot',
      JSON.stringify({
        isAuthenticated: true,
        hasAdminRole: false,
        hasProviderRole: true,
        profileName: 'Ada Cached'
      })
    );

    const refreshDeferred = createDeferred<{data: {session: {user: {id: string}}}}>();
    getSessionMock
      .mockImplementationOnce(() => refreshDeferred.promise)
      .mockResolvedValue({data: {session: {user: {id: 'user-1'}}}});

    render(<Navbar />);

    expect(screen.getByRole('link', {name: 'Ada Cached'})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Dashboard'})).toBeInTheDocument();

    await act(async () => {
      refreshDeferred.resolve({data: {session: {user: {id: 'user-1'}}}});
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole('link', {name: 'Ada User'})).toBeInTheDocument();
    });
  });
});
