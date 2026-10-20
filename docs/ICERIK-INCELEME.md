# İçerik inceleme durumu

Bu dosya `npm run content:docs` ile üretilir. Elle düzenlemeyin.

Durum anlamları:

- **Kural tabanlı, otomatik denetlendi:** Harf tablosundan ve kitaptaki hece tablolarından kural ile üretildi. Otomatik testlerden geçti, ama bir insan uzman tarafından tek tek incelenmedi.
- **Öğretmen/uzman incelemesi bekliyor:** Elle yazılmış Arapça kelime veya kural yargısı içerir (zamir, lafzatullah, râ, elif-lâm, vakf, geçiş). Kullanmadan önce öğretmen panelindeki “Soru bankası” bölümünden incelenmelidir.
- **Doğrulanmış kaynak:** Tanzil metninden değiştirilmeden alındı.

| Ders | Oyun sorusu | Otomatik denetlendi | İnceleme bekliyor | Havuzdaki toplam soru |
|---|---|---|---|---|
| Harfler oyunu: 28 harf | 30 | 30 | 0 | 56 |
| Başta yazılış | 30 | 30 | 0 | 42 |
| Ortada yazılış | 30 | 30 | 0 | 56 |
| Sonda yazılış | 30 | 30 | 0 | 56 |
| Bağlanmayan harfler ve kelimede harf | 30 | 14 | 16 | 90 |
| Yazılışlar karma tekrar | 30 | 30 | 0 | 40 |
| Üstün (fetha) | 30 | 0 | 30 | 56 |
| Esre (kesra) | 30 | 0 | 30 | 56 |
| Ötre (damme) | 30 | 0 | 30 | 56 |
| Harekeleri karşılaştırma | 30 | 0 | 30 | 56 |
| Harekeli kelimeler | 30 | 0 | 30 | 80 |
| Cezmli heceler | 30 | 0 | 30 | 48 |
| Cezmli kelimeler | 30 | 0 | 30 | 68 |
| Şeddeli heceler | 30 | 0 | 30 | 48 |
| Şeddeli kelimeler | 30 | 0 | 30 | 60 |
| Med harfleriyle uzatma | 30 | 30 | 0 | 75 |
| Uzatmalı kelimeler | 30 | 0 | 30 | 84 |
| Dikey üstün (âsar) ve uzatma işaretleri | 30 | 2 | 28 | 58 |
| Tenvini tanıma | 30 | 30 | 0 | 75 |
| Tenvinli kelimeler | 30 | 1 | 29 | 32 |
| Zamir | 30 | 0 | 30 | 32 |
| Lafzatullah | 30 | 0 | 30 | 30 |
| Elif lâm takısı | 30 | 0 | 30 | 30 |
| Râ harfi | 30 | 0 | 30 | 30 |
| Duruş (vakf) ve tenvinli geçiş | 30 | 0 | 30 | 42 |
| Genel tekrar ve yüzüne okuma | 30 | 7 | 23 | (önceki derslerden seçilir) |
| **Toplam (oyun başına sayım; 12. ünite önceki soruları tekrar kullanır)** | 780 | 234 | 546 | |

## Bilinen içerik sınırları

- Hiçbir ses kaydı yoktur. Katalogdaki 112 kayıt (harf adları ve harekeli heceler) “Ses kaydı gerekli” durumundadır. Dinleme soruları yalnızca öğretmen kayıt yükleyip onaylayınca, ders sayfasındaki alıştırmada açılır.
- Mushafa özgü “med” ve “kasr” yazı işaretleri (K1 s.18) açık lisanslı fontlarda gösterilemediği için oyunda sorulmaz; öğretmen kitaptan çalıştırmalıdır.
- Dikey esre, kaynaktaki U+06EA yerine U+0656 (alt simge elif) ile yazılmıştır; görsel olarak dikey çizgidir. Öğrencinin mushafındaki biçimle öğretmen karşılaştırmalıdır.
- Râ dersinde yalnızca harekeli râ sorulur. Cezmli râ ve durma sırasındaki râ öğretmenle çalışılır.
- Vakf dersinde iki üstünle biten kelimeler ve yuvarlak te (ة) sorulmaz.
- Tenvinli geçiş örnekleri kural örneğidir; âyet olarak sunulmaz.
- Kısa sûreler Tanzil (Medine imlâsına yakın) metnidir; Türk mushaflarıyla yazım farkları vardır.

## Kaynak kodları

- **K1:** Diyanet İşleri Başkanlığı, Elifbâ – Kur'an Öğreniyorum, 4. baskı, Nisan 2025
- **K2:** Diyanet Kur'an Platformu, Elif-Ba modülü (kuran.diyanet.gov.tr/elifba)
- **K4:** Tanzil Project, Quran Text (Simple) v1.1, tanzil.net
- **app:** Uygulama kuralı (kaynaktaki kurala dayanarak üretildi)
