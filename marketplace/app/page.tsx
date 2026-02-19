export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "Segoe UI, Arial, sans-serif",
        background:
          "linear-gradient(135deg, rgb(245, 247, 250) 0%, rgb(230, 238, 246) 100%)",
        color: "#14213d",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <section
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 10px 30px rgba(20, 33, 61, 0.08)",
          }}
        >
          <p style={{ margin: 0, color: "#2a9d8f", fontWeight: 700 }}>
            Irish Service Marketplace
          </p>
          <h1 style={{ marginTop: "10px", marginBottom: "10px", fontSize: "34px" }}>
            Hizmet arayanlar ile profesyonelleri buluşturan platform
          </h1>
          <p style={{ marginTop: 0, lineHeight: 1.6, color: "#33415c" }}>
            Bu uygulamada müşteriler iş ilanı açar, profesyoneller teklif verir ve
            ödeme güvenli şekilde tutulup iş tamamlandığında tahsil edilir.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              href="/post-job"
              style={{
                background: "#0b5ed7",
                color: "#fff",
                textDecoration: "none",
                padding: "10px 14px",
                borderRadius: "10px",
                fontWeight: 600,
              }}
            >
              İş Talebi Oluştur
            </a>
            <a
              href="/dashboard/pro"
              style={{
                background: "#e9ecef",
                color: "#14213d",
                textDecoration: "none",
                padding: "10px 14px",
                borderRadius: "10px",
                fontWeight: 600,
              }}
            >
              Pro Panelini Aç
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
