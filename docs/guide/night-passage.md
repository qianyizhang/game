# Night Passage

A desktop browser action roguelite with an original cast of gods and a lightweight Canvas presentation. Select **Night Passage** in the workshop picker, or open `/?game=night-passage` after `npm run dev`.

The lightweight first release implements the full run loop. It is an original study, not a reproduction of Hades. Legal-command simulations establish campaign playability; human difficulty, combat feel and commercial-game polish are separate judgments.

## A passage

Choose one of five weapons and up to two unlocked runes at the Lantern Quay. Cross four regions, each with eight chambers and a guardian in the final chamber. Choose announced rewards at forks: blessings, gold, vitality, upgrades, a harder optional trial, a market or a healing spring. Defeat the Unlit Sovereign to escape.

| Region          | Guardian        | Encounter character                    |
| --------------- | --------------- | -------------------------------------- |
| Root Sepulcher  | Bellwarden      | Hunters, archers, thorn circles        |
| Drowned Archive | Undertow        | Hunters, archers, witches, tidal vents |
| Cinder Court    | Ash Regent      | Brutes, witches, archers, flame wells  |
| Starless Gate   | Unlit Sovereign | Mixed enemies and void seals           |

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

Sound cues accompany hits, dodges, kills and rewards; use **Sound on/off** to mute them. The game pauses when the window loses focus or the tab becomes hidden. A reloaded combat save begins paused. The page fits narrow screens, but touch combat controls are not implemented.

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

Three duo blessings require both named patrons to remain equipped: Boiling Wake (tide/cinder), Frozen Conductor (storm/winter), and Eclipse Fire (veil/cinder). Replacing the last qualifying boon removes a dependent duo. Duos have fixed strength and are excluded from upgrade rewards; regular boons can reach level five.

## Economy and persistence

Kills and coin rooms yield gold. Each market sells one healing purchase (35 gold), one vitality purchase (60), and one blessing (80). Trials add an extra wave and stronger enemies in exchange for a blessing and 80 gold. A fountain restores 35 health; entering a guardian chamber restores 25.

Room clears and guardians yield ash. Escape, death or voluntary retirement ends the passage; returning to the quay banks its ash exactly once. Spend ash on three ranks of permanent vitality, each adding 10 starting maximum health. Temporary gold and blessings reset on the next passage.

The chronicle autosaves locally during combat and after decisions. Export/import carries the seed, rules/content versions and accepted commands, including previous quay decisions. Invalid or incompatible imports do not replace the current game. An unreadable stored save is preserved until explicit replacement. Browser storage failure leaves play available and displays an export warning.

Chronicles are bounded to 300,000 packed commands, four hours of requested simulation ticks, and 24 MB on import. Realtime inputs use a compact lossless format. **New chronicle** asks for a seed and downloads the current history before resetting all progression. When an unreadable original is preserved, reset downloads that original separately as well as the current playable history. **Download original save** also preserves unreadable or incompatible bytes without resetting. Automatic saving remains visibly paused while original bytes are protected. Rules/content version 2 rejects the earlier prototype replay explicitly; it never silently changes its meaning. Browser quotas can still prevent autosave, so retain portable exports for long histories.

See [engineering and extension points](../engineering/night-passage.md) for ownership and verification.
