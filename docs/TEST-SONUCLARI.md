# Test sonuçları

Tarih: 18 Ekim 2026. Ortam: Windows 11, Node.js 22.12, Next.js 16.4.2, React 19.3, Chromium tabanlı tarayıcı paneli.

## Özet

| Denetim | Sonuç |
|---|---|
| Otomatik testler (`npm test`) | 58/58 geçti |
| Tür denetimi (`tsc --noEmit`) | Hata yok |
| Lint (`eslint src tests scripts`) | Hata ve uyarı yok |
| Üretim derlemesi (`npm run build`) | Başarılı, 39 sayfa statik üretildi |
| Üretim sunucusu (`next start`) | Ana sayfa, 3 ders sayfası, oyun, öğretmen paneli, kontrol sayfası 200 döndü. Bilinmeyen ders adresi Türkçe “Sayfa bulunamadı” ekranını gösterdi |
| Fiziksel akıllı tahtada çoklu dokunma | **Test edilmedi** (aşağıya bakın) |

## İstenen doğrulamalar

| İstenen | Nasıl doğrulandı | Sonuç |
|---|---|---|
| Her dersin 30 geçerli sorusu var | İçerik testi: 30 dersin her birinde 30 benzersiz soru kimliği; zorunlu alanlar dolu | Geçti |
| Her sorunun tek doğru cevabı var | İçerik testi: doğru şık kimliği şıklar içinde tam bir kez; aynı görünen (NFC eşit) şık yok | Geçti |
| İki takım aynı soru kümesini farklı sırada alıyor | Oyun testi + tarayıcı: iki sıra aynı 30 kimliği içeriyor, sıralar farklı; şık sırası değişse de doğru eşleme korunuyor | Geçti |
| Bir taraftaki cevap diğer tarafı etkilemiyor | Oyun testi: sol cevap sonrası sağ takımın durum nesnesi değişmiyor. Tarayıcı: iki tarafa aynı anda farklı işaretçi kimlikleriyle dokunuldu, ikisi de 1 doğru aldı | Geçti |
| Aynı soruda art arda dokunuş ek puan üretmiyor | Oyun testi + tarayıcı: yanlış şıkka iki kez, doğru şıkka iki kez dokunuldu; yalnızca ilk cevap kaydedildi, puan değişmedi | Geçti |
| Biten taraf diğer tarafı durdurmuyor | Oyun testi: sol 30 soruyu bitirdikten sonra sağ takım ilerlemeye devam etti; kazanan ancak iki taraf bitince belirlendi | Geçti |
| Duraklatma ve süre hesabı doğru | Oyun testi: 60 sn duraklama iki takıma da eklenmedi; yükleme ve geri bildirim süreleri sayılmadı; devamdan sonra dokunma koruması yeniden uygulandı. Tarayıcı: sekme gizlenince oyun kendiliğinden duraklatıldı | Geçti |
| Sonuç hesabı doğru | Oyun testi: 29 doğru ile 30 doğru → 30 kazanır; eşit doğruda kısa süre kazanır; tam eşitlik berabere. Tarayıcı: tam oyunda 29/30 ile 27/30 → “doğru sayısıyla” kazanan; iki 30/30 oyunda “süreyle” kazanan | Geçti |
| Arapça metinler ve harekeler kesilmiyor | `/kontrol`: içerikteki bütün Arapça metinler gerçek fontla ölçüldü. En yüksek mürekkep, font boyutunun 2,00 katı; satır yüksekliği 2,1; aşan metin 0. Arapça alanlarda `overflow: hidden` ve harf aralığı yok | Geçti |
| Eksik ses dosyaları uygulamayı bozmuyor | Tarayıcı: kayıt yokken ders sayfası “Ses kaydı gerekli” gösterdi, dinleme soruları kapalı kaldı. Test için sessiz bir kayıt onaylı olarak eklenince alıştırma açıldı; kayıt sonra silindi | Geçti |
| Sayfa yenilendiğinde kayıtlı ayarlar korunuyor | Tarayıcı: takım adı, eşik (%90) ve hareket azaltma değiştirilip sayfa yenilendi; değerler korundu. Oyun sırasında yenilemede oyun aynı sorularla, duraklatılmış olarak döndü | Geçti |
| Production build başarılı | `npm run build` | Geçti |

## Soru biçimi değişikliği (20 Ekim 2026)

Öğretmen kararıyla takım oyunu “ekranda Arapça, şıklar Türkçe” biçimine geçirildi. Az harfli derslerde harflerin tekrarına izin verildi. Eklenen denetimler:

- Her oyun sorusunda Arapça uyaran var ve şıkların hepsi Türkçe: geçti.
- Bir derste aynı harf aynı şık kümesiyle tekrar etmiyor, en fazla 5 kez soruluyor ve harfler arasındaki fark en fazla 1: geçti. İlk derste 7 harfin her biri 4 veya 5 kez soruluyor.
- Aynı harf iki takımın sırasında arka arkaya gelmiyor (8 farklı karıştırmada): geçti.
- Tur sırası: ilk 7 soru 7 harfin hepsini içeriyor; her 7'lik turda her harf tam bir kez geçiyor; ilk turun sırası karıştırmadan karıştırmaya değişiyor: geçti. 200 oyunda 2.–4. turların ilk harfi 7 harfe dengeli dağıldı (her harf 67–95 kez). Tarayıcıda yeni oyunda iki takımın ilk 7 sorusu 7 farklı harf olarak doğrulandı.
- Tarayıcıda “Harfler 1” oyunu açıldı. Bir tarafta ا için “Ha, Hı, Elif, Cim”, diğer tarafta ح için “Se, Ha, Be, Te” şıkları çıktı.

Not: Ekran yerleşimi ölçümleri bu değişiklikten önce yapıldı. Türkçe şıklar en uzun hâliyle (ör. “Be üstün, Elif ile uzatılır”) daha önce ölçülen heceleme şıklarıyla aynı boyut sınıfındadır, ama bu yeni metinlerle ayrıca ölçülmedi.

## Harfler ünitesinde tek oyun (20 Ekim 2026)

Öğretmen kararıyla harfler ünitesindeki altı oyun tek oyunda birleştirildi: “Harfler oyunu: 28 harf”.

- Ünitede yalnızca bir oyun var ve bu oyun 28 harfin hepsini içeriyor: geçti.
- 1–5. dersler var olan bu oyuna yönlendiriyor: geçti.
- Her takımda ilk 28 soru 28 farklı harf; son 2 soru tekrar: test ve tarayıcıda doğrulandı.

## Penaltı oyunu (29 Ekim 2026)

- İki tarafa aynı soru geliyor, şık sıraları taraf başına ayrı: geçti.
- İlk cevap doğruysa penaltıyı o kullanıyor, yanlışsa penaltı rakibe geçiyor; geç kalan ikinci cevap yok sayılıyor: geçti.
- Kaleci topla aynı tarafa atlarsa kurtarıyor, farklı tarafa atlarsa gol; auta giden top gol değil; gol top kaleye varınca sayılıyor: geçti.
- Önce 5 gol atan kazanıyor, sonra soru gelmiyor: geçti.
- Kimse cevap vermezse süre dolunca soru geçiyor; yanlış cevap veren sonraki soruda 1 saniye geç başlıyor (yalnızca o taraf): geçti.
- Kaydırma: yön köşeyi, uzunluk yüksekliği belirliyor; çok yana ya da çok sert vuruş dışarı, geriye kaydırma kısa kalıyor, çok kısa kaydırma vuruş sayılmıyor: geçti.
- Kaleci üç yöne de atlıyor; duraklatma süreleri uzatıyor; duraklatılmışken soru görünürse süre fazladan uzamıyor; kaydet/yüklede havadaki top sonuçlandırılıyor: geçti.
- Tarayıcıda (1366×768): ana sayfadaki “⚽ Penaltı” düğmesi /penalti oyununu açtı; sahnede kale, file, kaleci ve top çizildi; iki tarafta aynı soru farklı şık sırasıyla göründü; ekran kaydırmasız sığdı (en alt 704 px). Sağ taraf yanlış cevap verince penaltı sola geçti (“Hilal Takımı yanlış cevap verdi, penaltı senin!”), sağda doğru cevap ve açıklama göründü. Sol vuruş alanında sola-yukarı uzun kaydırmada kalede sol üst köşe işaretlendi; bırakınca top oraya uçtu, kaleci ortada kaldı, “⚽ GOL!” ve 1/5 göründü. 3 saniye dolunca vuruş kendiliğinden yapıldı. Sayfa yenilenince oyun duraklatılmış olarak geri geldi. Düello seçim ekranında “⚽ Penaltı” seçilebildi ve ders listesi açıldı.
- Tarayıcıda bulunup düzeltilen iki hata: duraklatılmışken görünen soruda sayaç 11'den başlıyordu; “1 saniye bekle” uyarısı yanlış cevap vermeyen tarafta da görünüyordu.

## Nişan süresi 3 saniye (29 Ekim 2026)

- Öğretmen isteğiyle nişan süresi 8 saniyeden 3 saniyeye indirildi (`aimMs: 3000`); süre dolunca zayıf atış kendiliğinden yapılır. Nişan süresi, duraklatma ve kaydet/yükle testleri yeni süreyle geçti.

## Kale yıkmada zayıf nokta (29 Ekim 2026)

- Durum makinesi: zayıf noktaya tam isabet 3, normal isabet 1 hasar; ıskada “tam isabet” işareti yok sayılıyor; kazananı toplam hasar belirliyor (hedef 7 iken 3+1+3 ile kazanıldı); isabet ve tam isabet sayıları ayrı tutuluyor: geçti.
- Fizik: zayıf noktaya değen atış tam isabet sayılıyor; tarama ızgarasında tam isabetler isabetlerin %20'sinden az (zor ama mümkün): geçti.
- Kalibrasyon (tipik ekran, 5183 atış): isabetlerin %10,6'sı tam isabet; 45°'de tam isabet için güç aralığı yalnızca %87–90.
- Tarayıcıda (1366×768): iki kalede de arka kulenin tepesinde parlayan hedef göründü. Sayfadaki ölçülerden hesaplanan çekişle atılan taş zayıf noktaya isabet etti: “💥 Tam isabet! Zayıf nokta: 3 hasar”, sahnede “💥 +3”, güçlü sarsıntı, sayaç 3/15, rakip kalenin dayanıklılığı %80.

## Kale yıkmada çek-bırak nişan (29 Ekim 2026)

- Durum makinesi: doğru cevaptan sonra nişan aşaması geliyor; yalnızca isabet eden taş sayılıyor; iki taraf 14'er isabetteyken kimse kazanmıyor, 15. isabette kazanılıyor; ıskalanan atışın doğru cevabı puan için sayılıyor: geçti.
- Nişan süresi duraklatmada uzuyor; duraklatılmışken atış yapılmıyor, havadaki taş yine iniyor; kaydet/yüklede havadaki taş kaydedilmiyor, öğrenci yeniden nişan alıyor: geçti.
- Fizik: sola-aşağı çekiş sağa-yukarı atıyor, sağ taraf aynalanıyor; ileri çekiş geri atmıyor; %80 güç 45° isabet ediyor, süre dolunca yapılan zayıf atış kısa düşüyor, tam güç 45° kalenin üstünden aşıyor; kısa nişan çizgisi yalnızca uçuşun başını, kolay nişan tamamını gösteriyor: geçti.
- Kalibrasyon (tipik ekran): 45°'de %73–90, 30°'de %75–100 güç isabet ediyor; uçuş 0,8–2 saniye.
- Tarayıcıda (1366×768): doğru cevaptan sonra nişan alanı ve 8 saniyelik sayaç açıldı; çekerken mancınığın kolu gerildi, güç çubuğu %82 gösterdi ve sahnede 14 noktalı nişan çizgisi çizildi. Bırakınca taş yay çizerek uçtu, rakip kaleye isabet etti (“🎯 İsabet! Kale sarsıldı”, 1/15, dayanıklılık %93). Sağ taraftan atışta nişan çizgisi sola uzandı ve sol kaleye isabet etti. Zayıf çekişte taş kısa düştü, toz kalktı (“Iska!”), isabet sayısı değişmedi. Süre dolunca zayıf atış kendiliğinden yapıldı. Ekran kaydırmasız sığdı (en alt 757 px). Öğretmen panelindeki “kolay nişan” ayarı kaydedildi.
- Denenmedi: gerçek akıllı tahtada parmakla, iki öğrencinin aynı anda nişan alması (sentetik dokunma olaylarıyla denendi).

## Bireysel düello ve genel tablo (28 Ekim 2026)

- Maç kaydı: her doğru 10 puan; kazanan, kaybeden ve beraberlik doğru işaretleniyor: geçti.
- Genel tablo: puanlar toplanıyor, Harfler oyunu ve Kale yıkma puanları ayrılıyor, sıralama puan sonra galibiyet; puanı ve galibiyeti eşit olanlar aynı sırayı paylaşıyor; silinen öğrenci tabloda görünmüyor: geçti.
- Öğrenciler Türkçe alfabeye göre (Can, Çağla, Zeynep) sıralanıyor: geçti.
- Oyun durumları düellodaki iki öğrenciyi taşıyor, takım oyununda taşımıyor: geçti.
- Tarayıcıda (1366×768): öğretmen panelinden 6-A sınıfı ve toplu listeyle 8 öğrenci eklendi; 6 öğrenciye dosya seçme yoluyla deneme resmi (tarayıcıda çizilmiş renkli yüz, gerçek kişi değil) yüklendi. Resimler 320×320 JPEG'e küçültüldü (5–6 KB), fotoğrafsız öğrencilerde baş harfler göründü.
- Seçim ekranı: kartlar ve fotoğraflar göründü; 1. ve 2. oyuncu seçilince büyük portrelere geçti, seçili karta yeniden dokununca seçim kalktı; “BAŞLA” ile VS ekranı açıldı ve ardından oyun başladı.
- Harfler düellosu 30 soru sonuna kadar oynatıldı: panellerde öğrenci adları ve fotoğrafları, başlıkta “Bireysel düello · 30 soru” göründü; sonuç ekranında kazanan, konfeti ve “+300 / +280 puan genel tabloya eklendi” göründü; kayıt bir kez yazıldı.
- Kale yıkma düellosu (hedef geçici olarak 5): kazanan ekranı ve “+50 / +30 puan” göründü, kayıt yazıldı.
- Genel tablo iki maçı doğru topladı (300, 280, 50, 30; 0 puanlılar aynı sırada).
- Denemeden sonra tarayıcıdaki deneme verileri (öğrenciler, puanlar, resimler) silindi.
- Denenmedi: “Sınıf yedeğini indir” ve “Yedekten yükle” tarayıcıda çalıştırılmadı (dosya indirme/yükleme); gerçek fotoğrafla ve gerçek akıllı tahtada dokunmatik deneme yapılmadı.

## Kale yıkma oyunu (28 Ekim 2026)

- Her doğru cevap rakip kaleye bir taş sayılıyor; iki takım 14'er taş atınca kimse kazanmıyor, sol takımın 15. taşında sol takım kazanıyor ve diğer takımın soruları kapanıyor; yanlış cevap taş atmıyor: geçti.
- Hedef öğretmen ayarından geliyor; eski halat çekme kayıtları halat çekme olarak çalışmaya devam ediyor: geçti.
- Tarayıcıda (1366×768): ana sayfadaki “Kale yıkma” düğmesi /kale oyununu açtı; sahne ve soru alanı kaydırmasız sığdı (en alt düğme 704 px).
- Taşın yolu animasyonlar durdurularak ölçüldü: mancınıktan çıkıp sahnenin üst kısmına yükseliyor, sonra rakip kaleye iniyor.
- Hedef geçici olarak 5 yapılarak öğretmen panelinden başlatıldı: sol kale her isabette parçalandı, dayanıklılık çubuğu azaldı; 5. taşta kale yıkılıp moloz yığınına döndü ve kupa, konfetili “Hilal Takımı kazandı! Rakip takımın kalesi yıkıldı!” ekranı açıldı. Yanlış cevapta 5 saniye bekleme gösterildi.
- Not: Tarayıcı paneli arka plandayken sayfa kare çizmediği için ders sayfası “Ders yükleniyor…” aşamasında kaldı; bu yüzden ders sayfasındaki “Kale yıkmayı başlat” düğmesine tarayıcıda tıklanamadı (bölüm metni doğrulandı).

## Türkçe okunuş şıkları, kutlama ve çukur (20 Ekim 2026)

- Okunuş çevirisi bilinen örneklerle doğrulandı: فَتَحَ “feteha”, ظَهَرَ “zahera”, قُلْ “kul”, اِنَّ “inne”, ثُمَّ “sümme”, رَبِّ “rabbi”, عَلَّمَ “alleme”, كُنْتُمْ “küntüm”, اُقْ “uk”, اِسْتَكْبَرَ “istekbera”: geçti.
- Hareke, cezm ve şedde ünitelerinin 9 oyununda her soru “okunuş” türünde; doğru şık uyaranın okunuşu; şıklarda Arapça harf yok; iki şık aynı okunmuyor: geçti.
- Tarayıcıda halat çekme (Harekeli kelimeler dersi, eşik geçici olarak 3): ortadaki çukur çizildi; kazanınca kaybeden takımın çocukları sırayla çukura düştü, kazananlar zıpladı; ardından kupa ve konfetili “Yıldız Takımı kazandı!” ekranı açıldı.

## Halat çekme oyunu (20 Ekim 2026)

Otomatik testler (8 test, `tests/tug.test.ts`):

- Her ders için havuz var; bütün sorularda Arapça uyaran ve Türkçe şıklar var; öğretilmemiş kural yok. Harfler 1. derste yalnızca o dersin 7 harfi soruluyor: geçti.
- Doğru cevap halatı o takıma bir adım çekiyor, yanlış cevap çekmiyor: geçti.
- Yanlışta 5 saniye bekleniyor; bu sürede dokunuşlar yok sayılıyor; 5 saniyeden önce geçilmiyor: geçti.
- İki takım bağımsız ve aynı anda cevap verebiliyor: geçti.
- Sınırsız soru: 300 soru boyunca deste en az 6 kez yenilendi, aynı harf arka arkaya gelmedi, ilk sorularda bütün harfler geldi: geçti.
- Bayrağı kendi çizgisine ilk çeken kazanıyor, sonra cevap kabul edilmiyor; duraklatma bekleme süresini uzatıyor; kaydet/yükle kalan beklemeyi koruyor: geçti.

Tarayıcıda (Harfler 1 dersi):

- Halat sahnesi, takım figürleri, kazanma çizgileri ve bayrak çizildi.
- Doğru cevaplarla halat -1, -3 ve sonunda -7 oldu; bayrak sol çizgiye ulaştı ve “Yıldız Takımı halatı kendi tarafına çekti!” ekranı açıldı.
- Yanlış cevapta doğru şık ve açıklama gösterildi; geri sayım 5'ten 1'e indi, soru kendiliğinden geçti; bu sırada diğer takım oynamaya devam etti.
- Yerleşim: 1366×768'de en alttaki öğe 757. pikselde (yanlış cevap açıklaması açıkken de), 1920×1080'de 1080 piksel içinde; kaydırma yok, figürler ekranda.

## Ekran yerleşimi ölçümleri

Her soru ekranında şık düğmeleri, uyaran, yönerge ve alt çubuk ölçüldü. Kontrol edilenler: ekranın altına taşma, takım alanının dışına çıkma, düğme içeriğinin düğmeden büyük olması.

| Görünüm | Ders | Ölçülen ekran | Sorun |
|---|---|---|---|
| 1366×768 | 11. ünite (en uzun Arapça ifadeler) | 60 (iki takım × 30) | 0 |
| 1366×768 | Cezmli kelimeler (en uzun Türkçe hecelemeler) | 60 | 0 (ilk ölçümde tek harfli Arapça şıkların satır kutusu düğmeden 3 piksel büyüktü; düzeltildi) |
| 1920×1080 | Esre dersi | İlk ekran | 0. İki yarı 956 piksel, şıklar 445×219 piksel, uyaran 151 piksel |

1366×768'de en alttaki öğe 757. pikselde bitiyor; sayfa kaydırması oluşmuyor.

## Test sırasında bulunup düzeltilen hatalar

1. **Eski oyunun geri gelmesi:** Next.js 16'nın `cacheComponents` özelliği önceki sayfanın bileşen durumunu saklıyor. “Yanlışlarla tekrar başlat” sonrasında eski, bitmiş yarışma görünüyordu. Oyun bileşeni artık oyun kimliğine bağlı. Eski bir bileşen, başka bir oyunun kaydının üzerine yazamıyor.
2. **Arapça satır yüksekliği:** 7 metin (Allah lafzı ve dikey esreli ifadeler) 1,9 satır yüksekliğini aşıyordu. Satır yüksekliği 2,1'e çıkarıldı.
3. **Next 16 uyumluluğu:** `dynamicParams` kaldırıldı. Rota parametresi `<Suspense>` içinde okunuyor.
4. **Lint:** Render sırasında `performance.now()` okunması ve efekt içinde durum kurulması gibi React kurallarına aykırı kullanımlar düzeltildi.
5. **İçerik:** Elif-lâm tespitinde yanlış alarm (اِلٰهَ, اِلَيْهِ), zamir dersinde yinelenen karşılaştırma sorusu ve tek düzeyde kalan zorluk dağılımları düzeltildi.

## Test edilemeyenler ve sınırlar

- **Fiziksel akıllı tahta:** Çoklu dokunma, tarayıcıda farklı işaretçi kimlikli sentetik `PointerEvent` olaylarıyla test edildi. Gerçek bir akıllı tahtada test edilmedi. Tahtaların bir kısmı tarayıcıya yalnızca tek dokunuş iletir. Kullanmadan önce `/kontrol` sayfasındaki 1 dakikalık testi yapın:
  1. İki öğrenci tahtanın iki yanına geçer.
  2. “Başla” deyince ikisi aynı anda kendi taraflarındaki “Dokun” düğmesine dokunur.
  3. İki sayaç da artmalı ve “En fazla eşzamanlı dokunuş” en az 2 olmalıdır.
  4. Sayaçlardan biri artmıyorsa tahta tek dokunuşu destekliyordur. Takımlar yine oynayabilir, ama aynı anda değil sırayla dokunmalıdır.
- **Mikrofonla kayıt ve dosya yükleme:** Öğretmen ekranındaki bu düğmeler tarayıcı izni ve gerçek dosya gerektirdiği için elle denenmedi. Kayıt depolama, onay ve alıştırmada kullanım IndexedDB'ye doğrudan konan bir test kaydıyla doğrulandı.
- **Tam ekran:** Tarayıcı, tam ekranı yalnızca gerçek bir kullanıcı dokunuşuyla açar; otomatik olarak denenmedi.
- **İçerik doğruluğu:** Otomatik testler yazım kurallarını denetler, ama Arapça kelimelerin ve kural yargılarının bir uzman tarafından incelenmesinin yerini tutmaz. Durum: [ICERIK-INCELEME.md](ICERIK-INCELEME.md).
- **Bilinmeyen ders adresi:** Akışlı oluşturma nedeniyle HTTP durum kodu 200'dür; sayfa “Sayfa bulunamadı” ekranını ve `noindex` işaretini gösterir.
