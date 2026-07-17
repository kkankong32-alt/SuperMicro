/* ===== 슈퍼 마이크로 — level data & builder =====
   Grid: 18 rows tall. Segments are BOTTOM-ALIGNED: you write only the lower rows and
   seg() pads empties on top, so every segment's ground lines up by construction.
   Ground occupies rows 15,16,17 (top surface y = 240). Device anchors sit at row 14.

   Legend
     .  empty            #  solid          =  semi-solid platform   B  brick
     ?  capsule block    S  spore block    D  data block            H  hidden block
     o  orb              *  big orb        M  mushroom bounce       b  bubble bounce
     P  pipe top         p  pipe body      C  checkpoint            F  goal core
     @  spawn            X  h-moving plat  Y  v-moving plat         Z  falling plat
     ~  hyphae rope      G  device anchor  g  device anchor 2
     w  current right    W  current left
     1 spore blob  2 mold ball  3 falling wood  4 droplet  5 red tide  6 data error  7 overgrowth
*/
(function (W) {
'use strict';

var H = 18;

function seg(rows) {
  var w = 0, i;
  for (i = 0; i < rows.length; i++) w = Math.max(w, rows[i].length);
  var blank = new Array(w + 1).join('.');
  var out = [];
  for (i = 0; i < H - rows.length; i++) out.push(blank);
  for (i = 0; i < rows.length; i++) {
    var r = rows[i];
    while (r.length < w) r += '.';
    out.push(r);
  }
  if (out.length !== H) throw new Error('seg height ' + out.length);
  return out;
}
function join(segs) {
  var out = [];
  for (var r = 0; r < H; r++) {
    var line = '';
    for (var s = 0; s < segs.length; s++) line += segs[s][r];
    out.push(line);
  }
  return out;
}
var GND = ['################', '################', '################'];
function g(n) { var s = new Array(n + 1).join('#'); return [s, s, s]; }

/* ============================================================
   STAGE 1 — 균류 숲
   Opening mirrors SMB 1-1's teaching order:
   risk-free walking -> lone reward block -> approaching enemy ->
   constrained geometry -> escalate one variable -> first pit.
   ============================================================ */
var S1 = {
  id: 's1', world: 'fungi', name: '균류 숲',
  tiles: 'fungi', tiles2: 'fungi_dark',
  bg: 'bg_fungi', music: 'explore', amb: 'fungi',
  intro: {
    eyebrow: 'STAGE 1', title: '균류 숲',
    note: '비가 그친 뒤의 버섯 숲이에요. 버섯과 곰팡이는 실처럼 가늘고 긴 균사로 이루어진 균류예요. 숲 끝의 균류 코어를 찾아 주세요.',
    art: 'loading_fungi_zone'
  },
  rows: join([
    /* 1. only walking is possible */
    seg(['.@..............'].concat(GND)),
    /* 2. one lone capsule block, reachable with a plain standing jump */
    seg([
      '.....?......',
      '............',
      '............',
      '............',
      '############',
      '############',
      '############'
    ]),
    /* 3. first enemy approaches; ceiling row teaches that geometry matters */
    seg([
      '....BBBB....',
      '............',
      '...?B?B?....',
      '............',
      '............',
      '.........1..',
      '............',
      '############',
      '############',
      '############'
    ]),
    /* 4. mushroom bounce over safe ground */
    seg([
      '.......o.o..',
      '............',
      '......o.o...',
      '............',
      '......M.....',
      '............',
      '############',
      '############',
      '############'
    ]),
    /* 5. escalate a single variable: step height */
    seg([
      '..........oo....',
      '.........=====..',
      '......o.........',
      '.....===........',
      '..o.............',
      '.===......1.....',
      '################',
      '################',
      '################'
    ]),
    /* 6. first pit */
    seg([
      '....oo....',
      '..........',
      '..........',
      '####..####',
      '####..####',
      '####..####'
    ]),
    /* 7. hidden block reveals a step up to a big orb */
    seg([
      '.......*....',
      '......===...',
      '............',
      '...H........',
      '.......o....',
      '............',
      '......1.....',
      '############',
      '############',
      '############'
    ]),
    /* 8. bonus pipe -> microscope observation room */
    seg([
      '..o.o.....',
      '..........',
      '.....PP...',
      '#####pp###',
      '#####pp###',
      '#####pp###'
    ]),
    /* 9. rolling mold ball + gap */
    seg([
      '.....oo.....',
      '....====....',
      '............',
      '..2.........',
      '............',
      '............',
      '####...#####',
      '####...#####',
      '####...#####'
    ]),
    /* 10. checkpoint */
    seg(['....C.....', '..........', '..........'].concat(g(10))),
    /* 11. falling rotten wood under a bark ceiling */
    seg([
      '.BBBBBBBBBBB.',
      '.............',
      '...3.....3...',
      '.............',
      '.....o.o.....',
      '.............',
      '.............',
      '#############',
      '#############',
      '#############'
    ]),
    /* 12. REQUIRED MISSION: humidity + ventilation -> a hyphae bridge grows */
    seg([
      '........................',
      '........................',
      '..G.....g...............',
      '##########..............',
      '##########..............',
      '##########..............'
    ]),
    /* 13. landing */
    seg(['....oo....', '..........', '..........'].concat(g(10))),
    /* 14. moving platforms over a pit */
    seg([
      '...*......',
      '..........',
      '..X....X..',
      '..........',
      '..........',
      '###....###',
      '###....###',
      '###....###'
    ]),
    /* 15. stepped climb with blobs */
    seg([
      '..........oo....',
      '.........=====..',
      '.......1........',
      '.....=====......',
      '..o.............',
      '..===...........',
      '...........1....',
      '................',
      '################',
      '################',
      '################'
    ]),
    /* 16. dead-wood wall — too tall to jump (7 tiles); decomposition opens it */
    seg([
      '.....BB..',
      '.....BB..',
      '.....BB..',
      '.....BB..',
      '..o..BB..',
      '.....BB..',
      '.....BB..',
      '#########',
      '#########',
      '#########'
    ]),
    /* 17. goal */
    seg([
      '...o.o.o....',
      '............',
      '......F.....',
      '............',
      '############',
      '############',
      '############'
    ])
  ]),
  warps: { 0: { to: 'b1', kind: 'bonus' } },
  devices: {
    /* One console opens the mission. The vent tower used to carry mission:'humidity'
       too, which made it a second, redundant start button for the same popup — and
       once the mission was done it went inert and read as scenery. It is now a
       STATUS device: no mission of its own, it just shows what the console did. */
    G: { kind: 'humidity', img: 'obj_humidity_regulator', w: 22, h: 24, mission: 'humidity' },
    g: { kind: 'vent', img: 'obj_ventilation_tower', w: 15, h: 28, status: 'vent' }
  },
  bridge: true,
  goal: {
    title: '균사 다리를 만들어 끊어진 길을 이으세요.',
    how: '빛나는 초록 화살표 장치에서 ↓(또는 S)를 누르세요.',
    next: '오른쪽 길이 이어져요.',
    total: 0,
    hints: ['오른쪽으로 계속 가면 빛나는 장치가 있어요.',
            '장치 바로 위에 서서 아래 방향키를 눌러 보세요.',
            '균류는 따뜻하고 습한 곳에서 잘 자라요.']
  },
  facts: [
    '버섯과 곰팡이는 균사로 이루어진 균류예요.',
    '균류는 포자로 번식하고 따뜻하고 습한 곳에서 잘 자라요.',
    '죽은 생물을 분해하지만 음식도 상하게 할 수 있어요.'
  ],
  clearImg: 'impact_decaying_log',
  badge: 'badge_fungi_researcher',
  core: 'fungi'
};

var B1 = {
  id: 'b1', world: 'fungi', name: '균류 관찰실', sub: true,
  tiles: 'fungi_dark', bg: 'bg_fungi', music: 'lab', amb: null,
  rows: join([seg([
    '..........................',
    '.@.....o.o.o.o......G.....',
    '..........................',
    '.......=======............',
    '..........................',
    '..................PP......',
    '##################pp######',
    '##################pp######',
    '##################pp######'
  ])]),
  warps: { 0: { to: 'exit', kind: 'exit' } },
  devices: { G: { kind: 'scope', img: 'obj_scan_beacon', w: 16, h: 26, mission: 'scope_fungi' } }
};

/* ============================================================
   STAGE 2 — 원생생물 연못
   ============================================================ */
var S2 = {
  id: 's2', world: 'protist', name: '원생생물 연못',
  tiles: 'protist', tiles2: 'protist_deep',
  bg: 'bg_protist', music: 'explore', amb: 'protist',
  water: true,
  intro: {
    eyebrow: 'STAGE 2', title: '원생생물 연못',
    note: '한 방울의 연못물 속이에요. 해캄과 짚신벌레 같은 생물을 원생생물이라고 해요. 오염 물질이 흘러드는 곳을 찾아 물을 되살려 주세요.',
    art: 'loading_protist_zone'
  },
  rows: join([
    seg(['.@..........$...'].concat(GND)),
    /* bubbles teach the floatier feel, safely */
    seg([
      '.......o.o......',
      '................',
      '......o...o.....',
      '................',
      '.......b........',
      '................',
      '################',
      '################',
      '################'
    ]),
    /* 해캄 strands = climbable ropes */
    seg([
      '....~....~......',
      '....~....~......',
      '....~....~..o...',
      '....~....~......',
      '....~....~......',
      '..o.~..o.~......',
      '....~....~......',
      '................',
      '.......4........',
      '################',
      '################',
      '################'
    ]),
    /* current pushes right — the flow sits at body height so it actually shoves you,
       and the pit stays inside a walking jump (3 tiles) because the push is constant */
    seg([
      '....o..o..o.....',
      '................',
      'wwwwwwwwwwwwwwww',
      'wwwwwwwwwwwwwwww',
      '######...#######',
      '######...#######',
      '######...#######'
    ]),
    /* 3-tile pit: clearable with a plain walking jump. The bubble only exists to
       fling you up to the big orb — it is never required to cross. */
    seg([
      '.....*..........',
      '................',
      '......b.........',
      '................',
      '................',
      '######...#######',
      '######...#######',
      '######...#######'
    ]),
    /* bonus pipe — flat, no pit; the droplet sits away from the pipe mouth */
    seg([
      '.4.o.o....',
      '..........',
      '..........',
      '.....PP...',
      '#####pp###',
      '#####pp###',
      '#####pp###'
    ]),
    seg(['....C.....', '..........', '..........'].concat(g(10))),
    /* pollution begins — first valve */
    seg([
      '..............',
      '..............',
      '.....G........',
      '..............',
      '...4......4...',
      '..............',
      '..............',
      '##############',
      '##############',
      '##############'
    ]),
    /* red tide drifts above; the moving platforms sit just above floor height
       so stepping on is a hop, not a leap of faith */
    seg([
      '......5.......',
      '..............',
      '..............',
      '..............',
      '.....5........',
      '..............',
      '...X.....X....',
      '###........###',
      '###........###',
      '###........###'
    ]),
    /* second valve on a ledge; a droplet guards the corridor into the last valve */
    seg([
      '..............',
      '.....===......',
      '.....G........',
      '..o...........',
      '.====.........',
      '..............',
      '...4.....5....',
      '..............',
      '##############',
      '##############',
      '##############'
    ]),
    /* third valve beside the contamination pipe */
    seg([
      '...............',
      '...............',
      '......G........',
      '...............',
      '...g...........',
      '....4.....4....',
      '...............',
      '###############',
      '###############',
      '###############'
    ]),
    /* climb */
    seg([
      '.........o..',
      '........===.',
      '............',
      '.....o......',
      '....===.....',
      '............',
      '..o.........',
      '.===........',
      '............',
      '............',
      '############',
      '############',
      '############'
    ]),
    seg([
      '....*.....',
      '..........',
      '...b......',
      '..........',
      '..........',
      '###....###',
      '###....###',
      '###....###'
    ]),
    seg([
      '...o.o.o....',
      '............',
      '......F.....',
      '............',
      '############',
      '############',
      '############'
    ])
  ]),
  warps: { 0: { to: 'b2', kind: 'bonus' } },
  devices: {
    G: { kind: 'valve', img: 'obj_water_purification_valve', w: 18, h: 20, mission: 'valves' },
    g: { kind: 'cpipe', img: 'obj_contamination_pipe', w: 26, h: 16, deco: true }
  },
  valveCount: 3,
  goal: {
    title: '오염 물질이 들어오는 밸브를 모두 잠그세요.',
    how: '빛나는 밸브 장치 위에서 ↓(또는 S)를 누르세요.',
    next: '붉은 물이 맑아져요.',
    total: 3,
    hints: ['빛나는 장치를 찾아 오른쪽으로 나아가세요.',
            '적조 덩어리를 없앨 필요는 없어요. 오염 원인을 막으면 돼요.',
            '장치 바로 위에 서서 아래 방향키를 눌러 보세요.']
  },
  facts: [
    '해캄과 짚신벌레 같은 생물을 원생생물이라고 해요.',
    '원생생물은 주로 논, 연못, 하천처럼 물이 있는 곳에서 살아요.',
    '일부 원생생물이 지나치게 늘어나면 적조 피해가 생길 수 있어요.'
  ],
  clearImg: 'impact_red_tide',
  badge: 'badge_protist_researcher',
  core: 'protist'
};

var B2 = {
  id: 'b2', world: 'protist', name: '연못물 관찰실', sub: true,
  tiles: 'protist_deep', bg: 'bg_protist', music: 'lab', amb: null,
  rows: join([seg([
    '..........................',
    '.@.....o.o.o.o......G.....',
    '..........................',
    '.......=======............',
    '..........................',
    '..................PP......',
    '##################pp######',
    '##################pp######',
    '##################pp######'
  ])]),
  warps: { 0: { to: 'exit', kind: 'exit' } },
  devices: { G: { kind: 'scope', img: 'obj_scan_beacon', w: 16, h: 26, mission: 'scope_protist' } }
};

/* ============================================================
   STAGE 3 — 세균 데이터 도시
   ============================================================ */
var S3 = {
  id: 's3', world: 'bacteria', name: '세균 데이터 도시',
  tiles: 'bacteria', tiles2: 'purify',
  bg: 'bg_bacteria', music: 'explore', amb: 'bacteria',
  intro: {
    eyebrow: 'STAGE 3', title: '세균 데이터 도시',
    note: '세균은 균류나 원생생물보다 훨씬 작아 맨눈으로 관찰하기 어려워요. 멈춰 버린 발효 공장과 정화 시설을 되살려 주세요.',
    art: 'loading_bacteria_zone'
  },
  startBanner: '세균은 <b>맨눈으로 관찰하기 어려워요.</b> 사진 자료로 생김새를 조사해 봅시다.',
  rows: join([
    seg(['.@..............'].concat(GND)),
    seg([
      '....DDD.....',
      '............',
      '............',
      '............',
      '.......6....',
      '............',
      '############',
      '############',
      '############'
    ]),
    /* rapidly-multiplying temporary platforms — they collapse under you, so keep
       the hops short (3 tiles) and the pit narrow enough to recover */
    seg([
      '.....oo.....o...',
      '................',
      '..Z..Z..Z..Z..Z.',
      '................',
      '................',
      '####........####',
      '####........####',
      '####........####'
    ]),
    seg([
      '......*.......',
      '..............',
      '..............',
      '....6.....6...',
      '..............',
      '...X......X...',
      '###........###',
      '###........###',
      '###........###'
    ]),
    seg([
      '...o.o....',
      '..........',
      '..........',
      '.....PP...',
      '#####pp###',
      '#####pp###',
      '#####pp###'
    ]),
    seg(['....C.....', '..........', '..........'].concat(g(10))),
    /* MISSION A: shape classification -> the shape gate opens */
    seg([
      '..........BB..',
      '..........BB..',
      '..........BB..',
      '..........BB..',
      '..........BB..',
      '..........BB..',
      '..G.......BB..',
      '##############',
      '##############',
      '##############'
    ]),
    seg([
      '.....oo.......',
      '....=====.....',
      '..............',
      '...7......7...',
      '..............',
      '..............',
      '..............',
      '##############',
      '##############',
      '##############'
    ]),
    /* MISSION B: fermentation tank (김치·요구르트) */
    seg([
      '.............BBB..',
      '.............BBB..',
      '.............BBB..',
      '.............BBB..',
      '.............BBB..',
      '.............BBB..',
      '..G..........BBB..',
      '##################',
      '##################',
      '##################'
    ]),
    seg([
      '.....oo.....',
      '............',
      '............',
      '............',
      '..X......X..',
      '###......###',
      '###......###',
      '###......###'
    ]),
    /* MISSION C: purification facility */
    seg([
      '..............BBB.',
      '..............BBB.',
      '..............BBB.',
      '..............BBB.',
      '..............BBB.',
      '.....6...6....BBB.',
      '..G...g.......BBB.',
      '##################',
      '##################',
      '##################'
    ]),
    seg([
      '..........o.....',
      '.........====...',
      '................',
      '......o.........',
      '.....====.......',
      '................',
      '..o.........7...',
      '.===............',
      '################',
      '################',
      '################'
    ]),
    seg([
      '...o.o.o....',
      '............',
      '......F.....',
      '............',
      '############',
      '############',
      '############'
    ])
  ]),
  warps: { 0: { to: 'b3', kind: 'bonus' } },
  devices: {
    G: { kind: 'multi', w: 22, h: 24 },
    g: { kind: 'purifytile', img: 'obj_sterilization_station', w: 20, h: 22, deco: true }
  },
  multiOrder: [
    { kind: 'classify', img: 'obj_data_core', mission: 'classify' },
    { kind: 'ferment', img: 'obj_fermentation_tank', mission: 'bacteria_roles' },
    { kind: 'purify', img: 'obj_water_purification_valve', mission: 'bacteria_habitat' }
  ],
  goal: {
    title: '데이터 오류체를 정화하세요.',
    how: '빛나는 스위치를 작동하세요.',
    next: '막힌 벽이 열리고 포털이 활성화돼요.',
    total: 3,
    hints: ['빛나는 화살표가 있는 스위치를 찾아보세요.',
            '스위치 바로 위에 서서 아래 방향키(↓)를 누르세요.',
            '세 곳을 모두 정화하면 출구가 열려요.']
  },
  facts: [
    '세균에는 공 모양, 막대 모양, 나선 모양 등이 있어요.',
    '세균은 알맞은 조건에서 빠르게 번식할 수 있어요.',
    '발효와 정화에 이용되기도 하고 질병을 일으키는 경우도 있어요.'
  ],
  clearImg: 'impact_kimchi',
  badge: 'badge_bacteria_researcher',
  core: 'bacteria'
};

var B3 = {
  id: 'b3', world: 'bacteria', name: '세균 자료실', sub: true,
  tiles: 'purify', bg: 'bg_bacteria', music: 'lab', amb: null,
  rows: join([seg([
    '..........................',
    '.@.....o.o.o.o......G.....',
    '..........................',
    '.......=======............',
    '..........................',
    '..................PP......',
    '##################pp######',
    '##################pp######',
    '##################pp######'
  ])]),
  warps: { 0: { to: 'exit', kind: 'exit' } },
  devices: { G: { kind: 'scope', img: 'obj_data_core', w: 18, h: 18, mission: 'scope_bacteria' } }
};

/* ============================================================
   STAGE 4 — 생명의 균형 코어
   ============================================================ */
var S4 = {
  id: 's4', world: 'core', name: '생명의 균형 코어',
  tiles: 'core', tiles2: 'fungi_dark',
  bg: 'bg_bacteria', music: 'explore', amb: 'core',
  intro: {
    eyebrow: 'FINAL STAGE', title: '생명의 균형 코어',
    note: '균류·원생생물·세균의 역할이 멈추자 세상의 균형이 무너지고 있어요. 네 곳을 되살리고 균형 오류 코어를 멈춰 주세요.',
    art: 'loading_balance_core'
  },
  rows: join([
    seg(['.@..............'].concat(GND)),
    /* 상황 1 — 분해가 멈춘 숲: 균류 코어를 켜면 분해가 되살아나 길이 열려요 */
    seg([
      '..........BBBB.....',
      '..........BBBB.....',
      '..........BBBB.....',
      '..........BBBB.....',
      '..........BBBB.....',
      '..o.......BBBB.....',
      '...3......BBBB.....',
      '..G.......BBBB.....',
      '###################',
      '###################',
      '###################'
    ]),
    seg(['....oo....', '..........', '..........'].concat(g(10))),
    /* 상황 2 — 발효가 멈춘 주방 */
    seg([
      '..........BBBB.....',
      '..........BBBB.....',
      '..........BBBB.....',
      '..........BBBB.....',
      '..........BBBB.....',
      '..o..6....BBBB.....',
      '..G.......BBBB.....',
      '###################',
      '###################',
      '###################'
    ]),
    seg([
      '.....*......',
      '............',
      '............',
      '............',
      '..X......X..',
      '###......###',
      '###......###',
      '###......###'
    ]),
    /* 상황 3 — 붉어진 바다: 원생생물을 없애지 않고 오염수 유입만 막아요 */
    seg([
      '..........BBBB......',
      '..........BBBB......',
      '..........BBBB......',
      '..........BBBB......',
      '..........BBBB......',
      '.....5..5.BBBB......',
      '..G...g...BBBB......',
      '####################',
      '####################',
      '####################'
    ]),
    seg(['....C.....', '..........', '..........'].concat(g(10))),
    /* 상황 4 — 곰팡이가 퍼진 식품 보관실 */
    seg([
      '..........BBBB......',
      '..........BBBB......',
      '..........BBBB......',
      '..........BBBB......',
      '..o.......BBBB......',
      '.....2....BBBB......',
      '..G...g...BBBB......',
      '####################',
      '####################',
      '####################'
    ]),
    /* 3-tile pit: inside a plain walking jump (3.66 tiles). The ledge above is a
       bonus route to the orbs, never the way through. */
    seg([
      '.....oo.....',
      '............',
      '....====....',
      '............',
      '............',
      '####...#####',
      '####...#####',
      '####...#####'
    ]),
    /* finale arena — a checkpoint right at the door so a miss costs seconds, not
       the whole stage.

       The row-11 ledges are the only place the boss can be stomped from, and they
       sit 64px above the floor. A walking jump only lifts ~59px, so they used to
       need a SPRINT — which touch players have no button for, making the last
       stage unfinishable on a tablet. The '===' step at row 13 fixes that: floor
       -> step -> ledge is two ordinary jumps (32px each), while a sprint jump
       still passes straight through it (semi-solids only catch a falling player)
       and reaches the ledge in one go, so the shortcut survives.

       It sits under the LEFT ledge on purpose. The centre gap looks like the
       natural spot, but the boss patrols cols 145.75-151.25 and dips to y=192,
       so a step there would park the player's head inside the boss. */
    seg([
      '........................',
      '........................',
      '........................',
      '..======....======......',
      '........................',
      '..C.===.F...............',
      '........................',
      '########################',
      '########################',
      '########################'
    ])
  ]),
  warps: {},
  devices: {
    G: { kind: 'multi', w: 22, h: 26 },
    g: { kind: 'deco2', w: 18, h: 22 }
  },
  multiOrder: [
    { kind: 'fungicore', img: 'obj_spore_storm_core', mission: 'restore_fungi' },
    { kind: 'fermcore', img: 'obj_fermentation_tank', mission: 'restore_ferment' },
    { kind: 'seacore', img: 'obj_water_purification_valve', mission: 'restore_sea' },
    { kind: 'moldcore', img: 'obj_humidity_regulator', mission: 'restore_mold' }
  ],
  decoOrder: [
    { img: 'obj_contamination_pipe', w: 26, h: 16 },
    { img: 'obj_ventilation_tower', w: 15, h: 28 }
  ],
  boss: true,
  goal: {
    title: '멈춰 버린 네 곳의 역할을 되살리세요.',
    how: '빛나는 스위치 위에서 ↓(또는 S)를 누르세요.',
    next: '균형 오류 코어가 나타나요.',
    total: 4,
    hints: ['숲 · 주방 · 바다 · 보관실을 차례로 되살려요.',
            '생물을 없애는 게 아니라 환경을 바로잡는 거예요.',
            '빛나는 화살표가 있는 스위치 위에 서서 아래 방향키를 누르세요.']
  },
  facts: [
    '균류·원생생물·세균은 모두 생태계에서 중요한 역할을 해요.',
    '생물을 없애는 것이 아니라 균형을 되찾는 것이 중요해요.'
  ],
  clearImg: 'impact_water_purification',
  badge: 'badge_balance_guardian',
  core: 'balance'
};

var STAGES = { s1: S1, s2: S2, s3: S3, s4: S4, b1: B1, b2: B2, b3: B3 };
var ORDER = ['s1', 's2', 's3', 's4'];

var CARDS = {
  hyphae:    { name: '균사', img: 'micro_fungi_hyphae', desc: '실처럼 가늘고 긴 균사예요.' },
  spores:    { name: '포자가 든 주머니', img: 'micro_mold_spores', desc: '균류는 포자로 번식해요.' },
  breadmold: { name: '빵에 자란 곰팡이', img: 'specimen_bread_mold', desc: '균류는 음식을 상하게 하기도 해요.' },
  shiitake:  { name: '표고버섯', img: 'specimen_shiitake_block', desc: '버섯도 균사로 이루어진 균류예요.' },
  spirogyra: { name: '해캄', img: 'micro_spirogyra', desc: '가늘고 긴 머리카락 모양이에요.' },
  paramecium:{ name: '짚신벌레', img: 'micro_paramecium', desc: '길쭉한 둥근 모양이에요.' },
  pondwater: { name: '연못물', img: 'specimen_pond_water', desc: '원생생물은 물이 있는 곳에 살아요.' },
  shapes:    { name: '세균의 생김새', img: 'micro_bacteria_shapes', desc: '공·막대·나선 모양 등이 있어요.' }
};

/* ---------- build: rows -> grid + entity list ---------- */

/* Devices and the spawn point MUST rest on a floor or they are unreachable.
   Rather than trusting hand-authored rows, snap them down to the first floor
   below the anchor. Authoring a device one row off can no longer break a stage. */
function floorRowBelow(grid, h, c, row) {
  for (var r = row + 1; r < h; r++) {
    var t = grid[r][c];
    if (t === 1 || t === 2 || t === 3) return r - 1;
  }
  return row;
}

function build(def) {
  var rows = def.rows, h = rows.length, w = rows[0].length;
  var grid = [], meta = [], ents = [], spawn = { x: 32, y: 224 }, r, c;
  for (r = 0; r < h; r++) { grid.push(new Array(w)); meta.push(new Array(w)); }

  var pipeIdx = 0, deviceQueue = [], spawnCell = null;

  for (r = 0; r < h; r++) {
    for (c = 0; c < w; c++) {
      var ch = rows[r][c], px = c * 16, py = r * 16;
      grid[r][c] = 0;
      switch (ch) {
        case '#': grid[r][c] = 1; break;
        case '=': grid[r][c] = 2; break;
        case 'B': grid[r][c] = 3; meta[r][c] = { t: 'brick' }; break;
        case '?': grid[r][c] = 3; meta[r][c] = { t: 'capsule' }; break;
        case 'S': grid[r][c] = 3; meta[r][c] = { t: 'spore' }; break;
        case 'D': grid[r][c] = 3; meta[r][c] = { t: 'data' }; break;
        case 'H': grid[r][c] = 0; meta[r][c] = { t: 'hidden' }; break;
        case 'p': grid[r][c] = 1; meta[r][c] = { t: 'pipebody' }; break;
        case 'P':
          grid[r][c] = 1;
          if (rows[r][c - 1] !== 'P') {
            var id = pipeIdx++;
            meta[r][c] = { t: 'pipetop', id: id, left: true };
            ents.push({ k: 'pipe', x: px, y: py, id: id, warp: (def.warps || {})[id] || null });
          } else meta[r][c] = { t: 'pipetop' };
          break;
        case '@': spawnCell = { c: c, r: r }; break;
        case 'o': ents.push({ k: 'orb', x: px + 8, y: py + 8, v: 1 }); break;
        case '*': ents.push({ k: 'orb', x: px + 8, y: py + 8, v: 5, big: true }); break;
        case 'M': ents.push({ k: 'shroom', x: px, y: py }); break;
        case 'b': ents.push({ k: 'bubble', x: px + 8, y: py + 8 }); break;
        case 'C': ents.push({ k: 'checkpoint', x: px, y: py }); break;
        case 'F': ents.push({ k: 'goal', x: px, y: py }); break;
        case 'X': ents.push({ k: 'mplat', x: px, y: py, axis: 'x', range: 44 }); break;
        case 'Y': ents.push({ k: 'mplat', x: px, y: py, axis: 'y', range: 44 }); break;
        case 'Z': ents.push({ k: 'fplat', x: px, y: py }); break;
        case '~': grid[r][c] = 4; break;
        case 'w': grid[r][c] = 5; meta[r][c] = { dir: 1 }; break;
        case 'W': grid[r][c] = 5; meta[r][c] = { dir: -1 }; break;
        case 'G': deviceQueue.push({ ch: 'G', x: px, y: py }); break;
        case 'g': deviceQueue.push({ ch: 'g', x: px, y: py }); break;
        case '1': ents.push({ k: 'enemy', type: 'sporeblob', x: px, y: py }); break;
        case '2': ents.push({ k: 'enemy', type: 'moldball', x: px, y: py }); break;
        case '3': ents.push({ k: 'enemy', type: 'woodchunk', x: px, y: py }); break;
        case '4': ents.push({ k: 'enemy', type: 'droplet', x: px, y: py }); break;
        /* '$' is a droplet that moves 15% slower — used for the very first one a
           player meets, so the dodge is learnable before it matters. */
        case '$': ents.push({ k: 'enemy', type: 'droplet', x: px, y: py, spMul: 0.85 }); break;
        case '5': ents.push({ k: 'enemy', type: 'redtide', x: px, y: py }); break;
        case '6': ents.push({ k: 'enemy', type: 'dataerr', x: px, y: py }); break;
        case '7': ents.push({ k: 'enemy', type: 'overgrow', x: px, y: py }); break;
      }
    }
  }

  // snap the spawn onto its floor
  if (spawnCell) {
    var sr = floorRowBelow(grid, h, spawnCell.c, spawnCell.r);
    spawn = { x: spawnCell.c * 16 + 2, y: sr * 16 };
  }

  var mi = 0, di = 0;
  deviceQueue.forEach(function (d) {
    var cfg = (def.devices || {})[d.ch];
    if (!cfg) return;
    var dc = Math.floor(d.x / 16);
    d.y = floorRowBelow(grid, h, dc, Math.floor(d.y / 16)) * 16;   // stand it on the floor
    var e = { k: 'device', x: d.x, y: d.y };
    if (cfg.kind === 'multi' && def.multiOrder) {
      var m = def.multiOrder[mi++]; if (!m) return;
      e.kind = m.kind; e.img = m.img; e.mission = m.mission;
      e.w = cfg.w; e.h = cfg.h;
    } else if (cfg.kind === 'deco2' && def.decoOrder) {
      var o = def.decoOrder[di++]; if (!o) return;
      e.kind = 'deco'; e.img = o.img; e.w = o.w; e.h = o.h; e.deco = true;
    } else {
      e.kind = cfg.kind; e.img = cfg.img; e.mission = cfg.mission;
      e.w = cfg.w; e.h = cfg.h; e.deco = !!cfg.deco; e.status = cfg.status || null;
    }
    ents.push(e);
  });

  return { def: def, grid: grid, meta: meta, ents: ents, spawn: spawn,
           w: w, h: h, pxw: w * 16, pxh: h * 16 };
}

W.SM.Level = { STAGES: STAGES, ORDER: ORDER, CARDS: CARDS, build: build, H: H, seg: seg };
})(window);
