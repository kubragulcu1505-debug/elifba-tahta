# Test sonuçları

Tarih: 18 Ekim 2026. Ortam: Windows 11, Node.js 22.12, Next.js 16.4.2, React 19.3, Chromium tabanlı tarayıcı paneli.

## Özet

| Denetim | Sonuç |
|---|---|
| Otomatik testler (`npm test`) | 28/28 geçti |
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
