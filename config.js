/*
  KONFIGURASI PUBLIK WEBSITE TKP AGENCYPRO
  Isi SUPABASE_URL dan SUPABASE_ANON_KEY dengan nilai dari PROJECT SUPABASE
  YANG SAMA dengan aplikasi Flutter AgencyPro.

  Aman untuk frontend: gunakan hanya anon/publishable key.
  JANGAN PERNAH memasukkan service_role key, database password, atau secret.

  APP_URL adalah alamat Flutter Web yang benar-benar sudah di-deploy.
  Login pada domain website ini menyimpan sesi untuk domain website ini.
  SSO lintas domain/perangkat memerlukan callback/PKCE di aplikasi Flutter juga;
  token tidak boleh dikirim melalui query string URL.
*/
window.AGENCYPRO_CONFIG = {
  SUPABASE_URL: 'https://tmaeqbbcafppvugrywpx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_MkjYI4yzhxLSXTeZifr_Zw_-O863wSJ',
  APP_URL: ''
};
