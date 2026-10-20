# Araştırma notu: Elifba öğretim yöntemi

Bu not, uygulamadaki öğretim kararlarının hangi kaynağa dayandığını gösterir.
Her madde iki etiketten birini taşır:

- **[Kaynak: …]** Bilgi doğrudan aşağıdaki kaynaklardan alınmıştır.
- **[Öneri]** Kaynakta açıkça yazmayan, bu proje için verilmiş pedagojik veya teknik karardır.

> Bu uygulama bağımsız bir eğitim aracıdır. Diyanet İşleri Başkanlığı veya başka bir resmî kurumla bağlantısı, onayı ya da ortaklığı yoktur. Resmî kaynaklar yalnızca öğretim sırasını doğrulamak için incelenmiştir.

Erişim tarihi: 17 Ekim 2026.

## 1. İncelenen kaynaklar

| Kod | Kaynak | Not |
|---|---|---|
| K1 | Diyanet İşleri Başkanlığı, *Elifbâ – Kur'an Öğreniyorum*, 4. baskı, Ankara, Nisan 2025, ISBN 978-625-435-655-1. PDF: `https://egitimhizmetleri.diyanet.gov.tr/Documents/ElifBa%20Kuran%20%C3%96%C4%9Freniyorum.pdf` | 32 sayfa. Hazırlık: Eğitim Hizmetleri Genel Müdürlüğü. İnceleme: Mushafları İnceleme ve Kıraat Kurulu. Bağlantı çalışıyor. |
| K2 | Diyanet Kur'an Platformu, *Elif-Ba* modülü: `https://kuran.diyanet.gov.tr/elifba/` | Çevrim içi müfredat: 2 bölüm, 30 ders. Ders açıklamaları platformun kendi veri dosyasından okundu. |
| K3 | Eğitim Hizmetleri GM, "Elifba Kur'an Öğreniyorum Ders Videoları": `https://egitimhizmetleri.diyanet.gov.tr/Detay/1052/` | Sayfa 15.04.2025 tarihli. Sayfa metninde video listesi veya yöntem bilgisi yok. Kitap sayfalarındaki karekodlar videolara yönlendiriyor. |
| K4 | Tanzil Project, *Quran Text (Simple), v1.1*, `https://tanzil.net/download/` | Yalnızca son dersteki kısa sûreler için kullanıldı. Lisans: CC BY 3.0, metin değiştirilemez, kaynak ve bağlantı gösterilmeli. |
| K5 | Ayar, H. (2021). "Ses Esaslı Okuma Yazma Öğretimi Yöntemi ile Kur'an Öğretiminin İmkânı: Ses Temelli Elifbâ Örneği". *Cumhuriyet İlahiyat Dergisi*, 25(2), 561–582. doi:10.18505/cuid.976303 | Yöntem karşılaştırması için ikincil kaynak. |
| K6 | SIL Global, *Scheherazade New* font, sürüm 5.3 (npm: @fontsource/scheherazade-new), SIL Open Font License 1.1 | Arapça metin fontu. Lisans dosyası `src/app/fonts/OFL-ScheherazadeNew.txt`. |

Diyanet materyallerinden metin, görsel veya ses **kopyalanmadı**. Uygulamadaki açıklamalar kendi cümlelerimizle yazıldı. Arapça kelime örnekleri, Kur'an'da geçen yaygın kelimelerden seçildi ve âyet olarak sunulmadı.

## 2. Kitap (K1) ile çevrim içi platform (K2) arasındaki farklar

İki resmî kaynak aynı içeriği farklı sırayla veriyor. Bu fark ders haritasını doğrudan etkiliyor.

**K1 basılı kitap sırası** [Kaynak: K1 s.5]
1. Harfler (s.6–7)
2. Harflerin yazılışları (s.8)
3. Harekeler (s.9–11)
4. Cezm (s.12–13)
5. Şedde (s.14–15)
6. Med harfleri (s.16–17)
7. Âsar, med ve kasr (s.18)
8. Tenvin (s.19–21)
9. Zamir ve lafzatullah (s.22)
10. Elif lâm takısı ve râ harfi (s.23)
11. Genel alıştırmalar (s.24), okuma sayfası (s.25), dualar (s.26–32)

**K2 çevrim içi platform sırası** [Kaynak: K2 müfredat]
- I. Bölüm, temel bilgiler: 1 Harfler (isimleri, sesleri, şekilleri, pekiştirme), 2 Fetha, 3 Fethanın uzatılması, 4 Fethanın tenvini, 5 Kesra, 6 Kesranın uzatılması, 7 Kesranın tenvini, 8 Damme, 9 Dammenin uzatılması, 10 Dammenin tenvini, 11 Cezm, 12 Şedde, 13 Pekiştirme.
- II. Bölüm, tecvid uygulamaları: 14 Zamir, 15 Vakf, 16 Râ, 17 Lafzatullah'ın lâmı, 18–25 ihfâ, izhar, idğamlar, iklâb, kalkale, 26–27 med çeşitleri, 28 hurûf-u mukattaa, 29 tenvinli kelimelerden geçiş, 30 sûre tatbikatı.

**Uygulamadaki karar.** Ana omurga, öğretmenin verdiği ve kitabın izlediği sırayla kuruldu (K1). Platformdan iki şey alındı:
- Harekeler tek tek çalıştırılıyor, sonra karıştırılıyor. Platform da her harekeyi ayrı ders yapıyor. [Kaynak: K2 ders 2, 5, 8]
- Kitapta olmayan "duruş ve geçiş" konusu (vakf ve tenvinli kelimelerden geçiş) 11. üniteye platformdan alındı. [Kaynak: K2 ders 15, 29]

İhfâ, idğam, kalkale gibi tecvid kuralları bu sürümün kapsamı dışında bırakıldı. Bunlar Kur'an okumaya başladıktan sonra öğretmenle çalışılacak konulardır. [Öneri]

Harf sırasında da küçük bir fark var. K1 s.8 tablosu sonu "ن و هـ ى" diye bitiriyor. K2 harf listesi "ن هـ و ى" sırasını kullanıyor. Uygulama kitaptaki sırayı izliyor. [Kaynak: K1 s.6, s.8; K2 Harfler]

## 3. Araştırma sorularının yanıtları

### 3.1 Harfler ve okuma kuralları hangi sırayla öğretilmeli?

- Harfler 28 tanedir. Lâmelif (لا) ayrı bir harf sayılmaz, lâm ile elifin birlikte yazılışıdır. [Kaynak: K1 s.6 not; K2 Harfler notu]
- Sıra: harfler, yazılışlar, harekeler, cezm, şedde, med harfleri, âsar/med/kasr, tenvin, zamir ve lafzatullah, elif-lâm ve râ. [Kaynak: K1 s.5]
- Harfin şekli tam öğrenilmeden sonraki adımlara geçilmemelidir. [Kaynak: K2 Harfler ve Şekilleri]
- 28 harf tek derste sorulmuyor. Dört gruba bölünüyor, sonra benzer harfler ve karma tekrar dersleri geliyor. [Öneri]

### 3.2 Bir konunun öğrenilmesi için hangi küçük kazanımlar gerekli?

Her ders birkaç ölçülebilir kazanıma bölündü. Kazanımların tam listesi `docs/DERS-HARITASI.md` dosyasında. Örnekler:
- **Harf:** Şekli adıyla eşleştirir. Adını söyler. Benzer harften ayırır. Noktanın sayısını ve yerini bilir. [Öneri, K2 "isimleri / şekilleri / pekiştirme" ayrımına dayanarak]
- **Yazılış:** Başta, ortada, sonda ve ayrı yazılışı tanır. Sonraki harfe bağlanmayan altı harfi bilir. [Kaynak: K1 s.8]
- **Hareke:** Harekenin adını ve yerini bilir. Harf ve hareke adını birleştirerek heceyi seçer. Harekeleri karşılaştırır. [Kaynak: K1 s.9; K2 ders 2, 5, 8]
- **Cezm:** Cezmli harfi önceki harekeyle birleştirir ve harekeyi uzatmaz. [Kaynak: K1 s.12; K2 ders 11]
- **Şedde:** Şeddeli harfi iki kez okur: önce cezmli, sonra harekeli. [Kaynak: K1 s.14; K2 ders 12]

### 3.3 Benzer harfler nasıl ayırt ettirilmeli?

- Benzer harfler nokta sayısına ve noktanın yerine bakılarak ayırt edilir. [Kaynak: K2 Harfler > Pekiştirme]
- Uygulama iki tür karışıklığı ayrı ele alıyor. [Öneri]
  - **Şekil ailesi:** ب ت ث ن, ج ح خ, د ذ, ر ز, س ش, ص ض, ط ظ, ع غ, ف ق. Bu şıklar "aynı harfi bul", "noktaya göre seç" ve yazılış sorularında kullanılıyor.
  - **Ad ve ses karışıklığı:** Türkçede aynı sese yakın gelen harfler. Örneğin ح خ ه, ت ط, ث س ص, ذ ز ظ, د ض, ق ك, ع غ. Bu şıklar "adı verilen harfi bul" sorularında kullanılıyor.
- Önce her grup kendi içinde öğretiliyor. Sonra ayrı bir "benzer harfler" dersi bütün aileleri karşılaştırıyor. [Öneri]

### 3.4 Harfin adını bilmekten harekeli okumaya nasıl geçilmeli?

- Hareke, harfin okunmasını sağlayan işarettir. Üstün (fetha), esre (kesra) ve ötre (damme) olarak adlandırılır. [Kaynak: K1 s.9]
- Platform harekeli harfleri önce tek tek, sonra beşli gruplar hâlinde "ritmik usulle" okutuyor. [Kaynak: K2 ders 2, 5, 8]
- Harfin adı ile harekeli sesi farklıdır. Örneğin harfin adı "Be"dir, ama بَ, بِ ve بُ üç farklı hecedir. Uygulama bu farkı korumak için heceleme dilini kullanıyor: "Be üstün", "Be esre" gibi. Doğru hece Arapça yazıdan seçiliyor. [Öneri]
- İlk sürümde Türkçe harflerle yazılmış okunuş şık olarak kullanılmadı. **20 Ekim 2026 öğretmen kararıyla** hareke, cezm ve şedde ünitelerinin takım oyununda şıklar Türkçe okunuş oldu (ör. ⟪فَتَحَ⟫ → “feteha”). Okunuş, geleneksel Türkçe elifba hecelemesine göre yazılır: Be üstün “be”, Ha üstün “ha”, Sad üstün “sa”; kalın harflerde a/ı/u, ح ع ر harflerinde a/i/u, diğerlerinde e/i/ü. Kaynak da hareke seslerini anlatırken "e", "i", "u" gibi Türkçe sesler kullanır. [Kaynak: K2 ders 2, 5, 8; öğretmen kararı]
- Türkçe yazı Arapça sesleri tam karşılamaz: ث ve س ikisi de “s”, ذ ز ظ “z” olur; ayn cezmde ‘ ile yazılır. Okunuşu aynı çıkan çeldiriciler oyunda elenir. Cezmli ve şeddeli hece derslerinde ayn harfi okunuş sorularına alınmaz. Bu sorular “öğretmen incelemesi bekliyor” olarak işaretlidir ve doğru ses öğretmenden dinlenmelidir. Okunuş tablosu `src/content/reading.ts` dosyasındadır. [Öneri]
- Doğru ses ancak öğretmen dinleyerek değerlendirilebilir. Bu yüzden her dersin bir öğretmen değerlendirme bölümü var. [Öneri]

### 3.5 Çocukların sık yaptığı hatalar

Bu maddeler kaynakların uyarılarından ve ders yapısından çıkarıldı. Resmî bir "sık hata listesi" bulunamadı. Arama sonucunda Diyanet'in öğretici kılavuzuna erişilemedi. [Öneri, aşağıdaki kaynak dayanaklarıyla]

| Hata | Dayanak | Uygulamadaki karşılığı |
|---|---|---|
| Benzer harfleri nokta yüzünden karıştırmak | K2 Pekiştirme | Şıklar aynı şekil ailesinden seçiliyor |
| Türkçede aynı sese karşılık gelen harfleri karıştırmak (ح/ه, ت/ط, س/ص/ث) | Öneri | Ad sorularında bu harfler şık oluyor |
| Harfin her konumda iki yandan bağlandığını sanmak | K1 s.8 | ا د ذ ر ز و için "bağlanır" biçimi yanlış şık olarak çıkıyor |
| Soldan sağa okumak | Öneri | Kelimede ilk harf sorusu, heceleme sırası ters şık |
| Esre ile üstünü yer yüzünden karıştırmak | K1 s.9 | Aynı harfin diğer harekesi şık oluyor |
| Cezmli harfe hareke sesi vermek | K1 s.12 uyarısı | Cezm yerine harekeli biçim şık oluyor |
| Şeddeyi atlamak veya tek okumak | K1 s.14 | Şeddesiz biçim ve yanlış bölme şık oluyor |
| Kısa harekeyi uzatmak, med harfini uzatmamak | K2 ders 3, 6, 9 | Uzatmalı ve uzatmasız biçim karşılaştırılıyor |
| İki üstündeki elifi uzatmak (بًا yerine بَا) | K1 s.19 | Tenvin sorularında med biçimi şık oluyor |
| Şemsî harflerde lâmı okumak | K1 s.23 | Lâm okunur / okunmaz yargısı |
| Lafzatullah'ı her yerde aynı okumak | K1 s.22 | Önceki harekeye göre kalın/ince yargısı |

### 3.6 Hangi kazanımlar oyunla, hangileri öğretmen dinleyerek ölçülmeli?

| Ölçme yolu | Kazanımlar |
|---|---|
| **Oyunla** (görsel tanıma, seçme) | Harf şeklini ve adını eşleştirme, benzer harfi ayırma, nokta sayısı ve yeri, yazılış biçimleri, harekeyi tanıma, heceleme ile doğru heceyi seçme, cezm ve şeddeli yapıyı seçme, uzatma olan örneği ayırt etme, tenvini tanıma, zamir, lafzatullah, elif-lâm ve râ kurallarını yazıdan yargılama |
| **Öğretmen dinleyerek** | Harflerin doğru sesi ve mahreci, harekeli hecenin sesi, cezmde harekeyi uzatmama, şeddede sesi bölmeden ikileme, uzatma miktarı (bir elif, dört elif), tenvinde "n" sesi, kalın ve ince okuma, duruş, akıcı birleşik okuma, kısa sûreleri yüzüne okuma |

Oyun puanı bir takımın ortak sonucudur. Tek tek öğrencilerin seviyesi takım puanından çıkarılmaz. Öğrenci düzeyini yalnızca öğretmen, dinleyerek işaretler. [Öneri; öğretmenin isteği]

## 4. Yazım ve görüntü kararları

| Konu | Kaynakta | Uygulamada | Etiket |
|---|---|---|---|
| Harf sayısı | 28 harf, lâmelif harf değil | Aynı | Kaynak: K1 s.6 |
| Yâ harfi | Ayrı ve sonda noktasız ى, başta ve ortada noktalı يـ | Aynı: ى (U+0649) ayrı/son, ي (U+064A) baş/orta | Kaynak: K1 s.6, s.8 |
| Hâ (He) harfi | Harf tablosunda هـ biçimi | Harf tanıma sorularında هـ, yazılış dersinde ayrı biçim ه | Kaynak: K1 s.6 |
| Elifin ortada yazılışı | Tabloda ـئـ (hemze kürsüsü) gösterilmiş | Elifin harf olarak ortadaki biçimi ـا gösteriliyor. Hemze yazımları sorulmuyor | Öneri |
| Kesranın uzatılması | Dikey kesra + noktasız yâ (ب۪ى) | Dikey kesra U+0656 ile yazılıyor (بٖى). Kaynaktaki U+06EA, açık lisanslı fontlarda dikey çizgi değil halka olarak çiziliyor | Öneri (font testi) |
| Âsar (dikey üstün) | ٰ (U+0670) | Aynı | Kaynak: K1 s.18 |
| Dört elif uzatma işareti | ٓ (U+0653) | Aynı | Kaynak: K1 s.18; K2 medd-i muttasıl |
| Med ve kasr işaretleri | Mushafa özgü fontta harf altına küçük "مد" ve "قصر" yazısı | Açık lisanslı fontlarda doğru çizilemediği için yalnızca anlatılıyor, oyunda sorulmuyor. Öğretmen kitapta s.18 örneklerini kullanmalı | Öneri |
| Harekeli elif | اَ اِ اُ biçiminde | Aynı | Kaynak: K1 s.9 |
| Satır yüksekliği | — | Arapça metinlerde 2,1. İçerikteki en yüksek metin (şedde + dikey üstün, dikey esre) font boyutunun 2,0 katı ölçüldü. Harf aralığı verilmez, taşma kesilmez | Öneri (ölçüm: `/kontrol`) |

Font seçimi için üç açık lisanslı font (Amiri, Scheherazade New, Noto Naskh Arabic) tarayıcıda aynı örneklerle karşılaştırıldı. Scheherazade New, dikey kesra, âsar, şedde ile hareke ve lafzatullah örneklerini en net gösteren font olarak seçildi. [Öneri]

## 5. Ses

- Platformda ses dosyaları bulunuyor, ancak kullanım lisansı belirtilmemiş. Bu yüzden kullanılmadı. [Kaynak: K2 incelemesi]
- Tarayıcının yapay sesi (TTS) Arapça öğretim için doğru örnek kabul edilmedi ve kullanılmıyor. [Öğretmenin isteği]
- Uygulamada hiçbir ses dosyası yok. Öğretmen kendi kaydını yükleyip dinleyerek onaylayabiliyor. Onaylanmamış kayıt hiçbir soruda çalmıyor.

## 6. Kur'an metni

- Son ünitedeki kısa sûreler (Fâtiha, Kevser, İhlâs, Felak, Nâs) Tanzil'in "Simple" metninden değiştirilmeden alındı. Sûre ve âyet numarası saklanıyor. [Kaynak: K4]
- Tanzil metni Medine imlâsına yakındır. Türkiye'de basılan mushaflarla hemze yazımı ve bazı işaretlerde fark vardır. Örneğin Türk mushaflarında dikey kesra ve hemzesiz elif kullanılır. Öğretmenin yüzüne okumayı öğrencinin kendi mushafından yaptırması önerilir. [Öneri]
- Alıştırma kelimeleri âyet olarak sunulmuyor ve sûre/âyet bilgisi verilmiyor.
