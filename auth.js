/*
 * auth.js — Authentication layer
 *
 * Provides async login() and logout() that simulate an API call.
 * Currently uses a mock password check (admin123).
 *
 * TODO: Replace the mock fetch() call below with a real Cloudflare Worker
 *       or Firebase Auth endpoint. The function signature (password → { success, token, error })
 *       stays the same — only the fetch() logic needs to change.
 *
 * Example production endpoint:
 *   const res = await fetch('https://api.example.com/auth/login', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ password })
 *   });
 *   return res.json();
 */

(function() {
  'use strict';

  const SESSION_KEY = 'a1_admin_session';
  const LOCKOUT_KEY = 'a1_admin_lockout';
  const MAX_ATTEMPTS = 5;

  // ── Session ──
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

  // ── Lockout ──
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

  // ── Mock API login ──
  async function login(password) {
    // Simulate network latency
    await new Promise(function(resolve) { setTimeout(resolve, 300 + Math.random() * 400); });

    /*
     * TODO: Replace this mock check with a real API call.
     * Expected response shape: { success: bool, error?: string }
     *
     * Example:
     *   const res = await fetch('https://api.example.com/auth/login', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ password })
     *   });
     *   return res.json();
     */

    if (password === 'admin123') {
      return { success: true };
    }
    return { success: false, error: 'Invalid password' };
  }

  // ── Lockout-aware login wrapper ──
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

    // Increment lockout
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

  // ── Expose globally ──
  window.Auth = {
    isAuthenticated: isAuthenticated,
    attemptLogin: attemptLogin,
    logout: logout,
    SESSION_KEY: SESSION_KEY
  };
})();
