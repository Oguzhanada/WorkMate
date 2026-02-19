"use client";

import { useState } from "react";
import styles from "./page.module.css";

const trendServices = [
  {
    name: "Ev Temizligi",
    pros: "1.240 profesyonel",
    reviews: "18.500 onayli yorum",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Boya Badana",
    pros: "930 profesyonel",
    reviews: "9.800 onayli yorum",
    image:
      "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Sehirler Arasi Nakliyat",
    pros: "760 profesyonel",
    reviews: "12.300 onayli yorum",
    image:
      "https://images.unsplash.com/photo-1600518464441-9306b7c4f605?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Klima Servisi",
    pros: "540 profesyonel",
    reviews: "6.100 onayli yorum",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
  },
];

const valueCards = [
  {
    icon: "fa-star",
    title: "Kaliteli Hizmet Al",
    description: "Puanlari yuksek, dogrulanmis profesyonellerle guvenle calis.",
  },
  {
    icon: "fa-clock",
    title: "Zaman Kazan",
    description: "Dakikalar icinde talep olustur, birden fazla teklif al.",
  },
  {
    icon: "fa-shield-halved",
    title: "Garantide Ol",
    description: "Onayli yorumlar ve guvenli surecler ile riskini azalt.",
  },
  {
    icon: "fa-mobile-screen-button",
    title: "Kolayca Kullan",
    description: "Tum sureci tek ekrandan yonet, teklifleri hizla karsilastir.",
  },
];

const steps = [
  {
    title: "Ihtiyacini anlat",
    description: "Hangi hizmete ihtiyacin oldugunu kisa bir formla belirt.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Teklif al",
    description: "Bolgenden uygun profesyonellerden hizli teklifler gelsin.",
    image:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Karsilastir ve sec",
    description: "Fiyat, puan ve yorumlara gore en iyi secenegi kolayca sec.",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
  },
];

export default function HomePage() {
  // Mobile menuyu ac/kapa davranisi.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerBar}>
            <a href="#" className={styles.logo} aria-label="Armut">
              <span className={styles.logoPill}>Armut</span>
            </a>

            <button
              className={styles.mobileMenuButton}
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label="Menuyu ac veya kapat"
              aria-expanded={isMenuOpen}
            >
              <i className="fa-solid fa-bars" />
            </button>

            <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}>
              <a href="#">Temizlik</a>
              <a href="#">Tadilat</a>
              <a href="#">Nakliyat</a>
              <a href="#">Tamir</a>
              <a href="#">Ozel Ders</a>
              <a href="#">Organizasyon</a>
              <a href="#">Diger</a>
            </nav>

            <div className={styles.headerActions}>
              <a href="#" className={styles.primaryButton}>
                Hizmet ver
              </a>
              <a href="#" className={styles.linkButton}>
                Giris
              </a>
              <a href="#" className={styles.linkButton}>
                Yardim
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <h1>Hizmet Pis, Agzima Dus</h1>
            <p>Ihtiyacin olan hizmete kolayca ulas, bekleyen islerini hallet</p>
            <form className={styles.searchBar}>
              {/* Arama formu su an demo amacli, API'ye baglanabilir. */}
              <input type="text" placeholder="Hangi hizmeti ariyorsun?" />
              <button type="submit">Ara</button>
            </form>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Haftanin Trend Hizmetleri</h2>
          <div className={styles.trendGrid}>
            {trendServices.map((service) => (
              <article className={styles.trendCard} key={service.name}>
                <img src={service.image} alt={service.name} />
                <div className={styles.trendBody}>
                  <h3>{service.name}</h3>
                  <p>{service.pros}</p>
                  <p>{service.reviews}</p>
                  <button type="button">Teklif al</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.valuesSection}`}>
        <div className={styles.container}>
          <div className={styles.valueGrid}>
            {valueCards.map((item) => (
              <article key={item.title} className={styles.valueCard}>
                <i className={`fa-solid ${item.icon}`} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Nasil Calisir</h2>
          <div className={styles.stepList}>
            {steps.map((step, index) => (
              <article key={step.title} className={styles.stepCard}>
                <div className={styles.stepBadge}>{index + 1}</div>
                <div className={styles.stepText}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <img src={step.image} alt={step.title} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.providerBanner}>
            <div className={styles.providerVisual}>
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80"
                alt="Hizmet veren ekip"
              />
            </div>
            <div className={styles.providerContent}>
              <h2>Hizmet veren olarak katil</h2>
              <p>
                Musterilere ulas, takvimini doldur ve isini buyutmek icin hemen
                platforma kaydol.
              </p>
              <a href="#" className={styles.primaryButton}>
                Ucretsiz uye ol
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <h4>Site Haritasi</h4>
              <a href="#">Hakkimizda</a>
              <a href="#">Nasil Calisir</a>
              <a href="#">Kariyer</a>
              <a href="#">Iletisim</a>
            </div>
            <div>
              <h4>En Cok Arananlar</h4>
              <a href="#">Ev Temizligi</a>
              <a href="#">Su Tesisatcisi</a>
              <a href="#">Boya Badana</a>
              <a href="#">Nakliyat</a>
            </div>
            <div>
              <h4>Sosyal Medya</h4>
              <div className={styles.socials}>
                <a href="#" aria-label="Instagram">
                  <i className="fa-brands fa-instagram" />
                </a>
                <a href="#" aria-label="Facebook">
                  <i className="fa-brands fa-facebook-f" />
                </a>
                <a href="#" aria-label="LinkedIn">
                  <i className="fa-brands fa-linkedin-in" />
                </a>
                <a href="#" aria-label="X">
                  <i className="fa-brands fa-x-twitter" />
                </a>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <label>
              Ulke:
              <select defaultValue="TR">
                <option value="TR">Turkiye</option>
              </select>
            </label>
            <p>© 2026 Armut Benzeri Marketplace. Tum haklari saklidir.</p>
            <div>
              <a href="#">Gizlilik</a>
              <a href="#">Kullanim Kosullari</a>
              <a href="#">Cerez Politikasi</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
