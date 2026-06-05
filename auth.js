(function() {
  'use strict';

  /* ── Supabase Auth ── */
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

  async function signUp(email, password, profileData) {
    try {
      if (!_supabase) throw new Error('Supabase SDK not loaded yet');
      var meta = {
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        dog_age: profileData.dog_age || '',
        dog_gender: profileData.dog_gender || '',
        dog_breed: profileData.dog_breed || '',
        sickness: profileData.sickness || '',
        vaccination: profileData.vaccination || '',
        deworming: profileData.deworming || '',
        allergy: profileData.allergy || '',
        temperament: profileData.temperament || ''
      };
      var result = await _supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: meta
        }
      });
      if (result.error) throw result.error;
      // Upsert profile into public.profiles
      if (result.data && result.data.user) {
        var profilePayload = { id: result.data.user.id };
        for (var k in meta) { profilePayload[k] = meta[k]; }
        if (typeof DB !== 'undefined' && DB.upsertProfile) {
          await DB.upsertProfile(profilePayload);
        }
      }
      return { success: true, user: result.data.user, session: result.data.session };
    } catch (e) {
      console.error('[Auth] signUp error:', e.message || e);
      return { success: false, error: e.message || 'Sign-up failed' };
    }
  }

  async function signIn(email, password) {
    try {
      if (!_supabase) throw new Error('Supabase SDK not loaded yet');
      var result = await _supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (result.error) throw result.error;
      return { success: true, user: result.data.user, session: result.data.session };
    } catch (e) {
      console.error('[Auth] signIn error:', e.message || e);
      return { success: false, error: e.message || 'Sign-in failed' };
    }
  }

  async function signOut() {
    try {
      if (!_supabase) return { success: true };
      var result = await _supabase.auth.signOut();
      if (result && result.error) throw result.error;
      return { success: true };
    } catch (e) {
      console.error('[Auth] signOut error:', e.message || e);
      return { success: false, error: e.message || 'Sign-out failed' };
    }
  }

  async function getSession() {
    try {
      if (!_supabase) return null;
      var result = await _supabase.auth.getSession();
      return result.data && result.data.session ? result.data.session : null;
    } catch (e) {
      console.error('[Auth] getSession error:', e);
      return null;
    }
  }

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

  /**
   * Sync the full profile for the currently authenticated user.
   * profileData should include all fields (location, dog_age, etc.)
   */
  async function syncProfile(profileData) {
    try {
      var user = await getCurrentUser();
      if (!user) throw new Error('No authenticated user');
      var payload = { id: user.id };
      var fields = ['full_name','phone','location','dog_age','dog_gender','dog_breed','sickness','vaccination','deworming','allergy','temperament'];
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (profileData[f] !== undefined) payload[f] = profileData[f];
      }
      if (typeof DB !== 'undefined' && DB.upsertProfile) {
        await DB.upsertProfile(payload);
      }
      // Also update auth metadata
      if (_supabase) {
        await _supabase.auth.updateUser({ data: payload });
      }
      return { success: true };
    } catch (e) {
      console.error('[Auth] syncProfile error:', e);
      return { success: false, error: e.message || 'Sync failed' };
    }
  }

  function onAuthStateChange(callback) {
    if (!_supabase) {
      console.warn('[Auth] Supabase not loaded, cannot listen for auth state');
      return { unsubscribe: function() {} };
    }
    return _supabase.auth.onAuthStateChange(callback);
  }

  /* ── Legacy admin auth (mock, kept for admin.html compatibility) ── */
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
    if (password === 'admin123') {
      return { success: true };
    }
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

  function logout() {
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
    syncProfile: syncProfile,
    onAuthStateChange: onAuthStateChange,

    /* Legacy admin auth */
    isAuthenticated: isAuthenticated,
    attemptLogin: attemptLogin,
    logout: logout,
    SESSION_KEY: SESSION_KEY
  };
})();
