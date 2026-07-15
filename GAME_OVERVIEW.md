# Mystery Agency — Game Overview

A deeper look at how Mystery Agency plays, the story, and how moderators run it. For setup and technical details, see the [README](README.md).

---

## The premise

A legendary thief — **the Red Fox** — has resurfaced. The whole community works one case at a time: read the evidence, submit a theory, vote on the best theories, and the community's top pick becomes **canon** and drives the story forward. There is no hidden "right answer" the game checks — **the community decides the truth by voting.**

The campaign runs across **ten chapters**, *The Red Fox Files* (Books One & Two), ending in a predict-the-culprit finale.

---

## The gameplay loop

1. **Investigate** — On the **Evidence** screen, read the case briefing and every clue (tagged EVIDENCE, TESTIMONY, or DOCUMENT).
2. **Submit a theory** — Choose a type (Suspect / Motive / Method / Prediction), write it (≤280 chars), and tag the clues that support it. **You may submit one theory per chapter**, so make it count.
3. **Voting opens** — Phases advance **automatically every 12 hours** (moderators can also open voting instantly). Everyone upvotes the theories they find most convincing.
4. **Canon is selected** — The top-voted theory becomes **canon**, earns its author bonus XP, and shapes the next chapter — celebrated on the canon screen.
5. **Next chapter** — The story advances and the loop repeats, through the finale.

A live phase + countdown banner appears on the menu, evidence, and theory screens, and a toast announces each phase or chapter change.

---

## Theories & voting

- **One per chapter.** Once you submit for a chapter, the submit button becomes "✓ Theory Submitted".
- **Every theory shows the chapter it was submitted for** (a `📖 CHAPTER N` badge), so theories from different chapters are never confused.
- **Voting rules:** only during the voting phase; you can't vote for your own theory or a canon theory; a per-rank daily vote limit applies and resets each day.

---

## Progression

**XP**

| Action | XP |
|--------|----|
| Daily login (once/day) | +5 |
| Submit a theory | +10 |
| Cast a vote | +2 |
| A vote on your theory | +5 |
| Your theory becomes canon | +100 |
| 7-day / 30-day streaks | +50 / +200 |

**Ranks** (unlock higher vote limits): Rookie (0) → Investigator (101) → Detective (501) → Senior Detective (2,001) → Lead Detective (5,001) → Agency Director (10,000).

**Badges:** 🏆 First Canon · 📈 Trendsetter (50 votes received) · 🔥 Consistent (30-day streak) · 🌟 Influencer (500 votes received) · 🧩 Story Weaver (10 canonized theories).

**Leaderboards:** three boards — **XP**, **Canon**, and **Votes** — with medal badges for the top three and a highlight for your own row.

---

## The story arc

**Book One — The Red Fox (Ch. 1–5)** — a string of impossible, insider-assisted heists linked by paper-fox calling cards leads to naming the first Fox… and the hint that there were two.

**Book Two — The Second Fox (Ch. 6–10)** — a mirror-image copycat, an insurance-fraud trail, a forgery safehouse, a double-bluff frame job, and a grand finale where the community predicts the last Fox.

Clue threads pay off across chapters (the folded foxes, the initial "V.", the harbor tunnel, the alibis), so the canon choices build a coherent ending.

---

## Moderator guide

"Admin" simply means a **moderator of the subreddit** where the game is installed — verified server-side, so controls can't be spoofed. Moderators automatically see a **🛠️ ADMIN** button on the Main Menu.

The Admin panel shows a **live status line** (chapter, phase, countdown, automation state) and offers:

| Group | Controls |
|-------|----------|
| Manual override | Open Submissions · Open Voting · Close Voting |
| Automation | Pause / Resume auto-progression · Skip Phase · Auto-Select Canon |
| Chapter & game | Advance Chapter · Reset Game (with confirmation) |

You don't have to do anything — phases **auto-advance every 12 hours** by default. Use the buttons only to move faster or slower: **Skip Phase** to jump ahead, **Pause Auto** to hold a phase, **Resume Auto** to restart the timer. Manual actions override the schedule; automation resumes from the phase you set. **Reset Game** returns the story to Chapter 1 and clears canon selections and submissions.

---

## Screens

- **Main Menu** — Play, Profile, Leaderboard, Settings, How to Play (Admin appears for moderators), with a live phase banner.
- **Evidence** — case briefing + scrollable clues; the primary action adapts to the phase (Submit / Already Submitted / Vote / Closed).
- **Submit Theory** — type picker, text box, evidence tagger.
- **Community Theories** — vote, see the phase and countdown, per-theory chapter badges, jump to the canon celebration.
- **Leaderboard** — XP / Canon / Votes tabs with ranked cards and medals.
- **Profile** — your stats, rank progress, and badges.
