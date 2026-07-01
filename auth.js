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

      if (!result.data || !result.data.user) {
        return { success: false, error: 'Sign-up did not return a user' };
      }
      var userId = result.data.user.id;

      /* ── If auto-confirm is off, sign in to get a session for DB writes ── */
      if (!result.data.session) {
        try {
          var si = await _supabase.auth.signInWithPassword({ email: email, password: password });
          if (si.error) console.warn('[Auth] Post-signup sign-in failed (DB inserts may be blocked by RLS):', si.error.message);
        } catch (siErr) {
          console.warn('[Auth] Post-signup sign-in threw:', siErr.message);
        }
      }

      /* ── Insert owner record (id = auth user.id) ── */
      var ownerPayload = {
        id: userId,
        phone: phone,
        full_name: profile.full_name || '',
        whatsapp_number: profile.whatsapp || phone,
        location: profile.location || ''
      };
      var ownerRes = await _supabase.from('owners').insert(ownerPayload).select();
      if (ownerRes.error) {
        console.error('[Auth] OWNER INSERT FAILED — message:', ownerRes.error.message, '| details:', ownerRes.error.details, '| hint:', ownerRes.error.hint, '| code:', ownerRes.error.code);
      } else {
        console.log('[Auth] Owner record created with id:', userId);
      }

      /* ── Insert dog record (owner_id = auth user.id) ── */
      var dogPayload = {
        owner_id: userId,
        name: profile.dog_name || '',
        breed: profile.dog_breed || '',
        age: profile.dog_age || '',
        gender: profile.dog_gender || '',
        sickness: profile.sickness || '',
        vaccination: profile.vaccination || '',
        deworming_3_months: profile.deworming || '',
        allergy: profile.allergy || '',
        temperament: profile.temperament || '',
        behavioral_issues: profile.behavioral_issues || ''
      };
      var dogRes = await _supabase.from('dogs').insert(dogPayload).select();
      if (dogRes.error) {
        console.error('[Auth] DOG INSERT FAILED — message:', dogRes.error.message, '| details:', dogRes.error.details, '| hint:', dogRes.error.hint, '| code:', dogRes.error.code);
      } else if (dogRes.data && dogRes.data.length > 0) {
        console.log('[Auth] Dog record created. dog_id:', dogRes.data[0].id);
      } else {
        console.warn('[Auth] Dog insert returned no data. Check RLS policies and column names on the dogs table.');
      }

      return { success: true, user: result.data.user, session: result.data.session };
    } catch (e) {
      console.error('[Auth] signUp error:', e.message || e);
      return { success: false, error: e.message || 'Sign-up failed' };
    }
  }

  /* ── Sign In (email or phone + password) ── */
  async function signIn(identifier, password) {
    try {
      if (!_supabase) throw new Error('Supabase SDK not loaded yet');
      var email = identifier.indexOf('@') !== -1 ? identifier : phoneToEmail(identifier);
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
        var expiresAt = new Date(session.expires_at).getTime();
        if (Date.now() > expiresAt) {
          console.warn('[Auth] Session expired');
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

  /* ── Admin email constant ── */
  var ADMIN_EMAILS = ['a1.enterprises8891@gmail.com', 'cloudlyconfusing@gmail.com', '9233485873@a1.com'];
  /* ── Extract phone from auth email ── */
  function getPhoneFromUser(user) {
    if (!user || !user.email) return '';
    return user.email.replace('@a1.com', '');
  }

  /* ── Check if current user is admin ── */
  async function isAdmin() {
    try {
      var user = await getCurrentUser();
      if (!user || !user.email) return false;
      return ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
    } catch(e) { return false; }
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
            '<div class="auth-field"><label>Phone or Email</label><input type="text" id="authLoginPhone" required placeholder="Phone or email"></div>' +
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
      await updateNavUI();
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
      await updateNavUI();
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
  var _authPending = false;
  async function requireAuth(callback) {
    if (_authPending) return;
    _authPending = true;
    try {
      var session = await getSession();
      if (session) {
        callback();
      } else {
        showAuthModal(callback);
      }
    } finally {
      _authPending = false;
    }
  }

  /* ── Nav UI (logout + admin buttons) ── */
  async function updateNavUI() {
    var session = await getSession();
    var isAdminUser = session ? await isAdmin() : false;
    var show = session ? '' : 'none';
    var adminShow = isAdminUser ? '' : 'none';
    var desktopBtn = document.getElementById('navLogoutBtn');
    var mobileBtn = document.getElementById('mobileLogoutBtn');
    var adminDesktop = document.getElementById('navAdminBtn');
    var adminMobile = document.getElementById('mobileAdminBtn');
    if (desktopBtn) desktopBtn.style.display = show;
    if (mobileBtn) mobileBtn.style.display = show;
    if (adminDesktop) adminDesktop.style.display = adminShow;
    if (adminMobile) adminMobile.style.display = adminShow;
  }

  async function handleLogout(e) {
    if (e) e.preventDefault();
    await signOut();
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('a1_admin_lockout');
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

  /* ── Admin auth (Supabase email/password) ── */
  var SESSION_KEY = 'a1_admin_session';
  function isAuthenticated() {
    var raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      var data = JSON.parse(raw);
      return data && data.expiry > Date.now();
    } catch(e) { return false; }
  }

  async function adminSignIn(email, password) {
    try {
      if (!_supabase) throw new Error('Supabase SDK not loaded yet');
      var result = await _supabase.auth.signInWithPassword({ email: email, password: password });
      if (result.error) throw result.error;
      if (!result.data || !result.data.user) throw new Error('No user returned');
      var authedEmail = (result.data.user.email || '').toLowerCase().trim();
      if (!ADMIN_EMAILS.includes(authedEmail)) {
        await _supabase.auth.signOut();
        return { success: false, error: 'This email is not authorized for admin access.' };
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiry: Date.now() + 86400000 }));
      var userId = result.data.user.id;
      var ownerRes = await _supabase.from('owners').upsert({
        id: userId,
        full_name: 'Admin',
        email: authedEmail,
        phone: ''
      }, { onConflict: 'id', ignoreDuplicates: true });
      if (ownerRes.error) {
        console.warn('[Auth] Admin owner upsert warning:', ownerRes.error.message);
      }
      return { success: true };
    } catch (e) {
      var msg = e.message || 'Login failed';
      if (msg.indexOf('Invalid login credentials') !== -1) msg = 'Invalid email or password.';
      return { success: false, error: msg };
    }
  }

  async function adminSignOut() {
    try {
      if (_supabase) await _supabase.auth.signOut();
    } catch (e) { /* ignore */ }
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('a1_admin_lockout');
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
    isAdmin: isAdmin,
    isAuthenticated: isAuthenticated,
    adminSignIn: adminSignIn,
    adminSignOut: adminSignOut,
    logout: adminSignOut,
    SESSION_KEY: SESSION_KEY
  };
})();
