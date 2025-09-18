# Pigeon App – backend on Electron

This file sort of explain how the “main” process in Electron is wired up, and also what kind of things you can say to it (via API calls basically).

---

## How stuff is organized

Instead of dumping all the things in one file, it’s chopped up into little parts. Easier to think about that way.

### Main bricks

1. **DatabaseManager** (`src/main/database/DatabaseManager.js`)

   - plays middle‑man with SQLite
   - anything sensitive gets scrambled (encrypt) before it ends up stored
   - simple create / update / read / delete for chats, msgs, user rows, prefs

2. **SecurityManager** (`src/main/security/SecurityManager.js`)

   - does the scrambling + unscrambling jobs
   - caretakes the tokens so they don’t leak around
   - basically “guard dog”

3. **DiscordClient** (`src/main/services/DiscordClient.js`)

   - hooks into Discord over websockets
   - logins + message sync as they are happening live
   - wraps some API calls to Discord

4. **SyncManager** (`src/main/sync/SyncManager.js`)
   - keeps local stuff + backend server matched up
   - runs about once a minute, by itself
   - pushes bunches of changes up or pulls them back down

---

## Database shape

### What goes in there

- **users** → folks from diff platforms
- **chats** → dms, group convos, channels
- **messages** → chat text + encrypted bits
- **chat_participants** → who’s inside a group
- **platform_credentials** → login tokens (kept safe)
- **sync_state** → notes about which msgs synced
- **app_settings** → user tweaks/preferences
- **ai_insights** → summaries/tasks created by AI bits
- **bookmarks** → saved stuff u don’t wanna lose
- **notification_settings** → how loud the app pings u

### Securityy (yep)

- sensible data = always encrypted using one master key
- tokens themselves = stored with electron‑store
- “extra lock” used for messages that need additional hiding
- logs scrubbed so no leaks show

---

## API things you can yell at

### Talking with Discord

- `discord:open-login`  
  → Pops up login window & tries grabbing token.  
  Returns: `{ success: boolean, error?: string }`

- `discord:get-dms`  
  → spits out your main DM list + group chats.  
  Returns a list with: id, type, name, headcount, last msg time.

- `discord:send-message`  
  → shoot a message at given channel/chat.  
  Inputs `{ chatId, message }`; Returns ok/error.

---

### DB lookups

- `db:get-chats` → all chats you got.
- `db:get-messages` → messages from 1 chat, with optional limit/offset.

---

### Syncing

- `sync:manual` → force sync now.
- `sync:get-status` → ask when it last worked.

---

### App bits

Window control: quit / minimize / maximize. Settings read + write. Straightforward.

---

## Example usage (scrappy sample code)

```js
// login to Discord
const loginRes = await window.electronAPI.discord.openLogin();

// get DMs list
const dmStuff = await window.electronAPI.discord.getDMs();

// sending one msg
await window.electronAPI.discord.sendMessage("chat123", "hello from me");

// hook connected event
window.electronAPI.discord.onConnected(() => {
  console.log("linked up finally!");
});

// syncing by hand
await window.electronAPI.sync.manual();
```

---

## Notes about keeping safe

- tokens encrypted wtih AES
- very private messages double‑locked
- all communication goes through contextBridge = safer
- we do checking/cleaning inputs so junk doesn’t break things
- error logs are stripped so no data leaks out

---

## First run instructions

1. Install these pkgs:

   ```bash
   npm install better-sqlite3 ws crypto-js electron-store
   ```

2. put env variables:

   ```bash
   BACKEND_URL=https://api.pigeon-app.com
   PIGEON_API_KEY=your-api-key
   ```

3. run in dev:

   ```bash
   npm run dev
   ```

---

## Sync flow (rough idea)

- Push, every min: takes unsent local msgs → encrypt → backend
- Pull, every ~30min: grab stuff from backend → decrypt → save local

So pipeline is like: local → db → push → server → pull → db again.
