(function() {
  'use strict';

  var SUPABASE_URL = 'https://hqgdifxecxrxhjsbavkl.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_4-UBFcXGsiLjHINRAfydTQ_lCVzE9OM';

  var _supabase = null;
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        storageKey: 'a1_booking_auth',
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }

  /* ── Phone → Email hack ── */
  function phoneToEmail(phone) {
    return phone.replace(/[^0-9]/g, '') + '@a1.com';
  }

  /* ── Sign Up (phone + password) ── */
  async function signUp(phone, password, profile) {
    try {
      if (!_supabase) throw new Error('Supabase SDK not loaded yet');
      var email = phoneToEmail(phone);
      var result = await _supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { phone: phone, full_name: profile.full_name || '' }
        }
      });
      if (result.error) throw result.error;

      if (result.data && result.data.user) {
        var userId = result.data.user.id;
        var ownerPayload = {
          auth_user_id: userId,
          phone: phone,
          name: profile.full_name || '',
          whatsapp: profile.whatsapp || phone,
          location: profile.location || ''
        };
        var ownerRes = await _supabase.from('owners').insert(ownerPayload).select('owner_id').single();
        if (ownerRes.error) console.error('[Auth] Owner insert failed:', ownerRes.error);
        if (ownerRes.data) {
          var dogPayload = {
            owner_id: ownerRes.data.owner_id,
            dog_name: profile.dog_name || '',
            dog_breed: profile.dog_breed || '',
            dog_age: profile.dog_age || '',
            dog_gender: profile.dog_gender || '',
            sickness: profile.sickness || '',
            vaccination: profile.vaccination || '',
            deworming: profile.deworming || '',
            allergy: profile.allergy || '',
            temperament: profile.temperament || '',
            behavioral_issues: profile.behavioral_issues || ''
          };
          var dogRes = await _supabase.from('dogs').insert(dogPayload);
          if (dogRes.error) console.error('[Auth] Dog insert failed:', dogRes.error);
        }
      }
      return { success: true, user: result.data.user, session: result.data.session };
    } catch (e) {
      console.error('[Auth] signUp error:', e.message || e);
      return { success: false, error: e.message || 'Sign-up failed' };
    }
  }

  /* ── Sign In (phone + password) ── */
  async function signIn(phone, password) {
    try {
      if (!_supabase) throw new Error('Supabase SDK not loaded yet');
      var email = phoneToEmail(phone);
      var result = await _supabase.auth.signInWithPassword({ email: email, password: password });
      if (result.error) throw result.error;
      return { success: true, user: result.data.user, session: result.data.session };
    } catch (e) {
      console.error('[Auth] signIn error:', e.message || e);
      return { success: false, error: e.message || 'Login failed' };
    }
  }

  /* ── Sign Out ── */
  async function signOut() {
    try {
      if (!_supabase) return { success: true };
      var result = await _supabase.auth.signOut();
      if (result && result.error) throw result.error;
      localStorage.removeItem('a1_booking_auth');
      return { success: true };
    } catch (e) {
      console.error('[Auth] signOut error:', e.message || e);
      return { success: false, error: e.message || 'Sign-out failed' };
    }
  }

  /* ── Get Session with 24h timeout ── */
  async function getSession() {
    try {
      if (!_supabase) return null;
      var result = await _supabase.auth.getSession();
      var session = result.data && result.data.session ? result.data.session : null;
      if (session) {
        var createdAt = new Date(session.created_at).getTime();
        if (Date.now() - createdAt > 24 * 60 * 60 * 1000) {
          console.warn('[Auth] Session expired (>24h)');
          await _supabase.auth.signOut();
          localStorage.removeItem('a1_booking_auth');
          return null;
        }
      }
      return session;
    } catch (e) {
      console.error('[Auth] getSession error:', e);
      return null;
    }
  }

  /* ── Get current user ── */
  async function getCurrentUser() {
    try {
      if (!_supabase) return null;
      var result = await _supabase.auth.getUser();
      if (result.error) throw result.error;
      return result.data ? result.data.user : null;
    } catch (e) {
      console.error('[Auth] getUser error:', e);
      return null;
    }
  }

  /* ── Extract phone from auth email ── */
  function getPhoneFromUser(user) {
    if (!user || !user.email) return '';
    return user.email.replace('@a1.com', '');
  }

  /* ── Auth state listener ── */
  function onAuthStateChange(callback) {
    if (!_supabase) return { unsubscribe: function() {} };
    return _supabase.auth.onAuthStateChange(callback);
  }

  /* ── Auth Modal ── */
  var _authCallback = null;

  function injectAuthStyles() {
    if (document.getElementById('authStyles')) return;
    var s = document.createElement('style');
    s.id = 'authStyles';
    s.textContent = '.auth-overlay{position:fixed;inset:0;z-index:3000;background:rgba(26,20,18,.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:24px}.auth-overlay.open{display:flex}.auth-modal{background:rgba(255,255,255,.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.25);border-radius:28px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;padding:32px 28px;animation:modalIn .3s ease;box-shadow:0 20px 60px rgba(0,0,0,.15);position:relative}.auth-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--muted);transition:color .3s;line-height:1}.auth-close:hover{color:var(--charcoal)}.auth-tabs{display:flex;gap:0;margin-bottom:20px;border-bottom:1px solid var(--border)}.auth-tab{padding:10px 20px;cursor:pointer;font-weight:600;font-size:.85rem;color:var(--muted);background:none;border:none;border-bottom:2px solid transparent;transition:all .3s;font-family:inherit}.auth-tab.active{color:var(--charcoal);border-bottom-color:var(--gold)}.auth-form{display:none}.auth-form.active{display:block}.auth-form h3{font-family:\'Playfair Display\',serif;font-size:1.2rem;font-weight:800;margin-bottom:4px}.auth-sub{font-size:.8rem;color:var(--muted);margin-bottom:16px}.auth-field{margin-bottom:12px}.auth-field label{display:block;font-size:.78rem;font-weight:600;color:var(--charcoal);margin-bottom:4px}.auth-field input,.auth-field select,.auth-field textarea{width:100%;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.5);backdrop-filter:blur(8px);font-family:\'Inter\',sans-serif;font-size:.85rem;color:var(--charcoal);outline:none;transition:border-color .3s;box-sizing:border-box}.auth-field input:focus,.auth-field select:focus,.auth-field textarea:focus{border-color:var(--gold)}.auth-field textarea{resize:vertical;min-height:50px}.auth-row{display:flex;gap:10px}.auth-row .auth-field{flex:1}.auth-btn{width:100%;padding:12px;border-radius:60px;border:none;background:var(--gold);color:var(--charcoal);font-family:\'Inter\',sans-serif;font-weight:700;font-size:.9rem;cursor:pointer;transition:background .3s,transform .2s;margin-top:8px}.auth-btn:hover{background:var(--gold-dark);transform:translateY(-2px)}.auth-btn:active{transform:scale(.97)}.auth-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}.auth-error{font-size:.78rem;color:#d32f2f;margin:8px 0;min-height:0}';
    document.head.appendChild(s);
  }

  function injectAuthModal() {
    if (document.getElementById('authModalOverlay')) return;
    var div = document.createElement('div');
    div.innerHTML =
      '<div class="auth-overlay" id="authModalOverlay">' +
        '<div class="auth-modal">' +
          '<button class="auth-close" id="authClose">&times;</button>' +
          '<div class="auth-tabs">' +
            '<button class="auth-tab active" data-tab="login">Login</button>' +
            '<button class="auth-tab" data-tab="signup">Sign Up</button>' +
          '</div>' +
          '<form id="authLoginForm" class="auth-form active">' +
            '<h3>Welcome Back</h3>' +
            '<p class="auth-sub">Login to book your service.</p>' +
            '<div class="auth-field"><label>Phone Number</label><input type="tel" id="authLoginPhone" required placeholder="9876543210"></div>' +
            '<div class="auth-field"><label>Password</label><input type="password" id="authLoginPassword" required></div>' +
            '<div class="auth-error" id="authLoginError"></div>' +
            '<button type="submit" class="auth-btn">Login</button>' +
          '</form>' +
          '<form id="authSignupForm" class="auth-form">' +
            '<h3>Create Account</h3>' +
            '<p class="auth-sub">Register to book services seamlessly.</p>' +
            '<div class="auth-field"><label>Phone Number</label><input type="tel" id="authSignupPhone" required placeholder="9876543210"></div>' +
            '<div class="auth-field"><label>Password</label><input type="password" id="authSignupPassword" required minlength="6"></div>' +
            '<div class="auth-field"><label>Full Name</label><input type="text" id="authSignupName" required></div>' +
            '<div class="auth-field"><label>WhatsApp Number</label><input type="tel" id="authSignupWhatsApp" placeholder="Same as phone if blank"></div>' +
            '<div class="auth-field"><label>Location</label><input type="text" id="authSignupLocation" placeholder="Your area in Shillong"></div>' +
            '<h4 style="margin:16px 0 8px;font-size:.85rem">Your Dog\'s Details</h4>' +
            '<div class="auth-row"><div class="auth-field"><label>Dog Name</label><input type="text" id="authSignupDogName" required></div><div class="auth-field"><label>Breed</label><input type="text" id="authSignupBreed" required></div></div>' +
            '<div class="auth-row"><div class="auth-field"><label>Age</label><input type="text" id="authSignupAge" placeholder="e.g. 2 years"></div><div class="auth-field"><label>Gender</label><select id="authSignupGender"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div></div>' +
            '<div class="auth-field"><label>Sickness / Medical Conditions</label><input type="text" id="authSignupSickness" placeholder="None, or describe"></div>' +
            '<div class="auth-row"><div class="auth-field"><label>Vaccinated?</label><select id="authSignupVaccination"><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select></div><div class="auth-field"><label>Deworming (3mo)?</label><select id="authSignupDeworming"><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select></div></div>' +
            '<div class="auth-field"><label>Allergies</label><input type="text" id="authSignupAllergy" placeholder="None, or list"></div>' +
            '<div class="auth-field"><label>Temperament</label><select id="authSignupTemperament"><option value="">Select</option><option value="Friendly">Friendly</option><option value="Shy">Shy</option><option value="Energetic">Energetic</option><option value="Aggressive">Aggressive</option><option value="Anxious">Anxious</option><option value="Calm">Calm</option></select></div>' +
            '<div class="auth-field"><label>Behavioral Issues</label><textarea id="authSignupBehavioral" placeholder="Describe any issues..."></textarea></div>' +
            '<div class="auth-error" id="authSignupError"></div>' +
            '<button type="submit" class="auth-btn">Create Account &amp; Continue</button>' +
          '</form>' +
        '</div>' +
      '</div>';
    document.body.appendChild(div.firstElementChild);
    wireAuthModal();
  }

  function wireAuthModal() {
    document.getElementById('authClose').addEventListener('click', hideAuthModal);
    document.getElementById('authModalOverlay').addEventListener('click', function(e) {
      if (e.target === this) hideAuthModal();
    });
    document.querySelectorAll('.auth-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(function(f) { f.classList.remove('active'); });
        var formId = 'auth' + this.dataset.tab.charAt(0).toUpperCase() + this.dataset.tab.slice(1) + 'Form';
        document.getElementById(formId).classList.add('active');
      });
    });
    document.getElementById('authLoginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var phone = document.getElementById('authLoginPhone').value.trim();
      var password = document.getElementById('authLoginPassword').value;
      document.getElementById('authLoginError').textContent = '';
      var btn = this.querySelector('.auth-btn');
      btn.textContent = 'Logging in...'; btn.disabled = true;
      var result = await signIn(phone, password);
      btn.textContent = 'Login'; btn.disabled = false;
      if (!result.success) {
        document.getElementById('authLoginError').textContent = result.error || 'Login failed';
        return;
      }
      hideAuthModal();
      if (_authCallback) { var cb = _authCallback; _authCallback = null; cb(); }
    });
    document.getElementById('authSignupForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var phone = document.getElementById('authSignupPhone').value.trim();
      if (!phone) { document.getElementById('authSignupError').textContent = 'Phone is required'; return; }
      var password = document.getElementById('authSignupPassword').value;
      if (password.length < 6) { document.getElementById('authSignupError').textContent = 'Password must be 6+ characters'; return; }
      var profile = {
        full_name: document.getElementById('authSignupName').value.trim(),
        whatsapp: document.getElementById('authSignupWhatsApp').value.trim(),
        location: document.getElementById('authSignupLocation').value.trim(),
        dog_name: document.getElementById('authSignupDogName').value.trim(),
        dog_breed: document.getElementById('authSignupBreed').value.trim(),
        dog_age: document.getElementById('authSignupAge').value.trim(),
        dog_gender: document.getElementById('authSignupGender').value,
        sickness: document.getElementById('authSignupSickness').value.trim(),
        vaccination: document.getElementById('authSignupVaccination').value,
        deworming: document.getElementById('authSignupDeworming').value,
        allergy: document.getElementById('authSignupAllergy').value.trim(),
        temperament: document.getElementById('authSignupTemperament').value,
        behavioral_issues: document.getElementById('authSignupBehavioral').value.trim()
      };
      document.getElementById('authSignupError').textContent = '';
      var btn = this.querySelector('.auth-btn');
      btn.textContent = 'Creating account...'; btn.disabled = true;
      var result = await signUp(phone, password, profile);
      btn.textContent = 'Create Account & Continue'; btn.disabled = false;
      if (!result.success) {
        document.getElementById('authSignupError').textContent = result.error || 'Sign-up failed';
        return;
      }
      hideAuthModal();
      if (_authCallback) { var cb2 = _authCallback; _authCallback = null; cb2(); }
    });
  }

  function showAuthModal(callback) {
    _authCallback = callback || null;
    injectAuthStyles();
    injectAuthModal();
    var overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.classList.add('open');
  }

  function hideAuthModal() {
    var overlay = document.getElementById('authModalOverlay');
    if (overlay) overlay.classList.remove('open');
    _authCallback = null;
  }

  /* ── Auth gate: run callback only if logged in ── */
  async function requireAuth(callback) {
    var session = await getSession();
    if (session) {
      callback();
    } else {
      showAuthModal(callback);
    }
  }

  /* ── Logout button UI ── */
  async function updateNavUI() {
    var session = await getSession();
    var desktopBtn = document.getElementById('navLogoutBtn');
    var mobileBtn = document.getElementById('mobileLogoutBtn');
    var display = session ? '' : 'none';
    if (desktopBtn) desktopBtn.style.display = display;
    if (mobileBtn) mobileBtn.style.display = display;
  }

  async function handleLogout(e) {
    if (e) e.preventDefault();
    await signOut();
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  }

  function wireLogout() {
    var desktopBtn = document.getElementById('navLogoutBtn');
    var mobileBtn = document.getElementById('mobileLogoutBtn');
    if (desktopBtn) desktopBtn.addEventListener('click', handleLogout);
    if (mobileBtn) mobileBtn.addEventListener('click', handleLogout);
  }

  /* ── Auto-init on DOM ready ── */
  function init() {
    injectAuthStyles();
    injectAuthModal();
    updateNavUI();
    wireLogout();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Legacy admin auth (unchanged) ── */
  var SESSION_KEY = 'a1_admin_session';
  var LOCKOUT_KEY = 'a1_admin_lockout';
  var MAX_ATTEMPTS = 5;

  function generateToken() {
    var arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function isAuthenticated() {
    var raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      return data && data.token && data.expiry > Date.now();
    } catch(e) { return false; }
  }

  function getLockout() {
    try {
      var raw = sessionStorage.getItem(LOCKOUT_KEY);
      if (!raw) return { attempts: 0, lockedUntil: 0 };
      return JSON.parse(raw);
    } catch(e) { return { attempts: 0, lockedUntil: 0 }; }
  }

  function setLockout(data) {
    sessionStorage.setItem(LOCKOUT_KEY, JSON.stringify(data));
  }

  function checkLocked() {
    var lock = getLockout();
    if (lock.attempts >= MAX_ATTEMPTS) {
      var wait = Math.min(60000 * Math.pow(2, lock.attempts - MAX_ATTEMPTS), 300000);
      var elapsed = Date.now() - lock.lockedUntil;
      if (elapsed < wait) return wait - elapsed;
      setLockout({ attempts: 0, lockedUntil: 0 });
    }
    return 0;
  }

  async function login(password) {
    await new Promise(function(resolve) { setTimeout(resolve, 300 + Math.random() * 400); });
    if (password === 'admin123') return { success: true };
    return { success: false, error: 'Invalid password' };
  }

  async function attemptLogin(password) {
    var remaining = checkLocked();
    if (remaining > 0) {
      var secs = Math.ceil(remaining / 1000);
      return { success: false, locked: true, error: 'Too many attempts. Try again in ' + secs + 's.' };
    }
    var result = await login(password);
    if (result.success) {
      var token = generateToken();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: token, expiry: Date.now() + 86400000 }));
      setLockout({ attempts: 0, lockedUntil: 0 });
      return { success: true };
    }
    var lock = getLockout();
    lock.attempts++;
    lock.lockedUntil = Date.now();
    setLockout(lock);
    if (lock.attempts >= MAX_ATTEMPTS) {
      return { success: false, locked: true, error: 'Too many attempts. Try again in 60s.' };
    }
    return { success: false, error: result.error, remaining: MAX_ATTEMPTS - lock.attempts };
  }

  function adminLogout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* ── Expose globally ── */
  window.Auth = {
    supabase: _supabase,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    getUser: getCurrentUser,
    getPhoneFromUser: getPhoneFromUser,
    onAuthStateChange: onAuthStateChange,
    requireAuth: requireAuth,
    showAuthModal: showAuthModal,
    hideAuthModal: hideAuthModal,
    updateNavUI: updateNavUI,
    /* Legacy admin auth */
    isAuthenticated: isAuthenticated,
    attemptLogin: attemptLogin,
    logout: adminLogout,
    SESSION_KEY: SESSION_KEY
  };
})();
