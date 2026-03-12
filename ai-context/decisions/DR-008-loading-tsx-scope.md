# DR-008: loading.tsx Kapsamı Netleştirme — FD-02 Güncelleme

- **Tarih:** 2026-03-12
- **Durum:** Accepted
- **Sahip:** WorkMate maintainers
- **Refines:** FD-02

## Karar

`loading.tsx` yalnızca async Supabase/DB çağrısı içeren sayfalarda zorunludur. Tamamen statik sayfalar (yalnızca `getTranslations()` çağıran) muaftır.

## Gerekçe

FD-02 "her data-fetching sayfada" diyordu, ancak `terms`, `pricing`, `how-it-works`, `about` gibi tamamen statik sayfalar gereksiz yere `loading.tsx` barındırıyordu. Bu sayfalar Supabase çağrısı yapmadığından loading state'i gerçekte asla gösterilmez — sadece dosya şişkinliği yaratır.

## Yeni Kural (FD-02'yi rafine eder)

**Zorunlu:** `loading.tsx` — async Supabase/DB sorgusu yapan tüm sayfalar için.

**Muaf:** Yalnızca `getTranslations()` (next-intl) çağıran, Supabase bağlantısı olmayan statik sayfalar.
Mevcut muaf sayfalar: `terms`, `pricing`, `how-it-works`, `about`.

**Karar kriteri:** Sayfa `createServerClient()` veya `createClient()` (Supabase) çağırıyor mu?
- Evet → `loading.tsx` zorunlu
- Hayır → isteğe bağlı

## Uygulama

Silinen `loading.tsx` dosyaları:
- `app/[locale]/terms/loading.tsx`
- `app/[locale]/pricing/loading.tsx`
- `app/[locale]/how-it-works/loading.tsx`
- `app/[locale]/about/loading.tsx`
