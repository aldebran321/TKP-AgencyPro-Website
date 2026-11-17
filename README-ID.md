# TKP AgencyPro Official Website — Starter v1

Website profil/pemasaran resmi dengan tema Midnight Navy, Champagne Gold, Premium Glass, dan Ivory. Website statis ini terpisah dari source Flutter aplikasi existing.

## Isi
- `index.html` — halaman utama dan informasi platform.
- `login.html` — gerbang menuju aplikasi existing.
- `config.js` — tempat mengisi URL Flutter Web setelah tersedia.
- `styles.css`, `login.css`, `script.js`, `login.js` — tampilan dan interaksi.
- `assets/mark.svg` — favicon.

## Menghubungkan aplikasi
1. Pastikan source Flutter existing lolos audit kompatibilitas web.
2. Build dan deploy aplikasi Flutter Web ke alamat HTTPS tersendiri.
3. Edit `config.js`, isi `APP_URL` dengan URL aplikasi yang benar-benar sudah aktif.
4. Deploy ulang website ini. Tombol Login akan membuka aplikasi tersebut.

Jangan mengisi `APP_URL` dengan URL perkiraan. Saat kosong, halaman login menampilkan status bahwa aplikasi belum dihubungkan.

## Deploy gratis melalui Cloudflare Pages
1. Buat repository GitHub baru, misalnya `tkp-agencypro-website`.
2. Upload seluruh isi folder ini ke root repository (file `index.html` harus berada di root).
3. Di Cloudflare Dashboard, buka Workers & Pages → Create → Pages → Connect to Git.
4. Pilih repository tersebut.
5. Framework preset: None. Build command: kosong. Build output directory: `/` (root sesuai pengaturan Cloudflare Pages; jika antarmuka meminta direktori output, gunakan folder yang berisi `index.html`).
6. Deploy. Cloudflare akan memberikan subdomain `*.pages.dev`.

## Catatan integrasi aplikasi
Folder ini tidak mengubah Flutter, Supabase, konfigurasi database, atau file audio aplikasi. Build Flutter Web belum termasuk dalam paket website ini dan perlu audit terpisah, khususnya untuk secure storage, local authentication, penggunaan `dart:io`, image picker, dan audio.
