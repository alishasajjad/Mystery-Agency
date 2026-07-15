# Mystery Agency — Moderator / Admin Guide

Everything a subreddit moderator needs to run the game.

---

## Who is an admin?

There is **no separate admin account**. "Admin" simply means a **moderator of the subreddit** where the game is installed. Moderator status is verified **server-side** on every admin action (`getModPermissionsForSubreddit`), so the controls cannot be spoofed by a normal player.

## Finding the Admin panel

- Open the game. If you are a moderator, a **🛠️ ADMIN** button appears at the **top-right of the Main Menu** automatically (the app checks your real mod status via `GET /api/admin/status`).
- Not a moderator of that subreddit? The button won't show — and even if it did, every admin action would return `403`.
- Dev fallback: triple-tap the title on the Main Menu to reveal a **dev** admin button (for local testing only; server still enforces real permissions).

## The Admin panel

At the top you'll see a **live status line**: `📖 Chapter N • Phase: SUBMISSION / VOTING / CLOSED`, plus the recommended flow. The status refreshes after every action.

### Controls

| Section | Button | Effect |
|---|---|---|
| Voting control | **Open Submissions** | Phase → `submission` (players can submit theories) |
| Voting control | **Open Voting** | Phase → `voting` (players can upvote) |
| Voting control | **Close Voting** | Phase → `closed` (no submit/vote) |
| Canon selection | **Auto-Select Canon** | Marks the **highest-voted** theory canon; author +100 XP |
| Chapter progression | **Advance Chapter** | Moves to the next chapter and reopens submissions |
| Game management | **Reset Game** | Returns to Chapter 1, clears canon (asks for confirmation) |

All actions show a success/error **toast** — no blocking dialogs.

## Recommended running of a case

1. **Open Submissions** — let players read clues and submit theories for a while (hours/days — your call).
2. **Open Voting** — let the community upvote the best theories.
3. **Auto-Select Canon** (or pick manually) — locks in the winning theory and rewards its author.
4. **Advance Chapter** — moves the story forward and reopens submissions for the next chapter.
5. Repeat through **Chapter 5**, the finale, where players predict the Red Fox's identity.

> Pacing is entirely up to you — there is no automatic timer. A good cadence is one phase per day, or match your community's activity.

## Content

Five chapters ship with the game (*The Red Fox Files* arc). Chapter/phase state is stored in Redis and initialized automatically on app install; use **Reset Game** to start the arc over.

## Notes & limits

- **Advance past the last chapter** is blocked (returns an error) — reset to replay.
- Admin actions are **irreversible** (especially Reset).
- If the **🛠️ ADMIN** button is missing, confirm you are actually a moderator of the subreddit set in `devvit.json` → `dev.subreddit` (mod status is per-subreddit). See `DEPLOYMENT_GUIDE.md` → Troubleshooting.
