# Vercel'de yayınlama

Uygulama sunucu veya veritabanı gerektirmez. Bütün sayfalar derleme sırasında statik olarak üretilir. Veriler öğretmenin tarayıcısında saklanır.

## Yol 1: GitHub ile (önerilen)

1. Bu klasörü bir GitHub deposuna yükleyin.
2. https://vercel.com adresinde oturum açın ve **Add New → Project** seçin.
3. GitHub deposunu seçin. Vercel, Next.js'i kendisi tanır. Ayarları değiştirmeyin:
   - Framework Preset: **Next.js**
   - Build Command: `next build` (varsayılan)
   - Output Directory: varsayılan
   - Install Command: `npm install` (varsayılan)
   - Node.js sürümü: 22.x veya üstü (Project Settings → General → Node.js Version)
4. **Deploy** düğmesine basın. Birkaç dakika içinde `https://<proje-adı>.vercel.app` adresi hazır olur.
5. Sonraki her `git push` otomatik olarak yeniden yayınlanır.

Ortam değişkeni gerekmez.

## Yol 2: Vercel CLI ile

```bash
npm install -g vercel
```

```bash
vercel login
```

Proje klasöründe ilk yayın (önizleme adresi verir):

```bash
vercel
```

Kalıcı (production) yayın:

```bash
vercel --prod
```

## Yayından sonra kontrol listesi

1. Ana sayfada 12 ünite görünüyor.
2. Bir ders açın ve “Takım oyununu başlat”a basın. Ekran ikiye ayrılır, iki tarafta farklı sorular çıkar.
3. `/kontrol` sayfasında:
   - “Font yüklendi” ve “Satır yüksekliğini aşan metin: 0” görünmeli.
   - İki öğrenciyle çoklu dokunma testini yapın.
4. Öğretmen panelinde takım adlarını değiştirin, sayfayı yenileyin. Adlar korunmalı.
5. Akıllı tahtanın tarayıcısında tam ekran düğmesini deneyin.

## Notlar

- Sonuçlar ve ayarlar her tarayıcıda ayrı tutulur. Öğretmen bilgisayarı ile akıllı tahta farklıysa sonuçlar ortak görünmez. Gerekirse öğretmen panelinden JSON olarak dışa aktarın.
- Gizli (private) pencerede tarayıcı depolaması kapalı olabilir. Uygulama çalışır, ama ayarlar ve sonuçlar sayfa kapanınca kaybolur. Öğretmen paneli bu durumu uyarıyla gösterir.
- Ses kayıtları yalnızca kaydın yapıldığı tarayıcıda (IndexedDB) durur ve dışa aktarılan JSON dosyasına dahil değildir.
