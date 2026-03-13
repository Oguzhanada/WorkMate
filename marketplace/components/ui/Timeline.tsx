import type { ReactNode } from 'react';

export type TimelineItem = {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  /** Icon node (e.g. Lucide icon). Falls back to a dot. */
  icon?: ReactNode;
  /** Hex or CSS color for the icon/dot */
  iconColor?: string;
  /** Background for the icon circle (default variant only) */
  iconBg?: string;
  /** Optional badge label */
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
};

type Props = {
  items: TimelineItem[];
  /** default = large circle icon + line; simple = small dot */
  variant?: 'default' | 'simple';
};

export default function Timeline({ items, variant = 'default' }: Props) {
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const color = item.iconColor ?? '#169B62';
        const bg = item.iconBg ?? 'rgba(22,155,98,0.12)';

        return (
          <div key={item.id} style={{ display: 'flex', gap: '14px' }}>
            {/* ── Left: dot/icon + connector line ── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
                width: variant === 'default' ? '36px' : '20px',
              }}
            >
              {variant === 'default' ? (
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: bg,
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color,
                    zIndex: 1,
                  }}
                >
                  {item.icon ?? (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: color,
                      }}
                    />
                  )}
                </div>
              ) : (
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                    marginTop: '3px',
                  }}
                />
              )}

              {!isLast && (
                <div
                  style={{
                    width: '2px',
                    flex: 1,
                    minHeight: '20px',
                    marginTop: '3px',
                    marginBottom: '3px',
                    background: '#e2e8f0',
                    borderRadius: '1px',
                  }}
                />
              )}
            </div>

            {/* ── Right: content ── */}
            <div
              style={{
                flex: 1,
                paddingBottom: isLast ? 0 : '16px',
                paddingTop: variant === 'default' ? '6px' : '0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#0f172a',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.title}
                  </p>
                  {item.description && (
                    <p
                      style={{
                        margin: '3px 0 0',
                        fontSize: '12px',
                        color: '#64748b',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                  }}
                >
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: item.badgeColor ?? '#169B62',
                        background: item.badgeBg ?? 'rgba(22,155,98,0.10)',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.timestamp}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
