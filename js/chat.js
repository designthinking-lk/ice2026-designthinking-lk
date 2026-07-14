/* ICE2026 — Google Chat handoff.
 * Messaging happens in real Google Chat between workshop Workspace accounts.
 * "Message" buttons call spaces.setup (creates or returns the 1:1 DM) with a
 * user-granted OAuth token, then open the DM's chat.google.com URL.
 * Dormant until ICE_CONFIG.CHAT_CLIENT_ID is set (see docs/google-chat-setup.md). */
(function () {
  'use strict';

  var C = window.ICE_CONFIG;
  var SCOPE = 'https://www.googleapis.com/auth/chat.spaces.create';
  var accessToken = null;
  var tokenExpiry = 0;

  function configured() {
    return !!(C.CHAT_CLIENT_ID && window.google && google.accounts && google.accounts.oauth2);
  }

  function getAccessToken() {
    return new Promise(function (resolve, reject) {
      if (accessToken && Date.now() < tokenExpiry - 60000) return resolve(accessToken);
      var client = google.accounts.oauth2.initTokenClient({
        client_id: C.CHAT_CLIENT_ID,
        scope: SCOPE,
        callback: function (resp) {
          if (resp.error) return reject(new Error(resp.error_description || resp.error));
          accessToken = resp.access_token;
          tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
          resolve(accessToken);
        },
        error_callback: function (err) {
          reject(new Error(err.message || 'Google sign-in was closed'));
        },
      });
      client.requestAccessToken();
    });
  }

  /** Open (creating if needed) the 1:1 Google Chat DM with `email` in a new tab. */
  async function openDm(email) {
    if (!configured()) throw new Error('Google Chat is not set up yet — contact the organizers.');
    // Open the tab synchronously so popup blockers allow it; navigate it later.
    var win = window.open('about:blank', '_blank');
    try {
      var token = await getAccessToken();
      var res = await fetch('https://chat.googleapis.com/v1/spaces:setup', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space: { spaceType: 'DIRECT_MESSAGE' },
          memberships: [{ member: { name: 'users/' + email, type: 'HUMAN' } }],
        }),
      });
      var data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Could not open the conversation');
      if (win) win.location = data.spaceUri || 'https://chat.google.com';
      else window.open(data.spaceUri || 'https://chat.google.com', '_blank');
    } catch (err) {
      if (win) win.close();
      throw err;
    }
  }

  window.IceChat = { openDm: openDm, configured: configured };
})();
