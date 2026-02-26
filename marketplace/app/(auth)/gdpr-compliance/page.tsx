export default function GdprCompliancePage() {
  return (
    <main style={{maxWidth: 860, margin: '40px auto', padding: '0 16px', fontFamily: 'Inter, sans-serif'}}>
      <h1 style={{fontFamily: 'Poppins, sans-serif'}}>GDPR Compliance</h1>
      <p>
        WorkMate processes identity and account data only for verification, fraud prevention, and legal compliance.
      </p>
      <ul>
        <li>Data is encrypted in transit and at rest.</li>
        <li>Identity documents are retained only for approved retention windows.</li>
        <li>You can request correction or deletion under GDPR rights.</li>
      </ul>
    </main>
  );
}
