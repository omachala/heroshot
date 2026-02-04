---
description: Capture screenshots behind login pages. Session management, SSO, 2FA workarounds, and CI setup for authenticated screenshots.
---

# Capturing Behind Authentication

Most interesting screenshots live behind a login page. Dashboards, settings panels, admin interfaces - the stuff worth documenting is usually protected.

Heroshot handles this elegantly. Log in once manually, and it remembers your session for all future captures.

## How It Works

When you run `heroshot config` and log into your app, Heroshot watches. It captures your browser's session state - cookies, localStorage, everything the browser uses to stay logged in.

This session gets encrypted and saved to `.heroshot/session.enc`. Next time you run `heroshot` (headlessly, in CI, wherever), it restores that session. The browser starts already logged in.

No login scripts. No credential management. No flaky waits for login forms. Just captured screenshots.

## First Time Setup

Run the visual picker and log in manually:

```bash
heroshot config
```

A browser opens. Navigate to your login page. Enter your credentials. Complete any 2FA prompts. Do whatever you normally do to log in.

Once you're in, navigate to the pages you want to screenshot. Pick your elements. When you close the browser, Heroshot saves everything - both your screenshot config and your authenticated session.

That's it. Your session is now stored encrypted in `.heroshot/session.enc`.

## Testing It Works

Run a headless capture to verify:

```bash
heroshot -v
```

The verbose flag shows what's happening. You should see it restore your session and capture authenticated pages without any login prompts.

If it redirects to a login page instead, your session wasn't saved correctly or has expired. Run `heroshot config` again and log in fresh.

## Session Expiry

Sessions expire. Your app might invalidate them after a day, a week, or when you log out elsewhere.

**The symptom:** Screenshots suddenly show the login page instead of the dashboard.

**The fix:** Re-authenticate:

```bash
heroshot config --reset
```

The `--reset` flag clears your old session. Log in again in the browser, and you're good.

**How often this happens** depends on your app:

- Short-lived tokens (hours): You'll re-auth frequently
- Long-lived sessions (weeks): Occasional re-auth
- "Remember me" cookies (months): Rare re-auth

If your app has aggressive session expiry, consider creating a dedicated service account with longer session lifetimes.

## CI and Team Usage

Your local machine derives an encryption key automatically. But CI runners and teammates don't share that key. They need it explicitly.

### Export Your Session Key

```bash
heroshot session-key
```

This prints a ~20 character key. Treat it like a password - anyone with this key can decrypt your session.

### Add to CI Secrets

For GitHub Actions:

```bash
gh secret set HEROSHOT_SESSION_KEY
# Paste your key when prompted
```

Or manually: Repository → Settings → Secrets and variables → Actions → New repository secret.

### Use in Workflows

```yaml
- name: Capture screenshots
  run: npx heroshot
  env:
    HEROSHOT_SESSION_KEY: ${{ secrets.HEROSHOT_SESSION_KEY }}
```

Heroshot automatically uses the key from the environment variable. Your encrypted session file (`.heroshot/session.enc`) is already in the repo - now CI can decrypt it.

## What's in the Session File?

The session file contains:

- Cookies (including auth tokens)
- localStorage data
- sessionStorage data

It's everything Playwright's `storageState` captures - the full browser state needed to restore a logged-in session.

**It does NOT contain:**

- Your actual password
- Plain-text credentials
- Your session key (that's stored separately)

The file is encrypted with AES-256-GCM. Without the session key, it's random bytes.

## Different Auth Patterns

### Standard Username/Password

The simplest case. Log in during `heroshot config`, session is saved, done.

```bash
heroshot config
# Log in normally in the browser
# Pick your screenshots
# Close browser
```

### OAuth / SSO

OAuth flows (Google, GitHub, Okta, etc.) work the same way. The redirect dance happens in the browser, Heroshot captures the resulting session.

```bash
heroshot config
# Click "Sign in with Google"
# Complete the OAuth flow
# You're now logged in
# Pick screenshots, close browser
```

The session captures the final authenticated state, regardless of how you got there.

### Magic Links

Email-based login where you click a link to sign in.

1. Run `heroshot config`
2. Enter your email in the login form
3. Check your email (in another window)
4. Click the magic link - it opens in the Heroshot browser
5. You're logged in
6. Pick screenshots, close browser

If the magic link opens in your default browser instead, copy the URL and paste it into the Heroshot browser's address bar.

### Two-Factor Authentication

2FA prompts appear during `heroshot config`. Complete them normally:

- **TOTP apps (Google Authenticator, 1Password, etc.):** Enter the code when prompted
- **SMS codes:** Enter the code when it arrives
- **Hardware keys (YubiKey):** Plug in and tap

The resulting session is saved. Most apps don't require 2FA again until the session expires.

**For CI:** Make sure your 2FA session is long-lived. Some apps remember devices for 30 days; others require 2FA on every login. If yours requires 2FA every time, you'll need to either:

- Use a service account without 2FA
- Use API tokens instead of browser sessions (see below)

### API Tokens / Bearer Auth

Some apps use API tokens instead of cookies. If your app reads auth from localStorage:

1. Log in during `heroshot config`
2. The token is saved as part of localStorage
3. Future runs restore it automatically

If your app requires a header like `Authorization: Bearer <token>`, you can inject it:

```json
{
  "name": "API Dashboard",
  "url": "https://api.example.com/dashboard",
  "actions": [
    {
      "type": "evaluate",
      "function": "() => { localStorage.setItem('auth_token', 'your-token-here'); location.reload(); }"
    }
  ]
}
```

For sensitive tokens, consider using environment variables and a pre-capture script instead of hardcoding.

## Multiple Accounts

Need screenshots from different user accounts? Different permission levels?

**Option 1: Separate config files**

```bash
# Admin screenshots
heroshot config -c .heroshot/admin.json
# Log in as admin, pick admin-only pages

# User screenshots
heroshot config -c .heroshot/user.json
# Log in as regular user, pick user pages

# Capture both
heroshot -c .heroshot/admin.json
heroshot -c .heroshot/user.json
```

Each config has its own session file.

**Option 2: Text overrides for user-specific content**

If the pages are the same but show different usernames:

```json
{
  "name": "Dashboard",
  "url": "https://app.example.com/dashboard",
  "selector": ".dashboard",
  "textOverrides": {
    ".user-name": "Demo User",
    ".user-email": "demo@example.com"
  }
}
```

This replaces user-specific text with generic placeholders.

## Sensitive Data in Screenshots

Screenshots might capture sensitive information - real user data, email addresses, API keys visible on screen.

**Use text overrides to sanitize:**

```json
{
  "name": "Account Settings",
  "url": "https://app.example.com/settings",
  "selector": ".settings-panel",
  "textOverrides": {
    ".email-display": "user@example.com",
    ".api-key": "sk-xxxx...xxxx",
    ".billing-info": "$XX.XX/month"
  }
}
```

**Or hide sensitive sections:**

```json
{
  "actions": [{ "type": "hide", "selectors": [".billing-section", ".api-keys"] }]
}
```

## Debugging Auth Issues

### Session Not Restoring

**Symptom:** Headless runs show the login page.

**Check:**

1. Does `.heroshot/session.enc` exist?
2. Is the session key available? (`heroshot session-key` should print it)
3. Is the session expired? Run `heroshot config --reset` and re-auth.

### CI Can't Decrypt Session

**Symptom:** CI fails with decryption errors.

**Check:**

1. Is `HEROSHOT_SESSION_KEY` set in CI secrets?
2. Is it passed to the heroshot command via `env:`?
3. Does the key match? Run `heroshot session-key` locally and compare.

### Session Works Locally, Fails in CI

**Possible causes:**

- Different IP address triggers re-auth
- User agent mismatch (CI uses headless Chrome)
- Geographic restrictions

**Try:**

- Set a custom user agent matching your local browser
- Use the same session for both local and CI
- Check if your app has IP-based session validation

## Security Notes

**The session file is safe to commit.** It's encrypted. Without the session key, it's useless.

**The session key is sensitive.** Treat it like a password. Don't commit it to your repo. Use CI secrets or environment variables.

**Sessions can be powerful.** An authenticated session might have access to modify data, not just view it. Consider using a read-only account for screenshots if available.

**Rotate periodically.** If you suspect a key was exposed, re-run `heroshot config --reset` to generate a new session and key.

## What's Next

- [Automated Updates](/docs/guide/automated-updates) - Full CI setup with authentication
- [Troubleshooting Selectors](/docs/guide/troubleshooting-selectors) - When elements don't capture correctly
- [Actions Reference](/docs/actions-reference) - Pre-capture actions for complex auth flows
