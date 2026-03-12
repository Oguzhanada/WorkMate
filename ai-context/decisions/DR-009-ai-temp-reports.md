# DR-009: Geçici AI Analiz Dosyaları — FD-24 Esnetme

- **Tarih:** 2026-03-12
- **Durum:** Accepted
- **Sahip:** WorkMate maintainers
- **Refines:** FD-24

## Karar

AI agents, `ai-reports/` klasörüne geçici analiz dosyaları yazabilir. Bu klasör gitignored'dır, dosyalar asla commit edilmez.

## Gerekçe

FD-24, AI'nın `docs/` ve repo root'a gereksiz rapor dosyaları biriktirmesini önlemek amacıyla yazılmıştı. Ancak kullanıcının yerel review için geçici analiz çıktılarına ihtiyacı var. `ai-reports/` gitignored klasörüyle bu ikisi ayrışır: yerel review mümkün, repo temiz kalır.

## Yeni Kural (FD-24'ü rafine eder)

**Yasak (korunuyor):** `docs/`, repo root, `ai-context/` altına `*REPORT*.md`, `*COMPLETION*.md`, `*GUIDE*.md` türünde dosya oluşturmak.

**İzin verilen (yeni):** `ai-reports/` klasörüne geçici analiz dosyaları yazmak.
- Bu klasör `.gitignore`'da tanımlıdır
- Dosyalar commit edilmez, CI'ya girmez
- Oturum sonunda temizlenebilir

## Uygulama

`.gitignore`'a eklenen satır: `ai-reports/`
