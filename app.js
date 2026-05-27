/**
 * TypeRush v3 — Core Engine
 * New: Adaptive Calibration Engine | Daily Streak Grid | Text Bank
 * Refactored: Cinematic UI, full re-architecture
 */

'use strict';

// ─────────────────────────────────────────────
// 1. WORD BANK
// ─────────────────────────────────────────────
const WORD_BANK = {
  quotes: [
    "the quick brown fox jumps over the lazy dog",
    "pack my box with five dozen liquor jugs",
    "how vexingly quick daft zebras jump",
    "to be or not to be that is the question",
    "all that glitters is not gold often have you heard that told",
    "it was the best of times it was the worst of times",
    "ask not what your country can do for you ask what you can do for your country",
    "the only way to do great work is to love what you do",
    "in the middle of every difficulty lies opportunity waiting to be found",
    "you miss one hundred percent of the shots you never attempt to take",
    "life is what happens when you are busy making other plans",
    "the secret of getting ahead is getting started one step at a time",
    "success is not final failure is not fatal it is the courage to continue",
    "every morning we are born again what we do today matters most",
    "happiness does not come from outside it comes from your own actions",
  ],
  tech: [
    "function calculate wpm typed words time in minutes return typed words divided by minutes",
    "async function fetch data await api call then response json then render to dom",
    "const use effect use state use callback use memo hooks react functional component",
    "git commit push origin main branch merge pull request review approve deploy",
    "docker compose up build container image deploy production cluster kubernetes",
    "npm install package save dev dependencies update lock file audit fix",
    "array prototype map filter reduce callback function return value accumulator",
    "try catch finally promise resolve reject async await throw new error handling",
    "select id name email from users where active equals true order by created at",
    "interface typescript generic extends implements readonly partial required omit",
    "webpack babel rollup vite bundler transpile minify tree shaking chunk split",
    "rest api endpoint get post put delete patch status code json response body",
    "import component from library export default class extends base react component",
    "const observer new intersection observer callback options observe element",
    "event listener add remove dispatch custom event target bubble capture phase",
  ],
  general: [
    "the sun sets slowly behind the distant mountains painting the sky orange red",
    "she opened the old wooden door and stepped into a room full of quiet memories",
    "coffee brewing early in the morning fills the kitchen with a warm familiar aroma",
    "walking through the park on a crisp autumn day clears the mind completely",
    "books are portals to different worlds waiting to be explored by curious minds",
    "music has the power to transport us back to specific moments in our lives",
    "learning to code is like learning a new language it takes time and daily practice",
    "the ocean waves crashed against the rocky shore under the bright full moonlight",
    "a journey of a thousand miles begins with a single deliberate step forward",
    "innovation distinguishes between a leader and a follower in any competitive field",
    "the best way to predict the future is to invent it yourself right now today",
    "every expert was once a beginner who refused to give up on their own progress",
    "the more you read the more you learn the more places you will go in your mind",
    "creativity is intelligence having fun with the tools and ideas at its disposal",
    "not all those who wander are lost some are just exploring new possibilities",
  ],
  code: {
    javascript: [
      "const queue = tasks.map(task => task.id);",
      "async function hydrateStore() { const data = await vault.readAll(); return data.filter(Boolean); }",
      "for (const [key, value] of Object.entries(matrix)) { console.log(key, value.avg); }",
      "export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }",
    ],
    python: [
      "def normalize(scores):\n    total = sum(scores)\n    return [score / total for score in scores]",
      "class Vault:\n    def __init__(self, path):\n        self.path = path\n        self.rows = []",
      "for key, value in matrix.items():\n    if value > threshold:\n        print(key, value)",
      "async def collect_events(stream):\n    async for event in stream:\n        yield event.payload",
    ],
    rust: [
      "fn clamp(value: f32, min: f32, max: f32) -> f32 { value.max(min).min(max) }",
      "let pairs: Vec<_> = samples.iter().filter(|row| row.latency_ms > 120.0).collect();",
      "match result { Ok(value) => println!(\"{}\", value), Err(err) => eprintln!(\"{}\", err), }",
      "pub struct Session { pub wpm: u32, pub accuracy: f32, pub errors: u32 }",
    ],
  }
};

// ─────────────────────────────────────────────
// 2. STATE
// ─────────────────────────────────────────────
const STATE = {
  mode: '30s',
  status: 'idle',           // idle | running | paused | finished
  category: 'mixed',
  targetWords: [],
  currentWordIndex: 0,
  currentInput: '',
  wordResults: [],          // [{word, typed, correct, errors, time}]
  wordStartTime: 0,
  errors: 0,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  startTime: null,
  elapsedPaused: 0,
  timerInterval: null,
  totalTime: 30,
  wordCount: 25,
  customText: '',
  fontSizeLevel: 'medium',
  theme: 'dark',
  sparklineData: [],
  // Settings
  soundEnabled: false,
  proMode: true,
  audioProfile: 'modelM',
  audioDeckSelected: 'modelM',
  ambientEnabled: false,
  ambientVolume: 0.28,
  zenMode: false,
  isZenModeActive: false,
  blindMode: false,
  codeLanguage: 'javascript',
  latencyLogs: [],
  latencyMatrix: {},
  lastKey: null,
  lastKeyTime: 0,
  activeRunId: null,
  activeRunTelemetry: [],
  focusLock: {
    active: false,
    source: '',
    accuracyFloor: 95,
    unlocked: true,
  },
  ghost: {
    enabled: true,
    targetWpm: 0,
    startedAt: 0,
  },
  // Calibration Engine
  calibration: {
    wordErrorMap: {},       // word → {errors, attempts, avgTime}
    clusterErrorMap: {},    // 2-char cluster → {errors, attempts}
    weakWords: [],          // top N worst words
    weakClusters: [],       // top N worst clusters
    injectionRate: 0.3,     // 0–1: fraction of words replaced by weak words
    minSamples: 3,          // min attempts before flagging
    active: false,
  },
  // Stats
  bestWPM: 0,
  bestAccuracy: 0,
  history: [],
  testsCompleted: 0,
  // Text Bank
  textBank: [],             // [{id, title, text, wordCount, date}]
  selectedBankId: null,
};

// ─────────────────────────────────────────────
// 3. DOM
// ─────────────────────────────────────────────
const D = {
  app: document.getElementById('app'),
  textDisplay: document.getElementById('textDisplay'),
  ghostInput: document.getElementById('ghostInput'),
  stage: document.getElementById('stage'),
  caret: document.getElementById('caret'),
  inputMask: document.getElementById('inputMask'),
  // Stats
  wpmValue: document.getElementById('wpmValue'),
  rawWpmValue: document.getElementById('rawWpmValue'),
  accuracyValue: document.getElementById('accuracyValue'),
  errorsValue: document.getElementById('errorsValue'),
  timerValue: document.getElementById('timerValue'),
  // Buttons
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  restartBtn: document.getElementById('restartBtn'),
  // Overlays
  capslockBar: document.getElementById('capslockBar'),
  pauseOverlay: document.getElementById('pauseOverlay'),
  resultsOverlay: document.getElementById('resultsOverlay'),
  resultWPM: document.getElementById('resultWPM'),
  resultRawWPM: document.getElementById('resultRawWPM'),
  resultAccuracy: document.getElementById('resultAccuracy'),
  resultErrors: document.getElementById('resultErrors'),
  resultTime: document.getElementById('resultTime'),
  resultBestWPM: document.getElementById('resultBestWPM'),
  resultsBadge: document.getElementById('resultsBadge'),
  resultsTryAgain: document.getElementById('resultsTryAgain'),
  resultsInsights: document.getElementById('resultsInsights'),
  resultsClose: document.getElementById('resultsClose'),
  wpmChart: document.getElementById('wpmChart'),
  calibrationInsight: document.getElementById('calibrationInsight'),
  calibrationInsightText: document.getElementById('calibrationInsightText'),
  // Sparkline
  sparklineBar: document.getElementById('sparklineBar'),
  sparklineCanvas: document.getElementById('sparklineCanvas'),
  // Mode / category pills
  modePills: document.querySelectorAll('[data-mode]'),
  catPills: document.querySelectorAll('[data-category]'),
  fontPills: document.querySelectorAll('[data-size]'),
  wcPicker: document.getElementById('wcPicker'),
  wcPills: document.querySelectorAll('.wc-pill'),
  customArea: document.getElementById('customArea'),
  customTextarea: document.getElementById('customTextarea'),
  customConfirm: document.getElementById('customConfirm'),
  // Calibration UI
  engineBar: document.getElementById('engineBar'),
  engineBarText: document.getElementById('engineBarText'),
  engineBarTags: document.getElementById('engineBarTags'),
  calibrationDot: document.getElementById('calibrationDot'),
  calibrationBtn: document.getElementById('calibrationBtn'),
  // Streak
  streakBtn: document.getElementById('streakBtn'),
  streakCount: document.getElementById('streakCount'),
  streakSection: document.getElementById('streakSection'),
  streakClose: document.getElementById('streakClose'),
  streakGrid: document.getElementById('streakGrid'),
  streakDays: document.getElementById('streakDays'),
  // History panel
  historyBtn: document.getElementById('historyBtn'),
  historyPanel: document.getElementById('historyPanel'),
  historyClose: document.getElementById('historyClose'),
  historyList: document.getElementById('historyList'),
  historyClear: document.getElementById('historyClear'),
  // Bank panel
  bankBtn: document.getElementById('bankBtn'),
  bankPanel: document.getElementById('bankPanel'),
  bankClose: document.getElementById('bankClose'),
  bankCategoryBtn: document.getElementById('bankCategoryBtn'),
  bankTitleInput: document.getElementById('bankTitleInput'),
  bankTextarea: document.getElementById('bankTextarea'),
  bankSave: document.getElementById('bankSave'),
  bankList: document.getElementById('bankList'),
  // Pro Observatory
  proBtn: document.getElementById('proBtn'),
  proPanel: document.getElementById('proPanel'),
  proClose: document.getElementById('proClose'),
  proTabs: document.querySelectorAll('[data-pro-tab]'),
  proTabPanels: document.querySelectorAll('[data-pro-panel]'),
  audioDeck: document.getElementById('audioDeck'),
  ambientToggle: document.getElementById('ambientToggle'),
  ambientVolume: document.getElementById('ambientVolume'),
  zenToggle: document.getElementById('zenToggle'),
  blindToggle: document.getElementById('blindToggle'),
  ghostToggle: document.getElementById('ghostToggle'),
  codeLanguage: document.getElementById('codeLanguage'),
  heatmapRefresh: document.getElementById('heatmapRefresh'),
  heatmapKeyboard: document.getElementById('heatmapKeyboard'),
  heatmapSummary: document.getElementById('heatmapSummary'),
  vaultExportJson: document.getElementById('vaultExportJson'),
  vaultExportCsv: document.getElementById('vaultExportCsv'),
  vaultPassphrase: document.getElementById('vaultPassphrase'),
  vaultStatus: document.getElementById('vaultStatus'),
  focusDraft: document.getElementById('focusDraft'),
  focusFloor: document.getElementById('focusFloor'),
  focusFloorValue: document.getElementById('focusFloorValue'),
  focusEngage: document.getElementById('focusEngage'),
  focusRelease: document.getElementById('focusRelease'),
  focusStatus: document.getElementById('focusStatus'),
  // Other
  panelBackdrop: document.getElementById('panelBackdrop'),
  soundToggle: document.getElementById('soundToggle'),
  soundIcon: document.getElementById('soundIcon'),
  themeToggle: document.getElementById('themeToggle'),
  ghostMarker: document.getElementById('ghostMarker'),
  confettiCanvas: document.getElementById('confettiCanvas'),
};

// ─────────────────────────────────────────────
// 4. LOCAL STORAGE
// ─────────────────────────────────────────────
const Store = {
  keys: {
    settings:    'tr3_settings',
    stats:       'tr3_stats',
    calibration: 'tr3_calibration',
    streak:      'tr3_streak',
    bank:        'tr3_bank',
    pro:         'trpro_settings',
    latency:     'trpro_latency',
  },
  get(key, def = null) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  loadAll() {
    const settings = this.get(this.keys.settings, {});
    STATE.theme = settings.theme || 'dark';
    STATE.soundEnabled = settings.soundEnabled || false;
    STATE.mode = settings.mode || '30s';
    STATE.wordCount = settings.wordCount || 25;
    STATE.category = settings.category || 'mixed';
    STATE.fontSizeLevel = settings.fontSizeLevel || 'medium';

    const pro = this.get(this.keys.pro, {});
    STATE.audioProfile = pro.audioDeckSelected || pro.audioProfile || 'modelM';
    STATE.audioDeckSelected = STATE.audioProfile;
    STATE.ambientEnabled = !!pro.ambientEnabled;
    STATE.ambientVolume = Number.isFinite(pro.ambientVolume) ? pro.ambientVolume : 0.28;
    STATE.zenMode = pro.isZenModeActive !== undefined ? !!pro.isZenModeActive : !!pro.zenMode;
    STATE.isZenModeActive = STATE.zenMode;
    STATE.blindMode = !!pro.blindMode;
    STATE.ghost.enabled = pro.ghostEnabled !== undefined ? !!pro.ghostEnabled : true;
    STATE.codeLanguage = pro.codeLanguage || 'javascript';
    STATE.focusLock.accuracyFloor = pro.focusAccuracyFloor || 95;
    STATE.latencyMatrix = this.get(this.keys.latency, {});

    const stats = this.get(this.keys.stats, {});
    STATE.bestWPM = stats.bestWPM || 0;
    STATE.bestAccuracy = stats.bestAccuracy || 0;
    STATE.history = stats.history || [];
    STATE.testsCompleted = stats.testsCompleted || 0;

    const cal = this.get(this.keys.calibration, {});
    STATE.calibration.wordErrorMap = cal.wordErrorMap || {};
    STATE.calibration.clusterErrorMap = cal.clusterErrorMap || {};
    STATE.calibration.active = cal.active !== undefined ? cal.active : false;

    STATE.textBank = this.get(this.keys.bank, []);
  },
  saveSettings() {
    this.set(this.keys.settings, {
      theme: STATE.theme,
      soundEnabled: STATE.soundEnabled,
      mode: STATE.mode,
      wordCount: STATE.wordCount,
      category: STATE.category,
      fontSizeLevel: STATE.fontSizeLevel,
    });
  },
  savePro() {
    this.set(this.keys.pro, {
      audioProfile: STATE.audioProfile,
      audioDeckSelected: STATE.audioDeckSelected,
      ambientEnabled: STATE.ambientEnabled,
      ambientVolume: STATE.ambientVolume,
      zenMode: STATE.zenMode,
      isZenModeActive: STATE.isZenModeActive,
      blindMode: STATE.blindMode,
      ghostEnabled: STATE.ghost.enabled,
      codeLanguage: STATE.codeLanguage,
      focusAccuracyFloor: STATE.focusLock.accuracyFloor,
    });
  },
  saveLatency() {
    this.set(this.keys.latency, STATE.latencyMatrix);
  },
  saveStats() {
    this.set(this.keys.stats, {
      bestWPM: STATE.bestWPM,
      bestAccuracy: STATE.bestAccuracy,
      history: STATE.history.slice(0, 50),
      testsCompleted: STATE.testsCompleted,
    });
  },
  saveCalibration() {
    this.set(this.keys.calibration, {
      wordErrorMap: STATE.calibration.wordErrorMap,
      clusterErrorMap: STATE.calibration.clusterErrorMap,
      active: STATE.calibration.active,
    });
  },
  saveBank() {
    this.set(this.keys.bank, STATE.textBank);
  },
  saveAll() {
    this.saveSettings();
    this.saveStats();
    this.saveCalibration();
    this.saveBank();
    this.savePro();
    this.saveLatency();
  },
  // Streak: { 'YYYY-MM-DD': count }
  getStreak() { return this.get(this.keys.streak, {}); },
  recordTestToday() {
    const today = new Date().toISOString().slice(0, 10);
    const data = this.getStreak();
    data[today] = (data[today] || 0) + 1;
    this.set(this.keys.streak, data);
    return data;
  },
};

// ─────────────────────────────────────────────
// 5. SOUND ENGINE
// ─────────────────────────────────────────────
const Sound = {
  _ctx: null,
  ctx() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  },
  burst({ freq = 800, end = 500, type = 'sine', gain = 0.04, dur = 0.05, delay = 0, filter = 9000 }) {
    const ctx = this.ctx();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const biquad = ctx.createBiquadFilter();
    const t = ctx.currentTime + delay;
    osc.type = type;
    biquad.type = 'lowpass';
    biquad.frequency.setValueAtTime(filter, t);
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, end), t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(biquad); biquad.connect(amp); amp.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.01);
  },
  play(type) {
    if (!STATE.soundEnabled) return;
    try {
      if (type === 'finish') {
        [523, 659, 784, 1047].forEach((f, i) => this.burst({ freq: f, end: f * 0.94, gain: 0.06, dur: 0.18, delay: i * 0.11 }));
        return;
      }
      if (type === 'error') {
        this.burst({ freq: 180, end: 92, type: 'sawtooth', gain: 0.065, dur: 0.11, filter: 1200 });
        return;
      }
      const deck = STATE.audioProfile;
      if (deck === 'modelM') {
        this.burst({ freq: type === 'word' ? 980 : 720, end: 190, type: 'square', gain: 0.045, dur: 0.045, filter: 2600 });
        this.burst({ freq: 4200, end: 1600, type: 'triangle', gain: 0.012, dur: 0.025 });
      } else if (deck === 'linear') {
        this.burst({ freq: type === 'word' ? 520 : 380, end: 240, type: 'sine', gain: 0.04, dur: 0.07, filter: 1700 });
      } else if (deck === 'retro') {
        const heavy = type === 'word' ? 0.06 : 0.045;
        this.burst({ freq: 260, end: 90, type: 'sawtooth', gain: heavy, dur: 0.08, filter: 1900 });
        if (type === 'word') this.burst({ freq: 1400, end: 700, type: 'square', gain: 0.025, dur: 0.12, delay: 0.035, filter: 2400 });
      } else if (deck === 'holo') {
        this.burst({ freq: type === 'word' ? 1760 : 1320, end: type === 'word' ? 1180 : 980, type: 'triangle', gain: 0.028, dur: 0.035, filter: 7000 });
      }
    } catch {}
  }
};

// ─────────────────────────────────────────────
// 6. CALIBRATION ENGINE
// ─────────────────────────────────────────────
const TypeRushVault = {
  name: 'TypeRushVault',
  version: 1,
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    if (!('indexedDB' in window)) return Promise.resolve(null);
    return new Promise((resolve) => {
      const req = indexedDB.open(this.name, this.version);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('session_summaries')) {
          const s = db.createObjectStore('session_summaries', { keyPath: 'id' });
          s.createIndex('date', 'timestamp');
        }
        if (!db.objectStoreNames.contains('keystroke_telemetry')) {
          const k = db.createObjectStore('keystroke_telemetry', { keyPath: 'id', autoIncrement: true });
          k.createIndex('runId', 'runId');
          k.createIndex('pair', 'pair');
        }
      };
      req.onsuccess = () => { this._db = req.result; resolve(this._db); };
      req.onerror = () => resolve(null);
    });
  },
  async add(storeName, value) {
    const db = await this.open();
    if (!db) return;
    return new Promise(resolve => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).add(value);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  },
  async bulkAdd(storeName, rows) {
    const db = await this.open();
    if (!db || !rows.length) return;
    return new Promise(resolve => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      rows.forEach(row => store.add(row));
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  },
  async getAll(storeName) {
    const db = await this.open();
    if (!db) return [];
    return new Promise(resolve => {
      const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  },
  async exportJson() {
    return {
      exportedAt: new Date().toISOString(),
      session_summaries: await this.getAll('session_summaries'),
      keystroke_telemetry: await this.getAll('keystroke_telemetry'),
      latency_matrix: STATE.latencyMatrix,
    };
  },
  toCsv(rows) {
    if (!rows.length) return '';
    const keys = Array.from(rows.reduce((set, row) => {
      Object.keys(row).forEach(k => set.add(k));
      return set;
    }, new Set()));
    const esc = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [keys.join(','), ...rows.map(row => keys.map(k => esc(row[k])).join(','))].join('\n');
  },
  async encryptText(text, passphrase) {
    if (!passphrase || !crypto?.subtle) return null;
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
    const b64 = bytes => {
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.slice(i, i + 0x8000));
      }
      return btoa(binary);
    };
    return JSON.stringify({
      type: 'typerush-vault-aes-gcm',
      kdf: 'PBKDF2-SHA256',
      iterations: 120000,
      salt: b64(salt),
      iv: b64(iv),
      data: b64(cipher),
    }, null, 2);
  },
  download(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  },
};

const Latency = {
  normalizeKey(key) {
    if (key === ' ') return 'Space';
    if (key === 'Enter') return 'Enter';
    if (key.length === 1) return key.toLowerCase();
    return null;
  },
  recordKey(rawKey) {
    if (STATE.status !== 'running') return;
    const key = this.normalizeKey(rawKey);
    if (!key) return;
    const now = performance.now();
    const previous = STATE.lastKey;
    const previousTime = STATE.lastKeyTime;
    STATE.lastKey = key;
    STATE.lastKeyTime = now;
    if (!previous || !previousTime) return;
    const delta = Math.min(2000, Math.max(0, now - previousTime));
    const pair = `${previous}>${key}`;
    const row = STATE.latencyMatrix[pair] || { pair, from: previous, to: key, count: 0, total: 0, avg: 0, errors: 0 };
    row.count += 1;
    row.total += delta;
    row.avg = Math.round(row.total / row.count);
    STATE.latencyMatrix[pair] = row;
    const target = STATE.targetWords[STATE.currentWordIndex] || '';
    const pos = STATE.currentInput.length;
    const expected = target[pos] || (rawKey === ' ' ? 'Space' : '');
    const error = expected && key !== this.normalizeKey(expected);
    if (error) row.errors += 1;
    STATE.activeRunTelemetry.push({
      runId: STATE.activeRunId,
      timestamp: Date.now(),
      pair,
      from: previous,
      to: key,
      latencyMs: Math.round(delta),
      wordIndex: STATE.currentWordIndex,
      charIndex: pos,
      expected: expected || '',
      error: !!error,
    });
    if (STATE.activeRunTelemetry.length > 5000) STATE.activeRunTelemetry.shift();
    if (STATE.activeRunTelemetry.length % 20 === 0) Store.saveLatency();
  },
  slowest(limit = 5) {
    return Object.values(STATE.latencyMatrix)
      .filter(row => row.count >= 2 && row.to !== 'Space' && row.from !== 'Space')
      .map(row => ({ ...row, score: row.avg + row.errors * 35 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};

const Fluidity = {
  syllables: ['ar', 'en', 'il', 'or', 'um', 'ra', 'sto', 'lin', 'ven', 'qua', 'mar', 'sol'],
  generateDrill(count = 80) {
    const slow = Latency.slowest(5);
    const targets = slow.length ? slow.map(row => `${row.from}${row.to}`.replace(/[^a-z]/g, '')) : ['tr', 'st', 'ou', 'gh', 'pr'];
    const words = [];
    for (let i = 0; i < count; i++) {
      const pair = targets[i % targets.length] || 'tr';
      const left = this.syllables[(i * 3) % this.syllables.length];
      const right = this.syllables[(i * 5 + 2) % this.syllables.length];
      const word = (i % 3 === 0) ? `${pair}${right}` : (i % 3 === 1) ? `${left}${pair}` : `${left}${pair}${right}`;
      words.push(word.slice(0, 12));
    }
    return words;
  },
};

const CodeForge = {
  tokenize(text) {
    return text.replace(/\n/g, ' ↵ ').replace(/\t/g, ' ⇥ ').replace(/ {2}/g, ' ·· ').split(/\s+/).filter(Boolean);
  },
  words(count = 80) {
    const templates = WORD_BANK.code[STATE.codeLanguage] || WORD_BANK.code.javascript;
    const tokens = this.tokenize(templates.join('\n'));
    const out = [];
    while (out.length < count) out.push(...tokens);
    return out.slice(0, count);
  },
  decorateToken(token) {
    const safe = escHtml(token);
    if (/^(const|let|var|function|return|export|class|async|await|def|yield|fn|pub|struct|match)$/.test(token)) return `<span class="code-token code-keyword">${safe}</span>`;
    if (/^[{}()[\];,:.=+\-<>!|&]+$/.test(token)) return `<span class="code-token code-punct">${safe}</span>`;
    if (token === '↵' || token === '⇥' || token === '··') return `<span class="code-token code-space">${safe}</span>`;
    return `<span class="code-token">${safe}</span>`;
  },
  tokenClass(token) {
    if (/^(const|let|var|function|return|export|class|async|await|def|yield|fn|pub|struct|match)$/.test(token)) return 'code-keyword';
    if (/^[{}()[\];,:.=+\-<>!|&]+$/.test(token)) return 'code-punct';
    if (token === '↵' || token === '⇥' || token === '··') return 'code-space';
    return 'code-token';
  },
};

const Ambient = {
  ctx: null,
  gain: null,
  layers: [],
  start() {
    try {
      if (this.ctx) return;
      this.ctx = Sound.ctx();
      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(STATE.ambientVolume, this.ctx.currentTime);
      this.gain.connect(this.ctx.destination);
      [55, 110, 220].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const amp = this.ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = 240 + i * 180;
        amp.gain.value = i === 0 ? 0.22 : 0;
        osc.connect(filter); filter.connect(amp); amp.connect(this.gain);
        osc.start();
        this.layers.push({ osc, filter, amp });
      });
    } catch {}
  },
  stop() {
    if (!this.ctx || !this.gain) return;
    const t = this.ctx.currentTime;
    this.gain.gain.linearRampToValueAtTime(0, t + 0.35);
    this.layers.forEach(layer => { try { layer.osc.stop(t + 0.4); } catch {} });
    this.ctx = null; this.gain = null; this.layers = [];
  },
  update(wpm, accuracy = 100) {
    if (!STATE.ambientEnabled) return;
    this.start();
    if (!this.ctx || !this.gain) return;
    const t = this.ctx.currentTime;
    const damp = accuracy < 92 ? 0.45 : 1;
    this.gain.gain.linearRampToValueAtTime(STATE.ambientVolume * damp, t + 0.18);
    this.layers.forEach((layer, i) => {
      const threshold = [0, 60, 90][i];
      const target = wpm >= threshold ? [0.20, 0.11, 0.075][i] * damp : 0;
      layer.amp.gain.linearRampToValueAtTime(target, t + 0.25);
      layer.filter.frequency.linearRampToValueAtTime(220 + Math.min(120, wpm) * (i + 2), t + 0.25);
    });
  },
};

const Ghost = {
  target() {
    if (STATE.history.length === 0) return STATE.bestWPM || 60;
    const avg10 = STATE.history.slice(0, 10).reduce((sum, row) => sum + row.wpm, 0) / Math.min(STATE.history.length, 10);
    return Math.max(30, Math.round(Math.max(STATE.bestWPM || 0, avg10 || 0)));
  },
  start() {
    STATE.ghost.targetWpm = this.target();
    STATE.ghost.startedAt = Date.now();
    if (D.ghostMarker) D.ghostMarker.style.width = '0%';
  },
  update() {
    if (!STATE.ghost.enabled || !D.ghostMarker || STATE.status !== 'running') return;
    const elapsedMin = Math.max(0, (Date.now() - STATE.startTime + STATE.elapsedPaused) / 60000);
    const expectedWords = STATE.ghost.targetWpm * elapsedMin;
    const pct = Math.min(100, (expectedWords / Math.max(STATE.targetWords.length, 1)) * 100);
    D.ghostMarker.style.width = `${pct}%`;
  },
};

const ProUI = {
  apply() {
    STATE.audioDeckSelected = STATE.audioProfile;
    STATE.isZenModeActive = STATE.zenMode;
    document.body.classList.toggle('zen-active', STATE.zenMode);
    document.body.classList.toggle('blind-active', STATE.blindMode);
    D.zenToggle?.classList.toggle('active', STATE.zenMode);
    D.blindToggle?.classList.toggle('active', STATE.blindMode);
    D.ghostToggle?.classList.toggle('active', STATE.ghost.enabled);
    D.ambientToggle?.classList.toggle('active', STATE.ambientEnabled);
    D.audioDeck?.querySelectorAll('[data-audio-profile]').forEach(btn => btn.classList.toggle('active', btn.dataset.audioProfile === STATE.audioProfile));
    if (D.ambientVolume) D.ambientVolume.value = Math.round(STATE.ambientVolume * 100);
    if (D.codeLanguage) D.codeLanguage.value = STATE.codeLanguage;
    if (D.focusFloor) D.focusFloor.value = STATE.focusLock.accuracyFloor;
    if (D.focusFloorValue) D.focusFloorValue.textContent = `${STATE.focusLock.accuracyFloor}%`;
  },
  renderHeatmap() {
    if (!D.heatmapKeyboard) return;
    const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const matrix = Object.values(STATE.latencyMatrix);
    const byKey = matrix.reduce((map, row) => {
      if (!row.to || row.to.length !== 1) return map;
      const key = row.to.toLowerCase();
      const item = map[key] || { total: 0, count: 0, errors: 0 };
      item.total += row.avg * row.count;
      item.count += row.count;
      item.errors += row.errors || 0;
      map[key] = item;
      return map;
    }, {});
    const maxAvg = Math.max(160, ...Object.values(byKey).map(v => v.total / Math.max(1, v.count)));
    D.heatmapKeyboard.innerHTML = rows.map((row, ri) => `
      <div class="key-row row-${ri}">
        ${row.split('').map(ch => {
          const stat = byKey[ch];
          const avg = stat ? Math.round(stat.total / Math.max(1, stat.count)) : 0;
          const heat = stat ? Math.min(1, avg / maxAvg) : 0;
          const hot = avg >= 145 || (stat?.errors || 0) > 0;
          return `<div class="heat-key ${hot ? 'hot' : 'cool'}" style="--heat:${heat.toFixed(2)}" title="${ch.toUpperCase()} avg ${avg || 0}ms">${ch}</div>`;
        }).join('')}
      </div>`).join('');
    const slow = Latency.slowest(5);
    D.heatmapSummary.textContent = slow.length
      ? `Slowest transitions: ${slow.map(r => `${r.from}-${r.to} ${r.avg}ms`).join(', ')}.`
      : 'No transition samples yet. Complete a run to populate the biomechanical matrix.';
  },
  setTab(tab) {
    D.proTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.proTab === tab));
    D.proTabPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.proPanel === tab));
    if (tab === 'insights') this.renderHeatmap();
  },
};

const FocusLock = {
  engage() {
    const text = D.focusDraft?.value.trim();
    if (!text) return;
    STATE.focusLock.active = true;
    STATE.focusLock.unlocked = false;
    STATE.focusLock.source = text;
    STATE.customText = text;
    setMode('custom');
    setCategory('custom');
    D.focusStatus.textContent = `Locked until ${STATE.focusLock.accuracyFloor}% accuracy is reached.`;
    D.focusRelease.disabled = true;
    closeAllPanels();
    startTest();
  },
  complete(accuracy) {
    if (!STATE.focusLock.active) return;
    if (accuracy >= STATE.focusLock.accuracyFloor) {
      STATE.focusLock.unlocked = true;
      STATE.focusLock.active = false;
      D.focusStatus.textContent = `Unlocked at ${accuracy}% accuracy.`;
      D.focusRelease.disabled = false;
    } else {
      D.focusStatus.textContent = `Still locked: ${accuracy}% accuracy is below ${STATE.focusLock.accuracyFloor}%.`;
      D.focusRelease.disabled = true;
    }
  },
  blocks(e) {
    if (!STATE.focusLock.active || STATE.focusLock.unlocked) return false;
    const key = e.key.toLowerCase();
    return (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'l', 'n', 'o', 's', 'w'].includes(key);
  },
};

const Calibration = {
  // Record the result of typing one word
  record(word, typed, errors, timeMs) {
    const map = STATE.calibration.wordErrorMap;
    if (!map[word]) map[word] = { errors: 0, attempts: 0, totalTime: 0 };
    map[word].errors += errors;
    map[word].attempts++;
    map[word].totalTime += timeMs;

    // Extract 2-char clusters from the word
    for (let i = 0; i < word.length - 1; i++) {
      const cluster = word.slice(i, i + 2);
      const cm = STATE.calibration.clusterErrorMap;
      if (!cm[cluster]) cm[cluster] = { errors: 0, attempts: 0 };
      // Attribute cluster error if any mismatch at this position
      const charError = (typed[i] !== word[i]) || (typed[i+1] !== word[i+1]) ? 1 : 0;
      cm[cluster].errors += charError;
      cm[cluster].attempts++;
    }
  },

  // Compute weak words and clusters
  analyze() {
    const map = STATE.calibration.wordErrorMap;
    const MIN = STATE.calibration.minSamples;

    const scored = Object.entries(map)
      .filter(([, v]) => v.attempts >= MIN)
      .map(([word, v]) => ({
        word,
        score: (v.errors / v.attempts) + (v.totalTime / v.attempts / 5000),
        errorRate: v.errors / v.attempts,
      }))
      .sort((a, b) => b.score - a.score);

    STATE.calibration.weakWords = scored.slice(0, 12).map(s => s.word);

    const cm = STATE.calibration.clusterErrorMap;
    const clusters = Object.entries(cm)
      .filter(([, v]) => v.attempts >= MIN)
      .map(([cluster, v]) => ({ cluster, rate: v.errors / v.attempts }))
      .filter(c => c.rate > 0.15)
      .sort((a, b) => b.rate - a.rate);

    STATE.calibration.weakClusters = clusters.slice(0, 6).map(c => c.cluster);
    STATE.calibration.active = STATE.calibration.weakWords.length > 0;

    Store.saveCalibration();
  },

  // Build a word list injecting weak words
  buildWordList(basePool, count) {
    const weak = STATE.calibration.weakWords;
    if (!STATE.calibration.active || weak.length === 0) {
      return this._shuffle(basePool).slice(0, count);
    }

    const injectionCount = Math.round(count * STATE.calibration.injectionRate);
    const normalCount = count - injectionCount;

    const normal = this._shuffle(basePool).slice(0, normalCount);
    // Cycle through weak words to fill injected slots
    const injected = [];
    for (let i = 0; i < injectionCount; i++) {
      injected.push(weak[i % weak.length]);
    }

    // Interleave: insert injected words at spread intervals
    const result = [...normal];
    const step = Math.max(1, Math.floor(normalCount / (injectionCount + 1)));
    injected.forEach((w, i) => {
      const pos = Math.min(result.length, step * (i + 1) + i);
      result.splice(pos, 0, w);
    });

    return result.slice(0, count);
  },

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Generate insight message for results modal
  getInsight(netWPM) {
    const weak = STATE.calibration.weakWords.slice(0, 4);
    const clusters = STATE.calibration.weakClusters.slice(0, 3);
    if (weak.length === 0) return null;

    let msg = `Engine flagged ${weak.length} problem words: "${weak.join('", "')}"`;
    if (clusters.length > 0) msg += `. Weak clusters: "${clusters.join('", "')}"`;
    msg += `. These will appear more frequently in your next test.`;
    return msg;
  },

  updateEngineUI() {
    const active = STATE.calibration.active;
    D.calibrationDot.classList.toggle('active', active);
    D.engineBar.style.display = active ? 'flex' : 'none';

    if (active) {
      const count = STATE.calibration.weakWords.length;
      D.engineBarText.textContent = `Engine targeting ${count} weak pattern${count !== 1 ? 's' : ''}`;
      D.engineBarTags.innerHTML = STATE.calibration.weakClusters
        .slice(0, 5)
        .map(c => `<span class="engine-tag">"${c}"</span>`)
        .join('');
    }
  },
};

// ─────────────────────────────────────────────
// 7. STREAK SYSTEM
// ─────────────────────────────────────────────
const Streak = {
  // Get consecutive day streak count
  getCurrentStreak() {
    const data = Store.getStreak();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (data[key] && data[key] > 0) streak++;
      else if (i > 0) break;  // gap found (don't break on i=0, today might be 0 before first test)
    }
    return streak;
  },

  // Render the 52-week contribution grid
  renderGrid() {
    const data = Store.getStreak();
    const grid = D.streakGrid;
    grid.innerHTML = '';

    const today = new Date();
    const days = 364;

    for (let i = days; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = data[key] || 0;
      let level = 0;
      if (count >= 6) level = 3;
      else if (count >= 3) level = 2;
      else if (count >= 1) level = 1;

      const cell = document.createElement('div');
      cell.className = `streak-cell level-${level}`;
      cell.title = `${key}: ${count} test${count !== 1 ? 's' : ''}`;
      grid.appendChild(cell);
    }

    const streak = this.getCurrentStreak();
    D.streakDays.textContent = streak;
    D.streakCount.textContent = streak;
  },

  updateTopbar() {
    const streak = this.getCurrentStreak();
    D.streakCount.textContent = streak;
  },
};

// ─────────────────────────────────────────────
// 8. TEXT BANK
// ─────────────────────────────────────────────
const Bank = {
  save(title, text) {
    if (!text.trim()) return false;
    const entry = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled',
      text: text.trim(),
      wordCount: text.trim().split(/\s+/).length,
      date: new Date().toISOString(),
    };
    STATE.textBank.unshift(entry);
    if (STATE.textBank.length > 50) STATE.textBank.pop();
    Store.saveBank();
    this.render();
    return true;
  },

  delete(id) {
    STATE.textBank = STATE.textBank.filter(e => e.id !== id);
    if (STATE.selectedBankId === id) STATE.selectedBankId = null;
    Store.saveBank();
    this.render();
  },

  select(id) {
    STATE.selectedBankId = id;
    const entry = STATE.textBank.find(e => e.id === id);
    if (entry) STATE.customText = entry.text;
    this.render();
    // Auto-set category to bank
    setCategory('bank');
    closeAllPanels();
  },

  render() {
    if (STATE.textBank.length === 0) {
      D.bankList.innerHTML = '<p class="panel-empty">Bank is empty. Save some text above.</p>';
      return;
    }
    D.bankList.innerHTML = STATE.textBank.map(entry => {
      const preview = entry.text.slice(0, 60) + (entry.text.length > 60 ? '…' : '');
      const date = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const sel = STATE.selectedBankId === entry.id ? ' selected' : '';
      return `
        <div class="bank-item${sel}" data-id="${entry.id}" role="button" tabindex="0">
          <div class="bank-item-title">${escHtml(entry.title)}</div>
          <div class="bank-item-preview">${escHtml(preview)}</div>
          <div class="bank-item-meta">
            <span>${entry.wordCount} words</span>
            <span>${date}</span>
          </div>
          <button class="bank-item-del" data-del="${entry.id}" aria-label="Delete" title="Delete">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>`;
    }).join('');
  },
};

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────────────
// 9. TEXT GENERATION
// ─────────────────────────────────────────────
function getWordPool() {
  const cat = STATE.category;
  let pool = [];
  if (cat === 'quotes' || cat === 'mixed') pool.push(...WORD_BANK.quotes);
  if (cat === 'general' || cat === 'mixed') pool.push(...WORD_BANK.general);
  if (cat === 'tech') pool.push(...WORD_BANK.tech);
  if (cat === 'code' || cat === 'fluidity') return null;
  if (cat === 'bank' || cat === 'custom') return null; // handled separately
  return pool;
}

function flattenPoolToWords(pool) {
  return pool.flatMap(sentence => sentence.split(/\s+/));
}

function generateWords(count) {
  if (STATE.category === 'fluidity') return Fluidity.generateDrill(count);
  if (STATE.category === 'code') return CodeForge.words(count);

  // Bank / custom text mode
  if ((STATE.category === 'bank' || STATE.category === 'custom') && STATE.customText) {
    const words = STATE.customText.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return ['no', 'text', 'loaded'];
    // repeat if needed
    const result = [];
    while (result.length < count) result.push(...words);
    return result.slice(0, count);
  }

  const pool = getWordPool();
  if (!pool) return ['press', 'start'];
  const words = flattenPoolToWords(pool);
  return Calibration.buildWordList(words, count);
}

// ─────────────────────────────────────────────
// 10. DISPLAY ENGINE
// ─────────────────────────────────────────────
function renderWords() {
  D.textDisplay.innerHTML = '';
  const weak = new Set(STATE.calibration.weakWords);

  STATE.targetWords.forEach((word, idx) => {
    const span = document.createElement('span');
    span.className = 'word';
    if (STATE.category === 'code') span.classList.add('code-word');
    if (weak.has(word) && STATE.calibration.active) span.classList.add('weak-word');
    span.id = `w${idx}`;
    word.split('').forEach(ch => {
      const c = document.createElement('span');
      c.className = STATE.category === 'code' ? `char ${CodeForge.tokenClass(word)}` : 'char';
      c.textContent = ch;
      span.appendChild(c);
    });
    D.textDisplay.appendChild(span);
  });

  highlightCurrentWord();
}

function highlightCurrentWord() {
  if (STATE.blindMode) return;
  document.querySelectorAll('.word.current').forEach(el => el.classList.remove('current'));
  const el = document.getElementById(`w${STATE.currentWordIndex}`);
  if (el) {
    el.classList.add('current');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function updateCharHighlight() {
  if (STATE.blindMode) return;
  const el = document.getElementById(`w${STATE.currentWordIndex}`);
  if (!el) return;
  const target = STATE.targetWords[STATE.currentWordIndex] || '';
  const inp = STATE.currentInput;
  const chars = el.querySelectorAll('.char');
  chars.forEach(c => c.classList.remove('correct', 'incorrect'));
  inp.split('').forEach((ch, i) => {
    if (i < target.length) {
      chars[i]?.classList.add(ch === target[i] ? 'correct' : 'incorrect');
    } else {
      if (chars[target.length - 1]) chars[target.length - 1].classList.add('incorrect');
    }
  });
  updateCaret();
}

function updateCaret() {
  if (STATE.blindMode) return;
  const el = document.getElementById(`w${STATE.currentWordIndex}`);
  if (!el) return;
  const chars = el.querySelectorAll('.char');
  const pos = STATE.currentInput.length;
  const targetChar = pos < chars.length ? chars[pos] : chars[chars.length - 1];
  if (!targetChar) return;
  const rect = targetChar.getBoundingClientRect();
  const stageRect = D.stage.getBoundingClientRect();
  const x = rect.left - stageRect.left + (pos >= chars.length ? rect.width : 0);
  const y = rect.top - stageRect.top;
  D.caret.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  D.caret.style.height = `${rect.height}px`;
}

function markWordDone(idx, correct) {
  if (STATE.blindMode) return;
  const el = document.getElementById(`w${idx}`);
  if (!el) return;
  el.classList.remove('current', 'weak-word');
  el.classList.add(correct ? 'done-correct' : 'done-error');
}

function revealBlindResults() {
  if (!STATE.blindMode) return;
  STATE.wordResults.forEach((row, idx) => {
    const el = document.getElementById(`w${idx}`);
    if (!el) return;
    el.classList.add(row.correct ? 'done-correct' : 'done-error');
  });
}

// ─────────────────────────────────────────────
// 11. TYPING ENGINE
// ─────────────────────────────────────────────
function handleInput(e) {
  if (STATE.status !== 'running') {
    if (STATE.status === 'idle') startTest();
    return;
  }

  const val = e.target.value;
  const target = STATE.targetWords[STATE.currentWordIndex] || '';

  if (val.endsWith(' ')) {
    const typed = val.trim();
    const correct = typed === target;
    const timeMs = Date.now() - STATE.wordStartTime;
    const wordErrors = countErrors(typed, target);

    // Record to calibration engine
    Calibration.record(target, typed, wordErrors, timeMs);

    STATE.wordResults.push({ word: target, typed, correct, errors: wordErrors, time: timeMs });
    STATE.totalKeystrokes += 1; // final separating space
    if (correct) {
      STATE.correctKeystrokes += 1;
      Sound.play('word');
    } else {
      STATE.errors += Math.max(0, target.length - typed.length);
      Sound.play('error');
    }
    markWordDone(STATE.currentWordIndex, correct);
    STATE.currentWordIndex++;
    STATE.currentInput = '';
    STATE.wordStartTime = Date.now();
    D.ghostInput.value = '';

    if (STATE.mode === 'wordCount' && STATE.currentWordIndex >= STATE.targetWords.length) {
      finishTest(); return;
    }
    if (STATE.mode === 'custom' && STATE.currentWordIndex >= STATE.targetWords.length) {
      finishTest(); return;
    }
    if (STATE.mode === 'bank' && STATE.currentWordIndex >= STATE.targetWords.length) {
      finishTest(); return;
    }

    highlightCurrentWord();
    updateStats();
  } else {
    const prevLen = STATE.currentInput.length;
    STATE.currentInput = val;
    if (val.length < prevLen) {
      updateCharHighlight();
      updateStats();
      return;
    }
    STATE.totalKeystrokes++;

    // Per-keystroke accuracy
    if (val.length > 0) {
      const i = val.length - 1;
      if (i < target.length) {
        if (val[i] === target[i]) { STATE.correctKeystrokes++; Sound.play('key'); }
        else { STATE.errors++; Sound.play('error'); }
      } else {
        STATE.errors++; Sound.play('error');
      }
    }
    updateCharHighlight();
    updateStats();
  }
}

function countErrors(typed, target) {
  let errs = 0;
  const len = Math.max(typed.length, target.length);
  for (let i = 0; i < len; i++) {
    if (typed[i] !== target[i]) errs++;
  }
  return errs;
}

// ─────────────────────────────────────────────
// 12. STATS ENGINE
// ─────────────────────────────────────────────
function calcWPM() {
  const now = Date.now();
  const ms = (now - STATE.startTime) + STATE.elapsedPaused;
  const min = ms / 60000;
  if (min <= 0) return { net: 0, raw: 0 };

  const typedWordCount = STATE.wordResults.length;
  const raw = Math.round(typedWordCount / min);
  const errorPenalty = Math.round(STATE.errors / Math.max(min, 0.01) / 5);
  const net = Math.max(0, raw - errorPenalty);
  return { net, raw };
}

function getAccuracy() {
  if (STATE.totalKeystrokes === 0) return 100;
  return Math.min(100, Math.round((STATE.correctKeystrokes / STATE.totalKeystrokes) * 100));
}

function updateStats() {
  const { net, raw } = calcWPM();
  const acc = getAccuracy();
  const now = Date.now();

  D.wpmValue.textContent = net;
  D.rawWpmValue.textContent = raw;
  D.accuracyValue.textContent = `${acc}%`;
  D.errorsValue.textContent = STATE.errors;
  STATE.wpm = net;

  if (['30s','1m','5m'].includes(STATE.mode)) {
    const elapsed = Math.floor((now - STATE.startTime) / 1000);
    const remaining = Math.max(0, STATE.totalTime - elapsed);
    D.timerValue.textContent = `${remaining}s`;
    if (remaining <= 0 && STATE.status === 'running') { finishTest(); return; }
  } else {
    const elapsed = Math.floor((now - STATE.startTime + STATE.elapsedPaused) / 1000);
    D.timerValue.textContent = `${elapsed}s`;
  }

  // Sparkline snapshot every 1.5s
  const last = STATE.sparklineData[STATE.sparklineData.length - 1];
  if (!last || now - last.time >= 1500) {
    STATE.sparklineData.push({ time: now, wpm: net });
    drawSparkline();
  }
  Ambient.update(net, acc);
  Ghost.update();
}

// ─────────────────────────────────────────────
// 13. SPARKLINE
// ─────────────────────────────────────────────
function drawSparkline() {
  const canvas = D.sparklineCanvas;
  const ctx = canvas.getContext('2d');
  const data = STATE.sparklineData;
  if (data.length < 2) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth || 300;
  const h = 36;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const maxV = Math.max(...data.map(d => d.wpm), 1);
  const minV = Math.min(...data.map(d => d.wpm), 0);
  const range = maxV - minV || 1;
  const isDark = STATE.theme === 'dark';
  const color = isDark ? '#7c6aff' : '#5b47e0';

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((d.wpm - minV) / range) * (h - 6) - 3,
  }));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, h);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.closePath();
  ctx.fillStyle = isDark ? 'rgba(124,106,255,0.2)' : 'rgba(91,71,224,0.12)';
  ctx.fill();

  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// ─────────────────────────────────────────────
// 14. RESULTS CHART
// ─────────────────────────────────────────────
function drawResultsChart(data) {
  const canvas = D.wpmChart;
  const ctx = canvas.getContext('2d');
  if (data.length < 2) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth || 460;
  const h = 100;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const isDark = STATE.theme === 'dark';
  const color = isDark ? '#7c6aff' : '#5b47e0';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#4a4a65' : '#9a9ab5';

  const maxV = Math.max(...data.map(d => d.wpm), 10);
  const pl = 30, pr = 8, pt = 8, pb = 22;
  const cw = w - pl - pr, ch = h - pt - pb;
  const x = i => pl + (i / (data.length - 1)) * cw;
  const y = v => pt + ch - (v / maxV) * ch;

  [0, 0.5, 1].forEach(f => {
    const yy = pt + ch * (1 - f);
    ctx.beginPath(); ctx.moveTo(pl, yy); ctx.lineTo(w - pr, yy);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.font = `${9}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxV * f), pl - 4, yy + 3);
  });

  ctx.fillStyle = textColor; ctx.font = `9px monospace`; ctx.textAlign = 'center';
  data.forEach((d, i) => {
    if (i % Math.ceil(data.length / 5) === 0 || i === data.length - 1) {
      ctx.fillText(`${d.elapsed}s`, x(i), h - 5);
    }
  });

  ctx.beginPath();
  ctx.moveTo(x(0), y(0));
  data.forEach((d, i) => ctx.lineTo(x(i), y(d.wpm)));
  ctx.lineTo(x(data.length - 1), pt + ch);
  ctx.lineTo(x(0), pt + ch);
  ctx.closePath();
  ctx.fillStyle = isDark ? 'rgba(124,106,255,0.15)' : 'rgba(91,71,224,0.1)';
  ctx.fill();

  ctx.beginPath();
  data.forEach((d, i) => i === 0 ? ctx.moveTo(x(i), y(d.wpm)) : ctx.lineTo(x(i), y(d.wpm)));
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();

  data.forEach((d, i) => {
    ctx.beginPath(); ctx.arc(x(i), y(d.wpm), 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  });
}

// ─────────────────────────────────────────────
// 15. CONFETTI
// ─────────────────────────────────────────────
function launchConfetti() {
  const canvas = D.confettiCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#7c6aff','#a78bfa','#3dffa0','#ffb930','#ff5670','#38bdf8'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height * 0.3,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 1.5,
    vr: (Math.random() - 0.5) * 8,
  }));

  let frame = 0;
  const total = 150;
  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - frame / total);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < total) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  step();
}

// ─────────────────────────────────────────────
// 16. GAME CONTROLS
// ─────────────────────────────────────────────
function startTest() {
  resetState();

  const mode = STATE.mode;
  let count;
  switch (mode) {
    case '30s':  STATE.totalTime = 30;  count = 80;  break;
    case '1m':   STATE.totalTime = 60;  count = 150; break;
    case '5m':   STATE.totalTime = 300; count = 500; break;
    case 'wordCount': count = STATE.wordCount; break;
    case 'custom':
    case 'bank':
      if (!STATE.customText) {
        if (mode === 'bank') { openPanel('bank'); return; }
        openPanel(null); // fallback
        return;
      }
      count = 200; break;
    default: count = 50;
  }

  STATE.targetWords = generateWords(count);
  if (STATE.targetWords.length === 0) return;

  STATE.status = 'running';
  STATE.activeRunId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  STATE.activeRunTelemetry = [];
  STATE.lastKey = null;
  STATE.lastKeyTime = 0;
  STATE.startTime = Date.now();
  STATE.wordStartTime = Date.now();
  STATE.sparklineData = [];

  D.stage.classList.add('running');
  D.sparklineBar.style.display = 'flex';
  D.startBtn.disabled = true;
  D.pauseBtn.disabled = false;
  D.pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';

  renderWords();
  Ghost.start();

  // Focus input
  D.ghostInput.value = '';
  D.ghostInput.focus();

  // Start ticker
  STATE.timerInterval = setInterval(() => {
    if (STATE.status === 'running') updateStats();
  }, 200);

  updateStats();
  Calibration.updateEngineUI();
}

function pauseTest() {
  if (STATE.status === 'running') {
    STATE.status = 'paused';
    STATE.elapsedPaused += Date.now() - STATE.startTime;
    D.pauseOverlay.classList.add('visible');
    D.stage.classList.remove('running');
    D.pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    clearInterval(STATE.timerInterval);
  } else if (STATE.status === 'paused') {
    STATE.status = 'running';
    STATE.startTime = Date.now();
    D.pauseOverlay.classList.remove('visible');
    D.stage.classList.add('running');
    D.pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    D.ghostInput.focus();
    STATE.timerInterval = setInterval(() => {
      if (STATE.status === 'running') updateStats();
    }, 200);
  }
}

function restartTest() { resetState(); startTest(); }

function resetState() {
  clearInterval(STATE.timerInterval);
  STATE.timerInterval = null;
  STATE.status = 'idle';
  STATE.currentWordIndex = 0;
  STATE.currentInput = '';
  STATE.wordResults = [];
  STATE.errors = 0;
  STATE.totalKeystrokes = 0;
  STATE.correctKeystrokes = 0;
  STATE.startTime = null;
  STATE.elapsedPaused = 0;
  STATE.sparklineData = [];
  STATE.activeRunTelemetry = [];
  STATE.lastKey = null;
  STATE.lastKeyTime = 0;

  D.stage.classList.remove('running');
  D.pauseOverlay.classList.remove('visible');
  D.sparklineBar.style.display = 'none';
  if (D.ghostMarker) D.ghostMarker.style.width = '0%';
  if (!STATE.ambientEnabled) Ambient.stop();
  D.ghostInput.value = '';

  D.startBtn.disabled = false;
  D.pauseBtn.disabled = true;
  D.pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';

  D.textDisplay.innerHTML = '<span class="word placeholder-word">Press Start</span>';
  D.wpmValue.textContent = '0';
  D.rawWpmValue.textContent = '0';
  D.accuracyValue.textContent = '100%';
  D.errorsValue.textContent = '0';

  const timeLabel = ['30s','1m','5m'].includes(STATE.mode)
    ? `${STATE.totalTime}s` : '0s';
  D.timerValue.textContent = timeLabel;
}

function finishTest() {
  STATE.status = 'finished';
  clearInterval(STATE.timerInterval);
  D.stage.classList.remove('running');
  D.pauseOverlay.classList.remove('visible');
  D.startBtn.disabled = false;
  D.pauseBtn.disabled = true;

  updateStats();

  const { net, raw } = calcWPM();
  const acc = getAccuracy();
  const elapsedMs = (Date.now() - STATE.startTime) + STATE.elapsedPaused;
  const elapsedSec = Math.round(elapsedMs / 1000);

  if (net > STATE.bestWPM) STATE.bestWPM = net;
  if (acc > STATE.bestAccuracy) STATE.bestAccuracy = acc;
  STATE.testsCompleted++;

  STATE.history.unshift({
    wpm: net, rawWpm: raw, accuracy: acc, errors: STATE.errors,
    mode: STATE.mode, time: elapsedSec, date: new Date().toISOString(),
  });
  if (STATE.history.length > 50) STATE.history.pop();

  // Calibration: analyze after test
  Calibration.analyze();
  Calibration.updateEngineUI();

  // Streak: record today
  Store.recordTestToday();
  Streak.updateTopbar();

  Store.saveStats();
  Store.saveCalibration();
  Store.saveLatency();

  const calibrationErrorIndex = Math.round((STATE.errors / Math.max(STATE.totalKeystrokes, 1)) * 10000) / 100;
  TypeRushVault.add('session_summaries', {
    id: STATE.activeRunId || `run-${Date.now()}`,
    timestamp: new Date().toISOString(),
    wpm: net,
    rawWpm: raw,
    accuracy: acc,
    errors: STATE.errors,
    calibrationErrorIndex,
    mode: STATE.mode,
    category: STATE.category,
    durationSec: elapsedSec,
  });
  TypeRushVault.bulkAdd('keystroke_telemetry', STATE.activeRunTelemetry.slice());

  revealBlindResults();
  FocusLock.complete(acc);
  Ambient.update(0, acc);

  Sound.play('finish');
  if (net >= 35) launchConfetti();

  // Show results modal
  showResults(net, raw, acc, elapsedSec);
}

// ─────────────────────────────────────────────
// 17. RESULTS MODAL
// ─────────────────────────────────────────────
function showResults(wpm, raw, acc, sec) {
  D.resultWPM.textContent = wpm;
  D.resultRawWPM.textContent = raw;
  D.resultAccuracy.textContent = `${acc}%`;
  D.resultErrors.textContent = STATE.errors;
  D.resultTime.textContent = `${sec}s`;
  D.resultBestWPM.textContent = STATE.bestWPM;

  D.resultsBadge.textContent =
    wpm >= 120 ? '🚀' : wpm >= 80 ? '🏆' : wpm >= 60 ? '⭐' : wpm >= 40 ? '👍' : '💪';

  D.resultsOverlay.classList.add('visible');

  // Chart from sparkline
  const t0 = STATE.sparklineData[0]?.time || Date.now();
  const chartData = STATE.sparklineData.map(d => ({
    elapsed: Math.round((d.time - t0) / 1000),
    wpm: d.wpm,
  }));
  setTimeout(() => drawResultsChart(chartData), 60);

  // Calibration insight
  const insight = Calibration.getInsight(wpm);
  if (insight) {
    D.calibrationInsightText.textContent = insight;
    D.calibrationInsight.style.display = 'flex';
  } else {
    D.calibrationInsight.style.display = 'none';
  }
}

function hideResults() {
  D.resultsOverlay.classList.remove('visible');
}

// ─────────────────────────────────────────────
// 18. MODE / CATEGORY / FONT SIZE
// ─────────────────────────────────────────────
function setMode(mode) {
  if (STATE.status === 'running') return;
  STATE.mode = mode;
  D.modePills.forEach(p => p.classList.toggle('active', p.dataset.mode === mode));

  D.wcPicker.style.display = mode === 'wordCount' ? 'flex' : 'none';
  D.customArea.style.display = mode === 'custom' ? 'flex' : 'none';

  switch (mode) {
    case '30s': STATE.totalTime = 30; break;
    case '1m':  STATE.totalTime = 60; break;
    case '5m':  STATE.totalTime = 300; break;
  }
  const t = ['30s','1m','5m'].includes(mode) ? `${STATE.totalTime}s` : '0s';
  D.timerValue.textContent = t;
  Store.saveSettings();
}

function setCategory(cat) {
  STATE.category = cat;
  D.catPills.forEach(p => p.classList.toggle('active', p.dataset.category === cat));
  D.stage?.classList.toggle('code-mode', cat === 'code');
  Store.saveSettings();
}

const FONT_SIZES = { small: '1.1rem', medium: '1.45rem', large: '1.85rem' };
function setFontSize(level) {
  STATE.fontSizeLevel = level;
  document.documentElement.style.setProperty('--typing-size', FONT_SIZES[level]);
  D.fontPills.forEach(p => p.classList.toggle('active', p.dataset.size === level));
  Store.saveSettings();
}

// ─────────────────────────────────────────────
// 19. THEME
// ─────────────────────────────────────────────
function setTheme(theme) {
  STATE.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#080810' : '#f0f0f8';
  Store.saveSettings();
}

function toggleTheme() {
  setTheme(STATE.theme === 'dark' ? 'light' : 'dark');
}

// ─────────────────────────────────────────────
// 20. PANELS
// ─────────────────────────────────────────────
function openPanel(id) {
  closeAllPanels();
  if (!id) return;
  const panel = id === 'history' ? D.historyPanel : id === 'bank' ? D.bankPanel : id === 'pro' ? D.proPanel : null;
  if (!panel) return;
  panel.classList.add('open');
  D.panelBackdrop.classList.add('visible');
  if (id === 'pro') ProUI.renderHeatmap();
}

function closeAllPanels() {
  D.historyPanel.classList.remove('open');
  D.bankPanel.classList.remove('open');
  D.proPanel?.classList.remove('open');
  D.panelBackdrop.classList.remove('visible');
}

function renderHistory() {
  if (STATE.history.length === 0) {
    D.historyList.innerHTML = '<p class="panel-empty">No tests completed yet.</p>';
    return;
  }
  D.historyList.innerHTML = STATE.history.map(r => {
    const date = new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item">
        <div class="hi-stat"><span class="hi-label">WPM</span><span class="hi-value">${r.wpm}</span></div>
        <div class="hi-stat"><span class="hi-label">Acc</span><span class="hi-value">${r.accuracy}%</span></div>
        <div class="hi-stat"><span class="hi-label">Err</span><span class="hi-value">${r.errors}</span></div>
        <div class="hi-date">${date} · ${r.mode}</div>
      </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
// 21. CAPS LOCK
// ─────────────────────────────────────────────
function handleCapsLock(e) {
  if (e.getModifierState) {
    D.capslockBar.classList.toggle('visible', e.getModifierState('CapsLock'));
  }
}

// ─────────────────────────────────────────────
// 22. EVENT LISTENERS
// ─────────────────────────────────────────────
function attach() {
  // Typing
  D.ghostInput.addEventListener('input', handleInput);
  D.ghostInput.addEventListener('paste', e => e.preventDefault());
  D.ghostInput.addEventListener('keydown', e => { Latency.recordKey(e.key); handleCapsLock(e); });
  D.ghostInput.addEventListener('keyup', handleCapsLock);
  D.stage.addEventListener('click', () => STATE.status === 'running' && D.ghostInput.focus());

  // Main buttons
  D.startBtn.addEventListener('click', startTest);
  D.pauseBtn.addEventListener('click', pauseTest);
  D.restartBtn.addEventListener('click', restartTest);

  // Mode pills
  D.modePills.forEach(p => p.addEventListener('click', () => setMode(p.dataset.mode)));

  // Category pills
  D.catPills.forEach(p => p.addEventListener('click', () => setCategory(p.dataset.category)));

  // Word count pills
  D.wcPills.forEach(p => p.addEventListener('click', () => {
    STATE.wordCount = parseInt(p.dataset.count);
    D.wcPills.forEach(b => b.classList.toggle('active', b === p));
    Store.saveSettings();
  }));

  // Font size
  D.fontPills.forEach(p => p.addEventListener('click', () => setFontSize(p.dataset.size)));

  // Custom text
  D.customConfirm.addEventListener('click', () => {
    const txt = D.customTextarea.value.trim();
    if (txt) { STATE.customText = txt; STATE.category = 'custom'; }
  });

  // Theme & sound
  D.themeToggle.addEventListener('click', toggleTheme);
  D.soundToggle.addEventListener('click', () => {
    STATE.soundEnabled = !STATE.soundEnabled;
    D.soundToggle.classList.toggle('active', STATE.soundEnabled);
    D.soundIcon.className = STATE.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    Store.saveSettings();
  });

  D.audioDeck?.querySelectorAll('[data-audio-profile]').forEach(btn => btn.addEventListener('click', () => {
    STATE.audioProfile = btn.dataset.audioProfile;
    STATE.audioDeckSelected = STATE.audioProfile;
    STATE.soundEnabled = true;
    D.soundToggle.classList.add('active');
    D.soundIcon.className = 'fa-solid fa-volume-high';
    ProUI.apply();
    Store.saveSettings();
    Store.savePro();
    Sound.play('key');
  }));
  D.ambientToggle?.addEventListener('click', () => {
    STATE.ambientEnabled = !STATE.ambientEnabled;
    if (STATE.ambientEnabled) Ambient.start(); else Ambient.stop();
    ProUI.apply();
    Store.savePro();
  });
  D.ambientVolume?.addEventListener('input', () => {
    STATE.ambientVolume = Number(D.ambientVolume.value) / 100;
    if (Ambient.gain && Ambient.ctx) Ambient.gain.gain.linearRampToValueAtTime(STATE.ambientVolume, Ambient.ctx.currentTime + 0.05);
    Store.savePro();
  });
  D.zenToggle?.addEventListener('click', () => {
    STATE.zenMode = !STATE.zenMode;
    STATE.isZenModeActive = STATE.zenMode;
    ProUI.apply();
    Store.savePro();
  });
  D.blindToggle?.addEventListener('click', () => {
    if (STATE.status === 'running') return;
    STATE.blindMode = !STATE.blindMode;
    ProUI.apply();
    Store.savePro();
  });
  D.ghostToggle?.addEventListener('click', () => {
    STATE.ghost.enabled = !STATE.ghost.enabled;
    ProUI.apply();
    Store.savePro();
  });
  D.codeLanguage?.addEventListener('change', () => {
    STATE.codeLanguage = D.codeLanguage.value;
    Store.savePro();
    if (STATE.category === 'code' && STATE.status !== 'running') setCategory('code');
  });

  // Streak
  D.streakBtn.addEventListener('click', () => {
    const open = D.streakSection.style.display !== 'none';
    D.streakSection.style.display = open ? 'none' : 'block';
    if (!open) { Streak.renderGrid(); }
  });
  D.streakClose.addEventListener('click', () => { D.streakSection.style.display = 'none'; });

  // Calibration button — toggle active
  D.calibrationBtn.addEventListener('click', () => {
    STATE.calibration.active = !STATE.calibration.active;
    if (!STATE.calibration.active) {
      // manual override: clear weak words for this session
    }
    Calibration.updateEngineUI();
    Store.saveCalibration();
  });

  // History panel
  D.historyBtn.addEventListener('click', () => { renderHistory(); openPanel('history'); });
  D.historyClose.addEventListener('click', closeAllPanels);
  D.historyClear.addEventListener('click', () => {
    if (!confirm('Clear all history?')) return;
    STATE.history = []; STATE.testsCompleted = 0;
    STATE.bestWPM = 0; STATE.bestAccuracy = 0;
    Store.saveStats(); renderHistory();
  });

  // Bank panel
  D.bankBtn.addEventListener('click', () => { Bank.render(); openPanel('bank'); });
  D.bankClose.addEventListener('click', closeAllPanels);
  D.bankCategoryBtn.addEventListener('click', () => {
    if (STATE.selectedBankId) { setCategory('bank'); }
    else { Bank.render(); openPanel('bank'); }
  });
  D.bankSave.addEventListener('click', () => {
    const ok = Bank.save(D.bankTitleInput.value, D.bankTextarea.value);
    if (ok) { D.bankTitleInput.value = ''; D.bankTextarea.value = ''; }
  });
  D.bankList.addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    if (del) { e.stopPropagation(); Bank.delete(del.dataset.del); return; }
    const item = e.target.closest('.bank-item');
    if (item) Bank.select(item.dataset.id);
  });

  // Pro Observatory
  D.proBtn?.addEventListener('click', () => openPanel('pro'));
  D.proClose?.addEventListener('click', closeAllPanels);
  D.proTabs.forEach(btn => btn.addEventListener('click', () => ProUI.setTab(btn.dataset.proTab)));
  D.heatmapRefresh?.addEventListener('click', () => ProUI.renderHeatmap());
  D.vaultExportJson?.addEventListener('click', async () => {
    D.vaultStatus.textContent = 'Compiling JSON...';
    const payload = await TypeRushVault.exportJson();
    const raw = JSON.stringify(payload, null, 2);
    const encrypted = await TypeRushVault.encryptText(raw, D.vaultPassphrase?.value || '');
    TypeRushVault.download(`typerush-vault-${Date.now()}${encrypted ? '.encrypted' : ''}.json`, 'application/json', encrypted || raw);
    D.vaultStatus.textContent = `${encrypted ? 'Encrypted and exported' : 'Exported'} ${payload.session_summaries.length} sessions and ${payload.keystroke_telemetry.length} telemetry rows.`;
  });
  D.vaultExportCsv?.addEventListener('click', async () => {
    D.vaultStatus.textContent = 'Compiling CSV...';
    const payload = await TypeRushVault.exportJson();
    const csv = [
      'session_summaries',
      TypeRushVault.toCsv(payload.session_summaries),
      '',
      'keystroke_telemetry',
      TypeRushVault.toCsv(payload.keystroke_telemetry),
    ].join('\n');
    const encrypted = await TypeRushVault.encryptText(csv, D.vaultPassphrase?.value || '');
    TypeRushVault.download(`typerush-vault-${Date.now()}${encrypted ? '.encrypted.json' : '.csv'}`, encrypted ? 'application/json' : 'text/csv', encrypted || csv);
    D.vaultStatus.textContent = `${encrypted ? 'Encrypted and exported' : 'Exported'} ${payload.session_summaries.length} sessions and ${payload.keystroke_telemetry.length} telemetry rows.`;
  });
  D.focusFloor?.addEventListener('input', () => {
    STATE.focusLock.accuracyFloor = Number(D.focusFloor.value);
    D.focusFloorValue.textContent = `${STATE.focusLock.accuracyFloor}%`;
    Store.savePro();
  });
  D.focusEngage?.addEventListener('click', () => FocusLock.engage());
  D.focusRelease?.addEventListener('click', () => {
    if (!STATE.focusLock.unlocked) return;
    STATE.focusLock.active = false;
    STATE.focusLock.source = '';
    D.focusStatus.textContent = 'Unlocked.';
  });

  // Backdrop
  D.panelBackdrop.addEventListener('click', closeAllPanels);

  // Pause overlay click
  D.pauseOverlay.addEventListener('click', () => STATE.status === 'paused' && pauseTest());

  // Results modal
  D.resultsTryAgain.addEventListener('click', () => { hideResults(); startTest(); });
  D.resultsInsights?.addEventListener('click', () => {
    hideResults();
    openPanel('pro');
    ProUI.setTab('insights');
  });
  D.resultsClose.addEventListener('click', hideResults);
  D.resultsOverlay.addEventListener('click', e => e.target === D.resultsOverlay && hideResults());

  // Auto-pause on blur
  window.addEventListener('blur', () => STATE.status === 'running' && pauseTest());

  // Caps lock detection
  document.addEventListener('keydown', handleCapsLock);
  document.addEventListener('keyup', handleCapsLock);
  document.addEventListener('copy', e => { if (STATE.focusLock.active && !STATE.focusLock.unlocked) e.preventDefault(); });
  document.addEventListener('paste', e => { if (STATE.focusLock.active && !STATE.focusLock.unlocked) e.preventDefault(); });
  window.addEventListener('beforeunload', e => {
    if (STATE.focusLock.active && !STATE.focusLock.unlocked) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (FocusLock.blocks(e)) { e.preventDefault(); e.stopPropagation(); return; }
    const active = document.activeElement;
    const isInput = active === D.ghostInput || active === D.customTextarea ||
                    active === D.bankTextarea || active === D.bankTitleInput;

    if ((e.ctrlKey || e.metaKey) && e.key === 'r') { e.preventDefault(); restartTest(); return; }

    if (!isInput || active === D.ghostInput) {
      if (e.key === 'p' || e.key === 'P') {
        if (STATE.status === 'running' || STATE.status === 'paused') { e.preventDefault(); pauseTest(); }
      }
      if (e.key === 'Enter' && (STATE.status === 'idle' || STATE.status === 'finished')) {
        e.preventDefault(); startTest();
      }
      if (e.key === 'Escape') {
        if (D.resultsOverlay.classList.contains('visible')) { hideResults(); return; }
        if (D.historyPanel.classList.contains('open') || D.bankPanel.classList.contains('open') || D.proPanel?.classList.contains('open')) { closeAllPanels(); return; }
        if (D.streakSection.style.display !== 'none') { D.streakSection.style.display = 'none'; return; }
        if (STATE.status !== 'idle') { e.preventDefault(); resetState(); }
      }
    }
  });
}

// ─────────────────────────────────────────────
// 23. INIT
// ─────────────────────────────────────────────
function init() {
  Store.loadAll();

  // Apply theme
  setTheme(STATE.theme);

  // Apply font size
  setFontSize(STATE.fontSizeLevel);

  // Apply mode
  setMode(STATE.mode);

  // Apply category
  setCategory(STATE.category);

  // Apply word count pill
  D.wcPills.forEach(p => p.classList.toggle('active', parseInt(p.dataset.count) === STATE.wordCount));

  // Apply sound
  if (STATE.soundEnabled) {
    D.soundToggle.classList.add('active');
    D.soundIcon.className = 'fa-solid fa-volume-high';
  }
  ProUI.apply();
  ProUI.renderHeatmap();
  TypeRushVault.open();

  // Calibration UI
  Calibration.analyze();
  Calibration.updateEngineUI();

  // Streak topbar
  Streak.updateTopbar();

  // Bank render (lazy — only when panel opens)
  // But update Bank category btn indicator
  if (STATE.selectedBankId) {
    const entry = STATE.textBank.find(e => e.id === STATE.selectedBankId);
    if (entry) STATE.customText = entry.text;
  }

  attach();
  resetState();

  console.log('%cTypeRush v3 initialized', 'color:#7c6aff;font-weight:bold;font-size:14px');
  console.log('Calibration active:', STATE.calibration.active, '| Best WPM:', STATE.bestWPM);
}

document.addEventListener('DOMContentLoaded', init);
