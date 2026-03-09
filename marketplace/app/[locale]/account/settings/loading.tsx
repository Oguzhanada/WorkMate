export default function AccountSettingsLoading() {
  return (
    <main className="py-10">
      <div style={{ width: 'min(720px, calc(100% - 32px))', margin: '0 auto' }}>
        <div
          className="mb-6 h-24 rounded-2xl"
          style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            className="h-40 rounded-[22px]"
            style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
          />
          <div
            className="h-56 rounded-[22px]"
            style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
          />
        </div>
      </div>
    </main>
  );
}
