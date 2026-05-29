// ════════════════════════════════════════════════════════════════════
//  H4CKERHQ — reference.js
//  Field Manual (vocab) · Armory (commands+combos) · Threat Board (redflags)
// ════════════════════════════════════════════════════════════════════

(function () {
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function screen(inner) {
    document.getElementById('app').innerHTML = `<div class="screen active">${headerHTML()}<main class="reference">${inner}</main></div>`;
  }

  // ── FIELD MANUAL (vocab, searchable) ──────────────────────────────
  H.route('manual', function () {
    screen(`
      <h2 class="ref-h">📖 Field Manual</h2>
      <p class="ref-sub">the words you need to read and write code. master these and the commands stop being magic.</p>
      <input id="vsearch" class="ref-search" placeholder="search terms…" oninput="HREF.filterVocab(this.value)">
      <div class="vocab-list" id="vocabList">${vocabHTML(VOCAB)}</div>
    `);
  });
  function vocabHTML(list) {
    return list.map(v => `
      <div class="vocab-item">
        <div class="vocab-term">${esc(v.term)}</div>
        <div class="vocab-one">${esc(v.oneLiner)}</div>
        <div class="vocab-detail">${esc(v.detail)}</div>
        <pre class="fc-ex">${esc(v.example)}</pre>
      </div>`).join('');
  }
  function filterVocab(q) {
    q = q.trim().toLowerCase();
    const list = VOCAB.filter(v => !q || v.term.toLowerCase().includes(q) || v.oneLiner.toLowerCase().includes(q) || v.detail.toLowerCase().includes(q));
    document.getElementById('vocabList').innerHTML = list.length ? vocabHTML(list) : '<p class="ref-sub">no match.</p>';
  }

  // ── ARMORY (command cookbook + combos) ────────────────────────────
  H.route('armory', function () {
    const tags = { find: '🎯 FIND & CHANGE', search: '🔎 SEARCH & FILTER', storage: '🗄 STORAGE', network: '🌐 NETWORK' };
    let groups = '';
    Object.keys(tags).forEach(tag => {
      const blocks = COMMANDS.filter(c => c.tag === tag);
      if (!blocks.length) return;
      groups += `<div class="armory-group"><div class="armory-tag">${tags[tag]}</div>${blocks.map(cmdHTML).join('')}</div>`;
    });
    const combos = COMBOS.map(c => `
      <div class="combo">
        <div class="combo-goal">🎯 ${esc(c.goal)}</div>
        <div class="combo-blocks">${c.build.map(b => `<span class="bb-chip">${esc(b)}</span>`).join('<span class="combo-plus">+</span>')}</div>
        <pre class="fc-ex">${esc(c.result)}</pre>
        <div class="combo-reads">${esc(c.reads)}</div>
      </div>`).join('');
    screen(`
      <h2 class="ref-h">⚔ Armory</h2>
      <p class="ref-sub">commands are small blocks. learn each one, then snap them together. that's all "hacking commands" ever are.</p>
      ${groups}
      <h3 class="ref-h2">🧩 HOW BLOCKS COMBINE</h3>
      <p class="ref-sub">this is the whole trick — no memorizing one-liners. you build them.</p>
      ${combos}
    `);
  });
  function cmdHTML(c) {
    return `
      <div class="cmd">
        <code class="cmd-block">${esc(c.block)}</code>
        <div class="cmd-plain">${esc(c.plain)}</div>
        <div class="cmd-returns">→ returns: ${esc(c.returns)}</div>
        <pre class="fc-ex">${esc(c.example)}</pre>
      </div>`;
  }

  // ── THREAT BOARD (red-flag card) ──────────────────────────────────
  H.route('threats', function () {
    const cards = REDFLAGS.map(cat => `
      <div class="threat-cat" style="border-color:${cat.color}">
        <div class="threat-cat-h" style="color:${cat.color}">${esc(cat.category)}</div>
        ${cat.items.map(it => `
          <div class="threat-item">
            <code class="threat-kw">${esc(it.kw)}</code>
            <div class="threat-why"><strong>why:</strong> ${esc(it.why)}</div>
            <div class="threat-try"><strong>try:</strong> ${esc(it.try)}</div>
          </div>`).join('')}
      </div>`).join('');
    screen(`
      <h2 class="ref-h">🚩 Threat Board</h2>
      <p class="ref-sub">the "smells like a vuln" card. when you scroll code and see one of these, your brain should ping. that ping IS the skill.</p>
      <div class="threat-grid">${cards}</div>
    `);
  });

  window.HREF = { filterVocab };
})();
