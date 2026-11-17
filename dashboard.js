(() => {
  const config = window.AGENCYPRO_CONFIG || {};
  const allowedRoles = ['super_admin','ceo','admin','owner','spg','tl'];
  const byId = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const showFatal = message => { document.querySelector('.page-content').innerHTML = `<section class="module-card" style="max-width:620px;margin:12vh auto;text-align:center"><div class="module-icon" style="margin:0 auto 20px">!</div><h3>Akses workspace tidak tersedia</h3><p>${escapeHtml(message)}</p><a class="logout-button" style="display:inline-block;margin-top:20px" href="login.html">Kembali ke login</a></section>`; };
  if (!window.supabase?.createClient || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) { showFatal('Konfigurasi Supabase belum tersedia. Periksa file config.js.'); return; }
  const client = window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
  client.auth.onAuthStateChange(event => { if(event==='SIGNED_OUT') window.location.replace('login.html'); });
  async function loadWorkspace(){
    try{
      const {data:sessionData,error:sessionError}=await client.auth.getSession(); if(sessionError) throw sessionError;
      const session=sessionData?.session; if(!session?.user){window.location.replace('login.html');return;}
      const {data:profile,error:profileError}=await client.from('profiles').select('full_name, role, approval_status, is_active').eq('id',session.user.id).maybeSingle();
      if(profileError) throw profileError;
      if(!profile){await client.auth.signOut();showFatal('Profil akun tidak ditemukan. Hubungi administrator.');return;}
      const role=String(profile.role||'').trim().toLowerCase(), approval=String(profile.approval_status||'pending').trim().toLowerCase();
      if(approval!=='approved'||profile.is_active!==true||!allowedRoles.includes(role)){await client.auth.signOut();showFatal('Status akun atau role tidak memenuhi syarat akses. Hubungi administrator.');return;}
      const name=profile.full_name||session.user.email||'Pengguna AgencyPro';
      byId('welcome-name').textContent=name;byId('profile-name').textContent=name;byId('profile-email').textContent=session.user.email||session.user.phone||'Akun terverifikasi';byId('profile-role').textContent=role.replace(/_/g,' ');byId('profile-avatar').textContent=String(name).trim().charAt(0).toUpperCase()||'A';document.title=`Dashboard — ${name} | TKP AgencyPro`;
    }catch(error){showFatal(error?.message||'Gagal memuat sesi dan profil akun.');}
  }
  byId('logout-button').addEventListener('click',async()=>{const button=byId('logout-button');button.disabled=true;button.textContent='Keluar...';const {error}=await client.auth.signOut();if(error){button.disabled=false;button.innerHTML='Keluar <span>↗</span>';alert('Logout gagal. Periksa koneksi lalu coba lagi.');}else window.location.replace('login.html');});
  const sidebar=byId('sidebar'),overlay=byId('page-overlay'),menu=byId('mobile-menu');const closeMenu=()=>{sidebar.classList.remove('open');overlay.classList.remove('open');menu.setAttribute('aria-expanded','false');};
  menu.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');overlay.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));});overlay.addEventListener('click',closeMenu);sidebar.querySelectorAll('.side-nav a').forEach(link=>link.addEventListener('click',closeMenu));loadWorkspace();
})();
