// ════════════════════════════════════════════════════════════════════
//  H4CKERHQ — lesson.js
//  micro-lesson engine: task renderers + progressive hint ladder + rewards
// ════════════════════════════════════════════════════════════════════

(function () {
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function nodeById(id) { return SKILL_TREE.find(n => n.id === id); }

  // ── progressive hint ladder ───────────────────────────────────────
  // reveals ONE rung per tap, never the full answer dumped at once.
  function hintLadderHTML(task) {
    if (!task.hints || !task.hints.length) return '';
    return `
      <div class="hints" data-shown="0" data-total="${task.hints.length}">
        <button class="hint-btn" onclick="HLESSON.revealHint(this)">💡 stuck? reveal a step (0/${task.hints.length})</button>
        <div class="hint-body"></div>
      </div>`;
  }
  function revealHint(btn) {
    const box = btn.closest('.hints');
    const task = current.node.tasks[current.idx];
    let shown = parseInt(box.dataset.shown, 10);
    const total = parseInt(box.dataset.total, 10);
    if (shown >= total) { HCORE_toast('that\'s the last step — you\'ve got this. try it.', ''); return; }
    const body = box.querySelector('.hint-body');
    const d = document.createElement('div');
    d.className = 'hint-rung';
    d.innerHTML = `<span class="rung-n">${shown + 1}</span> ${task.hints[shown]}`;
    body.appendChild(d);
    shown++;
    box.dataset.shown = shown;
    btn.textContent = shown >= total
      ? `💡 that's every step (${shown}/${total}) — no full answers here`
      : `💡 reveal the next step (${shown}/${total})`;
  }
  function HCORE_toast(m, k) { H.toast(m, k); }

  // ── lesson flow ───────────────────────────────────────────────────
  let current = { node: null, idx: 0 };

  H.route('lesson', function (id) {
    const node = nodeById(id);
    if (!node || !H.nodeUnlocked(node)) { H.go('#map'); H.dispatch(); return; }
    current.node = node;
    // All tasks done?
    let start = node.tasks.findIndex((_, i) => !H.taskDone(node.id, i));
    if (start === -1) {
      // tasks done but defense wave not yet survived → go defend
      if (H.defensePending(node)) { launchDefense(node); return; }
      showFlex(node, true);   // fully cleared → replay/flex view
      return;
    }
    renderTask(node, start);
  });

  // Hand the player to the tower-defense wave that gates this lesson.
  function launchDefense(node) {
    if (window.HDEFENSE && window.HDEFENSE.playLevel) window.HDEFENSE.playLevel(node);
    else { H.go('#defense'); H.dispatch(); }
  }

  function shell(node, inner) {
    const total = node.tasks.length;
    const dots = node.tasks.map((_, i) => {
      const c = H.taskDone(node.id, i) ? 'done' : i === current.idx ? 'now' : '';
      return `<span class="dot ${c}"></span>`;
    }).join('');
    document.getElementById('app').innerHTML = `
      <div class="screen active">
        ${headerHTML()}
        <main class="lesson">
          <div class="lesson-top">
            <a href="#map" class="back">← map</a>
            <div class="lesson-title">${node.icon} ${node.title}</div>
            <div class="dots">${dots}</div>
          </div>
          <div class="task-card">${inner}</div>
        </main>
      </div>`;
  }

  const TOKEN_AWARD = { flashcard: 1, quiz: 1, spot: 1, build: 3, real: 5 };

  function advance(node, i) {
    H.markTask(node.id, i);
    const task = node.tasks[i];
    H.earnTokens(TOKEN_AWARD[task.type] || 1);
    if (i + 1 < node.tasks.length) renderTask(node, i + 1);
    else finishNode(node);
  }

  function finishNode(node) {
    // All micro-tasks done. Celebrate with a treasure chest (the node bonus),
    // then send the player into the defense wave that unlocks the next lesson.
    showChest(node, 5, () => launchDefense(node));
  }

  // ── treasure-chest reward splash ──────────────────────────────────
  function showChest(node, bonus, onContinue) {
    const ov = document.createElement('div');
    ov.className = 'reward-ov';
    ov.innerHTML = `
      <div class="reward-card chest-card">
        <div class="reward-eyebrow">✦ LESSON CLEARED ✦</div>
        <h2>${node.icon} ${node.title}</h2>
        <div class="chest" id="rwChest">📦</div>
        <p class="reward-hint" id="rwHint">tap the chest to claim your loot</p>
      </div>`;
    document.body.appendChild(ov);
    const chest = ov.querySelector('#rwChest');
    let opened = false;
    chest.onclick = () => {
      if (opened) return; opened = true;
      chest.textContent = '🪙';
      chest.classList.add('open');
      if (navigator.vibrate) navigator.vibrate(30);
      flyCoins(ov, bonus);
      H.earnTokens(bonus);
      ov.querySelector('#rwHint').innerHTML = `<span class="reward-gain">+${bonus} ⚡ banked!</span>`;
      setTimeout(() => {
        const card = ov.querySelector('.reward-card');
        const btn = document.createElement('button');
        btn.className = 'btn-primary reward-btn';
        btn.innerHTML = '⚠ INCOMING ATTACK · DEFEND →';
        btn.onclick = () => { ov.remove(); onContinue(); };
        card.appendChild(btn);
      }, 1100);
    };
  }

  function flyCoins(ov, n) {
    const chest = ov.querySelector('#rwChest');
    const cr = chest.getBoundingClientRect();
    const bank = document.querySelector('.token-hud') || document.querySelector('.logo');
    const br = bank ? bank.getBoundingClientRect() : { left: 20, top: 20 };
    const count = Math.min(n + 4, 12);
    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      c.className = 'fly-coin';
      c.textContent = '⚡';
      c.style.left = (cr.left + cr.width / 2) + 'px';
      c.style.top = (cr.top + cr.height / 2) + 'px';
      document.body.appendChild(c);
      const dx = br.left - cr.left + (Math.random() * 30 - 15);
      const dy = br.top - cr.top + (Math.random() * 20 - 10);
      const delay = i * 60;
      requestAnimationFrame(() => {
        setTimeout(() => {
          c.style.transform = `translate(${dx}px, ${dy}px) scale(.4)`;
          c.style.opacity = '0';
        }, delay);
      });
      setTimeout(() => c.remove(), delay + 900);
    }
  }

  function showFlex(node, replay) {
    document.getElementById('app').innerHTML = `
      <div class="screen active">
        ${headerHTML()}
        <main class="lesson">
          <div class="flex-card">
            <div class="flex-badge">${replay ? '✓ ALREADY CLEARED' : '🏆 NODE CLEARED'}</div>
            <h2>${node.icon} ${node.title}</h2>
            ${!replay ? `<div class="flex-gain">🛡 fortress integrity +${node.defense}</div>` : ''}
            <div class="flex-flex">
              <div class="flex-label">🪄 THE FLEX</div>
              <p>${node.flex}</p>
            </div>
            <button class="btn-primary" onclick="H.go('#map')">→ back to the map</button>
          </div>
        </main>
      </div>`;
  }

  // ── TASK RENDERERS ────────────────────────────────────────────────
  function renderTask(node, i) {
    current.idx = i;
    const task = node.tasks[i];
    ({ flashcard: tFlash, build: tBuild, spot: tSpot, quiz: tQuiz, real: tReal }[task.type] || tQuiz)(node, i, task);
  }

  // flashcard
  function tFlash(node, i, task) {
    const v = VOCAB.find(x => x.term === task.vocab) || { term: task.vocab, oneLiner: '', detail: '', example: '' };
    shell(node, `
      <div class="t-eyebrow">LEARN THE WORD</div>
      <div class="flashcard" id="fc" onclick="HLESSON.flip()">
        <div class="fc-front"><div class="fc-term">${v.term}</div><div class="fc-tap">tap to flip</div></div>
        <div class="fc-back">
          <div class="fc-one">${v.oneLiner}</div>
          <p>${v.detail}</p>
          <pre class="fc-ex">${v.example}</pre>
        </div>
      </div>
      <button class="btn-primary t-next" id="fcNext" style="display:none" onclick="HLESSON.advance()">got it ✓</button>
    `);
  }
  function flip() {
    document.getElementById('fc').classList.toggle('flipped');
    document.getElementById('fcNext').style.display = 'inline-block';
  }

  // build-the-command
  function tBuild(node, i, task) {
    const chips = shuffle(task.solution.concat(task.distractors || []));
    const BI = (typeof BLOCK_INFO !== 'undefined') ? BLOCK_INFO : {};
    const tip = c => { const m = BI[c]; return m ? ` data-tip="${escapeHTML(m)}"` : ''; };
    shell(node, `
      <div class="t-eyebrow">BUILD THE COMMAND</div>
      <p class="t-prompt">${task.prompt}</p>
      <div class="build-bar" id="buildBar"><span class="bb-empty">tap blocks below, in order →</span></div>
      <div class="build-note">tip: tap a block in the tray to add it · tap one up in the bar to remove it · hover/tap a block to see what it means</div>
      <div class="block-tip" id="blockTip"></div>
      <div class="chips" id="chips">
        ${chips.map(c => `<button class="chip"${tip(c)} data-block="${encodeURIComponent(c)}" onclick="HLESSON.addBlock(this)">${escapeHTML(c)}</button>`).join('')}
      </div>
      <div class="build-actions">
        <button class="btn-ghost" onclick="HLESSON.resetBuild()">↺ reset</button>
        <button class="btn-primary" onclick="HLESSON.checkBuild()">check ✓</button>
      </div>
      ${hintLadderHTML(task)}
      <div class="t-explain" id="explain" style="display:none"></div>
    `);
    buildState = [];
    buildFirstTry = true;   // reset first-try flag for this task
  }
  let buildState = [];
  // ── L33T mode: streak counter for first-try build-the-command ────
  // 3 correct builds with no wrong guesses and no resets = L33T mode.
  let buildStreak = 0;
  let buildFirstTry = true;   // flipped false on any reset or wrong answer

  // ── matrix rain + L33T banner overlay (3 seconds) ────────────────
  function triggerL33T() {
    const ov = document.createElement('div');
    ov.className = 'leet-overlay';
    ov.innerHTML = `<canvas class="leet-canvas" id="leetCanvas"></canvas>
      <div class="leet-banner">&#x1F525; L33T M0DE &#x1F525;</div>
      <div class="leet-sub">3 builds &middot; first try &middot; no resets</div>`;
    document.body.appendChild(ov);

    const canvas = document.getElementById('leetCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx2 = canvas.getContext('2d');
    const COLS2 = Math.floor(canvas.width / 16);
    const drops = Array(COLS2).fill(1);
    const CHARS = '01アイウエオカキクHACKERSQLXSSAPI<>{}[]=>/\\|.;:FLAG{';
    const rain = setInterval(() => {
      ctx2.fillStyle = 'rgba(0,0,0,0.07)';
      ctx2.fillRect(0, 0, canvas.width, canvas.height);
      ctx2.fillStyle = '#00ff88';
      ctx2.font = '14px monospace';
      drops.forEach((y, i) => {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx2.fillText(ch, i * 16, y * 16);
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 33);

    setTimeout(() => {
      clearInterval(rain);
      ov.style.transition = 'opacity .6s'; ov.style.opacity = '0';
      setTimeout(() => ov.remove(), 600);
    }, 3000);

    H.toast('🔥 3 BUILDS FIRST TRY · STREAK BONUS +5', 'ok');
    H.earnTokens(5);
  }

  function blockMeaning(block) { const BI = (typeof BLOCK_INFO !== 'undefined') ? BLOCK_INFO : {}; return BI[block] || ''; }
  function showBlockTip(block) {
    const el = document.getElementById('blockTip'); if (!el) return;
    const m = blockMeaning(block);
    el.innerHTML = m ? `<code>${escapeHTML(block)}</code> — ${escapeHTML(m)}` : '';
  }
  function addBlock(btn) {
    if (btn.classList.contains('used')) return;
    btn.classList.add('used');
    const block = decodeURIComponent(btn.dataset.block);
    buildState.push({ block, btn });
    showBlockTip(block);
    paintBuild();
  }
  function removeBlock(i) {
    const item = buildState[i];
    if (!item) return;
    if (item.btn) item.btn.classList.remove('used');   // return it to the tray
    buildState.splice(i, 1);
    paintBuild();
  }
  function paintBuild() {
    const bar = document.getElementById('buildBar');
    if (!bar) return;
    if (!buildState.length) { bar.innerHTML = '<span class="bb-empty">tap blocks below, in order →</span>'; return; }
    bar.innerHTML = buildState.map((b, i) =>
      `<span class="bb-chip" title="tap to remove" onclick="HLESSON.removeBlock(${i})">${escapeHTML(b.block)}<span class="bb-x">✕</span></span>`).join('');
  }
  function resetBuild() {
    buildState.forEach(b => b.btn && b.btn.classList.remove('used'));
    buildState = []; paintBuild();
    const el = document.getElementById('blockTip'); if (el) el.innerHTML = '';
    buildFirstTry = false;   // used the reset → streak broken
    buildStreak = 0;
  }
  function checkBuild() {
    const task = current.node.tasks[current.idx];
    const got = buildState.map(b => b.block);
    const ok = got.length === task.solution.length && got.every((g, k) => g === task.solution[k]);
    if (ok) {
      // ── streak tracking for L33T mode ──────────────────────────
      if (buildFirstTry) {
        buildStreak++;
        if (buildStreak >= 3) { triggerL33T(); buildStreak = 0; }
      } else {
        buildStreak = 0;  // had to reset/retry → streak broken
      }
      buildFirstTry = true;  // ready for next build task

      const ex = document.getElementById('explain');
      ex.style.display = 'block';
      ex.innerHTML =
        `<strong>✓ nice.</strong> reads as: <em>${task.reads || ''}</em>` +
        `<pre class="fc-ex">${escapeHTML(task.solution.join(''))}</pre>` +
        (task.teach ? `<div class="teach"><div class="teach-label">HOW IT'S STRUCTURED</div>${task.teach}</div>` : '');
      H.toast('command assembled ✓', 'ok');
      // give him a beat to read the terminology before advancing
      const next = document.createElement('button');
      next.className = 'btn-primary t-next'; next.textContent = 'got it → continue';
      next.onclick = () => HLESSON.advance();
      ex.appendChild(next);
    } else {
      buildFirstTry = false;   // got it wrong → no longer first try
      buildStreak = 0;
      const extra = got.length && got.some((g, k) => g !== task.solution[k])
        ? ' tap a block up in the bar to remove it, then re-add in order.'
        : '';
      H.toast('not quite — check the order.' + extra, 'err');
      const bar = document.getElementById('buildBar');
      bar.classList.add('shake');
      setTimeout(() => bar.classList.remove('shake'), 400);
    }
  }

  // spot-the-flag — each token carries a tap/hover tip so it's learning, not guessing
  let spotChecks = 0;
  function tSpot(node, i, task) {
    spotChecks = 0;
    const tipFor = tok => {
      if (tok.tip) return tok.tip;
      // sensible fallback so every token teaches something
      return tok.flag ? 'suspicious — worth a closer look' : 'normal syntax — not itself a risk';
    };
    shell(node, `
      <div class="t-eyebrow">SPOT THE FLAG</div>
      <p class="t-prompt">${task.prompt}</p>
      <div class="spot-note">tap a token to flag it · hover or long-press a token to learn what it is</div>
      <div class="snippet" id="snippet">
        ${task.tokens.map((tok, k) => `<span class="tok" data-flag="${tok.flag ? 1 : 0}" data-k="${k}" data-tip="${escapeHTML(tipFor(tok))}" onclick="HLESSON.toggleTok(this)">${escapeHTML(tok.t)}</span>`).join(' ')}
      </div>
      <div class="spot-tipbox" id="spotTip">tap any token to see what it means →</div>
      <div class="build-actions">
        <button class="btn-primary" onclick="HLESSON.checkSpot()">check ✓</button>
      </div>
      ${hintLadderHTML(task)}
      <div class="t-explain" id="explain" style="display:none"></div>
    `);
  }
  function toggleTok(el) {
    el.classList.toggle('picked');
    const tip = document.getElementById('spotTip');
    if (tip) {
      const flagged = el.dataset.flag === '1';
      tip.innerHTML = `<code>${escapeHTML(el.textContent)}</code> — ${escapeHTML(el.dataset.tip || '')}`;
      tip.className = 'spot-tipbox ' + (flagged ? 'tip-flag' : 'tip-safe');
    }
  }
  function checkSpot() {
    const snip = document.getElementById('snippet');
    const toks = [...snip.querySelectorAll('.tok')];
    const ok = toks.every(t => (t.classList.contains('picked') ? 1 : 0) === parseInt(t.dataset.flag, 10));
    if (ok) {
      toks.forEach(t => { if (t.dataset.flag === '1') t.classList.add('correct'); });
      H.toast('eyes sharp ✓', 'ok');
      setTimeout(() => HLESSON.advance(), 1100);
    } else {
      spotChecks++;
      H.toast('not exactly — tap every flag, and only the flags.', 'err');
      snip.classList.add('shake'); setTimeout(() => snip.classList.remove('shake'), 400);
      // struggling? auto-reveal the next hint rung after a few misses
      if (spotChecks >= 3) {
        const hintBtn = document.querySelector('.hints .hint-btn');
        if (hintBtn) { revealHint(hintBtn); H.toast('here — a hint to point you at it.', ''); }
        // also gently highlight tokens that are mis-marked
        toks.forEach(t => {
          const should = t.dataset.flag === '1';
          const picked = t.classList.contains('picked');
          if (should !== picked) { t.classList.add('hintwrong'); setTimeout(() => t.classList.remove('hintwrong'), 1500); }
        });
        spotChecks = 0;
      }
    }
  }

  // quiz / concept-check — options shuffled so the answer isn't always in the same spot
  function tQuiz(node, i, task) {
    if (!task.__order) {
      task.__order = shuffle(task.options.map((_, k) => k));
      task.__correct = task.__order.indexOf(task.answer);
    }
    shell(node, `
      <div class="t-eyebrow">CONCEPT CHECK</div>
      <p class="t-prompt">${task.question}</p>
      <div class="options" id="options">
        ${task.__order.map((origK, pos) => `<button class="option" data-pos="${pos}" onclick="HLESSON.pickOption(this)">${escapeHTML(task.options[origK])}</button>`).join('')}
      </div>
      <div class="t-explain" id="explain" style="display:none"></div>
    `);
  }
  function pickOption(btn) {
    const task = current.node.tasks[current.idx];
    const k = parseInt(btn.dataset.pos, 10);
    const opts = document.getElementById('options');
    if (k === task.__correct) {
      btn.classList.add('right');
      opts.querySelectorAll('.option').forEach(o => o.disabled = true);
      const ex = document.getElementById('explain');
      ex.style.display = 'block';
      ex.innerHTML = `<strong>✓ correct.</strong> ${task.explain || ''}`;
      const next = document.createElement('button');
      next.className = 'btn-primary t-next'; next.textContent = 'continue →';
      next.onclick = () => HLESSON.advance(); ex.appendChild(next);
    } else {
      btn.classList.add('wrong'); btn.disabled = true;
      H.toast('nope — try again.', 'err');
    }
  }

  // real (sandbox | observe)
  function tReal(node, i, task) {
    if (task.target === 'observe') return tObserve(node, i, task);
    // sandbox
    shell(node, `
      <div class="t-eyebrow">DO IT FOR REAL · SANDBOX</div>
      <p class="t-prompt">${task.prompt}</p>
      <div class="sandbox-wrap"><div class="sandbox-label">// sandbox — safe to break</div>
        <div class="sandbox" id="sandbox"></div>
      </div>
      <div class="solve">
        <input type="text" id="proof" placeholder="the code word…" autocomplete="off">
        <button class="btn-primary" onclick="HLESSON.checkProof()">submit</button>
      </div>
      ${hintLadderHTML(task)}
    `);
    (SANDBOXES[task.sandbox] || function(){})(document.getElementById('sandbox'), task);
  }
  function checkProof() {
    const task = current.node.tasks[current.idx];
    const v = (document.getElementById('proof').value || '').trim().toLowerCase();
    const accept = (task.accept || [task.answer]).map(a => a.toLowerCase());
    if (accept.includes(v)) { H.toast('🏴 you got past it ✓', 'ok'); setTimeout(() => HLESSON.advance(), 900); }
    else H.toast('not the code word yet — get the article unlocked first.', 'err');
  }

  function tObserve(node, i, task) {
    const q = task.quiz;
    if (!q.__order) { q.__order = shuffle(q.options.map((_, k) => k)); q.__correct = q.__order.indexOf(q.answer); }
    shell(node, `
      <div class="t-eyebrow">DO IT FOR REAL · REAL SITE (LOOK-ONLY)</div>
      <p class="t-prompt">${task.prompt}</p>
      <div class="observe-links">
        ${(task.observeUrls || []).map(u => `<a class="obtn" href="${u.url}" target="_blank" rel="noopener">↗ ${u.label}</a>`).join('')}
      </div>
      ${hintLadderHTML(task)}
      <div class="observe-q">
        <p class="t-prompt">${q.question}</p>
        <div class="options" id="options">
          ${q.__order.map((origK, pos) => `<button class="option" data-pos="${pos}" onclick="HLESSON.pickObserve(this)">${escapeHTML(q.options[origK])}</button>`).join('')}
        </div>
        <div class="t-explain" id="explain" style="display:none"></div>
      </div>
    `);
  }
  function pickObserve(btn) {
    const task = current.node.tasks[current.idx];
    const q = task.quiz; const k = parseInt(btn.dataset.pos, 10);
    if (k === q.__correct) {
      btn.classList.add('right');
      document.querySelectorAll('#options .option').forEach(o => o.disabled = true);
      const ex = document.getElementById('explain'); ex.style.display = 'block';
      ex.innerHTML = `<strong>✓ exactly.</strong> ${q.explain || ''}`;
      const next = document.createElement('button');
      next.className = 'btn-primary t-next'; next.textContent = 'continue →';
      next.onclick = () => HLESSON.advance(); ex.appendChild(next);
    } else { btn.classList.add('wrong'); btn.disabled = true; H.toast('look again.', 'err'); }
  }

  function escapeHTML(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ── SANDBOX registry (inline fake sites for "do it for real") ──────
  const SANDBOXES = {
    // ── DOM SURGEON ──────────────────────────────────────────────
    domSurgeon(mount) {
      mount.innerHTML = `
        <div style="position:relative;min-height:120px;border-radius:6px;overflow:hidden">
          <div id="dss-article" style="padding:14px;font-size:.9rem">
            <h4 style="margin-bottom:8px">🎬 The Matrix (1999) — Real Tech Explained</h4>
            <p>Neo jacks in. The cascading green code looks impossible — but it's based on a real concept...</p>
            <p style="margin-top:8px">The legendary director's cut code word: <span id="dss-secret" style="color:transparent;background:transparent;font-weight:700">HACKSAW</span></p>
          </div>
          <div id="dss-paywall" style="position:absolute;inset:0;background:#0d1117;border:1px solid #ff5555;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;border-radius:6px;z-index:5">
            <span style="font-size:2.5rem">🔒</span>
            <p style="font-family:monospace;color:#ff5555;font-weight:700">PREMIUM CONTENT</p>
            <p style="font-size:.75rem;color:#6e7681;text-align:center">remove this element to continue<br>element id: <code style="color:#ffd866">dss-paywall</code></p>
          </div>
        </div>`;
      const observer = new MutationObserver(() => {
        const pw = document.getElementById('dss-paywall');
        if (!pw || pw.style.display === 'none' || pw.style.visibility === 'hidden' || pw.style.opacity === '0') {
          const s = document.getElementById('dss-secret');
          if (s) { s.style.color = '#00ff88'; s.style.background = 'transparent'; }
        }
      });
      observer.observe(mount, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    },

    // ── ATTRIBUTE FLIPPER ─────────────────────────────────────────
    attrFlipper(mount) {
      mount.innerHTML = `
        <div style="padding:14px">
          <h4 style="margin-bottom:10px">🏦 Secure Vault — Password Recovery</h4>
          <p style="font-size:.82rem;color:#6e7681;margin-bottom:10px">Three locks protect this field. Remove all three to reveal the password.</p>
          <input type="password" id="af-pw" value="correct-horse-battery-staple" readonly disabled
            style="width:100%;font-family:monospace;padding:10px;background:#0d1117;color:#c9d1d9;border:2px solid #ff5555;border-radius:6px;font-size:.9rem">
          <div style="margin-top:8px;font-size:.76rem;color:#ff5555;font-family:monospace">
            🔒 disabled &nbsp; 🔒 readonly &nbsp; 🔒 type="password"
          </div>
        </div>`;
    },

    // ── CSS OVERRIDE ──────────────────────────────────────────────
    cssOverride(mount) {
      mount.innerHTML = `
        <div style="padding:14px">
          <h4 style="margin-bottom:8px">🎬 Best Hacker Shows — Rated & Reviewed</h4>
          <div class="co-content" style="filter:blur(8px);user-select:none;pointer-events:none;position:relative">
            <ol style="padding-left:20px;line-height:2">
              <li>Hackers (1995) — great vibes, terrible accuracy. 6/10</li>
              <li>Mr. Robot (2015) — borderline accurate. Code word: <strong style="color:#00ff88">ELLIOT</strong>. 10/10</li>
              <li>WarGames (1983) — the original kid-hacks-everything. 9/10</li>
              <li>Black Mirror: Hated In The Nation — unsettling and real. 8/10</li>
            </ol>
          </div>
          <p style="font-size:.76rem;color:#6e7681;margin-top:8px">content is blurred and click-locked — override the CSS</p>
        </div>`;
    },

    // ── SOURCE INVESTIGATOR ───────────────────────────────────────
    sourceInvestigator(mount) {
      // Inject a "script" into the sandbox that a fake config file would have loaded.
      // We create a <script> tag with an identifiable name via sourceURL comment.
      const fakeScript = document.createElement('script');
      fakeScript.textContent = `
// CorpTech Solutions — corp-config.js
// Internal configuration. DO NOT commit to public repos.
// TODO: move all of this to the server before launch — Bob
const corpConfig = {
  appName: 'CorpTech Portal',
  version: '2.4.1',
  debug: true,
  apiKey: 'sk_live_h4ck3r_abc999',   // TODO: rotate before launch!!
  internalEndpoint: '/api/admin/v2',
  featureFlags: { betaUsers: true, newDashboard: false },
};
// flag found: nice recon work.
//# sourceURL=corp-config.js`;
      document.head.appendChild(fakeScript);

      mount.innerHTML = `
        <div style="padding:14px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <span style="font-size:1.5rem">🏢</span>
            <div>
              <div style="font-weight:700">CorpTech Solutions</div>
              <div style="font-size:.8rem;color:#6e7681">enterprise portal · v2.4.1</div>
            </div>
          </div>
          <div style="background:#11151c;border:1px solid #1f2733;border-radius:6px;padding:12px;font-size:.82rem">
            <div style="color:#6e7681;margin-bottom:6px">loaded scripts visible in DevTools → Sources tab:</div>
            <div style="font-family:monospace;color:#ffd866">corp-config.js</div>
            <div style="font-family:monospace;color:#6e7681">app.bundle.min.js</div>
            <div style="font-family:monospace;color:#6e7681">analytics.js</div>
          </div>
          <p style="font-size:.76rem;color:#6e7681;margin-top:8px">find corp-config.js in the Sources tab and read what's inside</p>
        </div>`;
    },

    // ── LOCALSTORAGE HACKER ───────────────────────────────────────
    lsHacker(mount) {
      // Ensure plan is 'free' at start
      if (localStorage.getItem('flixhub_plan') !== 'premium') {
        localStorage.setItem('flixhub_plan', 'free');
      }
      function renderFlixHub() {
        const isPremium = localStorage.getItem('flixhub_plan') === 'premium';
        mount.innerHTML = `
          <div style="padding:14px;font-size:.88rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <span style="font-weight:800;font-family:monospace;color:#ff5555;font-size:1.1rem">FLIXHUB</span>
              <span style="font-size:.76rem;color:#6e7681;font-family:monospace">plan: <strong style="color:${isPremium?'#00ff88':'#ff5555'}">${isPremium?'PREMIUM':'FREE'}</strong></span>
            </div>
            ${isPremium ? `
              <div style="background:#0d1117;border:1px solid #00ff88;border-radius:6px;padding:12px">
                <div style="color:#00ff88;font-weight:700;margin-bottom:8px">🎬 PREMIUM UNLOCKED</div>
                <p>Welcome to the vault. The industry codeword for back-channel film distribution is: <strong style="color:#ffd866">TORRENT</strong></p>
                <p style="font-size:.76rem;color:#6e7681;margin-top:6px">(pro tip: type this as your answer)</p>
              </div>` : `
              <div style="background:#0d1117;border:1px solid #ff5555;border-radius:6px;padding:12px">
                <div style="font-size:2rem;text-align:center;margin-bottom:8px">🔒</div>
                <div style="text-align:center;color:#ff5555;font-weight:700">PREMIUM CONTENT LOCKED</div>
                <div style="text-align:center;font-size:.76rem;color:#6e7681;margin-top:6px">
                  localStorage key: <code style="color:#ffd866">flixhub_plan</code><br>current value: <code style="color:#ff5555">"free"</code>
                </div>
              </div>`}
          </div>`;
      }
      renderFlixHub();
      window.__lsReload = renderFlixHub;
      // Poll for changes (in case they edit in DevTools Application tab)
      const poll = setInterval(() => {
        const plan = localStorage.getItem('flixhub_plan');
        if (plan === 'premium') { renderFlixHub(); clearInterval(poll); }
      }, 800);
    },

    // ── NETWORK SPY ───────────────────────────────────────────────
    networkSpy(mount) {
      mount.innerHTML = `
        <div style="padding:14px;font-size:.88rem">
          <div style="display:flex;align-items:center;gap:12px;background:#11151c;border:1px solid #1f2733;border-radius:8px;padding:12px;margin-bottom:12px">
            <span style="font-size:2rem">👤</span>
            <div>
              <div style="font-weight:700">jake_h4ck3r</div>
              <div style="font-size:.78rem;color:#6e7681">member since 2023</div>
            </div>
          </div>
          <div style="font-size:.76rem;color:#6e7681">
            that's all the app shows you. but the API returned more.<br>
            call <code style="color:#ffd866">/api/spy-user</code> to see the full response.
          </div>
        </div>`;
    },

    paywall(mount) {
      window.__isPremium = false;
      mount.innerHTML = `
        <h4>🔥 10 SHOCKING SECRETS ABOUT MINECRAFT</h4>
        <p style="color:#888;font-size:.85rem">by Tim Buzzfeed · 4 min read</p>
        <p>You won't BELIEVE number 7. Subscribe to PremiumPro™ to keep reading.</p>
        <div class="pay-locked" id="payLock">
          <p style="font-size:1.5rem">🔒</p>
          <button id="payBtn" disabled>Unlock for $4.99/week</button>
          <p style="font-size:.8rem;color:#666;margin-top:8px">(disabled until you pay… supposedly)</p>
        </div>
        <div class="pay-open" id="payOpen" style="display:none">
          <p><strong>SECRET #7:</strong> the famous green exploding mob — the <strong>creeper</strong> — was a pig model gone wrong when the dev swapped its height and width. code word: <strong>CREEPER</strong>. and you bypassed the paywall to read it. clean.</p>
        </div>`;
      const btn = mount.querySelector('#payBtn');
      window.__tryUnlock = () => {
        if (window.__isPremium || !btn.disabled) {
          mount.querySelector('#payLock').style.display = 'none';
          mount.querySelector('#payOpen').style.display = 'block';
        } else { H.toast('pay up. (…or find another way 😏)', ''); }
      };
      btn.onclick = window.__tryUnlock;
      // if they flip the flag in console, reflect it when they click; also watch the attribute
      new MutationObserver(() => { if (!btn.disabled) window.__isPremium = true; })
        .observe(btn, { attributes: true, attributeFilter: ['disabled'] });
    },
  };

  // public surface
  window.HLESSON = {
    revealHint, flip, advance: () => advance(current.node, current.idx),
    addBlock, removeBlock, resetBuild, checkBuild, toggleTok, checkSpot, pickOption, checkProof, pickObserve,
  };
})();
