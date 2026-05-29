// ════════════════════════════════════════════════════════════════════
//  H4CKERHQ — game.js
//  header/HUD, fortress visual, skill map, breach cold-open, attack waves
// ════════════════════════════════════════════════════════════════════

// ⬆ BUMP THIS on every push so you can confirm the deploy went live.
const APP_VERSION = 'v0.5';

// Shared top chrome (header + fortress HUD) used by every screen.
window.headerHTML = function (opts) {
  opts = opts || {};
  const pct = H.defensePct();
  const tier = pct < 20 ? 'EXPOSED' : pct < 45 ? 'HARDENING' : pct < 75 ? 'FORTIFIED' : 'LOCKED DOWN';
  return `
    <header class="hq-header">
      <div class="hq-top">
        <h1 class="logo">▓▓ H4CKER HQ ▓▓ <span class="ver">${APP_VERSION}</span></h1>
        <nav class="hq-nav">
          <a href="#map" class="navbtn" title="map">🗺</a>
          <a href="#defense" class="navbtn" title="fortress defense">🏰</a>
          <a href="#manual" class="navbtn" title="field manual">📖</a>
          <a href="#armory" class="navbtn" title="armory">⚔</a>
          <a href="#threats" class="navbtn" title="threat board">🚩</a>
          <button class="dt-btn" onclick="window.devtools()" title="open devtools">🛠</button>
        </nav>
      </div>
      <div class="token-hud" title="spend tokens in 🏰 fortress defense">⚡ <span class="token-val">${H.state.tokens || 0}</span> tokens</div>
      <div class="defense-bar" title="fortress integrity">
        <div class="defense-label">🛡 FORTRESS INTEGRITY · <span class="tier">${tier}</span></div>
        <div class="defense-track"><div class="defense-fill" style="width:${pct}%"></div><span class="defense-pct">${pct}%</span></div>
        ${fortressArt(pct)}
      </div>
    </header>`;
};

// Fortress drawn as wall segments + turrets that grow with integrity.
function fortressArt(pct) {
  const SEG = 12;
  const lit = Math.round((pct / 100) * SEG);
  let walls = '';
  for (let i = 0; i < SEG; i++) {
    const on = i < lit;
    const turret = on && (i % 4 === 1) ? '<span class="turret">▟▙</span>' : '';
    walls += `<span class="seg ${on ? 'on' : 'off'}">${turret}<span class="brick">${on ? '▆' : '▁'}</span></span>`;
  }
  return `<div class="fortress">${walls}</div>`;
}

// ── MAP / SKILL TREE ────────────────────────────────────────────────
H.route('map', function () {
  const app = document.getElementById('app');
  const tracks = { core: 'CORE TRAINING', offense: '⚔ OFFENSE', defense: '🛡 DEFENSE' };
  let nodesHTML = '';
  let prevTrack = null;
  const FIRST_N_VISIBLE = 4; // ← hint: change this to unlock more lessons at once

  SKILL_TREE.forEach((node, idx) => {
    if (node.track !== prevTrack) {
      nodesHTML += `<div class="track-label">${tracks[node.track] || node.track}</div>`;
      prevTrack = node.track;
    }
    const done = H.nodeComplete(node);
    const open = H.nodeUnlocked(node);
    const cls = done ? 'done' : open ? 'open' : 'locked';
    const tasksTotal = node.tasks.length;
    const tasksDone = node.tasks.filter((_, i) => H.taskDone(node.id, i)).length;

    // ← DYNAMIC BLUR: always show first 3 lessons, then only show unlocked/completed ones
    // blurred lessons are still in the DOM — inspect them & ask why they're hidden!
    // as you complete lessons, the blur lifts on the next locked lesson.
    const alwaysVisible = idx < FIRST_N_VISIBLE;
    const isFuture = !alwaysVisible && !open ? 'future-content' : '';

    nodesHTML += `
      <div class="node ${cls} ${isFuture}" ${open ? `onclick="H.go('#lesson/${node.id}')"` : ''}>
        <div class="node-icon">${done ? '✓' : open ? node.icon : '🔒'}</div>
        <div class="node-body">
          <div class="node-title">${node.title} ${node.wave ? '<span class="boss-tag">⚠ BOSS</span>' : ''}</div>
          <div class="node-blurb">${open ? node.blurb : 'locked — finish the node before this one.'}</div>
          ${open && !done ? `<div class="node-prog">${tasksDone}/${tasksTotal} tasks · +${node.defense} 🛡</div>` : ''}
          ${done ? `<div class="node-prog done">cleared · +${node.defense} 🛡</div>` : ''}
        </div>
      </div>`;
  });

  app.innerHTML = `
    <div class="screen active">
      ${headerHTML()}
      <main class="map">
        <div class="map-intro">
          <p>your fortress is under constant attack. every skill you learn becomes a wall, a turret, a patch. <strong>climb the path. survive the waves.</strong></p>
        </div>
        <div class="tree">${nodesHTML}</div>
        <div class="map-foot">
          <a onclick="if(confirm('Restart the whole campaign from Level 1? Your tokens, towers, and lesson progress will reset.')) H.resetProgress()">↺ restart campaign</a>
        </div>
      </main>
    </div>`;
});

// ════════════════════════════════════════════════════════════════════
//  INTRO SEQUENCE: boring site → INCOMING ATTACK → breach → premise → pledge
// ════════════════════════════════════════════════════════════════════
let BREACH_TIMERS = [];
let BREACH_RAF = null;
let BREACH_DONE = false;
function breachClear() { BREACH_TIMERS.forEach(clearTimeout); BREACH_TIMERS = []; if (BREACH_RAF) cancelAnimationFrame(BREACH_RAF); }
function bTimer(fn, ms) { const id = setTimeout(fn, ms); BREACH_TIMERS.push(id); return id; }

// entry point for first-time players (called by core dispatch when !pledged)
window.startIntro = function () { renderBoring(); };

// ── PHASE 0: the boring "learn to code" decoy site ──────────────────
function renderBoring() {
  BREACH_DONE = false;
  breachClear();
  const modules = [
    'Introduction to Programming', 'Setting Up Your Environment', 'Variables and Data Types',
    'Operators and Expressions', 'Conditional Statements (if / else)', 'Loops: for and while',
    'Functions and Scope', 'Arrays and Lists', 'Objects and Dictionaries', 'String Manipulation',
    'Error Handling Basics', 'Reading and Writing Files', 'Introduction to the DOM',
    'Events and Event Listeners', 'Working with Forms', 'Asynchronous JavaScript', 'Fetch and APIs',
    'Introduction to Databases', 'Version Control with Git', 'Deploying Your First App',
    'Code Style and Best Practices', 'Debugging Techniques', 'Unit Testing Fundamentals', 'Final Project',
  ];
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen active">
      <div class="boring" id="boring">
        <div class="boring-nav"><span class="boring-logo">CodePath Academy™</span>
          <span class="boring-links">Home · Courses · Pricing · My Account · Help</span></div>
        <div class="boring-hero">
          <h1>Intro to Programming — Self-Paced Course</h1>
          <p>Welcome back, student! Continue your learning journey. You have completed <b>0%</b> of this course.</p>
          <button class="boring-btn" onclick="window.__boringPoke&&window.__boringPoke()">▶ Resume Lesson 1</button>
        </div>
        <h2 class="boring-h2">Table of Contents</h2>
        <ol class="boring-toc">
          ${modules.map((m, i) => `<li onclick="window.__boringPoke&&window.__boringPoke()"><span class="toc-mod">Module ${i + 1}</span><span class="toc-name">${m}</span><span class="toc-status">${i === 0 ? 'Not started' : 'Locked'}</span></li>`).join('')}
        </ol>
        <div class="boring-foot">© CodePath Academy. All rights reserved. Terms · Privacy · Cookies</div>
      </div>
      <div class="attack-flash" id="attackFlash"></div>
      <div class="breach-host" id="breachHost"></div>
      <div class="bs-premise" id="bsPremise"></div>
    </div>`;

  // trigger the attack after ~22s OR after a few interactions — whichever first
  let pokes = 0, fired = false;
  function fire() { if (fired) return; fired = true; breachClear(); transitionToAttack(); }
  window.__boringPoke = function () { if (++pokes >= 4) fire(); };
  bTimer(fire, 22000);
}

// ── PHASE 1: "INCOMING CYBER ATTACK" transition ─────────────────────
function transitionToAttack() {
  const flash = document.getElementById('attackFlash');
  const boring = document.getElementById('boring');
  if (boring) boring.classList.add('boring-hit');
  if (flash) {
    flash.classList.add('show');
    flash.innerHTML = '<div class="af-text">⚠ INCOMING CYBER ATTACK ⚠</div><div class="af-sub">unauthorized access detected · securing perimeter…</div>';
  }
  bTimer(renderBreachScene, 2600);
}

// ── PHASE 2: the breach cinematic ───────────────────────────────────
function renderBreachScene() {
  BREACH_DONE = false;
  breachClear();
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen active">
      <div class="breach-scene" id="bscene">
        <button class="bs-skip" id="bsSkip">skip ▸</button>
        <div class="bs-topbar"><span class="bs-sys">DEFENSE-GRID v0.1</span><span class="bs-status" id="bsStatus">● STATUS: NOMINAL</span></div>
        <div class="bs-grid">
          <div class="bs-log" id="bsLog"></div>
          <div class="bs-radar">
            <canvas id="bsCanvas"></canvas>
            <div class="bs-radar-label">⌖ TARGET: <b>tower.local</b></div>
            <div class="bs-ids" id="bsIds">INTRUSION DETECTION: <span>watching…</span></div>
          </div>
        </div>
        <div class="bs-meter"><div class="bs-meter-label">BREACH PROGRESS</div><div class="bs-meter-track"><div class="bs-meter-fill" id="bsMeter"></div></div></div>
        <div class="bs-controls" id="bsControls">
          <span class="bs-ctrl-label">EMERGENCY CONTROLS</span>
          <button class="bs-ctrl" onclick="window.bsPanic('restart',this)">🔄 SYSTEM RESTART</button>
          <button class="bs-ctrl" onclick="window.bsPanic('block',this)">🛡 BLOCK ATTACK</button>
          <button class="bs-ctrl" onclick="window.bsPanic('firewall',this)">🔥 FIREWALL +</button>
          <button class="bs-ctrl" onclick="window.bsPanic('call',this)">📞 CALL IT</button>
        </div>
        <div class="bs-console">
          <span class="bs-prompt">tower@defense:~$</span>
          <input id="bsInput" autocomplete="off" spellcheck="false" placeholder="try to fight back… (type anything)">
        </div>
      </div>
      <div class="bs-premise" id="bsPremise"></div>
    </div>`;

  document.getElementById('bsSkip').onclick = breachToPremise;

  const input = document.getElementById('bsInput');
  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const cmd = input.value.trim(); input.value = '';
    if (!cmd) return;
    logLine(`tower@defense:~$ ${cmd}`, 'user');
    const burns = ['ACCESS DENIED — you don\'t have the tools yet.', 'command not found. (that\'s the point.)', 'permission denied: you have no defenses installed.', 'nice try. learn the skill first.'];
    logLine('↳ ' + burns[Math.floor(Math.random() * burns.length)], 'deny');
  });

  startRadar();
  runBreachLog();
}

// the panic buttons: clickable, satisfying, and utterly useless
window.bsPanic = function (type, btn) {
  const msgs = {
    restart: ['[sys] rebooting host…', '[sys] reboot FAILED — attacker persisted in memory'],
    block: ['[def] attempting to block 7 origins…', '[def] block FAILED — no firewall is installed'],
    firewall: ['[def] increasing firewall level…', '[def] ruleset is still <empty>. nothing to increase.'],
    call: ['[phone] ringing IT support…', "[phone] IT: \"have you tried learning security? 🙂\""],
  }[type] || ['[sys] …', '[sys] nothing happened'];
  logLine(msgs[0], 'user');
  bTimer(() => logLine('↳ ' + msgs[1], 'deny'), 350);
  // make it worse
  const m = document.getElementById('bsMeter');
  if (m) { const cur = parseInt(m.style.width) || 0; setMeter(Math.min(100, cur + 4)); }
  if (btn) { btn.classList.add('failed'); btn.textContent = '✖ FAILED'; btn.disabled = true; }
};

function logLine(text, cls) {
  const log = document.getElementById('bsLog');
  if (!log) return;
  const d = document.createElement('div');
  d.className = 'bs-logline ' + (cls || '');
  d.textContent = text;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

function setStatus(text, cls) {
  const s = document.getElementById('bsStatus');
  if (s) { s.textContent = text; s.className = 'bs-status ' + cls; }
}
function setMeter(pct) { const m = document.getElementById('bsMeter'); if (m) m.style.width = pct + '%'; }

// scripted server/IDS log + escalation timeline
function runBreachLog() {
  const script = [
    { t: '[sys] defense-grid.service started', c: 'dim', d: 1000, m: 2, spawn: 1 },
    { t: '[net] inbound connections: 3 unknown origins', c: '', d: 1100, m: 6, spawn: 2 },
    { t: '[ids] signature match: PORT-SCAN ×214', c: 'warn', d: 1100, m: 12, spawn: 1, status: ['● STATUS: ELEVATED', 'warn'] },
    { t: '↳ try the EMERGENCY CONTROLS below 👇', c: 'prompt', d: 1300 },
    { t: '[net] AS-13335 → tower.local:443', c: '', d: 1100, m: 18, spawn: 1 },
    { t: '[ids] !! auth-bypass attempt on /admin', c: 'warn', d: 1100, m: 26, spawn: 1 },
    { t: '[sys] firewall ruleset: <empty>', c: 'red', d: 1200, m: 32 },
    { t: '↳ type ANY command + Enter to fight back ⌨', c: 'prompt', d: 1300 },
    { t: '[ids] !! credential stuffing: 1,204 tries', c: 'warn', d: 1100, m: 40, spawn: 2 },
    { t: '[net] +14 more hosts joined the attack', c: 'red', d: 1100, m: 48, spawn: 3 },
    { t: '[sys] WARN: no input validation on /api/*', c: 'red', d: 1200, m: 56, status: ['● STATUS: CRITICAL', 'crit'] },
    { t: '[ids] !! SQL payload accepted (0 sanitization)', c: 'red', d: 1100, m: 64, spawn: 2 },
    { t: '↳ nothing\'s working… because you have NO defenses yet', c: 'prompt', d: 1400 },
    { t: '[sys] CRIT: admin token found in client bundle', c: 'red', d: 1100, m: 74 },
    { t: '[net] exfiltration channel OPEN', c: 'red', d: 1100, m: 82, spawn: 2 },
    { t: '[ids] data leaving: users.db (35,000 rows)', c: 'red', d: 1100, m: 90 },
    { t: '[sys] searching for last line of defense…', c: 'red', d: 1300, m: 96 },
    { t: '[ids] defenses remaining: NONE', c: 'red', d: 1000, m: 100 },
  ];
  let i = 0;
  (function step() {
    if (i >= script.length) { bTimer(triggerBreachClimax, 500); return; }
    const ln = script[i++];
    logLine(ln.t, ln.c);
    if (ln.status) setStatus(ln.status[0], ln.status[1]);
    if (ln.m != null) setMeter(ln.m);
    if (ln.spawn) for (let k = 0; k < ln.spawn; k++) spawnAttacker();
    if (ln.c === 'red' || ln.c === 'warn') {
      const ids = document.getElementById('bsIds');
      if (ids) { ids.classList.add('alarm'); ids.querySelector('span').textContent = 'THREATS DETECTED'; }
    }
    bTimer(step, ln.d);
  })();
}

// climax: glitch + breach flash + "explosion" + to premise
function triggerBreachClimax() {
  const scene = document.getElementById('bscene');
  if (!scene) return;
  setStatus('● STATUS: OWNED', 'crit');
  const flash = document.createElement('div'); flash.className = 'bs-breach-flash'; flash.textContent = '⚠ BREACH ⚠';
  scene.appendChild(flash);
  scene.classList.add('bs-glitch');
  bTimer(() => {
    scene.classList.add('bs-shake');
    const boom = document.createElement('div'); boom.className = 'bs-explosion';
    boom.innerHTML = '<div class="bs-shock"></div><div class="bs-shock d2"></div>' + Array.from({ length: 14 }, (_, k) => `<span class="spark s${k}"></span>`).join('') + '<div class="bs-static"></div>';
    scene.appendChild(boom);
  }, 900);
  bTimer(() => { scene.style.transition = 'opacity .6s'; scene.style.opacity = '0'; }, 2000);
  bTimer(breachToPremise, 2700);
}

// premise, typed line by line
function breachToPremise() {
  if (BREACH_DONE) return; BREACH_DONE = true;
  breachClear();
  const scene = document.getElementById('bscene');
  if (scene) scene.style.display = 'none';
  const wrap = document.getElementById('bsPremise');
  wrap.classList.add('show');
  const lines = [
    { t: 'you just got h4cked.', c: 'bigred' },
    { t: '(yeah, you suck. we all did at first.)', c: 'dim' },
    { t: 'but here\'s the plot twist:', c: 'cyan' },
    { t: 'every hole they just walked through is a skill you can learn.', c: 'green' },
    { t: 'patch it. understand it. watch the next attack bounce off.', c: 'green' },
    { t: 'ready to stop losing?', c: 'cyan' },
  ];
  let i = 0;
  (function step() {
    if (i >= lines.length) {
      const btn = document.createElement('button');
      btn.className = 'btn-primary cut-btn';
      btn.textContent = 'L34RN N0W →';
      btn.onclick = () => { H.showPledge(); };   // recruit them as a white hat, then → map
      wrap.appendChild(btn);
      return;
    }
    const ln = lines[i++];
    const d = document.createElement('div');
    d.className = 'cut-line ' + ln.c;
    d.textContent = ln.t;
    wrap.appendChild(d);
    bTimer(step, ln.c === 'bigred' ? 1000 : 750);
  })();
}

// ── spinning green dot-matrix globe with converging attack pings ────
let BREACH_ATTACKERS = [];
function spawnAttacker() { BREACH_ATTACKERS.push({ ang: Math.random() * Math.PI * 2, prog: 0, speed: 0.005 + Math.random() * 0.008 }); }
// rough continents as lat/lon blobs: [latCenter, lonCenter, lonRadius, latRadius]
const LAND_BLOBS = [
  [52, -100, 34, 24], [62, -148, 16, 12], [73, -42, 16, 11],  // N.America, Alaska, Greenland
  [-18, -60, 17, 26],                                          // S.America
  [52, 12, 20, 14], [60, 90, 60, 16],                          // Europe, N.Asia/Russia
  [8, 18, 24, 30],                                             // Africa
  [30, 78, 20, 16], [38, 112, 22, 14],                         // India, China/E.Asia
  [-25, 134, 18, 12],                                          // Australia
];
function isLand(lat, lon) {
  for (let i = 0; i < LAND_BLOBS.length; i++) {
    const b = LAND_BLOBS[i];
    let dlon = Math.abs(((lon - b[1] + 540) % 360) - 180);
    const dlat = Math.abs(lat - b[0]);
    if ((dlon * dlon) / (b[2] * b[2]) + (dlat * dlat) / (b[3] * b[3]) <= 1) return true;
  }
  return false;
}
function startRadar() {
  const canvas = document.getElementById('bsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  BREACH_ATTACKERS = [];
  function size() { canvas.width = canvas.clientWidth || 300; canvas.height = canvas.clientHeight || 300; }
  size();
  window.addEventListener('resize', size);
  const DEG = Math.PI / 180;
  let t = 0;
  (function frame() {
    const W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2;
    const R = Math.min(cx, cy) * 0.82;
    ctx.fillStyle = 'rgba(5,7,10,0.4)'; ctx.fillRect(0, 0, W, H);
    // sphere edge + soft glow
    ctx.strokeStyle = 'rgba(0,255,136,0.28)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,255,136,0.03)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    // spinning dot-matrix land
    const rot = t * 0.45;   // degrees per frame → globe spins
    for (let lat = -85; lat <= 85; lat += 5) {
      const cla = Math.cos(lat * DEG), sla = Math.sin(lat * DEG);
      for (let lon = -180; lon < 180; lon += 5) {
        if (!isLand(lat, lon)) continue;
        const lo = (lon + rot) * DEG;
        const x = cla * Math.sin(lo);
        const z = cla * Math.cos(lo);
        if (z < 0) continue;                 // back of the globe
        const y = sla;
        const px = cx + x * R, py = cy - y * R;
        const b = 0.2 + 0.8 * z;             // brighter toward us
        ctx.fillStyle = 'rgba(0,255,136,' + b.toFixed(2) + ')';
        const s = 1 + z * 1.6;
        ctx.fillRect(px - s / 2, py - s / 2, s, s);   // square dots = matrix feel
      }
    }
    // occasional latitude guide lines (subtle)
    ctx.strokeStyle = 'rgba(0,255,136,0.10)';
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.34, 0, 0, Math.PI * 2); ctx.stroke();
    // target center
    const pulse = 4 + Math.sin(t * 0.1) * 2;
    ctx.fillStyle = '#56d4dd'; ctx.beginPath(); ctx.arc(cx, cy, pulse, 0, Math.PI * 2); ctx.fill();
    // attackers converging from the rim
    BREACH_ATTACKERS.forEach(at => {
      const sx = cx + Math.cos(at.ang) * R, sy = cy + Math.sin(at.ang) * R;
      at.prog = Math.min(1, at.prog + at.speed);
      const px = sx + (cx - sx) * at.prog, py = sy + (cy - sy) * at.prog;
      ctx.strokeStyle = 'rgba(255,85,85,' + (0.15 + 0.55 * at.prog) + ')'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = at.prog >= 1 ? '#fff' : '#ff5555';
      ctx.beginPath(); ctx.arc(px, py, at.prog >= 1 ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
      if (at.prog >= 1) { ctx.strokeStyle = 'rgba(255,85,85,0.6)'; ctx.beginPath(); ctx.arc(cx, cy, (t % 30), 0, Math.PI * 2); ctx.stroke(); }
    });
    t++;
    BREACH_RAF = requestAnimationFrame(frame);
  })();
}

// ── ATTACK WAVE (after a node with .wave) ───────────────────────────
// called by lesson.js on node completion; calls cb() when player taps continue
window.playWave = function (node, cb) {
  const app = document.getElementById('app');
  const w = node.wave;
  app.innerHTML = `<div class="screen active"><div class="cutscene wave" id="cut"></div></div>`;
  const cut = document.getElementById('cut');
  const lines = [
    { t: `⚠ ATTACK WAVE — ${w.enemy} ⚠`, c: 'bigred', d: 800 },
    { t: `> ${w.enemy} ${w.attack}`, c: 'red', d: 1100 },
    { t: '> probing your tower…', c: 'dim', d: 900 },
    { t: `> BLOCKED. ${w.repelledBy}.`, c: 'green', d: 900 },
    { t: '✓ WAVE REPELLED', c: 'biggreen', d: 600 },
    { t: `🛡 fortress integrity +${node.defense}`, c: 'cyan', d: 200 },
  ];
  let i = 0;
  function next() {
    if (i >= lines.length) {
      const btn = document.createElement('button');
      btn.className = 'btn-primary cut-btn';
      btn.textContent = 'HOLD THE LINE →';
      btn.onclick = cb;
      cut.appendChild(btn);
      return;
    }
    const ln = lines[i++];
    const div = document.createElement('div');
    div.className = 'cut-line ' + ln.c;
    div.textContent = ln.t;
    cut.appendChild(div);
    setTimeout(next, ln.d);
  }
  next();
};
