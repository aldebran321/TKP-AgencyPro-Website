(() => {
  const config = window.AGENCYPRO_CONFIG || {};
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const fmt = n => new Intl.NumberFormat('id-ID').format(Number(n)||0);
  const clientReady = window.supabase?.createClient && config.SUPABASE_URL && config.SUPABASE_ANON_KEY;
  if (!clientReady) { $('page-content').innerHTML='<section class="module-card"><h3>Konfigurasi belum tersedia</h3><p>Periksa config.js dan koneksi Supabase.</p></section>'; return; }
  const db=window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
  let user, profile, role, workspaceRole, companyId, companyName='Perusahaan', activeTab='home', spgRows=[], pendingRows=[], attendanceRows=[], eccStats=null;
  const ECC_NAV=[['home','⌂','Executive Overview'],['ceo','♙','CEO Monitoring'],['companies','▦','Companies'],['security','◇','Security'],['support','✉','Support']];
  const TL_NAV=[['home','⌂','Beranda'],['reports','▤','Laporan Tim'],['members','♙','Mengelola Anggota'],['attendance','◷','Absensi Anggota'],['sales','▣','Aktivitas Penjualan'],['targets','⚑','Target Tim'],['chat','✉','Pesan / Chat']];
  const CEO_NAV=[['home','⌂','Beranda'],['approval','✓','Approval'],['members','♙','Anggota SPG'],['attendance','◷','Absensi'],['messages','✉','Pesan'],['settings','⚙','Pengaturan']];
  const SPG_NAV=[['home','⌂','Beranda'],['members','♙','Anggota'],['attendance','◷','Absensi'],['settings','⚙','Pengaturan'],['profile','◎','Profil']];
  function setNav(){
    const items=workspaceRole==='ecc'?ECC_NAV:workspaceRole==='tl'?TL_NAV:workspaceRole==='ceo'?CEO_NAV:SPG_NAV;
    $('role-nav').innerHTML=items.map(([id,icon,label])=>`<a href="#${id}" data-tab="${id}" class="${id===activeTab?'active':''}"><span>${icon}</span>${label}</a>`).join('');
    $('role-nav').querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();renderTab(a.dataset.tab);}));
    $('nav-heading').textContent=({ecc:'EXECUTIVE COMMAND CENTER',ceo:'CEO MANAGEMENT',tl:'TEAM LEADER WORKSPACE',spg:'SPG WORKSPACE'})[workspaceRole]||'AGENCYPRO WORKSPACE';
  }
  function shell(title,subtitle,body){$('page-content').innerHTML=`<div class="welcome-row"><div><div class="eyebrow"><i></i> ${({ecc:'EXECUTIVE COMMAND CENTER',ceo:'CEO MANAGEMENT',tl:'TEAM LEADER',spg:'SALES PROMOTION GIRL'})[workspaceRole]||'AGENCYPRO'}</div><h1>${title}</h1><p class="welcome-copy">${subtitle}</p></div><div class="session-chip"><span class="live-dot"></span> SESSION ACTIVE</div></div><div class="profile-strip"><div class="avatar">${esc((profile.full_name||'A').trim().charAt(0).toUpperCase())}</div><div class="profile-main"><small>ACCOUNT PROFILE</small><b>${esc(profile.full_name||'Pengguna')}</b><span>${esc(user.email||user.phone||'Akun terverifikasi')}</span></div><div class="profile-role"><small>ROLE ACCESS</small><b>${esc(role.toUpperCase())}</b></div><div class="profile-state"><small>ACCOUNT STATUS</small><b><i></i> Approved &amp; Active</b></div></div>${body}<div class="dashboard-foot"><span>◈ &nbsp; TKP AGENCYPRO · ${esc(companyName)}</span><span>SECURE ACCESS · ROLE VERIFIED</span></div>`; }
  function cards(items){return `<div class="module-grid">${items.map((x,i)=>`<article class="module-card ${i===0?'module-featured':''}"><div class="module-icon">${x[0]}</div><span class="module-number">${String(i+1).padStart(2,'0')}</span><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join('')}</div>`;}
  function statCards(items){return `<div class="stat-grid">${items.map(x=>`<article class="stat-card"><small>${x[0]}</small><strong>${esc(x[1])}</strong><span>${x[2]||''}</span></article>`).join('')}</div>`;}
  async function loadCEO(){
    const {data:spgs,error}=await db.from('profiles').select('id,full_name,employee_code,approval_status,is_active,company_id').eq('company_id',companyId).eq('role','spg').eq('approval_status','approved').order('full_name'); if(error)throw error; spgRows=spgs||[];
    const {data:settings,error:se}=await db.from('company_settings_multi').select('daily_target').eq('company_id',companyId).maybeSingle(); if(se)throw se; window.ceoTarget=Number(settings?.daily_target)||50;
    const {data:pending,error:pe}=await db.from('profiles').select('id,full_name,email,phone,employee_code,approval_status,company_id').eq('company_id',companyId).eq('role','spg').eq('approval_status','pending').order('full_name'); if(pe)throw pe; pendingRows=pending||[];
    const ids=spgRows.filter(x=>x.is_active===true).map(x=>x.id); const day=today();
    if(ids.length){const [a,s]=await Promise.all([db.from('attendance').select('user_id,check_in,check_out').eq('attendance_date',day).in('user_id',ids),db.from('daily_sales').select('user_id,bottles_sold').eq('sales_date',day).in('user_id',ids)]); if(a.error)throw a.error;if(s.error)throw s.error; attendanceRows=a.data||[]; window.ceoSales=(s.data||[]).reduce((n,x)=>n+(Number(x.bottles_sold)||0),0);}else{attendanceRows=[];window.ceoSales=0;}
  }
  async function loadSPG(){
    const day=today(); const [a,s,settings,company]=await Promise.all([
      db.from('attendance').select('id,attendance_date,check_in,check_out').eq('user_id',user.id).eq('attendance_date',day).maybeSingle(),
      db.from('daily_sales').select('id,sales_date,bottles_sold,notes,created_at').eq('user_id',user.id).order('sales_date',{ascending:false}).order('created_at',{ascending:false}).limit(20),
      db.from('company_settings_multi').select('daily_target,spg_header_message,spg_daily_motivation,attendance_start_time,attendance_grace_minutes').eq('company_id',companyId).maybeSingle(),
      db.from('companies').select('company_name').eq('id',companyId).maybeSingle()
    ]); if(a.error)throw a.error;if(s.error)throw s.error;if(settings.error)throw settings.error;if(company.error)throw company.error;
    window.spgAttendance=a.data;window.spgSales=s.data||[];window.spgTarget=Number(settings.data?.daily_target)||50;window.spgHeader=settings.data?.spg_header_message||'Tunjukkan kemampuan terbaikmu hari ini!';window.spgMotivation=settings.data?.spg_daily_motivation||'';companyName=company.data?.company_name||'Perusahaan';
  }
  function section(title,content){return `<div class="section-heading"><div><small>TKP AGENCYPRO</small><h2>${title}</h2></div></div>${content}`;}
  function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}" class="empty-cell">Belum ada data.</td></tr>`}</tbody></table></div>`;}
  async function loadECC(){
    // Query set mirrors the Executive Command Center Flutter dashboard.
    const [profiles,companies,sales,attendance]=await Promise.all([
      db.from('profiles').select('role').in('role',['ceo','spg','tl']),
      db.from('companies').select('id,approval_status,is_active,company_name'),
      db.from('daily_sales').select('id'),
      db.from('attendance').select('id')
    ]);
    for(const result of [profiles,companies,sales,attendance]) if(result.error) throw result.error;
    const rows=companies.data||[];
    eccStats={
      ceos:(profiles.data||[]).filter(x=>x.role==='ceo').length,
      spgs:(profiles.data||[]).filter(x=>x.role==='spg').length,
      tls:(profiles.data||[]).filter(x=>x.role==='tl').length,
      companies:rows.length,
      activeCompanies:rows.filter(x=>x.is_active===true&&x.approval_status==='approved').length,
      pendingCompanies:rows.filter(x=>x.approval_status==='pending').length,
      sales:(sales.data||[]).length,
      attendance:(attendance.data||[]).length,
      companyRows:rows
    };
  }
  function renderECC(tab){
    const x=eccStats||{};
    if(tab==='home'){
      shell('Executive Command Center',`Selamat datang, ${esc(profile.full_name||'Executive')}. Ringkasan governance lintas perusahaan.`,
        statCards([['PERUSAHAAN',fmt(x.companies),'Seluruh perusahaan yang terlihat oleh kebijakan akses'],['PERUSAHAAN AKTIF',fmt(x.activeCompanies),'Approved dan aktif'],['MENUNGGU APPROVAL',fmt(x.pendingCompanies),'Pendaftaran perusahaan'],['CEO',fmt(x.ceos),'Akun CEO'],['TEAM LEADER',fmt(x.tls),'Akun TL'],['SPG',fmt(x.spgs),'Akun SPG'],['DATA PENJUALAN',fmt(x.sales),'Baris daily_sales'],['DATA KEHADIRAN',fmt(x.attendance),'Baris attendance']])+section('Executive Intelligence Suite',cards([
          ['▦','Global Company Management','Tinjau status dan pendaftaran seluruh perusahaan.'],['♙','CEO Account Monitoring','Pantau akun CEO dan status persetujuan.'],['♧','Team Leader Governance','Pengawasan governance Team Leader.'],['◈','Global Performance Intelligence','Analisis indikator lintas perusahaan.'],['⌁','System Health','Pemeriksaan konektivitas tabel inti.'],['◇','Security Audit','Pemeriksaan indikatif keamanan dan governance.'],['✉','Global Notifications','Antrean persetujuan dan pengaduan global.'],['✦','AI Executive Assistant','Ringkasan eksekutif berbasis aturan.']])));
    } else if(tab==='companies'){
      const rows=(x.companyRows||[]).map(c=>`<tr><td>${esc(c.company_name||'Perusahaan')}</td><td>${esc(c.approval_status||'—')}</td><td>${c.is_active===true?'Aktif':'Nonaktif'}</td></tr>`);
      shell('Global Company Management','Daftar perusahaan yang dapat dibaca oleh sesi ECC sesuai kebijakan Supabase.',section('Perusahaan',table(['Nama Perusahaan','Approval','Status'],rows)));
    } else if(tab==='ceo'){
      shell('CEO Account Monitoring','Ringkasan akun CEO yang terlihat oleh sesi ECC.',statCards([['AKUN CEO',fmt(x.ceos),'Jumlah profil role CEO']])+`<article class="module-card"><h3>Pengelolaan akun CEO</h3><p>Flutter menyediakan modul pengelolaan akun CEO. Tindakan aktivasi, perubahan akun, dan persetujuan belum dipindahkan ke website pada tahap ini; tidak ada perubahan akun yang dilakukan dari halaman ini.</p></article>`);
    } else if(tab==='security'){
      shell('Security & System Health','Pemeriksaan status sesi dan keterjangkauan tabel berdasarkan query baca.',cards([['◇','Security Audit','Audit SQL, grants, dan definisi RLS tidak dapat disimpulkan dari browser. Tetap gunakan kebijakan Supabase.'],['⌁','System Health','Statistik berhasil dimuat jika query di atas terjangkau; ini bukan pengukuran uptime Supabase.'],['♙','Role Governance','ECC menggunakan role database super_admin sesuai aplikasi Flutter.']]));
    } else {
      shell('Global Support & Notifications','Pusat dukungan dan notifikasi global.',cards([['✉','Global Notifications','Flutter merangkum pendaftaran perusahaan pending dan pengaduan yang belum dijawab. Integrasi inbox web belum diaktifkan.'],['♧','Team Leader Governance','Flutter membuka modul aktivasi Team Leader. Tindakan administrasi belum dipindahkan ke web.'],['✦','AI Executive Assistant','Di Flutter, ringkasan memakai analisis aturan lokal; belum ada integrasi AI generatif eksternal.']]));
    }
  }
  function renderTL(tab){
    const modules={
      reports:['Laporan Tim','Laporan operasional tim Team Leader. Flutter menggunakan modul TLReportsPage dan CEOTLReportsPage untuk laporan serta detail laporan.'],
      members:['Mengelola Anggota','Pengelolaan anggota SPG yang ditugaskan kepada Team Leader. Akses tetap harus mengikuti penugasan TL di backend.'],
      attendance:['Absensi Anggota','Pemantauan absensi anggota tim melalui modul TLAttendancePage.'],
      sales:['Aktivitas Penjualan','Pemantauan aktivitas penjualan SPG dalam tim melalui TLSalesActivityPage.'],
      targets:['Target Tim','Pemantauan dan pengelolaan target tim melalui TLTargetPage.'],
      chat:['Pesan / Chat','Pusat komunikasi Team Leader; Flutter menyediakan TLChatInfoPage dan chat privat sesuai penugasan.']
    };
    if(tab==='home'){
      shell(`Selamat datang, <em>${esc(profile.full_name||'Team Leader')}</em>`,`Panel operasional Team Leader sesuai struktur menu aplikasi Flutter.`,cards([
        ['▤','Laporan Tim','Lihat laporan operasional tim.'],['♙','Mengelola Anggota','Kelola anggota SPG yang ditugaskan.'],['◷','Absensi Anggota','Pantau kehadiran anggota.'],['▣','Aktivitas Penjualan','Pantau aktivitas penjualan tim.'],['⚑','Target Tim','Kelola dan pantau target tim.'],['✉','Pesan / Chat','Komunikasi dengan pihak terkait sesuai penugasan.']
      ])+`<article class="module-card"><h3>Batas akses Team Leader</h3><p>Dashboard TL tidak menggunakan menu atau data CEO/ECC. Data anggota dan komunikasi harus mengikuti penugasan TL yang berlaku di aplikasi serta kebijakan Supabase.</p></article>`);
    } else {
      const m=modules[tab]; if(!m){shell('Menu tidak tersedia','Menu tidak dikenali untuk role TL.','<article class="module-card"><p>Pilih salah satu menu Team Leader.</p></article>');return;}
      shell(m[0],m[1],`<article class="module-card"><div class="module-icon">TKP</div><h3>${m[0]}</h3><p>${m[1]}</p><p><b>Status integrasi:</b> Halaman web untuk modul ini belum diimplementasikan. Menu dan batas kewenangan sudah dipetakan dari Flutter, tetapi saya tidak akan menampilkan data palsu atau menjalankan query/tindakan yang skemanya belum diverifikasi.</p></article>`);
    }
  }
  function renderCEO(tab){
    const active=spgRows.filter(x=>x.is_active===true); const present=new Set(attendanceRows.map(x=>x.user_id)).size; const target=present*(window.ceoTarget||50);
    if(tab==='home'){
      const weekly=cards([['♙','Data SPG','Pantau anggota SPG aktif pada perusahaan Anda.'],['✓','Approval SPG',`${pendingRows.length} pendaftaran menunggu keputusan CEO.`],['◷','Kehadiran Tim',`${present} SPG tercatat hadir hari ini.`],['▤','Penjualan & Target',`${fmt(window.ceoSales)} botol tercatat hari ini.`]]);
      shell(`Selamat datang,<br><em>${esc(profile.full_name||'CEO')}</em>`,`Ringkasan kinerja tim dan pengawasan SPG — ${esc(companyName)}.`,statCards([['TOTAL SPG',fmt(active.length),'Anggota aktif & approved'],['KEHADIRAN HARI INI',fmt(present),'SPG tercatat absensi'],['PENJUALAN HARI INI',`${fmt(window.ceoSales)} botol`,'Total penjualan tim'],['TARGET TIM',`${fmt(target)} botol`,'Hadir × target harian default 50']])+section('Pusat Kendali CEO',weekly));
    } else if(tab==='approval'){
      const rows=pendingRows.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.email||'—')}<br>${esc(x.phone||'')}</td><td>${esc(x.employee_code||'—')}</td><td><button class="small-action" data-decision="approve" data-id="${esc(x.id)}">Setujui</button> <button class="small-action danger" data-decision="reject" data-id="${esc(x.id)}">Tolak</button></td></tr>`);
      shell('Approval Pendaftaran SPG','Tinjau pendaftaran SPG dari perusahaan Anda.',section('Menunggu Persetujuan',table(['Nama SPG','Kontak','Kode SPG','Keputusan'],rows)));
      $('page-content').querySelectorAll('[data-decision]').forEach(b=>b.addEventListener('click',()=>decideSPG(b.dataset.id,b.dataset.decision==='approve')));
    } else if(tab==='members'){
      const rows=spgRows.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.employee_code||'—')}</td><td>${x.is_active?'Aktif':'Nonaktif'}</td><td>Approved</td></tr>`);
      shell('Anggota SPG','Direktori anggota SPG pada perusahaan Anda.',section('Daftar Anggota',table(['Nama','Kode SPG','Status','Approval'],rows)));
    } else if(tab==='attendance'){
      const rows=attendanceRows.map(x=>`<tr><td>${esc(spgRows.find(p=>p.id===x.user_id)?.full_name||'SPG')}</td><td>${x.check_in?new Date(x.check_in).toLocaleTimeString('id-ID'):'—'}</td><td>${x.check_out?new Date(x.check_out).toLocaleTimeString('id-ID'):'Belum check out'}</td></tr>`);
      shell('Pengawasan Absensi','Rekap kehadiran SPG aktif hari ini.',section('Absensi Hari Ini',table(['Nama SPG','Check In','Check Out'],rows)));
    } else if(tab==='messages'){
      shell('Pesan','Area komunikasi CEO dengan anggota SPG.','<article class="module-card"><h3>Inbox Pesan SPG</h3><p>Halaman pesan tersedia di aplikasi Android. Integrasi inbox web belum diaktifkan karena skema tabel pesan dan aturan aksesnya belum diverifikasi. Tidak ada data pesan yang akan ditebak atau ditampilkan dari tabel yang belum dipastikan.</p></article>');
    } else {
      shell('Pengaturan','Preferensi dan identitas perusahaan.',cards([['⚙','Pengaturan Akun','Profil dan keamanan akun mengikuti pengaturan AgencyPro.'],['▦','Multi Company',`Konteks perusahaan aktif: ${companyName}.`],['◎','Role & Akses','Akses CEO dibatasi pada data perusahaan yang terhubung dengan akun.']]));
    }
  }
  async function renderSPG(tab){
    const rows=window.spgSales||[]; const total=rows.filter(x=>x.sales_date===today()).reduce((n,x)=>n+(Number(x.bottles_sold)||0),0);const a=window.spgAttendance;const target=window.spgTarget||50;const percent=Math.min(100,Math.round(total/Math.max(1,target)*100));
    if(tab==='home'){
      const recent=rows.slice(0,5).map(x=>`<tr><td>${esc(x.sales_date)}</td><td>${fmt(x.bottles_sold)} botol</td><td>${esc(x.notes||'—')}</td></tr>`);
      shell(`Selamat datang,<br><em>${esc(profile.full_name||'SPG')}</em>`,`${esc(window.spgHeader)} · ${esc(companyName)}.`,statCards([['PENJUALAN HARI INI',`${fmt(total)} botol`,'Total tambahan penjualan hari ini'],['TARGET HARIAN',`${fmt(target)} botol`,'Target perusahaan'],['PENCAPAIAN',`${percent}%`,'Maksimal 100% pada indikator']])+section('Absensi Hari Ini',`<div class="action-row"><div class="module-card"><h3>Check In</h3><p>${a?.check_in?new Date(a.check_in).toLocaleTimeString('id-ID'):'Belum check in'}</p><button class="small-action" id="check-in" ${a?.check_in?'disabled':''}>Check In</button></div><div class="module-card"><h3>Check Out</h3><p>${a?.check_out?new Date(a.check_out).toLocaleTimeString('id-ID'):'Belum check out'}</p><button class="small-action" id="check-out" ${!a?.check_in||a?.check_out?'disabled':''}>Check Out</button></div></div>`)+section('Input Penjualan Harian','<div class="form-card"><label>Jumlah botol terjual<input id="sales-quantity" type="number" min="0" step="1" placeholder="Contoh: 12"></label><label>Catatan (opsional)<input id="sales-notes" type="text" placeholder="Catatan penjualan"></label><button class="small-action" id="save-sales">Simpan Penjualan</button></div>')+section('Riwayat Penjualan Terbaru',table(['Tanggal','Penjualan','Catatan'],recent)));
      $('check-in')?.addEventListener('click',()=>saveAttendance('in'));$('check-out')?.addEventListener('click',()=>saveAttendance('out'));$('save-sales')?.addEventListener('click',saveSales);
    } else if(tab==='members'){
      const {data:team,error}=await db.from('profiles').select('full_name,employee_code,approval_status,is_active').eq('company_id',companyId).eq('role','spg').eq('approval_status','approved').order('full_name'); if(error)throw error; const teamRows=(team||[]).map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.employee_code||'—')}</td><td>${x.is_active?'Aktif':'Nonaktif'}</td></tr>`); shell('Anggota','Direktori anggota SPG pada perusahaan Anda.',section('Direktori Anggota',table(['Nama','Kode SPG','Status'],teamRows)));
    } else if(tab==='attendance'){
      shell('Absensi Saya','Status absensi pribadi untuk hari ini.',section('Absensi Hari Ini',`<div class="action-row"><div class="module-card"><h3>Check In</h3><p>${a?.check_in?new Date(a.check_in).toLocaleString('id-ID'):'Belum check in'}</p><button class="small-action" id="check-in" ${a?.check_in?'disabled':''}>Check In</button></div><div class="module-card"><h3>Check Out</h3><p>${a?.check_out?new Date(a.check_out).toLocaleString('id-ID'):'Belum check out'}</p><button class="small-action" id="check-out" ${!a?.check_in||a?.check_out?'disabled':''}>Check Out</button></div></div>`));$('check-in')?.addEventListener('click',()=>saveAttendance('in'));$('check-out')?.addEventListener('click',()=>saveAttendance('out'));
    } else if(tab==='settings'){
      shell('Pengaturan','Pengaturan akun dan preferensi SPG.',cards([['⚙','Pengaturan Akun','Pengaturan pribadi sesuai akun yang sedang login.'],['▦','Perusahaan',companyName],['◎','Profil CEO','Informasi CEO perusahaan tersedia melalui aplikasi.']]));
    } else {
      shell('Profil Saya','Informasi akun yang sedang digunakan.',section('Detail Profil',`<article class="module-card"><h3>${esc(profile.full_name||'SPG')}</h3><p>Role: SPG<br>Email/telepon: ${esc(user.email||user.phone||'—')}<br>Perusahaan: ${esc(companyName)}<br>Status: Approved &amp; Active</p></article>`));
    }
  }
  async function decideSPG(id,approve){
    if(!confirm(`${approve?'Setujui':'Tolak'} pendaftaran SPG ini?`))return;
    try{const {data,error}=await db.rpc('tkp_ceo_decide_spg',{p_spg_id:id,p_approve:approve});if(error)throw error;if(data!==true)throw new Error('Tidak ada perubahan. Periksa status akun atau kebijakan akses.');await loadCEO();renderTab('approval');alert(approve?'SPG berhasil disetujui.':'Pendaftaran SPG ditolak.');}catch(e){alert(`Gagal memproses: ${e.message}`);}
  }
  async function saveAttendance(kind){
    try{const now=new Date().toISOString();if(kind==='in'){const {data:existing,error:checkErr}=await db.from('attendance').select('id').eq('user_id',user.id).eq('attendance_date',today()).maybeSingle();if(checkErr)throw checkErr;if(existing)throw new Error('Absensi hari ini sudah tercatat.');const {data:co,error:ce}=await db.from('company_settings_multi').select('attendance_start_time,attendance_grace_minutes').eq('company_id',companyId).maybeSingle();if(ce)throw ce;const start=(co?.attendance_start_time||'08:00').split(':');const startMin=(Number(start[0])||8)*60+(Number(start[1])||0);const nowDate=new Date();const late=Math.max(0,nowDate.getHours()*60+nowDate.getMinutes()-startMin);const {error}=await db.from('attendance').insert({user_id:user.id,attendance_date:today(),check_in:now,late_minutes:late,attendance_status:late>(Number(co?.attendance_grace_minutes)||15)?'late':'present'});if(error)throw error;}else{const {data:existing,error:re}=await db.from('attendance').select('id,check_in,check_out').eq('user_id',user.id).eq('attendance_date',today()).maybeSingle();if(re)throw re;if(!existing?.check_in)throw new Error('Lakukan check in terlebih dahulu.');if(existing.check_out)throw new Error('Check out sudah tercatat.');const {error}=await db.from('attendance').update({check_out:now}).eq('id',existing.id).eq('user_id',user.id);if(error)throw error;}await loadSPG();renderTab(activeTab);alert(kind==='in'?'Check in berhasil.':'Check out berhasil.');}catch(e){alert(`Absensi gagal: ${e.message}`);}
  }
  async function saveSales(){const quantity=Number($('sales-quantity')?.value);if(!Number.isInteger(quantity)||quantity<0){alert('Masukkan jumlah botol yang benar.');return;}try{const {error}=await db.from('daily_sales').insert({user_id:user.id,sales_date:today(),bottles_sold:quantity,notes:$('sales-notes')?.value?.trim()||''});if(error)throw error;await loadSPG();renderTab('home');alert('Tambahan penjualan berhasil dicatat.');}catch(e){alert(`Gagal menyimpan penjualan: ${e.message}`);}}
  async function renderTab(tab){activeTab=tab;setNav();try{if(workspaceRole==='ecc')renderECC(tab);else if(workspaceRole==='tl')renderTL(tab);else if(workspaceRole==='ceo')renderCEO(tab);else await renderSPG(tab);}catch(e){$('page-content').innerHTML=`<article class="module-card"><h3>Gagal memuat halaman</h3><p>${esc(e.message)}</p><button class="small-action" id="retry">Coba lagi</button></article>`;$('retry')?.addEventListener('click',()=>init());}}
  async function init(){
    try{const {data:s,error:se}=await db.auth.getSession();if(se)throw se;user=s.session?.user;if(!user){location.replace('login.html');return;}
      const {data:p,error:pe}=await db.from('profiles').select('full_name,role,approval_status,is_active,company_id').eq('id',user.id).maybeSingle();if(pe)throw pe;profile=p;if(!p||p.approval_status!=='approved'||p.is_active!==true){await db.auth.signOut();location.replace('login.html');return;}
      role=String(p.role||'').trim().toLowerCase();companyId=p.company_id;companyName='Perusahaan';
      const allowed=['super_admin','ceo','admin','owner','tl','spg'];if(!allowed.includes(role))throw new Error('Role akun tidak dikenali.');
      // Flutter maps super_admin to ECC; admin/owner share CEO workspace.
      workspaceRole=role==='super_admin'?'ecc':(['ceo','admin','owner'].includes(role)?'ceo':role);
      if(workspaceRole==='ecc'){await loadECC();}
      else if(workspaceRole==='ceo'){if(!companyId)throw new Error('Akun CEO belum terhubung ke perusahaan.');const {data:c,error:ce}=await db.from('companies').select('company_name').eq('id',companyId).maybeSingle();if(ce)throw ce;companyName=c?.company_name||'Perusahaan';await loadCEO();}
      else if(workspaceRole==='tl'){/* Role-specific TL shell; operational data pages are gated until their Flutter data contracts are ported. */}
      else if(workspaceRole==='spg'){if(!companyId)throw new Error('Akun SPG belum terhubung ke perusahaan.');await loadSPG();}
      $('crumb-role').textContent=workspaceRole.toUpperCase();document.title=`Dashboard ${workspaceRole.toUpperCase()} — TKP AgencyPro`;renderTab('home');
    }catch(e){$('page-content').innerHTML=`<article class="module-card"><h3>Akses workspace tidak tersedia</h3><p>${esc(e.message||'Gagal memuat sesi dan profil.')}</p><a class="logout-button" href="login.html">Kembali ke login</a></article>`;}
  }
  $('logout-button').addEventListener('click',async()=>{const b=$('logout-button');b.disabled=true;b.textContent='Keluar...';const {error}=await db.auth.signOut();if(error){b.disabled=false;b.textContent='Keluar';alert(error.message);}else location.replace('login.html');});
  const sidebar=$('sidebar'),overlay=$('page-overlay'),menu=$('mobile-menu');const close=()=>{sidebar.classList.remove('open');overlay.classList.remove('open');menu.setAttribute('aria-expanded','false');};menu.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');overlay.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));});overlay.addEventListener('click',close);
  init();
})();
