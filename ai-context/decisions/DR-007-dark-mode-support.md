# DR-007: Dark Mode Desteği — FD-14 Güncelleme

- **Tarih:** 2026-03-12
- **Durum:** Accepted
- **Sahip:** WorkMate maintainers
- **Supersedes:** FD-14 (light-only lock)

## Karar

Dark mode artık desteklenmektedir. `[data-theme="dark"]` mekanizması `layout.tsx`'te toggle edilebilir; `prefers-color-scheme: dark` sistemi de otomatik olarak dark token'larını devreye sokar.

## Gerekçe

`marketplace/tokens.css` satır 167–176'da dark mode token'ları tam olarak uygulanmıştı. Ancak `globals.css` satır 337–362'deki `@media (prefers-color-scheme: dark)` bloğu, geçmişteki bir kontrast regresyonunu önlemek amacıyla light renkleri zorla koruyordu. Tam UI overhaul kapsamında tüm komponentler dark mode'a göre test edileceğinden bu kilide artık gerek kalmamaktadır.

## Yeni Kural (FD-14 yerini alır)

- Light tema default'tur: `<html data-theme="light">` `layout.tsx`'te sabit gelir.
- Dark mode `[data-theme="dark"]` toggle ile ya da `prefers-color-scheme: dark` ile aktif olur.
- Token coverage `tokens.css`'de tamdır — Tailwind `dark:` utility class'ları kullanılmaz, yalnızca `--wm-*` token'ları kullanılır.
- Tüm yeni komponent değişiklikleri dark + light modda görsel QA'dan geçmek zorundadır.

## Etki Analizi

- `globals.css` dark media query bloğu: light override kaldırılır, `[data-theme="dark"]` token'ları devreye girer.
- `layout.tsx`: `<html>` tag'ına `data-theme="light"` eklenir (zaten mevcut olabilir).
- `components/ui/` tüm primitive'leri: dark mode token uyumları doğrulanır.
- Playwright QA: tüm kritik sayfalar light + dark modda screenshot ile doğrulanır.
