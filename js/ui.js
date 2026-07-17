/* ===== 슈퍼 마이크로 — screens, menus, science missions ===== */
(function (W) {
'use strict';
var U = W.SM.U, Save = W.SM.Save, Audio_ = W.SM.Audio, Level = W.SM.Level;
var $ = U.$;

var UI = {
  cur: null,
  overlays: [],
  game: null,

  /* Deactivate EVERY base screen, not just the one we think is current.
     Previously this only cleared `this.cur`, which starts null — so the boot
     loading screen (active in the markup) was never switched off and sat on top
     of the running game forever. Never trust tracked state for teardown. */
  show: function (id) {
    U.$$('#stage > section.screen').forEach(function (s) {
      if (!s.classList.contains('overlay')) s.classList.remove('active');
    });
    this.cur = id;
    if (id) $('#' + id).classList.add('active');
  },
  openOverlay: function (id) {
    $('#' + id).classList.add('active');
    if (this.overlays.indexOf(id) < 0) this.overlays.push(id);
  },
  closeOverlay: function (id) {
    $('#' + id).classList.remove('active');
    var i = this.overlays.indexOf(id);
    if (i >= 0) this.overlays.splice(i, 1);
  },
  anyOverlay: function () { return this.overlays.length > 0; },

  /* ---------- goal banner ----------
     The player should never have to guess. Every required objective states the
     goal, how to do it, the live count, and what completing it opens. If no
     progress happens for a while, a concrete nudge appears. */
  goal: {
    cur: null,
    show: function (o) {
      // cancel a pending auto-hide from a previous goal — otherwise finishing one
      // stage and starting the next within 1.8s wipes the new stage's banner
      clearTimeout(this._doneT); this._doneT = null;
      this.cur = o;                       // {id,title,how,next,now,total,hints[]}
      var b = $('#goal-banner');
      $('#gb-title').textContent = o.title || '';
      $('#gb-how').textContent = o.how || '';
      $('#gb-next').textContent = o.next ? '완료하면 ' + o.next : '';
      b.classList.remove('hidden', 'done');
      this.render();
      this.poke();
    },
    render: function () {
      var o = this.cur; if (!o) return;
      var el = $('#gb-prog');
      var wrap = el.parentNode;
      if (o.total) {
        el.textContent = o.now + ' / ' + o.total;
        wrap.style.display = '';
      } else wrap.style.display = 'none';
    },
    set: function (now) {
      if (!this.cur) return;
      if (now === this.cur.now) return;   // only react to real change
      this.cur.now = now;
      this.render();
      var w = $('#gb-prog').parentNode;
      w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop');
      this.poke();
    },
    step: function () { if (this.cur) this.set(this.cur.now + 1); },
    complete: function (msg) {
      if (!this.cur) return;
      var b = $('#goal-banner');
      $('#gb-title').textContent = msg || '완료!';
      $('#gb-how').textContent = '';
      $('#gb-next').textContent = '';
      b.classList.add('done');
      this.hideHint();
      clearTimeout(this._hintT);
      var self = this;
      clearTimeout(this._doneT);
      this._doneT = setTimeout(function () { self.hide(); }, 1800);
    },
    hide: function () {
      this.cur = null;
      clearTimeout(this._doneT); this._doneT = null;
      $('#goal-banner').classList.add('hidden');
      this.hideHint();
      clearTimeout(this._hintT);
    },
    /* reset the idle timer — call whenever the player makes progress */
    poke: function () {
      var self = this;
      this.hideHint();
      clearTimeout(this._hintT);
      if (!this.cur || !this.cur.hints || !this.cur.hints.length) return;
      this._hi = 0;
      this._hintT = setTimeout(function tick() {
        if (!self.cur) return;
        var h = self.cur.hints[Math.min(self._hi, self.cur.hints.length - 1)];
        self._hi++;
        var el = $('#goal-hint');
        el.textContent = '💡 ' + h;
        el.classList.remove('hidden');
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
        self._hintT = setTimeout(tick, 7000);
      }, 7000);
    },
    hideHint: function () { $('#goal-hint').classList.add('hidden'); }
  },

  toast: function (msg, ms) {
    var t = $('#toast');
    t.innerHTML = msg;
    t.classList.remove('hidden');
    clearTimeout(this._tt);
    // restart the entry animation
    t.style.animation = 'none'; void t.offsetHeight; t.style.animation = '';
    this._tt = setTimeout(function () { t.classList.add('hidden'); }, ms || 1600);
  },
  banner: function (html, ms) {
    var b = $('#banner');
    $('#banner-text').innerHTML = html;
    b.classList.remove('hidden');
    clearTimeout(this._bt);
    this._bt = setTimeout(function () { b.classList.add('hidden'); }, ms || 4200);
  },
  hideBanner: function () { clearTimeout(this._bt); $('#banner').classList.add('hidden'); },

  fade: function (on, cb) {
    var f = $('#fade');
    f.classList.toggle('on', !!on);
    if (cb) setTimeout(cb, 310);
  },

  /* ---------- keyboard menu navigation ---------- */
  bindMenu: function (sel, onPick) {
    var menu = $(sel);
    if (!menu) return;
    var btns = U.$$(sel + ' .btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        Audio_.sfx('select');
        onPick(b.dataset.act, b);
      });
    });
  },
  menuNav: function (sel) {
    var btns = U.$$(sel + ' .btn').filter(function (b) { return !b.disabled; });
    if (!btns.length) return;
    var i = btns.findIndex(function (b) { return b.classList.contains('sel'); });
    var Input = W.SM.Input;
    var moved = 0;
    if (Input.hit('down') || Input.hit('right')) moved = 1;
    if (Input.hit('jump') || Input.hit('left')) moved = Input.hit('left') ? -1 : moved;
    if (moved) {
      if (i < 0) i = 0; else btns[i].classList.remove('sel');
      i = (i + moved + btns.length) % btns.length;
      btns[i].classList.add('sel'); btns[i].focus();
      Audio_.sfx('select');
    } else if (i < 0) { btns[0].classList.add('sel'); }
    if (Input.hit('confirm')) {
      var s = btns.find(function (b) { return b.classList.contains('sel'); }) || btns[0];
      s.click();
    }
  }
};

/* ============================================================
   SCIENCE MISSIONS
   Short (10–25 s). Failing never ends the run: you get a hint and retry.
   ============================================================ */
var Missions = {};

function head(tag, title, goal) {
  $('#mission-tag').textContent = tag;
  $('#mission-title').textContent = title;
  $('#mission-goal').innerHTML = goal;
  $('#mission-body').innerHTML = '';
  hint('');
}
function hint(t, cls) {
  var h = $('#mission-hint');
  h.innerHTML = t || '';
  h.className = 'mission-hint' + (cls ? ' ' + cls : '');
}
function body() { return $('#mission-body'); }

/* ---------- 1. 습도/환기 조절 (S1 required, S4 상황4) ---------- */
Missions.humidity = function (ctx, done) {
  head('과학 미션', '알맞은 환경 만들기',
    ctx.variant === 'mold'
      ? '균류는 <b>따뜻하고 습한 곳</b>에서 잘 자라요. 빵에 곰팡이가 더 퍼지지 않도록 보관 환경을 바꿔 주세요.'
      : '균류는 <b>따뜻하고 습한 곳</b>에서 잘 자라요. 균사가 자라기에 알맞은 환경을 만들어 끊어진 길을 이어 주세요.');

  var want = ctx.variant === 'mold' ? 'dry' : 'mid';
  var opts = [
    { id: 'dry', em: '🏜️', t: '건조함', s: '환기가 잘 됨' },
    { id: 'mid', em: '💧', t: '알맞음', s: '따뜻하고 촉촉함' },
    { id: 'wet', em: '🌊', t: '지나치게 습함', s: '물이 고임' }
  ];
  var row = document.createElement('div');
  row.className = 'dial-row';
  var picked = null;
  opts.forEach(function (o) {
    var d = document.createElement('button');
    d.className = 'dial'; d.dataset.id = o.id;
    d.innerHTML = '<em>' + o.em + '</em><b>' + o.t + '</b><small>' + o.s + '</small>';
    d.addEventListener('click', function () {
      Audio_.sfx('select');
      U.$$('.dial').forEach(function (e) { e.classList.remove('sel'); });
      d.classList.add('sel'); picked = o.id;
      check();
    });
    row.appendChild(d);
  });
  body().appendChild(row);

  var note = document.createElement('p');
  note.style.cssText = 'font-size:.62em;color:var(--dim);text-align:center';
  note.textContent = ctx.variant === 'mold'
    ? '습도 조절기와 환기 장치를 함께 사용해요.'
    : '습도 조절기와 환기 탑을 조절해요.';
  body().appendChild(note);

  function check() {
    if (picked === want) {
      U.$$('.dial').forEach(function (e) { if (e.dataset.id === want) e.classList.add('ok'); });
      hint('알맞아요! ' + (want === 'mid' ? '균사가 자라기 시작해요.' : '보관 환경이 바뀌었어요.'), 'good');
      Audio_.sfx('mission');
      // the only place the player studies bread mould, so the card belongs here
      if (ctx.variant === 'mold' && ctx.game) ctx.game.grantCard('breadmold');
      setTimeout(function () { done(true); }, 750);
    } else if (picked) {
      Audio_.sfx('fail');
      if (ctx.variant === 'mold') {
        hint(picked === 'wet' ? '너무 습하면 곰팡이가 더 빨리 퍼져요. 다시 해 볼까요?'
                              : '아직이에요. 습기를 줄이고 환기를 시켜 주세요.', 'bad');
      } else {
        hint(picked === 'dry' ? '너무 건조하면 균사가 자라지 못해요. 다시 해 볼까요?'
                              : '물이 너무 많아도 자라기 어려워요. 다시 해 볼까요?', 'bad');
      }
    }
  }
};

/* ============ shared mission widgets ============ */

/* Rotary control built on the artwork knobs. Drag with mouse/touch, or use the
   arrow keys when focused — the visual rotation always matches the real value. */
function Knob(opts) {
  var wrap = document.createElement('div');
  wrap.className = 'knob ' + (opts.cls || '');
  var img = document.createElement('img');
  img.src = 'assets/' + opts.art + '.png';
  img.alt = '';
  img.draggable = false;
  var cap = document.createElement('span');
  cap.className = 'knob-cap';
  cap.textContent = opts.label || '';
  wrap.appendChild(img); wrap.appendChild(cap);

  var self = this;
  this.el = wrap;
  this.value = opts.value == null ? 50 : opts.value;
  this.onChange = opts.onChange || function () {};
  this.sweep = opts.sweep || 270;

  var knobEl = document.createElement('div');
  knobEl.className = 'knob-hit';
  knobEl.tabIndex = 0;
  knobEl.setAttribute('role', 'slider');
  knobEl.setAttribute('aria-label', opts.label || '조절');
  knobEl.setAttribute('aria-valuemin', '0');
  knobEl.setAttribute('aria-valuemax', '100');
  wrap.insertBefore(knobEl, cap);

  this.render = function () {
    var a = (self.value / 100 - 0.5) * self.sweep;
    img.style.transform = 'rotate(' + a.toFixed(1) + 'deg)';
    knobEl.setAttribute('aria-valuenow', Math.round(self.value));
  };
  this.set = function (v, silent) {
    v = U.clamp(v, 0, 100);
    if (v === self.value) return;
    self.value = v; self.render();
    if (!silent) self.onChange(v);
  };

  var dragging = false, lastA = null;
  function angleAt(e) {
    var r = wrap.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  }
  knobEl.addEventListener('pointerdown', function (e) {
    dragging = true; lastA = angleAt(e);
    knobEl.setPointerCapture && knobEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  knobEl.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var a = angleAt(e), d = a - lastA;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    lastA = a;
    self.set(self.value + d * (180 / Math.PI) * (100 / self.sweep));
    e.preventDefault();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
    knobEl.addEventListener(t, function () { dragging = false; });
  });
  knobEl.addEventListener('keydown', function (e) {
    var st = e.shiftKey ? 1 : 4;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { self.set(self.value - st); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { self.set(self.value + st); e.preventDefault(); }
  });
  this.render();
}

/* ---------- 2. 현미경 관찰 (배율 → 밝기 → 대략 초점 → 세밀 초점 → 구조 확인) ---------- */
/* Full observation workflow (~30-40s):
   find the specimen at low power -> light -> coarse focus -> switch to high power
   -> fine focus -> name the structure. Mirrors the textbook's actual order. */
var SCOPE_SETS = {
  scope_fungi: {
    title: '실체 현미경으로 관찰하기',
    safety: '곰팡이는 맨손으로 만지거나 코에 가까이 대지 않아요.',
    wrap: '균류는 가늘고 긴 <b>균사</b>로 이루어지고 <b>포자</b>를 이용해 번식해요.',
    steps: [
      { img: 'specimen_shiitake_block', name: '표고버섯',
        find: '표고버섯 표본 전체를 찾아보세요.',
        detail: '버섯의 갓과 자루를 자세히 보세요.',
        answer: '갓과 자루가 있는 버섯',
        choices: ['갓과 자루가 있는 버섯', '나선 모양 세균', '초록색 잎과 뿌리'],
        card: 'shiitake', found: '표고버섯도 <b>균사</b>로 이루어진 균류예요!',
        finalScale: 1, finalFit: 'contain', finalPosition: 'center',
        finalText: '표고버섯 한 개가 화면 안에 모두 들어왔어요.' },
      { img: 'micro_fungi_hyphae', name: '버섯의 균사',
        find: '표본 전체에서 실 같은 구조를 찾아보세요.',
        detail: '가늘고 긴 구조를 자세히 보세요.',
        answer: '가늘고 긴 균사',
        choices: ['가늘고 긴 균사', '둥근 알갱이만 있음', '길쭉하고 둥근 모양'],
        card: 'hyphae', found: '가늘고 긴 <b>균사</b>가 보여요!',
        finalScale: 1.15, finalFit: 'contain', finalPosition: 'center',
        finalText: '실처럼 얽힌 균사가 끊기지 않고 다 보여요.' },
      { img: 'micro_mold_spores', name: '빵에 자란 곰팡이',
        find: '곰팡이 표본 전체를 찾아보세요.',
        detail: '균사 끝에 달린 주머니를 보세요.',
        answer: '포자가 든 주머니',
        choices: ['포자가 든 주머니', '나선 모양 세균', '가늘고 긴 머리카락 모양'],
        card: 'spores', found: '균사 끝에 <b>포자가 든 주머니</b>가 보여요!',
        finalScale: 1.1, finalFit: 'contain', finalPosition: 'center',
        finalText: '균사 끝의 둥근 포자주머니까지 한눈에 보여요.' }
    ]
  },
  scope_protist: {
    title: '디지털 현미경으로 관찰하기',
    safety: '생명을 소중히 여기는 마음으로 관찰해요.',
    wrap: '<b>해캄</b>과 <b>짚신벌레</b> 같은 생물을 원생생물이라고 해요. 주로 물이 있는 곳에서 살아요.',
    steps: [
      { img: 'micro_spirogyra', name: '해캄',
        find: '연못물 표본에서 초록빛 생물을 찾아보세요.',
        detail: '생김새가 어떤 모양인지 보세요.',
        answer: '가늘고 긴 머리카락 모양',
        choices: ['가늘고 긴 머리카락 모양', '길쭉하고 둥근 모양', '공 모양'],
        card: 'spirogyra', found: '해캄은 <b>가늘고 긴 머리카락 모양</b>이에요!',
        finalScale: 1.1, finalFit: 'contain', finalPosition: 'center',
        finalText: '가늘고 긴 해캄 가닥이 끝까지 이어져 보여요.' },
      { img: 'micro_paramecium', name: '짚신벌레',
        find: '움직이는 생물 전체를 찾아보세요.',
        detail: '몸의 윤곽을 자세히 보세요.',
        answer: '길쭉하고 둥근 모양',
        choices: ['길쭉하고 둥근 모양', '가늘고 긴 실 모양', '나선 모양'],
        card: 'paramecium', found: '짚신벌레는 <b>길쭉하고 둥근 모양</b>이에요!',
        finalScale: 1, finalFit: 'contain', finalPosition: 'center',
        finalText: '짚신벌레 몸 전체의 윤곽이 잘리지 않고 보여요.' }
    ]
  }
};

Missions.scope_fungi = Missions.scope_protist = function (ctx, done) {
  var set = SCOPE_SETS[ctx.id];
  head('관찰', set.title, '<b>배율 → 밝기 → 초점</b> 순서로 조절해 표본을 또렷하게 만드세요.');

  var si = 0;
  var phase = 'find';                    // find -> detail -> review -> id
  var mag = 'low';
  var light = 20, coarse = 12, fine = 50;
  var TL = 62, TC = 58, TF = 50;
  var holdT = 0, locked = false, timer = null;

  /* How close is close enough. Loose tolerances let the player stumble into a
     pass while the image is still visibly blurry, which teaches nothing — a
     focused field has to be the only thing that counts as focused. */
  var TOL_LIGHT = 7, TOL_COARSE = 8, TOL_FINE = 4, HOLD = 0.9;
  var lastAnswerIdx = -1;                // so two specimens in a row don't share a slot

  var wrap = document.createElement('div');
  wrap.className = 'scope-wrap';

  var scope = document.createElement('div'); scope.className = 'scope-round';
  var imgWrap = document.createElement('div'); imgWrap.className = 'scope-clip';
  var img = document.createElement('img'); img.alt = '';
  imgWrap.appendChild(img);
  var bezel = document.createElement('img');
  bezel.className = 'scope-bezel'; bezel.src = 'assets/ui_microscope.png'; bezel.alt = '';
  scope.appendChild(imgWrap); scope.appendChild(bezel);

  var cap = document.createElement('p'); cap.className = 'scope-cap';

  var magRow = document.createElement('div'); magRow.className = 'mag-row';
  var MAGS = [['low', '낮은 배율'], ['mid', '중간 배율'], ['high', '높은 배율']];
  var magBtns = {};
  MAGS.forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'magb'; b.textContent = m[1]; b.dataset.m = m[0];
    b.addEventListener('click', function () { if (!locked) setMag(m[0]); });
    magRow.appendChild(b); magBtns[m[0]] = b;
  });

  var knobRow = document.createElement('div'); knobRow.className = 'knob-row';
  var kLight = new Knob({ art: 'ui_light_dial', label: '밝기', value: light,
    onChange: function (v) { light = v; apply(); } });
  var kCoarse = new Knob({ art: 'ui_focus_knob', label: '대략 초점', value: coarse,
    onChange: function (v) { coarse = v; apply(); } });
  var kFine = new Knob({ art: 'ui_focus_knob', cls: 'fine', label: '세밀 초점', value: fine,
    onChange: function (v) { fine = v; apply(); } });
  knobRow.appendChild(kLight.el); knobRow.appendChild(kCoarse.el); knobRow.appendChild(kFine.el);

  var reviewRow = document.createElement('div'); reviewRow.className = 'review-row hidden';
  var idRow = document.createElement('div'); idRow.className = 'id-row hidden';

  /* reviewRow sits directly under the scope (it is display:none until the review
     step, so the knobs still hug the scope while the player is adjusting). This
     keeps the "관찰한 구조 확인하기" button above the fold instead of below the
     locked knobs, where it needed a scroll to reach. */
  wrap.appendChild(cap); wrap.appendChild(scope);
  wrap.appendChild(reviewRow);
  wrap.appendChild(magRow); wrap.appendChild(knobRow);
  wrap.appendChild(idRow);
  body().appendChild(wrap);

  function setMag(m) {
    mag = m;
    Object.keys(magBtns).forEach(function (k) { magBtns[k].classList.toggle('sel', k === m); });
    Audio_.sfx('select'); apply();
  }
  function wantMag() { return phase === 'find' ? 'low' : 'high'; }

  function apply() {
    if (phase === 'review') return;      // review composes its own view
    var dc = Math.abs(coarse - TC), df = Math.abs(fine - TF);
    var zoom = mag === 'low' ? 1 : mag === 'mid' ? 1.55 : 2.4;
    var blur = dc / 100 * 9 + (phase === 'detail' ? df / 100 * 5 : 2.0);
    var bright = 0.45 + (light / 100) * 1.25;
    var contrast = 0.7 + (1 - dc / 100) * 0.7;
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'center';
    img.style.transform = 'scale(' + zoom + ')';
    img.style.filter = 'blur(' + blur.toFixed(2) + 'px) brightness(' + bright.toFixed(2) +
                       ') contrast(' + contrast.toFixed(2) + ')';
    kFine.el.classList.toggle('dim', phase !== 'detail');
  }

  function feedback() {
    var dc = Math.abs(coarse - TC);
    if (mag !== wantMag()) {
      return phase === 'find'
        ? '배율이 높아 표본 전체를 찾기 어려워요. 낮은 배율로 먼저 찾아보세요.'
        : '자세히 보려면 높은 배율로 바꿔 보세요.';
    }
    if (light < TL - TOL_LIGHT) return '빛이 너무 약해서 표본이 어두워요.';
    if (light > TL + TOL_LIGHT) return '빛이 너무 강해서 구조가 희게 보여요.';
    if (dc > TOL_COARSE) return '아직 흐릿해요. 대략 초점을 천천히 돌려 보세요.';
    if (phase === 'detail' && Math.abs(fine - TF) > TOL_FINE)
      return '경계가 아직 또렷하지 않아요. 세밀 초점을 아주 조금씩 조절해 보세요.';
    return null;
  }

  function ok() {
    if (mag !== wantMag()) return false;
    if (Math.abs(light - TL) > TOL_LIGHT) return false;
    if (Math.abs(coarse - TC) > TOL_COARSE) return false;
    if (phase === 'detail' && Math.abs(fine - TF) > TOL_FINE) return false;
    return true;
  }

  function load() {
    var st = set.steps[si];
    img.src = 'assets/' + st.img + '.jpg';
    img.onerror = function () { img.src = 'assets/' + st.img + '.png'; };
    phase = 'find';
    cap.innerHTML = '<b>' + st.name + '</b> · ' + (si + 1) + '/' + set.steps.length + ' — ' + st.find;
    TL = U.randi(52, 72); TC = U.randi(42, 70); TF = U.randi(38, 62);
    light = U.randi(4, 26); coarse = U.randi(4, 24); fine = U.randi(30, 70);
    kLight.set(light, true); kCoarse.set(coarse, true); kFine.set(fine, true);
    setMag('low'); locked = false; holdT = 0;
    idRow.classList.add('hidden'); idRow.innerHTML = '';
    reviewRow.classList.add('hidden'); reviewRow.innerHTML = '';
    knobRow.classList.remove('hidden'); knobRow.classList.remove('locked');
    magRow.classList.remove('hidden'); magRow.classList.remove('locked');
    hint('낮은 배율로 표본 전체를 먼저 찾아보세요.');
    apply();
  }

  /* The payoff of all that knob work: a still, sharp, WHOLE specimen the player
     can actually look at before being asked what they saw. Nothing auto-advances
     from here — they leave when they are done looking. */
  function showReview() {
    var st = set.steps[si];
    phase = 'review';
    locked = true;
    img.style.objectFit = st.finalFit || 'contain';
    img.style.objectPosition = st.finalPosition || 'center';
    img.style.transform = 'scale(' + (st.finalScale || 1) + ')';
    img.style.filter = 'blur(0px) brightness(1.06) contrast(1.14)';
    knobRow.classList.add('locked');
    magRow.classList.add('locked');
    cap.innerHTML = '<b>' + st.name + '</b> · ' + (si + 1) + '/' + set.steps.length +
                    ' — 초점이 정확히 맞았습니다.';
    reviewRow.innerHTML = '<p class="rv-ok">초점이 정확히 맞았습니다.</p>' +
                          '<p class="rv-note">' + (st.finalText || '') + '</p>';
    var b = document.createElement('button');
    b.className = 'btn primary rv-go';
    b.textContent = '관찰한 구조 확인하기';
    b.addEventListener('click', function () { Audio_.sfx('select'); askStructure(); });
    reviewRow.appendChild(b);
    reviewRow.classList.remove('hidden');
    hint('표본 전체를 천천히 살펴본 뒤 버튼을 누르세요.', 'good');
  }

  function askStructure() {
    var st = set.steps[si];
    phase = 'id';
    reviewRow.classList.add('hidden');
    idRow.innerHTML = '';
    var q = document.createElement('p'); q.className = 'id-q';
    q.textContent = '무엇이 보이나요?';
    idRow.appendChild(q);

    /* Every specimen is authored with the answer first, so unshuffled buttons
       taught "always press the top one" instead of how to read a slide. Shuffle a
       copy (st.choices itself must stay intact for a retry), and if the answer
       lands where it was last time, reshuffle — once, never in a loop. */
    var opts = U.shuffled(st.choices);
    if (opts.indexOf(st.answer) === lastAnswerIdx) opts = U.shuffled(st.choices);
    lastAnswerIdx = opts.indexOf(st.answer);

    opts.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'idb'; b.textContent = c;
      b.dataset.val = c;                 // judged by value, never by position
      b.addEventListener('click', function () {
        if (b.dataset.val === st.answer) {
          Audio_.sfx('mission');
          hint(st.found, 'good');
          if (st.card) ctx.game.grantCard(st.card);
          showResult();
        } else {
          Audio_.sfx('fail');
          hint('다시 살펴볼까요? 전체 윤곽을 보세요.', 'bad');
        }
      });
      idRow.appendChild(b);
    });
    idRow.classList.remove('hidden');
    knobRow.classList.add('hidden'); magRow.classList.add('hidden');
    hint('관찰한 구조를 골라 보세요.');
  }

  /* Player-paced, not timer-paced: the found text stays up until they click on. */
  function showResult() {
    var st = set.steps[si];
    var last = si >= set.steps.length - 1;
    idRow.innerHTML = '<p class="id-found">' + st.found + '</p>';
    var b = document.createElement('button');
    b.className = 'btn primary rv-go';
    b.textContent = last ? '관찰 완료 ▶' : '다음 표본 ▶';
    b.addEventListener('click', function () { Audio_.sfx('select'); next(); });
    idRow.appendChild(b);
  }

  function next() {
    si++;
    if (si >= set.steps.length) {
      clearInterval(timer);
      hint(set.safety, 'good');
      UI.banner(set.wrap, 4400);
      done(true);
    } else load();
  }

  timer = setInterval(function () {
    if (locked) return;
    if (ok()) {
      // clear the stale error the moment it is right, so the player gets
      // positive confirmation while the hold completes
      if (holdT === 0) hint('좋아요! 그대로 잠시 유지하세요.', 'good');
      holdT += 0.1;
      if (holdT > HOLD) {
        if (phase === 'find') {
          phase = 'detail'; holdT = 0;
          Audio_.sfx('orb');
          hint('표본을 찾았어요! 이제 높은 배율로 바꿔 자세히 보세요.', 'good');
          cap.innerHTML = '<b>' + set.steps[si].name + '</b> · ' + (si + 1) + '/' +
                          set.steps.length + ' — ' + set.steps[si].detail;
          apply();
        } else {
          Audio_.sfx('orb');
          showReview();
        }
      }
    } else {
      holdT = 0;
      var f = feedback();
      if (f) hint(f, 'bad');
    }
  }, 100);

  ctx.cleanup = function () { clearInterval(timer); };
  load();
};

/* ============================================================
   세균 사진 자료 판독실  (pipe room: scope_bacteria / S3 required: classify)
   The textbook is explicit that bacteria are too small for a classroom
   microscope, so this is a PHOTO ARCHIVE, never a scope. Both entry points share
   the same A-step (study the reference plate) so a player who already did it in
   the pipe room is not made to sit through it twice.
   ============================================================ */
var BACT_REF = 'assets/micro_bacteria_shapes.png';

var BACT_SHAPES = [
  { id: 'ball', name: '공 모양',
    feat: '둥근 알갱이가 하나씩 있거나 여러 개 모여 있어요.',
    ok: '둥근 알갱이가 모여 있어 공 모양으로 분류할 수 있어요.',
    hint: '전체 윤곽이 둥근지 살펴보세요.',
    zone: { l: 2, t: 4, w: 32, h: 92 } },
  { id: 'rod', name: '막대 모양',
    feat: '몸이 길쭉하고 양 끝이 둥근 막대처럼 보여요.',
    ok: '몸이 길쭉해 막대 모양으로 분류할 수 있어요.',
    hint: '길쭉하게 뻗어 있는지 살펴보세요.',
    zone: { l: 34, t: 4, w: 30, h: 92 } },
  { id: 'spiral', name: '나선 모양',
    feat: '몸이 굽거나 여러 번 꼬인 모양으로 보여요.',
    ok: '몸이 굽거나 꼬여 있어 나선 모양으로 분류할 수 있어요.',
    hint: '굽거나 여러 번 꼬여 있는지 살펴보세요.',
    zone: { l: 64, t: 4, w: 34, h: 92 } }
];
function bactShape(id) {
  for (var i = 0; i < BACT_SHAPES.length; i++) if (BACT_SHAPES[i].id === id) return BACT_SHAPES[i];
  return null;
}

/* Colour is deliberately mixed within each shape (orange AND teal spirals, etc.)
   so the only thing that survives as a cue is the outline. */
var BACT_SAMPLES = [
  { id: 'coccus_01', src: 'assets/bacteria_coccus_sample_01.png', answer: 'ball' },
  { id: 'coccus_02', src: 'assets/bacteria_coccus_sample_02.png', answer: 'ball' },
  { id: 'rod_01',    src: 'assets/bacteria_rod_sample_01.png',    answer: 'rod' },
  { id: 'rod_02',    src: 'assets/bacteria_rod_sample_02.png',    answer: 'rod' },
  { id: 'spiral_01', src: 'assets/bacteria_spiral_sample_01.png', answer: 'spiral' },
  { id: 'spiral_02', src: 'assets/bacteria_spiral_sample_02.png', answer: 'spiral' }
];

var BACT_TINT_NOTE = '사진 속 세균은 디지털로 색을 입힌 모습으로, 원래 세균의 색과는 달라요.';

/* A missing photo must degrade to a readable notice, never a broken icon and
   never a dead mission. The exact path goes to the console so it is fixable. */
function bactImg(src, cls, alt) {
  var im = document.createElement('img');
  im.className = cls; im.alt = alt || '';
  im.addEventListener('error', function () {
    console.error('[Super Micro] 세균 자료 이미지를 불러오지 못했습니다:', src);
    var note = document.createElement('div');
    note.className = 'img-fail';
    note.textContent = '자료 사진을 불러오지 못했어요';
    if (im.parentNode) im.parentNode.replaceChild(note, im);
  });
  im.src = src;
  return im;
}

/* ---------- A단계: 대표 자료 조사 (shared) ----------
   Not a quiz — a look-and-find. All three features must be checked off before
   the reading room opens. */
function bacteriaStudy(onDone) {
  head('자료 조사', '세균 사진 자료 판독실',
    '세균은 <b>맨눈으로 관찰하기 어려워요.</b> 사진 자료를 살펴보고 생김새의 특징을 조사해 봅시다.');

  var wrap = document.createElement('div');
  wrap.className = 'bact-wrap';

  var figure = document.createElement('div');
  figure.className = 'bact-ref';
  figure.appendChild(bactImg(BACT_REF, 'bact-ref-img', '세균의 여러 가지 생김새 자료'));
  var zone = document.createElement('div');
  zone.className = 'bact-zone hidden';
  figure.appendChild(zone);
  wrap.appendChild(figure);

  var count = document.createElement('p');
  count.className = 'bact-count';
  wrap.appendChild(count);

  var feat = document.createElement('p');
  feat.className = 'bact-feat';
  feat.textContent = '아래 단추를 눌러 세 가지 생김새를 조사해 보세요.';
  wrap.appendChild(feat);

  var bins = document.createElement('div'); bins.className = 'bins';
  var found = {};
  var go = document.createElement('button');
  go.className = 'btn primary bact-go';
  go.textContent = '개별 자료 판독 시작';
  go.disabled = true;

  function render() {
    var n = Object.keys(found).length;
    count.textContent = '조사한 생김새 ' + n + ' / 3';
    go.disabled = n < 3;
    go.classList.toggle('ready', n >= 3);
  }

  BACT_SHAPES.forEach(function (sh) {
    var b = document.createElement('button');
    b.className = 'bin bact-bin';
    b.innerHTML = '<span>' + sh.name + '</span><em class="bact-chk"></em>';
    b.addEventListener('click', function () {
      Audio_.sfx(found[sh.id] ? 'select' : 'orb');
      found[sh.id] = 1;
      b.classList.add('filled');
      b.querySelector('.bact-chk').textContent = '✓ 조사함';
      // spotlight the matching band of the reference plate
      zone.style.left = sh.zone.l + '%'; zone.style.top = sh.zone.t + '%';
      zone.style.width = sh.zone.w + '%'; zone.style.height = sh.zone.h + '%';
      zone.classList.remove('hidden');
      feat.innerHTML = '<b>' + sh.name + '</b> · ' + sh.feat;
      render();
      hint(Object.keys(found).length >= 3
        ? '세 가지를 모두 조사했어요. 판독을 시작해 보세요.'
        : sh.name + '의 특징을 확인했어요.', 'good');
    });
    bins.appendChild(b);
  });
  wrap.appendChild(bins);

  var note = document.createElement('p');
  note.className = 'bact-note';
  note.textContent = BACT_TINT_NOTE;
  wrap.appendChild(note);

  go.addEventListener('click', function () { Audio_.sfx('mission'); onDone(); });
  wrap.appendChild(go);

  body().appendChild(wrap);
  render();
  hint('공 모양, 막대 모양, 나선 모양 단추를 눌러 자료를 살펴보세요.');
}

/* ---------- B단계: 개별 사진 자료 판독 (shared) ---------- */
function bacteriaSort(ctx, done) {
  head('자료 판독', '세균 사진 자료 판독실',
    '사진 자료의 <b>전체 생김새</b>를 보고 알맞은 자료함으로 분류해 봅시다.');

  // sample ORDER and option ORDER are shuffled independently, every run
  var queue = U.shuffled(BACT_SAMPLES);
  var qi = 0, wrongs = 0, locked = false, sel = 0, btns = [];

  var wrap = document.createElement('div');
  wrap.className = 'bact-wrap';

  var step = document.createElement('p'); step.className = 'bact-step';
  var card = document.createElement('div'); card.className = 'bact-card';
  var q = document.createElement('p'); q.className = 'bact-q';
  q.textContent = '이 세균 자료는 어떤 생김새일까요?';
  var bins = document.createElement('div'); bins.className = 'bins';
  var after = document.createElement('div'); after.className = 'bact-after hidden';

  wrap.appendChild(step); wrap.appendChild(card); wrap.appendChild(q);
  wrap.appendChild(bins); wrap.appendChild(after);
  var note = document.createElement('p');
  note.className = 'bact-note'; note.textContent = BACT_TINT_NOTE;
  wrap.appendChild(note);
  body().appendChild(wrap);

  function mark() {
    btns.forEach(function (b, i) { b.classList.toggle('sel', i === sel && !locked); });
  }

  function load() {
    var smp = queue[qi];
    locked = false; wrongs = 0; sel = 0;
    step.textContent = '자료 ' + (qi + 1) + ' / ' + queue.length;
    card.className = 'bact-card';
    card.innerHTML = '';
    card.appendChild(bactImg(smp.src, 'bact-img', '세균 사진 자료'));
    after.classList.add('hidden'); after.innerHTML = '';
    bins.classList.remove('hidden');
    bins.innerHTML = ''; btns = [];

    U.shuffled(BACT_SHAPES).forEach(function (sh) {
      var b = document.createElement('button');
      b.className = 'bin bact-bin';
      b.dataset.val = sh.id;              // judged by value, never by position
      b.innerHTML = '<span>' + sh.name + '</span><em class="bact-chk"></em>';
      b.addEventListener('click', function () { pick(sh.id, b); });
      b.addEventListener('mouseenter', function () {
        if (locked) return;
        sel = btns.indexOf(b); mark();
      });
      bins.appendChild(b); btns.push(b);
    });
    mark();
    hint('자료함을 누르거나, ← → 와 Enter로 고를 수 있어요.');
  }

  function pick(id, btn) {
    if (locked) return;
    var smp = queue[qi];
    if (id !== smp.answer) {
      // never reveal the answer: first a general checklist, then a nudge toward
      // the outline that actually matters
      wrongs++;
      Audio_.sfx('fail');
      if (btn) {
        btn.classList.add('wrong');
        btn.querySelector('.bact-chk').textContent = '✕ 다시';
        setTimeout(function () {
          btn.classList.remove('wrong');
          if (btn.querySelector('.bact-chk')) btn.querySelector('.bact-chk').textContent = '';
        }, 900);
      }
      if (wrongs === 1) {
        hint('다시 살펴볼까요? ' + BACT_SHAPES.map(function (s) { return s.hint; }).join(' '), 'bad');
      } else {
        hint('힌트: ' + bactShape(smp.answer).hint, 'bad');
      }
      return;                              // image stays, progress does not move
    }

    locked = true;
    Audio_.sfx('orb');
    if (btn) {
      btn.classList.add('filled');
      btn.querySelector('.bact-chk').textContent = '✓ 정답';
    }
    card.classList.add('ok');              // brief outline highlight
    bins.classList.add('hidden');

    var last = qi >= queue.length - 1;
    after.innerHTML = '<p class="bact-ok">' + bactShape(smp.answer).ok + '</p>';
    var nb = document.createElement('button');
    nb.className = 'btn primary bact-go';
    nb.textContent = last ? '분류 결과 보기 ▶' : '다음 자료 ▶';
    nb.addEventListener('click', function () {
      Audio_.sfx('select');
      if (last) { summary(); } else { qi++; load(); }
    });
    after.appendChild(nb);
    after.classList.remove('hidden');
    hint('설명을 읽고 다음 자료로 넘어가세요.', 'good');
  }

  /* ---------- 최종 정리 ---------- */
  function summary() {
    head('자료 판독', '판독 결과 정리',
      '세균을 <b>생김새</b>에 따라 나누어 보았어요.');
    var sw = document.createElement('div');
    sw.className = 'bact-wrap';
    var grid = document.createElement('div');
    grid.className = 'bact-sum';
    BACT_SHAPES.forEach(function (sh) {
      var smp = BACT_SAMPLES.filter(function (x) { return x.answer === sh.id; })[0];
      var cell = document.createElement('figure');
      cell.className = 'bact-sum-cell';
      cell.appendChild(bactImg(smp.src, 'bact-sum-img', sh.name + ' 세균 자료'));
      var cap = document.createElement('figcaption');
      cap.textContent = sh.name;
      cell.appendChild(cap);
      grid.appendChild(cell);
    });
    sw.appendChild(grid);
    var wrapUp = document.createElement('p');
    wrapUp.className = 'bact-wrapup';
    wrapUp.innerHTML = '세균은 생김새에 따라 <b>공 모양</b>, <b>막대 모양</b>, <b>나선 모양</b> 등으로 구분할 수 있어요.';
    sw.appendChild(wrapUp);
    var nt = document.createElement('p');
    nt.className = 'bact-note'; nt.textContent = BACT_TINT_NOTE;
    sw.appendChild(nt);
    var fin = document.createElement('button');
    fin.className = 'btn primary bact-go';
    fin.textContent = '분류 완료';
    fin.addEventListener('click', function () {
      Audio_.sfx('mission');
      if (ctx.game) ctx.game.grantCard('shapes');
      done(true);
    });
    sw.appendChild(fin);
    body().appendChild(sw);
    ctx.key = null;
    hint('분류 완료를 눌러 마무리하세요.', 'good');
  }

  ctx.key = function (Input) {
    if (locked || !btns.length) return;
    if (Input.hit('left')) { sel = (sel + btns.length - 1) % btns.length; mark(); Audio_.sfx('select'); }
    if (Input.hit('right')) { sel = (sel + 1) % btns.length; mark(); Audio_.sfx('select'); }
    if (Input.hit('confirm') || Input.hit('jump')) {
      var b = btns[sel];
      if (b) pick(b.dataset.val, b);
    }
  };
  load();
}

/* Pipe room (bonus 3): study only — it is the same A-step the required mission
   uses, and finishing it here is what lets the required one skip ahead. */
Missions.scope_bacteria = function (ctx, done) {
  bacteriaStudy(function () {
    if (ctx.game) ctx.game.grantCard('shapes');
    UI.banner('세균에는 <b>공 모양</b>, <b>막대 모양</b>, <b>나선 모양</b> 등이 있어요.', 4200);
    done(true);
  });
};

/* S3 required. Study THEN read individual plates — but only study if it has not
   already been done in the pipe room, which is what the 'shapes' card records. */
Missions.classify = function (ctx, done) {
  var studied = Save.progress.cards.indexOf('shapes') >= 0;
  if (studied) {
    bacteriaSort(ctx, done);
    hint('이미 조사한 자료예요. 바로 판독을 시작할게요.', 'good');
  } else {
    bacteriaStudy(function () { bacteriaSort(ctx, done); });
  }
};

/* ---------- 세균 4단계: 사는 곳과 번식 조건 (S3) ----------
   New material, not a repeat: where bacteria live, and what makes them multiply.
   The condition step is a real comparison — change the setting, watch the count. */
/* 흙 has no emoji. 🪨 rendered as a hollow box on the classroom PCs and read as
   "rock" anyway, so soil gets drawn: a brown mound, a few stones, one sprout. */
var SOIL_SVG = '<svg class="ico-svg" viewBox="0 0 32 32" aria-hidden="true">' +
  '<path d="M1 28 h30 v3 H1 Z" fill="#5c3a20"/>' +
  '<path d="M2 29 A 13.5 12.5 0 0 1 30 29 Z" fill="#8a5a34"/>' +
  '<path d="M2 29 A 13.5 12.5 0 0 1 30 29" fill="none" stroke="#6b4325" stroke-width="1.4"/>' +
  '<circle cx="8" cy="25" r="2.1" fill="#a9a29b"/>' +
  '<circle cx="24" cy="26" r="1.7" fill="#a9a29b"/>' +
  '<circle cx="16" cy="28" r="1.3" fill="#c2bab2"/>' +
  '<path d="M16 18 v-12" stroke="#3f8f36" stroke-width="2" stroke-linecap="round"/>' +
  '<path d="M16 11 q-7-1.5-7-7 q7 0 7 7 Z" fill="#63c454"/>' +
  '<path d="M16 14 q7-1.5 7-7 q-7 0-7 7 Z" fill="#7ad868"/>' +
  '</svg>';

Missions.bacteria_habitat = function (ctx, done) {
  var phase = 0;

  function whereStep() {
    head('과학 미션', '세균이 사는 곳',
      '세균은 <b>땅, 물, 음식, 생물의 몸</b> 등 우리 주변 곳곳에 살아요. 세균이 있을 수 있는 곳을 모두 찾아보세요.');
    var wrap = document.createElement('div');
    wrap.className = 'habitat-wrap';
    var im = document.createElement('img');
    im.src = 'assets/impact_bacteria_everywhere.jpg';
    im.className = 'habitat-img'; im.alt = '';
    wrap.appendChild(im);

    var PLACES = [
      { t: '물', em: '💧', ok: true, why: '물속에도 세균이 살아요.' },
      { t: '흙', svg: SOIL_SVG, ok: true, why: '땅속에는 아주 많은 세균이 살아요.' },
      { t: '음식', em: '🍞', ok: true, why: '음식에도 세균이 있을 수 있어요.' },
      { t: '생물의 몸', em: '🧑', ok: true, why: '우리 몸속에도 세균이 살아요.' }
    ];
    var found = {};
    var row = document.createElement('div'); row.className = 'dial-row';
    PLACES.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'dial';
      b.innerHTML = '<em>' + (p.svg || p.em) + '</em><b>' + p.t + '</b>';
      b.addEventListener('click', function () {
        if (found[p.t]) return;
        found[p.t] = 1; b.classList.add('ok');
        Audio_.sfx('orb');
        hint(p.why, 'good');
        if (Object.keys(found).length === PLACES.length) {
          Audio_.sfx('mission');
          hint('세균은 주변 여러 곳에서 살 수 있어요.', 'good');
          setTimeout(function () { phase = 1; growthStep(); }, 1200);
        }
      });
      row.appendChild(b);
    });
    wrap.appendChild(row);
    body().appendChild(wrap);
    hint('네 곳을 모두 눌러 확인해 보세요. (0/4)');
  }

  function growthStep() {
    head('과학 미션', '세균의 번식 조건',
      '세균은 <b>살기 알맞은 조건</b>이 되면 빠르게 번식해요. 조건을 바꾸어 비교해 보세요.');
    var wrap = document.createElement('div');
    wrap.className = 'habitat-wrap';
    var im = document.createElement('img');
    im.src = 'assets/impact_bacteria_growth_conditions.jpg';
    im.className = 'habitat-img'; im.alt = '';
    wrap.appendChild(im);

    // three toggles; the count reacts live so the comparison is felt, not told
    var state = { temp: 'cold', wet: 'dry', food: 'clean' };
    var GROUPS = [
      { key: 'temp', label: '온도', opts: [['cold', '차가움', '🧊'], ['warm', '따뜻함', '🔥']], good: 'warm' },
      { key: 'wet', label: '물기', opts: [['dry', '건조함', '🏜️'], ['moist', '촉촉함', '💧']], good: 'moist' },
      { key: 'food', label: '양분', opts: [['clean', '깨끗함', '🧼'], ['dirty', '양분 많음', '🍚']], good: 'dirty' }
    ];
    var rows = document.createElement('div');
    rows.className = 'cond-rows';
    GROUPS.forEach(function (g) {
      var r = document.createElement('div'); r.className = 'cond-row';
      var lab = document.createElement('span'); lab.className = 'cond-lab'; lab.textContent = g.label;
      r.appendChild(lab);
      g.opts.forEach(function (o) {
        var b = document.createElement('button');
        b.className = 'dial cond-btn';
        b.innerHTML = '<em>' + o[2] + '</em><b>' + o[1] + '</b>';
        b.dataset.k = g.key; b.dataset.v = o[0];
        b.addEventListener('click', function () {
          state[g.key] = o[0];
          U.$$('.cond-btn').forEach(function (e) {
            e.classList.toggle('sel', state[e.dataset.k] === e.dataset.v);
          });
          Audio_.sfx('select');
          update();
        });
        r.appendChild(b);
      });
      rows.appendChild(r);
    });
    wrap.appendChild(rows);

    var gauge = document.createElement('div'); gauge.className = 'grow-gauge';
    var gfill = document.createElement('i');
    var gtxt = document.createElement('span'); gtxt.className = 'grow-txt';
    gauge.appendChild(gfill);
    wrap.appendChild(gauge); wrap.appendChild(gtxt);
    body().appendChild(wrap);

    function score() {
      var n = 0;
      GROUPS.forEach(function (g) { if (state[g.key] === g.good) n++; });
      return n;
    }
    function update() {
      var n = score();
      gfill.style.width = (n / 3 * 100) + '%';
      var label = ['거의 늘지 않아요', '조금 늘어요', '빠르게 늘어요', '아주 빠르게 번식해요'][n];
      gtxt.textContent = '세균 수: ' + label;
      gtxt.className = 'grow-txt' + (n === 3 ? ' hot' : '');
      if (n === 3) {
        Audio_.sfx('mission');
        hint('따뜻하고 촉촉하며 양분이 있으면 세균이 빠르게 번식해요.', 'good');
        U.$$('.cond-btn').forEach(function (e) { e.disabled = true; });
        setTimeout(function () {
          UI.banner('세균은 <b>살기 알맞은 조건</b>이 되면 빠르게 번식할 수 있어요.', 4200);
          done(true);
        }, 1500);
      } else {
        hint('조건을 바꾸면 세균 수가 어떻게 변하나요? (' + n + '/3)');
      }
    }
    U.$$('.cond-btn').forEach(function (e) {
      e.classList.toggle('sel', state[e.dataset.k] === e.dataset.v);
    });
    update();
  }

  whereStep();
};

/* ---------- 4b. 세균의 생활 속 역할 연결 (S3) ----------
   Never "good bacteria / bad bacteria" — the same organism group can help or harm
   depending on the situation, which is exactly what the textbook says. */
Missions.bacteria_roles = function (ctx, done) {
  head('과학 미션', '세균이 우리 생활에 주는 영향',
    '세균은 <b>이용되기도</b> 하고 <b>해로운 영향</b>을 주기도 해요. 각 사례를 알맞은 쪽으로 보내 주세요.');

  var CASES = [
    { img: 'impact_kimchi', t: '김치가 익어요', a: 'use', why: '세균이 김치를 익게 해요. (발효)' },
    { img: 'impact_yogurt', t: '요구르트를 만들어요', a: 'use', why: '세균이 우유를 요구르트로 만들어요. (발효)' },
    { img: 'impact_water_purification', t: '오염된 물을 정화해요', a: 'use', why: '오염 물질을 분해하는 세균을 이용해요.' },
    { img: 'impact_bread_spoilage', t: '음식이 상해요', a: 'harm', why: '세균과 균류는 음식을 상하게 하기도 해요.' },
    { img: 'impact_bacteria_disease', t: '질병을 일으켜요', a: 'harm', why: '어떤 세균은 다른 생물에게 질병을 일으켜요.' }
  ];
  var i = 0, sel = 0;

  var card = document.createElement('div'); card.className = 'role-card';
  var cimg = document.createElement('img'); cimg.alt = '';
  var ct = document.createElement('p');
  card.appendChild(cimg); card.appendChild(ct);
  var bins = document.createElement('div'); bins.className = 'bins';
  var btns = [];
  [['use', '도움을 줘요', '🍲'], ['harm', '해를 줘요', '⚠️']].forEach(function (b, n) {
    var el = document.createElement('button');
    el.className = 'bin role-bin';
    el.innerHTML = '<em>' + b[2] + '</em><span>' + b[1] + '</span>';
    el.addEventListener('click', function () { pick(b[0]); });
    el.addEventListener('mouseenter', function () { sel = n; mark(); });
    bins.appendChild(el); btns.push(el);
  });
  var meter = document.createElement('div'); meter.className = 'meter';
  var mi = document.createElement('i'); meter.appendChild(mi);
  body().appendChild(card); body().appendChild(bins); body().appendChild(meter);

  function mark() { btns.forEach(function (b, n) { b.classList.toggle('sel', n === sel); }); }
  function load() {
    var c = CASES[i];
    if (c.img) { cimg.src = 'assets/' + c.img + '.jpg'; cimg.style.display = ''; }
    else cimg.style.display = 'none';
    ct.textContent = c.t + '  (' + (i + 1) + '/' + CASES.length + ')';
    mi.style.width = (i / CASES.length * 100) + '%';
    mark();
  }
  function pick(a) {
    if (i >= CASES.length) return;      // ignore clicks during the closing beat
    var c = CASES[i];
    if (a === c.a) {
      Audio_.sfx('orb');
      hint(c.why, 'good');
      i++;
      if (i >= CASES.length) {
        mi.style.width = '100%';
        btns.forEach(function (b) { b.disabled = true; });
        Audio_.sfx('mission');
        hint('세균은 종류와 상황에 따라 도움을 주기도, 해를 주기도 해요.', 'good');
        setTimeout(function () {
          UI.banner('세균은 <b>발효</b>와 <b>정화</b>에 이용되기도 하고, <b>질병</b>을 일으키는 경우도 있어요.', 4400);
          done(true);
        }, 1400);
        return;
      }
      setTimeout(load, 700);
    } else {
      Audio_.sfx('fail');
      hint('다시 생각해 볼까요? 이 상황이 우리에게 도움이 되나요?', 'bad');
    }
  }
  ctx.key = function (Input) {
    if (Input.hit('left')) { sel = (sel + 1) % 2; mark(); Audio_.sfx('select'); }
    if (Input.hit('right')) { sel = (sel + 1) % 2; mark(); Audio_.sfx('select'); }
    if (Input.hit('confirm') || Input.hit('jump')) pick(['use', 'harm'][sel]);
  };
  load();
  hint('사례를 보고 알맞은 쪽을 골라 보세요.');
};

/* ---------- 5. 생명과학 활용 (ending) ---------- */
Missions.bioscience = function (ctx, done) {
  head('생명 과학', '우리 생활에 이용되는 생명 과학',
    '생명 과학은 다양한 생물을 연구해 <b>우리 생활의 문제를 해결</b>하는 데 도움을 줘요. 사례를 하나씩 살펴본 뒤 코어를 연결하세요.');

  /* Three photos side by side were thumbnail-sized on a classroom projector —
     nobody could tell what they were looking at. One case at a time, big, and
     the player decides when to move on. */
  var CASES = [
    { img: 'biotech_fungi_biopesticide', ext: '.jpg', tag: '균류',
      t: '균류 → 생물 농약',
      d: '균류를 이용해 <b>생물 농약</b>을 만들어요. 해충을 없애면서도 환경에 주는 피해를 줄일 수 있어요.' },
    { img: 'biotech_protist_biofuel', ext: '.jpg', tag: '원생생물',
      t: '원생생물 → 생물 연료',
      d: '원생생물을 이용해 <b>생물 연료</b>를 만들어요. 자동차나 비행기의 연료로 쓸 수 있어요.' },
    { img: 'impact_water_purification', ext: '.jpg', tag: '세균',
      t: '세균 → 물 정화',
      d: '세균을 이용해 <b>오염된 물을 정화</b>해요. 물속의 더러운 물질을 분해해 준답니다.' }
  ];

  var i = 0;
  var card = document.createElement('div');
  card.className = 'biotech-card';
  body().appendChild(card);

  function show() {
    var c = CASES[i];
    var last = i >= CASES.length - 1;
    card.innerHTML =
      '<p class="bt-step">사례 ' + (i + 1) + ' / ' + CASES.length + '</p>' +
      '<img class="bt-img" src="assets/' + c.img + (c.ext || '.png') + '" alt="">' +
      '<p class="bt-tag">' + c.tag + '</p>' +
      '<h4 class="bt-title">' + c.t + '</h4>' +
      '<p class="bt-desc">' + c.d + '</p>';
    var b = document.createElement('button');
    b.className = 'btn primary bt-go';
    b.textContent = last ? '코어 연결하기 ▶' : '다음 사례 ▶';
    b.addEventListener('click', function () {
      Audio_.sfx(last ? 'final' : 'core');
      if (last) {
        card.innerHTML = '<p class="bt-done">생명 과학 장치가 모두 켜졌어요!</p>';
        hint('다양한 생물이 우리 생활의 문제를 해결하는 데 쓰여요.', 'good');
        done(true);
      } else { i++; show(); }
    });
    card.appendChild(b);
    hint(last ? '세 가지 사례를 모두 살펴봤어요. 코어를 연결하세요.'
              : '사진과 설명을 살펴본 뒤 다음 사례로 넘어가세요.');
  }
  show();
};


/* alias: 최종 스테이지 상황 4 reuses the humidity dial */
Missions.restore_mold = function (ctx, done) { ctx.variant = 'mold'; Missions.humidity(ctx, done); };

UI.Missions = Missions;
W.SM.UI = UI;
})(window);
