export default function FoundingProLoading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid var(--wm-border)',
          borderTopColor: 'var(--wm-amber)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
