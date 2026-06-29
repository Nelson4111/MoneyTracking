// ============================================================
// MONEY TRACKING 2026 — Frontend JavaScript
// ============================================================

// ============================================================
// FOTO PROFIL
// ============================================================
var FOTO_PROFIL_BASE64 = null;
var FOTO_PROFIL_INFO = null;
var KETERANGAN_LIMIT_TABLE = 50;
var KETERANGAN_LIMIT_MOBILE = 40;
var KETERANGAN_LIMIT_PREVIEW = 60;
var KETERANGAN_LIMIT_PRINT = 110;

// ============================================================
// HELPER: Escape HTML
// ============================================================
function escapeHtmlText(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeHtmlAttr(str) {
  return escapeHtmlText(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

var MT_LIBS = {};

function loadScriptOnce(src, globalName) {
  if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
  if (MT_LIBS[src]) return MT_LIBS[src];

  MT_LIBS[src] = new Promise(function(resolve, reject) {
    var existing = document.querySelector('script[data-mt-src="' + src + '"]');
    if (existing) {
      existing.addEventListener('load', function() { resolve(globalName ? window[globalName] : true); });
      existing.addEventListener('error', reject);
      return;
    }

    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.mtSrc = src;
    script.onload = function() { resolve(globalName ? window[globalName] : true); };
    script.onerror = function() { reject(new Error('Gagal memuat library: ' + src)); };
    document.head.appendChild(script);
  });

  return MT_LIBS[src];
}

function ensureChartJs() {
  return loadScriptOnce('https://cdn.jsdelivr.net/npm/chart.js', 'Chart');
}

function ensureSweetAlert() {
  return loadScriptOnce('https://cdn.jsdelivr.net/npm/sweetalert2@11', 'Swal');
}

function ensureTesseractJs() {
  return loadScriptOnce('https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.min.js', 'Tesseract');
}

function swalFire(options) {
  return ensureSweetAlert()
    .then(function(SwalLib) { return SwalLib.fire(options); })
    .catch(function(err) {
      console.error(err);
      if (options && options.showCancelButton) {
        return Promise.resolve({ isConfirmed: window.confirm((options.title || 'Konfirmasi') + '\n' + (options.text || '')) });
      }
      window.alert((options && (options.text || options.title)) || 'Informasi');
      return Promise.resolve({ isConfirmed: true });
    });
}

// ============================================================
// MUSIK
// ============================================================
var MUSIC_URL = 'https://c.termai.cc/a139/MtJ0l';
var _musicOn = false;
var _musicPending = false;

function initMusic() {
  var saved = localStorage.getItem('mt_music_on');
  _musicOn = saved === 'true';
  var audio = document.getElementById('appMusic');
  if (!audio) return;
  audio.src = MUSIC_URL;
  if (_musicOn) {
    var promise = audio.play();
    if (promise !== undefined) {
      promise.catch(function() {
        _musicPending = true;
        _musicOn = false;
        updateMusicFabUI();
      });
    }
  }
  updateMusicFabUI();
  document.addEventListener('click', function onFirstClick() {
    if (_musicPending) {
      _musicPending = false;
      _musicOn = true;
      localStorage.setItem('mt_music_on', 'true');
      var a = document.getElementById('appMusic');
      if (a) a.play().catch(function(){});
      updateMusicFabUI();
    }
    document.removeEventListener('click', onFirstClick);
  }, { once: true });
}

function toggleMusic() {
  var audio = document.getElementById('appMusic');
  if (!audio) return;
  if (_musicOn) {
    audio.pause();
    _musicOn = false;
  } else {
    audio.src = MUSIC_URL;
    audio.play().catch(function(){});
    _musicOn = true;
  }
  localStorage.setItem('mt_music_on', _musicOn ? 'true' : 'false');
  updateMusicFabUI();
}

function updateMusicFabUI() {
  var fab = document.getElementById('musicFab');
  var icon = document.getElementById('musicFabIcon');
  if (!fab || !icon) return;
  if (_musicOn) {
    fab.classList.add('music-on');
    icon.className = 'ri-music-2-fill';
    fab.title = 'Musik ON — Klik untuk matikan';
  } else {
    fab.classList.remove('music-on');
    icon.className = 'ri-music-2-line';
    fab.title = 'Musik OFF — Klik untuk putar';
  }
}

// ============================================================
// SUBSCRIPTION & READ-ONLY
// ============================================================
function aturReadOnlyMode() {
  if (!STATE.user) return;
  var mode = STATE.user.modeAkses || 'Normal';
  if (mode === 'ReadOnly') {
    document.body.classList.add('read-only-mode');
  } else {
    document.body.classList.remove('read-only-mode');
  }
}

function isReadOnly() { return document.body.classList.contains('read-only-mode'); }

function cekBolehMenulis(pesan) {
  if (!isReadOnly()) return true;
  showToast(pesan || 'Mode lihat saja aktif. Perpanjang langganan untuk bisa mengubah data.', 'warning');
  return false;
}

function buatLinkWA(username) {
  var pesan = encodeURIComponent('Halo admin, saya ingin memperpanjang langganan Money Tracking akun ' + username + ' saya.');
  return 'https://wa.me/6281241100804?text=' + pesan;
}

function tampilInfoLangganan() {
  if (!STATE.user) return;
  var role = STATE.user.role || '';
  if (role === 'Admin') return;
  var status = STATE.user.statusLangganan || 'Aktif';
  var mode = STATE.user.modeAkses || 'Normal';
  var berakhir = STATE.user.berakhirLangganan || '';
  var grace = STATE.user.graceSampai || '';
  var username = STATE.user.username || '';
  var subBanner = document.getElementById('subscriptionBanner');
  var subText = document.getElementById('subscriptionBannerText');
  var subWaBtn = document.getElementById('subscriptionWaBtnBanner');
  var roBanner = document.getElementById('readOnlyBanner');
  var roWaBtn = document.getElementById('readOnlyWaBtn');
  var waLink = buatLinkWA(username);
  if (subBanner) subBanner.classList.add('hidden');
  if (roBanner) roBanner.classList.add('hidden');
  var mainContent = document.getElementById('mainContent');
  if (mode === 'ReadOnly') {
    if (roBanner) {
      roBanner.classList.remove('hidden');
      if (roWaBtn) roWaBtn.href = waLink;
      if (mainContent) mainContent.style.paddingTop = 'calc(var(--topnav-h) + 42px)';
    }
    return;
  }
  if (status === 'Akan Habis') {
    if (subBanner && subText) {
      var tgl = berakhir ? ' pada ' + berakhir : '';
      subText.textContent = 'Langganan Anda akan berakhir' + tgl + '. Segera perpanjang!';
      if (subWaBtn) subWaBtn.href = waLink;
      subBanner.classList.remove('hidden');
      if (mainContent) mainContent.style.paddingTop = 'calc(var(--topnav-h) + 42px)';
    }
    return;
  }
  if (status === 'Grace Period') {
    if (subBanner && subText) {
      var tglGrace = grace ? ' sampai ' + grace : '';
      subText.textContent = 'Langganan habis. Masa tempo berlaku' + tglGrace + '. Segera perpanjang!';
      if (subWaBtn) subWaBtn.href = waLink;
      subBanner.classList.remove('hidden');
      subBanner.style.background = 'linear-gradient(90deg,rgba(255,69,96,0.12),rgba(255,69,96,0.06))';
      subBanner.style.borderColor = 'rgba(255,69,96,0.3)';
      subBanner.style.color = 'var(--red)';
      if (mainContent) mainContent.style.paddingTop = 'calc(var(--topnav-h) + 42px)';
    }
    return;
  }
  if (mainContent) mainContent.style.paddingTop = '';
}

function tampilPesanLoginAdmin() {
  if (!STATE.user) return;

  google.script.run
    .withSuccessHandler(function(res) {
      try {
        var r = JSON.parse(res);
        if (r.status !== 'success') return;

        var d = r.data || {};
        if (!d.tampil) return;

        var pesan = escapeHtmlText(d.pesan || '');
        var mediaUrl = d.mediaUrl || '';
        var musicUrl = d.musicUrl || '';

var mediaHtml = '';
var audioHtml = '';

if (mediaUrl) {
  mediaHtml =
    '<div style="' +
      'width:100%;' +
      'max-height:min(52vh, 420px);' +
      'min-height:180px;' +
      'display:flex;' +
      'align-items:center;' +
      'justify-content:center;' +
      'overflow:hidden;' +
      'border-radius:18px;' +
      'border:1px solid var(--border);' +
      'background:rgba(255,255,255,0.04);' +
      'padding:10px;' +
      'box-sizing:border-box;' +
      'margin-bottom:14px;' +
    '">' +
      '<img src="' + escapeHtmlAttr(mediaUrl) + '" ' +
      'style="' +
        'display:block;' +
        'max-width:100%;' +
        'max-height:min(48vh, 380px);' +
        'width:auto;' +
        'height:auto;' +
        'object-fit:contain;' +
        'border-radius:14px;' +
      '" ' +
      'alt="Media Pesan Login">' +
    '</div>';
}

if (musicUrl) {
  audioHtml =
    '<audio id="loginNotifAudio" src="' + escapeHtmlAttr(musicUrl) + '" controls autoplay ' +
    'style="width:100%;margin-top:14px"></audio>';
}

        swalFire({
          title:
            '<span style="font-family:var(--font-display);color:var(--neon)">' +
              '<i class="ri-notification-3-line"></i> Pesan dari Admin' +
            '</span>',
          html:
            mediaHtml +
            '<div style="font-size:15px;line-height:1.7;color:var(--text2);white-space:pre-line;text-align:left">' +
              pesan +
            '</div>' +
            audioHtml,
          confirmButtonText: 'Oke, Mengerti',
          width: 520,
          customClass: {
            popup: 'swal2-popup',
            confirmButton: 'swal2-confirm'
          },
didOpen: function() {
  var audio = document.getElementById('loginNotifAudio');
  if (audio) {
    audio.play().catch(function() {
      // Browser kadang blok autoplay. Ya begitulah, teknologi modern tapi masih drama.
    });
  }
},
didClose: function() {
  pulihkanScrollApp();
}
        });
      } catch (e) {
        console.error('Gagal tampil pesan login:', e);
      }
    })
    .withFailureHandler(function() {})
    .getNotifikasiLogin(STATE.user.role);
}

// ============================================================
// ANIMASI COUNTER RUPIAH
// ============================================================
function animasiCounterRupiah(el, nilaiTarget, delay) {
  if (!el) return;
  delay = delay || 0;
  nilaiTarget = parseFloat(nilaiTarget) || 0;
  var durasi = 800;
  var mulai = null;
  setTimeout(function() {
    function step(ts) {
      if (!mulai) mulai = ts;
      var progress = Math.min((ts - mulai) / durasi, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var nilaiSekarang = Math.floor(eased * nilaiTarget);
      el.textContent = 'Rp ' + nilaiSekarang.toLocaleString('id-ID');
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = rupiah(nilaiTarget);
    }
    requestAnimationFrame(step);
  }, delay);
}

// ============================================================
// MAGNETIC BUTTONS
// ============================================================
function initMagneticButtons() {
  if (window.matchMedia('(hover: none)').matches) return;
  var btns = document.querySelectorAll('.btn-primary, .btn-login');
  btns.forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate(' + (x * 0.1) + 'px, ' + (y * 0.1) + 'px)';
    });
    btn.addEventListener('mouseleave', function() { btn.style.transform = ''; });
  });
}

// ============================================================
// STATE GLOBAL
// ============================================================
var DATA_AKUN = [];
var DATA_KATEGORI = [];
var STRUK_PREVIEW_DATA = null;
var STRUK_SCAN_TOKEN = 0;
var STRUK_UNDO_STACK = [];
var STRUK_REDO_STACK = [];
var DASHBOARD_RECENT_TXN = [];
var DASHBOARD_PERIODE = '7hari';
var LAST_DASHBOARD_DATA = null;
var LAST_LAPORAN_DATA = null;
var LAST_LAPORAN_FILTER = null;
var PULL_REFRESH_STATE = { startY: 0, active: false, pulled: false };
var STATE = {
  user: null,
  currentPage: 'dashboard',
  sidebarOpen: false,
  theme: 'dark',
  warna: '#00ff99',
  chartInstances: {}
};


// ============================================================
// GLOBAL LOADING MANAGER
// Semua request delay ke Apps Script akan lewat sini.
// ============================================================

var MT_LOAD = {
  count: 0,
  lastButton: null,
  lastClickAt: 0,
  tokenId: 0
};

document.addEventListener('click', function(e) {
  var btn = e.target.closest('button, .btn, .btn-login');

  if (!btn) return;

  MT_LOAD.lastButton = btn;
  MT_LOAD.lastClickAt = Date.now();
}, true);

function mtPastikanLoadingUI() {
  if (!document.getElementById('mtApiLoader')) {
    var loader = document.createElement('div');
    loader.id = 'mtApiLoader';
    loader.className = 'mt-api-loader hidden';
    loader.innerHTML = '<div class="mt-api-loader-bar"></div>';
    document.body.appendChild(loader);
  }
}

function mtMulaiLoading(action) {
  mtPastikanLoadingUI();

  var loader = document.getElementById('mtApiLoader');

  MT_LOAD.count++;
  MT_LOAD.tokenId++;

  if (loader) loader.classList.remove('hidden');

  return {
    id: MT_LOAD.tokenId,
    action: action,
    btnToken: null
  };
}

function mtSelesaiLoading(token) {
  MT_LOAD.count = Math.max(0, MT_LOAD.count - 1);

  if (MT_LOAD.count > 0) return;

  var loader = document.getElementById('mtApiLoader');

  setTimeout(function() {
    if (MT_LOAD.count > 0) return;

    if (loader) loader.classList.add('hidden');
  }, 180);
}

// Biar bisa dipanggil dari adapter GitHub Pages di index.html
window.mtMulaiLoading = mtMulaiLoading;
window.mtSelesaiLoading = mtSelesaiLoading;

// ============================================================
// ROLE RULES
// ============================================================
var ROLE_RULES = {
Admin: {
  pages: ['dashboard','transaksi','akun','kategori','laporan','budget','pelanggan','pembayaran','strukmanual','botlog','pengaturan','adminsetting','kelolausers','settingweb','profil'],
  jenisKeuangan: ['Pribadi','Bisnis']
},
  UserBisnisPribadi: {
    pages: ['dashboard','transaksi','akun','kategori','laporan','budget','pelanggan','pembayaran','strukmanual','pengaturan','profil'],
    jenisKeuangan: ['Pribadi','Bisnis']
  },
  UserBisnis: {
    pages: ['dashboard','transaksi','akun','kategori','laporan','budget','pelanggan','pembayaran','strukmanual','pengaturan','profil'],
    jenisKeuangan: ['Bisnis']
  },
  UserPribadi: {
    pages: ['dashboard','transaksi','akun','kategori','laporan','budget','strukmanual','pengaturan','profil'],
    jenisKeuangan: ['Pribadi']
  }
};


// ============================================================
// KOMPATIBILITAS ROLE LAMA
// ============================================================
if (ROLE_RULES.UserPribadiBisnis && !ROLE_RULES.UserBisnisPribadi) {
  ROLE_RULES.UserBisnisPribadi = ROLE_RULES.UserPribadiBisnis;
}
if (ROLE_RULES.UserBisnisPribadi && !ROLE_RULES.UserPribadiBisnis) {
  ROLE_RULES.UserPribadiBisnis = ROLE_RULES.UserBisnisPribadi;
}

function getRoleUser() { return STATE.user && STATE.user.role ? STATE.user.role : 'UserPribadi'; }
function getRoleRules() { return ROLE_RULES[getRoleUser()] || ROLE_RULES.UserPribadi; }
function bolehAksesPage(page) { return getRoleRules().pages.includes(page); }
function bolehJenisKeuangan(jenis) { return getRoleRules().jenisKeuangan.includes(jenis); }
function defaultJenisKeuanganByRole() { return getRoleUser() === 'UserBisnis' ? 'Bisnis' : 'Pribadi'; }
function isRoleBisnisOnly() { return getRoleUser() === 'UserBisnis'; }
function isRolePribadiOnly() { return getRoleUser() === 'UserPribadi'; }
function bisaPakaiBisnis() { return getRoleRules().jenisKeuangan.includes('Bisnis'); }
function bisaPakaiPribadi() { return getRoleRules().jenisKeuangan.includes('Pribadi'); }

function pulihkanScrollApp() {
  // Kunci utamanya: saat app terbuka, yang scroll adalah #mainContent.
  // Jangan paksa mainContent overflow visible, itu penyebab scroll tengah mati.
  document.documentElement.style.overflowX = 'hidden';
  document.documentElement.style.overflowY = document.body.classList.contains('app-mode') ? 'hidden' : 'auto';
  document.documentElement.style.height = document.body.classList.contains('app-mode') ? '100%' : 'auto';

  document.body.style.overflowX = 'hidden';
  document.body.style.overflowY = document.body.classList.contains('app-mode') ? 'hidden' : 'auto';
  document.body.style.height = document.body.classList.contains('app-mode') ? '100dvh' : 'auto';
  document.body.style.paddingRight = '0px';

  document.body.classList.remove('swal2-shown');
  document.body.classList.remove('swal2-height-auto');
  document.body.classList.remove('swal2-no-backdrop');
  document.body.classList.remove('swal2-toast-shown');

  var splash = document.getElementById('splash');
  if (splash && splash.classList.contains('hidden')) {
    splash.style.display = 'none';
    splash.style.pointerEvents = 'none';
    splash.style.zIndex = '-9999';
  }

  var loginPage = document.getElementById('loginPage');
  if (document.body.classList.contains('app-mode') && loginPage) {
    loginPage.classList.add('hidden');
    loginPage.style.display = 'none';
    loginPage.style.pointerEvents = 'none';
    loginPage.style.zIndex = '-9999';
  }

  var globalModal = document.getElementById('globalModal');
  if (globalModal && globalModal.classList.contains('hidden')) {
    globalModal.style.display = 'none';
    globalModal.style.pointerEvents = 'none';
  }

  var bottomMore = document.getElementById('bottomMoreDrawer');
  if (bottomMore && bottomMore.classList.contains('hidden')) {
    bottomMore.style.pointerEvents = 'none';
  }

  var mainContent = document.getElementById('mainContent');
  if (mainContent) {
    if (document.body.classList.contains('app-mode')) {
      mainContent.style.overflowX = 'hidden';
      mainContent.style.overflowY = 'auto';
      mainContent.style.webkitOverflowScrolling = 'touch';
      mainContent.style.touchAction = 'pan-y';
    } else {
      mainContent.style.overflow = '';
      mainContent.style.overflowY = '';
    }
  }

  var pageContent = document.getElementById('pageContent');
  if (pageContent) {
    pageContent.style.overflow = 'visible';
    pageContent.style.overflowY = 'visible';
  }
}

// ============================================================
// BOOT — ANTI STUCK SPLASH
// ============================================================
var APP_BOOT_SUDAH_JALAN = false;

function bootAplikasiAwal() {
  if (APP_BOOT_SUDAH_JALAN) return;
  APP_BOOT_SUDAH_JALAN = true;
  setTimeout(function() { tutupSplashLaluCekSession(); }, 900);
}

function tutupSplashLaluCekSession() {
  var splash = document.getElementById('splash');
  function lanjut() {
    try { cekSession(); }
    catch (err) { console.error('ERROR saat cekSession:', err); paksaTampilLoginDariBoot(err); }
  }
  if (!splash) { lanjut(); return; }
  splash.style.transition = 'opacity 0.4s ease';
  splash.style.opacity = '0';
  setTimeout(function() {
    splash.classList.add('hidden');
    splash.style.display = 'none';
    lanjut();
  }, 450);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAplikasiAwal);
} else {
  bootAplikasiAwal();
}
window.addEventListener('load', bootAplikasiAwal);
setTimeout(bootAplikasiAwal, 3500);

function paksaTampilLoginDariBoot(err) {
  var splash = document.getElementById('splash');
  var loginPage = document.getElementById('loginPage');
  var app = document.getElementById('app');
  if (splash) { splash.classList.add('hidden'); splash.style.display = 'none'; }
  if (loginPage) loginPage.classList.remove('hidden');
  if (app) app.classList.add('hidden');
  document.body.className = 'login-mode';
  console.error('Boot fallback aktif:', err);
}

function cekSession() {
  var saved = sessionStorage.getItem('mt_user');
  if (saved) {
    try { STATE.user = JSON.parse(saved); applyUserTheme(); showApp(); }
    catch(e) { showLogin(); }
  } else {
    showLogin();
  }
}

function showLogin() {
  var loginPage = document.getElementById('loginPage');
  var app = document.getElementById('app');
  var topNav = document.getElementById('topNav');
  var sb = document.getElementById('subscriptionBanner');
  var rb = document.getElementById('readOnlyBanner');
  var audio = document.getElementById('appMusic');
  var splash = document.getElementById('splash');

  if (splash) {
    splash.classList.add('hidden');
    splash.style.display = 'none';
  }

  document.body.classList.remove('app-mode');
  document.body.classList.add('login-mode');

  if (loginPage) {
    loginPage.classList.remove('hidden');
    loginPage.style.display = 'flex';
    loginPage.style.pointerEvents = 'auto';
    loginPage.style.zIndex = '';
  }

  if (app) {
    app.classList.add('hidden');
    app.style.display = 'none';
  }

  if (topNav) {
    topNav.classList.add('hidden');
    topNav.style.display = 'none';
  }

  if (sb) sb.classList.add('hidden');
  if (rb) rb.classList.add('hidden');
  if (audio) audio.pause();

  pulihkanScrollApp();
}

function showApp() {
  var loginPage = document.getElementById('loginPage');
  var app = document.getElementById('app');
  var topNav = document.getElementById('topNav');
  var splash = document.getElementById('splash');

  if (splash) {
    splash.classList.add('hidden');
    splash.style.display = 'none';
  }

  document.body.classList.remove('login-mode');
  document.body.classList.add('app-mode');

  if (loginPage) {
    loginPage.classList.add('hidden');
    loginPage.style.display = 'none';
  }

  if (app) {
    app.classList.remove('hidden');
    app.style.display = 'flex';
  }

  if (topNav) {
    topNav.classList.remove('hidden');
    topNav.style.display = 'flex';
  }

  pulihkanScrollApp();

  try {
    setupSidebar();
    setupTopbar();
    aturReadOnlyMode();
    navigateTo('dashboard');
    initMusic();

    setTimeout(function() {
      tampilInfoLangganan();
      tampilPesanLoginAdmin();
      initMagneticButtons();
      initPullToRefresh();
      pulihkanScrollApp();
    }, 400);

  } catch (err) {
    console.error('ERROR showApp:', err);
    paksaTampilLoginDariBoot(err);
  }
}

// ============================================================
// SETUP TOPBAR
// ============================================================
function updateTopThemeIcon() {
  var icon = document.getElementById('topThemeIcon');
  var btn = document.getElementById('topThemeBtn');

  if (!icon || !btn) return;

  if (STATE.theme === 'light') {
    icon.className = 'ri-moon-line';
    btn.title = 'Ganti ke Mode Gelap';
  } else {
    icon.className = 'ri-sun-line';
    btn.title = 'Ganti ke Mode Terang';
  }
}

function toggleTopTheme() {
  var jadiDark = STATE.theme === 'light';
  ubahTheme(jadiDark);
}

function setupTopbar() {
  if (!STATE.user) return;
  var topbarNama = document.getElementById('topbarNama');
  var topbarRole = document.getElementById('topbarRole');
  var topbarAvatar = document.getElementById('topbarAvatar');
  var statusDot = document.getElementById('topnavStatusDot');
  var hamburgerBtn = document.getElementById('topnavHamburger');
  if (topbarNama) topbarNama.textContent = STATE.user.nama || '-';
  if (topbarRole) topbarRole.textContent = STATE.user.role || 'User';
  if (topbarAvatar) {
    topbarAvatar.style.background = STATE.warna;
    setAvatarElement(topbarAvatar, STATE.user.nama, STATE.user.fotoProfil);
  }
  if (statusDot) {
    var sl = STATE.user.statusLangganan || 'Aktif';
    statusDot.className = 'topnav-status-dot';
    if (sl === 'Akan Habis' || sl === 'Grace Period') statusDot.classList.add('warn');
    else if (sl === 'Habis') statusDot.classList.add('danger');
  }
  if (hamburgerBtn) {
    hamburgerBtn.style.display = window.innerWidth <= 768 ? 'none' : 'flex';
  }
    updateTopThemeIcon();
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function doLogin() {
  var username = document.getElementById('inputUsername').value.trim();
  var password = document.getElementById('inputPassword').value.trim();
  if (!username || !password) { showToast('Username dan password wajib diisi.', 'error'); return; }
  var btn = document.getElementById('btnLogin');
  btn.disabled = true;
  google.script.run
    .withSuccessHandler(function(res) {
      btn.disabled = false;
      var r = JSON.parse(res);
      if (r.status === 'success') {
        STATE.user = r.data;
        sessionStorage.setItem('mt_user', JSON.stringify(r.data));
        applyUserTheme();
        showToast('Selamat datang, ' + r.data.nama + '!', 'success');
        showApp();
      } else {
        showToast(r.pesan, 'error');
        var loginCard = document.getElementById('loginCard');
        if (loginCard) {
          loginCard.classList.add('shake');
          setTimeout(function() { loginCard.classList.remove('shake'); }, 600);
        }
      }
    })
    .withFailureHandler(function() {
      btn.disabled = false;
      showToast('Gagal terhubung ke server.', 'error');
    })
    .login(username, password);
}

function doLogout() {
  closeProfileDropdown();
  swalFire({
    title: 'Logout?',
    text: 'Yakin ingin keluar dari aplikasi?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal'
  }).then(function(result) {
    if (result.isConfirmed) {
      STATE.user = null;
      sessionStorage.removeItem('mt_user');
      Object.values(STATE.chartInstances).forEach(function(c) { if(c) c.destroy(); });
      STATE.chartInstances = {};
      showLogin();
      showToast('Berhasil logout.', 'info');
    }
  });
}

function togglePwd() {
  var inp = document.getElementById('inputPassword');
  var btn = document.getElementById('eyeBtn');
  if (!inp || !btn) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerHTML = '<i class="ri-eye-line"></i>';
  } else {
    inp.type = 'password';
    btn.innerHTML = '<i class="ri-eye-off-line"></i>';
  }
}

document.addEventListener('keydown', function(e) {
  var loginPage = document.getElementById('loginPage');
  if (e.key === 'Enter' && loginPage && !loginPage.classList.contains('hidden')) {
    doLogin();
  }
});

// ============================================================
// THEME
// ============================================================
function hexToRgb(hex) {
  hex = String(hex || '#00ff99').replace('#', '').trim();

  if (hex.length === 3) {
    hex = hex.split('').map(function(c) {
      return c + c;
    }).join('');
  }

  var num = parseInt(hex, 16);
  if (isNaN(num)) return '0,255,153';

  return ((num >> 16) & 255) + ',' + ((num >> 8) & 255) + ',' + (num & 255);
}

function applyThemeVars() {
  var warna = STATE.warna || '#00ff99';
  var rgb = hexToRgb(warna);

  document.documentElement.setAttribute('data-theme', STATE.theme);
  document.documentElement.style.setProperty('--neon', warna, 'important');
  document.documentElement.style.setProperty('--neon-rgb', rgb, 'important');
  document.documentElement.style.setProperty('--neon-soft', 'rgba(' + rgb + ',0.12)', 'important');
  document.documentElement.style.setProperty('--neon-border', 'rgba(' + rgb + ',0.28)', 'important');
  document.documentElement.style.setProperty('--neon-shadow', 'rgba(' + rgb + ',0.30)', 'important');

  if (document.body) {
    document.body.setAttribute('data-theme', STATE.theme);
  }

  var metaTheme = document.querySelector('meta[name="theme-color"]');

  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }

  metaTheme.setAttribute(
    'content',
    STATE.theme === 'light' ? '#f0f2f5' : '#05070d'
  );
}

function applyUserTheme() {
  if (!STATE.user) return;

  STATE.theme = STATE.user.tema || 'dark';
  STATE.warna = STATE.user.warna || '#00ff99';

  applyThemeVars();
}

function setTheme(theme) {
  STATE.theme = theme;

  if (STATE.user) {
    STATE.user.tema = theme;
    sessionStorage.setItem('mt_user', JSON.stringify(STATE.user));
  }

  applyThemeVars();

  if (typeof updateTopThemeIcon === 'function') {
    updateTopThemeIcon();
  }

  setTimeout(function() {
    if (STATE.currentPage === 'dashboard') renderDashboard();
    if (STATE.currentPage === 'laporan') loadLaporan();
  }, 100);
}

function setWarna(warna) {
  STATE.warna = warna || '#00ff99';

  if (STATE.user) {
    STATE.user.warna = STATE.warna;
    sessionStorage.setItem('mt_user', JSON.stringify(STATE.user));
  }

  applyThemeVars();

  var topbarAvatar = document.getElementById('topbarAvatar');
  if (topbarAvatar) topbarAvatar.style.background = STATE.warna;

  var profilAvatar = document.getElementById('profilAvatar');
  if (profilAvatar) profilAvatar.style.background = STATE.warna;

  setTimeout(function() {
    if (STATE.currentPage === 'dashboard') renderDashboard();
    if (STATE.currentPage === 'laporan') loadLaporan();
  }, 100);
}

// ============================================================
// SIDEBAR
// ============================================================
function setupSidebar() {
  if (!STATE.user) return;
  document.querySelectorAll('.nav-item[data-page]').forEach(function(el) {
    var span = el.querySelector('span');
    if (span) el.setAttribute('data-tooltip', span.textContent);
  });
  aturAksesMenuByRole();
}

function aturAksesMenuByRole() {
  document.querySelectorAll('.nav-item[data-page], .bn-item[data-page], .bm-item[data-page]').forEach(function(el) {
    var page = el.getAttribute('data-page');
    if (bolehAksesPage(page)) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
  if (getRoleUser() !== 'Admin') {
    document.querySelectorAll('.admin-only').forEach(function(el) { el.classList.add('hidden'); });
  } else {
    document.querySelectorAll('.admin-only').forEach(function(el) { el.classList.remove('hidden'); });
  }
}

function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var hamburger = document.getElementById('topnavHamburger');
  var w = window.innerWidth;
  if (!sidebar) return;
  if (w <= 768) {
    sidebar.classList.toggle('mobile-open');
    STATE.sidebarOpen = sidebar.classList.contains('mobile-open');
    return;
  }
  sidebar.classList.toggle('compact');
  if (hamburger) hamburger.classList.toggle('is-open', !sidebar.classList.contains('compact'));
  var main = document.getElementById('mainContent');
  if (main) {
    main.style.marginLeft = !sidebar.classList.contains('compact') ? 'var(--sidebar-w)' : 'var(--sidebar-compact)';
  }
}

function closeSidebar() {
  var sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');
  STATE.sidebarOpen = false;
}

function tutupBottomMore() {
  var drawer = document.getElementById('bottomMoreDrawer');
  var backdrop = document.getElementById('bottomMoreBackdrop');

  if (drawer) {
    drawer.classList.remove('visible-drawer');
    drawer.classList.add('hidden');
    drawer.style.pointerEvents = 'none';
  }

  if (backdrop) {
    backdrop.classList.add('hidden');
    backdrop.style.pointerEvents = 'none';
  }

  document.body.classList.remove('bottom-more-open');
}

function bukaBottomMore() {
  var drawer = document.getElementById('bottomMoreDrawer');
  var backdrop = document.getElementById('bottomMoreBackdrop');
  if (!drawer) return;

  drawer.classList.remove('hidden');
  drawer.style.pointerEvents = 'auto';
  drawer.offsetHeight; // force reflow, karena CSS juga kadang butuh ditampar pelan.
  drawer.classList.add('visible-drawer');

  if (backdrop) {
    backdrop.classList.remove('hidden');
    backdrop.style.pointerEvents = 'auto';
  }

  document.body.classList.add('bottom-more-open');
}

function toggleBottomMore(event) {
  if (event && event.stopPropagation) event.stopPropagation();

  var drawer = document.getElementById('bottomMoreDrawer');
  if (!drawer) return;

  var isOpen = drawer.classList.contains('visible-drawer') && !drawer.classList.contains('hidden');
  if (isOpen) tutupBottomMore();
  else bukaBottomMore();
}

// Tutup drawer kalau user klik area luar atau tombol menu di dalamnya.
document.addEventListener('click', function(e) {
  var drawer = document.getElementById('bottomMoreDrawer');
  if (!drawer || drawer.classList.contains('hidden')) return;

  var target = e.target;
  var klikDiDrawer = drawer.contains(target);
  var klikTombolLainnya = target.closest && target.closest('.bn-item[onclick*="toggleBottomMore"]');

  if (!klikDiDrawer && !klikTombolLainnya) {
    tutupBottomMore();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') tutupBottomMore();
});

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(page) {
  try {
    if (!page) page = 'dashboard';
    if (!bolehAksesPage(page)) {
      showToast('Halaman ini tidak tersedia untuk role kamu.', 'warning');
      page = 'dashboard';
    }
    STATE.currentPage = page;
    closeSidebar();
    tutupBottomMore();
    var activePage = page;

    if (page === 'kelolausers' || page === 'settingweb') {
      activePage = 'adminsetting';
    }

    document.querySelectorAll('.nav-item[data-page]').forEach(function(el) {
      el.classList.toggle('active', el.getAttribute('data-page') === activePage);
    });

    document.querySelectorAll('.bn-item[data-page]').forEach(function(el) {
      el.classList.toggle('active', el.getAttribute('data-page') === activePage);
    });

    document.querySelectorAll('.bm-item[data-page]').forEach(function(el) {
      el.classList.toggle('active', el.getAttribute('data-page') === activePage);
    });
    Object.keys(STATE.chartInstances || {}).forEach(function(k) {
      if (STATE.chartInstances[k]) { STATE.chartInstances[k].destroy(); delete STATE.chartInstances[k]; }
    });
    var content = document.getElementById('pageContent');
    if (!content) { console.error('pageContent tidak ditemukan.'); return; }
    content.innerHTML = renderSkeleton();
    var mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.scrollTop = 0;
  setTimeout(function() {
    switch(page) {
      case 'dashboard': renderDashboard(); break;
      case 'transaksi': renderTransaksi(); break;
      case 'akun': renderAkun(); break;
      case 'kategori': renderKategori(); break;
      case 'laporan': renderLaporan(); break;
      case 'budget': renderBudget(); break;
      case 'pelanggan': renderPelanggan(); break;
      case 'pembayaran': renderPembayaran(); break;
      case 'strukmanual': renderStrukManual(); break;
      case 'botlog': renderBotLog(); break;
      case 'pengaturan': renderPengaturan(); break;
      case 'adminsetting': renderAdminSetting(); break;
      case 'admincenter': renderAdminSetting(); break;
      case 'kelolausers': renderKelolaUser(); break;
      case 'settingweb': renderSettingWeb(); break;
      case 'profil': renderProfil(); break;
      default: content.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-question-mark"></i></div><div class="empty-title">Halaman tidak ditemukan</div></div>';
    }

    setTimeout(pulihkanScrollApp, 300);
  }, 300);
  } catch (err) {
    console.error('ERROR NAVIGATE:', err);
    var content = document.getElementById('pageContent');
    if (content) {
      content.innerHTML = '<div class="page-content"><div class="empty-state"><div class="empty-icon"><i class="ri-error-warning-line"></i></div><div class="empty-title">Navigasi Error</div><div class="empty-desc">' + escapeHtmlText(err.message || String(err)) + '</div></div></div>';
    }
  }
}

function tampilkanErrorHalaman(judul, pesan) {
  var content = document.getElementById('pageContent');
  if (!content) return;
  content.innerHTML =
    '<div class="page-content">' +
      '<div class="empty-state">' +
        '<div class="empty-icon"><i class="ri-error-warning-line"></i></div>' +
        '<div class="empty-title">' + escapeHtmlText(judul || 'Terjadi Error') + '</div>' +
        '<div class="empty-desc" style="max-width:600px;line-height:1.6">' + escapeHtmlText(pesan || 'Tidak ada detail error.') + '</div>' +
        '<button class="btn btn-primary" onclick="navigateTo(STATE.currentPage || \'dashboard\')">' +
          '<i class="ri-refresh-line"></i> Coba Lagi' +
        '</button>' +
      '</div>' +
    '</div>';
}

function renderSkeleton() {
  return '<div class="page-content">' +
    '<div class="skeleton sk-card" style="height:56px;margin-bottom:24px;border-radius:10px"></div>' +
    '<div class="grid-4 stagger-in">' +
    '<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>' +
    '<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>' +
    '</div>' +
    '<div class="skeleton sk-card" style="height:240px;margin-top:20px"></div>' +
    '</div>';
}

function setPageLoading(isLoading, pesan) {
  var old = document.getElementById('pageMiniLoader');
  if (old) old.remove();
}

function setButtonLoading(btn, isLoading, loadingText) {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.oldHtml = btn.innerHTML;
    btn.disabled = true;
  } else {
    btn.disabled = false;
    if (btn.dataset.oldHtml) btn.innerHTML = btn.dataset.oldHtml;
  }
}

function refreshHalamanAktif() {
  var p = STATE.currentPage || 'dashboard';
  if (p === 'dashboard') return renderDashboard();
  if (p === 'transaksi') return loadTransaksi(true);
  if (p === 'akun') return loadAkun();
  if (p === 'kategori') return loadKategori();
  if (p === 'laporan') return loadLaporan();
  if (p === 'budget') return loadBudget();
  if (p === 'pelanggan') return loadPelanggan();
  if (p === 'pembayaran') return loadPembayaran();
  if (p === 'strukmanual') return renderStrukManual();
  if (p === 'botlog') return loadBotLog();
  if (p === 'settingweb') return loadSettingWeb();
  if (p === 'kelolausers') return loadUsers();
  return navigateTo(p);
}

function initPullToRefresh() {
  var main = document.getElementById('mainContent');
  if (!main || main.dataset.pullRefreshReady === 'true') return;
  main.dataset.pullRefreshReady = 'true';

  var indicator = document.getElementById('pullRefreshIndicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'pullRefreshIndicator';
    indicator.className = 'pull-refresh-indicator';
    indicator.innerHTML = '<i class="ri-refresh-line"></i><span>Tarik untuk refresh</span>';
    document.body.appendChild(indicator);
  }

  main.addEventListener('touchstart', function(e) {
    if (window.innerWidth > 768 || main.scrollTop > 2 || document.body.classList.contains('modal-open')) return;
    PULL_REFRESH_STATE.startY = e.touches[0].clientY;
    PULL_REFRESH_STATE.active = true;
    PULL_REFRESH_STATE.pulled = false;
  }, { passive: true });

  main.addEventListener('touchmove', function(e) {
    if (!PULL_REFRESH_STATE.active || window.innerWidth > 768) return;
    var diff = e.touches[0].clientY - PULL_REFRESH_STATE.startY;
    if (diff <= 0) return;
    var amount = Math.min(diff, 96);
    indicator.style.transform = 'translateX(-50%) translateY(' + amount + 'px)';
    indicator.classList.add('visible');
    indicator.querySelector('span').textContent = diff > 72 ? 'Lepas untuk refresh' : 'Tarik untuk refresh';
    PULL_REFRESH_STATE.pulled = diff > 72;
  }, { passive: true });

  main.addEventListener('touchend', function() {
    if (!PULL_REFRESH_STATE.active) return;
    var shouldRefresh = PULL_REFRESH_STATE.pulled;
    PULL_REFRESH_STATE.active = false;
    PULL_REFRESH_STATE.pulled = false;
    indicator.classList.remove('visible');
    indicator.style.transform = '';
    if (shouldRefresh) {
      showToast('Memperbarui halaman...', 'info');
      refreshHalamanAktif();
    }
  }, { passive: true });
}


// ============================================================
// HELPER UTILITIES
// ============================================================
function kecilkanAvatarUrl(fotoUrl) {
  if (!fotoUrl) return '';
  var url = String(fotoUrl);
  if (url.indexOf('drive.google.com/thumbnail') === -1) return url;
  if (/[?&]sz=w\d+/i.test(url)) return url.replace(/([?&]sz=)w\d+/i, '$1w96');
  return url + (url.indexOf('?') === -1 ? '?' : '&') + 'sz=w96';
}

function setAvatarElement(el, nama, fotoUrl) {
  if (!el) return;
  el.innerHTML = '';
  if (fotoUrl) {
    var img = document.createElement('img');
    img.src = kecilkanAvatarUrl(fotoUrl);
    img.className = 'avatar-img';
    img.alt = 'Foto Profil';
    img.onload = function() { el.innerHTML = ''; el.appendChild(img); };
    img.onerror = function() { el.innerHTML = ''; el.textContent = getInitial(nama); };
    el.appendChild(img);
  } else {
    el.textContent = getInitial(nama);
  }
}

function namaUserAktif() {
  if (!STATE.user) return '-';
  return STATE.user.nama || STATE.user.namaLengkap || STATE.user.username || '-';
}

function bukaDokumenPrint(judul, html) {
  var w = window.open('', '_blank');
  if (!w) {
    showToast('Popup print diblokir browser.', 'warning');
    return;
  }

  w.document.open();
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtmlText(judul) + '</title>' +
    '<style>' +
    '@page{size:A4;margin:24mm 22mm 24mm 22mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111827;margin:0;font-size:12px;line-height:1.45}.doc-page{width:100%;padding:4mm 2mm}.doc-head{border-bottom:2px solid #111827;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;gap:20px}.doc-brand{font-size:20px;font-weight:800}.doc-title{font-size:16px;font-weight:700;margin-top:4px}.doc-meta{text-align:right;color:#4b5563}.section{margin:18px 0}.section h2{font-size:13px;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px;border-bottom:1px solid #d1d5db;padding-bottom:6px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.box{border:1px solid #d1d5db;border-radius:6px;padding:10px}.box-label{font-size:10px;text-transform:uppercase;color:#6b7280;margin-bottom:6px}.box-value{font-size:15px;font-weight:800}.green{color:#047857}.red{color:#dc2626}.muted{color:#6b7280}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #d1d5db;padding:6px 7px;text-align:left;vertical-align:top}th{background:#f3f4f6;font-size:10px;text-transform:uppercase}td.num{text-align:right;white-space:nowrap}.sign{font-weight:700}.foot{margin-top:28px;display:flex;justify-content:flex-end}.signbox{text-align:center;width:180px}.signline{margin-top:52px;border-top:1px solid #111827;padding-top:6px}@media print{button{display:none}.doc-page{padding:0}}' +
    '</style></head><body><main class="doc-page">' + html + '</main><script>setTimeout(function(){window.print();},250)<\/script></body></html>');
  w.document.close();
}


function labelFilterLaporan() {
  if (!LAST_LAPORAN_FILTER) return '-';
  if (LAST_LAPORAN_FILTER.mode === 'semua') return 'Semua Data';
  var bulanNama = new Date(2000, Number(LAST_LAPORAN_FILTER.bulan || 1) - 1, 1).toLocaleDateString('id-ID', { month: 'long' });
  return bulanNama + ' ' + LAST_LAPORAN_FILTER.tahun;
}

function modalPrintLaporan() {
  var now = new Date();
  var currentBulan = LAST_LAPORAN_FILTER && LAST_LAPORAN_FILTER.bulan ? LAST_LAPORAN_FILTER.bulan : (now.getMonth() + 1);
  var currentTahun = LAST_LAPORAN_FILTER && LAST_LAPORAN_FILTER.tahun ? LAST_LAPORAN_FILTER.tahun : now.getFullYear();
  var tahunOptions = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(function(y) {
    return '<option value="' + y + '"' + (Number(y) === Number(currentTahun) ? ' selected' : '') + '>' + y + '</option>';
  }).join('');

  openModal('Cetak Laporan',
    '<div class="form-group"><label>Periode Cetak</label><select class="form-control" id="printLapMode" onchange="aturFormPrintLaporan()">' +
      '<option value="filter">Sesuai data yang tampil</option>' +
      '<option value="bulan">Bulan tertentu</option>' +
      '<option value="tahun">Tahun tertentu</option>' +
      '<option value="semua">Semua data</option>' +
      '<option value="custom">Custom range tanggal</option>' +
    '</select></div>' +
    '<div class="form-row" id="printLapBulanRow">' +
      '<div class="form-group" id="printLapBulanGroup"><label>Bulan</label><select class="form-control" id="printLapBulan">' + [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) { return '<option value="' + m + '"' + (Number(m) === Number(currentBulan) ? ' selected' : '') + '>' + new Date(2000, m - 1, 1).toLocaleDateString('id-ID', { month: 'long' }) + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-group" id="printLapTahunGroup"><label>Tahun</label><select class="form-control" id="printLapTahun">' + tahunOptions + '</select></div>' +
    '</div>' +
    '<div class="form-row hidden" id="printLapCustomRow">' +
      '<div class="form-group"><label>Dari Tanggal</label><input type="date" class="form-control" id="printLapStart"></div>' +
      '<div class="form-group"><label>Sampai Tanggal</label><input type="date" class="form-control" id="printLapEnd"></div>' +
    '</div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="cetakLaporanDenganFilter()"><i class="ri-printer-line"></i> Cetak</button>'
  );
  aturFormPrintLaporan();
}

function aturFormPrintLaporan() {
  var mode = document.getElementById('printLapMode') ? document.getElementById('printLapMode').value : 'filter';
  var bulanRow = document.getElementById('printLapBulanRow');
  var bulanGroup = document.getElementById('printLapBulanGroup');
  var customRow = document.getElementById('printLapCustomRow');
  if (bulanRow) bulanRow.classList.toggle('hidden', mode === 'semua' || mode === 'custom' || mode === 'filter');
  if (bulanGroup) bulanGroup.classList.toggle('hidden', mode === 'tahun');
  if (customRow) customRow.classList.toggle('hidden', mode !== 'custom');
}

function labelPeriodePrintLaporan(cfg) {
  cfg = cfg || {};
  if (cfg.mode === 'semua') return 'Semua Data';
  if (cfg.mode === 'tahun') return 'Tahun ' + cfg.tahun;
  if (cfg.mode === 'custom') return tanggalIndo(cfg.start) + ' - ' + tanggalIndo(cfg.end);
  var bulanNama = new Date(2000, Number(cfg.bulan || 1) - 1, 1).toLocaleDateString('id-ID', { month: 'long' });
  return bulanNama + ' ' + cfg.tahun;
}

function ambilConfigPrintLaporan() {
  var mode = document.getElementById('printLapMode') ? document.getElementById('printLapMode').value : 'filter';
  if (mode === 'filter' && LAST_LAPORAN_FILTER) {
    return {
      mode: LAST_LAPORAN_FILTER.mode === 'semua' ? 'semua' : 'bulan',
      bulan: LAST_LAPORAN_FILTER.bulan,
      tahun: LAST_LAPORAN_FILTER.tahun
    };
  }
  return {
    mode: mode,
    bulan: document.getElementById('printLapBulan') ? document.getElementById('printLapBulan').value : '',
    tahun: document.getElementById('printLapTahun') ? document.getElementById('printLapTahun').value : '',
    start: document.getElementById('printLapStart') ? document.getElementById('printLapStart').value : '',
    end: document.getElementById('printLapEnd') ? document.getElementById('printLapEnd').value : ''
  };
}

function filterTransaksiPrint(list, cfg) {
  cfg = cfg || {};
  return (list || []).filter(function(t) {
    var d = ambilTanggalTransaksi(t);
    if (!d) return false;
    if (cfg.mode === 'bulan') return d.getMonth() + 1 === Number(cfg.bulan) && d.getFullYear() === Number(cfg.tahun);
    if (cfg.mode === 'tahun') return d.getFullYear() === Number(cfg.tahun);
    if (cfg.mode === 'custom') {
      var start = cfg.start ? new Date(cfg.start + 'T00:00:00') : null;
      var end = cfg.end ? new Date(cfg.end + 'T23:59:59') : null;
      if (start && d < start) return false;
      if (end && d > end) return false;
    }
    return true;
  });
}

function profileUserValue(keys, fallback) {
  var user = STATE.user || {};
  for (var i = 0; i < keys.length; i++) {
    var v = user[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return fallback === undefined ? '-' : fallback;
}

function profileStatusText() {
  var mode = profileUserValue(['modeAkses'], '');
  var status = profileUserValue(['statusLangganan', 'status'], 'Aktif');
  return mode === 'ReadOnly' ? 'Read Only' : status;
}

function profileDropdownHeader() {
  var nama = profileUserValue(['nama', 'namaLengkap'], '-');
  var username = profileUserValue(['username', 'email'], '-');
  var role = profileUserValue(['role'], 'User');
  var status = profileStatusText();
  return '<div class="profile-dropdown-header">' +
    '<div class="profile-dropdown-avatar" id="profilAvatar"></div>' +
    '<div class="profile-dropdown-name">' + escapeHtmlText(nama) + '</div>' +
    '<div class="profile-dropdown-username">@' + escapeHtmlText(username) + '</div>' +
    '<div class="profile-dropdown-badges">' +
      '<span class="profile-dropdown-badge">' + escapeHtmlText(role) + '</span>' +
      '<span class="profile-dropdown-badge muted">' + escapeHtmlText(status) + '</span>' +
    '</div>' +
  '</div>';
}

function profileDropdownMenu(active) {
  function item(view, icon, label) {
    return '<button type="button" class="profile-dropdown-item' + (active === view ? ' active' : '') + '" onclick="renderProfileDropdown(\'' + view + '\')"><i class="' + icon + '"></i><span>' + label + '</span><i class="ri-arrow-right-s-line"></i></button>';
  }
  return '<div class="profile-dropdown-menu">' +
    item('info', 'ri-user-3-line', 'Informasi Akun') +
    item('keamanan', 'ri-shield-keyhole-line', 'Keamanan') +
    item('pengaturan', 'ri-equalizer-line', 'Pengaturan') +
    item('bantuan', 'ri-question-line', 'Bantuan') +
  '</div>' +
  '<button type="button" class="logout-profile-btn" onclick="closeProfileDropdown(); doLogout();"><i class="ri-logout-box-r-line"></i><span>Keluar</span></button>';
}

function profileInfoView() {
  var user = STATE.user || {};
  var rows = [
    ['Nama', profileUserValue(['nama', 'namaLengkap'])],
    ['Username', profileUserValue(['username'])],
    ['Email', profileUserValue(['email'])],
    ['Nomor WA Bot', profileUserValue(['noWa', 'nomorWa', 'No WA'], '-')],
    ['Role', profileUserValue(['role'])],
    ['Status Akun', profileUserValue(['status'], 'Aktif')],
    ['Langganan', profileUserValue(['statusLangganan'], '-')],
    ['Berakhir', profileUserValue(['berakhirLangganan', 'graceSampai'], '-')],
    ['Mode Akses', profileUserValue(['modeAkses'], 'Normal')],
    ['Dibuat', profileUserValue(['createdAt', 'Created At', 'Tanggal Dibuat'], '-')]
  ];
  return '<div class="profile-settings-section">' +
    '<div class="profile-section-title">Informasi Akun</div>' +
    rows.map(function(r) { return '<div class="profile-info-row"><span>' + escapeHtmlText(r[0]) + '</span><strong>' + escapeHtmlText(r[1]) + '</strong></div>'; }).join('') +
    '<div class="profile-section-title small">Foto Profil</div>' +
    '<div class="form-group"><label>Upload Foto</label><input type="file" class="form-control" id="inputFotoProfil" accept="image/*" onchange="previewFotoProfil()"></div>' +
    '<button class="btn btn-primary btn-sm" onclick="uploadFotoProfilUser()"><i class="ri-upload-cloud-line"></i> Upload Foto</button>' +
    '<div class="profile-section-title small">Edit Nama</div>' +
    '<div class="form-group"><label>Nama Lengkap</label><input type="text" class="form-control" id="profNama" value="' + escapeHtmlAttr(user.nama || '') + '"></div>' +
    '<div class="form-group"><label>Nomor WA untuk Bot</label><input type="tel" class="form-control" id="profNoWa" value="' + escapeHtmlAttr(user.noWa || '') + '" placeholder="62812xxxx"></div>' +
    '<button class="btn btn-secondary btn-sm" onclick="simpanProfil()"><i class="ri-save-line"></i> Simpan Profil</button>' +
  '</div>';
}

function profileKeamananView() {
  return '<div class="profile-settings-section">' +
    '<div class="profile-section-title">Keamanan</div>' +
    '<div class="profile-security-card"><i class="ri-shield-check-line"></i><div><strong>Status keamanan akun</strong><span>Login aktif dan sesi tersimpan di perangkat ini.</span></div></div>' +
    '<div class="form-group"><label>Password Baru</label><input type="password" class="form-control" id="profPassword" placeholder="Kosongkan jika tidak diganti"></div>' +
    '<button class="btn btn-primary btn-sm" onclick="simpanProfil()"><i class="ri-key-2-line"></i> Simpan Password</button>' +
    '<div class="profile-note">Fitur keamanan lanjutan menyusul.</div>' +
  '</div>';
}

function profilePengaturanView() {
  var isDark = STATE.theme !== 'light';
  var colors = ['#00ff99','#00d5ff','#b84cff','#ff4560','#ff9f43','#00d68f','#ffd32a','#ff6b81'];
  return '<div class="profile-settings-section">' +
    '<div class="profile-section-title">Pengaturan</div>' +
    '<div class="settings-row compact"><div><div class="settings-label">Mode Gelap</div><div class="settings-desc">Ganti tampilan dark atau light.</div></div><label class="toggle"><input type="checkbox" id="profileThemeToggle"' + (isDark ? ' checked' : '') + ' onchange="ubahTheme(this.checked)"><span class="toggle-slider"></span></label></div>' +
    '<div class="profile-section-title small">Warna Aksen</div>' +
    '<div class="accent-color-picker">' +
      colors.map(function(c) { return '<button type="button" class="accent-color-dot' + (c === STATE.warna ? ' active' : '') + '" style="background:' + c + '" onclick="ubahWarna(\'' + c + '\', this)" aria-label="Pilih warna aksen"></button>'; }).join('') +
    '</div>' +
    '<div class="settings-row compact"><div><div class="settings-label">Musik</div><div class="settings-desc">Kontrol musik tetap dari tombol melayang.</div></div><button type="button" class="btn btn-secondary btn-sm" onclick="toggleMusic()"><i class="ri-music-2-line"></i></button></div>' +
  '</div>';
}

function profileBantuanView() {
  return '<div class="profile-settings-section">' +
    '<div class="profile-section-title">Bantuan</div>' +
    '<div class="profile-note">Butuh bantuan? Hubungi admin atau gunakan tombol WhatsApp saat langganan bermasalah.</div>' +
    '<a class="btn btn-secondary btn-sm" href="' + escapeHtmlAttr(buatLinkWA(profileUserValue(['username'], ''))) + '" target="_blank" rel="noopener"><i class="ri-whatsapp-line"></i> Hubungi Admin</a>' +
  '</div>';
}

function renderProfileDropdown(view) {
  var panel = document.getElementById('profileDropdown');
  if (!panel || !STATE.user) return;
  view = view || 'info';
  var body = view === 'keamanan' ? profileKeamananView() : view === 'pengaturan' ? profilePengaturanView() : view === 'bantuan' ? profileBantuanView() : profileInfoView();
  panel.innerHTML = profileDropdownHeader() + profileDropdownMenu(view) + body;
  var avatar = document.getElementById('profilAvatar');
  if (avatar) {
    avatar.style.background = STATE.warna;
    setAvatarElement(avatar, STATE.user.nama, STATE.user.fotoProfil);
  }
}

function openProfileDropdown(view) {
  var panel = document.getElementById('profileDropdown');
  var trigger = document.querySelector('.topnav-user');
  if (!panel) return;
  renderProfileDropdown(view || 'info');
  panel.classList.remove('hidden');
  panel.classList.add('show');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
}

function closeProfileDropdown() {
  var panel = document.getElementById('profileDropdown');
  var trigger = document.querySelector('.topnav-user');
  if (!panel) return;
  panel.classList.remove('show');
  panel.classList.add('hidden');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function toggleProfileDropdown(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  tutupBottomMore();
  var panel = document.getElementById('profileDropdown');
  if (panel && panel.classList.contains('show')) closeProfileDropdown();
  else openProfileDropdown('info');
}

document.addEventListener('click', function(e) {
  var panel = document.getElementById('profileDropdown');
  if (!panel || !panel.classList.contains('show')) return;
  var target = e.target;
  if (target.closest && (target.closest('#profileDropdown') || target.closest('.topnav-user'))) return;
  closeProfileDropdown();
});

function ringkasanPrintTransaksi(list) {
  var masuk = 0;
  var keluar = 0;
  (list || []).forEach(function(t) {
    var nominal = angkaNominal(txnAmbilNominal(t));
    if (txnApakahTransfer(t)) return;
    if (txnApakahMasuk(t)) masuk += nominal;
    else keluar += nominal;
  });
  return { pemasukan: masuk, pengeluaran: keluar, sisa: masuk - keluar, jumlah: (list || []).length };
}

function barisPrintTransaksi(list, jenisKeuangan) {
  var data = (list || []).filter(function(t) { return txnJenisKeuangan(t) === jenisKeuangan; });
  var colspan = jenisKeuangan === 'Bisnis' ? 9 : 8;
  if (!data.length) return '<tr><td colspan="' + colspan + '" class="muted">Tidak ada transaksi ' + escapeHtmlText(jenisKeuangan.toLowerCase()) + '.</td></tr>';
  return data.map(function(t, i) {
    var nominalClass = txnApakahTransfer(t) ? '' : (txnApakahMasuk(t) ? 'green' : 'red');
    var tanda = txnApakahTransfer(t) ? '' : (txnApakahMasuk(t) ? '+' : '-');
    var cells = [
      '<td>' + (i + 1) + '</td>',
      '<td>' + escapeHtmlText(tanggalIndo(t['Tanggal'] || t.tanggal)) + '</td>',
      '<td>' + escapeHtmlText(txnAmbilTipe(t)) + '</td>',
      '<td>' + escapeHtmlText(txnAmbilKategori(t)) + '</td>',
      '<td>' + escapeHtmlText(txnAmbilAkunUtama(t)) + '</td>'
    ];
    if (jenisKeuangan === 'Bisnis') cells.push('<td>' + escapeHtmlText(txnAmbilPelanggan(t) || '-') + '</td>');
    cells.push('<td class="num ' + nominalClass + '">' + tanda + rupiah(txnAmbilNominal(t)) + '</td>');
    cells.push('<td>' + escapeHtmlText(txnAmbilStatus(t)) + '</td>');
    cells.push('<td>' + escapeHtmlText(formatKeteranganPrint(txnBersihKeterangan(t), KETERANGAN_LIMIT_PRINT)) + '</td>');
    return '<tr>' + cells.join('') + '</tr>';
  }).join('');
}

function renderDokumenLaporanTransaksi(list, cfg) {
  var summary = ringkasanPrintTransaksi(list);
  var role = STATE.user && STATE.user.role ? STATE.user.role : '-';
  var html =
    '<div class="doc-head"><div><div class="doc-brand">MoneyTrack 2026</div><div class="doc-title">Laporan Keuangan</div></div>' +
    '<div class="doc-meta">Nama: <strong>' + escapeHtmlText(namaUserAktif()) + '</strong><br>Role: ' + escapeHtmlText(role) + '<br>Periode: ' + escapeHtmlText(labelPeriodePrintLaporan(cfg)) + '<br>Dicetak: ' + escapeHtmlText(new Date().toLocaleString('id-ID')) + '</div></div>' +
    '<div class="section"><h2>Ringkasan</h2><div class="summary">' +
    '<div class="box"><div class="box-label">Total Pemasukan</div><div class="box-value green">' + rupiah(summary.pemasukan) + '</div></div>' +
    '<div class="box"><div class="box-label">Total Pengeluaran</div><div class="box-value red">' + rupiah(summary.pengeluaran) + '</div></div>' +
    '<div class="box"><div class="box-label">Sisa Bersih</div><div class="box-value ' + (summary.sisa >= 0 ? 'green' : 'red') + '">' + rupiah(summary.sisa) + '</div></div>' +
    '<div class="box"><div class="box-label">Jumlah Transaksi</div><div class="box-value">' + summary.jumlah + '</div></div>' +
    '</div></div>' +
    '<div class="section"><h2>Transaksi Ditampilkan - Pribadi</h2><table><thead><tr><th>No</th><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Akun</th><th>Nominal</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>' + barisPrintTransaksi(list, 'Pribadi') + '</tbody></table></div>' +
    '<div class="section"><h2>Transaksi Ditampilkan - Bisnis</h2><table><thead><tr><th>No</th><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Akun</th><th>Pelanggan</th><th>Nominal</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>' + barisPrintTransaksi(list, 'Bisnis') + '</tbody></table></div>' +
    '<div class="foot"><div class="signbox">Mengetahui,<div class="signline">' + escapeHtmlText(namaUserAktif()) + '</div></div></div>';
  bukaDokumenPrint('Laporan Keuangan MoneyTrack', html);
}

function cetakLaporanDenganFilter() {
  var cfg = ambilConfigPrintLaporan();
  if (cfg.mode === 'custom' && (!cfg.start || !cfg.end)) {
    showToast('Tanggal awal dan akhir wajib diisi.', 'warning');
    return;
  }
  closeModalDirect();
  setPageLoading(true, 'Menyiapkan laporan...');
  google.script.run
    .withSuccessHandler(function(res) {
      setPageLoading(false);
      var r;
      try { r = JSON.parse(res); }
      catch (e) { showToast('Respon transaksi tidak valid.', 'error'); return; }
      if (r.status !== 'success') { showToast(r.pesan || 'Gagal memuat transaksi laporan.', 'error'); return; }
      var list = filterTransaksiPrint(r.data || [], cfg);
      renderDokumenLaporanTransaksi(list, cfg);
    })
    .withFailureHandler(function(err) {
      setPageLoading(false);
      console.error(err);
      showToast('Gagal menyiapkan laporan.', 'error');
    })
    .getTransaksi(STATE.user.spreadsheetId, {
      bulan: cfg.mode === 'bulan' ? cfg.bulan : '',
      tahun: cfg.mode === 'bulan' || cfg.mode === 'tahun' ? cfg.tahun : '',
      jenis: '',
      role: STATE.user.role,
      periode: 'semua',
      limitMode: 'semua'
    });
}

function truncateText(text, maxLength) {
  var value = String(text || '').trim();
  maxLength = Number(maxLength || KETERANGAN_LIMIT_TABLE);
  if (!value) return '-';
  if (value.length <= maxLength) return value;
  return value.slice(0, Math.max(0, maxLength - 3)).trimEnd() + '...';
}

function encodeJsText(text) {
  return encodeURIComponent(String(text || ''));
}

function ambilKeteranganTransaksi(trx) {
  trx = trx || {};
  return trx.Keterangan || trx.keterangan || trx.Catatan || trx.catatan || trx.Deskripsi || trx.deskripsi || trx['_Keterangan'] || '';
}

function renderKeteranganTooltip(text, maxLength) {
  var full = String(text || '').trim();
  if (!full) return '<span class="keterangan-short">-</span>';
  var shortText = truncateText(full, maxLength || KETERANGAN_LIMIT_TABLE);
  var isLong = shortText !== full;
  var cls = 'keterangan-short' + (isLong ? ' has-tooltip keterangan-tooltip' : '');
  var click = isLong ? ' onclick="showKeteranganMobile(decodeURIComponent(\'' + encodeJsText(full) + '\'), event)"' : '';
  return '<span class="' + cls + '" title="' + escapeHtmlAttr(full) + '"' + click + '>' + escapeHtmlText(shortText) + '</span>';
}

function showKeteranganMobile(text, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  var full = String(text || '').trim();
  if (!full) return;
  swalFire({
    title: '<span style="color:var(--neon);font-family:var(--font-display)">Keterangan</span>',
    html: '<div class="keterangan-popover">' + escapeHtmlText(full).replace(/\n/g, '<br>') + '</div>',
    confirmButtonText: 'Tutup',
    width: 520,
    customClass: { popup: 'swal2-popup', confirmButton: 'swal2-confirm' }
  });
}

function formatKeteranganPrint(text, maxLength) {
  var value = String(text || '').trim();
  if (!value) return '-';
  return truncateText(value.replace(/\s+/g, ' '), maxLength || KETERANGAN_LIMIT_PRINT);
}

function printLaporanReport() {
  modalPrintLaporan();
}

function rupiah(angka) {
  var n = angkaDashboard(angka);
  return 'Rp ' + n.toLocaleString('id-ID');
}

function angkaNominal(value) {
  if (value === null || value === undefined) return 0;
  var cleaned = String(value)
    .replace(/Rp/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/[^\d-]/g, '');
  var n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}

function formatNominalInput(value) {
  var n = angkaNominal(value);
  return n ? 'Rp ' + n.toLocaleString('id-ID') : '';
}

function setupInputRupiah(id) {
  var input = document.getElementById(id);
  if (!input) return;

  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('autocomplete', 'off');

  input.addEventListener('input', function() {
    input.value = formatNominalInput(input.value);
  });

  input.addEventListener('blur', function() {
    input.value = formatNominalInput(input.value);
  });

  if (input.value) input.value = formatNominalInput(input.value);
}

function bersihkanCacheTransaksi() {
  _txnCache = {};
  MASTER_TRANSAKSI_LOADED = false;
}

function refreshBudgetJikaAktif() {
  if (STATE.currentPage === 'budget' && document.getElementById('budgetList')) loadBudget();
}

function refreshDataKeuanganTerkait() {
  LAST_DASHBOARD_DATA = null;
  if (STATE.currentPage === 'dashboard') {
    renderDashboard();
  } else if (STATE.currentPage === 'transaksi') {
    loadRingkasanTransaksi();
    loadTransaksi(true);
  } else if (STATE.currentPage === 'budget') {
    loadBudget();
  }
}

function cariTransaksiById(id) {
  var sumber = []
    .concat(Array.isArray(_allTxnRaw) ? _allTxnRaw : [])
    .concat(Array.isArray(_allTxn) ? _allTxn : []);

  for (var i = 0; i < sumber.length; i++) {
    if (String(sumber[i] && sumber[i]['ID']) === String(id)) return sumber[i];
  }

  return null;
}

function normalisasiPayloadTransaksiLama(t) {
  t = t || {};
  var tipe = t['_Tipe'] || t['Tipe Transaksi'] || t['Tipe Pembayaran'] || t['Jenis'] || '';
  var nominal = t['_Nominal'] || t['Nominal'] || t['Jumlah'] || 0;
  var akunAsal = t['_AkunAsal'] || t['Akun Asal'] || t['Akun'] || '';
  var akunTujuan = t['_AkunTujuan'] || t['Akun Tujuan'] || t['Akun'] || '';

  return {
    id: t['ID'] || '',
    tanggal: t['_Tanggal'] || t['Tanggal'] || '',
    jenisKeuangan: t['_JenisKeuangan'] || t['Jenis Keuangan'] || '',
    tipeTransaksi: t['Tipe Transaksi'] || (tipe === 'Pemasukan' || tipe === 'Pengeluaran' || tipe === 'Transfer' ? tipe : ''),
    tipePembayaran: t['Tipe Pembayaran'] || (tipe !== 'Pemasukan' && tipe !== 'Pengeluaran' && tipe !== 'Transfer' ? tipe : ''),
    jenis: t['Jenis'] || tipe,
    tipe: tipe,
    nominal: angkaNominal(nominal),
    jumlah: angkaNominal(nominal),
    akun: t['_Akun'] || t['Akun'] || akunAsal || akunTujuan,
    akunAsal: akunAsal,
    akunTujuan: akunTujuan,
    kategori: t['_Kategori'] || t['Kategori'] || '',
    status: t['Status'] || '',
    keterangan: t['_Keterangan'] || t['Keterangan'] || ''
  };
}



function tanggalIndo(str) {
  if (!str) return '-';
  var d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function tanggalInputValue(str) {
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(str))) return String(str);
  var d = new Date(str);
  if (isNaN(d)) return '';
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function namaHari(str) {
  if (!str) return '';
  var d = new Date(str);
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
}

function getInitial(nama) {
  if (!nama) return '?';
  return nama.trim().split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type) {
  type = type || 'info';
  var icons = { success: 'ri-checkbox-circle-fill', error: 'ri-close-circle-fill', info: 'ri-information-fill', warning: 'ri-alert-fill' };
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<i class="' + (icons[type] || icons.info) + '"></i><span>' + msg + '</span>';
  var container = document.getElementById('toastContainer');
  if (!container) return;
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('removing');
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 280);
  }, 3500);
}

// ============================================================
// MODAL
// ============================================================
function openModal(title, bodyHtml, footerHtml) {
  tutupBottomMore();
  document.body.classList.add('modal-open');

  if (isReadOnly() && /(Tambah|Edit|Hapus|Update|Simpan)/i.test(String(title || ''))) {
    showToast('Mode lihat saja aktif. Perpanjang langganan untuk mengubah data.', 'warning');
    return;
  }

  var mt = document.getElementById('modalTitle');
  var mb = document.getElementById('modalBody');
  var mf = document.getElementById('modalFooter');
  var gm = document.getElementById('globalModal');
  var box = document.getElementById('modalBox');

  if (mt) mt.textContent = title || '';
  if (mb) mb.innerHTML = bodyHtml || '';
  if (mf) mf.innerHTML = footerHtml || '';

  if (gm) {
    gm.classList.remove('hidden');
    gm.style.display = 'flex';
    gm.style.visibility = 'visible';
    gm.style.opacity = '1';
    gm.style.pointerEvents = 'auto';
    gm.style.zIndex = '500';
  }

  if (box) {
    box.style.animation = 'none';
    setTimeout(function() { box.style.animation = ''; }, 20);
  }

  setTimeout(pulihkanScrollApp, 50);
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('globalModal')) return;
  closeModalDirect();
}

function closeModalDirect() {
  var modal = document.getElementById('globalModal');
  var box = document.getElementById('modalBox');
  if (!modal || !box) return;

  box.style.animation = 'modalOut 0.2s ease both';

  setTimeout(function() {
    modal.classList.add('hidden');
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    document.body.classList.remove('modal-open');
    box.style.animation = '';
    pulihkanScrollApp();
  }, 200);
}

// ============================================================
// FOTO PROFIL
// ============================================================
function previewFotoProfil() {
  var input = document.getElementById('inputFotoProfil');
  var file = input && input.files ? input.files[0] : null;
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('File harus gambar.', 'error'); input.value = ''; return; }
  FOTO_PROFIL_INFO = { fileName: file.name, mimeType: file.type };
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var size = 240;
      canvas.width = size; canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0d1220';
      ctx.fillRect(0, 0, size, size);
      var scale = Math.max(size / img.width, size / img.height);
      var w = img.width * scale, h = img.height * scale;
      var x = (size - w) / 2, y = (size - h) / 2;
      ctx.drawImage(img, x, y, w, h);
      var dataUrl = canvas.toDataURL('image/jpeg', 0.72);
      var avatar = document.getElementById('profilAvatar');
      if (avatar) setAvatarElement(avatar, STATE.user.nama, dataUrl);
      var base64Only = dataUrl.split(',')[1];
      if (!base64Only) { showToast('Format foto tidak valid.', 'error'); FOTO_PROFIL_BASE64 = null; return; }
      FOTO_PROFIL_BASE64 = base64Only;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function uploadFotoProfilUser() {
  if (!FOTO_PROFIL_BASE64 || !FOTO_PROFIL_INFO) { showToast('Pilih foto dulu.', 'warning'); return; }
  showToast('Mengupload foto profil...', 'info');
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status === 'success') {
        var fotoUrl = r.data && r.data.fotoProfil ? r.data.fotoProfil : '';
        if (!fotoUrl) { showToast('Upload berhasil, tapi URL foto kosong.', 'warning'); return; }
        STATE.user.fotoProfil = fotoUrl;
        sessionStorage.setItem('mt_user', JSON.stringify(STATE.user));
        var fotoFresh = fotoUrl + '&t=' + Date.now();
        setAvatarElement(document.getElementById('profilAvatar'), STATE.user.nama, fotoFresh);
        setAvatarElement(document.getElementById('topbarAvatar'), STATE.user.nama, fotoFresh);
        FOTO_PROFIL_BASE64 = null; FOTO_PROFIL_INFO = null;
        var input = document.getElementById('inputFotoProfil');
        if (input) input.value = '';
        showToast('Foto profil berhasil diganti.', 'success');
      } else {
        showToast(r.pesan || 'Gagal upload foto profil.', 'error');
      }
    })
    .withFailureHandler(function() { showToast('Gagal upload foto profil.', 'error'); })
    .uploadFotoProfil(STATE.user.username, FOTO_PROFIL_INFO.fileName, FOTO_PROFIL_INFO.mimeType, FOTO_PROFIL_BASE64);
}

function ubahPeriodeDashboard() {
  var select = document.getElementById('dashboardPeriodeChart');
  if (!select) return;

  DASHBOARD_PERIODE = select.value || '7hari';
  LAST_DASHBOARD_DATA = null;
  renderDashboard();
}



function labelPeriodeDashboard(periode) {
  var map = {
    '7hari': '7 Hari',
    'bulan': 'Bulan Ini',
    '1bln': '1 Bulan',
    '6bln': '6 Bulan',
    '1thn': '1 Tahun',
    'semua': 'Semua Tahun'
  };

  return map[periode] || 'Semua Tahun';
}

function renderTrendKeuanganOnly(chartData) {
  chartData = chartData || [];

  var chartBox = document.getElementById('trendChartBox');
  if (!chartBox) return;

  chartBox.innerHTML =
    '<div class="chart-container" style="height:280px">' +
      '<canvas id="chart7Hari"></canvas>' +
    '</div>';

  var labels = chartData.map(function(x) {
    return x.label || x.key || '-';
  });

  var dataMasuk = chartData.map(function(x) {
    return Number(x.pemasukan || 0);
  });

  var dataKeluar = chartData.map(function(x) {
    return Number(x.pengeluaran || 0);
  });

  var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  var gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  var textColor = isDark ? '#8d99b3' : '#5a6478';

  if (STATE.chartInstances.dashTrendKeuangan) {
    STATE.chartInstances.dashTrendKeuangan.destroy();
    delete STATE.chartInstances.dashTrendKeuangan;
  }

  var ctx = document.getElementById('chart7Hari');
  if (!ctx) return;

  ensureChartJs().then(function() {
    var freshCtx = document.getElementById('chart7Hari');
    if (!freshCtx) return;
    STATE.chartInstances.dashTrendKeuangan = new Chart(freshCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: dataMasuk,
          borderColor: '#00d68f',
          backgroundColor: 'rgba(0,214,143,0.12)',
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#00d68f',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          tension: 0.42,
          fill: true
        },
        {
          label: 'Pengeluaran',
          data: dataKeluar,
          borderColor: '#ff4560',
          backgroundColor: 'rgba(255,69,96,0.10)',
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#ff4560',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          tension: 0.42,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      animation: {
        duration: 650,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: {
              size: 11,
              family: "'DM Sans', sans-serif"
            },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.dataset.label + ': ' + rupiah(ctx.parsed.y || 0);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: 11 },
            autoSkip: true,
            maxTicksLimit:
              DASHBOARD_PERIODE === '1bln' ? 10 :
              DASHBOARD_PERIODE === '1thn' ? 12 :
              DASHBOARD_PERIODE === 'semua' ? 12 :
              7
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: function(v) {
              return 'Rp' + Number(v).toLocaleString('id-ID');
            }
          }
        }
      }
    }
    });
  }).catch(function(err) {
    console.error(err);
    showToast('Gagal memuat library chart.', 'error');
  });
}

function angkaDashboard(value) {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') return value;

  var cleaned = String(value)
    .replace(/Rp/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.-]/g, '');

  var n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function normalisasiChartNamaTotal(arr) {
  arr = arr || [];

  return arr.map(function(x) {
    x = x || {};

    var nama =
      x.nama ||
      x.label ||
      x.kategori ||
      x.Kategori ||
      x['Nama'] ||
      x['Nama Kategori'] ||
      x.name ||
      'Lainnya';

    var total = angkaDashboard(
      x.total !== undefined ? x.total :
      x.Total !== undefined ? x.Total :
      x.nominal !== undefined ? x.nominal :
      x.Nominal !== undefined ? x.Nominal :
      x.jumlah !== undefined ? x.jumlah :
      x.Jumlah !== undefined ? x.Jumlah :
      x.nilai !== undefined ? x.nilai :
      x.value !== undefined ? x.value :
      x.y !== undefined ? x.y :
      0
    );

    return {
      nama: nama,
      total: Math.abs(total)
    };
  }).filter(function(x) {
    return x.nama && x.total > 0;
  });
}

function pilihArrayIsi() {
  for (var i = 0; i < arguments.length; i++) {
    if (Array.isArray(arguments[i]) && arguments[i].length > 0) {
      return arguments[i];
    }
  }

  return [];
}

function normalisasiAkunAktif(arr) {
  arr = arr || [];

  return arr.map(function(a, i) {
    a = a || {};

    var nama =
      a.nama ||
      a['Nama Akun'] ||
      a.Akun ||
      a['Akun'] ||
      a.name ||
      ('Akun ' + (i + 1));

    var total = angkaDashboard(
      a.total !== undefined ? a.total :
      a['Saldo Sekarang'] !== undefined ? a['Saldo Sekarang'] :
      a.Saldo !== undefined ? a.Saldo :
      a.saldo !== undefined ? a.saldo :
      0
    );

    var warna =
      a.warna ||
      a.Warna ||
      'var(--neon)';

    return {
      nama: nama,
      total: total,
      warna: warna
    };
  });
}

// ============================================================
// DASHBOARD
// ============================================================


function renderDashboard() {
  var content = document.getElementById('pageContent');
  if (!content) return;
  content.innerHTML = '<div class="page-content fade-in">' +
    '<div class="page-header">' +
    '<div class="page-title"><i class="ri-dashboard-3-line"></i> Dashboard</div>' +
    '<div class="page-actions">' +
    '<button class="btn btn-secondary btn-sm btn-refresh" onclick="renderDashboard()"><i class="ri-refresh-line"></i> Refresh</button>' +
    '</div></div>' +
    '<div id="dashCards" class="grid-4 stagger-in">' +
    '<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>' +
    '<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>' +
    '</div>' +
    '<div id="dashChartArea" style="margin-top:16px;display:grid;gap:16px">' +
    '<div class="skeleton sk-card" style="height:260px"></div>' +
    '<div class="skeleton sk-card" style="height:260px"></div>' +
    '</div>' +
    '<div id="dashRecentWrap" style="margin-top:16px"><div class="skeleton sk-card" style="height:200px"></div></div>' +
    '</div>';

  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status !== 'success') { showToast('Gagal memuat dashboard.', 'error'); return; }
var d = r.data || {};

d.chart7Hari = d.chart7Hari || d.chartDashboardUtama || [];
d.transaksiTerbaru = d.transaksiTerbaru || [];

/* Akun aktif dibuat fleksibel: bisa dari akunAktif atau chartSaldoAkun */
d.akunAktif = normalisasiAkunAktif(d.akunAktif || d.chartSaldoAkun || []);

/* Chart kategori dibuat fleksibel juga */
d.chartKategoriPengeluaran = normalisasiChartNamaTotal(
  pilihArrayIsi(
    d.chartKategoriPengeluaran,
    d.topPengeluaran,
    d.kategoriPengeluaran,
    d.pengeluaranKategori,
    d.perKategoriPengeluaran
  )
);

d.chartKategoriPemasukan = normalisasiChartNamaTotal(
  pilihArrayIsi(
    d.chartKategoriPemasukan,
    d.topPemasukan,
    d.kategoriPemasukan,
    d.pemasukanKategori,
    d.perKategoriPemasukan
  )
);
d.chartPribadiBisnis = d.chartPribadiBisnis || [];

      /* Supaya aman kalau backend kirim nama, bukan label */
      d.chartPribadiBisnis = d.chartPribadiBisnis.map(function(x) {
        return {
          nama: x.nama || x.label || '-',
          label: x.label || x.nama || '-',
          pemasukan: angkaDashboard(x.pemasukan || 0),
          pengeluaran: angkaDashboard(x.pengeluaran || 0)
        };
      });

      /* Penyesuaian nama field dari backend baru */
      d.pemasukan = angkaDashboard(d.pemasukan !== undefined ? d.pemasukan : d.pemasukanBulan);
      d.pengeluaran = angkaDashboard(d.pengeluaran !== undefined ? d.pengeluaran : d.pengeluaranBulan);
      d.jumlahTransaksi = angkaDashboard(d.jumlahTransaksi !== undefined ? d.jumlahTransaksi : d.jumlahTransaksiBulanIni);
      d.totalSaldo = angkaDashboard(d.totalSaldo);
      d.sisaBersih = d.sisaBersih !== undefined ? angkaDashboard(d.sisaBersih) : (d.pemasukan - d.pengeluaran);
      LAST_DASHBOARD_DATA = d;

      console.log('DEBUG DASHBOARD DATA:', {
  kategoriPengeluaran: d.chartKategoriPengeluaran,
  kategoriPemasukan: d.chartKategoriPemasukan,
  akunAktif: d.akunAktif,
  pribadiBisnis: d.chartPribadiBisnis
});

      var labelPeriode = labelPeriodeDashboard(DASHBOARD_PERIODE);
      var dashCards = document.getElementById('dashCards');
      if (!dashCards) return;

      dashCards.innerHTML =
        '<div class="stat-card">' +
          '<div class="stat-head"><div><div class="stat-label">Total Saldo</div><div class="stat-value neon" id="sv0">' + rupiah(d.totalSaldo) + '</div></div><i class="ri-wallet-3-line stat-icon"></i></div>' +
          '<div class="stat-sub">' + d.akunAktif.length + ' akun aktif</div>' +
        '</div>' +
        '<div class="stat-card income">' +
          '<div class="stat-head"><div><div class="stat-label">Pemasukan ' + labelPeriode + '</div><div class="stat-value green" id="sv1">' + rupiah(d.pemasukan) + '</div></div><i class="ri-arrow-up-circle-line stat-icon"></i></div>' +
        '</div>' +
        '<div class="stat-card expense">' +
          '<div class="stat-head"><div><div class="stat-label">Pengeluaran ' + labelPeriode + '</div><div class="stat-value red" id="sv2">' + rupiah(d.pengeluaran) + '</div></div><i class="ri-arrow-down-circle-line stat-icon"></i></div>' +
        '</div>' +
        '<div class="stat-card balance">' +
          '<div class="stat-head"><div><div class="stat-label">Sisa Bersih</div><div class="stat-value ' + (d.sisaBersih >= 0 ? 'green' : 'red') + '" id="sv3">' + rupiah(d.sisaBersih) + '</div></div><i class="ri-scales-line stat-icon"></i></div>' +
          '<div class="stat-sub">' + d.jumlahTransaksi + ' transaksi ' + labelPeriode.toLowerCase() + '</div>' +
        '</div>';

      setTimeout(function() {
        var ids = ['sv0','sv1','sv2','sv3'];
        var vals = [d.totalSaldo, d.pemasukan, d.pengeluaran, d.sisaBersih];
        ids.forEach(function(id, i) {
          var el = document.getElementById(id);
          if (el && !isNaN(vals[i])) animasiCounterRupiah(el, vals[i], i * 70);
        });
      }, 100);

      var chartUtama = d.chartDashboardUtama || d.chart7Hari || [];

      var labels = chartUtama.map(function(c) {
        return c.label;
      });

      var dataMasuk = chartUtama.map(function(c) {
        return c.pemasukan || 0;
      });

      var dataKeluar = chartUtama.map(function(c) {
        return c.pengeluaran || 0;
      });

      DASHBOARD_RECENT_TXN = d.transaksiTerbaru || [];
      var recentRows = DASHBOARD_RECENT_TXN.length ? DASHBOARD_RECENT_TXN.map(function(t, idx) {
        var tipe = t['_Tipe'] || t['Tipe Transaksi'] || t['Tipe Pembayaran'] || t['Jenis'] || '-';
        var jenisLaporan = t['_JenisLaporan'] || '';
        var nominal = t['_Nominal'] || t['Nominal'] || t['Jumlah'] || 0;
        var akun = t['_Akun'] || t['Akun'] || t['Akun Asal'] || t['Akun Tujuan'] || '-';
        var ket = txnBersihKeterangan(t) || t['_Kategori'] || t['Kategori'] || tipe || '-';
        var isIn = jenisLaporan === 'Pemasukan' || tipe === 'Pemasukan' || tipe === 'Pembayaran Masuk';
        var isTransfer = tipe === 'Transfer';
        var iconClass = isTransfer ? 'income' : (isIn ? 'income' : 'expense');
        var iconName = isTransfer ? 'ri-arrow-left-right-line' : ('ri-arrow-' + (isIn ? 'up' : 'down') + '-circle-line');
        var tanda = isTransfer ? '' : (isIn ? '+' : '-');
        return '<div class="txn-card" onclick="openDashboardTransactionDetail(' + idx + ')">' +
          '<div class="txn-icon ' + iconClass + '"><i class="' + iconName + '"></i></div>' +
          '<div class="txn-info"><div class="txn-name">' + renderKeteranganTooltip(ket, KETERANGAN_LIMIT_MOBILE) + '</div><div class="txn-date">' + tanggalIndo(t['Tanggal']) + ' &bull; ' + escapeHtmlText(tipe) + ' &bull; ' + escapeHtmlText(akun) + '</div></div>' +
          '<div class="txn-amount ' + (isIn || isTransfer ? 'income' : 'expense') + '">' + tanda + rupiah(nominal) + '</div>' +
          '</div>';
      }).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-desc">Belum ada transaksi</div></div>';

var akunListHtml = d.akunAktif.length ? d.akunAktif.map(function(a) {
  var warna = a.warna || 'var(--neon)';
  var nama = a.nama || '-';
  var saldo = angkaDashboard(a.total);

  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:9px;border:1px solid var(--border)">' +
    '<div style="display:flex;align-items:center;gap:9px">' +
      '<div style="width:9px;height:9px;border-radius:50%;background:' + warna + ';box-shadow:0 0 6px ' + warna + '"></div>' +
      '<span style="font-size:13px;font-weight:500">' + escapeHtmlText(nama) + '</span>' +
    '</div>' +
    '<span style="font-weight:700;font-size:13px;color:var(--neon)">' + rupiah(saldo) + '</span>' +
  '</div>';
}).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-desc">Belum ada akun</div></div>';

      var dashChartArea = document.getElementById('dashChartArea');
      var dashRecentWrap = document.getElementById('dashRecentWrap');
if (dashChartArea) {
  dashChartArea.innerHTML =
'<div id="trendKeuanganWrap" class="chart-wrap chart-wrap-wide">' +
  '<div class="chart-header">' +
    '<div class="chart-title">' +
      '<i class="ri-line-chart-line" style="color:var(--neon);margin-right:6px"></i>Trend Keuangan' +
    '</div>' +
    '<select class="form-control dashboard-period-select" id="dashboardPeriodeChart" onchange="ubahPeriodeDashboard()">' +
      '<option value="7hari" ' + (DASHBOARD_PERIODE === '7hari' ? 'selected' : '') + '>7 Hari</option>' +
      '<option value="1bln" ' + (DASHBOARD_PERIODE === '1bln' ? 'selected' : '') + '>1 Bulan</option>' +
      '<option value="6bln" ' + (DASHBOARD_PERIODE === '6bln' ? 'selected' : '') + '>6 Bulan</option>' +
      '<option value="1thn" ' + (DASHBOARD_PERIODE === '1thn' ? 'selected' : '') + '>1 Tahun</option>' +
      '<option value="semua" ' + (DASHBOARD_PERIODE === 'semua' ? 'selected' : '') + '>Semua Tahun</option>' +
    '</select>' +
  '</div>' +
  '<div id="trendChartBox">' +
    '<div class="chart-container" style="height:280px">' +
      '<canvas id="chart7Hari"></canvas>' +
    '</div>' +
  '</div>' +
'</div>' +
    '<div class="chart-wrap">' +
      '<div class="chart-header">' +
        '<div class="chart-title">' +
          '<i class="ri-briefcase-line" style="color:var(--neon3);margin-right:6px"></i>Pribadi vs Bisnis' +
        '</div>' +
      '</div>' +
      '<div class="chart-container" style="height:220px">' +
        '<canvas id="chartPribadiBisnis"></canvas>' +
      '</div>' +
    '</div>' +

    '<div class="chart-wrap">' +
      '<div class="chart-header">' +
        '<div class="chart-title">' +
          '<i class="ri-arrow-down-circle-line" style="color:var(--red);margin-right:6px"></i>Top Pengeluaran' +
        '</div>' +
      '</div>' +
      (
        d.chartKategoriPengeluaran.length
          ? '<div class="chart-container" style="height:220px"><canvas id="chartKategoriPengeluaran"></canvas></div>'
          : '<div class="empty-state" style="padding:30px"><div class="empty-icon" style="font-size:36px"><i class="ri-pie-chart-2-line"></i></div><div class="empty-desc">Belum ada data pengeluaran</div></div>'
      ) +
    '</div>' +

    '<div class="chart-wrap">' +
      '<div class="chart-header">' +
        '<div class="chart-title">' +
          '<i class="ri-arrow-up-circle-line" style="color:var(--green);margin-right:6px"></i>Top Pemasukan' +
        '</div>' +
      '</div>' +
      (
        d.chartKategoriPemasukan.length
          ? '<div class="chart-container" style="height:220px"><canvas id="chartKategoriPemasukan"></canvas></div>'
          : '<div class="empty-state" style="padding:30px"><div class="empty-icon" style="font-size:36px"><i class="ri-pie-chart-2-line"></i></div><div class="empty-desc">Belum ada data pemasukan</div></div>'
      ) +
    '</div>' +


    '<div class="chart-wrap">' +
      '<div class="chart-header">' +
        '<div class="chart-title">' +
          '<i class="ri-list-check" style="color:var(--neon);margin-right:6px"></i>Akun Aktif' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">' +
        akunListHtml +
      '</div>' +
    '</div>';
}

      if (dashRecentWrap) {
        dashRecentWrap.innerHTML =
          '<div class="card" style="margin-top:4px">' +
          '<div class="chart-header" style="margin-bottom:16px">' +
          '<div class="chart-title"><i class="ri-time-line" style="color:var(--neon);margin-right:6px"></i>Transaksi Terbaru</div>' +
          '<button class="btn btn-secondary btn-sm" onclick="navigateTo(\'transaksi\')">Lihat Semua <i class="ri-arrow-right-line"></i></button>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' + recentRows + '</div>' +
          '</div>';
      }

      setTimeout(function() {
        var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        var gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
        var textColor = isDark ? '#6b7a94' : '#5a6478';
        var neonColors = ['#00ff99','#00d5ff','#b84cff','#ff4560','#ff9f43','#00d68f'];
        var redColors = ['#ff4560','#ff9f43','#b84cff','#00d5ff','#00d68f','#6b7a94'];

        ensureChartJs().then(function() {
        function dc(key) {
          if (STATE.chartInstances[key]) { STATE.chartInstances[key].destroy(); delete STATE.chartInstances[key]; }
        }
        function bc(id, key, config) {
          var ctx = document.getElementById(id);
          if (!ctx) return;
          dc(key);
          STATE.chartInstances[key] = new Chart(ctx, config);
        }

        var chartOpts = function(opts) {
          return Object.assign({
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900, easing: 'easeOutQuart' },
            plugins: { legend: { labels: { color: textColor, font: { size: 11, family: "'DM Sans', sans-serif" }, padding: 12, usePointStyle: true, pointStyle: 'circle' } } }
          }, opts || {});
        };

renderTrendKeuanganOnly(d.chart7Hari || []);

        bc('chartPribadiBisnis', 'dashPribadiBisnis', {
          type: 'bar',
          data: {
           labels: d.chartPribadiBisnis.map(function(x) { return x.label || x.nama || '-'; }),
            datasets: [
            { label: 'Pemasukan', data: d.chartPribadiBisnis.map(function(x) { return angkaDashboard(x.pemasukan || 0); }), backgroundColor: 'rgba(0,214,143,0.2)', borderColor: '#00d68f', borderWidth: 2, borderRadius: 6, borderSkipped: false },
            { label: 'Pengeluaran', data: d.chartPribadiBisnis.map(function(x) { return angkaDashboard(x.pengeluaran || 0); }), backgroundColor: 'rgba(255,69,96,0.2)', borderColor: '#ff4560', borderWidth: 2, borderRadius: 6, borderSkipped: false }
            ]
          },
          options: chartOpts({
            scales: {
              x: { grid: { color: gridColor }, ticks: { color: textColor } },
              y: { grid: { color: gridColor }, ticks: { color: textColor, callback: function(v) { return 'Rp' + Number(v).toLocaleString('id-ID'); } } }
            }
          })
        });

        if (d.chartKategoriPengeluaran.length) {
          bc('chartKategoriPengeluaran', 'dashKategoriPengeluaran', {
            type: 'doughnut',
            data: {
              labels: d.chartKategoriPengeluaran.map(function(x) { return x.nama; }),
              datasets: [{ data: d.chartKategoriPengeluaran.map(function(x) { return x.total; }), backgroundColor: redColors, borderWidth: 0, hoverOffset: 8 }]
            },
            options: chartOpts({ cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 }, padding: 10 } } } })
          });
        }

        if (d.chartKategoriPemasukan.length) {
          bc('chartKategoriPemasukan', 'dashKategoriPemasukan', {
            type: 'doughnut',
            data: {
              labels: d.chartKategoriPemasukan.map(function(x) { return x.nama; }),
              datasets: [{ data: d.chartKategoriPemasukan.map(function(x) { return x.total; }), backgroundColor: neonColors, borderWidth: 0, hoverOffset: 8 }]
            },
            options: chartOpts({ cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 10 }, padding: 10 } } } })
          });
        }
        }).catch(function(err) {
          console.error(err);
          showToast('Gagal memuat library chart.', 'error');
        });
      }, 100);
    })
    .withFailureHandler(function() { showToast('Gagal memuat data dashboard.', 'error'); })
    .getDashboard(STATE.user.spreadsheetId, STATE.user.role, DASHBOARD_PERIODE);
}

// ============================================================
// TRANSAKSI
// ============================================================
function renderTransaksi() {
  var content = document.getElementById('pageContent');
  if (!content) return;

  var now = new Date();
  var bulan = now.getMonth() + 1;
  var tahun = now.getFullYear();

  var bulanOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) {
    var nm = new Date(2000, m - 1, 1).toLocaleDateString('id-ID', { month: 'long' });
    return '<option value="' + m + '"' + (m == bulan ? ' selected' : '') + '>' + nm + '</option>';
  }).join('');

  var tahunOptions = [tahun - 2, tahun - 1, tahun, tahun + 1].map(function(y) {
    return '<option value="' + y + '"' + (y == tahun ? ' selected' : '') + '>' + y + '</option>';
  }).join('');

  content.innerHTML =
    '<div class="page-content fade-in">' +
      '<div class="page-header">' +
        '<div class="page-title"><i class="ri-exchange-line"></i> Transaksi</div>' +
        '<div class="page-actions">' +
          '<button class="btn btn-primary" onclick="modalTambahTransaksi()"><i class="ri-add-line"></i> Tambah</button>' +
          '<button class="btn btn-secondary btn-sm btn-refresh" onclick="loadTransaksi(true)"><i class="ri-refresh-line"></i></button>' +
        '</div>' +
      '</div>' +

      '<div id="txnSummaryCards" class="grid-4 stagger-in transaksi-summary desktop-only-summary">' +
        '<div class="stat-card"><div class="stat-head"><div><div class="stat-label">Total Saldo</div><div class="stat-value neon">-</div></div><i class="ri-wallet-3-line stat-icon"></i></div><div class="stat-sub">Ringkasan akun</div></div>' +
        '<div class="stat-card income"><div class="stat-head"><div><div class="stat-label">Pemasukan</div><div class="stat-value green">-</div></div><i class="ri-arrow-up-circle-line stat-icon"></i></div><div class="stat-sub">Bulan ini</div></div>' +
        '<div class="stat-card expense"><div class="stat-head"><div><div class="stat-label">Pengeluaran</div><div class="stat-value red">-</div></div><i class="ri-arrow-down-circle-line stat-icon"></i></div><div class="stat-sub">Bulan ini</div></div>' +
        '<div class="stat-card balance"><div class="stat-head"><div><div class="stat-label">Sisa Bersih</div><div class="stat-value green">-</div></div><i class="ri-scales-line stat-icon"></i></div><div class="stat-sub">Transaksi bulan ini</div></div>' +
      '</div>' +

      '<div class="filter-bar transaksi-filter">' +
        '<div class="search-wrap" style="flex:1;min-width:160px">' +
          '<i class="ri-search-line"></i>' +
          '<input type="text" class="form-control" id="searchTxn" placeholder="Cari transaksi..." oninput="filterTxnUI()">' +
        '</div>' +

        '<select class="form-control" id="filterPeriode" style="width:135px" onchange="ubahFilterTransaksi()">' +
          '<option value="7hari" selected>7 Hari</option>' +
          '<option value="bulan">Bulan</option>' +
          '<option value="1bln">1 Bulan</option>' +
          '<option value="6bln">6 Bulan</option>' +
          '<option value="1thn">1 Tahun</option>' +
          '<option value="semua">Semua</option>' +
        '</select>' +

        '<select class="form-control" id="filterBulan" style="width:130px" onchange="loadTransaksi(true)" disabled>' + bulanOptions + '</select>' +
        '<select class="form-control" id="filterTahun" style="width:90px" onchange="loadTransaksi(true)" disabled>' + tahunOptions + '</select>' +
        '<select class="form-control" id="filterJenis" style="width:130px" onchange="loadTransaksi(true)">' +
          '<option value="">Semua</option>' +
          '<option value="Pemasukan">Pemasukan</option>' +
          '<option value="Pengeluaran">Pengeluaran</option>' +
        '</select>' +
      '</div>' +

      '<div class="filter-note" id="txnFilterNote">' +
        '<i class="ri-information-line"></i> Default menampilkan transaksi 7 hari terakhir. Pilih Bulan atau Semua jika ingin mengubah cakupan.' +
      '</div>' +

      '<div id="txnList">' +
        (_allTxn && _allTxn.length ? '' : '<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>') +
      '</div>' +
    '</div>';

  aturFilterTransaksiFields();
  if (_allTxn && _allTxn.length) renderTxnList(filterTransaksiLocal(_allTxn));
loadRingkasanTransaksi();
loadTransaksi();

// Master input dimuat di background, jangan ganggu tampilan awal.
setTimeout(function() {
  loadMasterInputTransaksi(null, false);
}, 900);
}

function renderRingkasanTransaksiCards(d) {
  var el = document.getElementById('txnSummaryCards');
  if (!el || !d) return;

  var periodeAktif = document.getElementById('filterPeriode') ? document.getElementById('filterPeriode').value : DASHBOARD_PERIODE;
  var labelPeriode = labelPeriodeDashboard(periodeAktif || '7hari');
  if (periodeAktif === 'bulan') {
    var bulanEl = document.getElementById('filterBulan');
    var tahunEl = document.getElementById('filterTahun');
    var bulanText = bulanEl && bulanEl.options[bulanEl.selectedIndex] ? bulanEl.options[bulanEl.selectedIndex].text : 'Bulan';
    labelPeriode = bulanText + (tahunEl ? ' ' + tahunEl.value : '');
  }
  labelPeriode = labelPeriode.toUpperCase();
  var totalSaldo = angkaDashboard(d.totalSaldo);
  var pemasukan = angkaDashboard(d.pemasukan !== undefined ? d.pemasukan : d.pemasukanBulan);
  var pengeluaran = angkaDashboard(d.pengeluaran !== undefined ? d.pengeluaran : d.pengeluaranBulan);
  var sisaBersih = d.sisaBersih !== undefined ? angkaDashboard(d.sisaBersih) : (pemasukan - pengeluaran);
  var akunAktif = Array.isArray(d.akunAktif) ? d.akunAktif.length : angkaDashboard(d.jumlahAkunAktif);
  var jumlahTransaksi = angkaDashboard(d.jumlahTransaksi !== undefined ? d.jumlahTransaksi : d.jumlahTransaksiBulanIni);

  el.innerHTML =
    '<div class="stat-card">' +
      '<div class="stat-head"><div><div class="stat-label">Total Saldo</div><div class="stat-value neon">' + rupiah(totalSaldo) + '</div></div><i class="ri-wallet-3-line stat-icon"></i></div>' +
      '<div class="stat-sub">' + akunAktif + ' akun aktif</div>' +
    '</div>' +
    '<div class="stat-card income">' +
      '<div class="stat-head"><div><div class="stat-label">Pemasukan ' + labelPeriode + '</div><div class="stat-value green">' + rupiah(pemasukan) + '</div></div><i class="ri-arrow-up-circle-line stat-icon"></i></div>' +
    '</div>' +
    '<div class="stat-card expense">' +
      '<div class="stat-head"><div><div class="stat-label">Pengeluaran ' + labelPeriode + '</div><div class="stat-value red">' + rupiah(pengeluaran) + '</div></div><i class="ri-arrow-down-circle-line stat-icon"></i></div>' +
    '</div>' +
    '<div class="stat-card balance">' +
      '<div class="stat-head"><div><div class="stat-label">Sisa Bersih</div><div class="stat-value ' + (sisaBersih >= 0 ? 'green' : 'red') + '">' + rupiah(sisaBersih) + '</div></div><i class="ri-scales-line stat-icon"></i></div>' +
      '<div class="stat-sub">' + jumlahTransaksi + ' transaksi ' + labelPeriode.toLowerCase() + '</div>' +
    '</div>';
}

function hitungRingkasanTransaksiLocal(data) {
  var base = LAST_DASHBOARD_DATA || {};
  var list = Array.isArray(data) ? data : [];
  var pemasukan = 0;
  var pengeluaran = 0;

  list.forEach(function(t) {
    var nominal = angkaNominal(txnAmbilNominal(t));
    if (txnApakahMasuk(t)) pemasukan += nominal;
    else if (txnApakahKeluar(t)) pengeluaran += nominal;
  });

  return {
    totalSaldo: Number(base.totalSaldo || 0),
    akunAktif: Array.isArray(base.akunAktif) ? base.akunAktif : [],
    jumlahAkunAktif: Array.isArray(base.akunAktif) ? base.akunAktif.length : Number(base.jumlahAkun || base.jumlahAkunAktif || 0),
    pemasukan: pemasukan,
    pengeluaran: pengeluaran,
    sisaBersih: pemasukan - pengeluaran,
    jumlahTransaksi: list.length
  };
}

function renderRingkasanTransaksiLocal() {
  var data = _allTxn && _allTxn.length ? _allTxn : [];
  renderRingkasanTransaksiCards(hitungRingkasanTransaksiLocal(data));
}

function loadRingkasanTransaksi() {
  if (window.innerWidth <= 768) return;
  if (!STATE.user || !STATE.user.spreadsheetId) return;

  if (LAST_DASHBOARD_DATA) {
    if (_allTxnRaw && _allTxnRaw.length) renderRingkasanTransaksiLocal();
    else renderRingkasanTransaksiCards(LAST_DASHBOARD_DATA);
    return;
  }

  google.script.run
    .withSuccessHandler(function(res) {
      var r;
      try { r = JSON.parse(res); }
      catch (errParse) { return; }
      if (r.status !== 'success') return;
      LAST_DASHBOARD_DATA = r.data || {};
      if (_allTxnRaw && _allTxnRaw.length) renderRingkasanTransaksiLocal();
      else renderRingkasanTransaksiCards(LAST_DASHBOARD_DATA);
    })
    .getDashboard(STATE.user.spreadsheetId, STATE.user.role, DASHBOARD_PERIODE);
}

var _allTxn = [];
var _allTxnRaw = [];
var _txnCache = {};
var _txnSedangLoad = false;

function ambilTanggalTransaksi(t) {
  var raw = t && (t['Tanggal'] || t['_Tanggal'] || t['Created At'] || t['Dibuat Pada']);
  if (!raw) return null;

  if (raw instanceof Date && !isNaN(raw)) return raw;

  var s = String(raw).trim();
  var d = new Date(s);
  if (!isNaN(d)) return d;

  var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    if (!isNaN(d)) return d;
  }

  return null;
}

function getBatasPeriodeTransaksi(periode) {
  var now = new Date();
  var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (periode === '7hari') start.setDate(start.getDate() - 6);
  else if (periode === '1bln') start.setMonth(start.getMonth() - 1);
  else if (periode === '6bln') start.setMonth(start.getMonth() - 6);
  else if (periode === '1thn') start.setFullYear(start.getFullYear() - 1);
  else return null;

  start.setHours(0, 0, 0, 0);
  return start;
}

function transaksiMasukPeriode(t, periode, bulan, tahun) {
  periode = periode || '7hari';
  if (periode === 'semua') return true;

  var d = ambilTanggalTransaksi(t);
  if (!d) return false;

  if (periode === 'bulan') {
    return d.getMonth() + 1 === Number(bulan) && d.getFullYear() === Number(tahun);
  }

  var batas = getBatasPeriodeTransaksi(periode);
  return batas ? d >= batas : true;
}

function aturFilterTransaksiFields() {
  var periode = document.getElementById('filterPeriode') ? document.getElementById('filterPeriode').value : '7hari';
  var bulan = document.getElementById('filterBulan');
  var tahun = document.getElementById('filterTahun');
  var isBulan = periode === 'bulan';
  if (bulan) bulan.disabled = !isBulan;
  if (tahun) tahun.disabled = !isBulan;
}

function ubahFilterTransaksi() {
  aturFilterTransaksiFields();
  loadTransaksi(true);
}

function filterTransaksiLocal(data) {
  var periode = document.getElementById('filterPeriode') ? document.getElementById('filterPeriode').value : '7hari';
  var bulan = document.getElementById('filterBulan') ? document.getElementById('filterBulan').value : '';
  var tahun = document.getElementById('filterTahun') ? document.getElementById('filterTahun').value : '';
  var jenis = document.getElementById('filterJenis') ? document.getElementById('filterJenis').value : '';
  var q = document.getElementById('searchTxn') ? document.getElementById('searchTxn').value.toLowerCase() : '';

  return (data || []).filter(function(t) {
    var tipe = txnAmbilTipe(t);
    var jenisLaporan = normalisasiTipeTxn(t['_JenisLaporan'] || tipe);

    if (jenis) {
      var cocokJenis = jenisLaporan === jenis || tipe === jenis;
      if (!cocokJenis) return false;
    }

    if (!transaksiMasukPeriode(t, periode, bulan, tahun)) return false;

    if (q) {
      var gabung = [
        t['_Keterangan'], t['Keterangan'], t['_Kategori'], t['Kategori'],
        t['_Akun'], t['Akun'], t['Akun Asal'], t['Akun Tujuan'], tipe
      ].join(' ').toLowerCase();

      if (!gabung.includes(q)) return false;
    }

    return true;
  });
}

function loadTransaksi(forceRefresh) {
  aturFilterTransaksiFields();
  var periode = document.getElementById('filterPeriode') ? document.getElementById('filterPeriode').value : '7hari';
  var bulan = document.getElementById('filterBulan') ? document.getElementById('filterBulan').value : '';
  var tahun = document.getElementById('filterTahun') ? document.getElementById('filterTahun').value : '';
  var jenis = document.getElementById('filterJenis') ? document.getElementById('filterJenis').value : '';

  var txnList = document.getElementById('txnList');
  var cacheKey = [STATE.user && STATE.user.spreadsheetId, STATE.user && STATE.user.role, bulan, tahun, periode, jenis].join('|');

  if (!forceRefresh && _txnCache[cacheKey]) {
    _allTxnRaw = _txnCache[cacheKey].slice();
    _allTxn = filterTransaksiLocal(_allTxnRaw);
    renderTxnList(_allTxn);
    renderRingkasanTransaksiLocal();
    return;
  }

  if (_txnSedangLoad) return;
  _txnSedangLoad = true;

  if (txnList && (!_allTxn || !_allTxn.length)) {
    txnList.innerHTML = '<div class="skeleton sk-card"></div><div class="skeleton sk-card"></div>';
  } else {
    setPageLoading(true, 'Memperbarui transaksi...');
  }

  google.script.run
    .withSuccessHandler(function(res) {
      _txnSedangLoad = false;
      setPageLoading(false);

      var r;
      try { r = JSON.parse(res); }
      catch (errParse) {
        showToast('Respon transaksi tidak valid.', 'error');
        return;
      }

      if (r.status !== 'success') {
        showToast(r.pesan || 'Gagal memuat transaksi.', 'error');
        return;
      }

      _allTxnRaw = r.data || [];
      _txnCache[cacheKey] = _allTxnRaw.slice();
      _allTxn = filterTransaksiLocal(_allTxnRaw);

      renderTxnList(_allTxn);
      renderRingkasanTransaksiLocal();
      pulihkanScrollApp();
    })
    .withFailureHandler(function(err) {
      _txnSedangLoad = false;
      setPageLoading(false);
      showToast('Gagal memuat data transaksi.', 'error');
      console.error('loadTransaksi error:', err);
    })
    .getTransaksi(STATE.user.spreadsheetId, {
      bulan: '',
      tahun: '',
      jenis: '',
      role: STATE.user.role,
      periode: periode,
      limitMode: periode
    });
}

function filterTxnUI() {
  _allTxn = filterTransaksiLocal(_allTxnRaw && _allTxnRaw.length ? _allTxnRaw : _allTxn);
  renderTxnList(_allTxn);
  renderRingkasanTransaksiLocal();
}

function txnValue(t, keys, fallback) {
  t = t || {};
  for (var i = 0; i < keys.length; i++) {
    var v = t[keys[i]];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return fallback === undefined ? '' : fallback;
}

function normalisasiJenisKeuanganTxn(value) {
  var raw = String(value || '').trim();
  var lower = raw.toLowerCase();
  if (lower.indexOf('bisnis') !== -1) return 'Bisnis';
  if (lower.indexOf('pribadi') !== -1) return 'Pribadi';
  if (raw === 'Pembayaran Masuk' || raw === 'Operasional Bisnis' || raw === 'Refund') return 'Bisnis';
  return raw;
}

function normalisasiTipeTxn(value) {
  var raw = String(value || '').trim();
  var lower = raw.toLowerCase();
  if (lower.indexOf('pemasukan') !== -1) return 'Pemasukan';
  if (lower.indexOf('pengeluaran') !== -1) return 'Pengeluaran';
  if (lower.indexOf('transfer') !== -1) return 'Transfer';
  return raw;
}

function txnJenisKeuangan(t) {
  var jk = txnValue(t, ['_JenisKeuangan', 'Jenis Keuangan', 'jenisKeuangan'], '');
  if (jk) return normalisasiJenisKeuanganTxn(jk);
  var tipeBisnis = txnValue(t, ['Tipe Pembayaran', '_TipePembayaran', 'tipePembayaran'], '');
  var tipe = txnAmbilTipe(t);
  if (tipeBisnis || tipe === 'Pembayaran Masuk' || tipe === 'Operasional Bisnis' || tipe === 'Refund') return 'Bisnis';
  return 'Pribadi';
}

function txnAmbilTipe(t) {
  var jk = normalisasiJenisKeuanganTxn(txnValue(t, ['_JenisKeuangan', 'Jenis Keuangan', 'jenisKeuangan'], ''));
  var tipeTransaksi = txnValue(t, ['Tipe Transaksi', '_TipeTransaksi', 'tipeTransaksi'], '');
  var tipePembayaran = txnValue(t, ['Tipe Pembayaran', '_TipePembayaran', 'tipePembayaran'], '');
  var tipeGenerik = txnValue(t, ['_Tipe', 'Jenis', 'jenis', 'tipe'], '');
  if (jk === 'Bisnis') return normalisasiTipeTxn(tipePembayaran || tipeGenerik || '-');
  if (jk === 'Pribadi') return normalisasiTipeTxn(tipeTransaksi || tipeGenerik || '-');
  return normalisasiTipeTxn(tipeTransaksi || tipePembayaran || tipeGenerik || '-');
}

function txnAmbilNominal(t) {
  return txnValue(t, ['_Nominal', 'Nominal', 'Jumlah', 'nominal', 'jumlah'], 0);
}

function txnAmbilKategori(t) {
  return txnValue(t, ['_Kategori', 'Kategori', 'kategori'], '-');
}

function txnAmbilKeterangan(t) {
  return txnValue(t, ['_Keterangan', 'Keterangan', 'keterangan', 'Catatan', 'catatan', 'Deskripsi', 'deskripsi'], '');
}

function txnAmbilAkunAsal(t) {
  return txnValue(t, ['_AkunAsal', 'Akun Asal', 'akunAsal'], '');
}

function txnAmbilAkunTujuan(t) {
  return txnValue(t, ['_AkunTujuan', 'Akun Tujuan', 'akunTujuan'], '');
}

function txnAmbilAkunUtama(t) {
  var tipe = txnAmbilTipe(t);
  if (tipe === 'Pemasukan' || tipe === 'Pembayaran Masuk') return txnAmbilAkunTujuan(t) || txnValue(t, ['_Akun', 'Akun', 'akun'], '-');
  if (tipe === 'Pengeluaran' || tipe === 'Operasional Bisnis' || tipe === 'Refund') return txnAmbilAkunAsal(t) || txnValue(t, ['_Akun', 'Akun', 'akun'], '-');
  if (tipe === 'Transfer') return (txnAmbilAkunAsal(t) || '-') + ' -> ' + (txnAmbilAkunTujuan(t) || '-');
  return txnValue(t, ['_Akun', 'Akun', 'akun'], '-');
}

function txnAmbilStatus(t) {
  return txnValue(t, ['Status', 'status'], 'Lunas');
}

function txnAmbilPelanggan(t) {
  return txnValue(t, ['Pelanggan', 'pelanggan', 'Pelanggan ID'], '');
}

function txnApakahMasuk(t) {
  var tipe = txnAmbilTipe(t);
  if (tipe === 'Lainnya' && txnAmbilAkunTujuan(t) && !txnAmbilAkunAsal(t)) return true;
  return tipe === 'Pemasukan' || tipe === 'Pembayaran Masuk';
}

function txnApakahKeluar(t) {
  var tipe = txnAmbilTipe(t);
  if (tipe === 'Lainnya' && txnAmbilAkunAsal(t) && !txnAmbilAkunTujuan(t)) return true;
  return tipe === 'Pengeluaran' || tipe === 'Operasional Bisnis' || tipe === 'Refund';
}

function txnApakahTransfer(t) {
  return txnAmbilTipe(t) === 'Transfer';
}

function txnBadgeClass(t) {
  if (txnApakahTransfer(t)) return 'badge-neon';
  return txnApakahMasuk(t) ? 'badge-success' : 'badge-danger';
}

function txnNominalHtml(t) {
  var isIn = txnApakahMasuk(t);
  var isTransfer = txnApakahTransfer(t);
  var warna = isTransfer ? 'var(--neon)' : (isIn ? 'var(--green)' : 'var(--red)');
  var tanda = isTransfer ? '' : (isIn ? '+' : '-');
  return '<span class="txn-nominal-cell" style="color:' + warna + '">' + tanda + rupiah(txnAmbilNominal(t)) + '</span>';
}

function txnBiayaAdmin(t) {
  var direct = txnValue(t, ['Biaya Admin', 'biayaAdmin'], '');
  if (direct !== '') return angkaNominal(direct);
  var match = String(txnAmbilKeterangan(t)).match(/\[Biaya Admin Transfer:\s*([^\]\-]+)/i);
  return match ? angkaNominal(match[1]) : 0;
}

function txnBersihKeterangan(t) {
  return String(txnAmbilKeterangan(t) || '').replace(/\n?\[Biaya Admin Transfer:[\s\S]*?\]/i, '').trim();
}

function txnCell(value) {
  return escapeHtmlText(value || '-');
}

function getTransactionDetailRows(trx) {
  trx = trx || {};
  var jenis = txnJenisKeuangan(trx);
  var tipe = txnAmbilTipe(trx);
  var rows = [
    ['Tanggal', tanggalIndo(trx['Tanggal'] || trx.tanggal)],
    ['Jenis Keuangan', jenis],
    [jenis === 'Bisnis' ? 'Tipe Pembayaran' : 'Tipe Transaksi', tipe],
    ['Kategori', txnAmbilKategori(trx)],
    ['Nominal', rupiah(txnAmbilNominal(trx))],
    ['Status', txnAmbilStatus(trx)]
  ];

  if (jenis === 'Pribadi') {
    if (tipe === 'Pengeluaran' || tipe === 'Transfer') rows.splice(4, 0, ['Akun Asal', txnAmbilAkunAsal(trx) || txnAmbilAkunUtama(trx)]);
    if (tipe === 'Pemasukan' || tipe === 'Transfer') rows.splice(tipe === 'Transfer' ? 5 : 4, 0, ['Akun Tujuan', txnAmbilAkunTujuan(trx) || txnAmbilAkunUtama(trx)]);
    if (tipe === 'Transfer' && txnBiayaAdmin(trx)) rows.splice(6, 0, ['Biaya Admin', rupiah(txnBiayaAdmin(trx))]);
  } else {
    if (txnAmbilPelanggan(trx)) rows.splice(4, 0, ['Pelanggan', txnAmbilPelanggan(trx)]);
    if (txnAmbilAkunAsal(trx)) rows.splice(4, 0, ['Akun Asal', txnAmbilAkunAsal(trx)]);
    if (txnAmbilAkunTujuan(trx)) rows.splice(5, 0, ['Akun Tujuan', txnAmbilAkunTujuan(trx)]);
  }

  rows.push(['Keterangan', txnBersihKeterangan(trx) || '-']);
  return rows.filter(function(row) {
    return row[1] !== undefined && row[1] !== null && row[1] !== '';
  });
}

function renderTransactionDetail(trx) {
  var rows = getTransactionDetailRows(trx);
  var isIn = txnApakahMasuk(trx);
  var isTransfer = txnApakahTransfer(trx);
  var tone = isTransfer ? 'var(--neon)' : (isIn ? 'var(--green)' : 'var(--red)');
  return '<div class="transaction-detail">' +
    '<div class="transaction-detail-head" style="border-color:' + tone + '">' +
      '<div><div class="transaction-detail-type">' + txnCell(txnAmbilTipe(trx)) + '</div><div class="transaction-detail-date">' + escapeHtmlText(tanggalIndo(trx['Tanggal'] || trx.tanggal)) + '</div></div>' +
      '<div class="transaction-detail-amount" style="color:' + tone + '">' + (isTransfer ? '' : (isIn ? '+' : '-')) + rupiah(txnAmbilNominal(trx)) + '</div>' +
    '</div>' +
    '<div class="transaction-detail-rows">' +
      rows.map(function(row) {
        var isKet = row[0] === 'Keterangan';
        return '<div class="transaction-detail-row' + (isKet ? ' full' : '') + '"><span>' + escapeHtmlText(row[0]) + '</span><strong>' + escapeHtmlText(row[1] || '-') + '</strong></div>';
      }).join('') +
    '</div>' +
  '</div>';
}

function openTransactionDetail(trx) {
  if (!trx) { showToast('Data transaksi tidak ditemukan.', 'warning'); return; }
  var id = trx['ID'] || trx.id || '';
  var footer = '<button class="btn btn-secondary" onclick="closeModalDirect()">Tutup</button>';
  if (!isReadOnly() && id) {
    footer += '<button class="btn btn-info" onclick="closeModalDirect(); modalEditTransaksi(\'' + escapeHtmlAttr(id) + '\')"><i class="ri-edit-line"></i> Edit</button>' +
      '<button class="btn btn-danger" onclick="closeModalDirect(); hapusTransaksiConfirm(\'' + escapeHtmlAttr(id) + '\')"><i class="ri-delete-bin-line"></i> Hapus</button>';
  }
  openModal('Detail Transaksi', renderTransactionDetail(trx), footer);
}

function openTransactionDetailById(id) {
  openTransactionDetail(cariTransaksiById(id));
}

function openDashboardTransactionDetail(index) {
  openTransactionDetail(DASHBOARD_RECENT_TXN[index]);
}

function renderTxnList(data) {
  var container = document.getElementById('txnList');
  if (!container) return;
  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-exchange-line"></i></div><div class="empty-title">Belum ada transaksi</div><div class="empty-desc">Mulai tambahkan transaksi keuangan Anda</div><button class="btn btn-primary" onclick="modalTambahTransaksi()"><i class="ri-add-line"></i> Tambah Transaksi</button></div>';
    return;
  }
  var isMobile = window.matchMedia('(max-width: 768px)').matches;
  var pribadi = data.filter(function(t) { return txnJenisKeuangan(t) !== 'Bisnis'; });
  var bisnis = data.filter(function(t) { return txnJenisKeuangan(t) === 'Bisnis'; });

  function aksiTxn(t) {
    return '<div class="actions">' +
      '<button class="btn btn-info btn-icon btn-sm" onclick="event.stopPropagation(); modalEditTransaksi(\'' + escapeHtmlAttr(t['ID']) + '\')"><i class="ri-edit-line"></i></button>' +
      '<button class="btn btn-danger btn-icon btn-sm" onclick="event.stopPropagation(); hapusTransaksiConfirm(\'' + escapeHtmlAttr(t['ID']) + '\')"><i class="ri-delete-bin-line"></i></button>' +
      '</div>';
  }

  function sectionTitle(label, count) {
    return '<div class="txn-section-title"><div><span>' + label + '</span><small>' + count + ' transaksi</small></div></div>';
  }

  if (isMobile) {
    function renderCards(list, label) {
      if (!list.length) return '';
      return sectionTitle(label, list.length) + '<div style="display:flex;flex-direction:column;gap:8px" class="stagger-in">' +
        list.map(function(t) {
        var tipe = txnAmbilTipe(t), nominal = txnAmbilNominal(t), akun = txnAmbilAkunUtama(t), kategori = txnAmbilKategori(t), keterangan = txnBersihKeterangan(t) || kategori || '-';
        var isIn = txnApakahMasuk(t), isTransfer = txnApakahTransfer(t);
        var iconClass = isTransfer ? 'income' : (isIn ? 'income' : 'expense');
        var iconName = isTransfer ? 'ri-arrow-left-right-line' : ('ri-arrow-' + (isIn ? 'up' : 'down') + '-circle-line');
        var tanda = isTransfer ? '' : (isIn ? '+' : '-');
        return '<div class="txn-card" onclick="openTransactionDetailById(\'' + escapeHtmlAttr(t['ID']) + '\')">' +
          '<div class="txn-icon ' + iconClass + '"><i class="' + iconName + '"></i></div>' +
          '<div class="txn-info"><div class="txn-name">' + renderKeteranganTooltip(keterangan, KETERANGAN_LIMIT_MOBILE) + '</div><div class="txn-date">' + tanggalIndo(t['Tanggal']) + ' &bull; ' + txnCell(tipe) + ' &bull; ' + txnCell(akun) + '</div></div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">' +
          '<div class="txn-amount ' + (isIn || isTransfer ? 'income' : 'expense') + '">' + tanda + rupiah(nominal) + '</div>' +
          aksiTxn(t) +
          '</div></div>';
      }).join('') + '</div>';
    }
    container.innerHTML = renderCards(pribadi, 'Transaksi Pribadi') + renderCards(bisnis, 'Transaksi Bisnis');
  } else {
    function tabelPribadi(list) {
      if (!list.length) return '';
      return sectionTitle('Transaksi Pribadi', list.length) +
        '<div class="card table-wrap txn-table-wrap"><table class="data-table txn-history-table"><thead><tr><th>Tanggal</th><th>Tipe Transaksi</th><th>Kategori</th><th>Akun Asal</th><th>Akun Tujuan</th><th>Biaya Admin</th><th>Keterangan</th><th>Nominal</th><th>Aksi</th></tr></thead><tbody>' +
        list.map(function(t) {
          return '<tr class="txn-click-row" onclick="openTransactionDetailById(\'' + escapeHtmlAttr(t['ID']) + '\')">' +
            '<td>' + tanggalIndo(t['Tanggal']) + '</td>' +
            '<td><span class="badge ' + txnBadgeClass(t) + '">' + txnCell(txnAmbilTipe(t)) + '</span></td>' +
            '<td>' + txnCell(txnAmbilKategori(t)) + '</td>' +
            '<td>' + txnCell(txnAmbilAkunAsal(t) || (txnAmbilTipe(t) === 'Pengeluaran' ? txnAmbilAkunUtama(t) : '')) + '</td>' +
            '<td>' + txnCell(txnAmbilAkunTujuan(t) || (txnAmbilTipe(t) === 'Pemasukan' ? txnAmbilAkunUtama(t) : '')) + '</td>' +
            '<td>' + (txnBiayaAdmin(t) ? rupiah(txnBiayaAdmin(t)) : '-') + '</td>' +
            '<td class="keterangan-cell">' + renderKeteranganTooltip(txnBersihKeterangan(t), KETERANGAN_LIMIT_TABLE) + '</td>' +
            '<td>' + txnNominalHtml(t) + '</td>' +
            '<td>' + aksiTxn(t) + '</td>' +
          '</tr>';
        }).join('') + '</tbody></table></div>';
    }

    function tabelBisnis(list) {
      if (!list.length) return '';
      return sectionTitle('Transaksi Bisnis', list.length) +
        '<div class="card table-wrap txn-table-wrap"><table class="data-table txn-history-table"><thead><tr><th>Tanggal</th><th>Tipe Pembayaran</th><th>Kategori</th><th>Pelanggan</th><th>Akun Asal</th><th>Akun Tujuan</th><th>Keterangan</th><th>Nominal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
        list.map(function(t) {
          return '<tr class="txn-click-row" onclick="openTransactionDetailById(\'' + escapeHtmlAttr(t['ID']) + '\')">' +
            '<td>' + tanggalIndo(t['Tanggal']) + '</td>' +
            '<td><span class="badge ' + txnBadgeClass(t) + '">' + txnCell(txnAmbilTipe(t)) + '</span></td>' +
            '<td>' + txnCell(txnAmbilKategori(t)) + '</td>' +
            '<td>' + txnCell(txnAmbilPelanggan(t)) + '</td>' +
            '<td>' + txnCell(txnAmbilAkunAsal(t)) + '</td>' +
            '<td>' + txnCell(txnAmbilAkunTujuan(t)) + '</td>' +
            '<td class="keterangan-cell">' + renderKeteranganTooltip(txnBersihKeterangan(t), KETERANGAN_LIMIT_TABLE) + '</td>' +
            '<td>' + txnNominalHtml(t) + '</td>' +
            '<td><span class="badge badge-neon">' + txnCell(txnAmbilStatus(t)) + '</span></td>' +
            '<td>' + aksiTxn(t) + '</td>' +
          '</tr>';
        }).join('') + '</tbody></table></div>';
    }
    container.innerHTML = tabelPribadi(pribadi) + tabelBisnis(bisnis);
  }
}

var MASTER_TRANSAKSI_LOADED = false;

function loadMasterInputTransaksi(callback, forceReload) {
  if (MASTER_TRANSAKSI_LOADED && !forceReload) { if (callback) callback(); return; }
  DATA_AKUN = []; DATA_KATEGORI = [];
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status !== 'success') { showToast(r.pesan || 'Gagal memuat master transaksi.', 'error'); if (callback) callback(); return; }
      DATA_AKUN = r.data && r.data.akun ? r.data.akun : [];
      DATA_KATEGORI = r.data && r.data.kategori ? r.data.kategori : [];
      MASTER_TRANSAKSI_LOADED = true;
      if (callback) callback();
    })
    .withFailureHandler(function() { showToast('Gagal memuat akun dan kategori.', 'error'); if (callback) callback(); })
    .getMasterInputTransaksi(STATE.user.spreadsheetId);
}

function buatOptionsAkun(selectedValue) {
  var akunAktif = DATA_AKUN.filter(function(a) { return !a['Status'] || a['Status'] === 'Aktif'; });
  if (!akunAktif.length) return '<option value="">Belum ada akun</option>';
  return '<option value="">Pilih akun</option>' + akunAktif.map(function(a) {
    var nama = a['Nama Akun'] || '';
    return '<option value="' + nama + '"' + (nama === selectedValue ? ' selected' : '') + '>' + nama + '</option>';
  }).join('');
}

function kategoriBisnisDefault() {
  return ['Print', 'Cuci Motor', 'Sopir', 'Lainnya'];
}

function tipePembayaranBisnisDefault() {
  return ['Pembayaran Pelanggan', 'Operasional Bisnis', 'Refund', 'Lainnya'];
}

function isKategoriTipePembayaranBisnis(k) {
  var jenis = String(k && k['Jenis'] || '').trim();
  var nama = String(k && k['Nama'] || '').trim();
  if (jenis === 'TipePembayaranBisnis') return true;
  return jenis === 'Bisnis' && ['Pembayaran Pelanggan', 'Pembayaran Masuk', 'Operasional Bisnis', 'Refund'].indexOf(nama) !== -1;
}

function isKategoriBisnisUsaha(k) {
  var jenis = String(k && k['Jenis'] || '').trim();
  return jenis === 'Bisnis' && !isKategoriTipePembayaranBisnis(k);
}

function buatOptionsKategori(jenisKeuangan, tipe, selectedValue) {
  var kategori = DATA_KATEGORI.filter(function(k) { return !k['Status'] || k['Status'] === 'Aktif'; });
  kategori = kategori.filter(function(k) {
    var jk = String(k['Jenis'] || '').trim();
    if (jenisKeuangan === 'Bisnis') return isKategoriBisnisUsaha(k);
    if (jenisKeuangan === 'Pribadi') {
      if (tipe === 'Pemasukan') return jk === 'Pemasukan Pribadi' || jk === 'Pemasukan';
      if (tipe === 'Pengeluaran') return jk === 'Pengeluaran Pribadi' || jk === 'Pengeluaran';
      if (tipe === 'Transfer') return false;
    }
    return false;
  });

  var namaKategori = kategori.map(function(k) { return k['Nama'] || ''; }).filter(Boolean);
  if (jenisKeuangan === 'Bisnis') {
    kategoriBisnisDefault().forEach(function(nama) {
      if (namaKategori.indexOf(nama) === -1) namaKategori.push(nama);
    });
  }
  if (selectedValue && namaKategori.indexOf(selectedValue) === -1) namaKategori.unshift(selectedValue);

  if (!namaKategori.length) return '<option value="">Belum ada kategori</option>';
  return '<option value="">Pilih kategori</option>' + namaKategori.map(function(nama) {
    return '<option value="' + nama + '"' + (nama === selectedValue ? ' selected' : '') + '>' + nama + '</option>';
  }).join('');
}

function kategoriBudgetAktif() {
  var kategori = DATA_KATEGORI.filter(function(k) { return !k['Status'] || k['Status'] === 'Aktif'; });
  kategori = kategori.filter(function(k) {
    var jenis = String(k['Jenis'] || '').trim();
    if (isRolePribadiOnly()) return jenis === 'Pengeluaran Pribadi' || jenis === 'Pengeluaran';
    if (isRoleBisnisOnly()) return isKategoriBisnisUsaha(k);
    return jenis === 'Pengeluaran Pribadi' || jenis === 'Pengeluaran' || isKategoriBisnisUsaha(k);
  });
  var namaKategori = kategori.map(function(k) { return k['Nama'] || ''; }).filter(Boolean);
  if (!isRolePribadiOnly()) {
    kategoriBisnisDefault().forEach(function(nama) {
      if (namaKategori.indexOf(nama) === -1) namaKategori.push(nama);
    });
  }
  return namaKategori.filter(function(nama, idx, arr) { return arr.indexOf(nama) === idx; });
}

function buatOptionsKategoriBudget(selectedValue) {
  var namaKategori = kategoriBudgetAktif();
  if (selectedValue && namaKategori.indexOf(selectedValue) === -1) namaKategori.unshift(selectedValue);
  if (!namaKategori.length) return '<option value="">Belum ada kategori pengeluaran</option>';
  return '<option value="">Pilih kategori budget</option>' + namaKategori.map(function(nama) {
    return '<option value="' + escapeHtmlAttr(nama) + '"' + (nama === selectedValue ? ' selected' : '') + '>' + escapeHtmlText(nama) + '</option>';
  }).join('');
}

function renderSelectJenisKeuangan() {
  var role = getRoleUser();
  if (role === 'UserBisnis') return '<select class="form-control" id="txnJenisKeuangan" onchange="aturFormTransaksiManual()" disabled><option value="Bisnis" selected>Bisnis</option></select>';
  if (role === 'UserPribadi') return '<select class="form-control" id="txnJenisKeuangan" onchange="aturFormTransaksiManual()" disabled><option value="Pribadi" selected>Pribadi</option></select>';
  return '<select class="form-control" id="txnJenisKeuangan" onchange="aturFormTransaksiManual()"><option value="Pribadi" selected>Pribadi</option><option value="Bisnis">Bisnis</option></select>';
}

function renderSelectJenisKeuanganEdit(selected) {
  var role = getRoleUser();
  selected = selected || 'Pribadi';
  if (role === 'UserBisnis') return '<select class="form-control" id="editTxnJenisKeuangan" onchange="aturFormTransaksiEdit()" disabled><option value="Bisnis" selected>Bisnis</option></select>';
  if (role === 'UserPribadi') return '<select class="form-control" id="editTxnJenisKeuangan" onchange="aturFormTransaksiEdit()" disabled><option value="Pribadi" selected>Pribadi</option></select>';
  return '<select class="form-control" id="editTxnJenisKeuangan" onchange="aturFormTransaksiEdit()"><option value="Pribadi"' + (selected === 'Pribadi' ? ' selected' : '') + '>Pribadi</option><option value="Bisnis"' + (selected === 'Bisnis' ? ' selected' : '') + '>Bisnis</option></select>';
}

function renderStrukUploadArea() {
  return '<div class="struk-scan-box">' +
    '<input type="file" id="inputStrukGambar" accept="image/*" class="hidden" onchange="handleStrukFile(this)">' +
    '<div class="struk-scan-icon"><i class="ri-receipt-line"></i></div>' +
    '<div class="struk-scan-copy"><strong>Input dari Struk</strong><span>Foto atau upload gambar struk, cek preview, lalu simpan per item.</span></div>' +
    '<div class="struk-scan-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" onclick="pilihStrukFile(true)"><i class="ri-camera-line"></i> Foto Struk</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" onclick="pilihStrukFile(false)"><i class="ri-image-add-line"></i> Upload Gambar Struk</button>' +
    '</div>' +
    '<div id="strukPreviewArea"></div>' +
  '</div>';
}

function pilihStrukFile(useCamera) {
  var input = document.getElementById('inputStrukGambar');
  if (!input) return;
  input.value = '';
  if (useCamera) input.setAttribute('capture', 'environment');
  else input.removeAttribute('capture');
  input.click();
}

function setManualTransaksiVisible(visible) {
  var manual = document.getElementById('manualTxnForm');
  if (manual) manual.classList.toggle('hidden', !visible);
  var footer = document.getElementById('manualTxnFooter');
  if (footer) footer.classList.toggle('hidden', !visible);
}

function handleStrukFile(input) {
  var file = input && input.files ? input.files[0] : null;
  if (!file) return;
  if (!/^image\//.test(file.type || '')) {
    showToast('File struk harus berupa gambar.', 'error');
    return;
  }
  var token = ++STRUK_SCAN_TOKEN;
  STRUK_PREVIEW_DATA = null;
  STRUK_UNDO_STACK = [];
  STRUK_REDO_STACK = [];
  setManualTransaksiVisible(false);
  var preview = document.getElementById('strukPreviewArea');
  if (preview) {
    preview.innerHTML =
      '<div class="struk-loading"><i class="ri-loader-4-line mt-spin"></i><div><strong>Membaca struk...</strong><span>Preview lama dibersihkan, menunggu hasil foto baru.</span></div></div>';
  }
  var btns = document.querySelectorAll('.struk-scan-actions .btn');
  btns.forEach(function(btn) { btn.disabled = true; });
  showToast('Membaca struk...', 'info');
  scanStrukMock(file)
    .then(function(raw) {
      if (token !== STRUK_SCAN_TOKEN) return;
      showToast('Menganalisis diskon/voucher...', 'info');
      STRUK_PREVIEW_DATA = parseStrukResult(raw);
      renderPreviewStruk(STRUK_PREVIEW_DATA);
    })
    .catch(function(err) {
      if (token !== STRUK_SCAN_TOKEN) return;
      console.error(err);
      STRUK_PREVIEW_DATA = null;
      setManualTransaksiVisible(true);
      if (preview) preview.innerHTML = '';
      showToast('Gagal membaca struk. Silakan input manual.', 'error');
    })
    .finally(function() {
      if (token !== STRUK_SCAN_TOKEN) return;
      btns.forEach(function(btn) { btn.disabled = false; });
    });
}

function scanStrukMock(file) {
  return scanStrukOcr(file).catch(function(err) {
    console.warn('OCR asli gagal, pakai mock struk:', err);
    showToast('OCR belum berhasil membaca jelas. Preview contoh ditampilkan, silakan koreksi.', 'warning');
    return scanStrukFallbackMock(file);
  });
}

function scanStrukOcr(file) {
  return ensureTesseractJs().then(function(TesseractLib) {
    if (!TesseractLib || typeof TesseractLib.recognize !== 'function') {
      throw new Error('Tesseract tidak tersedia.');
    }
    return TesseractLib.recognize(file, 'ind+eng', {
      logger: function(m) {
        var preview = document.getElementById('strukPreviewArea');
        if (!preview || !m || m.status !== 'recognizing text') return;
        var pct = Math.round((m.progress || 0) * 100);
        preview.innerHTML =
          '<div class="struk-loading"><i class="ri-loader-4-line mt-spin"></i><div><strong>Membaca teks struk...</strong><span>Progress OCR ' + pct + '%</span></div></div>';
      }
    }).then(function(result) {
      var text = result && result.data ? result.data.text : '';
      if (!String(text || '').trim()) throw new Error('Teks struk kosong.');
      return parseStrukText(text, file);
    });
  });
}

function scanStrukFallbackMock(file) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      var seedText = String((file && file.name) || '') + '|' + String((file && file.size) || 0) + '|' + String((file && file.lastModified) || Date.now());
      var seed = 0;
      for (var i = 0; i < seedText.length; i++) seed = (seed + seedText.charCodeAt(i) * (i + 1)) % 9973;
      var variants = [
        {
          toko: 'Contoh Minimarket',
          metode: seed % 2 === 0 ? 'CASH' : 'DANA',
          items: [
            { nama: 'Roti Coklat', qty: 2, hargaSatuan: 10000, subtotal: 20000 },
            { nama: 'Air Mineral', qty: 1, hargaSatuan: 5000, subtotal: 5000 },
            { nama: 'Sabun Mandi', qty: 1, hargaSatuan: 12000, subtotal: 12000 }
          ],
          diskon: 3000
        },
        {
          toko: 'Contoh Warung Makan',
          metode: seed % 2 === 0 ? 'QRIS DANA' : 'CASH',
          items: [
            { nama: 'Nasi Ayam', qty: 1, hargaSatuan: 18000, subtotal: 18000 },
            { nama: 'Es Teh', qty: 2, hargaSatuan: 5000, subtotal: 10000 },
            { nama: 'Parkir', qty: 1, hargaSatuan: 2000, subtotal: 2000 }
          ],
          diskon: 2000
        },
        {
          toko: 'Contoh Toko Rumah',
          metode: seed % 2 === 0 ? 'BCA Debit' : 'OVO',
          items: [
            { nama: 'Tisu', qty: 2, hargaSatuan: 8000, subtotal: 16000 },
            { nama: 'Deterjen', qty: 1, hargaSatuan: 22000, subtotal: 22000 },
            { nama: 'Kopi Sachet', qty: 3, hargaSatuan: 2500, subtotal: 7500 }
          ],
          diskon: 4500
        }
      ];
      var chosen = variants[seed % variants.length];
      resolve({
        fileName: file.name,
        tanggal: new Date().toISOString().split('T')[0],
        toko: chosen.toko + ' #' + (seed % 100),
        metodePembayaran: chosen.metode,
        items: chosen.items,
        diskon: chosen.diskon,
        pajak: 0,
        service: 0
      });
    }, 850);
  });
}

function angkaDariStruk(text) {
  var raw = String(text || '')
    .replace(/rp/gi, '')
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '');
  if (!raw) return 0;
  if (raw.indexOf(',') !== -1 && raw.indexOf('.') !== -1) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else {
    raw = raw.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
  }
  var n = parseFloat(raw);
  return isNaN(n) ? 0 : Math.round(n);
}

function kandidatNominalStruk(line) {
  return tokenNominalStruk(line).map(function(m) { return angkaDariStruk(m); })
    .filter(function(n) { return n > 0 && n < 100000000; });
}

function tokenNominalStruk(line) {
  var text = String(line || '').replace(/rp/gi, ' ');
  return text.match(/-?\d{1,3}(?:[.,]\d{3})+(?:,\d{1,2})?|-?\d{4,}(?:,\d{1,2})?/g) || [];
}

function ambilNominalAkhirLine(line) {
  var nums = kandidatNominalStruk(line);
  return nums.length ? nums[nums.length - 1] : 0;
}

function qtyDariLineStruk(line, nominalTokens) {
  var xQty = String(line || '').match(/\b(\d+(?:[.,]\d+)?)\s*[xX]\b|\b[xX]\s*(\d+(?:[.,]\d+)?)\b/);
  if (xQty) return Number(String(xQty[1] || xQty[2]).replace(',', '.')) || 1;
  if ((nominalTokens || []).length >= 2) {
    var unitToken = nominalTokens[nominalTokens.length - 2];
    var unitIdx = String(line).lastIndexOf(unitToken);
    var beforeUnit = unitIdx > 0 ? String(line).slice(0, unitIdx).trim() : '';
    var qtyMatch = beforeUnit.match(/(?:^|\s)(\d+(?:[.,]\d+)?)$/);
    if (qtyMatch) return Number(String(qtyMatch[1]).replace(',', '.')) || 1;
  }
  return 1;
}

function namaItemDariLineStruk(line, nominalTokens) {
  var text = String(line || '').trim();
  var tokens = nominalTokens || tokenNominalStruk(text);
  if (tokens.length >= 2) {
    var unitToken = tokens[tokens.length - 2];
    var unitIdx = text.lastIndexOf(unitToken);
    if (unitIdx > 0) text = text.slice(0, unitIdx).trim();
  } else if (tokens.length) {
    var lastToken = tokens[tokens.length - 1];
    text = text.slice(0, text.lastIndexOf(lastToken)).trim();
  }
  text = text
    .replace(/\b\d+\s*[xX]\s*\d[\d.,]*/g, '')
    .replace(/\s+[xX]\s*\d+(?:[.,]\d+)?$/i, '')
    .replace(/\s+\d+(?:[.,]\d+)?$/, '')
    .replace(/\brp\b/gi, '')
    .replace(/^[^\w]+|[^\w]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

function isBarisRingkasanStruk(line) {
  var lower = String(line || '').toLowerCase();
  return /harga\s*jua?l|subtotal|sub\s*total|grand\s*total|total\s*akhir|total\s*bayar|jumlah\s*bayar|net\s*total|^total\b|tunai|cash|bayar|kembali|change|saldo|anda\s*hemat|pajak|tax|ppn|service|layanan/.test(lower);
}

function isNamaItemStrukValid(nama) {
  var s = String(nama || '').trim();
  if (!s) return false;
  if (/^rp\s*\d/i.test(s) || /^rp$/i.test(s)) return false;
  if (isBarisRingkasanStruk(s)) return false;
  var letters = s.replace(/\brp\b/gi, '').replace(/[^a-zA-Z]/g, '');
  if (letters.length < 3) return false;
  var noise = s.replace(/\brp\b/gi, '').replace(/["'`.,:;_\-\s\d]/g, '');
  return noise.length >= 2;
}

function normalizeOcrLine(line) {
  return String(line || '')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTanggalStrukText(text) {
  var s = String(text || '');
  var m = s.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (m) return m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
  m = s.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) {
    var y = String(m[3]);
    if (y.length === 2) y = '20' + y;
    return y + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
  }
  return new Date().toISOString().split('T')[0];
}

function parseMetodeStrukText(text) {
  var upper = String(text || '').toUpperCase();
  if (/DANA/.test(upper)) return 'DANA';
  if (/GOPAY|GO-PAY/.test(upper)) return 'GOPAY';
  if (/OVO/.test(upper)) return 'OVO';
  if (/QRIS/.test(upper)) return 'QRIS';
  if (/BCA|BRI|BNI|MANDIRI|DEBIT|KREDIT|CREDIT|KARTU/.test(upper)) return 'Kartu/Bank';
  if (/CASH|TUNAI/.test(upper)) return 'CASH';
  return '';
}

function parseStrukText(text, file) {
  var lines = String(text || '').split(/\r?\n/)
    .map(normalizeOcrLine)
    .filter(function(line) { return line.length >= 2; });
  if (!lines.length) throw new Error('Tidak ada teks terbaca.');

  var toko = lines.find(function(line) {
    return !/(total|subtotal|diskon|voucher|pajak|tax|service|bayar|tunai|cash|kembali|tanggal|date|qty|harga)/i.test(line);
  }) || ((file && file.name) ? file.name.replace(/\.[^.]+$/, '') : 'Struk');

  var subtotal = 0;
  var totalAkhir = 0;
  var diskon = 0;
  var pajak = 0;
  var service = 0;
  var items = [];

  lines.forEach(function(line) {
    var nominal = ambilNominalAkhirLine(line);
    var lower = line.toLowerCase();
    if (!nominal) return;

    if (/grand\s*total|total\s*akhir|total\s*bayar|jumlah\s*bayar|net\s*total|^total\b/.test(lower)) {
      totalAkhir = nominal;
      return;
    }
    if (/subtotal|sub\s*total/.test(lower)) {
      subtotal = nominal;
      return;
    }
    if (/diskon|disc|voucher|promo|cashback|potongan/.test(lower)) {
      diskon += nominal;
      return;
    }
    if (/pajak|tax|ppn/.test(lower)) {
      pajak += nominal;
      return;
    }
    if (/service|layanan/.test(lower)) {
      service += nominal;
      return;
    }
    if (isBarisRingkasanStruk(line) || /total\s*(item|barang|belanja)|jumlah\s*(item|barang)/.test(lower)) return;
    if (/bayar|tunai|cash|kembali|change|saldo|card|debit|kredit|qris|dana|gopay|ovo/.test(lower)) return;

    var nominalTokens = tokenNominalStruk(line);
    var namePart = namaItemDariLineStruk(line, nominalTokens);
    var qty = qtyDariLineStruk(line, nominalTokens);
    if (isNamaItemStrukValid(namePart)) {
      items.push({
        nama: namePart,
        qty: qty || 1,
        hargaSatuan: qty > 1 ? Math.round(nominal / qty) : nominal,
        subtotal: nominal
      });
    }
  });

  var itemSubtotal = items.reduce(function(sum, item) { return sum + angkaNominal(item.subtotal); }, 0);
  if (!subtotal) subtotal = itemSubtotal;
  if (!totalAkhir) totalAkhir = Math.max(0, (subtotal || itemSubtotal) - diskon + pajak + service);
  if (!items.length && totalAkhir) {
    items.push({ nama: 'Belanja ' + toko, qty: 1, hargaSatuan: totalAkhir, subtotal: Math.max(totalAkhir + diskon - pajak - service, totalAkhir) });
  }

  return {
    fileName: file && file.name,
    tanggal: parseTanggalStrukText(text),
    toko: toko,
    metodePembayaran: parseMetodeStrukText(text),
    items: items,
    diskon: diskon,
    pajak: pajak,
    service: service,
    totalAkhir: totalAkhir,
    rawText: text
  };
}

function kategoriAktifPribadiPengeluaran() {
  return DATA_KATEGORI.filter(function(k) {
    var jenis = String(k['Jenis'] || '').trim();
    return (!k['Status'] || k['Status'] === 'Aktif') && (jenis === 'Pengeluaran Pribadi' || jenis === 'Pengeluaran');
  }).map(function(k) { return k['Nama']; }).filter(Boolean);
}

function pilihKategoriStruk(namaItem) {
  var list = kategoriAktifPribadiPengeluaran();
  var lower = String(namaItem || '').toLowerCase();
  function has(name) { return list.some(function(k) { return String(k).toLowerCase() === String(name).toLowerCase(); }); }
  if (/(makan|minum|nasi|ayam|roti|kopi|air|teh|snack|mie)/i.test(lower) && has('Makan & Minum')) return 'Makan & Minum';
  if (/(bensin|ojek|parkir|tol|transport|grab|gojek)/i.test(lower) && has('Transportasi')) return 'Transportasi';
  if (/(sabun|sampo|shampoo|tisu|deterjen|pewangi)/i.test(lower) && has('Kebutuhan Rumah')) return 'Kebutuhan Rumah';
  if (has('Lainnya')) return 'Lainnya';
  return list[0] || '';
}

function akunDariMetodeStruk(metode) {
  var akunAktif = DATA_AKUN.filter(function(a) { return !a['Status'] || a['Status'] === 'Aktif'; });
  var m = String(metode || '').toLowerCase();
  var target = '';
  if (/cash|tunai/.test(m)) target = 'cash';
  else if (/dana/.test(m)) target = 'dana';
  else if (/gopay|go-pay/.test(m)) target = 'gopay';
  else if (/ovo/.test(m)) target = 'ovo';
  else if (/bank|kartu|debit|credit|kredit|bca|bri|bni|mandiri/.test(m)) target = 'bank';
  var found = akunAktif.find(function(a) {
    var nama = String(a['Nama Akun'] || '').toLowerCase();
    var jenis = String(a['Jenis'] || '').toLowerCase();
    if (target === 'bank') return /bank|bca|bri|bni|mandiri/.test(nama + ' ' + jenis);
    return target && nama.indexOf(target) !== -1;
  });
  return found ? found['Nama Akun'] : '';
}

function hitungDiskonProporsional(items, diskonTotal, totalAkhir) {
  items = (items || []).map(function(item) {
    var qty = angkaQtyStruk(item.qty);
    var subtotal = angkaNominal(item.subtotal !== undefined ? item.subtotal : (qty * angkaNominal(item.hargaSatuan)));
    var hargaSatuan = angkaNominal(item.hargaSatuan) || Math.round(subtotal / Math.max(1, qty));
    subtotal = Math.round(qty * hargaSatuan) || subtotal;
    return Object.assign({}, item, { qty: qty, hargaSatuan: hargaSatuan, subtotal: subtotal });
  });
  var subtotalAll = items.reduce(function(sum, item) { return sum + angkaNominal(item.subtotal); }, 0);
  var targetTotal = totalAkhir !== undefined && totalAkhir !== null ? angkaNominal(totalAkhir) : Math.max(0, subtotalAll - angkaNominal(diskonTotal));
  var running = 0;
  return items.map(function(item, idx) {
    var nominal = idx === items.length - 1 ? targetTotal - running : Math.round((angkaNominal(item.subtotal) / Math.max(1, subtotalAll)) * targetTotal);
    running += nominal;
    var diskonItem = Math.max(0, angkaNominal(item.subtotal) - nominal);
    return Object.assign({}, item, { nominalAkhir: nominal, diskonItem: diskonItem });
  });
}

function parseStrukResult(raw) {
  raw = raw || {};
  var subtotal = (raw.items || []).reduce(function(sum, item) { return sum + angkaNominal(item.subtotal); }, 0);
  var diskon = angkaNominal(raw.diskon);
  var pajak = angkaNominal(raw.pajak) + angkaNominal(raw.service);
  var totalAkhir = raw.totalAkhir !== undefined ? angkaNominal(raw.totalAkhir) : Math.max(0, subtotal - diskon + pajak);
  var targetItem = diskon > 0 ? totalAkhir : undefined;
  var items = hitungDiskonProporsional(raw.items || [], Math.max(0, diskon - pajak), targetItem).map(function(item) {
    var next = Object.assign({}, item, { kategori: pilihKategoriStruk(item.nama) });
    next.keterangan = buatKeteranganItemStruk(next);
    return next;
  });
  return {
    tanggal: raw.tanggal || new Date().toISOString().split('T')[0],
    toko: raw.toko || 'Struk',
    metodePembayaran: raw.metodePembayaran || '',
    subtotal: subtotal,
    diskon: diskon,
    pajak: pajak,
    totalAkhir: totalAkhir,
    akun: akunDariMetodeStruk(raw.metodePembayaran),
    items: items
  };
}

function optionKategoriStruk(selected) {
  var options = buatOptionsKategori('Pribadi', 'Pengeluaran', selected);
  return options;
}

function buatKeteranganItemStruk(item) {
  item = item || {};
  var nama = item.nama || 'Item';
  var qty = angkaQtyStruk(item.qty);
  var harga = angkaNominal(item.hargaSatuan) || Math.round(angkaNominal(item.subtotal || item.nominalAkhir || item.nominal) / Math.max(1, qty));
  var diskon = angkaNominal(item.diskonItem);
  return nama + ' | ' + formatQtyStruk(qty) + ' x ' + rupiah(harga) + (diskon ? ' | Diskon: ' + rupiah(diskon) : '');
}

function isKeteranganAutoStruk(text) {
  return /\sx\d+|\|\s*Harga:|\|\s*Diskon:|\|\s*\d+(?:[.,]\d+)?\s*x\s*Rp/i.test(String(text || ''));
}

function buatItemStrukManual() {
  var nama = 'Item tambahan';
  var item = {
    nama: nama,
    qty: 1,
    hargaSatuan: 0,
    subtotal: 0,
    diskonItem: 0,
    nominalAkhir: 0,
    kategori: pilihKategoriStruk(nama)
  };
  item.keterangan = buatKeteranganItemStruk(item);
  return item;
}

function angkaQtyStruk(value) {
  var n = parseFloat(String(value || '1').replace(',', '.').replace(/[^\d.]/g, ''));
  return (!n || n <= 0 || isNaN(n)) ? 1 : n;
}

function formatQtyStruk(value) {
  var n = angkaQtyStruk(value);
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}

function hitungItemPreviewStruk(item, totalDiutamakan) {
  item = item || {};
  var qty = angkaQtyStruk(item.qty);
  var harga = angkaNominal(item.hargaSatuan);
  var subtotalLama = angkaNominal(item.subtotal);
  var nominalLama = angkaNominal(item.nominalAkhir || item.nominal);
  if (!harga) harga = subtotalLama ? Math.round(subtotalLama / Math.max(1, qty)) : Math.round(nominalLama / Math.max(1, qty));
  var subtotal = Math.round(qty * harga);
  var diskon = angkaNominal(item.diskonItem);
  var nominal = Math.max(0, subtotal - diskon);
  if (totalDiutamakan) {
    nominal = Math.min(subtotal, nominalLama || subtotal);
    diskon = Math.max(0, subtotal - nominal);
  }
  return Object.assign({}, item, {
    qty: qty,
    hargaSatuan: harga,
    subtotal: subtotal,
    diskonItem: diskon,
    nominalAkhir: nominal
  });
}

function recalHitungTotalPreviewStruk(updateKeterangan) {
  if (!STRUK_PREVIEW_DATA) return;
  var subtotal = 0;
  var diskon = 0;
  var total = 0;
  STRUK_PREVIEW_DATA.items = (STRUK_PREVIEW_DATA.items || []).map(function(item) {
    var next = hitungItemPreviewStruk(item);
    if (updateKeterangan && (!next.keterangan || isKeteranganAutoStruk(next.keterangan))) {
      next.keterangan = buatKeteranganItemStruk(next);
    }
    subtotal += angkaNominal(next.subtotal);
    diskon += angkaNominal(next.diskonItem);
    total += angkaNominal(next.nominalAkhir);
    return next;
  });
  STRUK_PREVIEW_DATA.subtotal = subtotal;
  STRUK_PREVIEW_DATA.diskon = diskon;
  STRUK_PREVIEW_DATA.totalAkhir = total;
}

function renderPreviewStruk(data) {
  var el = document.getElementById('strukPreviewArea');
  if (!el || !data) return;
  var totalItem = (data.items || []).reduce(function(sum, item) { return sum + angkaNominal(item.nominalAkhir); }, 0);
  var warningStyle = totalItem !== angkaNominal(data.totalAkhir) ? '' : ' style="display:none"';
  el.innerHTML = '<div class="struk-preview">' +
    '<div class="struk-preview-head"><div><strong>' + escapeHtmlText(data.toko) + '</strong><span>' + escapeHtmlText(tanggalIndo(data.tanggal)) + ' &bull; ' + escapeHtmlText(data.metodePembayaran || '-') + '</span></div><i class="ri-scan-2-line"></i></div>' +
    '<div class="struk-summary-grid">' +
      '<div><span>Total Harga</span><strong id="strukSummarySubtotal">' + rupiah(data.subtotal) + '</strong></div>' +
      '<div><span>Diskon</span><strong id="strukSummaryDiskon">' + rupiah(data.diskon) + '</strong></div>' +
      '<div><span>Pajak/Biaya</span><strong id="strukSummaryPajak">' + rupiah(data.pajak) + '</strong></div>' +
      '<div><span>Total Bayar</span><strong id="strukSummaryTotal">' + rupiah(data.totalAkhir) + '</strong></div>' +
    '</div>' +
    (data.rawText ? '<details class="struk-raw-text"><summary>Teks OCR terbaca</summary><pre>' + escapeHtmlText(data.rawText) + '</pre></details>' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><label>Jenis Keuangan</label><select class="form-control" id="strukJenisKeuangan"><option value="Pribadi" selected>Pribadi</option></select></div>' +
      '<div class="form-group"><label>Tipe Transaksi</label><select class="form-control" id="strukTipeTransaksi"><option value="Pengeluaran" selected>Pengeluaran</option></select></div>' +
    '</div>' +
    '<div class="form-group"><label>Akun Pembayaran *</label><select class="form-control" id="strukAkun" onfocus="catatUndoStruk()" onchange="syncStrukPreviewDariInput()">' + buatOptionsAkun(data.akun) + '</select></div>' +
    '<div class="struk-item-list">' +
      (data.items || []).map(function(item, i) {
        return '<div class="struk-item-card" data-index="' + i + '">' +
          '<div class="struk-item-toolbar"><span>Item ' + (i + 1) + '</span><button type="button" class="struk-item-remove" onclick="hapusItemStruk(' + i + ')" title="Hapus item dari preview"><i class="ri-delete-bin-line"></i> Hapus</button></div>' +
          '<div class="form-row"><div class="form-group"><label>Nama Item</label><input class="form-control" id="strukItemNama_' + i + '" value="' + escapeHtmlAttr(item.nama) + '" onfocus="catatUndoStruk()" oninput="syncStrukPreviewDariInput()"></div><div class="form-group small"><label>Jumlah</label><input class="form-control" id="strukItemQty_' + i + '" value="' + escapeHtmlAttr(formatQtyStruk(item.qty || 1)) + '" inputmode="decimal" onfocus="catatUndoStruk()" oninput="syncStrukPreviewDariInput()"></div></div>' +
          '<div class="form-row"><div class="form-group"><label>Harga per Item</label><input class="form-control nominal-rupiah" id="strukItemHarga_' + i + '" value="' + escapeHtmlAttr(formatNominalInput(item.hargaSatuan || item.subtotal || item.nominalAkhir)) + '" inputmode="numeric" onfocus="catatUndoStruk()" oninput="syncStrukPreviewDariInput()"></div><div class="form-group"><label>Diskon Item</label><input class="form-control nominal-rupiah" id="strukItemDiskon_' + i + '" value="' + escapeHtmlAttr(formatNominalInput(item.diskonItem)) + '" inputmode="numeric" onfocus="catatUndoStruk()" oninput="syncStrukPreviewDariInput()"></div></div>' +
          '<div class="form-row"><div class="form-group"><label>Total Bayar Item</label><input class="form-control nominal-rupiah" id="strukItemNominal_' + i + '" value="' + escapeHtmlAttr(formatNominalInput(item.nominalAkhir)) + '" inputmode="numeric" onfocus="catatUndoStruk()" oninput="syncStrukPreviewDariInput()"></div><div class="form-group"><label>Kategori *</label><select class="form-control" id="strukItemKategori_' + i + '" onfocus="catatUndoStruk()" onchange="syncStrukPreviewDariInput()">' + optionKategoriStruk(item.kategori) + '</select></div></div>' +
          '<div class="form-group"><label>Catatan</label><input class="form-control" id="strukItemKet_' + i + '" value="' + escapeHtmlAttr(item.keterangan) + '" onfocus="catatUndoStruk()" oninput="syncStrukPreviewDariInput()"></div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="struk-add-manual">' +
      '<div><strong>Item tidak terbaca?</strong><span>Tambahkan manual di sini, total struk akan dihitung ulang otomatis.</span></div>' +
      '<button type="button" class="btn btn-secondary btn-sm" onclick="tambahItemStrukManual()"><i class="ri-add-circle-line"></i> Tambah Item Manual</button>' +
    '</div>' +
    '<div class="struk-warning" id="strukWarningTotal"' + warningStyle + '><i class="ri-alert-line"></i> Total item belum sama dengan total bayar struk.</div>' +
    '<div class="struk-preview-actions">' +
      '<button type="button" class="btn btn-secondary" id="btnUndoStruk" onclick="undoStrukPreview()" ' + (STRUK_UNDO_STACK.length ? '' : 'disabled') + '><i class="ri-arrow-go-back-line"></i></button>' +
      '<button type="button" class="btn btn-secondary" id="btnRedoStruk" onclick="redoStrukPreview()" ' + (STRUK_REDO_STACK.length ? '' : 'disabled') + '><i class="ri-arrow-go-forward-line"></i></button>' +
      '<button type="button" class="btn btn-primary" id="btnSimpanStruk" onclick="simpanTransaksiDariStruk()"><i class="ri-save-line"></i> Simpan Semua</button>' +
      '<button type="button" class="btn btn-danger" onclick="batalPreviewStruk()"><i class="ri-close-line"></i> Batal</button>' +
    '</div>' +
  '</div>';
  (data.items || []).forEach(function(_, i) {
    setupInputRupiah('strukItemHarga_' + i);
    setupInputRupiah('strukItemDiskon_' + i);
    setupInputRupiah('strukItemNominal_' + i);
  });
  updateStrukHistoryButtons();
}

function cloneStrukData(data) {
  return JSON.parse(JSON.stringify(data || {}));
}



function updateStrukHistoryButtons() {
  var undoBtn = document.getElementById('btnUndoStruk');
  var redoBtn = document.getElementById('btnRedoStruk');
  if (undoBtn) undoBtn.disabled = !STRUK_UNDO_STACK.length;
  if (redoBtn) redoBtn.disabled = !STRUK_REDO_STACK.length;
}

function catatUndoStruk() {
  if (!STRUK_PREVIEW_DATA) return;
  syncStrukPreviewDariInput();
  var current = JSON.stringify(STRUK_PREVIEW_DATA);
  var last = STRUK_UNDO_STACK.length ? JSON.stringify(STRUK_UNDO_STACK[STRUK_UNDO_STACK.length - 1]) : '';
  if (current !== last) {
    STRUK_UNDO_STACK.push(cloneStrukData(STRUK_PREVIEW_DATA));
    if (STRUK_UNDO_STACK.length > 30) STRUK_UNDO_STACK.shift();
    STRUK_REDO_STACK = [];
    updateStrukHistoryButtons();
  }
}

function syncStrukPreviewDariInput() {
  if (!STRUK_PREVIEW_DATA) return;
  var akun = document.getElementById('strukAkun');
  if (akun) STRUK_PREVIEW_DATA.akun = akun.value;
  var active = document.activeElement;
  STRUK_PREVIEW_DATA.items = (STRUK_PREVIEW_DATA.items || []).map(function(item, i) {
    var namaEl = document.getElementById('strukItemNama_' + i);
    var qtyEl = document.getElementById('strukItemQty_' + i);
    var hargaEl = document.getElementById('strukItemHarga_' + i);
    var diskonEl = document.getElementById('strukItemDiskon_' + i);
    var totalEl = document.getElementById('strukItemNominal_' + i);
    var ketEl = document.getElementById('strukItemKet_' + i);
    var ket = ketEl ? ketEl.value : item.keterangan;
    var qty = qtyEl ? angkaQtyStruk(qtyEl.value) : angkaQtyStruk(item.qty);
    var harga = hargaEl ? angkaNominal(hargaEl.value) : angkaNominal(item.hargaSatuan);
    var subtotalLama = angkaNominal(item.subtotal);
    if (!harga) harga = subtotalLama ? Math.round(subtotalLama / Math.max(1, qty)) : Math.round(angkaNominal(item.nominalAkhir || item.nominal) / Math.max(1, qty));
    var subtotal = Math.round(qty * harga);
    var totalDiubah = totalEl && active === totalEl;
    var diskon = diskonEl ? angkaNominal(diskonEl.value) : angkaNominal(item.diskonItem);
    var nominal = totalDiubah ? angkaNominal(totalEl.value) : Math.max(0, subtotal - diskon);
    if (nominal > subtotal) nominal = subtotal;
    if (totalDiubah) diskon = Math.max(0, subtotal - nominal);
    else if (diskon > subtotal) {
      diskon = subtotal;
      nominal = 0;
    }
    var next = Object.assign({}, item, {
      nama: namaEl ? namaEl.value : item.nama,
      qty: qty,
      hargaSatuan: harga,
      subtotal: subtotal,
      nominalAkhir: nominal,
      diskonItem: diskon,
      kategori: document.getElementById('strukItemKategori_' + i) ? document.getElementById('strukItemKategori_' + i).value : item.kategori,
      keterangan: ket
    });
    if (active !== ketEl && (!ket || isKeteranganAutoStruk(ket))) next.keterangan = buatKeteranganItemStruk(next);
    return next;
  });
  recalHitungTotalPreviewStruk(false);
  updateTampilanHitungStruk();
}

function updateTampilanHitungStruk() {
  if (!STRUK_PREVIEW_DATA) return;
  var setText = function(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = rupiah(value);
  };
  setText('strukSummarySubtotal', STRUK_PREVIEW_DATA.subtotal);
  setText('strukSummaryDiskon', STRUK_PREVIEW_DATA.diskon);
  setText('strukSummaryPajak', STRUK_PREVIEW_DATA.pajak);
  setText('strukSummaryTotal', STRUK_PREVIEW_DATA.totalAkhir);
  var active = document.activeElement;
  (STRUK_PREVIEW_DATA.items || []).forEach(function(item, i) {
    var hargaEl = document.getElementById('strukItemHarga_' + i);
    var diskonEl = document.getElementById('strukItemDiskon_' + i);
    var totalEl = document.getElementById('strukItemNominal_' + i);
    var ketEl = document.getElementById('strukItemKet_' + i);
    if (hargaEl && active !== hargaEl) hargaEl.value = formatNominalInput(item.hargaSatuan);
    if (diskonEl && active !== diskonEl) diskonEl.value = formatNominalInput(item.diskonItem);
    if (totalEl && active !== totalEl) totalEl.value = formatNominalInput(item.nominalAkhir);
    if (ketEl && active !== ketEl && (!ketEl.value || isKeteranganAutoStruk(ketEl.value))) {
      ketEl.value = item.keterangan || buatKeteranganItemStruk(item);
    }
  });
  var totalItem = (STRUK_PREVIEW_DATA.items || []).reduce(function(sum, item) {
    return sum + angkaNominal(item.nominalAkhir);
  }, 0);
  var warning = document.getElementById('strukWarningTotal');
  if (warning) warning.style.display = totalItem !== angkaNominal(STRUK_PREVIEW_DATA.totalAkhir) ? 'flex' : 'none';
}

function terapkanStrukPreview(data) {
  STRUK_PREVIEW_DATA = cloneStrukData(data);
  renderPreviewStruk(STRUK_PREVIEW_DATA);
}

function undoStrukPreview() {
  if (!STRUK_UNDO_STACK.length || !STRUK_PREVIEW_DATA) return;
  syncStrukPreviewDariInput();
  STRUK_REDO_STACK.push(cloneStrukData(STRUK_PREVIEW_DATA));
  terapkanStrukPreview(STRUK_UNDO_STACK.pop());
  showToast('Perubahan struk dibatalkan.', 'info');
}

function redoStrukPreview() {
  if (!STRUK_REDO_STACK.length || !STRUK_PREVIEW_DATA) return;
  syncStrukPreviewDariInput();
  STRUK_UNDO_STACK.push(cloneStrukData(STRUK_PREVIEW_DATA));
  terapkanStrukPreview(STRUK_REDO_STACK.pop());
  showToast('Perubahan struk dikembalikan.', 'info');
}

document.addEventListener('keydown', function(e) {
  if (!STRUK_PREVIEW_DATA || !document.getElementById('strukPreviewArea')) return;
  if (!(e.ctrlKey || e.metaKey)) return;
  var key = String(e.key || '').toLowerCase();
  if (key === 'z' && e.shiftKey) {
    e.preventDefault();
    redoStrukPreview();
    return;
  }
  if (key === 'z') {
    e.preventDefault();
    undoStrukPreview();
    return;
  }
  if (key === 'y') {
    e.preventDefault();
    redoStrukPreview();
  }
});

function hapusItemStruk(index) {
  if (!STRUK_PREVIEW_DATA || !Array.isArray(STRUK_PREVIEW_DATA.items)) return;
  catatUndoStruk();
  syncStrukPreviewDariInput();
  STRUK_PREVIEW_DATA.items.splice(index, 1);
  recalHitungTotalPreviewStruk(true);
  if (!STRUK_PREVIEW_DATA.items.length) {
    showToast('Semua item terhapus. Upload struk lagi atau batal untuk input manual.', 'warning');
  } else {
    showToast('Item struk dihapus dari preview.', 'info');
  }
  renderPreviewStruk(STRUK_PREVIEW_DATA);
}

function tambahItemStrukManual() {
  if (!STRUK_PREVIEW_DATA) return;
  catatUndoStruk();
  syncStrukPreviewDariInput();
  if (!Array.isArray(STRUK_PREVIEW_DATA.items)) STRUK_PREVIEW_DATA.items = [];
  STRUK_PREVIEW_DATA.items.push(buatItemStrukManual());
  recalHitungTotalPreviewStruk(true);
  renderPreviewStruk(STRUK_PREVIEW_DATA);
  var nextIndex = STRUK_PREVIEW_DATA.items.length - 1;
  setTimeout(function() {
    var el = document.getElementById('strukItemNama_' + nextIndex);
    if (el) {
      el.focus();
      el.select();
    }
  }, 50);
  showToast('Item manual ditambahkan.', 'success');
}

function batalPreviewStruk() {
  STRUK_SCAN_TOKEN++;
  STRUK_PREVIEW_DATA = null;
  STRUK_UNDO_STACK = [];
  STRUK_REDO_STACK = [];
  var el = document.getElementById('strukPreviewArea');
  if (el) el.innerHTML = '';
  setManualTransaksiVisible(true);
  var input = document.getElementById('inputStrukGambar');
  if (input) input.value = '';
}

function kumpulkanItemStruk() {
  if (!STRUK_PREVIEW_DATA) return [];
  syncStrukPreviewDariInput();
  return (STRUK_PREVIEW_DATA.items || []).map(function(_, i) {
    return {
      nama: document.getElementById('strukItemNama_' + i) ? document.getElementById('strukItemNama_' + i).value : '',
      qty: document.getElementById('strukItemQty_' + i) ? angkaQtyStruk(document.getElementById('strukItemQty_' + i).value) : 1,
      hargaSatuan: angkaNominal(document.getElementById('strukItemHarga_' + i) ? document.getElementById('strukItemHarga_' + i).value : 0),
      diskon: angkaNominal(document.getElementById('strukItemDiskon_' + i) ? document.getElementById('strukItemDiskon_' + i).value : 0),
      nominal: angkaNominal(document.getElementById('strukItemNominal_' + i) ? document.getElementById('strukItemNominal_' + i).value : 0),
      kategori: document.getElementById('strukItemKategori_' + i) ? document.getElementById('strukItemKategori_' + i).value : '',
      keterangan: document.getElementById('strukItemKet_' + i) ? document.getElementById('strukItemKet_' + i).value : ''
    };
  });
}

function simpanTransaksiDariStruk() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa menyimpan struk.')) return;
  var akun = document.getElementById('strukAkun') ? document.getElementById('strukAkun').value : '';
  var items = kumpulkanItemStruk();
  if (!akun) { showToast('Pilih akun pembayaran dulu.', 'error'); return; }
  if (!items.length) { showToast('Item struk kosong.', 'error'); return; }
  for (var i = 0; i < items.length; i++) {
    if (!items[i].nominal || !items[i].kategori) {
      showToast('Nominal dan kategori item wajib diisi.', 'error');
      return;
    }
  }
  var totalItem = items.reduce(function(sum, item) { return sum + angkaNominal(item.nominal); }, 0);
  var selisih = angkaNominal(STRUK_PREVIEW_DATA.totalAkhir) - totalItem;
  if (Math.abs(selisih) > 0 && Math.abs(selisih) <= 5 && items.length) {
    items[items.length - 1].nominal += selisih;
  } else if (Math.abs(selisih) > 5) {
    showToast('Total item belum cocok dengan total akhir struk.', 'warning');
    return;
  }
  var btn = document.getElementById('btnSimpanStruk');
  setButtonLoading(btn, true);
  if (btn) btn.innerHTML = '<i class="ri-loader-4-line mt-spin"></i> Menyimpan...';
  showToast('Menyimpan transaksi...', 'info');
  var index = 0;
  function next() {
    if (index >= items.length) {
      setButtonLoading(btn, false);
      STRUK_UNDO_STACK = [];
      STRUK_REDO_STACK = [];
      bersihkanCacheTransaksi();
      closeModalDirect();
      showToast('Transaksi struk berhasil disimpan.', 'success');
      refreshDataKeuanganTerkait();
      return;
    }
    var item = items[index++];
    google.script.run
      .withSuccessHandler(function(res) {
        var r = JSON.parse(res);
        if (r.status !== 'success') {
          setButtonLoading(btn, false);
          showToast(r.pesan || 'Gagal menyimpan item struk.', 'error');
          return;
        }
        next();
      })
      .withFailureHandler(function() {
        setButtonLoading(btn, false);
        showToast('Gagal menyimpan item struk.', 'error');
      })
      .tambahTransaksi(STATE.user.spreadsheetId, {
        tanggal: STRUK_PREVIEW_DATA.tanggal,
        jenisKeuangan: 'Pribadi',
        tipeTransaksi: 'Pengeluaran',
        nominal: item.nominal,
        kategori: item.kategori,
        akunAsal: akun,
        akunTujuan: '',
        keterangan: item.keterangan || (item.nama + ' x' + item.qty),
        status: 'Lunas',
        sumberInput: 'Struk Web',
        role: STATE.user.role,
        username: STATE.user.username
      });
  }
  next();
}

var STRUK_MANUAL_ITEMS = [];

function tanggalInputHariIni() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function waktuInputSekarang() {
  var d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function buatInvoiceStrukManual() {
  var d = new Date();
  return 'MT-' +
    String(d.getFullYear()).slice(-2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    '-' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0');
}

function itemStrukManualDefault(nama, harga) {
  return {
    nama: nama || 'Item manual',
    qty: 1,
    hargaSatuan: harga || 0,
    diskon: 0
  };
}

function renderStrukManual() {
  var content = document.getElementById('pageContent');
  if (!content) return;

  STRUK_MANUAL_ITEMS = [
    itemStrukManualDefault('Produk contoh', 25000),
    itemStrukManualDefault('Jasa / biaya tambahan', 10000)
  ];

  content.innerHTML =
    '<div class="page-content fade-in manual-receipt-page">' +
      '<div class="page-header">' +
        '<div class="page-title"><i class="ri-receipt-line"></i> Struk Manual</div>' +
        '<div class="page-actions">' +
          '<button type="button" class="btn btn-secondary btn-sm" onclick="resetStrukManual()"><i class="ri-refresh-line"></i></button>' +
          '<button type="button" class="btn btn-primary" onclick="downloadStrukManual()"><i class="ri-download-2-line"></i> Download</button>' +
        '</div>' +
      '</div>' +
      '<div class="manual-receipt-layout">' +
        '<section class="manual-receipt-panel">' +
          '<div class="manual-receipt-panel-head">' +
            '<div><strong>Data Nota</strong><span>Preview dan gambar dibuat di perangkat ini.</span></div>' +
            '<span class="manual-receipt-badge"><i class="ri-database-2-line"></i> Tanpa DB</span>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Nama Toko / Brand</label><input class="form-control" id="manualReceiptBrand" value="MoneyTrack Store" oninput="strukManualUpdatePreview()"></div>' +
            '<div class="form-group"><label>Invoice</label><input class="form-control" id="manualReceiptInvoice" value="' + escapeHtmlAttr(buatInvoiceStrukManual()) + '" oninput="strukManualUpdatePreview()"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Tanggal</label><input type="date" class="form-control" id="manualReceiptDate" value="' + tanggalInputHariIni() + '" oninput="strukManualUpdatePreview()"></div>' +
            '<div class="form-group"><label>Waktu</label><input type="time" class="form-control" id="manualReceiptTime" value="' + waktuInputSekarang() + '" oninput="strukManualUpdatePreview()"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Nama Pembeli</label><input class="form-control" id="manualReceiptCustomer" placeholder="Nama pembeli" oninput="strukManualUpdatePreview()"></div>' +
            '<div class="form-group"><label>No. WA Pembeli</label><input class="form-control" id="manualReceiptWa" placeholder="62812..." inputmode="tel" oninput="strukManualUpdatePreview()"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Metode Pembayaran</label><input class="form-control" id="manualReceiptMethod" value="QRIS" oninput="strukManualUpdatePreview()"></div>' +
            '<div class="form-group"><label>Status</label><select class="form-control" id="manualReceiptStatus" onchange="strukManualUpdatePreview()"><option value="Lunas" selected>Lunas</option><option value="Pending">Pending</option><option value="Belum Lunas">Belum Lunas</option></select></div>' +
          '</div>' +
          '<div class="manual-receipt-section-title">Item</div>' +
          '<div id="manualReceiptItems" class="manual-receipt-items"></div>' +
          '<div class="struk-add-manual">' +
            '<div><strong>Tambah item</strong><span>Total nota dihitung otomatis dari semua item.</span></div>' +
            '<button type="button" class="btn btn-secondary btn-sm" onclick="tambahItemStrukManualWeb()"><i class="ri-add-circle-line"></i> Tambah Item</button>' +
          '</div>' +
          '<div class="form-row manual-receipt-total-inputs">' +
            '<div class="form-group"><label>Diskon Tambahan</label><input class="form-control nominal-rupiah" id="manualReceiptExtraDiscount" placeholder="Rp 0" inputmode="numeric" oninput="strukManualUpdatePreview()"></div>' +
            '<div class="form-group"><label>Pajak / Biaya</label><input class="form-control nominal-rupiah" id="manualReceiptTax" placeholder="Rp 0" inputmode="numeric" oninput="strukManualUpdatePreview()"></div>' +
          '</div>' +
          '<div class="form-group"><label>Catatan</label><textarea class="form-control" id="manualReceiptNote" rows="3" placeholder="Catatan singkat di struk..." oninput="strukManualUpdatePreview()">Terima kasih.</textarea></div>' +
        '</section>' +
        '<section class="manual-receipt-preview-panel">' +
          '<div class="manual-receipt-preview-head">' +
            '<div><strong>Preview Gambar</strong><span id="manualReceiptSummary">Rp 0</span></div>' +
            '<button type="button" class="btn btn-primary btn-sm" onclick="downloadStrukManual()"><i class="ri-download-2-line"></i> PNG</button>' +
          '</div>' +
          '<div class="manual-receipt-canvas-wrap">' +
            '<canvas id="manualReceiptCanvas" width="1080" height="1200" aria-label="Preview struk manual"></canvas>' +
          '</div>' +
        '</section>' +
      '</div>' +
    '</div>';

  renderStrukManualItems();
  setupInputRupiah('manualReceiptExtraDiscount');
  setupInputRupiah('manualReceiptTax');
  setTimeout(strukManualUpdatePreview, 40);
}

function renderStrukManualItems() {
  var wrap = document.getElementById('manualReceiptItems');
  if (!wrap) return;
  wrap.innerHTML = (STRUK_MANUAL_ITEMS || []).map(function(item, i) {
    return '<div class="manual-receipt-item" data-index="' + i + '">' +
      '<div class="struk-item-toolbar">' +
        '<span>Item ' + (i + 1) + '</span>' +
        '<button type="button" class="struk-item-remove" onclick="hapusItemStrukManualWeb(' + i + ')" title="Hapus item"><i class="ri-delete-bin-line"></i> Hapus</button>' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Nama Item</label><input class="form-control" id="manualReceiptItemName_' + i + '" value="' + escapeHtmlAttr(item.nama) + '" oninput="strukManualUpdatePreview()"></div>' +
        '<div class="form-group small"><label>Qty</label><input class="form-control" id="manualReceiptItemQty_' + i + '" value="' + escapeHtmlAttr(formatQtyStruk(item.qty || 1)) + '" inputmode="decimal" oninput="strukManualUpdatePreview()"></div>' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label>Harga Satuan</label><input class="form-control nominal-rupiah" id="manualReceiptItemPrice_' + i + '" value="' + escapeHtmlAttr(formatNominalInput(item.hargaSatuan)) + '" inputmode="numeric" oninput="strukManualUpdatePreview()"></div>' +
        '<div class="form-group"><label>Diskon Item</label><input class="form-control nominal-rupiah" id="manualReceiptItemDiscount_' + i + '" value="' + escapeHtmlAttr(formatNominalInput(item.diskon)) + '" inputmode="numeric" oninput="strukManualUpdatePreview()"></div>' +
      '</div>' +
    '</div>';
  }).join('');
  (STRUK_MANUAL_ITEMS || []).forEach(function(_, i) {
    setupInputRupiah('manualReceiptItemPrice_' + i);
    setupInputRupiah('manualReceiptItemDiscount_' + i);
  });
}

function bacaItemsStrukManual() {
  if (!Array.isArray(STRUK_MANUAL_ITEMS)) STRUK_MANUAL_ITEMS = [];
  STRUK_MANUAL_ITEMS = STRUK_MANUAL_ITEMS.map(function(item, i) {
    var namaEl = document.getElementById('manualReceiptItemName_' + i);
    var qtyEl = document.getElementById('manualReceiptItemQty_' + i);
    var priceEl = document.getElementById('manualReceiptItemPrice_' + i);
    var discountEl = document.getElementById('manualReceiptItemDiscount_' + i);
    var qty = qtyEl ? angkaQtyStruk(qtyEl.value) : angkaQtyStruk(item.qty);
    var harga = priceEl ? angkaNominal(priceEl.value) : angkaNominal(item.hargaSatuan);
    var diskon = discountEl ? angkaNominal(discountEl.value) : angkaNominal(item.diskon);
    var subtotal = Math.round(qty * harga);
    var total = Math.max(0, subtotal - diskon);
    return {
      nama: namaEl ? namaEl.value : item.nama,
      qty: qty,
      hargaSatuan: harga,
      diskon: Math.min(diskon, subtotal),
      subtotal: subtotal,
      total: total
    };
  });
  return STRUK_MANUAL_ITEMS;
}

function bacaDataStrukManual() {
  var items = bacaItemsStrukManual().filter(function(item) {
    return String(item.nama || '').trim() || item.hargaSatuan || item.total;
  });
  var subtotal = items.reduce(function(sum, item) { return sum + angkaNominal(item.subtotal); }, 0);
  var diskonItem = items.reduce(function(sum, item) { return sum + angkaNominal(item.diskon); }, 0);
  var diskonTambahan = angkaNominal(document.getElementById('manualReceiptExtraDiscount') ? document.getElementById('manualReceiptExtraDiscount').value : 0);
  var pajak = angkaNominal(document.getElementById('manualReceiptTax') ? document.getElementById('manualReceiptTax').value : 0);
  var total = Math.max(0, subtotal - diskonItem - diskonTambahan + pajak);
  return {
    brand: document.getElementById('manualReceiptBrand') ? document.getElementById('manualReceiptBrand').value : 'MoneyTrack Store',
    invoiceId: document.getElementById('manualReceiptInvoice') ? document.getElementById('manualReceiptInvoice').value : '',
    tanggal: document.getElementById('manualReceiptDate') ? document.getElementById('manualReceiptDate').value : tanggalInputHariIni(),
    waktu: document.getElementById('manualReceiptTime') ? document.getElementById('manualReceiptTime').value : waktuInputSekarang(),
    pelanggan: document.getElementById('manualReceiptCustomer') ? document.getElementById('manualReceiptCustomer').value : '',
    nomorWa: document.getElementById('manualReceiptWa') ? document.getElementById('manualReceiptWa').value : '',
    metode: document.getElementById('manualReceiptMethod') ? document.getElementById('manualReceiptMethod').value : '',
    status: document.getElementById('manualReceiptStatus') ? document.getElementById('manualReceiptStatus').value : 'Lunas',
    catatan: document.getElementById('manualReceiptNote') ? document.getElementById('manualReceiptNote').value : '',
    items: items,
    subtotal: subtotal,
    diskonItem: diskonItem,
    diskonTambahan: diskonTambahan,
    diskon: diskonItem + diskonTambahan,
    pajak: pajak,
    total: total
  };
}

function tambahItemStrukManualWeb() {
  bacaItemsStrukManual();
  STRUK_MANUAL_ITEMS.push(itemStrukManualDefault('Item baru', 0));
  renderStrukManualItems();
  strukManualUpdatePreview();
  setTimeout(function() {
    var idx = STRUK_MANUAL_ITEMS.length - 1;
    var el = document.getElementById('manualReceiptItemName_' + idx);
    if (el) {
      el.focus();
      el.select();
    }
  }, 40);
}

function hapusItemStrukManualWeb(index) {
  bacaItemsStrukManual();
  STRUK_MANUAL_ITEMS.splice(index, 1);
  if (!STRUK_MANUAL_ITEMS.length) STRUK_MANUAL_ITEMS.push(itemStrukManualDefault('Item manual', 0));
  renderStrukManualItems();
  strukManualUpdatePreview();
}

function resetStrukManual() {
  renderStrukManual();
  showToast('Struk manual direset.', 'info');
}

function strukManualUpdatePreview() {
  var canvas = document.getElementById('manualReceiptCanvas');
  if (!canvas) return;
  var data = bacaDataStrukManual();
  gambarStrukManual(canvas, data);
  var summary = document.getElementById('manualReceiptSummary');
  if (summary) summary.textContent = rupiah(data.total) + ' • ' + data.status;
}

function strukManualSafeText(value, fallback) {
  var text = String(value || '').trim();
  return text || fallback || '-';
}

function strukManualRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r || 0, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function strukManualWrapText(ctx, text, maxWidth, maxLines) {
  var words = String(text || '').split(/\s+/).filter(Boolean);
  var lines = [];
  var line = '';
  words.forEach(function(word) {
    var test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  if (!lines.length) lines.push('-');
  if (maxLines && lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    while (lines[lines.length - 1].length > 3 && ctx.measureText(lines[lines.length - 1] + '...').width > maxWidth) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
    }
    lines[lines.length - 1] += '...';
  }
  return lines;
}

function strukManualDrawLabel(ctx, label, value, x, y, w) {
  ctx.fillStyle = '#74829f';
  ctx.font = '700 20px "DM Sans", Arial, sans-serif';
  ctx.fillText(label, x, y);
  ctx.fillStyle = '#f3f7ff';
  ctx.font = '800 26px "DM Sans", Arial, sans-serif';
  strukManualWrapText(ctx, value, w, 1).forEach(function(line, idx) {
    ctx.fillText(line, x, y + 34 + (idx * 28));
  });
}

function gambarStrukManual(canvas, data) {
  data = data || {};
  var width = 1080;
  var itemLines = [];
  var ctx = canvas.getContext('2d');
  ctx.font = '700 26px "DM Sans", Arial, sans-serif';
  (data.items || []).forEach(function(item) {
    itemLines.push(strukManualWrapText(ctx, item.nama || 'Item', 370, 2));
  });
  var rowsHeight = itemLines.reduce(function(sum, lines) { return sum + Math.max(72, 34 + (lines.length * 26)); }, 0);
  var noteLines = strukManualWrapText(ctx, data.catatan || 'Terima kasih.', 830, 4);
  var tableYBase = 486;
  var rowGaps = (data.items || []).length ? (data.items || []).length * 10 : 0;
  var rowsEndY = (data.items || []).length ? tableYBase + 72 + rowsHeight + rowGaps : tableYBase + 152;
  var noteStartY = rowsEndY + 248;
  var height = Math.max(1120, noteStartY + (noteLines.length * 34) + 112);
  canvas.width = width;
  canvas.height = height;
  canvas.style.aspectRatio = width + ' / ' + height;
  ctx = canvas.getContext('2d');

  var bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#07111f');
  bg.addColorStop(0.55, '#0a1324');
  bg.addColorStop(1, '#10192b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(0,255,153,0.16)';
  ctx.fillRect(0, 0, width, 10);
  ctx.fillStyle = 'rgba(0,213,255,0.10)';
  ctx.fillRect(0, 10, width, 4);

  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  strukManualRoundRect(ctx, 54, 54, width - 108, height - 108, 30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f5f8ff';
  ctx.font = '900 48px "Syne", "DM Sans", Arial, sans-serif';
  ctx.fillText(strukManualSafeText(data.brand, 'MoneyTrack Store'), 84, 128);
  ctx.fillStyle = '#90a0bd';
  ctx.font = '700 21px "DM Sans", Arial, sans-serif';
  ctx.fillText('Nota pembayaran manual', 86, 166);

  var statusColor = data.status === 'Lunas' ? '#45f3ff' : '#ffcf66';
  ctx.fillStyle = 'rgba(0,213,255,0.10)';
  if (data.status !== 'Lunas') ctx.fillStyle = 'rgba(255,159,67,0.12)';
  strukManualRoundRect(ctx, 760, 78, 230, 112, 22);
  ctx.fill();
  ctx.strokeStyle = data.status === 'Lunas' ? 'rgba(69,243,255,0.38)' : 'rgba(255,159,67,0.38)';
  ctx.stroke();
  ctx.fillStyle = statusColor;
  ctx.font = '900 42px "Syne", "DM Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(strukManualSafeText(data.status, 'Lunas').toUpperCase(), 875, 145);
  ctx.fillStyle = '#8fa0bd';
  ctx.font = '700 18px "DM Sans", Arial, sans-serif';
  ctx.fillText('Status', 875, 172);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  strukManualRoundRect(ctx, 84, 220, 906, 132, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.stroke();
  strukManualDrawLabel(ctx, 'Invoice', strukManualSafeText(data.invoiceId, '-'), 112, 260, 250);
  strukManualDrawLabel(ctx, 'Tanggal', tanggalIndo(data.tanggal) + (data.waktu ? ' ' + data.waktu : ''), 392, 260, 240);
  strukManualDrawLabel(ctx, 'Pembeli', strukManualSafeText(data.pelanggan, 'Pelanggan'), 664, 260, 300);

  ctx.fillStyle = 'rgba(0,255,153,0.10)';
  strukManualRoundRect(ctx, 84, 374, 906, 70, 18);
  ctx.fill();
  ctx.fillStyle = '#cfe4ff';
  ctx.font = '800 21px "DM Sans", Arial, sans-serif';
  ctx.fillText('Metode: ' + strukManualSafeText(data.metode, '-'), 114, 418);
  ctx.textAlign = 'right';
  ctx.fillText(data.nomorWa ? 'WA ' + data.nomorWa : 'Nomor WA: -', 960, 418);
  ctx.textAlign = 'left';

  var tableX = 84;
  var tableY = 486;
  var tableW = 906;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  strukManualRoundRect(ctx, tableX, tableY, tableW, 54, 16);
  ctx.fill();
  ctx.fillStyle = '#7f8fad';
  ctx.font = '900 18px "DM Sans", Arial, sans-serif';
  ctx.fillText('ITEM', tableX + 28, tableY + 34);
  ctx.fillText('QTY', tableX + 488, tableY + 34);
  ctx.fillText('HARGA', tableX + 594, tableY + 34);
  ctx.textAlign = 'right';
  ctx.fillText('TOTAL', tableX + tableW - 28, tableY + 34);
  ctx.textAlign = 'left';

  var y = tableY + 72;
  if (!(data.items || []).length) {
    ctx.fillStyle = '#91a0bb';
    ctx.font = '700 24px "DM Sans", Arial, sans-serif';
    ctx.fillText('Belum ada item.', tableX + 28, y + 34);
    y += 80;
  } else {
    (data.items || []).forEach(function(item, idx) {
      var lines = itemLines[idx] || ['Item'];
      var rowH = Math.max(72, 34 + (lines.length * 26));
      ctx.fillStyle = idx % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.12)';
      strukManualRoundRect(ctx, tableX, y - 8, tableW, rowH, 14);
      ctx.fill();
      ctx.fillStyle = '#f6f9ff';
      ctx.font = '800 24px "DM Sans", Arial, sans-serif';
      lines.forEach(function(line, lineIdx) {
        ctx.fillText(line, tableX + 28, y + 22 + (lineIdx * 26));
      });
      if (item.diskon) {
        ctx.fillStyle = '#ffcf66';
        ctx.font = '700 17px "DM Sans", Arial, sans-serif';
        ctx.fillText('Diskon item ' + rupiah(item.diskon), tableX + 28, y + rowH - 12);
      }
      ctx.fillStyle = '#dfe7f7';
      ctx.font = '800 22px "DM Sans", Arial, sans-serif';
      ctx.fillText(formatQtyStruk(item.qty), tableX + 490, y + 24);
      ctx.fillText(rupiah(item.hargaSatuan), tableX + 594, y + 24);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#45f3ff';
      ctx.fillText(rupiah(item.total), tableX + tableW - 28, y + 24);
      ctx.textAlign = 'left';
      y += rowH + 10;
    });
  }

  var sumY = y + 22;
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  strukManualRoundRect(ctx, 540, sumY, 450, 178, 22);
  ctx.fill();
  function rowSummary(label, value, offset, color) {
    ctx.fillStyle = '#7d8ba8';
    ctx.font = '700 20px "DM Sans", Arial, sans-serif';
    ctx.fillText(label, 570, sumY + offset);
    ctx.textAlign = 'right';
    ctx.fillStyle = color || '#f3f7ff';
    ctx.font = '900 24px "DM Sans", Arial, sans-serif';
    ctx.fillText(rupiah(value), 956, sumY + offset);
    ctx.textAlign = 'left';
  }
  rowSummary('Subtotal', data.subtotal, 42);
  rowSummary('Diskon', data.diskon, 82, '#ffcf66');
  rowSummary('Pajak/Biaya', data.pajak, 122);
  ctx.fillStyle = 'rgba(0,255,153,0.14)';
  strukManualRoundRect(ctx, 562, sumY + 134, 406, 52, 16);
  ctx.fill();
  ctx.fillStyle = '#00130b';
  ctx.font = '900 22px "DM Sans", Arial, sans-serif';
  ctx.fillText('TOTAL', 584, sumY + 168);
  ctx.textAlign = 'right';
  ctx.font = '900 28px "Syne", "DM Sans", Arial, sans-serif';
  ctx.fillText(rupiah(data.total), 944, sumY + 168);
  ctx.textAlign = 'left';

  var noteY = sumY + 226;
  ctx.fillStyle = '#91a1bf';
  ctx.font = '700 22px "DM Sans", Arial, sans-serif';
  noteLines.forEach(function(line, idx) {
    ctx.fillText(line, 90, noteY + (idx * 30));
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#5f6e89';
  ctx.font = '700 18px "DM Sans", Arial, sans-serif';
  ctx.fillText('Struk manual dibuat di MoneyTrack. Data ini tidak disimpan ke database.', width / 2, height - 86);
  ctx.textAlign = 'left';
}

function downloadStrukManual() {
  var canvas = document.getElementById('manualReceiptCanvas');
  if (!canvas) return;
  var data = bacaDataStrukManual();
  if (!data.items.length) {
    showToast('Isi minimal satu item dulu.', 'warning');
    return;
  }
  gambarStrukManual(canvas, data);
  var fileName = (data.invoiceId || 'struk-manual').replace(/[^\w-]+/g, '-').toLowerCase() + '.png';
  function simpan(url) {
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  if (canvas.toBlob) {
    canvas.toBlob(function(blob) {
      if (!blob) {
        simpan(canvas.toDataURL('image/png'));
        return;
      }
      var url = URL.createObjectURL(blob);
      simpan(url);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }, 'image/png');
  } else {
    simpan(canvas.toDataURL('image/png'));
  }
  showToast('Struk manual diunduh sebagai gambar.', 'success');
}

function modalTambahTransaksi() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa tambah transaksi.')) return;
  loadMasterInputTransaksi(function() {
    STRUK_PREVIEW_DATA = null;
    STRUK_UNDO_STACK = [];
    STRUK_REDO_STACK = [];
    STRUK_SCAN_TOKEN++;
    openModal('Tambah Transaksi',
      renderStrukUploadArea() +
      '<div id="manualTxnForm">' +
      '<div class="form-row"><div class="form-group"><label>Tanggal *</label><input type="date" class="form-control" id="txnTanggal" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
      '<div class="form-group"><label>Jenis Keuangan *</label>' + renderSelectJenisKeuangan() + '</div></div>' +
      '<div class="form-row" id="rowTipeTransaksi"><div class="form-group"><label>Tipe Transaksi *</label><select class="form-control" id="txnTipeTransaksi" onchange="aturFormTransaksiManual()"><option value="Pengeluaran">Pengeluaran</option><option value="Pemasukan">Pemasukan</option><option value="Transfer">Transfer</option></select></div></div>' +
      '<div class="form-row hidden" id="rowTipePembayaran"><div class="form-group"><label>Tipe Pembayaran *</label><select class="form-control" id="txnTipePembayaran" onchange="aturFormTransaksiManual()"><option value="Pembayaran Masuk">Pembayaran Masuk</option><option value="Operasional Bisnis">Operasional Bisnis</option><option value="Refund">Refund</option><option value="Lainnya">Lainnya</option></select></div><div class="form-group"><label>Pelanggan</label><input type="text" class="form-control" id="txnPelanggan" placeholder="Nama pelanggan"></div></div>' +
      '<div class="form-row" id="rowKategoriTransaksi"><div class="form-group" id="wrapKategori"><label>Kategori</label><select class="form-control" id="txnKategori">' + buatOptionsKategori('Pribadi', 'Pengeluaran') + '</select></div></div>' +
      '<div class="form-row"><div class="form-group" id="wrapAkunAsal"><label>Akun Asal</label><select class="form-control" id="txnAkunAsal">' + buatOptionsAkun() + '</select></div><div class="form-group" id="wrapAkunTujuan"><label>Akun Tujuan</label><select class="form-control" id="txnAkunTujuan">' + buatOptionsAkun() + '</select></div></div>' +
      '<div class="form-row hidden" id="rowBiayaAdmin"><div class="form-group"><label>Biaya Admin Transfer</label><input type="text" class="form-control nominal-rupiah" id="txnBiayaAdmin" placeholder="Rp 0" inputmode="numeric"></div><div class="form-group"><label>Keterangan Biaya</label><input type="text" class="form-control" id="txnKeteranganAdmin" placeholder="Contoh: biaya transfer antar bank"></div></div>' +
      '<div class="form-row"><div class="form-group"><label>Nominal *</label><input type="text" class="form-control nominal-rupiah" id="txnNominal" placeholder="Rp 0" inputmode="numeric"></div></div>' +
      '<div class="form-row hidden" id="rowStatusTransaksi"><div class="form-group"><label>Status</label><select class="form-control" id="txnStatus"><option value="Lunas">Lunas</option><option value="Pending">Pending</option><option value="Belum Lunas">Belum Lunas</option></select></div></div>' +
      '<div class="form-group"><label>Keterangan</label><textarea class="form-control" id="txnKeterangan" rows="3" placeholder="Catatan transaksi..."></textarea></div>' +
      '</div>',
      '<span id="manualTxnFooter" class="manual-txn-footer"><button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="simpanTransaksi()"><i class="ri-save-line"></i> Simpan</button></span>'
    );
    setTimeout(function() {
      aturFormTransaksiManual();
      setupInputRupiah('txnNominal');
      setupInputRupiah('txnBiayaAdmin');
    }, 50);
  });
}

function setFieldVisible(id, visible) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden', !visible);
}

function aturFormTransaksiManual() {
  var jenisKeuangan = (document.getElementById('txnJenisKeuangan') || {}).value || 'Pribadi';
  var tipeTransaksi = (document.getElementById('txnTipeTransaksi') || {}).value || 'Pengeluaran';
  var tipePembayaran = (document.getElementById('txnTipePembayaran') || {}).value || 'Pembayaran Masuk';
  var rowTT = document.getElementById('rowTipeTransaksi');
  var rowTP = document.getElementById('rowTipePembayaran');
  var rowKategori = document.getElementById('rowKategoriTransaksi');
  var rowBiayaAdmin = document.getElementById('rowBiayaAdmin');
  var rowStatus = document.getElementById('rowStatusTransaksi');
  var wrapKat = document.getElementById('wrapKategori');
  var selKat = document.getElementById('txnKategori');
  if (rowTT) rowTT.classList.toggle('hidden', jenisKeuangan !== 'Pribadi');
  if (rowTP) rowTP.classList.toggle('hidden', jenisKeuangan !== 'Bisnis');
  if (rowBiayaAdmin) rowBiayaAdmin.classList.toggle('hidden', !(jenisKeuangan === 'Pribadi' && tipeTransaksi === 'Transfer'));
  if (rowStatus) rowStatus.classList.toggle('hidden', jenisKeuangan !== 'Bisnis');
  if (jenisKeuangan === 'Pribadi') {
    if (rowKategori) rowKategori.classList.toggle('hidden', tipeTransaksi === 'Transfer');
    setFieldVisible('wrapAkunAsal', tipeTransaksi === 'Pengeluaran' || tipeTransaksi === 'Transfer');
    setFieldVisible('wrapAkunTujuan', tipeTransaksi === 'Pemasukan' || tipeTransaksi === 'Transfer');
    if (wrapKat) wrapKat.classList.toggle('hidden', tipeTransaksi === 'Transfer');
    if (selKat && tipeTransaksi !== 'Transfer') selKat.innerHTML = buatOptionsKategori('Pribadi', tipeTransaksi);
  }
  if (jenisKeuangan === 'Bisnis') {
    if (rowKategori) rowKategori.classList.remove('hidden');
    setFieldVisible('wrapAkunAsal', tipePembayaran === 'Operasional Bisnis' || tipePembayaran === 'Refund' || tipePembayaran === 'Lainnya');
    setFieldVisible('wrapAkunTujuan', tipePembayaran === 'Pembayaran Masuk' || tipePembayaran === 'Lainnya');
    if (wrapKat) wrapKat.classList.remove('hidden');
    if (selKat) selKat.innerHTML = buatOptionsKategori('Bisnis', tipePembayaran);
  }
}

function aturFormTransaksiEdit() {
  var jenisKeuangan = (document.getElementById('editTxnJenisKeuangan') || {}).value || 'Pribadi';
  var tipeTransaksi = (document.getElementById('editTxnTipeTransaksi') || {}).value || 'Pengeluaran';
  var tipePembayaran = (document.getElementById('editTxnTipePembayaran') || {}).value || 'Pembayaran Masuk';
  var rowTT = document.getElementById('editRowTipeTransaksi');
  var rowTP = document.getElementById('editRowTipePembayaran');
  var rowKategori = document.getElementById('editRowKategoriTransaksi');
  var rowBiayaAdmin = document.getElementById('editRowBiayaAdmin');
  var rowStatus = document.getElementById('editRowStatusTransaksi');
  var wrapKat = document.getElementById('editWrapKategori');
  var selKat = document.getElementById('editTxnKategori');

  if (rowTT) rowTT.classList.toggle('hidden', jenisKeuangan !== 'Pribadi');
  if (rowTP) rowTP.classList.toggle('hidden', jenisKeuangan !== 'Bisnis');
  if (rowBiayaAdmin) rowBiayaAdmin.classList.toggle('hidden', !(jenisKeuangan === 'Pribadi' && tipeTransaksi === 'Transfer'));
  if (rowStatus) rowStatus.classList.toggle('hidden', jenisKeuangan !== 'Bisnis');

  if (jenisKeuangan === 'Pribadi') {
    if (rowKategori) rowKategori.classList.toggle('hidden', tipeTransaksi === 'Transfer');
    setFieldVisible('editWrapAkunAsal', tipeTransaksi === 'Pengeluaran' || tipeTransaksi === 'Transfer');
    setFieldVisible('editWrapAkunTujuan', tipeTransaksi === 'Pemasukan' || tipeTransaksi === 'Transfer');
    if (wrapKat) wrapKat.classList.toggle('hidden', tipeTransaksi === 'Transfer');
    if (selKat && tipeTransaksi !== 'Transfer') selKat.innerHTML = buatOptionsKategori('Pribadi', tipeTransaksi, selKat.value);
  }

  if (jenisKeuangan === 'Bisnis') {
    if (rowKategori) rowKategori.classList.remove('hidden');
    setFieldVisible('editWrapAkunAsal', tipePembayaran === 'Operasional Bisnis' || tipePembayaran === 'Refund' || tipePembayaran === 'Lainnya');
    setFieldVisible('editWrapAkunTujuan', tipePembayaran === 'Pembayaran Masuk' || tipePembayaran === 'Lainnya');
    if (wrapKat) wrapKat.classList.remove('hidden');
    if (selKat) selKat.innerHTML = buatOptionsKategori('Bisnis', tipePembayaran, selKat.value);
  }
}

var _editTxnId = null;

function modalEditTransaksi(id) {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa edit transaksi.')) return;
  _editTxnId = id;
  var t = cariTransaksiById(id);
  if (!t) { showToast('Data tidak ditemukan.', 'error'); return; }
  loadMasterInputTransaksi(function() {
    var jenisKeuangan = txnJenisKeuangan(t);
    var tipe = txnAmbilTipe(t);
    var tipeTransaksi = jenisKeuangan === 'Pribadi' ? (tipe || 'Pengeluaran') : 'Pengeluaran';
    var tipePembayaran = jenisKeuangan === 'Bisnis' ? (tipe || 'Pembayaran Masuk') : 'Pembayaran Masuk';
    var akunAsal = txnAmbilAkunAsal(t);
    var akunTujuan = txnAmbilAkunTujuan(t);
    if (!akunAsal && tipeTransaksi === 'Pengeluaran') akunAsal = txnAmbilAkunUtama(t);
    if (!akunTujuan && tipeTransaksi === 'Pemasukan') akunTujuan = txnAmbilAkunUtama(t);

    openModal('Edit Transaksi',
      '<div class="form-row"><div class="form-group"><label>Tanggal *</label><input type="date" class="form-control" id="editTxnTanggal" value="' + escapeHtmlAttr(tanggalInputValue(t['Tanggal'] || t['_Tanggal'])) + '"></div>' +
      '<div class="form-group"><label>Jenis Keuangan *</label>' + renderSelectJenisKeuanganEdit(jenisKeuangan) + '</div></div>' +
      '<div class="form-row" id="editRowTipeTransaksi"><div class="form-group"><label>Tipe Transaksi *</label><select class="form-control" id="editTxnTipeTransaksi" onchange="aturFormTransaksiEdit()"><option value="Pengeluaran"' + (tipeTransaksi === 'Pengeluaran' ? ' selected' : '') + '>Pengeluaran</option><option value="Pemasukan"' + (tipeTransaksi === 'Pemasukan' ? ' selected' : '') + '>Pemasukan</option><option value="Transfer"' + (tipeTransaksi === 'Transfer' ? ' selected' : '') + '>Transfer</option></select></div></div>' +
      '<div class="form-row hidden" id="editRowTipePembayaran"><div class="form-group"><label>Tipe Pembayaran *</label><select class="form-control" id="editTxnTipePembayaran" onchange="aturFormTransaksiEdit()"><option value="Pembayaran Masuk"' + (tipePembayaran === 'Pembayaran Masuk' ? ' selected' : '') + '>Pembayaran Masuk</option><option value="Operasional Bisnis"' + (tipePembayaran === 'Operasional Bisnis' ? ' selected' : '') + '>Operasional Bisnis</option><option value="Refund"' + (tipePembayaran === 'Refund' ? ' selected' : '') + '>Refund</option><option value="Lainnya"' + (tipePembayaran === 'Lainnya' ? ' selected' : '') + '>Lainnya</option></select></div><div class="form-group"><label>Pelanggan</label><input type="text" class="form-control" id="editTxnPelanggan" value="' + escapeHtmlAttr(txnAmbilPelanggan(t)) + '" placeholder="Nama pelanggan"></div></div>' +
      '<div class="form-row" id="editRowKategoriTransaksi"><div class="form-group" id="editWrapKategori"><label>Kategori</label><select class="form-control" id="editTxnKategori">' + buatOptionsKategori(jenisKeuangan === 'Bisnis' ? 'Bisnis' : 'Pribadi', jenisKeuangan === 'Bisnis' ? tipePembayaran : tipeTransaksi, txnAmbilKategori(t)) + '</select></div></div>' +
      '<div class="form-row"><div class="form-group" id="editWrapAkunAsal"><label>Akun Asal</label><select class="form-control" id="editTxnAkunAsal">' + buatOptionsAkun(akunAsal) + '</select></div><div class="form-group" id="editWrapAkunTujuan"><label>Akun Tujuan</label><select class="form-control" id="editTxnAkunTujuan">' + buatOptionsAkun(akunTujuan) + '</select></div></div>' +
      '<div class="form-row hidden" id="editRowBiayaAdmin"><div class="form-group"><label>Biaya Admin Transfer</label><input type="text" class="form-control nominal-rupiah" id="editTxnBiayaAdmin" value="' + escapeHtmlAttr(formatNominalInput(txnBiayaAdmin(t))) + '" placeholder="Rp 0" inputmode="numeric"></div><div class="form-group"><label>Keterangan Biaya</label><input type="text" class="form-control" id="editTxnKeteranganAdmin" placeholder="Contoh: biaya transfer antar bank"></div></div>' +
      '<div class="form-row"><div class="form-group"><label>Nominal *</label><input type="text" class="form-control nominal-rupiah" id="editTxnNominal" value="' + escapeHtmlAttr(formatNominalInput(txnAmbilNominal(t))) + '" placeholder="Rp 0" inputmode="numeric"></div></div>' +
      '<div class="form-row hidden" id="editRowStatusTransaksi"><div class="form-group"><label>Status</label><select class="form-control" id="editTxnStatus"><option value="Lunas"' + (txnAmbilStatus(t) === 'Lunas' ? ' selected' : '') + '>Lunas</option><option value="Pending"' + (txnAmbilStatus(t) === 'Pending' ? ' selected' : '') + '>Pending</option><option value="Belum Lunas"' + (txnAmbilStatus(t) === 'Belum Lunas' ? ' selected' : '') + '>Belum Lunas</option></select></div></div>' +
      '<div class="form-group"><label>Keterangan</label><textarea class="form-control" id="editTxnKeterangan" rows="3" placeholder="Catatan transaksi...">' + escapeHtmlText(txnBersihKeterangan(t)) + '</textarea></div>',
      '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="updateTransaksi()"><i class="ri-save-line"></i> Update</button>'
    );

    setTimeout(function() {
      aturFormTransaksiEdit();
      setupInputRupiah('editTxnNominal');
      setupInputRupiah('editTxnBiayaAdmin');
    }, 50);
  });
}

function simpanTransaksi() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa menyimpan transaksi.')) return;
  var jenisKeuangan = document.getElementById('txnJenisKeuangan').value;
  if (!bolehJenisKeuangan(jenisKeuangan)) { showToast('Role kamu tidak boleh input transaksi ' + jenisKeuangan + '.', 'error'); return; }
  var tipeTransaksi = document.getElementById('txnTipeTransaksi') ? document.getElementById('txnTipeTransaksi').value : '';
  var tipePembayaran = document.getElementById('txnTipePembayaran') ? document.getElementById('txnTipePembayaran').value : '';
  var biayaAdmin = angkaNominal(document.getElementById('txnBiayaAdmin') ? document.getElementById('txnBiayaAdmin').value : 0);
  var ketAdmin = document.getElementById('txnKeteranganAdmin') ? document.getElementById('txnKeteranganAdmin').value : '';
  var keterangan = document.getElementById('txnKeterangan').value;
  if (jenisKeuangan === 'Pribadi' && tipeTransaksi === 'Transfer' && biayaAdmin > 0) {
    keterangan = (keterangan ? keterangan + '\n' : '') + '[Biaya Admin Transfer: ' + rupiah(biayaAdmin) + (ketAdmin ? ' - ' + ketAdmin : '') + ']';
  }
  var data = {
    tanggal: document.getElementById('txnTanggal').value,
    jenisKeuangan: jenisKeuangan,
    tipeTransaksi: jenisKeuangan === 'Pribadi' ? tipeTransaksi : '',
    tipePembayaran: jenisKeuangan === 'Bisnis' ? tipePembayaran : '',
    nominal: angkaNominal(document.getElementById('txnNominal').value),
    biayaAdmin: jenisKeuangan === 'Pribadi' && tipeTransaksi === 'Transfer' ? biayaAdmin : 0,
    keteranganBiayaAdmin: ketAdmin,
    kategori: document.getElementById('txnKategori') ? document.getElementById('txnKategori').value : '',
    akunAsal: document.getElementById('txnAkunAsal') ? document.getElementById('txnAkunAsal').value : '',
    akunTujuan: document.getElementById('txnAkunTujuan') ? document.getElementById('txnAkunTujuan').value : '',
    pelanggan: document.getElementById('txnPelanggan') ? document.getElementById('txnPelanggan').value : '',
    keterangan: keterangan,
    status: jenisKeuangan === 'Bisnis' && document.getElementById('txnStatus') ? document.getElementById('txnStatus').value : 'Lunas',
    sumberInput: 'Manual',
    role: STATE.user.role,
    username: STATE.user.username
  };
  if (!data.tanggal || !data.nominal) { showToast('Tanggal dan nominal wajib diisi.', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status === 'success') {
        bersihkanCacheTransaksi();
        closeModalDirect();
        showToast(r.pesan, 'success');
        refreshDataKeuanganTerkait();
        loadMasterInputTransaksi(null, true);
      }
      else showToast(r.pesan, 'error');
    })
    .withFailureHandler(function() { showToast('Gagal menyimpan.', 'error'); })
    .tambahTransaksi(STATE.user.spreadsheetId, data);
}

function updateTransaksi() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa update transaksi.')) return;
  var transaksiLama = normalisasiPayloadTransaksiLama(cariTransaksiById(_editTxnId));
  var jenisKeuangan = document.getElementById('editTxnJenisKeuangan').value;
  if (!bolehJenisKeuangan(jenisKeuangan)) { showToast('Role kamu tidak boleh update transaksi ' + jenisKeuangan + '.', 'error'); return; }
  var tipeTransaksi = document.getElementById('editTxnTipeTransaksi') ? document.getElementById('editTxnTipeTransaksi').value : '';
  var tipePembayaran = document.getElementById('editTxnTipePembayaran') ? document.getElementById('editTxnTipePembayaran').value : '';
  var biayaAdmin = angkaNominal(document.getElementById('editTxnBiayaAdmin') ? document.getElementById('editTxnBiayaAdmin').value : 0);
  var ketAdmin = document.getElementById('editTxnKeteranganAdmin') ? document.getElementById('editTxnKeteranganAdmin').value : '';
  var keterangan = document.getElementById('editTxnKeterangan').value;
  if (jenisKeuangan === 'Pribadi' && tipeTransaksi === 'Transfer' && biayaAdmin > 0) {
    keterangan = (keterangan ? keterangan + '\n' : '') + '[Biaya Admin Transfer: ' + rupiah(biayaAdmin) + (ketAdmin ? ' - ' + ketAdmin : '') + ']';
  }
  var data = {
    tanggal: document.getElementById('editTxnTanggal').value,
    jenisKeuangan: jenisKeuangan,
    tipeTransaksi: jenisKeuangan === 'Pribadi' ? tipeTransaksi : '',
    tipePembayaran: jenisKeuangan === 'Bisnis' ? tipePembayaran : '',
    jenis: jenisKeuangan === 'Pribadi' ? tipeTransaksi : tipePembayaran,
    nominal: angkaNominal(document.getElementById('editTxnNominal').value),
    jumlah: angkaNominal(document.getElementById('editTxnNominal').value),
    biayaAdmin: jenisKeuangan === 'Pribadi' && tipeTransaksi === 'Transfer' ? biayaAdmin : 0,
    kategori: document.getElementById('editTxnKategori') ? document.getElementById('editTxnKategori').value : '',
    akunAsal: document.getElementById('editTxnAkunAsal') ? document.getElementById('editTxnAkunAsal').value : '',
    akunTujuan: document.getElementById('editTxnAkunTujuan') ? document.getElementById('editTxnAkunTujuan').value : '',
    akun: document.getElementById('editTxnAkunAsal') ? document.getElementById('editTxnAkunAsal').value : '',
    pelanggan: document.getElementById('editTxnPelanggan') ? document.getElementById('editTxnPelanggan').value : '',
    keterangan: keterangan,
    status: jenisKeuangan === 'Bisnis' && document.getElementById('editTxnStatus') ? document.getElementById('editTxnStatus').value : 'Lunas',
    username: STATE.user.username,
    transaksiLama: transaksiLama,
    oldTransaction: transaksiLama
  };
  if (!data.tanggal || !data.nominal) { showToast('Tanggal dan nominal wajib diisi.', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status === 'success') {
        bersihkanCacheTransaksi();
        closeModalDirect();
        showToast(r.pesan, 'success');
        refreshDataKeuanganTerkait();
        loadMasterInputTransaksi(null, true);
      }
      else showToast(r.pesan, 'error');
    })
    .withFailureHandler(function() { showToast('Gagal mengupdate.', 'error'); })
    .editTransaksi(STATE.user.spreadsheetId, _editTxnId, data);
}

function hapusTransaksiConfirm(id) {
  if (isReadOnly()) { showToast('Mode lihat saja aktif. Perpanjang langganan untuk bisa hapus.', 'warning'); return; }
  var transaksiLama = normalisasiPayloadTransaksiLama(cariTransaksiById(id));
  swalFire({ title: 'Hapus Transaksi?', text: 'Data yang dihapus tidak bisa dikembalikan.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal' })
    .then(function(result) {
      if (result.isConfirmed) {
        google.script.run
          .withSuccessHandler(function(res) {
            var r = JSON.parse(res);
            if (r.status === 'success') {
              bersihkanCacheTransaksi();
              showToast(r.pesan, 'success');
              refreshDataKeuanganTerkait();
              loadMasterInputTransaksi(null, true);
            }
            else showToast(r.pesan, 'error');
          })
          .withFailureHandler(function() { showToast('Gagal menghapus.', 'error'); })
          .hapusTransaksi(STATE.user.spreadsheetId, id, {
            username: STATE.user.username,
            transaksiLama: transaksiLama,
            oldTransaction: transaksiLama,
            rollbackSaldo: true
          });
      }
    });
}

// ============================================================
// AKUN & SALDO
// ============================================================
var _allAkun = [];

function renderAkun() {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-bank-card-line"></i> Akun & Saldo</div><div class="page-actions"><button class="btn btn-primary" onclick="modalTambahAkun()"><i class="ri-add-line"></i> Tambah Akun</button><button class="btn btn-secondary btn-sm btn-refresh" onclick="loadAkun()"><i class="ri-refresh-line"></i></button></div></div><div id="akunList"><div class="grid-3"><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div></div></div></div>';
  loadAkun();
}

function loadAkun() {
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status !== 'success') { showToast('Gagal memuat akun.', 'error'); return; }
      _allAkun = r.data || [];
      renderAkunList(_allAkun);
    })
    .withFailureHandler(function() { showToast('Gagal memuat data.', 'error'); })
    .getAkun(STATE.user.spreadsheetId);
}

function renderAkunList(data) {
  var container = document.getElementById('akunList');
  if (!container) return;
  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-bank-card-line"></i></div><div class="empty-title">Belum ada akun</div><div class="empty-desc">Tambahkan akun keuangan Anda</div><button class="btn btn-primary" onclick="modalTambahAkun()"><i class="ri-add-line"></i> Tambah Akun</button></div>';
    return;
  }
  container.innerHTML = '<div class="grid-3 stagger-in">' + data.map(function(a) {
    var saldo = parseFloat(a['Saldo Sekarang']) || 0;
    var warna = a['Warna'] || 'var(--neon)';
    return '<div class="card" style="border-top:2px solid ' + warna + ';position:relative;overflow:hidden">' +
      '<div style="position:absolute;top:16px;right:16px;font-size:32px;opacity:0.1;color:' + warna + '"><i class="ri-bank-card-fill"></i></div>' +
      '<div class="stat-label" style="color:' + warna + ';opacity:0.8">' + a['Nama Akun'] + '</div>' +
      '<div class="stat-value" style="color:' + warna + ';font-size:20px;margin:6px 0">' + rupiah(saldo) + '</div>' +
      '<div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between">' +
      '<div><span class="badge ' + (a['Status']==='Aktif'?'badge-success':'badge-danger') + '">' + a['Status'] + '</span><span style="font-size:11px;color:var(--text3);margin-left:6px">' + (a['Jenis']||'-') + '</span></div>' +
      '<div style="display:flex;gap:4px"><button class="btn btn-info btn-icon btn-sm" onclick="modalEditAkun(\'' + a['ID'] + '\')"><i class="ri-edit-line"></i></button><button class="btn btn-danger btn-icon btn-sm" onclick="hapusAkunConfirm(\'' + a['ID'] + '\')"><i class="ri-delete-bin-line"></i></button></div>' +
      '</div></div>';
  }).join('') + '</div>';
}

function modalTambahAkun() {
  openModal('Tambah Akun',
    '<div class="form-group"><label>Nama Akun *</label><input type="text" class="form-control" id="akunNama" placeholder="Contoh: BCA, Cash, GoPay..."></div>' +
    '<div class="form-row"><div class="form-group"><label>Jenis</label><select class="form-control" id="akunJenis"><option>Tunai</option><option>Bank</option><option>E-Wallet</option><option>Investasi</option><option>Lainnya</option></select></div><div class="form-group"><label>Saldo Awal</label><input type="text" class="form-control nominal-rupiah" id="akunSaldo" placeholder="Rp 0" inputmode="numeric"></div></div>' +
    '<div class="form-group"><label>Warna</label><div class="color-swatches" id="akunWarna">' +
    ['#00ff99','#00d5ff','#b84cff','#ff4560','#ff9f43','#00d68f'].map(function(c) {
      return '<div class="color-swatch' + (c==='#00ff99'?' active':'') + '" style="background:' + c + '" data-color="' + c + '" onclick="pilihWarna(this,\'akunWarna\')"></div>';
    }).join('') + '</div></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="simpanAkun()"><i class="ri-save-line"></i> Simpan</button>'
  );
  setTimeout(function() {
    setupInputRupiah('akunSaldo');
  }, 50);
}

function pilihWarna(el, groupId) {
  document.querySelectorAll('#' + groupId + ' .color-swatch').forEach(function(s) { s.classList.remove('active'); });
  el.classList.add('active');
}

function simpanAkun() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa menyimpan akun.')) return;

  var warnaDipilih = document.querySelector('#akunWarna .color-swatch.active');
  var data = { namaAkun: document.getElementById('akunNama').value, jenis: document.getElementById('akunJenis').value, saldoAwal: angkaNominal(document.getElementById('akunSaldo').value), warna: warnaDipilih ? warnaDipilih.getAttribute('data-color') : '#00ff99' };
  if (!data.namaAkun) { showToast('Nama akun wajib diisi.', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); loadAkun(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal menyimpan.', 'error'); })
    .tambahAkun(STATE.user.spreadsheetId, data);
}

var _editAkunId = null;
function modalEditAkun(id) {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa edit akun.')) return;

  _editAkunId = id;
  var a = _allAkun.find(function(x) { return x['ID'] === id; });
  if (!a) return;
  var warnaAkun = a['Warna'] || '#00ff99';
  openModal('Edit Akun',
    '<div class="form-group"><label>Nama Akun</label><input type="text" class="form-control" id="editAkunNama" value="' + (a['Nama Akun']||'') + '"></div>' +
    '<div class="form-row"><div class="form-group"><label>Jenis</label><select class="form-control" id="editAkunJenis">' + ['Tunai','Bank','E-Wallet','Investasi','Lainnya'].map(function(j) { return '<option' + (j===a['Jenis']?' selected':'') + '>' + j + '</option>'; }).join('') + '</select></div><div class="form-group"><label>Status</label><select class="form-control" id="editAkunStatus"><option' + (a['Status']==='Aktif'?' selected':'') + '>Aktif</option><option' + (a['Status']==='Nonaktif'?' selected':'') + '>Nonaktif</option></select></div></div>' +
    '<div class="form-group"><label>Warna</label><div class="color-swatches" id="editAkunWarna">' +
    ['#00ff99','#00d5ff','#b84cff','#ff4560','#ff9f43','#00d68f'].map(function(c) {
      return '<div class="color-swatch' + (c===warnaAkun?' active':'') + '" style="background:' + c + '" data-color="' + c + '" onclick="pilihWarna(this,\'editAkunWarna\')"></div>';
    }).join('') + '</div></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="updateAkun()"><i class="ri-save-line"></i> Update</button>'
  );
}

function updateAkun() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa update akun.')) return;

  var warnaDipilih = document.querySelector('#editAkunWarna .color-swatch.active');
  var data = { namaAkun: document.getElementById('editAkunNama').value, jenis: document.getElementById('editAkunJenis').value, status: document.getElementById('editAkunStatus').value, warna: warnaDipilih ? warnaDipilih.getAttribute('data-color') : '#00ff99' };
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); loadAkun(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal mengupdate.', 'error'); })
    .editAkun(STATE.user.spreadsheetId, _editAkunId, data);
}

function hapusAkunConfirm(id) {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa hapus akun.')) return;

  swalFire({ title: 'Hapus Akun?', text: 'Data akun akan dihapus.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal' })
    .then(function(result) {
      if (result.isConfirmed) {
        google.script.run
          .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { showToast(r.pesan, 'success'); loadAkun(); } else showToast(r.pesan, 'error'); })
          .withFailureHandler(function() { showToast('Gagal menghapus.', 'error'); })
          .hapusAkun(STATE.user.spreadsheetId, id);
      }
    });
}

// ============================================================
// KATEGORI
// ============================================================
var _allKategori = [];

function renderKategori() {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-price-tag-3-line"></i> Kategori</div><div class="page-actions"><button class="btn btn-primary" onclick="modalTambahKategori()"><i class="ri-add-line"></i> Tambah</button><button class="btn btn-secondary btn-sm btn-refresh" onclick="loadKategori()"><i class="ri-refresh-line"></i></button></div></div><div id="kategoriList"></div></div>';
  loadKategori();
}

function loadKategori() {
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); _allKategori = r.data || []; renderKategoriList(_allKategori); })
    .withFailureHandler(function() { showToast('Gagal memuat.', 'error'); })
    .getKategori(STATE.user.spreadsheetId);
}

function renderKategoriList(data) {
  var container = document.getElementById('kategoriList');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-price-tag-3-line"></i></div><div class="empty-title">Belum ada kategori</div><button class="btn btn-primary" onclick="modalTambahKategori()"><i class="ri-add-line"></i> Tambah Kategori</button></div>'; return; }
  var pp = data.filter(function(k) { return k['Jenis'] === 'Pemasukan' || k['Jenis'] === 'Pemasukan Pribadi'; });
  var ep = data.filter(function(k) { return k['Jenis'] === 'Pengeluaran' || k['Jenis'] === 'Pengeluaran Pribadi'; });
  var tb = lengkapiKategoriDefault(data.filter(isKategoriTipePembayaranBisnis), tipePembayaranBisnisDefault(), 'TipePembayaranBisnis', '#00d5ff');
  var bs = lengkapiKategoriDefault(data.filter(isKategoriBisnisUsaha), kategoriBisnisDefault(), 'Bisnis', '#b84cff');

  function lengkapiKategoriDefault(list, defaults, jenis, warna) {
    var hasil = (list || []).slice();
    var existing = hasil.map(function(k) { return String(k['Nama'] || '').trim().toLowerCase(); });
    defaults.forEach(function(nama) {
      if (existing.indexOf(String(nama).toLowerCase()) === -1) {
        hasil.push({ ID: '', Nama: nama, Jenis: jenis, Warna: warna, Status: 'Aktif', _Default: true });
      }
    });
    return hasil;
  }

  function renderGroup(list, label, color) {
    if (!list.length) return '<div style="margin-bottom:24px"><div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding:8px 0;border-bottom:1px solid var(--border)">' + label + '</div><div class="empty-state" style="padding:20px"><div class="empty-desc">Belum ada kategori</div></div></div>';
    return '<div style="margin-bottom:28px"><div style="font-size:11px;font-weight:700;color:' + color + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding:8px 0;border-bottom:1px solid var(--border)">' + label + '</div><div class="grid-3 stagger-in">' +
      list.map(function(k) {
        var warna = k['Warna'] || 'var(--neon)';
        var actions = k['_Default']
          ? '<span class="badge badge-neon" style="font-size:10px">Default</span>'
          : '<div style="display:flex;gap:4px"><button class="btn btn-info btn-icon btn-sm" onclick="modalEditKategori(\'' + k['ID'] + '\')"><i class="ri-edit-line"></i></button><button class="btn btn-danger btn-icon btn-sm" onclick="hapusKategoriConfirm(\'' + k['ID'] + '\')"><i class="ri-delete-bin-line"></i></button></div>';
        return '<div class="card" style="border-left:2px solid ' + warna + '">' +
          '<div style="display:flex;align-items:center;justify-content:space-between">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
          '<div style="width:38px;height:38px;border-radius:9px;background:' + warna + '18;display:flex;align-items:center;justify-content:center;font-size:18px;color:' + warna + '"><i class="ri-price-tag-3-line"></i></div>' +
          '<div><div style="font-weight:600;font-size:14px">' + k['Nama'] + '</div><span class="badge ' + (k['Status']==='Aktif'?'badge-success':'badge-danger') + '" style="font-size:10px;margin-top:3px;display:inline-flex">' + (k['Status']||'Aktif') + '</span></div>' +
          '</div>' + actions +
          '</div></div>';
      }).join('') + '</div></div>';
  }
  container.innerHTML = renderGroup(pp, 'Pemasukan Pribadi', 'var(--green)') + renderGroup(ep, 'Pengeluaran Pribadi', 'var(--red)') + renderGroup(tb, 'TipePembayaranBisnis', 'var(--neon)') + renderGroup(bs, 'Bisnis', 'var(--neon3)');
}

function modalTambahKategori() {
  openModal('Tambah Kategori',
    '<div class="form-group"><label>Nama Kategori *</label><input type="text" class="form-control" id="katNama" list="kategoriBisnisDefaultList" placeholder="Nama kategori"><datalist id="kategoriBisnisDefaultList">' + kategoriBisnisDefault().concat(tipePembayaranBisnisDefault()).map(function(n) { return '<option value="' + n + '"></option>'; }).join('') + '</datalist></div>' +
    '<div class="form-group"><label>Jenis *</label><select class="form-control" id="katJenis"><option value="Pemasukan Pribadi">Pemasukan Pribadi</option><option value="Pengeluaran Pribadi">Pengeluaran Pribadi</option><option value="TipePembayaranBisnis">TipePembayaranBisnis</option><option value="Bisnis">Bisnis</option></select></div>' +
    '<div class="form-group"><label>Kategori Bisnis Cepat</label><div class="quick-chip-row">' + kategoriBisnisDefault().map(function(n) { return '<button type="button" class="quick-chip" onclick="pilihKategoriBisnisCepat(\'' + escapeHtmlAttr(n) + '\')">' + escapeHtmlText(n) + '</button>'; }).join('') + '</div></div>' +
    '<div class="form-group"><label>Warna</label><div class="color-swatches" id="katWarna">' +
    ['#00ff99','#00d5ff','#b84cff','#ff4560','#ff9f43','#00d68f','#ffd32a','#ff6b81'].map(function(c) {
      return '<div class="color-swatch' + (c==='#00ff99'?' active':'') + '" style="background:' + c + '" data-color="' + c + '" onclick="pilihWarna(this,\'katWarna\')"></div>';
    }).join('') + '</div></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="simpanKategori()"><i class="ri-save-line"></i> Simpan</button>'
  );
}

function simpanKategori() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa menyimpan kategori.')) return;

  var warna = document.querySelector('#katWarna .color-swatch.active');
  var data = { nama: document.getElementById('katNama').value, jenis: document.getElementById('katJenis').value, warna: warna ? warna.getAttribute('data-color') : '#00ff99' };
  if (!data.nama) { showToast('Nama wajib diisi.', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); MASTER_TRANSAKSI_LOADED = false; loadKategori(); refreshBudgetJikaAktif(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal menyimpan.', 'error'); })
    .tambahKategori(STATE.user.spreadsheetId, data);
}

var _editKatId = null;
function modalEditKategori(id) {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa edit kategori.')) return;

  _editKatId = id;
  var k = _allKategori.find(function(x) { return x['ID'] === id; });
  if (!k) return;
  var warnaKat = k['Warna'] || '#00ff99';
  var jenisKat = isKategoriTipePembayaranBisnis(k) ? 'TipePembayaranBisnis' : (k['Jenis'] || 'Bisnis');
  openModal('Edit Kategori',
    '<div class="form-group"><label>Nama Kategori</label><input type="text" class="form-control" id="editKatNama" value="' + (k['Nama']||'') + '"></div>' +
    '<div class="form-row"><div class="form-group"><label>Jenis</label><select class="form-control" id="editKatJenis"><option value="Pengeluaran Pribadi"' + (jenisKat==='Pengeluaran Pribadi'?' selected':'') + '>Pengeluaran Pribadi</option><option value="Pemasukan Pribadi"' + (jenisKat==='Pemasukan Pribadi'?' selected':'') + '>Pemasukan Pribadi</option><option value="TipePembayaranBisnis"' + (jenisKat==='TipePembayaranBisnis'?' selected':'') + '>TipePembayaranBisnis</option><option value="Bisnis"' + (jenisKat==='Bisnis'?' selected':'') + '>Bisnis</option></select></div><div class="form-group"><label>Status</label><select class="form-control" id="editKatStatus"><option' + (k['Status']==='Aktif'?' selected':'') + '>Aktif</option><option' + (k['Status']==='Nonaktif'?' selected':'') + '>Nonaktif</option></select></div></div>' +
    '<div class="form-group"><label>Warna</label><div class="color-swatches" id="editKatWarna">' +
    ['#00ff99','#00d5ff','#b84cff','#ff4560','#ff9f43','#00d68f','#ffd32a','#ff6b81'].map(function(c) {
      return '<div class="color-swatch' + (c===warnaKat?' active':'') + '" style="background:' + c + '" data-color="' + c + '" onclick="pilihWarna(this,\'editKatWarna\')"></div>';
    }).join('') + '</div></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="updateKategori()"><i class="ri-save-line"></i> Update</button>'
  );
}

function pilihKategoriBisnisCepat(nama) {
  var input = document.getElementById('katNama');
  var jenis = document.getElementById('katJenis');
  if (input) input.value = nama;
  if (jenis) jenis.value = 'Bisnis';
}

function updateKategori() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa update kategori.')) return;

  var warna = document.querySelector('#editKatWarna .color-swatch.active');
  var data = { nama: document.getElementById('editKatNama').value, jenis: document.getElementById('editKatJenis').value, status: document.getElementById('editKatStatus').value, warna: warna ? warna.getAttribute('data-color') : '#00ff99' };
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); MASTER_TRANSAKSI_LOADED = false; loadKategori(); refreshBudgetJikaAktif(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal mengupdate.', 'error'); })
    .editKategori(STATE.user.spreadsheetId, _editKatId, data);
}

function hapusKategoriConfirm(id) {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa hapus kategori.')) return;

  swalFire({ title: 'Hapus Kategori?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal' })
    .then(function(r) {
      if (r.isConfirmed) {
        google.script.run
          .withSuccessHandler(function(res) { var rr = JSON.parse(res); if (rr.status === 'success') { showToast(rr.pesan, 'success'); MASTER_TRANSAKSI_LOADED = false; loadKategori(); refreshBudgetJikaAktif(); } else showToast(rr.pesan, 'error'); })
          .withFailureHandler(function() { showToast('Gagal.', 'error'); })
          .hapusKategori(STATE.user.spreadsheetId, id);
      }
    });
}

// ============================================================
// LAPORAN
// ============================================================
function renderLaporan() {
  var now = new Date();
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-bar-chart-2-line"></i> Laporan Keuangan</div><div class="page-actions"><button class="btn btn-primary btn-sm" onclick="printLaporanReport()"><i class="ri-printer-line"></i> PDF</button></div></div>' +
    '<div class="filter-bar">' +
    '<select class="form-control" id="lapPeriode" style="width:145px" onchange="ubahFilterLaporan()"><option value="7hari" selected>7 Hari</option><option value="bulan">Bulan</option><option value="1bln">1 Bulan</option><option value="6bln">6 Bulan</option><option value="1thn">1 Tahun</option><option value="semua">Semua Data</option></select>' +
    '<select class="form-control" id="lapBulan" style="width:150px" onchange="loadLaporan()" disabled>' + [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) { return '<option value="' + m + '"' + (m==(now.getMonth()+1)?' selected':'') + '>' + new Date(2000,m-1,1).toLocaleDateString('id-ID',{month:'long'}) + '</option>'; }).join('') + '</select>' +
    '<select class="form-control" id="lapTahun" style="width:100px" onchange="loadLaporan()" disabled>' + [now.getFullYear()-1,now.getFullYear(),now.getFullYear()+1].map(function(y) { return '<option value="' + y + '"' + (y===now.getFullYear()?' selected':'') + '>' + y + '</option>'; }).join('') + '</select>' +
    '<button class="btn btn-primary" onclick="loadLaporan()"><i class="ri-search-line"></i> Tampilkan</button>' +
    '</div><div id="laporanResult"></div></div>';
  aturModeLaporan();
  loadLaporan();
}

function aturModeLaporan() {
  var mode = document.getElementById('lapPeriode') ? document.getElementById('lapPeriode').value : '7hari';
  var bulan = document.getElementById('lapBulan');
  var tahun = document.getElementById('lapTahun');
  var isBulan = mode === 'bulan';
  if (bulan) bulan.disabled = !isBulan;
  if (tahun) tahun.disabled = !isBulan;
}

function ubahFilterLaporan() {
  aturModeLaporan();
  loadLaporan();
}

function hitungLaporanDariTransaksi(data, mode, bulan, tahun) {
  var list = (data || []).filter(function(t) {
    return transaksiMasukPeriode(t, mode || '7hari', bulan, tahun);
  });
  var perKategoriMap = {};
  var perHariMap = {};
  var totalPemasukan = 0;
  var totalPengeluaran = 0;

  list.forEach(function(t) {
    var d = ambilTanggalTransaksi(t);
    var nominal = angkaNominal(txnAmbilNominal(t));
    var jenis = txnApakahMasuk(t) ? 'Pemasukan' : (txnApakahKeluar(t) ? 'Pengeluaran' : '');
    if (!jenis || !nominal) return;

    if (jenis === 'Pemasukan') totalPemasukan += nominal;
    if (jenis === 'Pengeluaran') totalPengeluaran += nominal;

    var kategori = txnAmbilKategori(t) || 'Lainnya';
    var keyKategori = kategori + '|' + jenis;
    if (!perKategoriMap[keyKategori]) perKategoriMap[keyKategori] = { nama: kategori, jenis: jenis, total: 0 };
    perKategoriMap[keyKategori].total += nominal;

    if (d) {
      var tanggalKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (!perHariMap[tanggalKey]) perHariMap[tanggalKey] = { tanggal: tanggalKey, pemasukan: 0, pengeluaran: 0 };
      if (jenis === 'Pemasukan') perHariMap[tanggalKey].pemasukan += nominal;
      if (jenis === 'Pengeluaran') perHariMap[tanggalKey].pengeluaran += nominal;
    }
  });

  return {
    totalPemasukan: totalPemasukan,
    totalPengeluaran: totalPengeluaran,
    sisaBersih: totalPemasukan - totalPengeluaran,
    jumlahTransaksi: list.length,
    perKategori: Object.keys(perKategoriMap).map(function(k) { return perKategoriMap[k]; }),
    perHari: Object.keys(perHariMap).sort().map(function(k) { return perHariMap[k]; }),
    detail: list
  };
}

function renderLaporanHasil(d, mode) {
  d = d || {};
  d.totalPemasukan = angkaDashboard(d.totalPemasukan);
  d.totalPengeluaran = angkaDashboard(d.totalPengeluaran);
  d.sisaBersih = d.sisaBersih !== undefined ? angkaDashboard(d.sisaBersih) : (d.totalPemasukan - d.totalPengeluaran);
  d.jumlahTransaksi = angkaDashboard(d.jumlahTransaksi);
  d.perKategori = (d.perKategori || []).map(function(k) {
    k.total = angkaDashboard(k.total);
    return k;
  });
  d.perHari = (d.perHari || []).map(function(h) {
    h.pemasukan = angkaDashboard(h.pemasukan);
    h.pengeluaran = angkaDashboard(h.pengeluaran);
    return h;
  });

  LAST_LAPORAN_DATA = d;
  var pct = d.totalPemasukan > 0 ? Math.round((d.totalPengeluaran / d.totalPemasukan) * 100) : 0;
  var pctBar = Math.min(pct, 100);
  var barClass = pct > 100 ? 'danger' : pct > 80 ? 'warning' : '';
  var perKatPengeluaran = (d.perKategori || []).filter(function(k) { return k.jenis === 'Pengeluaran'; });
  var maxKat = perKatPengeluaran.reduce(function(m, k) { return Math.max(m, k.total); }, 0);
  var laporanResult = document.getElementById('laporanResult');
  if (!laporanResult) return;

  laporanResult.innerHTML =
    '<div class="grid-3 stagger-in" style="margin-bottom:20px">' +
    '<div class="stat-card income"><div class="stat-head"><div><div class="stat-label">Total Pemasukan</div><div class="stat-value green">' + rupiah(d.totalPemasukan) + '</div></div><i class="ri-arrow-up-circle-line stat-icon"></i></div></div>' +
    '<div class="stat-card expense"><div class="stat-head"><div><div class="stat-label">Total Pengeluaran</div><div class="stat-value red">' + rupiah(d.totalPengeluaran) + '</div></div><i class="ri-arrow-down-circle-line stat-icon"></i></div></div>' +
    '<div class="stat-card"><div class="stat-head"><div><div class="stat-label">Sisa Bersih</div><div class="stat-value ' + (d.sisaBersih>=0?'green':'red') + '">' + rupiah(d.sisaBersih) + '</div></div><i class="ri-scales-line stat-icon"></i></div>' +
    '<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px"><span>Realisasi Belanja</span><span>' + pct + '%</span></div><div class="progress-wrap"><div class="progress-bar ' + barClass + '" style="width:' + pctBar + '%"></div></div></div></div>' +
    '</div>' +
    '<div class="grid-2">' +
    '<div class="chart-wrap"><div class="chart-title" style="margin-bottom:16px"><i class="ri-pie-chart-line" style="color:var(--neon3);margin-right:6px"></i>Pengeluaran per Kategori</div>' +
    (perKatPengeluaran.length ? '<div style="display:flex;flex-direction:column;gap:10px">' +
      perKatPengeluaran.sort(function(a,b){return b.total-a.total}).slice(0,6).map(function(k) {
        var p = maxKat > 0 ? (k.total/maxKat*100).toFixed(0) : 0;
        return '<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:var(--text2)">' + escapeHtmlText(k.nama) + '</span><span style="color:var(--text);font-weight:600">' + rupiah(k.total) + '</span></div><div class="progress-wrap"><div class="progress-bar" style="width:' + p + '%"></div></div></div>';
      }).join('') + '</div>' : '<div class="empty-state" style="padding:20px"><div class="empty-desc">Tidak ada data pengeluaran</div></div>') +
    '</div>' +
    '<div class="chart-wrap"><div class="chart-title" style="margin-bottom:16px"><i class="ri-line-chart-line" style="color:var(--neon);margin-right:6px"></i>Tren Harian</div><div class="chart-container" style="height:200px"><canvas id="chartLaporan"></canvas></div></div>' +
    '</div>';

  setTimeout(function() {
    var ctx = document.getElementById('chartLaporan');
    if (!ctx || !d.perHari || !d.perHari.length) return;
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    var textColor = isDark ? '#6b7a94' : '#5a6478';
    ensureChartJs().then(function() {
      var freshCtx = document.getElementById('chartLaporan');
      if (!freshCtx) return;
      if (STATE.chartInstances['laporan']) STATE.chartInstances['laporan'].destroy();
      STATE.chartInstances['laporan'] = new Chart(freshCtx, {
        type: 'line',
        data: {
          labels: d.perHari.map(function(h) { return mode === 'semua' ? tanggalIndo(h.tanggal) : String(h.tanggal || '').split('-')[2]; }),
          datasets: [
            { label: 'Pemasukan', data: d.perHari.map(function(h) { return h.pemasukan; }), borderColor: '#00d68f', backgroundColor: 'rgba(0,214,143,0.08)', tension: 0.4, fill: true, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#00d68f' },
            { label: 'Pengeluaran', data: d.perHari.map(function(h) { return h.pengeluaran; }), borderColor: '#ff4560', backgroundColor: 'rgba(255,69,96,0.08)', tension: 0.4, fill: true, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#ff4560' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 900 }, plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } }, scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor } } } }
      });
    }).catch(function(err) {
      console.error(err);
      showToast('Gagal memuat library chart.', 'error');
    });
  }, 100);
}

function loadLaporan() {
  var mode = document.getElementById('lapPeriode') ? document.getElementById('lapPeriode').value : '7hari';
  var bulan = document.getElementById('lapBulan') ? document.getElementById('lapBulan').value : '';
  var tahun = document.getElementById('lapTahun') ? document.getElementById('lapTahun').value : '';
  LAST_LAPORAN_FILTER = { mode: mode, bulan: bulan, tahun: tahun };
  aturModeLaporan();
  var lr = document.getElementById('laporanResult');
  if (lr) lr.innerHTML = '<div class="skeleton sk-card" style="height:120px"></div><div class="skeleton sk-card" style="height:240px;margin-top:16px"></div>';

  google.script.run
    .withSuccessHandler(function(res) {
      var r;
      try { r = JSON.parse(res); }
      catch (errParse) { showToast('Respon laporan tidak valid.', 'error'); return; }
      if (r.status !== 'success') { showToast('Gagal memuat laporan.', 'error'); return; }
      renderLaporanHasil(hitungLaporanDariTransaksi(r.data || [], mode, bulan, tahun), mode);
    })
    .withFailureHandler(function() { showToast('Gagal memuat laporan.', 'error'); })
    .getTransaksi(STATE.user.spreadsheetId, {
      bulan: '',
      tahun: '',
      jenis: '',
      role: STATE.user.role,
      periode: 'semua',
      limitMode: 'semua'
    });
}

// ============================================================
// BUDGET
// ============================================================
var _allBudget = [];

function renderBudget() {
  var now = new Date();
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-pie-chart-line"></i> Budget Bulanan</div><div class="page-actions"><button class="btn btn-primary" onclick="modalTambahBudget()"><i class="ri-add-line"></i> Tambah Budget</button><button class="btn btn-secondary btn-sm btn-refresh" onclick="loadBudget()"><i class="ri-refresh-line"></i></button></div></div>' +
    '<div class="filter-bar">' +
    '<select class="form-control" id="budBulan" style="width:150px" onchange="loadBudget()">' + [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) { return '<option value="' + m + '"' + (m==(now.getMonth()+1)?' selected':'') + '>' + new Date(2000,m-1,1).toLocaleDateString('id-ID',{month:'long'}) + '</option>'; }).join('') + '</select>' +
    '<select class="form-control" id="budTahun" style="width:100px" onchange="loadBudget()">' + [now.getFullYear()-1,now.getFullYear()].map(function(y) { return '<option value="' + y + '"' + (y===now.getFullYear()?' selected':'') + '>' + y + '</option>'; }).join('') + '</select>' +
    '</div><div id="budgetList"></div></div>';
  loadBudget();
}

function loadBudget() {
  var bulan = document.getElementById('budBulan') ? document.getElementById('budBulan').value : '';
  var tahun = document.getElementById('budTahun') ? document.getElementById('budTahun').value : '';
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status && r.status !== 'success') { showToast(r.pesan || 'Gagal memuat budget.', 'error'); return; }
      _allBudget = r.data || [];
      renderBudgetList(_allBudget);
    })
    .withFailureHandler(function() { showToast('Gagal memuat budget.', 'error'); })
    .getBudget(STATE.user.spreadsheetId, bulan, tahun);
}

function renderBudgetList(data) {
  var container = document.getElementById('budgetList');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-pie-chart-line"></i></div><div class="empty-title">Belum ada budget</div><div class="empty-desc">Buat rencana anggaran untuk bulan ini</div><button class="btn btn-primary" onclick="modalTambahBudget()"><i class="ri-add-line"></i> Tambah Budget</button></div>'; return; }
  var totalBudget = data.reduce(function(sum, b) { return sum + angkaNominal(b['Nominal Budget']); }, 0);
  var totalRealisasi = data.reduce(function(sum, b) { return sum + angkaNominal(b['Realisasi']); }, 0);
  var sisa = totalBudget - totalRealisasi;
  var totalPct = totalBudget > 0 ? Math.round((totalRealisasi / totalBudget) * 100) : 0;
  var overCount = data.filter(function(b) { return angkaNominal(b['Persentase']) > 100; }).length;
  container.innerHTML =
    '<div class="budget-overview">' +
      '<div class="budget-overview-main"><span>Total Budget Bulan Ini</span><strong>' + rupiah(totalBudget) + '</strong><div class="progress-wrap"><div class="progress-bar ' + (totalPct > 100 ? 'danger' : totalPct > 80 ? 'warning' : '') + '" style="width:' + Math.min(totalPct, 100) + '%"></div></div><small>' + totalPct + '% sudah terpakai</small></div>' +
      '<div class="budget-mini-stat"><span>Realisasi</span><strong>' + rupiah(totalRealisasi) + '</strong></div>' +
      '<div class="budget-mini-stat ' + (sisa < 0 ? 'danger' : '') + '"><span>' + (sisa < 0 ? 'Lebih Budget' : 'Sisa Aman') + '</span><strong>' + rupiah(Math.abs(sisa)) + '</strong></div>' +
      '<div class="budget-mini-stat"><span>Kategori Lewat</span><strong>' + overCount + '</strong></div>' +
    '</div>' +
    '<div class="budget-list">' + data.map(function(b) {
    var pct = b['Persentase'] || 0;
    var over = pct > 100, warn = pct > 80 && !over;
    var barClass = over ? 'danger' : warn ? 'warning' : '';
    var amountColor = over ? 'var(--red)' : warn ? 'var(--orange)' : 'var(--green)';
    var remain = angkaNominal(b['Nominal Budget']) - angkaNominal(b['Realisasi']);
    return '<div class="card budget-card">' +
      '<div class="budget-card-head">' +
        '<div><div class="budget-category">' + escapeHtmlText(b['Kategori']) + '</div><div class="budget-caption">Budget: ' + rupiah(b['Nominal Budget']) + '</div></div>' +
        '<div class="budget-card-action"><button class="btn btn-danger btn-icon btn-sm" onclick="hapusBudgetConfirm(\'' + escapeHtmlAttr(b['ID']) + '\')" title="Hapus budget"><i class="ri-delete-bin-line"></i></button></div>' +
      '</div>' +
      '<div class="budget-card-body">' +
        '<div><span>Terpakai</span><strong style="color:' + amountColor + '">' + rupiah(b['Realisasi']) + '</strong></div>' +
        '<div><span>' + (remain < 0 ? 'Lewat' : 'Sisa') + '</span><strong>' + rupiah(Math.abs(remain)) + '</strong></div>' +
        '<div><span>Progress</span><strong>' + pct + '%</strong></div>' +
      '</div>' +
      '<div class="progress-wrap"><div class="progress-bar ' + barClass + '" style="width:' + Math.min(pct,100) + '%"></div></div>' +
      (over ? '<div class="budget-alert"><i class="ri-error-warning-line"></i> Melebihi budget, cek transaksi kategori ini.</div>' : warn ? '<div class="budget-alert warning"><i class="ri-alarm-warning-line"></i> Hampir habis, gunakan sisa budget dengan hati-hati.</div>' : '') +
      '</div>';
  }).join('') + '</div>';
}

function modalTambahBudget() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa tambah budget.')) return;
  loadMasterInputTransaksi(function() {
    openModal('Tambah Budget',
      '<div class="budget-modal-hint"><i class="ri-price-tag-3-line"></i><div><strong>Pilih dari kategori akunmu</strong><span>Budget akan otomatis dibandingkan dengan transaksi pengeluaran di kategori yang sama.</span></div></div>' +
      '<div class="form-row"><div class="form-group"><label>Bulan *</label><select class="form-control" id="budNBulan">' + [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) { return '<option value="' + m + '"' + (m==(new Date().getMonth()+1)?' selected':'') + '>' + new Date(2000,m-1,1).toLocaleDateString('id-ID',{month:'long'}) + '</option>'; }).join('') + '</select></div><div class="form-group"><label>Tahun *</label><input type="number" class="form-control" id="budNTahun" value="' + new Date().getFullYear() + '"></div></div>' +
      '<div class="form-group"><label>Kategori *</label><select class="form-control" id="budNKategori">' + buatOptionsKategoriBudget() + '</select></div>' +
      '<div class="form-group"><label>Nominal Budget *</label><input type="text" class="form-control nominal-rupiah" id="budNNominal" placeholder="Rp 0" inputmode="numeric"></div>',
      '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="simpanBudget()"><i class="ri-save-line"></i> Simpan</button>'
    );
    setTimeout(function() {
      setupInputRupiah('budNNominal');
    }, 50);
  });
}

function simpanBudget() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa menyimpan budget.')) return;

  var data = { bulan: document.getElementById('budNBulan').value, tahun: document.getElementById('budNTahun').value, kategori: document.getElementById('budNKategori').value, nominal: angkaNominal(document.getElementById('budNNominal').value) };
  if (!data.kategori || !data.nominal) { showToast('Semua field wajib diisi.', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); LAST_DASHBOARD_DATA = null; loadBudget(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal menyimpan.', 'error'); })
    .tambahBudget(STATE.user.spreadsheetId, data);
}

function hapusBudgetConfirm(id) {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa hapus budget.')) return;

  swalFire({ title: 'Hapus Budget?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal' })
    .then(function(r) {
      if (r.isConfirmed) {
        google.script.run
          .withSuccessHandler(function(res) { var rr = JSON.parse(res); if (rr.status === 'success') { showToast(rr.pesan, 'success'); LAST_DASHBOARD_DATA = null; loadBudget(); } else showToast(rr.pesan, 'error'); })
          .withFailureHandler(function() { showToast('Gagal.', 'error'); })
          .hapusBudget(STATE.user.spreadsheetId, id);
      }
    });
}

// ============================================================
// PELANGGAN
// ============================================================
var _allPelanggan = [];

function renderPelanggan() {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-group-line"></i> Pelanggan</div><div class="page-actions"><button class="btn btn-primary" onclick="modalTambahPelanggan()"><i class="ri-add-line"></i> Tambah</button><button class="btn btn-secondary btn-sm btn-refresh" onclick="loadPelanggan()"><i class="ri-refresh-line"></i></button></div></div><div class="filter-bar"><div class="search-wrap" style="flex:1"><i class="ri-search-line"></i><input type="text" class="form-control" id="searchPelanggan" placeholder="Cari pelanggan..." oninput="filterPelangganUI()"></div></div><div id="pelangganList"></div></div>';
  loadPelanggan();
}

function loadPelanggan() {
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); _allPelanggan = r.data || []; renderPelangganList(_allPelanggan); })
    .withFailureHandler(function() { showToast('Gagal memuat.', 'error'); })
    .getPelanggan(STATE.user.spreadsheetId);
}

function filterPelangganUI() {
  var q = (document.getElementById('searchPelanggan').value || '').toLowerCase();
  renderPelangganList(_allPelanggan.filter(function(p) { return (p['Nama']||'').toLowerCase().includes(q) || (p['No HP']||'').includes(q) || (p['Email']||'').toLowerCase().includes(q); }));
}

function renderPelangganList(data) {
  var container = document.getElementById('pelangganList');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-group-line"></i></div><div class="empty-title">Belum ada pelanggan</div><button class="btn btn-primary" onclick="modalTambahPelanggan()"><i class="ri-add-line"></i> Tambah Pelanggan</button></div>'; return; }
  container.innerHTML = '<div class="grid-3 stagger-in">' + data.map(function(p) {
    return '<div class="card">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--neon),var(--neon2));color:#000;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;box-shadow:0 0 12px rgba(0,255,153,0.2)">' + getInitial(p['Nama']) + '</div>' +
      '<div><div style="font-weight:600;font-size:14px">' + p['Nama'] + '</div><span class="badge ' + (p['Status']==='Aktif'?'badge-success':'badge-danger') + '">' + p['Status'] + '</span></div></div>' +
      '<div style="font-size:12px;color:var(--text3);display:flex;flex-direction:column;gap:4px">' +
      (p['No HP'] ? '<div><i class="ri-phone-line" style="margin-right:4px"></i>' + p['No HP'] + '</div>' : '') +
      (p['Email'] ? '<div><i class="ri-mail-line" style="margin-right:4px"></i>' + p['Email'] + '</div>' : '') +
      (p['Alamat'] ? '<div><i class="ri-map-pin-line" style="margin-right:4px"></i>' + p['Alamat'] + '</div>' : '') +
      '</div><div style="display:flex;gap:6px;margin-top:12px;justify-content:flex-end">' +
      '<button class="btn btn-info btn-icon btn-sm" onclick="modalEditPelanggan(\'' + p['ID'] + '\')"><i class="ri-edit-line"></i></button>' +
      '<button class="btn btn-danger btn-icon btn-sm" onclick="hapusPelangganConfirm(\'' + p['ID'] + '\')"><i class="ri-delete-bin-line"></i></button>' +
      '</div></div>';
  }).join('') + '</div>';
}

function modalTambahPelanggan() {
  openModal('Tambah Pelanggan',
    '<div class="form-group"><label>Nama *</label><input type="text" class="form-control" id="plgNama" placeholder="Nama pelanggan"></div><div class="form-row"><div class="form-group"><label>No HP</label><input type="tel" class="form-control" id="plgHp" placeholder="08xx"></div><div class="form-group"><label>Email</label><input type="email" class="form-control" id="plgEmail" placeholder="email@..."></div></div><div class="form-group"><label>Alamat</label><textarea class="form-control" id="plgAlamat" rows="2" placeholder="Alamat lengkap"></textarea></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="simpanPelanggan()"><i class="ri-save-line"></i> Simpan</button>'
  );
}

function simpanPelanggan() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa menyimpan pelanggan.')) return;

  var data = { nama: document.getElementById('plgNama').value, noHp: document.getElementById('plgHp').value, email: document.getElementById('plgEmail').value, alamat: document.getElementById('plgAlamat').value };
  if (!data.nama) { showToast('Nama wajib diisi.', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); loadPelanggan(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal menyimpan.', 'error'); })
    .tambahPelanggan(STATE.user.spreadsheetId, data);
}

var _editPlgId = null;
function modalEditPelanggan(id) {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa edit pelanggan.')) return;

  _editPlgId = id;
  var p = _allPelanggan.find(function(x) { return x['ID'] === id; });
  if (!p) return;
  openModal('Edit Pelanggan',
    '<div class="form-group"><label>Nama</label><input type="text" class="form-control" id="editPlgNama" value="' + (p['Nama']||'') + '"></div><div class="form-row"><div class="form-group"><label>No HP</label><input type="tel" class="form-control" id="editPlgHp" value="' + (p['No HP']||'') + '"></div><div class="form-group"><label>Email</label><input type="email" class="form-control" id="editPlgEmail" value="' + (p['Email']||'') + '"></div></div><div class="form-group"><label>Alamat</label><textarea class="form-control" id="editPlgAlamat" rows="2">' + (p['Alamat']||'') + '</textarea></div><div class="form-group"><label>Status</label><select class="form-control" id="editPlgStatus"><option' + (p['Status']==='Aktif'?' selected':'') + '>Aktif</option><option' + (p['Status']==='Nonaktif'?' selected':'') + '>Nonaktif</option></select></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="updatePelanggan()"><i class="ri-save-line"></i> Update</button>'
  );
}

function updatePelanggan() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa update pelanggan.')) return;

  var data = { nama: document.getElementById('editPlgNama').value, noHp: document.getElementById('editPlgHp').value, email: document.getElementById('editPlgEmail').value, alamat: document.getElementById('editPlgAlamat').value, status: document.getElementById('editPlgStatus').value };
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); loadPelanggan(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal.', 'error'); })
    .editPelanggan(STATE.user.spreadsheetId, _editPlgId, data);
}

function hapusPelangganConfirm(id) {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa hapus pelanggan.')) return;

  swalFire({ title: 'Hapus Pelanggan?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal' })
    .then(function(r) {
      if (r.isConfirmed) {
        google.script.run
          .withSuccessHandler(function(res) { var rr = JSON.parse(res); if (rr.status === 'success') { showToast(rr.pesan, 'success'); loadPelanggan(); } else showToast(rr.pesan, 'error'); })
          .withFailureHandler(function() { showToast('Gagal.', 'error'); })
          .hapusPelanggan(STATE.user.spreadsheetId, id);
      }
    });
}

// ============================================================
// PEMBAYARAN
// ============================================================
var _allPembayaran = [];

function renderPembayaran() {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-secure-payment-line"></i> Verifikasi Pembayaran</div><div class="page-actions"><button class="btn btn-primary" onclick="modalTambahPembayaran()"><i class="ri-add-line"></i> Tambah</button><button class="btn btn-secondary btn-sm btn-refresh" onclick="loadPembayaran()"><i class="ri-refresh-line"></i></button></div></div><div id="pembayaranList"></div></div>';
  loadPembayaran();
}

function loadPembayaran() {
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); _allPembayaran = r.data || []; renderPembayaranList(_allPembayaran); })
    .withFailureHandler(function() { showToast('Gagal memuat.', 'error'); })
    .getPembayaran(STATE.user.spreadsheetId);
}

function renderPembayaranList(data) {
  var container = document.getElementById('pembayaranList');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-secure-payment-line"></i></div><div class="empty-title">Belum ada pembayaran</div></div>'; return; }
  var badgeStatus = function(s) { if (s === 'Diterima' || s === 'Lunas') return 'badge-success'; if (s === 'Ditolak' || s === 'Batal') return 'badge-danger'; return 'badge-warning'; };
  var butuhAksi = function(s) { return ['Menunggu', 'Menunggu Pembayaran', 'Menunggu Verifikasi', 'Pending', 'Belum Lunas'].includes(s || 'Menunggu'); };
  container.innerHTML = '<div class="card table-wrap"><table class="data-table"><thead><tr><th>Waktu</th><th>Pelanggan</th><th>Jumlah</th><th>Metode</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
    data.map(function(p) {
      var status = p['Status'] || 'Menunggu';
      return '<tr><td>' + tanggalIndo(p['Created At']) + '</td><td>' + (p['Pelanggan ID']||'-') + '</td><td style="font-weight:700;color:var(--neon)">' + rupiah(p['Jumlah']) + '</td><td>' + (p['Metode']||'-') + '</td><td><span class="badge ' + badgeStatus(p['Status']) + '">' + p['Status'] + '</span></td>' +
        '<td>' + (butuhAksi(status) ? '<div class="actions"><button class="btn btn-primary btn-sm" onclick="verifikasiPembayaranAction(\'' + p['ID'] + '\',\'Lunas\')"><i class="ri-check-line"></i> Lunas</button><button class="btn btn-danger btn-sm" onclick="verifikasiPembayaranAction(\'' + p['ID'] + '\',\'Ditolak\')"><i class="ri-close-line"></i> Tolak</button></div>' : '<span style="color:var(--text3);font-size:12px">Selesai</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function verifikasiPembayaranAction(id, status) {
  swalFire({ title: 'Konfirmasi ' + status + '?', icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, ' + status, cancelButtonText: 'Batal' })
    .then(function(r) {
      if (r.isConfirmed) {
        google.script.run
          .withSuccessHandler(function(res) { var rr = JSON.parse(res); if (rr.status === 'success') { showToast(rr.pesan, 'success'); loadPembayaran(); } else showToast(rr.pesan, 'error'); })
          .withFailureHandler(function() { showToast('Gagal.', 'error'); })
          .verifikasiPembayaran(STATE.user.spreadsheetId, id, status);
      }
    });
}

function modalTambahPembayaran() {
  openModal('Tambah Pembayaran',
    '<div class="form-row"><div class="form-group"><label>Jumlah *</label><input type="number" class="form-control" id="pmbJumlah" placeholder="0"></div><div class="form-group"><label>Metode *</label><select class="form-control" id="pmbMetode"><option>QRIS</option><option>Transfer Bank</option><option>DANA</option><option>E-Wallet</option><option>Cash</option><option>Lainnya</option></select></div></div><div class="form-group"><label>ID Pelanggan</label><input type="text" class="form-control" id="pmbPelanggan" placeholder="ID pelanggan (opsional)"></div><div class="form-group"><label>Catatan</label><input type="text" class="form-control" id="pmbCatatan" placeholder="Catatan pembayaran"></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="simpanPembayaran()"><i class="ri-save-line"></i> Simpan</button>'
  );
}

function simpanPembayaran() {
  if (!cekBolehMenulis('Mode lihat saja aktif. Tidak bisa menyimpan pembayaran.')) return;

  var data = { jumlah: document.getElementById('pmbJumlah').value, metode: document.getElementById('pmbMetode').value, pelangganId: document.getElementById('pmbPelanggan').value, catatan: document.getElementById('pmbCatatan').value };
  if (!data.jumlah) { showToast('Jumlah wajib diisi.', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); loadPembayaran(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal menyimpan.', 'error'); })
    .tambahPembayaran(STATE.user.spreadsheetId, data);
}

// ============================================================
// BOT LOG
// ============================================================
function renderBotLog() {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-terminal-box-line"></i> Bot Log</div><div class="page-actions"><button class="btn btn-secondary btn-sm btn-refresh" onclick="loadBotLog()"><i class="ri-refresh-line"></i> Refresh</button></div></div><div id="botlogList"><div class="skeleton sk-card"></div><div class="skeleton sk-card"></div></div></div>';
  loadBotLog();
}

function loadBotLog() {
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); renderBotLogList(r.data || []); })
    .withFailureHandler(function() { showToast('Gagal memuat log.', 'error'); })
    .getBotLog(STATE.user.spreadsheetId);
}

function renderBotLogList(data) {
  var container = document.getElementById('botlogList');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-terminal-box-line"></i></div><div class="empty-title">Belum ada log</div></div>'; return; }
  container.innerHTML = '<div class="log-timeline stagger-in">' + data.map(function(l) {
    var isErr = l['Tipe'] === 'ERROR';
    var isWarn = l['Tipe'] === 'WARN';
    return '<div class="log-item' + (isErr?' error':isWarn?' warn':'') + '">' +
      '<div class="log-dot ' + (isErr?'error':'ok') + '"></div>' +
      '<div style="flex:1"><div class="log-meta"><span class="badge ' + (isErr?'badge-danger':isWarn?'badge-warning':'badge-success') + '">' + (l['Tipe']||'INFO') + '</span><span style="margin-left:8px">' + tanggalIndo(l['Waktu']) + '</span></div>' +
      '<div class="log-msg">' + (l['Pesan']||'-') + '</div>' +
      (l['Data'] && l['Data'] !== '{}' ? '<div style="font-size:11px;color:var(--text3);margin-top:4px;font-family:monospace">' + l['Data'] + '</div>' : '') +
      '</div></div>';
  }).join('') + '</div>';
}

// ============================================================
// PENGATURAN
// ============================================================
function renderPengaturan() {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-settings-3-line"></i> Pengaturan</div></div><div style="max-width:600px" id="pengaturanContent"><div class="skeleton sk-card"></div></div></div>';
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      var s = r.data || {};
      var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      var pc2 = document.getElementById('pengaturanContent');
      if (!pc2) return;
      pc2.innerHTML = '<div class="card">' +
        '<div class="settings-group"><div class="settings-group-title">Informasi Aplikasi</div>' +
        '<div class="form-group"><label>Nama Aplikasi</label><input type="text" class="form-control" id="sAppName" value="' + (s.app_name||'Money Tracking 2026') + '"></div>' +
        '<div class="form-group"><label>Nama Pemilik/Admin</label><input type="text" class="form-control" id="sOwner" value="' + (s.owner_name||'') + '"></div>' +
        '<div class="form-group"><label>Tahun Default</label><input type="number" class="form-control" id="sTahun" value="' + (s.tahun_default||new Date().getFullYear()) + '"></div>' +
        '<div class="form-group"><label>Mata Uang</label><select class="form-control" id="sCurrency"><option value="IDR"' + (s.mata_uang==='IDR'?' selected':'') + '>IDR - Rupiah</option><option value="USD"' + (s.mata_uang==='USD'?' selected':'') + '>USD - Dollar</option></select></div></div>' +
        '<div class="settings-group"><div class="settings-group-title">Tampilan</div>' +
        '<div class="settings-row"><div><div class="settings-label">Mode Gelap</div><div class="settings-desc">Aktifkan tampilan dark mode</div></div><label class="toggle"><input type="checkbox" id="toggleTheme"' + (isDark?' checked':'') + ' onchange="ubahTheme(this.checked)"><span class="toggle-slider"></span></label></div>' +
        '<div class="settings-row"><div class="settings-label">Warna Aksen</div><div class="color-swatches" id="settingWarna">' +
        ['#00ff99','#00d5ff','#b84cff','#ff4560','#ff9f43','#00d68f','#ffd32a','#ff6b81'].map(function(c) {
          return '<div class="color-swatch' + (c===STATE.warna?' active':'') + '" style="background:' + c + '" data-color="' + c + '" onclick="ubahWarna(\'' + c + '\',this)"></div>';
        }).join('') + '</div></div></div>' +
        '<div style="display:flex;gap:10px;margin-top:8px"><button class="btn btn-primary" onclick="simpanSemuaPengaturan()"><i class="ri-save-line"></i> Simpan Pengaturan</button></div>' +
        '</div>';
    })
    .withFailureHandler(function() { showToast('Gagal memuat pengaturan.', 'error'); })
    .getPengaturan(STATE.user.spreadsheetId);
}

function ubahTheme(isDark) {
  var theme = isDark ? 'dark' : 'light';

  setTheme(theme);

  if (STATE.user) {
    google.script.run.updateProfilUser(STATE.user.username, {
      tema: theme,
      warna: STATE.warna
    });
  }
}

function ubahWarna(warna, el) {
  if (el && el.parentElement) {
    el.parentElement.querySelectorAll('.color-swatch, .accent-color-dot').forEach(function(s) {
      s.classList.remove('active');
    });
    el.classList.add('active');
  }

  setWarna(warna);

  if (STATE.user) {
    google.script.run.updateProfilUser(STATE.user.username, {
      warna: warna,
      tema: STATE.theme
    });
  }

  showToast('Warna aksen diganti.', 'success');
}

function simpanSemuaPengaturan() {
  var settings = [
    ['app_name', document.getElementById('sAppName') ? document.getElementById('sAppName').value : ''],
    ['owner_name', document.getElementById('sOwner') ? document.getElementById('sOwner').value : ''],
    ['tahun_default', document.getElementById('sTahun') ? document.getElementById('sTahun').value : ''],
    ['mata_uang', document.getElementById('sCurrency') ? document.getElementById('sCurrency').value : '']
  ];
  var count = 0;
  settings.forEach(function(s) {
    google.script.run.withSuccessHandler(function() { count++; if (count === settings.length) showToast('Pengaturan berhasil disimpan.', 'success'); }).simpanPengaturan(STATE.user.spreadsheetId, s[0], s[1]);
  });
}

// ============================================================
// SETTING WEB ADMIN
// ============================================================
function renderSettingWeb() {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  if (STATE.user.role !== 'Admin') {
    pc.innerHTML = '<div class="page-content"><div class="empty-state"><div class="empty-icon"><i class="ri-lock-line"></i></div><div class="empty-title">Akses Ditolak</div><div class="empty-desc">Hanya Admin yang bisa mengakses halaman ini.</div></div></div>';
    return;
  }
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-sliders-3-line"></i> Setting Web</div><div class="page-actions"><button class="btn btn-secondary btn-sm btn-refresh" onclick="loadSettingWeb()"><i class="ri-refresh-line"></i> Refresh</button></div></div><div id="settingWebContent"><div class="skeleton sk-card"></div></div></div>';
  loadSettingWeb();
}

function loadSettingWeb() {
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status !== 'success') { showToast(r.pesan || 'Gagal memuat setting web.', 'error'); return; }
      var d = r.data || {};
      var swc = document.getElementById('settingWebContent');
      if (!swc) return;
      swc.innerHTML =
        '<div class="card">' +
        '<div class="form-group"><label>Musik URL</label><input type="text" class="form-control" id="swMusikUrl" value="' + escapeHtmlAttr(d.musik_url || '') + '" placeholder="https://.../musik.mp3"></div>' +
        '<div class="form-group"><label>Musik Global Aktif</label><select class="form-control" id="swMusikAktif"><option value="true" ' + (String(d.musik_global_aktif) === 'true' ? 'selected' : '') + '>Aktif</option><option value="false" ' + (String(d.musik_global_aktif) !== 'true' ? 'selected' : '') + '>Nonaktif</option></select></div>' +
        '<div class="form-group"><label>Pesan Login Aktif</label><select class="form-control" id="swPesanLoginAktif"><option value="true" ' + (String(d.pesan_login_aktif) === 'true' ? 'selected' : '') + '>Aktif</option><option value="false" ' + (String(d.pesan_login_aktif) !== 'true' ? 'selected' : '') + '>Nonaktif</option></select></div>' +
        '<div class="form-group"><label>Isi Pesan Login</label><textarea class="form-control" id="swPesanLoginIsi" rows="4" placeholder="Contoh: Selamat pagi, semoga pagimu cerah.">' + escapeHtmlText(d.pesan_login_isi || '') + '</textarea></div>' +

        '<div class="form-group"><label>URL Foto / GIF Pesan Login</label><input type="text" class="form-control" id="swPesanLoginMediaUrl" value="' + escapeHtmlAttr(d.pesan_login_media_url || '') + '" placeholder="https://.../gambar.gif atau https://.../foto.jpg"></div>' +

        '<div class="form-group"><label>URL Musik Pesan Login</label><input type="text" class="form-control" id="swPesanLoginMusicUrl" value="' + escapeHtmlAttr(d.pesan_login_music_url || '') + '" placeholder="https://.../musik.mp3"></div>' +
        '<div class="form-group"><label>Target Pesan Login</label><select class="form-control" id="swPesanLoginTarget">' +
        '<option value="semua" ' + (d.pesan_login_target === 'semua' ? 'selected' : '') + '>Semua User</option>' +
        '<option value="Admin" ' + (d.pesan_login_target === 'Admin' ? 'selected' : '') + '>Admin</option>' +
        '<option value="UserBisnisPribadi" ' + (d.pesan_login_target === 'UserBisnisPribadi' ? 'selected' : '') + '>UserBisnisPribadi</option>' +
        '<option value="UserPribadi" ' + (d.pesan_login_target === 'UserPribadi' ? 'selected' : '') + '>UserPribadi</option>' +
        '<option value="UserBisnis" ' + (d.pesan_login_target === 'UserBisnis' ? 'selected' : '') + '>UserBisnis</option>' +
        '</select></div>' +
        '<button class="btn btn-primary" onclick="simpanSettingWeb()"><i class="ri-save-line"></i> Simpan Setting Web</button>' +
        '</div>';
    })
    .withFailureHandler(function() { showToast('Gagal memuat setting web.', 'error'); })
    .getSettingWeb();
}

function simpanSettingWeb() {
var data = {
  musik_url: document.getElementById('swMusikUrl').value,
  musik_global_aktif: document.getElementById('swMusikAktif').value,
  pesan_login_aktif: document.getElementById('swPesanLoginAktif').value,
  pesan_login_isi: document.getElementById('swPesanLoginIsi').value,
  pesan_login_media_url: document.getElementById('swPesanLoginMediaUrl').value,
  pesan_login_music_url: document.getElementById('swPesanLoginMusicUrl').value,
  pesan_login_target: document.getElementById('swPesanLoginTarget').value,
  username: STATE.user.username
};
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status === 'success') { MUSIC_URL = data.musik_url || MUSIC_URL; showToast('Setting web berhasil disimpan.', 'success'); }
      else showToast(r.pesan || 'Gagal menyimpan setting web.', 'error');
    })
    .withFailureHandler(function() { showToast('Gagal menyimpan setting web.', 'error'); })
    .simpanSettingWeb(data);
}

// ============================================================
// PROFIL USER
// ============================================================
function renderProfil() {
  var pc = document.getElementById('pageContent');
  if (!pc || !STATE.user) return;
  openProfileDropdown('info');
  pc.innerHTML = '<div class="page-content fade-in"><div class="empty-state"><div class="empty-icon"><i class="ri-user-line"></i></div><div class="empty-title">Profil ada di panel atas</div><div class="empty-desc">Klik avatar atau nama di nav atas untuk membuka informasi akun, keamanan, pengaturan, dan logout.</div></div></div>';
}

function simpanProfil() {
  var data = {
    nama: document.getElementById('profNama') ? document.getElementById('profNama').value : (STATE.user && STATE.user.nama ? STATE.user.nama : ''),
    noWa: document.getElementById('profNoWa') ? document.getElementById('profNoWa').value : (STATE.user && STATE.user.noWa ? STATE.user.noWa : ''),
    passwordBaru: document.getElementById('profPassword') ? document.getElementById('profPassword').value : '',
    tema: STATE.theme,
    warna: STATE.warna
  };
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status === 'success') {
        STATE.user.nama = data.nama;
        STATE.user.noWa = String(data.noWa || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
        sessionStorage.setItem('mt_user', JSON.stringify(STATE.user));
        var tn = document.getElementById('topbarNama');
        if (tn) tn.textContent = data.nama;
        renderProfileDropdown(document.getElementById('profPassword') ? 'keamanan' : 'info');
        showToast(r.pesan, 'success');
      } else showToast(r.pesan, 'error');
    })
    .withFailureHandler(function() { showToast('Gagal menyimpan profil.', 'error'); })
    .updateProfilUser(STATE.user.username, data);
}

// ============================================================
// KELOLA USER (Admin)
// ============================================================
// ============================================================
// ADMIN CENTER
// ============================================================
// ============================================================
// ADMIN CENTER
// ============================================================
function renderAdminSetting() {
  var content = document.getElementById('pageContent');

  if (!content) return;

  if (!STATE.user || STATE.user.role !== 'Admin') {
    content.innerHTML = [
      '<div class="page-content">',
        '<div class="empty-state">',
          '<div class="empty-icon"><i class="ri-lock-line"></i></div>',
          '<div class="empty-title">Akses Ditolak</div>',
          '<div class="empty-desc">Hanya Admin yang bisa mengakses halaman ini.</div>',
        '</div>',
      '</div>'
    ].join('');

    return;
  }

  content.innerHTML = [
    '<div class="page-content fade-in">',
      '<div class="page-header">',
        '<div class="page-title"><i class="ri-shield-user-line"></i> Admin Center</div>',
      '</div>',

      '<div class="grid-2 stagger-in">',

        '<div class="card admin-center-card" onclick="navigateTo(&quot;kelolausers&quot;)">',
          '<div class="admin-center-icon"><i class="ri-shield-user-line"></i></div>',
          '<div class="admin-center-info">',
            '<div class="admin-center-title">Kelola User</div>',
            '<div class="admin-center-desc">Atur akun, role, status, spreadsheet, langganan, dan mode akses user.</div>',
          '</div>',
          '<div class="admin-center-arrow"><i class="ri-arrow-right-line"></i></div>',
        '</div>',

        '<div class="card admin-center-card" onclick="navigateTo(&quot;settingweb&quot;)">',
          '<div class="admin-center-icon"><i class="ri-shield-user-line"></i></div>',
          '<div class="admin-center-info">',
            '<div class="admin-center-title">Setting Web</div>',
            '<div class="admin-center-desc">Atur musik, pesan login, target notifikasi, dan konfigurasi global.</div>',
          '</div>',
          '<div class="admin-center-arrow"><i class="ri-arrow-right-line"></i></div>',
        '</div>',

      '</div>',
    '</div>'
  ].join('');
}

var _allUsers = [];

function renderKelolaUser() {
  var pc = document.getElementById('pageContent');
  if (!pc) return;
  if (STATE.user.role !== 'Admin') {
    pc.innerHTML = '<div class="page-content"><div class="empty-state"><div class="empty-icon"><i class="ri-lock-line"></i></div><div class="empty-title">Akses Ditolak</div><div class="empty-desc">Hanya Admin yang bisa mengakses halaman ini.</div></div></div>';
    return;
  }
  pc.innerHTML = '<div class="page-content fade-in"><div class="page-header"><div class="page-title"><i class="ri-shield-user-line"></i> Kelola User</div><div class="page-actions"><button class="btn btn-primary" onclick="modalTambahUser()"><i class="ri-user-add-line"></i> Tambah User</button><button class="btn btn-secondary btn-sm btn-refresh" onclick="loadUsers()"><i class="ri-refresh-line"></i></button></div></div><div id="userList"></div></div>';
  loadUsers();
}

function loadUsers() {
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); _allUsers = r.data || []; renderUserList(_allUsers); })
    .withFailureHandler(function() { showToast('Gagal memuat.', 'error'); })
    .getDaftarUser();
}

function renderUserList(data) {
  var container = document.getElementById('userList');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-group-line"></i></div><div class="empty-title">Belum ada user</div></div>'; return; }
  var isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    container.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px">' + data.map(function(u) {
      var avatarHtml = u.fotoProfil
        ? '<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid var(--border2)"><img src="' + u.fotoProfil + '" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML=\'<div style=&quot;width:40px;height:40px;border-radius:50%;background:var(--neon);color:#000;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700&quot;>' + getInitial(u.nama) + '</div>\'"></div>'
        : '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--neon),var(--neon2));color:#000;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">' + getInitial(u.nama) + '</div>';
      var sl = u.statusLangganan || '';
      var badgeLangganan = sl === 'Aktif' || sl === 'Unlimited' ? '<span class="badge badge-success">' + sl + '</span>' :
        sl === 'Akan Habis' || sl === 'Grace Period' ? '<span class="badge badge-warning">' + sl + '</span>' :
        sl === 'Habis' ? '<span class="badge badge-danger">Habis</span>' : '<span class="badge" style="background:var(--surface2);color:var(--text3)">—</span>';
      var modeAkses = u.modeAkses || 'Normal';
      return '<div class="card"><div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">' + avatarHtml +
        '<div><div style="font-weight:600;font-size:14px">' + u.nama + '</div><div style="font-size:11px;color:var(--text3)">@' + u.username + '</div>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:2px">WA: ' + escapeHtmlText(u.noWa || '-') + '</div>' +
        '<span class="badge ' + (u.role==='Admin'?'badge-neon':'badge-info') + '" style="margin-top:4px">' + u.role + '</span></div></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">' + badgeLangganan +
        '<span class="badge ' + (u.status==='Aktif'?'badge-success':'badge-danger') + '">' + u.status + '</span>' +
        '<span class="badge ' + (modeAkses==='ReadOnly'?'badge-danger':'badge-success') + '">' + modeAkses + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:6px">' +
        '<button class="btn btn-info btn-sm" onclick="modalEditUser(\'' + u.id + '\')"><i class="ri-edit-line"></i> Edit</button>' +
        '<button class="btn btn-primary btn-sm" onclick="modalAturLangganan(\'' + u.id + '\',\'' + u.nama + '\')"><i class="ri-calendar-check-line"></i></button>' +
        (u.status === 'Aktif' ? '<button class="btn btn-danger btn-sm" onclick="nonaktifkanUserConfirm(\'' + u.id + '\')"><i class="ri-user-unfollow-line"></i></button>' : '') +
        '</div></div>';
    }).join('') + '</div>';
  } else {
    container.innerHTML = '<div class="card table-wrap"><table class="data-table"><thead><tr><th>User</th><th>Role</th><th>Langganan</th><th>Status</th><th>Akses</th><th>Aksi</th></tr></thead><tbody>' +
      data.map(function(u) {
        var avatarHtml = u.fotoProfil
          ? '<div style="width:34px;height:34px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid var(--border2)"><img src="' + u.fotoProfil + '" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML=\'<div style=&quot;width:34px;height:34px;border-radius:50%;background:var(--neon);color:#000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700&quot;>' + getInitial(u.nama) + '</div>\'"></div>'
          : '<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--neon),var(--neon2));color:#000;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">' + getInitial(u.nama) + '</div>';
        var sl = u.statusLangganan || '';
        var badgeLangganan = sl === 'Aktif' || sl === 'Unlimited' ? '<span class="badge badge-success">' + (sl||'Aktif') + '</span>' :
          sl === 'Akan Habis' || sl === 'Grace Period' ? '<span class="badge badge-warning">' + sl + '</span>' :
          sl === 'Habis' ? '<span class="badge badge-danger">Habis</span>' : '<span class="badge" style="background:var(--surface2);color:var(--text3)">—</span>';
        var modeAkses = u.modeAkses || 'Normal';
        return '<tr>' +
          '<td><div style="display:flex;align-items:center;gap:10px">' + avatarHtml +
          '<div><div style="font-weight:600;font-size:13px">' + u.nama + '</div><div style="font-size:11px;color:var(--text3)">@' + u.username + '</div><div style="font-size:11px;color:var(--text3)">WA: ' + escapeHtmlText(u.noWa || '-') + '</div></div></div></td>' +
          '<td><span class="badge ' + (u.role==='Admin'?'badge-neon':'badge-info') + '">' + u.role + '</span></td>' +
          '<td>' + badgeLangganan + (u.berakhirLangganan ? '<div style="font-size:10px;color:var(--text3);margin-top:3px">s/d ' + u.berakhirLangganan + '</div>' : '') + '</td>' +
          '<td><span class="badge ' + (u.status==='Aktif'?'badge-success':'badge-danger') + '">' + u.status + '</span></td>' +
          '<td><span class="badge ' + (modeAkses==='ReadOnly'?'badge-danger':'badge-success') + '">' + modeAkses + '</span></td>' +
          '<td><div class="actions">' +
          '<button class="btn btn-info btn-icon btn-sm" onclick="modalEditUser(\'' + u.id + '\')"><i class="ri-edit-line"></i></button>' +
          '<button class="btn btn-primary btn-icon btn-sm" title="Atur Langganan" onclick="modalAturLangganan(\'' + u.id + '\',\'' + u.nama + '\')"><i class="ri-calendar-check-line"></i></button>' +
          (u.status === 'Aktif' ? '<button class="btn btn-danger btn-icon btn-sm" onclick="nonaktifkanUserConfirm(\'' + u.id + '\')"><i class="ri-user-unfollow-line"></i></button>' : '') +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
}

function modalTambahUser() {
  openModal('Tambah User',
    '<div class="form-row"><div class="form-group"><label>Nama *</label><input type="text" class="form-control" id="uNama" placeholder="Nama lengkap"></div><div class="form-group"><label>Username *</label><input type="text" class="form-control" id="uUsername" placeholder="username"></div></div>' +
    '<div class="form-row"><div class="form-group"><label>Password *</label><input type="password" class="form-control" id="uPassword" placeholder="Min. 3 karakter"></div><div class="form-group"><label>Role</label><select class="form-control" id="uRole"><option value="UserPribadi">UserPribadi</option><option value="UserBisnis">UserBisnis</option><option value="UserBisnisPribadi">UserBisnisPribadi</option><option value="Admin">Admin</option></select></div></div>' +
    '<div class="form-group"><label>Nomor WA untuk Bot</label><input type="tel" class="form-control" id="uNoWa" placeholder="62812xxxx"></div>' +
    '<div class="form-group"><label>Spreadsheet ID *</label><input type="text" class="form-control" id="uSpreadsheet" placeholder="ID Google Spreadsheet"></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="simpanUser()"><i class="ri-save-line"></i> Simpan</button>'
  );
}

function simpanUser() {
  var data = { nama: document.getElementById('uNama').value, username: document.getElementById('uUsername').value, password: document.getElementById('uPassword').value, role: document.getElementById('uRole').value, noWa: document.getElementById('uNoWa').value, spreadsheetId: document.getElementById('uSpreadsheet').value };
  if (!data.nama || !data.username || !data.password || !data.spreadsheetId) { showToast('Semua field wajib diisi.', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); loadUsers(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal menyimpan.', 'error'); })
    .tambahUser(data);
}

var _editUserId = null;
function modalEditUser(id) {
  _editUserId = id;
  var u = _allUsers.find(function(x) { return x.id === id; });
  if (!u) return;
  openModal('Edit User',
    '<div class="form-row"><div class="form-group"><label>Nama</label><input type="text" class="form-control" id="euNama" value="' + (u.nama||'') + '"></div><div class="form-group"><label>Role</label><select class="form-control" id="euRole"><option value="UserPribadi"' + (u.role==='UserPribadi'?' selected':'') + '>UserPribadi</option><option value="UserBisnis"' + (u.role==='UserBisnis'?' selected':'') + '>UserBisnis</option><option value="UserBisnisPribadi"' + (u.role==='UserBisnisPribadi'?' selected':'') + '>UserBisnisPribadi</option><option value="Admin"' + (u.role==='Admin'?' selected':'') + '>Admin</option></select></div></div>' +
    '<div class="form-group"><label>Password Baru</label><input type="password" class="form-control" id="euPassword" placeholder="Kosongkan jika tidak diganti"></div>' +
    '<div class="form-group"><label>Nomor WA untuk Bot</label><input type="tel" class="form-control" id="euNoWa" value="' + escapeHtmlAttr(u.noWa || '') + '" placeholder="62812xxxx"></div>' +
    '<div class="form-group"><label>Spreadsheet ID</label><input type="text" class="form-control" id="euSpreadsheet" value="' + (u.spreadsheetId||'') + '"></div>' +
    '<div class="form-group"><label>Status</label><select class="form-control" id="euStatus"><option' + (u.status==='Aktif'?' selected':'') + '>Aktif</option><option' + (u.status==='Nonaktif'?' selected':'') + '>Nonaktif</option></select></div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button><button class="btn btn-primary" onclick="updateUser()"><i class="ri-save-line"></i> Update</button>'
  );
}

function updateUser() {
  var pw = document.getElementById('euPassword') ? document.getElementById('euPassword').value : '';
  var data = { nama: document.getElementById('euNama').value, role: document.getElementById('euRole').value, noWa: document.getElementById('euNoWa').value, spreadsheetId: document.getElementById('euSpreadsheet').value, status: document.getElementById('euStatus').value };
  if (pw) data.password = pw;
  google.script.run
    .withSuccessHandler(function(res) { var r = JSON.parse(res); if (r.status === 'success') { closeModalDirect(); showToast(r.pesan, 'success'); loadUsers(); } else showToast(r.pesan, 'error'); })
    .withFailureHandler(function() { showToast('Gagal mengupdate.', 'error'); })
    .editUser(_editUserId, data);
}

function nonaktifkanUserConfirm(id) {
  swalFire({ title: 'Nonaktifkan User?', text: 'User tidak akan bisa login.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Nonaktifkan', cancelButtonText: 'Batal' })
    .then(function(r) {
      if (r.isConfirmed) {
        google.script.run
          .withSuccessHandler(function(res) { var rr = JSON.parse(res); if (rr.status === 'success') { showToast(rr.pesan, 'success'); loadUsers(); } else showToast(rr.pesan, 'error'); })
          .withFailureHandler(function() { showToast('Gagal.', 'error'); })
          .nonaktifkanUser(id);
      }
    });
}

var _langgananUserId = null;

function modalAturLangganan(userId, namaPengguna) {
  _langgananUserId = userId;
  var today = new Date().toISOString().split('T')[0];
  openModal('Atur Langganan — ' + namaPengguna,
    '<div class="form-group"><label>Tipe Langganan</label><select class="form-control" id="llTipe">' +
    ['1 bulan','3 bulan','6 bulan','1 tahun','Unlimited'].map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
    '</select></div>' +
    '<div class="form-group"><label>Mulai Langganan</label><input type="date" class="form-control" id="llMulai" value="' + today + '"></div>' +
    '<div class="form-group"><label>Mode Akses</label><select class="form-control" id="llMode"><option value="Normal">Normal</option><option value="ReadOnly">ReadOnly</option></select></div>' +
    '<div class="form-group"><label>Catatan</label><input type="text" class="form-control" id="llCatatan" placeholder="Opsional..."></div>' +
    '<div style="background:rgba(255,255,255,0.03);border-radius:9px;padding:12px;font-size:12px;color:var(--text3);margin-top:4px;border:1px solid var(--border)">' +
    '<i class="ri-information-line" style="color:var(--neon2)"></i> Grace period otomatis +15 hari setelah berakhir. Jika Unlimited, user tidak pernah expired.' +
    '</div>',
    '<button class="btn btn-secondary" onclick="closeModalDirect()">Batal</button>' +
    '<button class="btn btn-primary" onclick="simpanAturLangganan()"><i class="ri-calendar-check-line"></i> Simpan Langganan</button>'
  );
}

function simpanAturLangganan() {
  if (!_langgananUserId) return;
  var data = {
    tipeLangganan: document.getElementById('llTipe') ? document.getElementById('llTipe').value : '1 bulan',
    mulaiLangganan: document.getElementById('llMulai') ? document.getElementById('llMulai').value : '',
    modeAkses: document.getElementById('llMode') ? document.getElementById('llMode').value : 'Normal',
    catatan: document.getElementById('llCatatan') ? document.getElementById('llCatatan').value : ''
  };
  google.script.run
    .withSuccessHandler(function(res) {
      var r = JSON.parse(res);
      if (r.status === 'success') { closeModalDirect(); showToast('Langganan berhasil diperbarui.', 'success'); loadUsers(); }
      else showToast(r.pesan || 'Gagal menyimpan.', 'error');
    })
    .withFailureHandler(function() { showToast('Gagal menyimpan langganan.', 'error'); })
    .aturLanggananUser(_langgananUserId, data);
}


// ============================================================
// RESPONSIVE PATCH FINAL — MOBILE CARD & BREAKPOINT GUARD
// Ditempel di bawah supaya override fungsi lama tanpa merusak backend.
// ============================================================
function mtIsMobileView() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function mtText(value) {
  if (typeof escapeHtmlText === 'function') return escapeHtmlText(value);
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mtAttr(value) {
  if (typeof escapeHtmlAttr === 'function') return escapeHtmlAttr(value);
  return mtText(value).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function mtJsArg(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function mtBadgeStatusPembayaran(status) {
  if (status === 'Diterima' || status === 'Lunas') return 'badge-success';
  if (status === 'Ditolak' || status === 'Batal') return 'badge-danger';
  if (status === 'Menunggu Verifikasi' || status === 'Menunggu Pembayaran' || status === 'Menunggu') return 'badge-warning';
  if (status === 'Pending' || status === 'Belum Lunas') return 'badge-neon';
  return 'badge-neon';
}

function mtPembayaranButuhAksi(status) {
  return ['Menunggu', 'Menunggu Pembayaran', 'Menunggu Verifikasi', 'Pending', 'Belum Lunas'].includes(status || 'Menunggu');
}

// Pembayaran: di HP jangan table panjang. Jadikan card, karena layar kecil bukan spreadsheet mini, ya ampun.
function renderPembayaranList(data) {
  var container = document.getElementById('pembayaranList');
  if (!container) return;

  data = data || [];

  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-secure-payment-line"></i></div><div class="empty-title">Belum ada pembayaran</div></div>';
    return;
  }

  if (mtIsMobileView()) {
    container.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px" class="stagger-in">' +
      data.map(function(p) {
        var id = mtJsArg(p['ID']);
        var status = p['Status'] || 'Menunggu';
        var invoice = p['Invoice ID'] || '';
        var nomorWa = p['Nomor WA'] || '';
        var aksi = mtPembayaranButuhAksi(status)
          ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">' +
              '<button class="btn btn-primary btn-sm" onclick="verifikasiPembayaranAction(\'' + id + '\',\'Lunas\')"><i class="ri-check-line"></i> Lunas</button>' +
              '<button class="btn btn-danger btn-sm" onclick="verifikasiPembayaranAction(\'' + id + '\',\'Ditolak\')"><i class="ri-close-line"></i> Tolak</button>' +
            '</div>'
          : '<div style="font-size:12px;color:var(--text3);margin-top:10px">Selesai</div>';

        return '<div class="card">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px">' +
            '<div style="min-width:0">' +
              '<div style="font-weight:700;font-size:14px;color:var(--text)">' + mtText(p['Pelanggan ID'] || 'Tanpa pelanggan') + '</div>' +
              '<div style="font-size:11px;color:var(--text3);margin-top:3px">' + tanggalIndo(p['Created At']) + ' &bull; ' + mtText(p['Metode'] || '-') + '</div>' +
              (invoice || nomorWa ? '<div style="font-size:11px;color:var(--text3);margin-top:3px">' + mtText(invoice || '-') + (nomorWa ? ' &bull; WA ' + mtText(nomorWa) : '') + '</div>' : '') +
            '</div>' +
            '<span class="badge ' + mtBadgeStatusPembayaran(status) + '">' + mtText(status) + '</span>' +
          '</div>' +
          '<div style="font-family:var(--font-display);font-size:19px;font-weight:800;color:var(--neon)">' + rupiah(p['Jumlah']) + '</div>' +
          aksi +
        '</div>';
      }).join('') +
    '</div>';
    return;
  }

  container.innerHTML = '<div class="card table-wrap"><table class="data-table"><thead><tr><th>Waktu</th><th>Pelanggan</th><th>Jumlah</th><th>Metode</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
    data.map(function(p) {
      var id = mtJsArg(p['ID']);
      var status = p['Status'] || 'Menunggu';
      var invoice = p['Invoice ID'] || '';
      var nomorWa = p['Nomor WA'] || '';
      var pelanggan = mtText(p['Pelanggan ID'] || '-');
      if (invoice || nomorWa) {
        pelanggan += '<div style="font-size:11px;color:var(--text3);margin-top:3px">' + mtText(invoice || '-') + (nomorWa ? ' &bull; WA ' + mtText(nomorWa) : '') + '</div>';
      }
      return '<tr><td>' + tanggalIndo(p['Created At']) + '</td><td>' + pelanggan + '</td><td style="font-weight:700;color:var(--neon)">' + rupiah(p['Jumlah']) + '</td><td>' + mtText(p['Metode'] || '-') + '</td><td><span class="badge ' + mtBadgeStatusPembayaran(status) + '">' + mtText(status) + '</span></td>' +
        '<td>' + (mtPembayaranButuhAksi(status)
          ? '<div class="actions"><button class="btn btn-primary btn-sm" onclick="verifikasiPembayaranAction(\'' + id + '\',\'Lunas\')"><i class="ri-check-line"></i> Lunas</button><button class="btn btn-danger btn-sm" onclick="verifikasiPembayaranAction(\'' + id + '\',\'Ditolak\')"><i class="ri-close-line"></i> Tolak</button></div>'
          : '<span style="color:var(--text3);font-size:12px">Selesai</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}

// Resize guard: kalau ukuran layar pindah desktop/tablet/HP di DevTools, list ikut bentuk baru tanpa reload manual.
(function setupResponsiveRerenderGuard() {
  var lastMobile = mtIsMobileView();
  var timer = null;

  window.addEventListener('resize', function() {
    clearTimeout(timer);
    timer = setTimeout(function() {
      var nowMobile = mtIsMobileView();
      if (nowMobile === lastMobile) return;
      lastMobile = nowMobile;

      if (!STATE || !STATE.currentPage) return;

      if (STATE.currentPage === 'transaksi' && typeof renderTxnList === 'function') {
        renderTxnList(_allTxn || []);
      }

      if (STATE.currentPage === 'pembayaran' && typeof renderPembayaranList === 'function') {
        renderPembayaranList(_allPembayaran || []);
      }

      if (STATE.currentPage === 'kelolausers' && typeof renderUserList === 'function') {
        renderUserList(_allUsers || []);
      }
    }, 180);
  });
})();
