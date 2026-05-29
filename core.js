// ════════════════════════════════════════════════════════════════════
//  H4CKERHQ — core.js
//  shared state, router, defense rating, toast, devtools, pledge gate
// ════════════════════════════════════════════════════════════════════

const H = (function () {
  const STATE_KEY = 'h4ckerhq_state';
  const MAX_DEFENSE = 100;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
      return {
        pledged: s.pledged || false,
        seenBreach: s.seenBreach || false,
        completed: s.completed || {},        // { nodeId: true }
        taskDone: s.taskDone || {},          // { nodeId: { taskIndex: true } }
        vocab: s.vocab || {},                // { term: 'known' | 'practice' }
        defense: typeof s.defense === 'number' ? s.defense : 0,
        tokens: typeof s.tokens === 'number' ? s.tokens : 0,
        castleHp: typeof s.castleHp === 'number' ? s.castleHp : 100,
        towers: s.towers || {},              // { slotId: towerId }
        wave: typeof s.wave === 'number' ? s.wave : 1,
        level: typeof s.level === 'number' ? s.level : null,  // progression level (1-based)
        cheatsUsed: Array.isArray(s.cheatsUsed) ? s.cheatsUsed : [],
      };
    } catch {
      return { pledged: false, seenBreach: false, completed: {}, taskDone: {}, vocab: {}, defense: 0, tokens: 0, castleHp: 100, towers: {}, wave: 1, level: 1 };
    }
  }

  const state = load();
  // Migrate / init progression level. Lessons now unlock by LEVEL (earned by
  // surviving defense waves), not just by completing the prior node's tasks.
  if (state.level == null) {
    const doneCount = Object.keys(state.completed || {}).length;
    state.level = Math.max(1, doneCount + 1);   // existing saves keep their place
  }
  function save() { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }

  function nodeIndex(node) {
    return (typeof SKILL_TREE !== 'undefined') ? SKILL_TREE.findIndex(n => n.id === node.id) : 0;
  }

  // ── node / progress helpers ───────────────────────────────────────
  // A node is unlocked once you've reached its level. Level = waves survived + 1.
  function nodeUnlocked(node) {
    const idx = nodeIndex(node);
    return idx > -1 && idx < state.level;
  }
  // Tasks done but not yet defended → the lesson's defense wave is still pending.
  function tasksAllDone(node) {
    return node.tasks.every((_, i) => taskDone(node.id, i));
  }
  function defensePending(node) {
    return tasksAllDone(node) && !state.completed[node.id];
  }
  // Called when a defense wave for this node is survived.
  function levelUp(node) {
    if (state.completed[node.id]) return false;
    state.completed[node.id] = true;
    state.defense = Math.min(MAX_DEFENSE, state.defense + (node.defense || 5));
    const idx = nodeIndex(node);
    state.level = Math.max(state.level, idx + 2);   // unlock the next lesson
    save();
    return true;
  }
  function resetProgress() {
    state.completed = {}; state.taskDone = {}; state.level = 1;
    state.tokens = 0; state.towers = {}; state.castleHp = 100; state.wave = 1; state.defense = 0;
    save();
    toast('campaign reset — fresh start', 'ok');
    location.hash = '#map';
    location.reload();
  }
  function nodeComplete(node) { return !!state.completed[node.id]; }
  function taskDone(nodeId, i) { return !!(state.taskDone[nodeId] && state.taskDone[nodeId][i]); }
  function markTask(nodeId, i) {
    state.taskDone[nodeId] = state.taskDone[nodeId] || {};
    state.taskDone[nodeId][i] = true;
    save();
  }
  function completeNode(node) {
    if (state.completed[node.id]) return false;   // already done
    state.completed[node.id] = true;
    state.defense = Math.min(MAX_DEFENSE, state.defense + (node.defense || 5));
    save();
    return true;   // newly completed
  }
  function defensePct() { return Math.round((state.defense / MAX_DEFENSE) * 100); }

  // ── token economy ─────────────────────────────────────────────────
  function earnTokens(n) {
    state.tokens = (state.tokens || 0) + n;
    save();
    // live-update header token display without full re-render
    const tv = document.querySelector('.token-val');
    if (tv) tv.textContent = state.tokens;
    // small floating indicator
    const el = document.createElement('div');
    el.className = 'token-pop';
    el.textContent = '+' + n + ' ⚡';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
  function spendTokens(n) {
    if ((state.tokens || 0) < n) return false;
    state.tokens -= n;
    save();
    const tv = document.querySelector('.token-val');
    if (tv) tv.textContent = state.tokens;
    return true;
  }

  // ── save code (base64 snapshot for cross-device restore) ──────────
  function exportSave() {
    const code = btoa(JSON.stringify(state));
    toast('save code copied to clipboard!', 'ok');
    navigator.clipboard && navigator.clipboard.writeText(code).catch(() => {});
    return code;
  }
  function importSave(code) {
    try {
      const s = JSON.parse(atob(code));
      Object.assign(state, s);
      save();
      toast('save restored ✓ — reloading', 'ok');
      setTimeout(() => location.reload(), 900);
    } catch (e) { toast('bad save code', 'err'); }
  }

  // ── toast ─────────────────────────────────────────────────────────
  function toast(msg, kind) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = 'toast show ' + (kind || '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ── router (hash based) ───────────────────────────────────────────
  // routes: #map (default) | #lesson/<id> | #manual | #armory | #threats
  const routes = {};
  function route(name, fn) { routes[name] = fn; }
  function go(hash) { location.hash = hash; }
  function dispatch() {
    // First-time players get the full intro: boring site → attack → breach → premise → pledge.
    if (!state.pledged) { if (window.startIntro) window.startIntro(); return; }
    const raw = (location.hash || '#map').slice(1);
    const [name, arg] = raw.split('/');
    const fn = routes[name] || routes.map;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    fn(arg);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', dispatch);

  // ── white-hat pledge gate ─────────────────────────────────────────
  function showPledge() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="pledge screen active">
        <div class="pledge-card">
          <div class="pledge-seal">⬡</div>
          <h1>THE WHITE-HAT PLEDGE</h1>
          <p class="pledge-sub">before you get any tools, you agree to the only rule that matters.</p>
          <ul class="pledge-list">
            <li><span class="pi">✅</span><span class="ptxt">I only test things that are <strong>mine</strong>, or that <strong>invited me</strong> (this app, practice labs, my own browser).</span></li>
            <li><span class="pi">🔎</span><span class="ptxt">I <strong>expose</strong> problems so they can be fixed. I do <strong>not exploit</strong> them or hurt anyone.</span></li>
            <li><span class="pi">🛡️</span><span class="ptxt">The whole point is to learn to <strong>defend what I build</strong>. Attack is how you understand defense.</span></li>
          </ul>
          <p class="pledge-fine">breaking into systems you don't own is a crime. white hats have permission. that's the entire difference between a pro and a criminal.</p>
          <button id="pledgeBtn" class="btn-primary">I'm a white hat. Let me in. ⬡</button>
        </div>
      </div>`;
    document.getElementById('pledgeBtn').onclick = () => {
      state.pledged = true; state.seenBreach = true; save();
      go('#map'); dispatch();
    };
  }

  // ── easter egg: cheat codes (one-time token drops) ──────────────
  // Discoverable by reading source. Each code works exactly once.
  const CHEAT_CODES = {
    'IREADTHESOURCE': { tokens: 50, msg: '+50 tokens. nice find — lesson #1 complete.' },
    'CSSDETECTIVE':   { tokens: 15, msg: '+15 tokens. you read the CSS. respect.' },
    'D4D':            { tokens: 0,  msg: 'hi dad. 👋  you built something cool here.' },
  };
  function cheat(code) {
    const entry = CHEAT_CODES[String(code).toUpperCase()];
    if (!entry) { toast('unknown code — keep digging.', 'err'); return; }
    if (state.cheatsUsed.includes(code.toUpperCase())) { toast('already claimed that one. nice try.', ''); return; }
    state.cheatsUsed.push(code.toUpperCase());
    save();
    if (entry.tokens > 0) earnTokens(entry.tokens);
    toast('🎁 ' + entry.msg, 'ok');
  }

  // ── easter egg: Konami code (↑↑↓↓←→←→BA) ─────────────────────
  const KONAMI = [38,38,40,40,37,39,37,39,66,65];
  function wireKonami() {
    let pos = 0;
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === KONAMI[pos]) {
        pos++;
        if (pos === KONAMI.length) { pos = 0; konamiActivate(); }
      } else {
        pos = (e.keyCode === KONAMI[0]) ? 1 : 0;
      }
    });
  }
  function konamiActivate() {
    // Green screen flash
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:#00ff88;z-index:9990;pointer-events:none;opacity:.35;transition:opacity .6s';
    document.body.appendChild(flash);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 600);
    }));
    // Spray ⚡ tokens across the screen
    for (let i = 0; i < 18; i++) {
      setTimeout(() => {
        const t = document.createElement('div');
        t.className = 'fly-coin';
        t.textContent = '⚡';
        t.style.left = (20 + Math.random() * (window.innerWidth - 40)) + 'px';
        t.style.top = (window.innerHeight * 0.75 + Math.random() * 40) + 'px';
        document.body.appendChild(t);
        const dx = (Math.random() - 0.5) * 240;
        const dy = -160 - Math.random() * 220;
        requestAnimationFrame(() => {
          t.style.transform = `translate(${dx}px,${dy}px) scale(.25)`;
          t.style.opacity = '0';
        });
        setTimeout(() => t.remove(), 1200);
      }, i * 55);
    }
    if (!state.cheatsUsed.includes('KONAMI')) {
      state.cheatsUsed.push('KONAMI');
      save();
      earnTokens(25);
      toast('↑↑↓↓←→←→BA · KONAMI! +25 tokens', 'ok');
    } else {
      toast('↑↑↓↓←→←→BA · classic. already collected those tokens.', '');
    }
  }

  // ── easter egg: 30-second PARTY MODE 🪩 ──────────────────────────
  // Discoverable via the HTML comment clue (partyMode()) or by reading core.js.
  function partyMode() {
    if (document.getElementById('hq-party')) { toast('🪩 already partying!', ''); return; }
    const ov = document.createElement('div');
    ov.id = 'hq-party';
    ov.innerHTML = `
      <div class="party-bg" id="partyBg"></div>
      <div class="party-center">
        <div class="party-ball">🪩</div>
        <div class="party-txt">PARTY MODE</div>
        <div class="party-sub">tap anywhere to end early</div>
      </div>
      <div class="party-timer" id="partyTimer">30</div>`;
    document.body.appendChild(ov);

    const COLS = ['#ff006699','#ff990099','#00ff8899','#00aaff99','#aa00ff99','#ff44bb99'];
    let ci = 0, secs = 30;
    const colTick = setInterval(() => {
      const bg = document.getElementById('partyBg');
      if (bg) bg.style.background = COLS[ci++ % COLS.length];
    }, 280);
    const countTick = setInterval(() => {
      secs--;
      const el = document.getElementById('partyTimer');
      if (el) el.textContent = secs;
      if (secs <= 0) end();
    }, 1000);

    // Simple synth disco beat via Web Audio
    let actx;
    let beatTick;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const NOTES = [523,659,784,1047,784,659,523,392];
      let ni = 0;
      beatTick = setInterval(() => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'square'; o.frequency.value = NOTES[ni++ % NOTES.length];
        o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.04, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.18);
        o.start(); o.stop(actx.currentTime + 0.18);
      }, 220);
    } catch(e) {}

    function end() {
      clearInterval(colTick); clearInterval(countTick); clearInterval(beatTick);
      if (actx) actx.close().catch(() => {});
      ov.style.transition = 'opacity .5s'; ov.style.opacity = '0';
      setTimeout(() => { ov.remove(); toast('🪩 party over. legend.', 'ok'); }, 500);
    }
    ov.onclick = end;
    setTimeout(end, 30000);
  }
  window.partyMode = partyMode;   // callable from console without H. prefix

  // ── console fingerprint: styled banner on every boot ─────────────
  function printConsoleBanner() {
    console.log(
      '%c H4CKER HQ %c v — you opened the console. that\'s how it starts.',
      'background:#00ff88;color:#000;font-weight:900;font-size:16px;padding:3px 8px;border-radius:4px',
      'color:#6e7681;font-style:italic;font-size:12px'
    );
    console.log('%c try → H.state        (peek at your save data)', 'color:#56d4dd;font-size:11px');
    console.log('%c try → H.exportSave() (back up your progress)', 'color:#56d4dd;font-size:11px');
    console.log('%c ...and read the source for the real secrets. 👀', 'color:#6e7681;font-size:11px');
  }

  // ── on-device devtools (Eruda) — long-press + button + console cmd ─
  function summonDevTools() {
    if (window.eruda) { window.eruda.show(); toast('🛠 devtools'); return; }
    toast('🛠 loading devtools…');
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/eruda';
    s.onload = () => { try { window.eruda.init(); window.eruda.show(); toast('🛠 devtools ready — tap the gear', 'ok'); } catch (e) { toast('devtools failed', 'err'); } };
    s.onerror = () => toast('devtools needs internet', 'err');
    document.body.appendChild(s);
  }
  window.devtools = summonDevTools;

  function wireLongPress() {
    const SEL = ['.logo', '.dt-btn', '.defense-bar'];
    let timer = null;
    const match = el => el && el.closest && SEL.some(s => el.closest(s));
    const start = e => { if (!match(e.target)) return; clearTimeout(timer); timer = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(40); summonDevTools(); }, 650); };
    const cancel = () => { clearTimeout(timer); };
    document.addEventListener('touchstart', start, { passive: true, capture: true });
    ['touchend', 'touchmove', 'touchcancel', 'mouseup', 'mouseleave'].forEach(ev => document.addEventListener(ev, cancel, { capture: true }));
    document.addEventListener('mousedown', start, { capture: true });
  }

  // ── boot ──────────────────────────────────────────────────────────
  function boot() {
    wireLongPress();
    wireKonami();
    printConsoleBanner();
    dispatch();
  }

  return {
    state, save, MAX_DEFENSE,
    nodeUnlocked, nodeComplete, taskDone, markTask, completeNode, defensePct,
    tasksAllDone, defensePending, levelUp, nodeIndex, resetProgress,
    earnTokens, spendTokens, exportSave, importSave,
    toast, route, go, dispatch, boot, summonDevTools, showPledge,
    cheat, partyMode,
  };
})();
