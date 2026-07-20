# Google Chat messaging — admin setup

Messaging happens over the **Google Chat REST API** but is rendered **inside the
ICE site** — there is no hand-off to chat.google.com. The frontend
(`js/chat.js`) calls the Chat API with the signed-in user's own OAuth token to
find/create the 1:1 DM (`spaces.findDirectMessage` / `spaces.setup`), list and
send messages (`spaces.messages.list` / `spaces.messages.create`), and reads the
caller's own identity from the OpenID `userinfo` endpoint so it can tell sent
messages from received ones. The "Chat" tab is a small messenger: a DM inbox
with unread indicators and a conversation view with a composer.

Google Chat has **no browser push**, so the UI polls: the open conversation
every few seconds, and unread state on a background interval. Notifications when
the panel is closed still come from native Google Chat / mobile.

The code is deployed but **dormant** until `CHAT_CLIENT_ID` is set in
`js/config.js` **and** the Chat API is configured in the Cloud project (below).
Until then, the Chat tab shows "Messaging isn't set up yet."

## 1. Workshop accounts

Every participant/mentor needs a Workspace account — the Chat API does not work
for consumer @gmail.com accounts. In this deployment those accounts are minted
automatically at registration as **`firstname@designthinking.lk`** (see the API
backend's `provisionWorkspaceAccount_`), landing in the `/ICE` org unit. The
address is stored on each profile as `workEmail` and is what the messenger uses
to open a DM.

- Make sure Google Chat is ON for these users (Admin console → Apps → Google
  Workspace → Google Chat) and that they can DM each other (default for
  same-domain).
- `designthinking.lk` is a domain in the **same Workspace / Cloud org** as
  `ahlab.org`, which is why an Internal consent screen accepts both.
- After the workshop: suspend or delete the accounts.

## 2. GCP project + OAuth client (console.cloud.google.com)

The project in use is **`design-thinking-502504`** (project number
`664996878590`); its web OAuth client ID is already wired into
`CHAT_CLIENT_ID` in `js/config.js`. To reproduce from scratch:

1. **Enable the Google Chat API** (APIs & Services → Library → Google Chat API).
2. On the Chat API's **Configuration** tab, fill in the minimal Chat app config
   (app name e.g. "ICE", avatar URL, description). **This step is required even
   though we call the API as the user** — without it the API returns
   `404 … Chat app not found. To create a Chat app, you must turn on the Chat
   API and configure the app in the Google Cloud console.` No interactive
   features / endpoints are needed; leave them off.
   Direct link: `https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=design-thinking-502504`
3. **OAuth consent screen** (APIs & Services → OAuth consent screen):
   - User type: **Internal** — all users are in the same Workspace org, so the
     sensitive Chat scopes below need **no** Google verification review.
   - Scopes requested by the frontend:
     - `openid`, `email` — read the caller's own id (`userinfo.sub`) to align
       sent vs received messages.
     - `https://www.googleapis.com/auth/chat.spaces` — find/create DM spaces.
     - `https://www.googleapis.com/auth/chat.messages` — list + send messages.
4. **Credentials → Create credentials → OAuth client ID**:
   - Type: **Web application**.
   - Authorized JavaScript origins: `https://ice2026.designthinking.lk`
     (add your localhost dev origin, e.g. `http://localhost:4870`, for local dev).
   - No redirect URIs needed (the frontend uses the GIS token client / popup flow).
5. Copy the client ID (`….apps.googleusercontent.com`) into `CHAT_CLIENT_ID`
   in `js/config.js` and deploy.

> Changing the scope set means returning users get **one** fresh consent popup
> the next time they open the messenger.

## 3. How it behaves for users

1. User signs in to the site with their Google account (personal or their
   `@designthinking.lk` workshop account — both resolve to the same ICE
   registration; see the API backend's `canonicalEmail_`).
2. They open the **Chat** tab (or press **Message** on a profile) and click
   **Connect messaging** once — a Google popup asks them to grant the Chat
   permissions (Internal consent screen → one click). The popup must be spent
   inside that click, which is why connecting is an explicit button.
3. The inbox and conversations render **on the ICE site**. Sending posts to the
   DM; new messages arrive by polling. History, mobile apps and notifications
   remain native Google Chat.

Note: the person being messaged is identified by the `workEmail` field on their
ICE profile, so only people who have a workshop account (registered +
provisioned) are messageable; profiles without one show no Message button.

## 4. Limitations (current)

- **Polling, not push** — new messages appear within a few seconds.
- **Background unread** only updates after the user has connected in that
  session; when the panel is closed, native Chat/mobile is the source of truth
  for notifications.
- **Plain text only** — no attachments, reactions, or read receipts yet.
