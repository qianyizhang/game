# Night Passage

A desktop browser action roguelite with an original cast of gods and a lightweight 2.5D arena and retained Canvas view. Select **Night Passage** in the workshop picker, or open `/?game=night-passage` after `npm run dev`.

The lightweight first release implements the full run loop. It is an original study, not a reproduction of Hades. Legal-command simulations establish campaign playability; human difficulty, combat feel and commercial-game polish are separate judgments.

## A passage

Choose one of five weapons and up to two unlocked runes at the Lantern Quay. Cross four regions, each with eight chambers and a guardian in the final chamber. Choose announced rewards at forks: blessings, gold, vitality, upgrades, a harder optional trial, a market or a healing spring. Defeat the Unlit Sovereign to escape.

| Region          | Guardian        | Encounter character                    |
| --------------- | --------------- | -------------------------------------- |
| Root Sepulcher  | Bellwarden      | Hunters, archers, thorn circles        |
| Drowned Archive | Undertow        | Hunters, archers, witches, tidal vents |
| Cinder Court    | Ash Regent      | Brutes, witches, archers, flame wells  |
| Starless Gate   | Unlit Sovereign | Mixed enemies and void seals           |

Combat routes also announce their terrain: **Open Court** has twin cover pillars, **Long Gallery** separates firing lanes, **Broken Islands** creates diagonal approaches, and **Four-way Crossing** frames intersecting lanes. Adjacent combat chambers offer different layouts. Cover and hazard sites stay fixed through every wave, while reinforcements enter away from your current position. Markets, springs and guardian arenas keep their dedicated arrangements.

The Bellwarden uses a facing sweep, targeted roots and a projectile wheel. The Undertow charges a marked lane, fires split currents and creates a ring with a safe center. The Ash Regent crosses the arena with fire lanes, rains embers and fans projectiles. The Unlit Sovereign combines crossed lanes, starfall, a hollow pulse and a denser wheel. Below half health guardians accelerate and summon support.

Thorns hinder movement, tides push you away, flame wells deliver a short heavy eruption, and void seals pull toward their damaging centers. Warnings precede activation. Dodging escapes the movement effects as well as preventing damage.

## Controls

| Action   | Input                  |
| -------- | ---------------------- |
| Move     | WASD / arrow keys      |
| Aim      | Mouse                  |
| Attack   | Hold left click or J   |
| Special  | Hold right click or K  |
| Dodge    | Space / Shift          |
| Cast     | Q                      |
| God call | R                      |
| Pause    | Escape or Pause button |

Click the arena to focus keyboard controls. A dodge briefly prevents damage; attacking during it changes to the weapon's dash move. Orange marks announce enemy strikes. Pillars block shots and direct weapon strikes. Casts hold three charges and replenish over time. A call requires its boon and a full meter, charged through combat.

During combat, the dodge hint below the arena shows **Ready**, **Dodging**, or
**Ready in … s**, with a recovery bar. It follows combat time, freezes while
paused, and restores with your save. The pale ring around the player shows damage
protection; it does not indicate dodge readiness.

Beside **Q**, the cast display shows available charges and the combat-time countdown
to the next charge (four seconds, or three with the Well rune). Beside **R**, the
call display shows **No call equipped**, **Charging …%**, or **Charged**. Charging
requires combat; a full meter still needs a call boon. These displays freeze while
paused and restore with your save. Charges describe available resources; a cast or
call still waits for the current attack's windup and recovery to finish.

The **Sound** toggle enables weapon-themed impacts and distinct damage, dodge, defeat and chamber-clear cues. Turning it off immediately stops active sounds. All warnings remain visible with sound off. The game pauses when the window loses focus or the tab becomes hidden. A reloaded combat save begins paused. The page fits narrow screens, but touch combat controls are not implemented.

## Weapons, runes and patrons

| Weapon         | Role                                                                 |
| -------------- | -------------------------------------------------------------------- |
| Dawnless Edge  | Cleave combo and wide circular special                               |
| Wayfarer       | Long narrow thrusts and piercing thrown lance                        |
| Oathkeeper     | Knockback bashes and a rushing special with directional windup guard |
| Far Lantern    | Deliberate arrows and a five-arrow fan                               |
| Ember Knuckles | Fast close punches and a rushing uppercut                            |

All five weapons are available immediately. Starting runes provide maximum health, quicker dodges or cast recovery. Clearing guardians unlocks low-health damage, dash-attack damage and room-clear healing runes for later passages.

Five patrons offer blessings for attack, special, dash, cast and call. Their casts differ: a fast piercing lightning bolt, three spreading waves, a slow explosive fire orb, five frost shards, and a short shadow rush. Their calls provide differently sized divine bursts or a powerful directional shadow rush. A different blessing in an occupied slot replaces it. Taking the same blessing increases its level, up to five. Aster chains lightning; Neris pushes enemies into walls; Vesta burns; Isen slows and shatters; Nyra exposes targets to subsequent damage.

Ordinary audiences offer three different blessing slots, with an empty action slot included while your loadout is unfinished. An eligible duo can occupy one choice. Memory shrines instead offer rank-ups for blessings you already carry.

Three duo blessings require both named patrons to remain equipped: Boiling Wake (tide/cinder), Frozen Conductor (storm/winter), and Eclipse Fire (veil/cinder). Replacing the last qualifying boon removes a dependent duo. Duos have fixed strength and are excluded from upgrade rewards; regular boons can reach level five.

## Economy and persistence

New chronicles offer **Standard**, **Veteran** and **Ordeal** before a passage.
Veteran adds marked hunter pursuit, flanking, faster enemy recovery and reduced
healing. Ordeal applies stronger pressure. Orange warnings still describe the
actual danger, and difficulty stays fixed for the passage. Human controls are
unchanged; agent perception/control presets are a separate experiment setting.

Your score earns **100 per cleared combat chamber**, **10,000 for escape**, and an
escape speed bonus: `floor(2000 × 600 / (600 + combatSeconds))`. It gives 1,000 extra
points at ten combat minutes. Combat time includes an agent's control delays;
pauses and menus do not count. A failed passage retains chamber points without a
speed bonus. Safe stops, kills, gold and ash award no score. Returning to the quay
closes the score; the next passage starts at zero.

Original rules-4 chronicles keep their original Standard gameplay and scoring,
and remain importable, resumable and watchable. Start a new chronicle to use the
new difficulty tiers and speed score. Agents use the
[local agent interface](../engineering/night-passage-agent.md).

Kills and coin rooms yield gold. Each market sells one healing purchase (35 gold), one vitality purchase (60), and one blessing (80). Trials add an extra wave and stronger enemies in exchange for a blessing and 80 gold. On Standard, a fountain restores 35 health and entering a guardian chamber restores 25. Veteran/Ordeal reduce room and market healing to 80%/65%, rounded; Mercy's three-health room-clear effect stays unchanged.

Room clears and guardians yield ash. Escape, death or voluntary retirement ends the passage; returning to the quay banks its ash exactly once. Spend ash on three ranks of permanent vitality, each adding 10 starting maximum health. Temporary gold and blessings reset on the next passage.

The chronicle autosaves locally during combat and after decisions. Export/import carries the seed, rules/content versions and accepted commands, including previous quay decisions. Invalid or incompatible imports do not replace the current game. An unreadable stored save is preserved until explicit replacement. Browser storage failure leaves play available and displays an export warning.

Chronicles are bounded to 300,000 packed commands, four hours of requested simulation ticks, and 24 MB on import. Realtime inputs use a compact lossless format. **New chronicle** asks for a seed and downloads the current history before resetting all progression. When an unreadable original is preserved, reset downloads that original separately as well as the current playable history. **Download original save** also preserves unreadable or incompatible bytes without resetting. Automatic saving remains visibly paused while original bytes are protected. Rules-5/content-4 adds recorded difficulty tiers and speed scoring. Rules-4/content-3 histories retain their original gameplay and score; rules-1/2/3 histories are rejected explicitly. Their original bytes remain downloadable; continuing with the new rules requires a new chronicle or a compatible import. Browser quotas can still prevent autosave, so retain portable exports for long histories.

See [engineering and extension points](../engineering/night-passage.md) for ownership and verification.

### Watch a recorded passage

Choose **Watch replay**, then **Open replay** to select an exported chronicle.
The spectator replays its recorded actions from the beginning in 2.5D or 2D,
with play/pause, 1×–8× speed, a seek bar, restart and **Show result**. It never
writes to your normal game save. **Import** remains the separate action for
restoring a chronicle as your playable session.

Replay time counts recorded requested combat ticks; decisions happen immediately
and any unused ticks at a chamber ending remain on the timeline. It is not the
agent process's wall-clock runtime. Switching browser tabs suspends playback.

## Arena views

**2.5D view** is the default: an angled arena with raised columns, shadows, an authored hero and five weapons. Movement keys follow screen directions; point at the ground location you want to attack. The bright ring marks your character's actual ground position. Columns fade when they obscure actors or active warnings. **2D view** retains the original flat presentation. Changing views pauses combat and preserves your passage; the preference is saved separately from your chronicle.

If 2.5D graphics become unavailable, the game pauses in 2D so you can continue or export. Reduced-motion settings suppress cosmetic character sway while retaining attacks and warning timing. The hero, weapons, ordinary enemies and all four guardians have authored assets. Root Sepulcher has an authored stone-and-root room kit; Drowned Archive adds ink-blue paving, recessed shelves and aqua lanterns. Cinder Court has basalt paving, copper furnace monuments and open braziers. Starless Gate adds midnight paving, an open limestone arch, slotted columns and cold crystal lamps.

### Read the light marks

In 2.5D, enemy projectiles are coral diamonds with a pale core. Friendly patron
marks differ in contour as well as color: Aster has a bolt, Neris two waves,
Vesta a flame, Isen a pointed shard and Nyra an eye. A patron crest announces
cast/call windup; the wider, heavier ring denotes a call. Nyra's cast and call
are rushing strikes rather than projectiles.

Small flame, frost and eye marks around an enemy indicate scorch, chill and
exposure. They remain visible together, including during the enemy's hit flash.
A broken pale ring around the player indicates damage immunity, including the
brief protection after a hit or call. It does not promise immunity to movement
effects. Dash chevrons show direction; hit sparks, expanding bursts, slash arcs
and healing crosses distinguish transient outcomes. These light marks are
presentation symbols; orange threat footprints still define announced danger.

Patron, rune, weapon and reward symbols accompany choices and the build sidebar.
A duo shows both patrons. Read the accompanying text for slot, rank, effect,
price and replacement details; the symbols do not replace those labels.
