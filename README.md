# Elifba Tahtası

Akıllı tahtada iki takımın aynı anda oynadığı, çocuklara aşama aşama Elifba öğreten sınıf uygulaması.

> Bu uygulama bağımsız bir eğitim aracıdır. Diyanet İşleri Başkanlığı veya başka bir resmî kurumla bağlantısı, onayı ya da ortaklığı yoktur. Öğretim sırası, Diyanet'in yayımladığı Elifbâ materyalleri incelenerek kurulmuştur. Kaynaklar ve kararlar: [docs/ARASTIRMA.md](docs/ARASTIRMA.md).

## Ne yapar?

- **12 ünite, 30 ders.** Harflerden başlar; yazılışlar, üstün/esre/ötre, cezm, şedde, med, âsar, tenvin, zamir, lafzatullah, elif-lâm, râ, duruş ve geçişle devam eder. Son ünite genel tekrar ve öğretmenle yüzüne okumadır. Ayrıntı: [docs/DERS-HARITASI.md](docs/DERS-HARITASI.md).
- **Her ders** somut bir hedef, kısa anlatım, büyük gösterilebilen rehberli örnekler, puansız alıştırma, 30 soruluk takım oyunu, yanlışlara yönelik tekrar ve öğretmen değerlendirmesi içerir. Harfler ünitesinde tek takım oyunu vardır: “Harfler oyunu: 28 harf”. Bu oyunda önce 28 harfin hepsi birer kez sorulur; ünitenin diğer dersleri oyun için bu derse yönlendirir.
- **Soru biçimi:** Oyunda ekranda Arapça harf, hece veya kelime görünür; şıklar Türkçedir. Hareke, cezm ve şedde ünitelerinde şıklar Türkçe okunuştur (ör. فَتَحَ → “feteha”); okunuş geleneksel elifba hecelemesine göre yaklaşık yazılır. Örneğin ا gösterilir, şıklar “Elif, Cim, Ha, Dal” olur. Sıra tur turdur: önce dersteki bütün harfler birer kez karışık sorulur, harfler bitince tekrar turu başlar. Tekrarlarda şıklar farklıdır; bir harf en fazla 5 kez sorulur ve arka arkaya gelmez. Harfi bul, benzer harfi bul gibi diğer etkinlikler ders sayfasındaki puansız alıştırmadadır.
- **Takım oyunu:** Ekran dikey çizgiyle ikiye ayrılır. Sol takım ve sağ takım aynı 30 soruyu kendi sıralarıyla, birbirinden bağımsız çözer. Öğrenciler sırayla tahtaya gelir. Hesap gerekmez.
- **Halat çekme:** İkinci oyun türü. Üstte halat çekme animasyonu vardır; ekran yine iki takıma bölünür. Doğru cevap veren takım halatı bir adım kendi tarafına çeker. Sorular sınırsızdır ve kendiliğinden geçer; önce dersin bütün harfleri/heceleri karışık gelir, bitince yeniden karışır. Yanlış cevapta o takım 5 saniye bekler ve doğru cevap gösterilir. Ortada bir çukur vardır; rakibini çukura ilk düşüren takım kazanır (varsayılan 7 çekiş, öğretmen panelinden değişir). Kaybeden takımın çocukları çukura düşer, kazananlar zıplar. Her derste oynanabilir: ders sayfasından, ana sayfadan ya da öğretmen panelinden başlatılır. Harfler 1–5 derslerinde yalnızca o dersin harfleri sorulur.
- **Kale yıkma:** Üçüncü oyun türü. Üstte iki takımın kalesi ve mancınığı vardır. Doğru cevap veren takımın mancınığı rakip kaleye bir taş atar; kale her taşta biraz daha parçalanır (mazgallar düşer, duvarda delikler ve çatlaklar açılır) ve takım etiketindeki dayanıklılık çubuğu azalır. Rakip kaleye 15 taş ilk isabet ettiren takım kazanır, rakip kale yıkılıp moloz yığınına döner (sayı öğretmen panelinden 5–30 arasında değişir). Sorular, 5 saniyelik yanlış cevap beklemesi ve başlatma yerleri halat çekmeyle aynıdır.
- **Kutlama:** Yarışma, halat çekme ve kale yıkma sonunda konfeti ve kupa animasyonu gösterilir (hareket azaltma tercihinde konfeti gösterilmez).
- **Puanlama:** Doğru 10, yanlış 0. Her soruda ilk dokunuş geçerlidir. Yanlıştan sonra doğru cevap ve kısa açıklama gösterilir. Kazanan önce doğru sayısına, eşitlikte toplam süreye göre belirlenir. Duraklama, yükleme ve geri bildirim süreleri sayılmaz.
- **Öğretmen paneli:** Ders seçme, takım adları, başarı eşiği (varsayılan %80, ürün ayarı), sonuçlar ve yanlış yapılan kazanımlar, yanlışlarla tekrar, soru bankasını doğru cevaplarıyla inceleme, ses kayıtları, öğrenci değerlendirmesi ve “Kur'an okumaya hazır” onayı, JSON dışa aktarma ve sıfırlama.
- **Ses:** Uygulama hiçbir ses dosyasıyla gelmez ve tarayıcının yapay sesini kullanmaz. Öğretmen kendi kaydını yükleyip dinleyerek onaylayabilir. Onaylı kayıtlar yalnızca ders sayfasındaki “Dinle ve seç” alıştırmasında, tek ses kanalıyla çalar.
- **Cihaz testi:** `/kontrol` sayfasında çoklu dokunma testi ve Arapça metin ölçümü vardır.

## Çalıştırma

Gereksinim: Node.js 22.6 veya üstü (testler Node'un yerleşik TypeScript desteğini kullanır).

```bash
npm install
```

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

Üretim derlemesi ve yerel sunum:

```bash
npm run build
```

```bash
npm start
```

## Testler

```bash
npm test
```

42 test: içerik doğrulama (oyunda Arapça uyaran ve Türkçe şıklar, harflerin dengeli tekrarı dahil) (her dersin 30 geçerli sorusu, tek doğru cevap, aynı görünen şık olmaması, yasak karakter, öğretilmemiş kural denetimi, ders içi tekrar, Tanzil metni bütünlüğü) ve oyun motoru (aynı küme farklı sıra, bağımsız ilerleme, eşzamanlı cevap, çift dokunma, duraklatma ve süre, sonuç kuralı, puansız tekrar, kaydet/yükle). Sonuçlar: [docs/TEST-SONUCLARI.md](docs/TEST-SONUCLARI.md).

Diğer denetimler:

```bash
npx eslint src tests scripts
```

```bash
npm run content:stats
```

```bash
npm run content:docs
```

`content:docs`, ders haritasını ve içerik inceleme raporunu ders verisinden yeniden üretir.

## Yayınlama

Vercel adımları: [docs/YAYINLAMA.md](docs/YAYINLAMA.md).

## Klasör yapısı

| Yol | İçerik |
|---|---|
| `src/content/` | Öğretim içeriği (arayüzden bağımsız): harfler, kelimeler, dersler, soru üreticileri, Tanzil alıntısı |
| `src/lib/game.ts` | İki takımlı oyun durum makinesi (saf fonksiyonlar, test edilir) |
| `src/lib/tug.ts` | Halat çekme ve kale yıkma oyunlarının ortak durum makinesi (sınırsız soru, 5 sn bekleme, kazanma) |
| `src/components/tug/SiegeStage.tsx` | Kale yıkma sahnesi: kaleler, mancınıklar, taş atışı, hasar ve yıkılma |
| `src/lib/storage.ts` | localStorage kalıcı depo (ayarlar, sonuçlar, değerlendirmeler, aktif oyun) |
| `src/lib/audioStore.ts` | Öğretmen ses kayıtları (IndexedDB) ve tek ses kanalı |
| `src/components/` | Arayüz: oyun ekranı, ders sayfası, öğretmen paneli, cihaz testi |
| `src/app/fonts/` | Scheherazade New fontu ve SIL OFL lisansı |
| `tests/` | Node test çalıştırıcısıyla içerik ve oyun testleri |
| `docs/` | Araştırma notu, ders haritası, içerik inceleme durumu, test sonuçları, yayınlama |

## İçeriği düzenleme

- Dersler: `src/content/lessons.ts`. Her dersin `allowedFeatures` listesi, o derse kadar öğretilmiş yazım özelliklerini belirtir. Testler, bir soruda öğretilmemiş bir özellik (ör. şedde dersinden önce şedde) görürse başarısız olur.
- Kelimeler: `src/content/words.ts`. Kelimeler `NFC` biçimine getirilir. Dikey esre için U+0656 kullanılır.
- Soru üreticileri: `src/content/generators.ts`. Sorular deterministik üretilir; aynı veri her zaman aynı soruları verir. Çalışma anında yapay zekâ veya ağ bağlantısı kullanılmaz.
- Her soruda şu alanlar bulunur: `id`, `lessonId`, `objectiveId`, `type`, `prompt`, `stimulus`, `options`, `correctOptionId`, `explanation`, `difficulty`, `source`, `audioId` (varsa), `reviewStatus`.
- Değişiklikten sonra `npm test` ve `npm run content:docs` çalıştırın.

## Bilinen sınırlar

- İçerik inceleme durumu: [docs/ICERIK-INCELEME.md](docs/ICERIK-INCELEME.md). Elle yazılmış kelime ve kural sorularının tamamı “öğretmen/uzman incelemesi bekliyor” olarak işaretlidir.
- Fiziksel bir akıllı tahtada çoklu dokunma test edilmedi. Tarayıcıda sentetik işaretçi olaylarıyla test edildi. Kullanmadan önce `/kontrol` sayfasındaki 1 dakikalık cihaz testini yapın.
- Veriler yalnızca kullanılan tarayıcıda saklanır. Farklı cihazlar arasında paylaşılmaz.

## Lisanslar

- Scheherazade New fontu: SIL Open Font License 1.1 (`src/app/fonts/OFL-ScheherazadeNew.txt`).
- Kur'an metni (yalnızca son ünite): Tanzil Project, Quran Text (Simple) v1.1, CC BY 3.0, değiştirilmeden; telif bildirimi `src/content/quran.ts` içinde korunur. https://tanzil.net
