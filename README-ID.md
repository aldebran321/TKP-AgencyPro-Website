# TKP AgencyPro Website — Role Workspace

Website statis ini menggunakan Supabase project yang sama dengan aplikasi Flutter TKP AgencyPro. File Flutter yang diberikan dipakai sebagai acuan pemetaan role; file Flutter dan database tidak diubah.

## Pemetaan role sesuai `lib/main.dart` Flutter

| Role di `profiles.role` | Workspace website | Perilaku di Flutter |
|---|---|---|
| `super_admin` | ECC — Executive Command Center | `SuperAdminDashboard` |
| `ceo` | CEO | `CEODashboard` |
| `admin` | CEO | `CEODashboard` |
| `owner` | CEO | `CEODashboard` |
| `tl` | Team Leader | `TeamLeaderDashboard` |
| `spg` | SPG | `SPGDashboard` |

Role ECC adalah nama tampilan; nilai role database yang digunakan aplikasi Flutter adalah `super_admin`.

## Status implementasi website

- Login Supabase email/nomor HP dan validasi `approval_status=approved`, `is_active=true`, serta allowlist role.
- Login berhasil diarahkan ke `dashboard.html`; dashboard memeriksa ulang sesi dan profil.
- ECC: workspace dan menu Overview, CEO Monitoring, Companies, Security, Support. Ringkasan overview menggunakan tabel/kolom yang sama dengan query dashboard ECC Flutter (`profiles`, `companies`, `daily_sales`, `attendance`). Daftar perusahaan hanya menampilkan baris yang dapat dibaca oleh sesi berdasarkan RLS.
- CEO: dashboard web yang sudah ada dipertahankan.
- TL: workspace dan enam menu sesuai `TeamLeaderDashboard` Flutter: Laporan Tim, Mengelola Anggota, Absensi Anggota, Aktivitas Penjualan, Target Tim, Pesan/Chat. Halaman operasional TL masih perlu porting; saat ini tiap menu menjelaskan status integrasinya dan tidak mengarang data atau tindakan.
- SPG: dashboard web yang sudah ada dipertahankan.

## Batasan yang harus diketahui

1. ECC dan TL sekarang sudah dipetakan ke workspace yang benar, tetapi belum semua halaman dan aksi Flutter dipindahkan ke website. Menu yang belum dipindahkan ditandai secara eksplisit.
2. ECC menggunakan query global yang sama dengan Flutter. Keberhasilan baca tetap bergantung pada Supabase RLS untuk sesi `super_admin`.
3. Jangan menonaktifkan RLS atau menaruh `service_role` key di browser. Menyembunyikan menu di frontend bukan pengganti otorisasi database.
4. Website dan Android berbagi backend, tetapi sesi login browser dan aplikasi Android tetap terpisah.
5. Login live memakai akun ECC, CEO, TL, dan SPG belum diuji dari lingkungan ini. Uji di deployment setelah ZIP diunggah.

## Konfigurasi

Isi `config.js` dengan Supabase URL dan anon/publishable key dari project TKP AgencyPro yang sama. Jangan pernah memasukkan `service_role` key ke frontend.

## Deploy manual

Unggah isi folder `tkp-agencypro-website-v1` ke repository Cloudflare Pages/GitHub sesuai struktur deployment yang sudah digunakan. Jangan mengubah project Supabase atau aplikasi Flutter untuk pembaruan website ini.
