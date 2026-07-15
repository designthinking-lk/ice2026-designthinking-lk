/* ICE2026 API client — talks to the Apps Script backend.
 * POST with Content-Type text/plain = CORS "simple request", no preflight. */
(function () {
  'use strict';

  var C = window.ICE_CONFIG;
  var TOKEN_KEY = 'ice2026.token';
  var CACHE_KEY = 'ice2026.bootstrap';
  var ROUTE_KEY = 'ice2026.postLoginRoute';

  function getToken() { return localStorage.getItem(TOKEN_KEY) || null; }
  function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

  /** Core call. Returns parsed JSON; throws Error with .code on failure. */
  async function api(action, params) {
    var body = Object.assign({ action: action }, params || {});
    var token = getToken();
    if (token && !body.token) body.token = token;
    var res = await fetch(C.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });
    var data = await res.json();
    if (data && data.ok === false) {
      if (data.error === 'auth') setToken(null); // expired/invalid token
      var err = new Error(data.message || data.error || 'Request failed');
      err.code = data.error;
      throw err;
    }
    return data;
  }

  /** Capture #icetoken=... handed back by the auth broker. */
  function absorbLoginToken() {
    var h = location.hash || '';
    var m = h.match(/[#&]icetoken=([^&]+)/);
    if (!m) return false;
    setToken(decodeURIComponent(m[1]));
    var back = sessionStorage.getItem(ROUTE_KEY) || '#/';
    sessionStorage.removeItem(ROUTE_KEY);
    history.replaceState(null, '', location.pathname + location.search + back);
    return true;
  }

  function signIn() {
    sessionStorage.setItem(ROUTE_KEY, location.hash || '#/');
    var redirect = location.origin + location.pathname;
    location.href = C.AUTH_URL + '?redirect=' + encodeURIComponent(redirect);
  }

  function signOut() {
    setToken(null);
    localStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(ROUTE_KEY);
    // Hard reset to the public home so no member state can survive the reload.
    location.replace(location.pathname + location.search + '#/');
    location.reload();
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* quota */ }
  }

  window.IceApi = {
    api: api,
    getToken: getToken,
    setToken: setToken,
    signIn: signIn,
    signOut: signOut,
    absorbLoginToken: absorbLoginToken,
    readCache: readCache,
    writeCache: writeCache,
  };
})();
