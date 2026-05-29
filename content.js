// ════════════════════════════════════════════════════════════════════
//  H4CKERHQ — content.js
//  ALL learning content lives here as data. Adding lessons = editing this.
//  Engine (lesson.js / game.js) renders everything from these structures.
// ════════════════════════════════════════════════════════════════════

/* ───────────────────────────────────────────────────────────────────
   VOCAB — Field Manual glossary + flashcard source
   shape: { term, oneLiner, detail, example }
─────────────────────────────────────────────────────────────────── */
const VOCAB = [
  { term: 'window', oneLiner: 'the giant box that holds EVERYTHING the page has.',
    detail: 'Every variable, function, and setting a web page creates lives on `window`. If you can find it, you can read it or change it.',
    example: "window.location   // the page's URL" },
  { term: 'global', oneLiner: 'something available everywhere on the page.',
    detail: 'A global lives on `window`, so any code (including YOU, in the console) can reach it. Secrets accidentally left global are free real estate.',
    example: "Object.keys(window)   // list every global" },
  { term: 'variable', oneLiner: 'a labeled box that stores a value.',
    detail: 'Made with let/const/var. The label is the name; the box holds a number, text, true/false, etc.',
    example: "let isAdmin = false" },
  { term: 'boolean', oneLiner: 'a value that is only true or false.',
    detail: 'Booleans gate things: logged in? premium? admin? If the gate is checked in YOUR browser, you can flip the boolean.',
    example: "isPremium = true   // flip the gate" },
  { term: 'object', oneLiner: 'a bundle of named values.',
    detail: 'Like a backpack of labeled pockets. `localStorage` and `window` are both objects you can dig through.',
    example: "user = { name:'jake', isAdmin:false }" },
  { term: 'function', oneLiner: 'a saved action you can run by name.',
    detail: 'Call it with `()`. Sites leave functions on `window` — sometimes ones they never meant you to find.',
    example: "enableAdminMode()   // run a function" },
  { term: 'the DOM', oneLiner: 'the live tree of everything on the page.',
    detail: 'Document Object Model. Every button, image, and box is a node in this tree. The Elements tab shows it. You can edit it live.',
    example: "document.querySelector('button')" },
  { term: 'element', oneLiner: 'one thing in the DOM — a button, input, image…',
    detail: 'Grab one with querySelector, then read or change it: its text, whether it is disabled, its value.',
    example: "el.disabled = false" },
  { term: 'attribute', oneLiner: 'a setting written on an element.',
    detail: 'Like `disabled`, `type`, `href`, `value`. Many "locks" are just an attribute you can delete.',
    example: '<button disabled>  ← delete "disabled"' },
  { term: '.js / JavaScript', oneLiner: 'the language that makes pages do things.',
    detail: 'Files ending in .js ship to your browser — which means you can read all of them. Secrets hidden in .js are not hidden.',
    example: "config.js, app.js, auth.js" },
  { term: 'console', oneLiner: 'where you type JavaScript to run it live.',
    detail: 'The single most powerful tab in DevTools. Anything the page can do, you can do here too.',
    example: "> document.title" },
  { term: 'runtime', oneLiner: 'the program while it is actually running.',
    detail: '"Runtime recon" = poking a live program to see what it exposes right now — not just reading the files.',
    example: "Object.keys(window)" },
  { term: 'Sources tab', oneLiner: 'DevTools view of every file the page loaded.',
    detail: 'Read any script, set breakpoints, and (in Chrome) global-search ALL files at once with Cmd+Opt+F.',
    example: "search all files for: apiKey" },
  { term: 'Network tab', oneLiner: 'a live log of every request the page makes.',
    detail: 'Watch the page talk to its server. Passwords, tokens, and hidden API calls all show up here.',
    example: "filter: Fetch/XHR" },
  { term: 'localStorage', oneLiner: 'a notebook the site keeps ON your computer.',
    detail: 'Sites store settings/flags here. It is YOUR computer — you can read and rewrite every line.',
    example: "localStorage.setItem('pro','true')" },
  { term: 'API', oneLiner: "the site's back-door menu of data + actions.",
    detail: 'The polite UI is one thing; the API is the truth underneath. Find its endpoints and you can call them directly.',
    example: "/api/users/123" },
  { term: 'endpoint', oneLiner: 'one specific API address you can call.',
    detail: 'A URL the app talks to. Some are never linked in the UI but still answer if you ask.',
    example: "fetch('/api/secret-vault')" },
  { term: 'fetch', oneLiner: 'the command to call a URL yourself.',
    detail: 'Lets you hit any endpoint from the console — no button required.',
    example: "fetch('/api/me').then(r=>r.json())" },
  { term: 'client-side', oneLiner: 'code that runs in YOUR browser.',
    detail: 'You control everything client-side. So any lock enforced only client-side is not a real lock.',
    example: "a disabled button" },
  { term: 'server-side', oneLiner: "code that runs on the company's computer.",
    detail: 'You cannot see or change it. REAL security lives here. The lesson behind every trick: checks must happen server-side.',
    example: "the server checks: do you own this?" },
];

/* ───────────────────────────────────────────────────────────────────
   COMMANDS — Armory cookbook (the building blocks)
   shape: { block, plain, returns, example, tag }
─────────────────────────────────────────────────────────────────── */
const COMMANDS = [
  { block: "document.querySelector('…')", plain: 'grab the first element that matches.', returns: 'one element (or null)',
    example: "document.querySelector('#login')", tag: 'find' },
  { block: ".value", plain: "read or set what's typed in an input.", returns: 'the text in the field',
    example: "input.value = 'admin'", tag: 'find' },
  { block: ".disabled = false", plain: 're-enable a disabled element.', returns: 'unlocks it',
    example: "btn.disabled = false", tag: 'find' },
  { block: ".type = 'text'", plain: 'turn a password field into plain text.', returns: 'reveals the dots',
    example: "pw.type = 'text'", tag: 'find' },
  { block: "Object.keys(obj)", plain: 'list every name inside an object.', returns: 'an array of names',
    example: "Object.keys(window)", tag: 'search' },
  { block: "Object.entries(obj)", plain: 'list every name AND its value.', returns: 'array of [name, value] pairs',
    example: "Object.entries(localStorage)", tag: 'search' },
  { block: ".filter(x => …)", plain: 'keep only the items that pass a test.', returns: 'a smaller array',
    example: "list.filter(n => n.length > 3)", tag: 'search' },
  { block: ".includes('…')", plain: 'does this contain that? true / false.', returns: 'a boolean',
    example: "name.includes('admin')", tag: 'search' },
  { block: "localStorage.getItem('k')", plain: 'read a stored value by name.', returns: 'the value (text) or null',
    example: "localStorage.getItem('token')", tag: 'storage' },
  { block: "localStorage.setItem('k','v')", plain: 'write/overwrite a stored value.', returns: 'changes it on your machine',
    example: "localStorage.setItem('pro','true')", tag: 'storage' },
  { block: "fetch('/url')", plain: 'call a URL / endpoint yourself.', returns: 'a Promise of the response',
    example: "fetch('/api/me')", tag: 'network' },
  { block: ".then(r => r.json())", plain: 'unpack a response as data.', returns: 'the parsed JSON',
    example: "fetch('/api/me').then(r=>r.json())", tag: 'network' },
];

// How blocks COMBINE — shown in the Armory to kill the "magic spell" problem.
const COMBOS = [
  { goal: 'Find a hidden admin function on the page',
    build: ["Object.keys(window)", ".filter(n => ", "n.includes('Admin')", ")"],
    result: "Object.keys(window).filter(n => n.includes('Admin'))",
    reads: "list everything on window → keep only names containing 'Admin'." },
  { goal: 'Reveal what a password box is hiding',
    build: ["document.querySelector('input[type=password]')", ".type = 'text'"],
    result: "document.querySelector('input[type=password]').type = 'text'",
    reads: "grab the password field → switch it to plain text." },
  { goal: 'Unlock yourself in a site that stored a flag',
    build: ["localStorage.setItem(", "'isPro'", ", 'true')"],
    result: "localStorage.setItem('isPro','true')",
    reads: "overwrite the site's note about you → reload." },
];

/* ───────────────────────────────────────────────────────────────────
   BLOCK_INFO — plain-English meaning of each build-the-command block.
   used for hover tooltips + the "what's this?" caption while building.
─────────────────────────────────────────────────────────────────── */
const BLOCK_INFO = {
  "document": "the whole web page (an object you can ask for elements)",
  "window": "the giant object that holds EVERYTHING on the page",
  ".querySelector(": "method: find the first element that matches",
  "document.querySelector('input[type=password]')": "grabs the password box on the page",
  "'#login'": "a string — the id to find (# means 'id')",
  "'.login'": "a string — a class selector (. means 'class')",
  ")": "closes the parentheses around the argument",
  ".value": "property: the text typed inside an input",
  ".type": "property: what kind of input it is (text / password …)",
  "= 'text'": "set it to plain text → reveals the hidden dots",
  "= 'password'": "set it back to hidden dots",
  ".disabled": "property: whether the element is locked off",
  "localStorage": "the site's notebook saved on YOUR computer",
  ".getItem(": "method: read a saved value by name",
  ".setItem(": "method: write / overwrite a saved value",
  "'token'": "a string — the name of the value to read",
  "'cookie'": "a string — a different storage name",
  ".filter(": "method: keep only the items that pass a test",
  ".includes(": "method: does this contain that? true / false",
  "Object.keys(window)": "list every name on window (a big array)",
  // DOM manipulation blocks
  "'.paywall'": "a string — CSS class selector (dot = class, # = id)",
  "'.overlay'": "a string — class selector for an overlay element",
  "'.headline'": "a string — class selector for the headline element",
  "'.blur-target'": "a string — class selector for the blurred content",
  ".remove()": "method: permanently delete this element from the DOM",
  ".textContent": "property: the visible text inside an element — read or set it",
  ".innerHTML": "property: the full HTML inside an element (including tags)",
  ".style.display": "property: controls visibility — 'none' = hidden, 'block' = visible",
  "= 'none'": "assignment: set this property to none — hides the element",
  "= 'block'": "assignment: set display to block — makes the element appear",
  ".style.filter": "property: visual effects like blur(), brightness(), etc.",
  "= ''": "assignment: empty string — clears the filter, removing all effects",
  ".removeAttribute(": "method: delete an HTML attribute from the element",
  "'disabled'": "a string — the attribute that locks a button or input",
  "'readonly'": "a string — the attribute that prevents editing a field",
  "'hidden'": "a string — the attribute that makes an element invisible",
  ".getAttribute(": "method: read the current value of an HTML attribute",
  // network / fetch blocks
  "fetch(": "function: call a URL and get the response",
  "'/api/users'": "a string — the URL path to fetch from",
  "'/api/data'": "a string — a generic API endpoint URL",
  ".then(r =>": "chain: when the response arrives, do something with it (r = response)",
  "r.json()": "method: parse the response body as JSON data",
  ".then(data =>": "chain: when the JSON is ready, do something with the data",
  "console.log(data)": "print the data to the console so you can inspect it",
  ")": "closes the parentheses around the argument",
};

/* ───────────────────────────────────────────────────────────────────
   REDFLAGS — Threat Board ("smells like a vuln" card)
   grouped by category
─────────────────────────────────────────────────────────────────── */
const REDFLAGS = [
  { category: 'Client-side gating', color: '#ff6ac1',
    items: [
      { kw: 'disabled', why: 'a lock enforced in your browser.', try: 'delete the attribute / set .disabled=false' },
      { kw: 'isPremium / isPro', why: 'pay-gate stored client-side.', try: 'flip it to true in console or storage' },
      { kw: 'isAdmin / role', why: 'permission decided in the browser.', try: 'flip it — then see what unlocks' },
      { kw: 'hidden / display:none', why: 'content is present, just invisible.', try: 'unhide it in Elements' },
    ] },
  { category: 'URLs & IDOR', color: '#56d4dd',
    items: [
      { kw: '?id= / ?user=', why: 'you can change the number.', try: 'increment it — see someone else’s data' },
      { kw: '/users/123', why: 'a guessable record reference.', try: 'try 124, 1, 9999' },
      { kw: 'sequential ids', why: 'predictable = enumerable.', try: 'loop through them' },
    ] },
  { category: 'Exposed secrets', color: '#ffd866',
    items: [
      { kw: 'apiKey / api_key', why: 'a key shipped to the browser is public.', try: 'search source; never misuse' },
      { kw: 'sk_live_… / token', why: 'live credential in client code.', try: 'flag it — this is a real bug' },
      { kw: 'password / secret', why: 'hardcoded creds.', try: 'global search the .js files' },
    ] },
  { category: 'Endpoints', color: '#00ff88',
    items: [
      { kw: '/api/…', why: 'a back-door the UI may not link.', try: 'call it directly with fetch()' },
      { kw: 'fetch( / axios', why: 'shows you where the data lives.', try: 'read the URL; try it yourself' },
    ] },
  { category: 'Storage', color: '#a78bfa',
    items: [
      { kw: 'localStorage', why: 'state kept on YOUR machine.', try: 'read + rewrite it' },
      { kw: 'cookies', why: 'sometimes hold role/session flags.', try: 'inspect them in Application tab' },
    ] },
  { category: 'Money', color: '#ff5555',
    items: [
      { kw: 'price / amount / total', why: 'if the client sends it, it can be changed.', try: 'edit the value in the request' },
    ] },
];

/* ───────────────────────────────────────────────────────────────────
   SKILL_TREE — the nodes (Duolingo path), each with micro-tasks
   node: { id, track, title, icon, blurb, requires[], defense, tasks[], flex, wave? }
   task types: flashcard | build | spot | quiz | real
   every task may carry hints[] (revealed one rung at a time)
─────────────────────────────────────────────────────────────────── */
const SKILL_TREE = [

  // ── NODE 1 ──────────────────────────────────────────────────────
  {
    id: 'boot', track: 'core', title: 'Boot Camp', icon: '🥾',
    blurb: 'read the machine. every site hands you its code — learn to look.',
    requires: [], defense: 6,
    flex: "Cmd+U on ANY website shows its source. Tell a friend 'nothing is hidden online' — then prove it.",
    tasks: [
      { type: 'flashcard', vocab: 'window' },
      { type: 'flashcard', vocab: 'console' },
      { type: 'flashcard', vocab: 'the DOM' },
      { type: 'quiz', question: 'A site puts a secret in an HTML comment so users "can\'t see it." Can you?',
        options: ['No, comments are private', 'Yes — it ships to my browser, I can read it', 'Only with special software'],
        answer: 1, explain: 'Comments, hidden text, .js files — all of it ships to you. Hidden ≠ gone.' },
      { type: 'spot', prompt: 'This snippet ships to your browser. Tap what a hacker would zero in on.',
        tokens: [
          {t:'<!--', tip:'opens an HTML comment. Comments are invisible on the page — but they still download to your browser. Not secret.'},
          {t:'admin login at', tip:'just words describing what follows — the real leak is the address itself.'},
          {t:'/secret-admin', flag:true, tip:'a hidden admin URL. "Hidden" only means unlinked — type it in and it loads. Free recon.'},
          {t:'pw:', tip:'a label. The danger is the value right after it.'},
          {t:'hunter2', flag:true, tip:'an actual password left in a comment. Credentials in source = instant win for an attacker.'},
          {t:'-->', tip:'closes the comment — not a risk by itself.'} ],
        hints: ['Comments are not secret — read what it leaks.', 'Two things here help an attacker: a hidden location and a credential.'] },
    ],
  },

  // ── NODE 2 ──────────────────────────────────────────────────────
  {
    id: 'blocks', track: 'core', title: 'Command Blocks', icon: '🧩',
    blurb: 'real commands are small pieces snapped together. build, don\'t memorize.',
    requires: ['boot'], defense: 7,
    flex: "You can grab and change anything on a page by hand — no tutorial needed.",
    tasks: [
      { type: 'flashcard', vocab: 'variable' },
      { type: 'flashcard', vocab: 'object' },
      { type: 'build', prompt: 'Build the command that GRABS the element with id "login".',
        solution: ["document", ".querySelector(", "'#login'", ")"],
        distractors: ["window", ".filter(", "'.login'"],
        reads: "document → querySelector → '#login' → )",
        teach: "<b>document</b> is an <b>OBJECT</b> — a thing with built-in abilities. <b>.querySelector(…)</b> is a <b>METHOD</b> — an action the object can do. The dot <code>.</code> means \"do this to the thing before it.\" The <b>( )</b> hold the <b>ARGUMENT</b> — the info you hand the method. <code>'#login'</code> is a <b>STRING</b> (text in quotes); the <code>#</code> means \"id\".",
        hints: [
          'Start with the thing that means "the whole page" — one word.',
          'A dot ( . ) means "do something to the thing before it". The action that finds one element is querySelector.',
          'The ( ) right after querySelector holds what you\'re searching for — that part is called the ARGUMENT.',
          'In HTML an id starts with #, and it\'s text, so it goes in quotes: \'#login\'. Then close it with ).'] },
      { type: 'build', prompt: 'Build the command that READS the stored value named "token".',
        solution: ["localStorage", ".getItem(", "'token'", ")"],
        distractors: [".setItem(", "window", "'cookie'"],
        reads: "localStorage → getItem → 'token' → )",
        teach: "<b>localStorage</b> is an <b>OBJECT</b> (the notebook on your computer). <b>.getItem(…)</b> is a <b>METHOD</b>. <code>'token'</code> is a <b>STRING ARGUMENT</b> — the name of the value you're reading. Same shape every time: <code>object.method('argument')</code>.",
        hints: [
          'What object is the notebook stored on your computer? (one word)',
          'Dot, then the action. To READ a value the method is getItem — getItem reads, setItem writes.',
          'Inside the ( ) goes the NAME you want, as text in quotes: \'token\'. Then close with ).'] },
    ],
  },

  // ── NODE 3 ──────────────────────────────────────────────────────
  {
    id: 'threatsense', track: 'core', title: 'Threat Sense', icon: '🎯',
    blurb: 'train your eye. learn what "smells like a vuln" so you spot it fast.',
    requires: ['blocks'], defense: 7,
    flex: "Glance at any code and instantly point out the sketchy parts. Looks like a superpower.",
    tasks: [
      { type: 'quiz', question: 'What is a "vulnerability"?',
        options: ['A virus', 'A weak spot in a system that lets someone do something they shouldn\'t', 'A type of password'],
        answer: 1, explain: 'A vuln is a gap between what the builder ASSUMED and what is actually enforced.' },
      { type: 'spot', prompt: 'Tap everything that smells like a vuln.',
        tokens: [
          {t:'if (', tip:'a normal condition check — the question is WHAT it\'s checking.'},
          {t:'user.isAdmin', flag:true, tip:'a permission decided in your browser. If your own code reads it, you can flip it to true in the console.'},
          {t:'===', tip:'a comparison operator — not a risk.'},
          {t:'true', tip:'just the value being compared against — not the weak point by itself.'},
          {t:') showSecretPanel()', tip:'the reward if the check passes. Tempting, but it\'s the check above that\'s exploitable.'} ],
        hints: ['A permission decided in the browser is a flag.', 'isAdmin is checked client-side here — you could flip it.'] },
      { type: 'spot', prompt: 'Same drill. What would you poke?',
        tokens: [
          {t:'fetch(', tip:'calls a URL. Normal — but it shows you exactly where the data lives.'},
          {t:"'/api/orders?id=", tip:'the endpoint path. Useful intel, but the exploitable part is the value at the end.'},
          {t:'1042', flag:true, tip:'a record id you can just change. Try 1041 or 1043 — if you see someone else\'s order, that\'s IDOR.'},
          {t:"')", tip:'closes the call — not a risk.'} ],
        hints: ['Numbers in URLs can be changed.', "1042 is an id — what happens at 1041? That's IDOR."] },
      { type: 'quiz', question: 'Which of these is NOT automatically a red flag?',
        options: ['localStorage.setItem("isPro","true")', "marginTop = '12px'", 'apiKey = "sk_live_9f2..."'],
        answer: 1, explain: 'marginTop is just styling. The other two = client-side gating + an exposed live key.' },
    ],
  },

  // ── NODE 4 ── the full real skill node + attack wave ────────────
  {
    id: 'clientside', track: 'offense', title: 'Client-Side Trust', icon: '🔓',
    blurb: 'the #1 beginner exploit: locks that only exist in your browser.',
    requires: ['threatsense'], defense: 12,
    flex: "Bypass 'disabled' buttons, unhide locked content, and reveal what a password box is hiding — live, in seconds.",
    wave: {
      enemy: 'SCRIPT KIDDIE',
      attack: "tries to flip isAdmin=true in YOUR app's browser code to unlock your admin panel",
      repelledBy: "you moved the admin check to the SERVER — flipping the browser flag now does nothing",
    },
    tasks: [
      { type: 'flashcard', vocab: 'client-side' },
      { type: 'flashcard', vocab: 'server-side' },
      { type: 'spot', prompt: 'Where is the lock that you can break? Tap it.',
        tokens: [
          {t:'<button', tip:'a normal button element — not the lock itself.'},
          {t:'disabled', flag:true, tip:'the entire "lock" is this one attribute. Delete it (or set .disabled=false) and the button works.'},
          {t:'onclick="unlock()">', tip:'the action that runs when clicked. It\'s waiting for you once the button is enabled.'},
          {t:'Unlock</button>', tip:'just the button\'s label text — not a risk.'} ],
        hints: ['One attribute is the entire "lock".', 'disabled is enforced only in your browser — delete it.'] },
      { type: 'build', prompt: 'Build the command that REVEALS a password field\'s hidden text.',
        solution: ["document.querySelector('input[type=password]')", ".type", "= 'text'"],
        distractors: [".value", "= 'password'", ".disabled"],
        reads: "grab the password input → set its .type → to 'text'",
        teach: "<b>querySelector(…)</b> hands back an <b>ELEMENT</b>. <b>.type</b> is a <b>PROPERTY</b> of that element (not a method — no parentheses). The <code>=</code> is <b>ASSIGNMENT</b>: it SETS a new value. <code>'text'</code> is a <b>STRING</b>. Flipping type from 'password' to 'text' unmasks the dots.",
        hints: [
          'First GRAB the element — the password input — with querySelector.',
          'A dot can also reach a PROPERTY (a setting on the element). The one that controls how it displays is .type — no parentheses, it\'s not an action.',
          'Use = to SET it (that\'s called assignment).',
          "The new value is text, so it goes in quotes: 'text'. That switches the masked dots to readable characters."] },
      { type: 'real', target: 'sandbox', sandbox: 'paywall',
        prompt: 'This fake news site locked the article behind a paywall — enforced only in your browser. Get past it and read SECRET #7. A code word is in the unlocked text; type it below.',
        answer: 'CREEPER', accept: ['creeper', 'creepers'],
        hints: ['Open DevTools (🛠 button). The lock is a disabled button OR a client-side flag.',
                'Console way: type  window.__isPremium = true  then click unlock.',
                'Elements way: find the <button>, delete its disabled attribute, click it.'] },
      { type: 'real', target: 'observe',
        prompt: 'REAL-WORLD: open a "soft" paywalled article (a news/blog page with a "subscribe to keep reading" overlay). Turn on your browser\'s READER MODE — watch the wall vanish. Then answer:',
        observeUrls: [
          { label: 'How to find one', url: 'https://www.google.com/search?q=news+article+subscribe+to+keep+reading' },
        ],
        quiz: { question: 'When you view-source / use reader mode, the full article text is usually…',
          options: ['Not downloaded until you pay', 'Already in the page — just hidden by an overlay', 'Encrypted'],
          answer: 1, explain: 'Soft paywalls send the whole article, then cover it with a div. Reader mode strips the cover. (Hard paywalls withhold the text server-side — those you can\'t bypass, and that\'s the right way to build it.)' },
        hints: ['Reader mode icon is usually in the address bar (📄 / "Aa").', 'After reader mode, the text is readable — because it was always there.'] },
    ],
  },

  // ── NODE 5 — DOM SURGEON ─────────────────────────────────────────
  {
    id: 'dom-surgeon', track: 'offense', title: 'DOM Surgeon', icon: '🔪',
    blurb: 'the inspector isn\'t just for reading — every element is editable. learn to operate.',
    requires: ['clientside'], defense: 10,
    flex: "Delete a cookie popup, unblur paywalled text, or rewrite any headline on any site — in 10 seconds flat.",
    tasks: [
      { type: 'flashcard', vocab: 'the DOM' },
      { type: 'flashcard', vocab: 'element' },
      { type: 'quiz', question: 'You delete a paywall <div> in the Elements panel and the article appears. Then you hit refresh. What happens?',
        options: ['The paywall stays deleted — you patched it', 'The paywall comes back — your change only lived in your browser\'s RAM', 'The page crashes'],
        answer: 1, explain: 'DOM edits are live in your browser\'s memory only. Refresh reloads from the server and your change is gone. Real edits require server access — which is why client-side gating is weak, not because you broke anything permanent.' },
      { type: 'build', prompt: 'Build the command that REMOVES the paywall element from the DOM.',
        solution: ["document", ".querySelector(", "'#paywall'", ")", ".remove()"],
        distractors: ["window", ".getElementById(", "'.paywall'", ".hide()", ".delete()"],
        reads: "document → querySelector('#paywall') → .remove()",
        teach: "<b>document</b> is the OBJECT. <b>.querySelector(…)</b> finds the element. <b>'#paywall'</b> is the STRING ARGUMENT (# = id). Then chain <b>.remove()</b> — no argument needed, it deletes whatever was grabbed. Chaining with <code>.</code> means: do the next thing to the result of the previous thing.",
        hints: [
          'Start with the object that represents the whole page.',
          'Dot, then the method that finds one element by CSS selector.',
          'The # inside quotes means searching by ID. The id here is paywall.',
          'Close querySelector with ), then chain .remove() to delete the found element.'] },
      { type: 'real', target: 'sandbox', sandbox: 'domSurgeon',
        prompt: 'A paywall is blocking a movie review. Remove it from the DOM to reveal the hidden code word.',
        answer: 'HACKSAW',
        accept: ['hacksaw', 'flag:hacksaw'],
        hints: [
          'Open DevTools (🛠). In Elements, find the div with id="dss-paywall". Right-click → Delete element.',
          'Console shortcut: document.getElementById(\'dss-paywall\').remove()',
          'After removing it, the highlighted code word appears — type it below.'] },
      { type: 'spot', prompt: 'Scan this HTML. Tap every piece of code that creates a "lock" you could break in the browser.',
        tokens: [
          {t:'<div', tip:'a generic container — what it DOES depends on its attributes.'},
          {t:'id="premium-wall"', flag:true, tip:'a named overlay you can target and delete: document.querySelector(\'#premium-wall\').remove()'},
          {t:'style="display:block"', flag:true, tip:'this is what makes the wall visible. Flip it to display:none and the wall vanishes.'},
          {t:'>', tip:'closes the opening tag — not a risk.'},
          {t:'Subscribe to read', tip:'just the message shown on the wall — not the lock.'},
          {t:'</div>', tip:'closes the div — not a risk.'},
          {t:'<article', tip:'the real content container — notice how it\'s being hidden.'},
          {t:'style="opacity:0"', flag:true, tip:'the article is fully here, just invisible (opacity 0). Set it to 1 to reveal it — the text was never withheld.'},
          {t:'>', tip:'closes the tag — not a risk.'},
          {t:'Secret text here', tip:'the payload you\'re after — already in the page, just hidden.'},
          {t:'</article>', tip:'closes the article — not a risk.'}
        ],
        hints: ['Anything that controls visibility is a client-side lock.', 'The wall itself (display:block) and hiding the real content (opacity:0) are both flags — remove both.'] },
    ],
  },

  // ── NODE 6 — ATTRIBUTE FLIPPER ───────────────────────────────────
  {
    id: 'attr-flipper', track: 'offense', title: 'Attribute Flipper', icon: '🔀',
    blurb: 'HTML attributes control what elements CAN do. delete the attribute, delete the rule.',
    requires: ['dom-surgeon'], defense: 9,
    flex: "On ANY site with a password field — reveal the actual text behind the dots without knowing the password.",
    tasks: [
      { type: 'flashcard', vocab: 'attribute' },
      { type: 'quiz', question: 'A button has the `disabled` attribute. Where is that rule enforced?',
        options: ['On the server — removing it won\'t do anything', 'In your browser — delete the attribute and the button works', 'By the OS — you can\'t change it'],
        answer: 1, explain: 'disabled is an HTML attribute that lives in your browser. It\'s enforced by your browser. Delete it and the button clicks.' },
      { type: 'build', prompt: 'Build the command that ENABLES a disabled button (removes its locked attribute).',
        solution: ["document", ".querySelector(", "'#submit'", ")", ".removeAttribute(", "'disabled'", ")"],
        distractors: ["window", "'.submit'", ".getAttribute(", "'readonly'", ".disabled = false"],
        reads: "document → querySelector('#submit') → .removeAttribute('disabled')",
        teach: "<b>.removeAttribute(…)</b> is a METHOD that takes one STRING ARGUMENT — the name of the attribute to delete. Compare: <code>.disabled = false</code> also works (sets the property). But <code>.removeAttribute('disabled')</code> surgically removes the attribute entirely — like it was never there.",
        hints: [
          'Grab the element first — the button with id "submit".',
          'The method that removes attributes is .removeAttribute(). It takes the attribute name as a string.',
          '\'disabled\' is the string name of the attribute. Remove it and you\'re done.'] },
      { type: 'build', prompt: 'Build the command that REVEALS what a password field is hiding.',
        solution: ["document.querySelector('input[type=password]')", ".type", "= 'text'"],
        distractors: [".value", "= 'password'", ".disabled", ".removeAttribute("],
        reads: "grab the password field → .type property → = 'text'",
        teach: "<b>.type</b> is a PROPERTY (not a method — no parentheses). The <code>=</code> is ASSIGNMENT. Changing <b>type</b> from <code>'password'</code> to <code>'text'</code> tells the browser to show characters instead of dots. The password was always stored as plain text — the field was just masking it.",
        hints: [
          'The CSS selector for a password input is: input[type=password]',
          '.type is a property — access it with a dot, then set it with =.',
          "Set it to 'text' — that switches the masked dots to readable characters."] },
      { type: 'real', target: 'sandbox', sandbox: 'attrFlipper',
        prompt: 'Three locks protect this vault password. Remove all three to read it.',
        answer: 'correct-horse-battery-staple',
        accept: ['correct-horse-battery-staple', 'correct horse battery staple'],
        hints: [
          'Three attributes are blocking you: disabled, readonly, and type="password". Fix them one at a time.',
          'In DevTools Elements: find the input, double-click an attribute to edit or right-click to delete.',
          'Console: let el=document.getElementById(\'af-pw\'); el.removeAttribute(\'disabled\'); el.removeAttribute(\'readonly\'); el.type=\'text\''] },
    ],
  },

  // ── NODE 7 — CSS OVERRIDE ────────────────────────────────────────
  {
    id: 'css-override', track: 'offense', title: 'CSS Override', icon: '🎨',
    blurb: 'every site\'s styles are just text. you can rewrite them from the styles panel or a single console line.',
    requires: ['attr-flipper'], defense: 8,
    flex: "Unblur paywalled content, delete cookie banners, or turn any website hot pink — live in the Styles panel.",
    tasks: [
      { type: 'quiz', question: 'A site puts filter: blur(12px) on an article to hide it. Where does that blur live?',
        options: ['Downloaded and applied in your browser — you can override it', 'Applied server-side so you can\'t touch it', 'Encrypted into the image files'],
        answer: 0, explain: 'CSS is just instructions your browser follows. Override the instruction in DevTools > Styles, or write a new one in the console.' },
      { type: 'spot', prompt: 'This CSS block hides content. Tap every line that\'s the actual lock.',
        tokens: [
          {t:'.premium-content {', tip:'the CSS rule targeting the locked content — opens the block.'},
          {t:'filter:', flag:true, tip:'a visual effect property. Pairs with the value next to it to create the blur.'},
          {t:'blur(12px)', flag:true, tip:'this is the visual lock — the text is sharp underneath. Set filter to none and it\'s readable.'},
          {t:';', tip:'ends the line — not a risk.'},
          {t:'user-select:', flag:true, tip:'controls whether you can highlight text.'},
          {t:'none', flag:true, tip:'blocks you from selecting/copying the text. Override to text and copy freely.'},
          {t:';', tip:'ends the line — not a risk.'},
          {t:'pointer-events:', flag:true, tip:'controls whether the element responds to clicks/taps.'},
          {t:'none', flag:true, tip:'makes the content un-clickable. Remove it to interact normally.'},
          {t:';}', tip:'closes the rule — not a risk.'},
        ],
        hints: ['Blur is the visual lock. user-select stops copying. pointer-events stops clicking.', 'All three can be overridden in the Styles panel or with .style.* in console.'] },
      { type: 'build', prompt: 'Build the command that REMOVES the blur filter from the element with class "blur-target".',
        solution: ["document", ".querySelector(", "'.blur-target'", ")", ".style.filter", "= ''"],
        distractors: ["window", "'.paywall'", ".style.display", "= 'none'", ".remove()"],
        reads: "document → querySelector('.blur-target') → .style.filter → = ''",
        teach: "<b>.style</b> is a PROPERTY that exposes all inline CSS on an element. <b>.filter</b> is a sub-property. Setting to <code>''</code> (empty string) clears it — removes the blur entirely. Same pattern for any CSS: <code>.style.opacity</code>, <code>.style.display</code>, <code>.style.color</code>. You\'re writing CSS from JavaScript.",
        hints: [
          'Grab the element by class — class selectors start with a dot.',
          '.style gives you access to the element\'s CSS. Then .filter is the specific property to change.',
          "Set it to an empty string '' to clear the filter. That un-blurs the element."] },
      { type: 'real', target: 'sandbox', sandbox: 'cssOverride',
        prompt: 'The review is blurred and click-blocked. Override the CSS to read it and find the code word.',
        answer: 'ELLIOT',
        accept: ['elliot'],
        hints: [
          'In DevTools Elements, select the div with class "co-content". In Styles panel, find filter:blur(8px) and change it to none.',
          'Console shortcut: document.querySelector(\'.co-content\').style.cssText = \'\'',
          'After unblurring, also clear pointer-events so you can select the text.'] },
      { type: 'quiz', question: 'After you override CSS in DevTools and read the blurred content, what did you actually break?',
        options: ['You accessed data you weren\'t supposed to — that might be illegal', 'Nothing — you changed how YOUR browser renders data it already downloaded', 'You bypassed a real server-side security control'],
        answer: 1, explain: 'CSS controls how your browser displays data it already has. The server sent the full article — it just came with visual camouflage. Real content paywalls don\'t send the article at all until you\'re logged in and have paid. CSS-only gates are the bug, not you.' },
    ],
  },

  // ── NODE 8 — SOURCE INVESTIGATOR ────────────────────────────────
  {
    id: 'source-investigator', track: 'offense', title: 'Source Investigator', icon: '🕵️',
    blurb: 'developers leave clues in their own code. every .js file ships to your browser.',
    requires: ['css-override'], defense: 11,
    flex: "View-source any public site and search for TODO, FIXME, apiKey — real devs leave breadcrumbs constantly.",
    tasks: [
      { type: 'flashcard', vocab: '.js / JavaScript' },
      { type: 'flashcard', vocab: 'Sources tab' },
      { type: 'spot', prompt: 'This is a real pattern from a production JS file. Tap what a pentester flags first.',
        tokens: [
          {t:'const config = {', tip:'declares a config object. Normal — but config objects are where secrets love to hide.'},
          {t:'apiKey:', flag:true, tip:'a property literally named apiKey, sitting in code your browser downloaded. Everything in client JS is readable by anyone.'},
          {t:'"sk_live_9f2a3bXXXXXXX"', flag:true, tip:'sk_live = a LIVE secret key (Stripe-style). A real, working credential should NEVER ship to the browser. Critical leak.'},
          {t:',', tip:'just a separator between properties — not a risk.'},
          {t:'debug:', tip:'a debug setting. Worth noticing what it\'s set to.'},
          {t:'true', flag:true, tip:'debug mode ON in production usually dumps internal details into logs and the console — info leak.'},
          {t:',', tip:'separator — not a risk.'},
          {t:'// TODO: remove before launch', flag:true, tip:'a developer\'s own comment admitting this code shouldn\'t be live. A huge tell that something was rushed and forgotten.'},
          {t:'}', tip:'closes the object — not a risk.'},
        ],
        hints: ['A live API key in client JS is a critical vuln — it\'s yours to read.', 'debug:true leaks internals. The TODO means a dev knew it was wrong and shipped anyway.'] },
      { type: 'real', target: 'sandbox', sandbox: 'sourceInvestigator',
        prompt: 'This company\'s site loads a JS file. Open DevTools → Sources, find corp-config.js, and read what the devs left behind. Type the API key you find.',
        answer: 'sk_live_h4ck3r_abc999',
        accept: ['sk_live_h4ck3r_abc999'],
        hints: [
          'In Eruda DevTools, tap the Sources tab. You\'ll see files the page loaded — look for corp-config.js.',
          'Tap the file to read its contents. Search for apiKey or sk_live.',
          'The value after apiKey: is your answer.'] },
      { type: 'quiz', question: 'You find a live API key in a company\'s public JS file. White hat move:',
        options: [
          'Use it to call their API and see what you can access',
          'Report it to the company — responsible disclosure so they can rotate the key',
          'Post it on Twitter to embarrass them'
        ],
        answer: 1, explain: 'Finding and responsibly disclosing a vuln (giving the company time to fix before going public) is what separates white hats from everyone else. Some companies pay bug bounties for exactly this. Using the key yourself or posting it publicly both cause harm.' },
    ],
  },

  // ── NODE 9 — LOCALSTORAGE HACKER ────────────────────────────────
  {
    id: 'ls-hacker', track: 'offense', title: 'localStorage Hacker', icon: '🗄️',
    blurb: 'sites save flags about you on YOUR machine. you can change them.',
    requires: ['source-investigator'], defense: 10,
    flex: "Change plan:'free' to plan:'premium' in a site's localStorage. Watch the UI unlock. Works on sites that trust client-side state.",
    tasks: [
      { type: 'flashcard', vocab: 'localStorage' },
      { type: 'quiz', question: 'A streaming site stores {plan: "free"} in localStorage and uses it to hide content. What kind of gating is this?',
        options: ['Server-side — the server controls what you see', 'Client-side — your browser is making the decision based on your own data', 'Encrypted — you can\'t touch it'],
        answer: 1, explain: 'If the gate is checked in your browser using data from your browser, it\'s client-side. You control your own browser. You control your own localStorage. Flip the flag.' },
      { type: 'build', prompt: 'Build the command that UPGRADES your plan to premium in the site\'s storage.',
        solution: ["localStorage", ".setItem(", "'plan'", ", 'premium')"],
        distractors: [".getItem(", "'token'", ", 'free')", "window"],
        reads: "localStorage → .setItem( → 'plan' → , 'premium')",
        teach: "<b>localStorage</b> is the OBJECT. <b>.setItem(…)</b> is a METHOD with TWO ARGUMENTS: the KEY and the VALUE, separated by a comma. <code>'plan'</code> is the key. <code>'premium'</code> is the new value. After this runs, any code that calls <code>localStorage.getItem('plan')</code> will get back <code>'premium'</code>.",
        hints: [
          'localStorage is the object. You want to WRITE, so the method is setItem — not getItem.',
          'setItem takes two arguments: the key name, then the value — separated by a comma.',
          "'plan' is the key (what you're writing to). 'premium' is the new value. Close with )."] },
      { type: 'real', target: 'sandbox', sandbox: 'lsHacker',
        prompt: 'FlixHub Premium is locked behind a plan check in localStorage. Flip the flag and unlock the catalog. Find the code word in the unlocked content.',
        answer: 'TORRENT',
        accept: ['torrent'],
        hints: [
          'Open DevTools → Application tab → localStorage. Find the "plan" key. Double-click "free" and type "premium". Refresh the sandbox.',
          'Or console: localStorage.setItem(\'plan\', \'premium\'); then window.__lsReload && window.__lsReload()',
          'After unlocking, read the revealed content for the code word.'] },
      { type: 'quiz', question: 'You flipped plan:"free" to "premium" in localStorage. What happened on the server?',
        options: ['Your account was upgraded — you\'re legitimately premium now', 'Nothing — the server still has you as free. This only works if the site doesn\'t verify server-side', 'The site will detect it and ban your account'],
        answer: 1, explain: 'localStorage is only on your machine. The server has its own database. Real payment gates verify your account status server-side on every request — a token, a session check, a subscription lookup. If localStorage alone unlocks content, that\'s a bug in the site, not a feature you earned.' },
    ],
  },

  // ── NODE 10 — NETWORK SPY ────────────────────────────────────────
  {
    id: 'network-spy', track: 'offense', title: 'Network Spy', icon: '📡',
    blurb: 'every request your browser makes is visible. every response too — including fields the UI never shows you.',
    requires: ['ls-hacker'], defense: 15,
    wave: {
      enemy: 'API HARVESTER',
      attack: 'scans your endpoints for unprotected JSON responses leaking internal data',
      repelledBy: 'you added auth headers and stripped internal fields from API responses',
    },
    flex: "Open Network tab on any app, filter to Fetch/XHR, and find data the UI hides. Role fields, internal scores, billing IDs — they're in there.",
    tasks: [
      { type: 'flashcard', vocab: 'Network tab' },
      { type: 'flashcard', vocab: 'API' },
      { type: 'flashcard', vocab: 'fetch' },
      { type: 'spot', prompt: 'An API response has 8 fields. The UI only shows 2. Tap the fields a spy would focus on.',
        tokens: [
          {t:'{"username":', tip:'a field the UI already shows you — not interesting.'},
          {t:'"jake",', tip:'the visible username value — public.'},
          {t:'"avatar":', tip:'also shown in the UI — not a leak.'},
          {t:'"…",', tip:'the avatar URL — public.'},
          {t:'"role":', flag:true, tip:'a permission field the UI never displayed. This tells you what the account can do.'},
          {t:'"admin"', flag:true, tip:'this account is admin — the API revealed a privilege level the page hid from you.'},
          {t:',', tip:'separator — not a risk.'},
          {t:'"internal_score":', flag:true, tip:'an internal-only metric leaking out in a public response.'},
          {t:'9842', flag:true, tip:'the hidden score value — data the UI deliberately didn\'t show.'},
          {t:',', tip:'separator — not a risk.'},
          {t:'"can_beta":', flag:true, tip:'a feature-access flag that decides what you\'re allowed to use.'},
          {t:'true', flag:true, tip:'beta access granted — a gate exposed (and changeable) in the response.'},
          {t:',', tip:'separator — not a risk.'},
          {t:'"plan_override":', flag:true, tip:'a billing override hiding in a plain GET response — very spicy.'},
          {t:'"free"', flag:true, tip:'the plan value the server tracks. Seeing it here means the API is over-sharing.'},
          {t:'}', tip:'closes the object — not a risk.'}
        ],
        hints: ['role, internal_score, can_beta — privilege fields the UI never showed you.', 'plan_override is especially spicy — that\'s a billing override hiding in a GET response.'] },
      { type: 'build', prompt: 'Build the command that CALLS an API and READS the JSON response.',
        solution: ["fetch(", "'/api/data'", ").then(r =>", "r.json())", ".then(data =>", "console.log(data)", ")"],
        distractors: ["localStorage", ".getItem(", ".filter(", "= 'none'"],
        reads: "fetch('/api/data') → .then(r → r.json()) → .then(data → console.log(data))",
        teach: "<b>fetch(…)</b> is a FUNCTION that makes a network request. It returns a PROMISE — the response arrives later. <b>.then(…)</b> chains what to do when it arrives. First then: parse with <code>r.json()</code>. Second then: inspect with <code>console.log(data)</code>. This is literally how developers debug APIs — and it\'s how you find hidden fields.",
        hints: [
          'fetch() starts the request. Put the URL as a string inside the parentheses.',
          '.then(r => r.json()) parses the raw response as JSON. r is the response object.',
          'A second .then(data => ...) gets you the actual data object. console.log it to inspect every field.',
          'Each .then() needs its own closing parenthesis.'] },
      { type: 'real', target: 'sandbox', sandbox: 'networkSpy',
        prompt: 'The app shows a user profile: just a name and avatar. But the API returns way more. Call /api/spy-user and find what the UI is hiding. Type the value of the "internal_rank" field.',
        answer: 'GHOST_TIER',
        accept: ['ghost_tier', 'ghost tier'],
        hints: [
          'In Eruda → Network tab: look for requests to /api/spy-user. Click one and read the Response tab.',
          'Or console: fetch(\'/api/spy-user\').then(r=>r.json()).then(d=>console.log(d))',
          'The field is called internal_rank. Its value is your answer.'] },
    ],
  },

];
