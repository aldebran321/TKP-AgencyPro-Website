# TKP AgencyPro Official Website — Web Login

Website pemasaran statis dengan tema Midnight Navy, Champagne Gold, Premium Glass, dan Ivory. Login web memakai project Supabase yang sama dengan aplikasi Flutter AgencyPro.

## Struktur
- `index.html` — halaman utama.
- `login.html` — formulir login web premium.
- `config.js` — URL dan publishable key Supabase serta URL Flutter Web.
- `login.js` — login email/nomor HP, validasi profil, sesi browser, dan reset password via email.
- `styles.css`, `login.css`, `script.js` — tampilan dan interaksi.
- `assets/mark.svg` — favicon.

## Konfigurasi Supabase
`config.js` telah diisi memakai Project URL dan publishable key dari source Flutter AgencyPro terbaru yang diperiksa. Keduanya adalah nilai publik frontend, bukan service-role secret.

Pastikan Supabase Dashboard → Authentication → URL Configuration memiliki redirect URL berikut:
`https://tkp-agencypro.pages.dev/login.html`

Tambahkan juga domain produksi lain bila nanti dipakai. Redirect ini diperlukan untuk alur reset password.

Login web menerima email atau nomor HP. Validasi profil mengikuti aplikasi Flutter: tabel `profiles`, kolom `full_name, role, approval_status, is_active`; akun harus approved, aktif, dan role termasuk super_admin, ceo, admin, owner, spg, atau tl. Kebijakan RLS harus mengizinkan pengguna terautentikasi membaca profil miliknya sendiri. Jangan menonaktifkan RLS.

## Batas SSO lintas Android dan website
Login web memakai akun Supabase yang sama dan menyimpan sesi pada browser website. APK menggunakan penyimpanan sesi native yang aman (Flutter Secure Storage). Browser dan aplikasi Android memiliki penyimpanan terpisah; login di browser tidak otomatis membuat APK login, dan sebaliknya.

SSO lintas aplikasi membutuhkan implementasi callback/deep-link satu kali pakai di source Flutter, validasi state/PKCE, dan handoff kredensial yang aman. Jangan menaruh access token atau refresh token pada query string URL. Paket ini belum mengklaim SSO lintas perangkat selesai; ini adalah fondasi login web dengan autentikasi dan pemeriksaan akun yang sama.

`APP_URL` dibiarkan kosong sampai alamat Flutter Web benar-benar tersedia. Mengisi APP_URL saja tidak membagikan sesi.

## Keamanan
- Jangan memasukkan service_role key, secret key, atau password database ke frontend.
- Role dan company context harus tetap diverifikasi backend/RLS; jangan mempercayai nilai dari browser.
- Sesi web hanya berlaku pada origin browser ini; logout web tidak otomatis logout APK.

## Deploy Cloudflare Pages
File `index.html` berada di root project. Framework preset `None`; Build output directory `.`. Build command `exit 0` dapat dipakai untuk konfigurasi statis yang sebelumnya memerlukan perintah build.
