export type StudyId =
  | 'nightjar'
  | 'catalyst'
  | 'phoenix'
  | 'hydra'
  | 'spiral'
  | 'vajra'
  | 'prowler'
  | 'wolf'
  | 'matriarch'
  | 'thornstag'
  | 'moonmoth'
  | 'bogtoad'
  | 'crocolisk'
  | 'scavenger'
  | 'guardian'
  | 'tortoise'
  | 'stormroc'
  | 'stray'
  | 'packcaller'
  | 'cub'
  | 'amalgam'
  | 'imp'
  | 'matron'
  | 'juggler'
  | 'watcher'
  | 'herald'
  | 'patron'
  | 'squire'
  | 'bannerbearer';
export type Study = {
  id: StudyId;
  name: string;
  family: string;
  material: string;
  accent: string;
  description: string;
  details: [string, string, string];
};
export const STUDIES: Study[] = [
  {
    id: 'nightjar',
    name: 'Nightjar',
    family: 'BLINDSIDE / JOKER',
    material: 'Dusk plumage · ash, umber & pale throat',
    accent: '#c69b57',
    description:
      'A dusk-plumaged nightjar crouches along a rising branch, listening with its small bill turned toward the open air. Layered folded wings follow the body into a descending tail, above short toes wrapped around the bark.',
    details: [
      'Listening posture & fitted folded wings',
      'Continuous crown, chest & layered plumage',
      'Head turn, brief blink & quiet feather response',
    ],
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    family: 'SLAY THE SPIRE / SILENT',
    material: 'Smoked glass · olive tincture · copper',
    accent: '#a9cb89',
    description:
      'A flattened glass decanter and a slender sample vial. Fitted copper collars and a suspended seal surround a dark olive tincture, with the liquid level visible through the glass.',
    details: [
      'Thin glass & distinct meniscus',
      'Rising bubbles in both vessels',
      'Fitted copper & a slender sample vial',
    ],
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    family: 'LAST HEARTH / ELEMENTAL',
    material: 'Ember plumage · charcoal vanes · warm ochre',
    accent: '#e39a61',
    description:
      'A living firebird settles from a wing stretch, lifting its breast as unequal wings open around it. Ember plumage turns to charcoal at the long flight feathers; a falling tail answers the sweep above a firm basalt grip.',
    details: [
      'Connected wings & overlapping flight planes',
      'Living breast, fitted bill & swept crest',
      'Rooted grip, neck turn & delayed tail motion',
    ],
  },
  {
    id: 'hydra',
    name: 'Hydra',
    family: 'LAST HEARTH / BEAST',
    material: 'Moss scales · weathered horn · living anatomy',
    accent: '#9daa89',
    description:
      'An ancient marsh predator gathers its weight into a heavy coil. Three armored necks rise in opposing gestures: one searches, one watches, one bares its teeth. Worn horn crowns, hooded amber eyes and a pale plated throat frame the living skin.',
    details: [
      'Rooted coil & independently bending necks',
      'Horn crowns, recessed eyes & hinged jaws',
      'Layered scales, worn keratin & watchful motion',
    ],
  },
  {
    id: 'prowler',
    name: 'Prowler',
    family: 'LAST HEARTH / BEAST',
    material: 'Forest coat · muted rosettes · amber eyes',
    accent: '#97ad8b',
    description:
      'The Alley Prowler pauses in a low stalk. A reaching forepaw and compressed haunch carry its weight beneath a turned, watchful head; the long tail curves behind the quiet forest coat.',
    details: [
      'Connected shoulders, tucked flank & grounded paws',
      'Recessed amber eyes, short muzzle & rounded ears',
      'Listening head turn, ear flick & delayed tail tip',
    ],
  },
  {
    id: 'wolf',
    name: 'Wolf',
    family: 'LAST HEARTH / BEAST',
    material: 'Greatwood guardian · forest coat · branching antlers',
    accent: '#b5b692',
    description:
      'The Greatwood Wolf stands listening at the forest edge. Its lifted muzzle and unequal antler branches rise above a pale throat ruff, while a heavy brush tail follows the descending back.',
    details: [
      'Standing weight, long muzzle & pointed ears',
      'Pale throat ruff & naturally joined antler forks',
      'Listening head, ear turn & slow brush-tail response',
    ],
  },
  {
    id: 'matriarch',
    name: 'Matriarch',
    family: 'LAST HEARTH / BEAST',
    material: 'Briar guardian · umber coat · pale muzzle',
    accent: '#b6a17a',
    description:
      'The Briar Matriarch braces her weight behind a lowered, watchful head. High shoulders descend into a broad back, while staggered forepaws and exposed claws hold the ground beneath her warm umber coat.',
    details: [
      'Shoulder hump, low reach & planted bear paws',
      'Rounded ears, broad muzzle & recessed eyes',
      'Quiet scenting motion, listening ears & blink',
    ],
  },
  {
    id: 'thornstag',
    name: 'Thornstag',
    family: 'LAST HEARTH / BEAST',
    material: 'Dun coat · pale throat · thornlike antlers',
    accent: '#b9a270',
    description:
      'The Thorn Stag halts at a sound, holding one forehoof above the ground. A turned head and broad, unequal antler crown rise over the pale throat, while long legs and a narrow flank keep the stance light.',
    details: [
      'Halted step, lifted forehoof & cloven supports',
      'Wide thorn crown, long ears & pale throat',
      'Listening head turn, ear response & tail flick',
    ],
  },
  {
    id: 'moonmoth',
    name: 'Moonmoth',
    family: 'LAST HEARTH / BEAST',
    material: 'Sage wings · moon eyespots · ivory down',
    accent: '#b9c6a2',
    description:
      'The Moon Moth rests on a rising twig, opening unequal wing planes into the night. Ringed eyespots sit within pale sage membranes; long hindwing tails curve beneath the body while feathered antennae reach above the ivory thorax.',
    details: [
      'Four curved wings & trailing hindwing tails',
      'Feathered antennae, ringed eyespots & six clasping legs',
      'Rooted perch, quiet wing flex & delayed tail response',
    ],
  },
  {
    id: 'bogtoad',
    name: 'Bogtoad',
    family: 'LAST HEARTH / BEAST',
    material: 'Moss skin · pale jaw · amber eyes',
    accent: '#afbd89',
    description:
      'The Bog Toad watches from a low, folded crouch. Unequal forefeet brace its broad pale jaw, while compact haunches gather behind raised amber eyes and a moss-green back.',
    details: [
      'Broad jaw, raised eyes & short neckless body',
      'Folded haunches, staggered hands & slender toes',
      'Quiet throat breath, slight head response & blink',
    ],
  },
  {
    id: 'crocolisk',
    name: 'Crocolisk',
    family: 'LAST HEARTH / BEAST',
    material: 'Ancient armor · pale jaw · worn ivory',
    accent: '#adb58a',
    description:
      'The Ancient Crocolisk holds a low watch, its long jaw turned across staggered forefeet. A broad armored back narrows into a muscular tail curling behind the crouch; raised amber eyes follow the bank above a pale, toothed mouth.',
    details: [
      'Long low skull, hooded eyes & fitted jaw hinge',
      'Staggered feet, dorsal armor & curling tail',
      'Small head turn, jaw response & delayed tail movement',
    ],
  },
  {
    id: 'scavenger',
    name: 'Scavenger',
    family: 'LAST HEARTH / BEAST',
    material: 'Briar hyena · spotted dun coat · dark mane',
    accent: '#b8ad81',
    description:
      'The Briar Scavenger pauses after scenting, turning a broad head toward a sound. Heavy forequarters descend into leaner hips beneath a short dark mane; staggered paws brace the spotted dun coat while rounded ears listen independently.',
    details: [
      'High shoulders, sloping back & strong jaw',
      'Rounded ears, spotted coat & short brush tail',
      'Scenting head turn, listening ears & delayed tail response',
    ],
  },
  {
    id: 'guardian',
    name: 'Guardian',
    family: 'LAST HEARTH / BEAST',
    material: 'Nest guardian · grey-brown fur · warm bare skin',
    accent: '#b6a58b',
    description:
      'The Nest Guardian rises into a listening pause, balancing a pointed, whiskered muzzle above heavy hindquarters. Unequal forepaws gather near the pale chest while broad ears turn and a long tapering tail curves around the stance.',
    details: [
      'Raised listening pose & grounded hind feet',
      'Pointed muzzle, rounded ears & fitted whiskers',
      'Quiet head turn, ear response & tail-tip follow',
    ],
  },
  {
    id: 'tortoise',
    name: 'Tortoise',
    family: 'LAST HEARTH / BEAST',
    material: 'Ancient shell · worn olive scutes · pale skin',
    accent: '#b4b18a',
    description:
      'The Ancient Tortoise pauses beneath a high olive shell, its low head turned beyond staggered forefeet. Broad scutes meet a worn ochre rim while heavy scaled limbs brace the quiet dome above a fitted lower shield.',
    details: [
      'High domed shell, broad scutes & worn rim',
      'Low reaching head & staggered weight-bearing feet',
      'Small neck/head turn & brief watchful blink',
    ],
  },
  {
    id: 'stormroc',
    name: 'Stormroc',
    family: 'LAST HEARTH / ELEMENTAL',
    material: 'Storm plumage · pale throat · slate flight feathers',
    accent: '#91b5bc',
    description:
      'The Storm Roc braces on a low stone ledge, leaning into a gust beneath unequal raised wings. A hooked bill and pale throat lead the forward chest; broad slate-blue flight feathers and a short tail fan answer the reach.',
    details: [
      'Forward chest, hooked bill & rooted talons',
      'Unequal wing planes & overlapping flight feathers',
      'Shoulder flex, delayed wrist response & watchful head',
    ],
  },
  {
    id: 'stray',
    name: 'Stray',
    family: 'LAST HEARTH / BEAST',
    material: 'Briar canid · pale mask · quiet forest coat',
    accent: '#b5bf9b',
    description:
      'The Briar Stray pauses mid-step, holding one forepaw above the ground while a low muzzle turns toward a sound. Tall unequal ears, a pale mask and ragged throat frame the gaze; the lean body and low brush tail balance its cautious reach.',
    details: [
      'Hesitant step, lean flank & three grounded paws',
      'Long muzzle, cupped ears & pale throat',
      'Listening head turn, ear response & low tail follow',
    ],
  },
  {
    id: 'packcaller',
    name: 'Pack Caller',
    family: 'LAST HEARTH / BEAST',
    material: 'Pack caller · forest coat · worn leather & brass',
    accent: '#b7ae84',
    description:
      'The Pack Caller sits over folded haunches and raises its muzzle to call. Planted forepaws steady the rising chest; a low tail curls around the hip. A fitted leather collar and quiet brass pendant retain the source illustration’s identifying detail.',
    details: [
      'Seated calling gesture & folded haunches',
      'Lifted muzzle, pale throat & fitted collar',
      'Restrained head, jaw, ear & tail motion',
    ],
  },
  {
    id: 'bannerbearer',
    name: 'Banner Bearer',
    family: 'LAST HEARTH / HUMAN',
    material: 'Ochre woven standard · worn cloth · dark hair & pale bronze',
    accent: '#c7b386',
    description:
      'The Banner Bearer braces around a planted standard with two unequal grips. A bare face turns across the path beneath swept dark hair, while the ochre notched cloth answers with a small free-edge ripple.',
    details: [
      'Two-handed support & counterbalanced standing gesture',
      'Notched ochre banner, dark hair & fitted pale shoulder plates',
      'Listening head turn, eyelid blink & anchored cloth motion',
    ],
  },
  {
    id: 'squire',
    name: 'Squire',
    family: 'LAST HEARTH / HUMAN',
    material: 'Worn steel · woven linen · leather & painted wood',
    accent: '#b7b496',
    description:
      'The Hearth Squire braces behind a forward shield, the other hand holding a sheathed sword. A fitted steel helmet and narrow visor retain the original portrait; staggered boots, quiet cloth and worn shoulder plates extend it into a standing guard.',
    details: [
      'Shield-led defensive stance & grounded boots',
      'Closed helmet, real visor opening & fitted shoulder armor',
      'Restrained listening turn with anchored equipment',
    ],
  },
  {
    id: 'patron',
    name: 'Patron',
    family: 'LAST HEARTH / DEMON',
    material: 'Violet skin · swept ivory horns · dark tailored cloth',
    accent: '#b5a6c4',
    description:
      'The Abyssal Patron stands over staggered boots beneath broad swept horns. One palm extends toward the room while the other rests across a short dark coat; pale violet eyes and muted lapels retain the original portrait’s courtly character.',
    details: [
      'Heavy standing gesture & unequal hands',
      'Swept ivory horns, violet face & split-front coat',
      'Restrained neck/head response & fitted eyelids',
    ],
  },
  {
    id: 'herald',
    name: 'Herald',
    family: 'LAST HEARTH / DEMON',
    material: 'Pale ochre skin · curled horn · worn cloth & bronze',
    accent: '#c2a376',
    description:
      'The Infernal Herald leans toward a forked staff beneath inward-curled ram horns. A long pale face watches over an open addressing hand, while a russet robe falls around staggered boots.',
    details: [
      'Staff-supported stance & open addressing hand',
      'Inward-curled horns, pale face & forked bronze staff',
      'Restrained listening turn & fitted eyelid motion',
    ],
  },
  {
    id: 'watcher',
    name: 'Watcher',
    family: 'LAST HEARTH / DEMON',
    material: 'Dusty violet skin · amber eye · worn leather',
    accent: '#c2ae90',
    description:
      'The Pit Watcher leans forward beneath low curling horns, its single amber eye scanning the room. One heavy hand rests against the edge of a dark leather jerkin; the other hangs ready above staggered clawed feet.',
    details: [
      'Heavy listening stance & unequal hands',
      'Single hooded amber eye & low curling horns',
      'Quiet head turn, searching gaze & brief blink',
    ],
  },
  {
    id: 'juggler',
    name: 'Juggler',
    family: 'LAST HEARTH / DEMON',
    material: 'Dusk skin · pale horn · violet spirits',
    accent: '#baa0c4',
    description:
      'The Soul Juggler attends two violet spirits above unequal raised palms. A staggered stance and tilted chest carry a bat-eared face beneath curved pale horns; the wingless silhouette, hooded amber eyes and small fangs retain the source portrait’s character.',
    details: [
      'Staggered weight & open raised hands',
      'Bat ears, curved horns & two curled spirits',
      'Listening turn, blink & drifting spirit flames',
    ],
  },
  {
    id: 'matron',
    name: 'Matron',
    family: 'LAST HEARTH / DEMON',
    material: 'Plum robe · pale skin · worn bronze',
    accent: '#c5a79e',
    description:
      'The Imp Matron turns her long horned face toward an open palm, with the other hand gathering her robe. Dark hair falls around a pointed crown; folded plum cloth, narrow gold edges and a diamond pendant retain her portrait’s courtly character.',
    details: [
      'Standing weight shift & unequal hand gestures',
      'Long face, swept horns & dark hanging hair',
      'Quiet listening turn, blink & delayed hair response',
    ],
  },
  {
    id: 'imp',
    name: 'Imp',
    family: 'LAST HEARTH / DEMON',
    material: 'Coal imp · dusk skin · pale horn',
    accent: '#bd9297',
    description:
      'The Coal Imp leans into a low, attentive crouch, one cupped hand reaching forward. A broad bat-eared face, curled horns and small fangs rise between unequal folded wings; pale facial planes and a warm chest interrupt the dusk-plum skin.',
    details: [
      'Low crouch & unequal cupped hands',
      'Bat ears, curved horns & recessed amber eyes',
      'Listening head, ear response & fitted wing flex',
    ],
  },
  {
    id: 'amalgam',
    name: 'Amalgam',
    family: 'LAST HEARTH / ALL TRIBES',
    material: 'Wild chimera · moss skin · plum membranes',
    accent: '#aaa08b',
    description:
      'The Wild Amalgam crouches behind a reaching horned head. Unequal finger-supported wings fold over moss-green shoulders, while a blue tail curls around the staggered feet. A pale cranial ridge, long plum muzzle and fitted bronze chest plate retain the source portrait’s mixed character.',
    details: [
      'Low crouch, swept horn & long purple muzzle',
      'Unequal curved wings & thin scalloped membranes',
      'Watchful head, wrist flex & delayed curling tail',
    ],
  },
  {
    id: 'cub',
    name: 'Cub',
    family: 'LAST HEARTH / BEAST',
    material: 'Briar cub · warm coat · pale muzzle',
    accent: '#c5ae82',
    description:
      'The Briar Cub lowers its tilted head toward an outstretched forepaw. A short, rounded body rises to the hindquarters, while broad paws and unequal cupped ears carry a curious foraging gesture. Warm brown fur and a pale short muzzle retain the source illustration’s young-bear character.',
    details: [
      'Low reaching gesture & higher rump',
      'Round cranium, short muzzle & broad paws',
      'Small scenting head motion, ear response & blink',
    ],
  },
  {
    id: 'spiral',
    name: 'Spiral',
    family: 'BLINDSIDE / JOKER',
    material: 'Cream shell · umber growth bands',
    accent: '#d0b486',
    description:
      'An expanding shell whorl with a deep open aperture and restrained umber bands, held by a small asymmetric museum mount.',
    details: [
      'Expanding lenticular whorl',
      'Open aperture & double shell wall',
      'Slow rigid display oscillation',
    ],
  },
  {
    id: 'vajra',
    name: 'Vajra',
    family: 'SLAY THE SPIRE / RELIC',
    material: 'Aged brass · recessed bronze',
    accent: '#c5ad77',
    description:
      'An aged metal instrument with a fitted grip and pierced curved lobes. Continuous joined tips enclose quiet negative spaces at either end.',
    details: [
      'Fitted central grip',
      'Pierced lobes & continuous joined tips',
      'Slow rigid display oscillation',
    ],
  },
];

export const LOOP_SECONDS = 6;
export const MOTION_LABELS: Record<StudyId, string> = {
  bannerbearer: 'Banner bearer · brace, watch & carry',
  squire: 'Hearth squire · guard, glance & listen',
  patron: 'Abyssal patron · consider, address & settle',
  herald: 'Infernal herald · address, listen & settle',
  watcher: 'Pit watcher · scan, listen & settle',
  juggler: 'Soul juggler · attend, conjure & listen',
  matron: 'Imp matron · regard, listen & settle',
  imp: 'Coal imp · crouch, listen & flex',
  amalgam: 'Wild amalgam · guard, flex & watch',
  cub: 'Briar cub · reach, sniff & listen',
  packcaller: 'Pack caller · call, listen & settle',
  stray: 'Briar stray · hesitate, listen & scent',
  stormroc: 'Storm roc · brace, flex & watch',
  tortoise: 'Ancient tortoise · pause, turn & watch',
  guardian: 'Nest guardian · rise, listen & scent',
  scavenger: 'Briar scavenger · scent, listen & watch',
  crocolisk: 'Ancient crocolisk · watch, breathe & settle',
  bogtoad: 'Bog toad · breathe, blink & watch',
  moonmoth: 'Moon moth · open, settle & sense',
  thornstag: 'Thorn stag · halt, listen & turn',
  matriarch: 'Briar matriarch · scent, listen & guard',
  wolf: 'Greatwood wolf · listen, scent & watch',
  prowler: 'Living prowler · stalk, listen & watch',
  nightjar: 'Living nightjar · listen, blink & settle',
  catalyst: 'Alchemy · rising gas bubbles',
  phoenix: 'Living firebird · stretch, settle & watch',
  hydra: 'Living hydra · watch, breathe & threaten',
  spiral: 'Display study · slow rigid oscillation',
  vajra: 'Display study · slow rigid oscillation',
};
