const config = window.AGENCYPRO_CONFIG || {};
const url = (config.APP_URL || '').trim();
const status = document.getElementById('status');
const link = document.getElementById('app-link');
if (url && /^https:\/\//i.test(url)) {
  status.textContent = 'Aplikasi telah dikonfigurasi. Gunakan tombol di bawah untuk membuka ruang kerja AgencyPro.';
  link.href = url;
  link.textContent = 'Buka Aplikasi AgencyPro ↗';
  link.classList.remove('disabled');
  link.removeAttribute('aria-disabled');
} else {
  status.textContent = 'Website pemasaran siap. Tautan aplikasi akan diaktifkan setelah versi Flutter Web lolos pengujian dan dipublikasikan.';
}
document.getElementById('year').textContent = new Date().getFullYear();
