# Google Chat messaging — admin setup

Messaging in ICE2026 hands off to **real Google Chat** between workshop
Workspace accounts. The frontend calls the Chat API's `spaces.setup` with the
signed-in user's OAuth token to create/find the 1:1 DM, then opens the returned
`spaceUri` (chat.google.com) in a new tab. The "Messages" nav item simply opens
chat.google.com.

The code is already deployed but **dormant** until `CHAT_CLIENT_ID` is set in
`js/config.js`. Until then, Message buttons show "Google Chat is not set up
yet".

## 1. Workshop accounts (Admin console, admin.google.com)

Every participant/mentor needs an account in the ahlab.org Workspace (Chat API
does not work for consumer @gmail.com accounts).

- Option A: bulk-create users via **Directory → Users → Bulk update users**
  (CSV: first name, last name, email like `firstname.lastname@ahlab.org` or a
  secondary domain such as `ice.ahlab.org` added under Account → Domains).
- Licensing: on paid Workspace editions each account consumes a license for the
  workshop month; Education/legacy-free editions are free.
- Make sure Google Chat is ON for these users (Apps → Google Workspace →
  Google Chat) and that they can DM each other (default for same-domain).
- After the workshop: suspend or delete the accounts.

## 2. GCP project + OAuth client (console.cloud.google.com)

Create (or reuse) a project **under the ahlab.org organization**, then:

1. **Enable the Google Chat API** (APIs & Services → Library → Google Chat API).
2. On the Chat API's **Configuration** tab, fill in the minimal Chat app
   config (app name e.g. "ICE2026", avatar URL, description; no interactive
   features / endpoints needed).
3. **OAuth consent screen** (APIs & Services → OAuth consent screen):
   - User type: **Internal** (all users are in the ahlab.org Workspace, so no
     Google verification review is needed).
   - Scope used by the frontend: `https://www.googleapis.com/auth/chat.spaces.create`.
4. **Credentials → Create credentials → OAuth client ID**:
   - Type: **Web application**.
   - Authorized JavaScript origins: `https://ice2026.designthinking.lk`
     (add `http://localhost:8471` for local dev).
   - No redirect URIs needed (the frontend uses the GIS token client / popup flow).
5. Copy the client ID (`....apps.googleusercontent.com`) into
   `CHAT_CLIENT_ID` in `js/config.js` and deploy.

## 3. How it behaves for users

1. User signs in to the site with their **workshop account** (the existing
   Apps Script auth broker works unchanged — identity is just the @ahlab.org email).
2. First time they press **Message** on a profile, a Google popup asks them to
   pick the workshop account and grant the "create chats" permission (internal
   consent screen → one click).
3. The DM opens in a new chat.google.com tab. Notifications, mobile apps and
   history are all native Google Chat.

Note: the person being messaged is identified by the `email` field on their
ICE2026 profile, so profiles must carry the workshop email (pre-seed the
directory from the account list).
