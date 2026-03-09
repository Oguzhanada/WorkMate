export default function SavedSearchesLoading() {
  return (
    <main className="py-10">
      <div style={{ width: 'min(960px, calc(100% - 32px))', margin: '0 auto' }}>
        <div
          className="mb-6 h-24 rounded-2xl"
          style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-[22px]"
              style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
