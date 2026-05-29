// ════════════════════════════════════════════════════════════════════
//  H4CKERHQ — defense.js
//  CRT Color Tower Defense — spend ⚡ tokens to fortify against vuln waves
// ════════════════════════════════════════════════════════════════════

(function () {

  // ── CONSTANTS ────────────────────────────────────────────────────
  const CW = 760, CH = 360;     // internal canvas resolution
  const LANE_Y = 200;           // lane center Y
  const CASTLE_X = 60;          // castle center X
  const SPAWN_X = CW - 20;      // attacker spawn X

  const SLOT_DEFS = [
    { id: 's0', x: 160, y: 100 },   // above
    { id: 's1', x: 290, y: 275 },   // below
    { id: 's2', x: 420, y: 100 },   // above
    { id: 's3', x: 550, y: 275 },   // below
    { id: 's4', x: 680, y: 100 },   // above
  ];

  // ── THE MATH (simple & visible) ──────────────────────────────────
  //  THREAT  = total damage a wave deals if you block NOTHING (= sum of dmg).
  //  CASTLE  = 60 HP — small, so leaks really hurt (you can afford ~1 slip).
  //  Each tower blocks ~100 damage worth of attackers/wave.
  //  So: defense = 60 + 100×towers must beat the wave's threat → ~N towers for level N.
  //  dmg = damage to the castle if this enemy leaks.  hp = how tanky it is.
  const CASTLE_HP_MAX = 60;
  const ATTACKER_DEFS = {
    'weak-pw':    { label:'WEAK PW',   color:'#FFD700', bg:'#2D2500', speed:55,  hp:14, maxHp:14, dmg:34, desc:'basic brute-force bot'  },
    'api-key':    { label:'API KEY',   color:'#FF8C00', bg:'#2D1500', speed:72,  hp:24, maxHp:24, dmg:40, desc:'harvests exposed keys'  },
    'xss':        { label:'XSS',       color:'#C084FC', bg:'#1E0B35', speed:135, hp:12, maxHp:12, dmg:30, desc:'fast script injection'  },
    'sqli':       { label:'SQLi',      color:'#F87171', bg:'#2D0000', speed:36,  hp:55, maxHp:55, dmg:55, desc:'armored DB attack'       },
    'social-eng': { label:'???',       color:'#34D399', bg:'#002D1E', speed:92,  hp:20, maxHp:20, dmg:40, desc:'disguised as a real user'},
  };

  // power = how much THREAT (incoming damage) this tower blocks per wave — used for the
  // live "defense vs threat" readout so the math is visible. Castle base = 100.
  const TOWER_DEFS = [
    { id:'fence',     name:'Wooden Fence',      cost:3,  dmg:0,  range:0,   rate:0,    power:40,  color:'#92400E', emoji:'🪵', desc:'slows attackers 50%',          special:'slow'    },
    { id:'arrow',     name:'Arrow Tower',       cost:8,  dmg:7,  range:95,  rate:1300, power:100, color:'#9CA3AF', emoji:'🏹', desc:'basic damage to any target'                       },
    { id:'firewall',  name:'Firewall Node',     cost:15, dmg:6,  range:105, rate:1000, power:120, color:'#3B82F6', emoji:'🔥', desc:'slows + damages all types',     special:'slow'    },
    { id:'pw-val',    name:'PW Validator',      cost:20, dmg:35, range:85,  rate:1600, power:170, color:'#F59E0B', emoji:'🔐', desc:'3× dmg vs WEAK PW bots',        bonus:'weak-pw'   },
    { id:'api-vault', name:'API Vault',         cost:25, dmg:28, range:85,  rate:1400, power:170, color:'#F97316', emoji:'🗄️', desc:'3× dmg vs API KEY bots',        bonus:'api-key'   },
    { id:'input-san', name:'Input Sanitizer',   cost:30, dmg:60, range:75,  rate:1200, power:190, color:'#A78BFA', emoji:'🧹', desc:'instant kill on XSS bots',      bonus:'xss'       },
    { id:'ids',       name:'IDS Sensor',        cost:35, dmg:14, range:115, rate:850,  power:160, color:'#22D3EE', emoji:'📡', desc:'longest range, any attacker'                      },
    { id:'mfa',       name:'MFA Tower',         cost:45, dmg:22, range:95,  rate:650,  power:220, color:'#EC4899', emoji:'🔑', desc:'rapid fire, any attacker'                         },
    { id:'zero-trust',name:'Zero Trust',        cost:60, dmg:38, range:115, rate:480,  power:300, color:'#00FF88', emoji:'⬡',  desc:'max dmg, full spectrum'                           },
  ];

  // Each wave is defined by its enemy COUNTS. We auto-place spawn times with light
  // clustering (every 2nd enemy arrives quickly after the previous → bursts that a
  // single tower can't fully clear). Counts are tuned so total THREAT ≈ 100*N + 20.
  const wp='weak-pw', api='api-key', xss='xss', sql='sqli', soc='social-eng';

  // Round-robin the types into a mixed sequence, then time them.
  // interval = base gap; cluster (0..1) tightens every other gap into bursts.
  // Early levels are spaced (one basic tower can keep pace); later levels cluster
  // hard so a lone tower is overwhelmed → you must add/upgrade defenses.
  function makeWave(spec, interval, cluster) {
    const pools = spec.map(([type, count]) => ({ type, count }));
    const seq = [];
    let remaining = pools.reduce((s, p) => s + p.count, 0);
    while (remaining > 0) {
      for (const p of pools) { if (p.count > 0) { seq.push(p.type); p.count--; remaining--; } }
    }
    let t = 0; const out = [];
    for (let i = 0; i < seq.length; i++) {
      out.push({ type: seq[i], t: Math.round(t) });
      t += (i % 2 === 0) ? interval : interval * (1 - cluster);
    }
    return out;
  }

  const WAVE_SPECS = [
    [[wp,4]],                                   // L1  ~136
    [[wp,4],[xss,2],[api,1]],                    // L2  ~236
    [[wp,4],[xss,2],[api,3]],                    // L3  ~316
    [[wp,4],[xss,4],[api,3],[soc,1]],            // L4  ~416
    [[wp,4],[xss,4],[api,3],[soc,2],[sql,1]],    // L5  ~511
    [[wp,4],[xss,5],[api,4],[soc,2],[sql,2]],    // L6  ~636
    [[wp,4],[xss,5],[api,5],[soc,3],[sql,2]],    // L7  ~716
    [[wp,5],[xss,6],[api,5],[soc,3],[sql,3]],    // L8  ~835
    [[wp,5],[xss,6],[api,6],[soc,4],[sql,3]],    // L9  ~915
    [[wp,6],[xss,7],[api,6],[soc,4],[sql,4]],    // L10 ~1034
  ];
  const WAVE_DATA = WAVE_SPECS.map((spec, i) =>
    makeWave(spec, Math.max(1050, 2550 - i * 180), Math.min(0.55, i * 0.07)));

  // Total incoming damage (THREAT) of a wave if nothing is blocked.
  function waveThreat(idx) {
    const w = WAVE_DATA[Math.min(idx, WAVE_DATA.length - 1)] || [];
    return w.reduce((s, e) => s + (ATTACKER_DEFS[e.type] ? ATTACKER_DEFS[e.type].dmg : 0), 0);
  }
  function towerDefensePower() {
    return Object.values(gs.towers).reduce((s, tid) => {
      const d = TOWER_DEFS.find(t => t.id === tid); return s + (d ? d.power : 0);
    }, CASTLE_HP_MAX);
  }

  // ── GAME STATE ───────────────────────────────────────────────────
  let gs = {   // local game state (mirrors H.state for persistence)
    castleHp: 100,
    towers: {},
    wave: 1,
  };

  // runtime-only (not persisted)
  let attackers = [];
  let projectiles = [];
  let explosions = [];
  let spawnQueue = [];
  let waveTime = 0;
  let waveActive = false;
  let waveResult = null;   // null | 'win' | 'lose'
  let selectedTower = null;
  let campaign = null;     // { node } when defending to unlock a lesson
  let animFrame = null;
  let lastTs = 0;
  let canvas, ctx;
  let shakeFrames = 0;

  function syncFromState() {
    gs.castleHp = H.state.castleHp != null ? H.state.castleHp : 100;
    gs.towers   = H.state.towers   || {};
    gs.wave     = H.state.wave     || 1;
  }
  function syncToState() {
    H.state.castleHp = gs.castleHp;
    H.state.towers   = gs.towers;
    H.state.wave     = gs.wave;
    H.save();
  }

  // ── ROUTE HANDLER ────────────────────────────────────────────────
  H.route('defense', function () {
    stopLoop();
    syncFromState();
    attackers = []; projectiles = []; explosions = [];
    spawnQueue = []; waveActive = false; waveResult = null;
    selectedTower = null;
    // drop a stale campaign (e.g. arriving via the 🏰 nav after it's already cleared)
    if (campaign && (!campaign.node || !H.defensePending(campaign.node))) campaign = null;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="screen active">
        ${window.headerHTML ? headerHTML() : ''}
        <main class="def-main">
          <div class="crt-frame">
            <div class="crt-bezel">
              <div class="crt-brand">H4CKER HQ · DEFENSE MATRIX v1.0</div>
              <canvas id="defCanvas" width="${CW}" height="${CH}"></canvas>
              <div class="crt-scanlines"></div>
            </div>
            <div class="crt-legs"><span></span><span></span></div>
          </div>
          <div id="defHUD" class="def-hud"></div>
          <div id="defShop" class="def-shop"></div>
        </main>
      </div>`;

    canvas = document.getElementById('defCanvas');
    ctx = canvas.getContext('2d');

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasHover);

    renderHUD();
    renderShop();
    startLoop();
  });

  // ── INPUT ────────────────────────────────────────────────────────
  let hoverSlot = null;
  function canvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }
  function slotAtPoint(x, y) {
    return SLOT_DEFS.find(s => Math.hypot(x - s.x, y - s.y) < 28);
  }
  function handleCanvasHover(e) {
    const {x, y} = canvasCoords(e);
    hoverSlot = slotAtPoint(x, y);
    canvas.style.cursor = (hoverSlot && !gs.towers[hoverSlot.id] && selectedTower) ? 'crosshair' : '';
  }
  function handleCanvasClick(e) {
    if (!selectedTower) return;
    const {x, y} = canvasCoords(e);
    const slot = slotAtPoint(x, y);
    if (!slot) { selectedTower = null; renderShop(); return; }
    if (gs.towers[slot.id]) { H.toast('slot occupied', 'err'); return; }
    const def = TOWER_DEFS.find(t => t.id === selectedTower);
    if (!H.spendTokens(def.cost)) { H.toast('not enough ⚡ tokens', 'err'); return; }
    gs.towers[slot.id] = selectedTower;
    syncToState();
    selectedTower = null;
    renderShop();
    renderHUD();
    H.toast(`${def.emoji} ${def.name} deployed`, 'ok');
  }

  // ── WAVE MANAGEMENT ──────────────────────────────────────────────
  // The wave you face = your current LEVEL. Castle HP resets each attempt so a
  // loss just means "rebuild and retry" — never a dead end.
  function currentWaveIndex() {
    return Math.min((H.state.level || 1) - 1, WAVE_DATA.length - 1);
  }
  function currentChallengeNode() {
    return (typeof SKILL_TREE !== 'undefined') ? SKILL_TREE[(H.state.level || 1) - 1] : null;
  }

  function startWave() {
    if (waveActive) return;
    waveResult = null;
    gs.castleHp = CASTLE_HP_MAX;    // fresh castle each attempt
    syncToState();
    attackers = []; projectiles = []; explosions = [];
    spawnQueue = WAVE_DATA[currentWaveIndex()].slice().sort((a, b) => a.t - b.t);
    waveTime = 0;
    waveActive = true;
    renderHUD();
  }

  window.HDEFENSE = {
    startWave,
    // Campaign entry: a lesson was just cleared → defend to unlock the next.
    playLevel(node) {
      campaign = { node };
      H.go('#defense');
      H.dispatch();
      // brief "incoming" beat, then the wave auto-starts
      H.toast('⚠ INCOMING ATTACK — deploy defenses!', 'err');
      setTimeout(() => startWave(), 1600);
    },
    selectTower(id) {
      selectedTower = (selectedTower === id) ? null : id;
      renderShop();
    },
    sellTower(slotId) {
      const tid = gs.towers[slotId]; if (!tid) return;
      const def = TOWER_DEFS.find(t => t.id === tid);
      delete gs.towers[slotId];
      // refund (selling returns tokens you spent — not "earning" from the game)
      H.state.tokens = (H.state.tokens || 0) + Math.floor(def.cost * 0.5);
      H.save();
      const tv = document.querySelector('.token-val'); if (tv) tv.textContent = H.state.tokens;
      syncToState();
      renderShop();
      renderHUD();
      H.toast(`refunded ⚡${Math.floor(def.cost*0.5)}`, 'ok');
    },
  };

  // ── GAME LOOP ────────────────────────────────────────────────────
  // Use setInterval as primary driver — works in background/headless tabs unlike rAF.
  // Also schedule a rAF so the canvas syncs to display refresh rate when visible.
  let loopTimer = null;

  function startLoop() {
    stopLoop();
    lastTs = performance.now();
    loopTimer = setInterval(function () {
      const ts = performance.now();
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      update(dt);
      draw();
    }, 16);   // ~60fps target
  }

  function stopLoop() {
    if (loopTimer)  { clearInterval(loopTimer);          loopTimer  = null; }
    if (animFrame)  { cancelAnimationFrame(animFrame);   animFrame  = null; }
  }


  // ── UPDATE ───────────────────────────────────────────────────────
  const towerCooldowns = {};

  function update(dt) {
    if (!waveActive) return;
    waveTime += dt * 1000;

    // Spawn from queue
    while (spawnQueue.length && spawnQueue[0].t <= waveTime) {
      const e = spawnQueue.shift();
      spawnAttacker(e.type);
    }

    // Move attackers
    for (const a of attackers) {
      if (a.dead) continue;
      a.x -= a.def.speed * (a.slowed ? 0.4 : 1) * dt;
      a.slowed = false;  // reset each frame; fences re-apply

      // Apply nearby fence slow
      for (const sl of SLOT_DEFS) {
        if (gs.towers[sl.id] === 'fence' && Math.abs(a.x - sl.x) < 55) a.slowed = true;
      }

      // Reached castle
      if (a.x <= CASTLE_X + 35) {
        a.dead = true;
        gs.castleHp = Math.max(0, gs.castleHp - a.def.dmg);
        shakeFrames = 18;
        syncToState();
        renderHUD();
        addExplosion(CASTLE_X + 20, LANE_Y, '#ff5555', 28);
        if (gs.castleHp <= 0) { endWave('lose'); return; }
      }
    }

    // Tower firing
    const now = ts_now();
    for (const sl of SLOT_DEFS) {
      const tid = gs.towers[sl.id];
      if (!tid || tid === 'fence') continue;
      const def = TOWER_DEFS.find(t => t.id === tid);
      if (!def || !def.range) continue;
      if (now - (towerCooldowns[sl.id] || 0) < def.rate) continue;

      const target = attackers
        .filter(a => !a.dead && Math.abs(a.x - sl.x) <= def.range)
        .sort((a, b) => a.x - b.x)[0];

      if (target) {
        towerCooldowns[sl.id] = now;
        let dmg = def.dmg;
        if (def.bonus && target.type === def.bonus) dmg = Math.floor(dmg * 3.5);
        projectiles.push({ x: sl.x, y: sl.y, target, dmg, color: def.color, speed: 380, done: false });
      }
    }

    // Move projectiles
    for (const p of projectiles) {
      if (p.done || p.target.dead) { p.done = true; continue; }
      const dx = p.target.x - p.x, dy = LANE_Y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        p.done = true;
        p.target.hp -= p.dmg;
        if (p.target.hp <= 0) {
          p.target.dead = true;
          addExplosion(p.target.x, LANE_Y, p.target.def.color, 20);
          // NOTE: no tokens from kills — tokens are earned ONLY by completing lessons.
        }
      } else {
        p.x += (dx / dist) * p.speed * dt;
        p.y += (dy / dist) * p.speed * dt;
      }
    }
    projectiles = projectiles.filter(p => !p.done);
    attackers = attackers.filter(a => !a.dead);

    // Update explosions
    for (const ex of explosions) { ex.life -= dt; }
    explosions = explosions.filter(ex => ex.life > 0);

    // Check wave complete — castle dead always loses (defensive double-check)
    if (!waveResult && spawnQueue.length === 0 && attackers.length === 0) {
      endWave(gs.castleHp > 0 ? 'win' : 'lose');
    }
    if (shakeFrames > 0) shakeFrames--;
  }

  function ts_now() { return performance.now(); }

  function spawnAttacker(type) {
    const def = ATTACKER_DEFS[type];
    if (!def) return;
    attackers.push({ type, def, x: SPAWN_X, hp: def.hp, maxHp: def.hp, dead: false, slowed: false });
  }

  function addExplosion(x, y, color, r) {
    explosions.push({ x, y, color, r, life: 0.5, maxLife: 0.5 });
  }

  function endWave(result) {
    waveActive = false;
    waveResult = result;
    projectiles = [];
    if (result === 'win') {
      addExplosion(CASTLE_X, LANE_Y - 40, '#00ff88', 40);
      syncToState();
      // Did this win clear a pending lesson's defense? → LEVEL UP.
      const node = currentChallengeNode();
      if (node && H.defensePending(node)) {
        const newLevel = (H.state.level || 1) + 1;
        H.levelUp(node);                 // marks complete, bumps level, +defense rating
        stopLoop();
        campaign = null;
        showLevelUp(node, newLevel);
        return;
      }
    } else {
      // LOSS — sad, motivating splash.
      stopLoop();
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      showDefeat();
      return;
    }
    renderHUD();
  }

  // ── DEFEAT SPLASH ────────────────────────────────────────────────
  function showDefeat() {
    const threat = waveThreat(currentWaveIndex());
    const def = towerDefensePower();
    const short = Math.max(0, threat - def);
    const ov = document.createElement('div');
    ov.className = 'reward-ov';
    ov.innerHTML = `
      <div class="reward-card defeat-card">
        <div class="reward-eyebrow defeat-eyebrow">💀 FORTRESS OVERRUN 💀</div>
        <div class="defeat-castle">🏚️</div>
        <h2 class="defeat-h">your castle fell.</h2>
        <p class="defeat-msg">you need to get <b>stronger</b>. build your skills, earn ⚡ tokens, and deploy more defenses to survive this wave.</p>
        <div class="defeat-math">
          incoming threat <b class="dm-threat">${threat}</b> &nbsp;vs&nbsp; your defense <b class="dm-def">${def}</b><br>
          <span class="dm-short">${short > 0 ? `you were ~${short} power short — add about ${Math.ceil(short / 100)} more tower${Math.ceil(short/100)>1?'s':''}` : 'tighten your tower placement and try again'}</span>
        </div>
        <button class="btn-primary reward-btn" id="dfRetry">↺ REBUILD & RETRY</button>
        <button class="btn-ghost reward-btn2" id="dfLearn">📚 go learn (earn tokens)</button>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#dfRetry').onclick = () => { ov.remove(); H.go('#defense'); H.dispatch(); };
    ov.querySelector('#dfLearn').onclick = () => { ov.remove(); H.go('#map'); H.dispatch(); };
  }

  // ── LEVEL-UP SPLASH ──────────────────────────────────────────────
  function showLevelUp(node, newLevel) {
    const next = (typeof SKILL_TREE !== 'undefined') ? SKILL_TREE[newLevel - 1] : null;
    const ov = document.createElement('div');
    ov.className = 'reward-ov';
    ov.innerHTML = `
      <div class="reward-card levelup-card">
        <div class="lu-rays"></div>
        <div class="reward-eyebrow">⬡ WAVE REPELLED ⬡</div>
        <div class="lu-level">LEVEL ${newLevel}</div>
        <div class="lu-fortress">🛡 fortress integrity +${node.defense}</div>
        ${next
          ? `<div class="lu-unlock">🔓 UNLOCKED<br><b>${next.icon} ${next.title}</b></div>
             <button class="btn-primary reward-btn" id="luNext">→ NEXT MISSION</button>`
          : `<div class="lu-unlock">🏆 <b>ALL SKILLS MASTERED</b><br>you've cleared the campaign.</div>
             <button class="btn-primary reward-btn" id="luNext">→ back to base</button>`}
        <button class="btn-ghost reward-btn2" id="luStay">stay & fortify 🏰</button>
      </div>`;
    document.body.appendChild(ov);
    if (navigator.vibrate) navigator.vibrate([40, 60, 80]);
    ov.querySelector('#luNext').onclick = () => {
      ov.remove();
      if (next) { H.go('#lesson/' + next.id); H.dispatch(); }
      else { H.go('#map'); H.dispatch(); }
    };
    ov.querySelector('#luStay').onclick = () => { ov.remove(); H.go('#defense'); H.dispatch(); };
  }

  // ── DRAW ─────────────────────────────────────────────────────────
  function draw() {
    if (!ctx) return;
    ctx.save();
    if (shakeFrames > 0) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4);
    }

    // Background
    ctx.fillStyle = '#080C12';
    ctx.fillRect(0, 0, CW, CH);

    // Subtle grid
    ctx.fillStyle = 'rgba(0,255,136,0.025)';
    for (let gx = 0; gx < CW; gx += 24) ctx.fillRect(gx, 0, 1, CH);
    for (let gy = 0; gy < CH; gy += 24) ctx.fillRect(0, gy, CW, 1);

    // Path
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 44;
    ctx.beginPath();
    ctx.moveTo(CASTLE_X + 40, LANE_Y);
    ctx.lineTo(CW, LANE_Y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,255,136,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(CASTLE_X + 40, LANE_Y);
    ctx.lineTo(CW, LANE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Tower slots
    for (const sl of SLOT_DEFS) {
      const tid = gs.towers[sl.id];
      // connector line
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.y + (sl.y < LANE_Y ? 20 : -20));
      ctx.lineTo(sl.x, LANE_Y + (sl.y < LANE_Y ? -22 : 22));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      if (tid) {
        drawTower(sl, tid);
      } else {
        // empty slot
        const isTarget = selectedTower && hoverSlot && hoverSlot.id === sl.id;
        ctx.save();
        ctx.strokeStyle = isTarget ? 'rgba(0,255,136,0.7)' : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(sl.x - 18, sl.y - 18, 36, 36);
        ctx.setLineDash([]);
        ctx.fillStyle = isTarget ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(sl.x - 18, sl.y - 18, 36, 36);
        ctx.fillStyle = isTarget ? 'rgba(0,255,136,0.8)' : 'rgba(255,255,255,0.2)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isTarget ? '⬡' : 'SLOT', sl.x, sl.y + 3);
        ctx.restore();
      }
    }

    // Castle
    drawCastle();

    // Attackers
    for (const a of attackers) if (!a.dead) drawAttacker(a);

    // Projectiles
    for (const p of projectiles) if (!p.done) drawProjectile(p);

    // Explosions
    for (const ex of explosions) drawExplosion(ex);

    // Wave result overlay
    if (waveResult) drawWaveResult();

    // Scanlines (on top)
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#000';
    for (let sy = 0; sy < CH; sy += 3) ctx.fillRect(0, sy, CW, 1);
    ctx.restore();

    ctx.restore();
  }

  function drawCastle() {
    const hp = gs.castleHp / 100;
    const cx = 28, cy = 120, cw = 60, ch = 100;
    const col = hp > 0.5 ? '#00ff88' : hp > 0.25 ? '#ffd866' : '#ff5555';

    // Glow
    ctx.shadowBlur = hp > 0.25 ? 18 : 30;
    ctx.shadowColor = col;

    // Body
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx, cy, cw, ch);

    // Battlements
    ctx.fillStyle = '#1e293b';
    for (let bx = cx; bx < cx + cw; bx += 14) {
      ctx.fillRect(bx + 1, cy - 10, 9, 10);
    }

    // Gate arch
    ctx.fillStyle = '#080C12';
    ctx.beginPath();
    ctx.arc(cx + cw / 2, cy + ch * 0.78, 11, Math.PI, 0);
    ctx.fillRect(cx + cw / 2 - 11, cy + ch * 0.78, 22, 22);
    ctx.fill();

    // Arrow slits
    ctx.fillStyle = '#080C12';
    ctx.fillRect(cx + 10, cy + 20, 4, 10);
    ctx.fillRect(cx + cw - 14, cy + 20, 4, 10);

    // Border
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);
    ctx.shadowBlur = 0;

    // HP bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx, cy + ch + 5, cw, 7);
    ctx.fillStyle = col;
    ctx.shadowBlur = 8; ctx.shadowColor = col;
    ctx.fillRect(cx, cy + ch + 5, cw * hp, 7);
    ctx.shadowBlur = 0;

    // HP text
    ctx.fillStyle = col;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${gs.castleHp}HP`, cx + cw / 2, cy + ch + 22);

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '8px monospace';
    ctx.fillText('CASTLE', cx + cw / 2, cy - 14);
    ctx.textAlign = 'left';
  }

  function drawTower(sl, tid) {
    const def = TOWER_DEFS.find(t => t.id === tid);
    if (!def) return;
    const r = 18;
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = def.color;
    ctx.fillStyle = def.color + '22';
    ctx.beginPath();
    ctx.arc(sl.x, sl.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sl.x, sl.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = def.color;
    ctx.font = '13px serif';
    ctx.textAlign = 'center';
    ctx.fillText(def.emoji, sl.x, sl.y + 5);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '7px monospace';
    ctx.fillText(def.id.slice(0, 5).toUpperCase(), sl.x, sl.y + r + 10);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawAttacker(a) {
    const def = a.def;
    const w = 52, h = 26;
    const x = a.x - w / 2, y = LANE_Y - h / 2;
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = def.color;
    ctx.fillStyle = def.bg;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = def.color;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(def.label, a.x, LANE_Y + 3);
    // HP bar
    const hpPct = Math.max(0, a.hp / a.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y + h + 2, w, 3);
    ctx.fillStyle = hpPct > 0.5 ? def.color : '#ff5555';
    ctx.fillRect(x, y + h + 2, w * hpPct, 3);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawProjectile(p) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawExplosion(ex) {
    const t = 1 - ex.life / ex.maxLife;
    const r = ex.r * (0.5 + t * 1.5);
    ctx.save();
    ctx.globalAlpha = ex.life / ex.maxLife * 0.8;
    ctx.shadowBlur = 25;
    ctx.shadowColor = ex.color;
    ctx.strokeStyle = ex.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = ex.life / ex.maxLife * 0.3;
    ctx.fillStyle = ex.color;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawWaveResult() {
    const win = waveResult === 'win';
    ctx.save();
    ctx.fillStyle = win ? 'rgba(0,0,0,0.55)' : 'rgba(20,0,0,0.7)';
    ctx.fillRect(0, 0, CW, CH);
    const txt = win ? `WAVE ${gs.wave} REPELLED` : 'CASTLE BREACHED';
    const sub = win ? `+⚡ tokens earned · wave ${gs.wave + 1} incoming` : 'your defenses failed — complete more lessons for tokens';
    ctx.shadowBlur = 30;
    ctx.shadowColor = win ? '#00ff88' : '#ff5555';
    ctx.fillStyle = win ? '#00ff88' : '#ff5555';
    ctx.font = `bold 28px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(txt, CW / 2, CH / 2 - 24);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px monospace';
    ctx.fillText(sub, CW / 2, CH / 2 + 8);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px monospace';
    ctx.fillText(win ? '[ tap START WAVE to continue ]' : '[ tap REBUILD to retry ]', CW / 2, CH / 2 + 34);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // roundRect helper
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ── HUD ──────────────────────────────────────────────────────────
  function renderHUD() {
    const hud = document.getElementById('defHUD');
    if (!hud) return;
    const hp = gs.castleHp;
    const lvl = H.state.level || 1;
    const hpColor = hp > 50 ? '#00ff88' : hp > 25 ? '#ffd866' : '#ff5555';
    const node = currentChallengeNode();
    const defending = campaign && campaign.node ? campaign.node : (node && H.defensePending(node) ? node : null);
    const wt = waveResult === 'win' ? '🟢 REPELLED' : waveResult === 'lose' ? '🔴 BREACHED — REBUILD' : waveActive ? '⚔️ UNDER ATTACK' : 'READY';
    const btnLabel = waveResult === 'lose' ? '↺ REBUILD & RETRY' : waveActive ? '⚔ UNDER ATTACK' : `▶ START WAVE ${lvl}`;
    // The visible math: incoming THREAT vs your DEFENSE (castle 100 + towers).
    const threat = waveThreat(currentWaveIndex());
    const def = towerDefensePower();
    const outgunned = def < threat;
    const balanceColor = outgunned ? '#ff5555' : '#00ff88';
    const balanceMsg = outgunned
      ? `⚠ OUTGUNNED by ${threat - def} — add ~${Math.ceil((threat - def) / 100)} tower${Math.ceil((threat-def)/100)>1?'s':''}`
      : '✓ defenses look strong enough';
    hud.innerHTML = `
      ${defending ? `<div class="def-campaign">⚔ DEFENDING: <b>${defending.icon} ${defending.title}</b> — survive the wave to unlock the next skill</div>` : ''}
      <div class="threat-meter">
        <div class="tm-side"><span class="tm-lbl">🗡 INCOMING THREAT</span><span class="tm-val tm-threat">${threat}</span></div>
        <div class="tm-vs">vs</div>
        <div class="tm-side"><span class="tm-lbl">🛡 YOUR DEFENSE</span><span class="tm-val tm-def">${def}</span></div>
        <div class="tm-verdict" style="color:${balanceColor}">${balanceMsg}</div>
      </div>
      <div class="dhud-row">
        <div class="dhud-stat"><span class="ds-lbl">CASTLE HP</span><span class="ds-val" style="color:${hpColor}">${hp}/${CASTLE_HP_MAX}</span></div>
        <div class="dhud-stat"><span class="ds-lbl">⚡ TOKENS</span><span class="ds-val" style="color:#ffd866">${H.state.tokens || 0}</span></div>
        <div class="dhud-stat"><span class="ds-lbl">LEVEL · WAVE</span><span class="ds-val">${lvl} · ${wt}</span></div>
        <button class="wave-btn ${waveActive ? 'active' : ''}" onclick="HDEFENSE.startWave()">${btnLabel}</button>
      </div>`;
  }

  // ── SHOP ─────────────────────────────────────────────────────────
  function renderShop() {
    const shop = document.getElementById('defShop');
    if (!shop) return;
    const tokens = H.state.tokens || 0;

    const placedTowerRows = SLOT_DEFS
      .filter(sl => gs.towers[sl.id])
      .map(sl => {
        const def = TOWER_DEFS.find(t => t.id === gs.towers[sl.id]);
        return `<div class="placed-tower">
          <span class="pt-em">${def.emoji}</span>
          <span class="pt-name">${def.name}</span>
          <span class="pt-slot">slot ${sl.id.slice(1)}</span>
          <button class="pt-sell" onclick="HDEFENSE.sellTower('${sl.id}')">sell ⚡${Math.floor(def.cost*0.5)}</button>
        </div>`;
      }).join('');

    shop.innerHTML = `
      <div class="shop-header">
        <span>🏗 BUILD DEFENSES</span>
        <span class="shop-hint">tap a tower to select · tap an empty slot on the map to place</span>
      </div>
      ${placedTowerRows ? `<div class="placed-row">${placedTowerRows}</div>` : ''}
      <div class="tower-grid">
        ${TOWER_DEFS.map(t => {
          const canAfford = tokens >= t.cost;
          const isSel = selectedTower === t.id;
          return `<button class="tc ${canAfford ? '' : 'broke'} ${isSel ? 'selected' : ''}"
                    onclick="HDEFENSE.selectTower('${t.id}')" ${canAfford ? '' : 'title="need more tokens — complete lessons"'}>
            <div class="tc-top"><span class="tc-em">${t.emoji}</span><span class="tc-cost ${canAfford ? '' : 'cant'}">⚡${t.cost}</span></div>
            <div class="tc-name">${t.name}</div>
            <div class="tc-desc">${t.desc}</div>
          </button>`;
        }).join('')}
      </div>
      <div class="shop-tip">earn tokens by completing lessons on the <a href="#map">skill map 🗺</a></div>`;
  }

})();
