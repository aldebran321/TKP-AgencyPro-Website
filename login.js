(() => {
  const config = window.AGENCYPRO_CONFIG || {};
  const form = document.getElementById('login-form');
  const identityInput = document.getElementById('identity');
  const passwordInput = document.getElementById('password');
  const submit = document.getElementById('submit-login');
  const submitLabel = document.getElementById('submit-label');
  const status = document.getElementById('login-status');
  const continueApp = document.getElementById('continue-app');
  const supabaseReady = Boolean(window.supabase?.createClient && config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
  let client = null;

  const showStatus = (message, type = '') => {
    status.textContent = message;
    status.className = `login-status${type ? ` ${type}` : ''}`;
  };
  const setBusy = (busy, label) => {
    submit.disabled = busy;
    submitLabel.textContent = label;
  };

  if (supabaseReady) {
    try {
      client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
      });
      showStatus('Siap. Masuk menggunakan akun AgencyPro yang terdaftar.');
    } catch (error) {
      showStatus('Konfigurasi autentikasi tidak valid. Periksa URL dan anon key Supabase.', 'error');
    }
  } else {
    showStatus('Autentikasi belum dikonfigurasi. Masukkan URL dan anon/publishable key dari project Supabase AgencyPro yang sama ke config.js.');
  }

  document.getElementById('toggle-password').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const visible = passwordInput.type === 'text';
    passwordInput.type = visible ? 'password' : 'text';
    button.textContent = visible ? 'Lihat' : 'Sembunyikan';
    button.setAttribute('aria-pressed', String(!visible));
    button.setAttribute('aria-label', visible ? 'Tampilkan password' : 'Sembunyikan password');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) {
      showStatus('Login belum dapat dijalankan karena konfigurasi Supabase belum diisi.', 'error');
      return;
    }
    const identity = identityInput.value.trim();
    const password = passwordInput.value;
    if (!identity || !password) {
      showStatus('Masukkan email dan password terlebih dahulu.', 'error');
      return;
    }
    setBusy(true, 'Memeriksa akun...');
    continueApp.hidden = true;
    showStatus('Menghubungkan ke Supabase Auth...');
    try {
      const isEmail = identity.includes('@');
      const loginValue = isEmail ? identity : normalizePhone(identity);
      const { data, error } = await client.auth.signInWithPassword(
        isEmail ? { email: loginValue, password } : { phone: loginValue, password }
      );
      if (error) throw error;
      if (!data.session || !data.user) throw new Error('Sesi login tidak berhasil dibuat.');

      // Ikuti validasi akun yang digunakan aplikasi Flutter AgencyPro.
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('full_name, role, approval_status, is_active')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profileError) { await client.auth.signOut(); throw profileError; }
      if (!profile) { await client.auth.signOut(); throw new Error('Profil akun tidak ditemukan. Hubungi administrator.'); }

      const role = String(profile.role || '').trim().toLowerCase();
      const approval = String(profile.approval_status || 'pending').trim().toLowerCase();
      const active = profile.is_active === true;
      const allowedRoles = ['super_admin', 'ceo', 'admin', 'owner', 'spg', 'tl'];
      if (approval !== 'approved' || !active || !allowedRoles.includes(role)) {
        await client.auth.signOut();
        if (approval === 'pending') throw new Error('Akun masih menunggu persetujuan administrator/CEO.');
        if (approval === 'rejected') throw new Error('Pendaftaran akun ditolak. Hubungi administrator.');
        if (!active) throw new Error('Akun sedang dinonaktifkan. Hubungi administrator.');
        throw new Error('Role akun tidak dikenali. Hubungi administrator.');
      }

      showStatus(`Login berhasil. Selamat datang${profile.full_name ? `, ${profile.full_name}` : ''}. Status akun dan role berhasil diverifikasi. Sesi tersimpan pada browser ini.`, 'success');
      if (config.APP_URL && /^https:\/\//i.test(config.APP_URL)) {
        continueApp.href = config.APP_URL;
        continueApp.hidden = false;
      }
      passwordInput.value = '';
    } catch (error) {
      const message = error?.message || 'Login gagal. Periksa koneksi dan data akun Anda.';
      showStatus(message, 'error');
    } finally {
      setBusy(false, 'Masuk ke AgencyPro');
    }
  });

  document.getElementById('forgot-password').addEventListener('click', async () => {
    if (!client) {
      showStatus('Konfigurasi Supabase belum diisi.', 'error');
      return;
    }
    const email = identityInput.value.trim();
    if (!email || !email.includes('@')) {
      showStatus('Untuk pemulihan password, masukkan alamat email yang terdaftar.', 'error');
      identityInput.focus();
      return;
    }
    showStatus('Mengirim permintaan pemulihan password...');
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login.html`
      });
      if (error) throw error;
      showStatus('Jika email terdaftar, instruksi pemulihan password akan dikirim. Periksa kotak masuk dan folder spam.', 'success');
    } catch (error) {
      showStatus(error?.message || 'Permintaan pemulihan password gagal.', 'error');
    }
  });

  function normalizePhone(value) {
    let phone = value.trim().replace(/[^0-9+]/g, '');
    if (phone.startsWith('0')) phone = `+62${phone.slice(1)}`;
    if (phone.startsWith('62')) phone = `+${phone}`;
    if (!phone.startsWith('+')) phone = `+62${phone}`;
    return phone;
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
