import type { RedisClient } from '@devvit/web/server';
import { setChapter, setCurrentChapter, writePhase, clearChapterAuthors } from './redis';
import { THEORY_CONFIG } from '../../shared/constants';
import type { Chapter } from '../../shared/types';

/** Write the opening phase state (submission, auto-progression on, timer running). */
async function seedOpeningPhase(redis: RedisClient, chapterId: string): Promise<void> {
  const now = Date.now();
  await writePhase(redis, {
    phase: 'submission',
    endsAt: now + THEORY_CONFIG.SUBMISSION_WINDOW_HOURS * 3600 * 1000,
    startedAt: now,
    auto: true,
    chapterId,
  });
}

// Embedded story data — "The Red Fox Files", a five-part arc. No filesystem deps.
// Each chapter is designed to support several plausible theories so the community
// vote genuinely matters. Clue ids are unique per chapter for evidence tagging.
const CHAPTERS: Chapter[] = [
  {
    id: 'chapter1',
    title: 'The Midnight Heist',
    content:
      'The Aurelia Diamond vanished from the Meridian Museum vault at the stroke of midnight. The alarm never sounded, the vault door showed no damage, and the guards swear no one entered. Yet on the empty pedestal sits a single calling card: a small paper fox. Three people had reason to be near the vault that night — a curator, a night guard, and a visiting appraiser. Who took the Aurelia, and how?',
    clues: [
      { id: 'clue1', description: 'Camera 3 catches a gloved figure at the vault at 11:58 PM. They move without hesitation — as if they already knew the alarm was disarmed.', type: 'evidence' },
      { id: 'clue2', description: 'The vault log shows the alarm was disabled for 90 seconds using the curator’s access code — but the curator was on camera in the lobby the whole time.', type: 'document' },
      { id: 'clue3', description: 'The night guard swears he heard the vault close at 11:55 PM, three minutes BEFORE the figure on camera arrived.', type: 'dialogue' },
      { id: 'clue4', description: 'The paper fox is folded from a museum donation slip — one only staff and registered appraisers ever handle.', type: 'evidence' },
    ],
    canon_theory: null,
    theory_type: 'suspect',
    created_at: Date.now(),
  },
  {
    id: 'chapter2',
    title: 'The Vanishing Canvas',
    content:
      'During a packed opening at the Halcyon Gallery, a priceless portrait disappeared from a fully lit wall in front of a hundred guests. No alarm, no broken glass, no gap in the crowd. When the lights came up, only the empty frame remained — and pinned to it, another paper fox. The Red Fox is back. How was a painting stolen in plain sight?',
    clues: [
      { id: 'clue5', description: 'The portrait hung in the one spot invisible to the main camera. The backup camera covering it went dark for exactly four minutes.', type: 'evidence' },
      { id: 'clue6', description: 'A guest signed the book as "R. Vulpes" — Latin for fox — and left minutes before the theft was noticed.', type: 'document' },
      { id: 'clue7', description: 'A server recalls a waiter she didn’t recognize wheeling out an empty catering cart that "smelled of paint thinner."', type: 'dialogue' },
      { id: 'clue8', description: 'The frame’s backing was sliced with surgical precision — the canvas rolled, not cut hastily. This took practice and time.', type: 'evidence' },
    ],
    canon_theory: null,
    theory_type: 'suspect',
    created_at: Date.now(),
  },
  {
    id: 'chapter3',
    title: 'The Harbor Job',
    content:
      'A shipping container of recovered artifacts — including two pieces the Red Fox once tried to steal — never reached the evidence warehouse. The manifest says it was unloaded at 3 AM. The warehouse says it never arrived. Somewhere between the crane and the gate, an entire container vanished. Figure out the METHOD: how do you make a 30-ton box disappear?',
    clues: [
      { id: 'clue9', description: 'The crane logged an unscheduled lift at 3:12 AM — onto a truck with no gate record entering or leaving.', type: 'document' },
      { id: 'clue10', description: 'A torn shipping label floats in the harbor. The container number matches; the destination field is deliberately scratched out.', type: 'evidence' },
      { id: 'clue11', description: 'A dockworker mentions "a friend of the foreman" who spent a week asking very specific questions about the night rotation.', type: 'dialogue' },
      { id: 'clue12', description: 'The foreman’s keycard opened the crane cab at 3:10 AM — but he’d clocked out and driven home an hour earlier.', type: 'document' },
    ],
    canon_theory: null,
    theory_type: 'method',
    created_at: Date.now(),
  },
  {
    id: 'chapter4',
    title: 'The Locked Study',
    content:
      'Silas Crane, the collector who has bankrolled every hunt for the Red Fox, is found slumped in his study — locked from the inside, the only key in his own pocket. His private ledger, the one naming everyone who ever bought a stolen piece, is gone. Before he loses consciousness he whispers one word: "twins." Why was the ledger taken, and what did Crane know?',
    clues: [
      { id: 'clue13', description: 'The fireplace flue was scrubbed clean this week — though the housekeeper insists it hadn’t been serviced in years. Small enough for a slim adult.', type: 'evidence' },
      { id: 'clue14', description: 'The guest book lists a locksmith two days earlier for "routine maintenance" that no one on staff remembers scheduling.', type: 'document' },
      { id: 'clue15', description: 'Crane’s last word — "twins" — matches a rumor that the Red Fox has always worked as two people sharing one legend.', type: 'dialogue' },
      { id: 'clue16', description: 'The ledger’s wall safe wasn’t forced. It was opened with the correct combination — a number Crane never wrote down.', type: 'evidence' },
    ],
    canon_theory: null,
    theory_type: 'motive',
    created_at: Date.now(),
  },
  {
    id: 'chapter5',
    title: 'The First Fox',
    content:
      'Every case in Book One has pointed here. The disarmed alarms, the insider access, the whisper of "twins," the calling cards folded from museum slips. Name the FIRST Red Fox now — the face the world will see arrested. But the burner phone was clear: there were two of them. This is the midpoint, not the end.',
    clues: [
      { id: 'clue17', description: 'Every crime used legitimate insider credentials that were active but "impossible" — the owner always had an alibi on camera.', type: 'evidence' },
      { id: 'clue18', description: 'The paper foxes were all folded left-handed. Only two people connected to these cases are left-handed.', type: 'evidence' },
      { id: 'clue19', description: 'Silas Crane funded the Red Fox task force AND owned three of the "stolen" pieces, which were quietly insured for more than their value.', type: 'document' },
      { id: 'clue20', description: 'A recovered burner phone holds one saved message: "One more job. Then the Fox retires for good — and no one ever knew there were two of us."', type: 'dialogue' },
    ],
    canon_theory: null,
    theory_type: 'prediction',
    created_at: Date.now(),
  },

  // --- Book Two: The Second Fox ---
  {
    id: 'chapter6',
    title: 'The Copycat',
    content:
      'The first Fox is behind bars — and three days later, a jeweler is robbed in the exact Red Fox style: no alarm, insider access, a paper fox left behind. Either the legend has a successor, or the wrong person is in a cell. Book Two begins: is this a copycat, or the second twin stepping out of the shadow?',
    clues: [
      { id: 'clue21', description: 'The new paper fox is folded RIGHT-handed — the mirror of every previous one.', type: 'evidence' },
      { id: 'clue22', description: 'The jeweler’s alarm was disabled with a code issued the same week the first Fox was arrested — by someone still on the inside.', type: 'document' },
      { id: 'clue23', description: 'A neighbor describes the thief as "moving exactly like" the person already in custody. Uncanny. Practiced. Familiar.', type: 'dialogue' },
      { id: 'clue24', description: 'Security footage catches a reflection: the thief pauses to photograph the empty case, as if documenting it for someone else.', type: 'evidence' },
    ],
    canon_theory: null,
    theory_type: 'suspect',
    created_at: Date.now(),
  },
  {
    id: 'chapter7',
    title: 'The Insurance Trail',
    content:
      'Silas Crane recovered from the study attack and is quietly liquidating assets. Every "stolen" Red Fox piece was over-insured, and the payouts route through shell companies. Follow the money and answer the real question of Book Two: WHY does the second Fox keep stealing pieces that were never truly lost?',
    clues: [
      { id: 'clue25', description: 'Three shell companies receiving insurance payouts were all incorporated by the same law office on the same afternoon.', type: 'document' },
      { id: 'clue26', description: 'The over-insured pieces are all forgeries. The originals were never stolen — they were quietly sold years ago.', type: 'evidence' },
      { id: 'clue27', description: 'An auditor who flagged the pattern took an abrupt "sabbatical" the day after filing her report.', type: 'dialogue' },
      { id: 'clue28', description: 'Crane’s recovered ledger lists a silent partner under a single initial: "V." — the same initial the gallery guest signed as "R. Vulpes".', type: 'document' },
    ],
    canon_theory: null,
    theory_type: 'motive',
    created_at: Date.now(),
  },
  {
    id: 'chapter8',
    title: 'The Safehouse',
    content:
      'The second Fox works from somewhere close — a base to forge, plan, and fold those calling cards. Utility records, delivery logs, and a scrap of a map point to a single block. Work out the METHOD: how does the second Fox move stolen goods and forgeries through the city without ever being seen?',
    clues: [
      { id: 'clue29', description: 'One address draws triple the normal electricity — consistent with kilns and printing presses used for forgery.', type: 'document' },
      { id: 'clue30', description: 'A courier company logs regular pickups from that block, always to the same set of storage lockers near the harbor.', type: 'evidence' },
      { id: 'clue31', description: 'A tunnel from a disused subway line runs directly beneath the block — sealed on the map, but recently reopened.', type: 'evidence' },
      { id: 'clue32', description: 'A neighbor complains about "two people who look alike coming and going" — but the first Fox has been in custody the whole time.', type: 'dialogue' },
    ],
    canon_theory: null,
    theory_type: 'method',
    created_at: Date.now(),
  },
  {
    id: 'chapter9',
    title: 'The Double Bluff',
    content:
      'Just as the net tightens, evidence surfaces framing an innocent museum curator for everything — a little too neatly. The second Fox is misdirecting, betting the community will take the easy answer. Look past the frame job: who is really being protected, and who is the second Fox steering everyone away from?',
    clues: [
      { id: 'clue33', description: 'The planted evidence against the curator is flawless — too flawless. Real trails are messy; this one is staged.', type: 'evidence' },
      { id: 'clue34', description: 'The curator has an airtight alibi for two of the crimes: she was on camera receiving an award from Silas Crane.', type: 'document' },
      { id: 'clue35', description: 'The anonymous tip framing her came from the SAME burner network as the "two of us" message.', type: 'evidence' },
      { id: 'clue36', description: 'A slip in the frame job: the planted documents were signed left-handed AND right-handed — as if two people built it together.', type: 'dialogue' },
    ],
    canon_theory: null,
    theory_type: 'suspect',
    created_at: Date.now(),
  },
  {
    id: 'chapter10',
    title: 'The Last Fox',
    content:
      'This is the end of the Red Fox Files. Two twins, one legend, a fortune built on forgeries and insurance fraud, and a task force funded by the very man behind it all. The community holds every thread: the mirrored folds, the initial "V.", the tunnel, the frame job, the silent partner. Predict who the LAST Fox is, how the twins pulled it off, and how the story ends. The canon theory here is the true finale.',
    clues: [
      { id: 'clue37', description: 'DNA on the newest paper fox matches the first Fox — a sibling-level match, not identical. The twins are fraternal.', type: 'evidence' },
      { id: 'clue38', description: 'Silas Crane’s "silent partner V." and the gallery guest "R. Vulpes" share the same handwriting as Crane’s own private letters.', type: 'document' },
      { id: 'clue39', description: 'The harbor lockers hold the ORIGINAL masterpieces — never stolen, just hidden, waiting to be "recovered" for a hero’s reward.', type: 'evidence' },
      { id: 'clue40', description: 'The final burner message, sent after the first arrest: "The world has its Fox. Now we collect, and disappear. — V."', type: 'dialogue' },
    ],
    canon_theory: null,
    theory_type: 'prediction',
    created_at: Date.now(),
  },
];

/** Ordered list of chapter ids that actually have content. */
export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);

/** Seed all chapters + start the submission phase. Safe to call more than once. */
export async function initializeStory(redis: RedisClient): Promise<void> {
  try {
    for (const chapter of CHAPTERS) {
      await setChapter(redis, chapter.id, chapter);
    }
    await setCurrentChapter(redis, CHAPTERS[0]!.id);
    // Start players in the submission phase so the loop is playable out of the box.
    await seedOpeningPhase(redis, CHAPTERS[0]!.id);
  } catch (error) {
    console.error('Failed to initialize story data:', error);
    throw error;
  }
}

/** Reset the game back to chapter 1, submission phase, with canon + submissions cleared. */
export async function resetStory(redis: RedisClient): Promise<void> {
  for (const chapter of CHAPTERS) {
    await setChapter(redis, chapter.id, { ...chapter, canon_theory: null });
    await clearChapterAuthors(redis, chapter.id);
  }
  await setCurrentChapter(redis, CHAPTERS[0]!.id);
  await seedOpeningPhase(redis, CHAPTERS[0]!.id);
}
