import React, { useState, useEffect, useReducer, useRef, useCallback, useMemo } from "react";

/* ============================================================
   GREAT VOSTAN · v26 · The Learning Economy · BoE prototype
   ============================================================ */

// ─── DESIGN TOKENS (BoE palette + warm parchment twist) ────
const C = {
  // Deep BoE navy backgrounds
  bg: "#0a0f24",
  bg2: "#141a36",
  bgGlow: "#1f2a52",
  // Warm parchment surfaces — Treasury document feel
  surface: "#fff8ee",
  surface2: "#f4ecd8",
  surface3: "#e8dcb8",
  // Borders
  border: "#2a3464",
  borderL: "#3f4d80",
  borderCream: "#c9b178",
  // Ink for text on parchment
  ink: "#0a0c1a",
  text: "#1f2640",
  textMuted: "#5a6488",
  textDim: "#9ba5c4",
  // Text on dark
  textCream: "#fff8ee",
  textCreamDim: "#c8bba2",
  // BoE brand accents — pink for action, gold for highlight
  coral: "#DA1B5C",         // BoE pink (action / urgent)
  gold: "#F5B82E",          // BoE honey gold
  goldBright: "#FFD364",
  teal: "#06B5A0",
  blue: "#3D7BD9",
  purple: "#9C72D4",
  rose: "#E891A2",
  green: "#2A9D5F",
  red: "#E14B3C",
  yellow: "#F5B82E",
  // Sky — dawn over London skyline
  skyTop: "#0a0f24",
  skyMid: "#3a4470",
  skyDawn: "#E891A2",
  skyHorizon: "#F5B82E",
  street: "#384266",
  streetDark: "#1f2640",
  pavement: "#5a6a90",
  grass: "#3d8a5c",
  river: "#3D7BD9",
  // Building palette — restrained, elegant
  bReserve: "#F5B82E", bReserveD: "#a87918",   // gold tower
  bStocks: "#3D7BD9", bStocksD: "#234b7d",     // exchange blue
  bBank: "#06B5A0", bBankD: "#057066",         // bank teal
  bMarket: "#DA1B5C", bMarketD: "#8a1240",     // BoE pink market
  bCoffee: "#7a4030", bCoffeeD: "#4a2418",     // coffee brown
  bCinema: "#9C72D4", bCinemaD: "#5e4080",     // cinema purple
  bFlat: "#E891A2", bFlatD: "#9a5868",         // flat rose
};
const FONT_D = "'Bricolage Grotesque', system-ui, sans-serif";
const FONT_B = "'Sora', system-ui, sans-serif";
const FONT_M = "'JetBrains Mono', ui-monospace, monospace";
const FONT_H = "'Caveat', cursive";
const fmt = (n) => `₺${Math.round(n).toLocaleString("en-GB")}`;
const fmtD = (n) => `₺${n.toLocaleString("en-GB", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const pct = (n) => `${n.toFixed(1)}%`;

/* ════════════════════════════════════════════════════════════
   v26 SYSTEMS · sound · glossary · badges · reflection
   ════════════════════════════════════════════════════════════ */

// ─── SOUND ENGINE — tiny WebAudio synth, zero assets ────────
const SFX = (() => {
  let ctx = null;
  let muted = true;
  try { muted = window.localStorage?.getItem("gv_muted") !== "0"; } catch (e) {}
  const ac = () => {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const tone = (freq, dur, type = "sine", vol = 0.07, slide = 0) => {
    if (muted) return;
    const c = ac(); if (!c) return;
    try {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + dur + 0.02);
    } catch (e) {}
  };
  return {
    isMuted: () => muted,
    setMuted: (m) => { muted = m; try { window.localStorage?.setItem("gv_muted", m ? "1" : "0"); } catch (e) {} },
    click: () => tone(640, 0.05, "triangle", 0.04),
    coin: () => { tone(880, 0.07, "square", 0.035); setTimeout(() => tone(1318, 0.1, "square", 0.035), 60); },
    win: () => { tone(523, 0.12, "triangle", 0.06); setTimeout(() => tone(659, 0.12, "triangle", 0.06), 110); setTimeout(() => tone(784, 0.24, "triangle", 0.07), 220); },
    lose: () => { tone(311, 0.16, "sawtooth", 0.04); setTimeout(() => tone(208, 0.3, "sawtooth", 0.04), 140); },
    badge: () => { tone(659, 0.1, "triangle", 0.06); setTimeout(() => tone(880, 0.1, "triangle", 0.06), 90); setTimeout(() => tone(1047, 0.28, "triangle", 0.07), 180); },
    tick: () => tone(440, 0.035, "square", 0.02),
    alarm: () => tone(760, 0.18, "sawtooth", 0.045, -340),
    stamp: () => tone(170, 0.12, "square", 0.06, -70),
  };
})();

// ─── GLOSSARY — hover any underlined term for a definition ──
const GLOSSARY = {
  "compound interest": "Your money earning money on the money it already earned. Tiny at first. Enormous over decades.",
  "inflation": "Prices rising over time, which quietly shrinks what each Marka buys. Invisible until you look back.",
  "interest rate": "The price of borrowing and the reward for saving. The Reserve's main lever over the whole economy.",
  "APR": "Annual Percentage Rate — the true yearly cost of borrowing, with interest and fees included.",
  "emergency fund": "Money set aside for shocks. Three months of essential costs is the resilience line.",
  "bonds": "Loans to governments or companies. Steadier than stocks, smaller long-run returns.",
  "stocks": "Tiny slices of companies. Bumpy in the short run. Historically the strongest long-run growth.",
  "volatility": "How wildly a price swings. A rougher ride is not always a worse destination.",
  "minimum payment": "The smallest amount a lender will accept each month. It is designed to keep you borrowing for as long as possible.",
  "phishing": "Fake messages posing as a trusted organisation, built to steal your details or your money.",
  "real terms": "What money is worth after inflation is removed. The number that actually matters.",
  "50/30/20": "A budgeting rule of thumb: 50% needs, 30% wants, 20% saving and paying down debt.",
};

function Term({ k, children, light }) {
  const [show, setShow] = useState(false);
  const def = GLOSSARY[k];
  if (!def) return <>{children || k}</>;
  return (
    <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      style={{ position: "relative", borderBottom: `2px dotted ${light ? C.gold : C.coral}`, cursor: "help", whiteSpace: "nowrap" }}>
      {children || k}
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: C.ink, color: C.textCream, padding: "10px 14px", borderRadius: 5, width: 260,
          fontFamily: FONT_B, fontSize: 11.5, lineHeight: 1.5, fontWeight: 500, fontStyle: "normal",
          letterSpacing: "0.01em", textAlign: "left", whiteSpace: "normal", zIndex: 200,
          boxShadow: "0 14px 40px rgba(0,0,0,0.5)", border: `1.5px solid ${C.gold}`, pointerEvents: "none",
        }}>
          <span style={{ display: "block", fontFamily: FONT_M, fontSize: 8.5, color: C.gold, letterSpacing: "0.26em", fontWeight: 800, marginBottom: 4, textTransform: "uppercase" }}>● {k}</span>
          {def}
        </span>
      )}
    </span>
  );
}

// ─── ACHIEVEMENT BADGES ─────────────────────────────────────
const BADGES = {
  scamSpotter:     { icon: "🕵", name: "Scam Spotter",     desc: "Caught 5 or more scams in the Scam Lab",            color: C.coral },
  debtDestroyer:   { icon: "⛓", name: "Debt Destroyer",   desc: "Saw through the Minimum Payment Trap",              color: C.purple },
  bufferBuilder:   { icon: "🛡", name: "Buffer Builder",   desc: "Built a 3-month emergency fund for a neighbour",    color: C.teal },
  compoundConvert: { icon: "📈", name: "Compound Convert", desc: "Aced the Compound Race knowledge check",            color: C.gold },
  needsKnower:     { icon: "🧺", name: "Needs Knower",     desc: "Perfect score sorting needs from wants",            color: C.blue },
  reflector:       { icon: "🪞", name: "Money Mirror",     desc: "Took a lesson home from four different tools",      color: C.rose },
};

// ─── TAKE THIS HOME — one-tap reflection after each tool ────
// Research note: a single "what will you do differently?" prompt
// is the strongest known driver of real-world behaviour change
// from financial literacy games.
function TakeThisHome({ game, options, dispatch, accent = C.teal }) {
  const [picked, setPicked] = useState(null);
  return (
    <div style={{ marginTop: 14, padding: "14px 18px", background: C.surface2, borderRadius: 5, border: `1.5px solid ${C.borderCream}` }}>
      <div style={{ fontFamily: FONT_M, fontSize: 9, color: accent, letterSpacing: "0.26em", fontWeight: 800 }}>🪞 TAKE THIS HOME</div>
      <div style={{ fontFamily: FONT_D, fontSize: 14, color: C.ink, fontWeight: 700, marginTop: 4, marginBottom: 10 }}>With your real money, this month, what would you actually do?</div>
      {picked === null ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {options.map((o, i) => (
            <button key={i} onClick={() => { setPicked(i); SFX.coin(); dispatch({ type: "REFLECT", game, text: o }); }} style={{
              background: "#fff", border: `1.5px solid ${C.borderCream}`, borderRadius: 4, padding: "9px 14px",
              textAlign: "left", cursor: "pointer", fontFamily: FONT_B, fontSize: 12, color: C.text, fontWeight: 600,
              transition: "all 0.15s",
            }} onMouseOver={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = "translateX(4px)"; }}
               onMouseOut={(e) => { e.currentTarget.style.borderColor = C.borderCream; e.currentTarget.style.transform = "translateX(0)"; }}>
              {o}
            </button>
          ))}
        </div>
      ) : (
        <div className="popupIn" style={{ background: `${accent}18`, border: `1.5px solid ${accent}`, borderRadius: 4, padding: "10px 14px", fontFamily: FONT_B, fontSize: 12, color: C.ink, fontWeight: 700 }}>
          ✓ Noted in your journal: <em>"{options[picked]}"</em> <span style={{ fontFamily: FONT_M, fontSize: 9, color: accent, fontWeight: 800, marginLeft: 6 }}>+20 XP</span>
        </div>
      )}
    </div>
  );
}

// ─── KNOWLEDGE CHECK — one sharp question, no punishment ────
function KnowledgeCheck({ question, options, correctIndex, onCorrect, accent = C.gold }) {
  const [answered, setAnswered] = useState(null);
  const gotIt = answered === correctIndex;
  return (
    <div style={{ marginTop: 14, padding: "14px 18px", background: answered === null ? C.surface2 : gotIt ? `${C.teal}14` : `${C.coral}10`, borderRadius: 5, border: `1.5px solid ${answered === null ? C.borderCream : gotIt ? C.teal : C.coral}`, transition: "all 0.3s" }}>
      <div style={{ fontFamily: FONT_M, fontSize: 9, color: accent, letterSpacing: "0.26em", fontWeight: 800 }}>🧠 QUICK CHECK · +40 XP</div>
      <div style={{ fontFamily: FONT_D, fontSize: 15, color: C.ink, fontWeight: 800, marginTop: 4, marginBottom: 10, lineHeight: 1.3 }}>{question}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {options.map((o, i) => {
          const isCorrect = i === correctIndex;
          const isPicked = answered === i;
          return (
            <button key={i} disabled={answered !== null} onClick={() => {
              setAnswered(i);
              if (isCorrect) { SFX.win(); onCorrect && onCorrect(); } else { SFX.lose(); }
            }} style={{
              background: answered === null ? "#fff" : isCorrect ? C.teal : isPicked ? `${C.coral}22` : "#fff",
              color: answered !== null && isCorrect ? "#fff" : C.text,
              border: `1.5px solid ${answered === null ? C.borderCream : isCorrect ? C.teal : isPicked ? C.coral : C.borderCream}`,
              borderRadius: 4, padding: "9px 14px", textAlign: "left",
              cursor: answered === null ? "pointer" : "default",
              fontFamily: FONT_B, fontSize: 12, fontWeight: 600, transition: "all 0.2s",
            }}>
              {answered !== null && isCorrect ? "✓ " : answered !== null && isPicked ? "✗ " : ""}{o}
            </button>
          );
        })}
      </div>
      {answered !== null && (
        <div className="popupIn" style={{ fontFamily: FONT_B, fontSize: 11.5, color: C.textMuted, marginTop: 8, fontStyle: "italic", lineHeight: 1.4 }}>
          {gotIt ? "Exactly. That instinct is the whole lesson." : `The answer is "${options[correctIndex]}" — worth sitting with for a second.`}
        </div>
      )}
    </div>
  );
}

// ─── DID YOU KNOW — real-world grounding between tools ──────
const DID_YOU_KNOW = [
  "Households with a three-month emergency fund are far less likely to fall into long-term debt after a shock.",
  "Most people underestimate compound growth — over 40 years, the growth usually ends up bigger than everything you put in.",
  "Paying only the minimum on a credit card can take well over a decade to clear and double what you repay.",
  "Fraud is now one of the most common crimes in most advanced economies — and anyone, any age, can be caught by it.",
  "Money worries are one of the biggest reported causes of stress and lost sleep — a buffer buys peace, not just safety.",
  "The earlier you start saving, the less of your own money you need — time does the heavy lifting.",
];

function DidYouKnow() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * DID_YOU_KNOW.length));
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % DID_YOU_KNOW.length), 7000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ maxWidth: 820, width: "100%", background: "rgba(4,6,15,0.72)", border: `1px solid ${C.gold}44`, borderRadius: 4, padding: "10px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ fontFamily: FONT_M, fontSize: 8.5, color: C.gold, letterSpacing: "0.26em", fontWeight: 800, whiteSpace: "nowrap" }}>💡 DID YOU KNOW</div>
      <div key={idx} className="popupIn" style={{ fontFamily: FONT_B, fontSize: 12, color: C.textCream, lineHeight: 1.45, fontWeight: 500 }}>{DID_YOU_KNOW[idx]}</div>
    </div>
  );
}



// ─── WORLD LAYOUT (continuous hillside city) ───────────────
const WORLD_W = 4800;
const WORLD_H = 1200;
const STREET_H = 700; // legacy ref kept for some renders
const GROUND_Y = 920; // legacy ref — base of residential

// Ground curve segments — the path climbs the hill
// Walking right takes you up; walking left takes you down.
const GROUND_SEGMENTS = [
  { from: 0,    to: 1400, y: 920 },                    // residential plateau (riverside)
  { from: 1400, to: 1800, y1: 920, y2: 620 },          // first hill — up to commerce
  { from: 1800, to: 3100, y: 620 },                    // commerce plateau
  { from: 3100, to: 3500, y1: 620, y2: 320 },          // second hill — up to financial
  { from: 3500, to: 4800, y: 320 },                    // financial plateau (top)
];

// Smooth ease in/out
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function groundY(x) {
  for (const seg of GROUND_SEGMENTS) {
    if (x >= seg.from && x <= seg.to) {
      if (seg.y !== undefined) return seg.y;
      const t = (x - seg.from) / (seg.to - seg.from);
      return seg.y1 + easeInOut(t) * (seg.y2 - seg.y1);
    }
  }
  return 920;
}

// What "area" name applies at a given x (for HUD)
function areaAt(x) {
  if (x < 1400) return "RIVERSIDE";
  if (x < 1800) return "OLD HILL ROAD";
  if (x < 3100) return "CITY CENTRE";
  if (x < 3500) return "PALACE STEPS";
  return "FINANCIAL DISTRICT";
}

// All buildings placed along the path — each x sits on groundY(x)
const BUILDINGS = [
  // RESIDENTIAL (x: 0 - 1400)
  { id: "park", name: "Riverside Park", x: 400, color: C.teal, dark: C.bBankD, type: "fountain" },
  { id: "flat", name: "Your Flat", x: 850, color: C.bFlat, dark: C.bFlatD, type: "home" },
  { id: "cinema", name: "The Cinema", x: 1200, color: C.bCinema, dark: C.bCinemaD, type: "deco" },
  // COMMERCE (x: 1800 - 3100)
  { id: "market", name: "Amara's Market", x: 1980, color: C.bMarket, dark: C.bMarketD, type: "shop" },
  { id: "plaza", name: "Central Plaza", x: 2400, color: null, dark: null, type: "fountain" },
  { id: "coffee", name: "Desta's Coffee", x: 2800, color: C.bCoffee, dark: C.bCoffeeD, type: "cafe" },
  // FINANCIAL (x: 3500 - 4800)
  { id: "fbank", name: "Savings Bank", x: 3700, color: C.bBank, dark: C.bBankD, type: "classical" },
  { id: "stocks", name: "Stock Exchange", x: 4050, color: C.bStocks, dark: C.bStocksD, type: "glass" },
  { id: "reserve", name: "Bank of Vostan", x: 4500, color: C.bReserve, dark: C.bReserveD, type: "tower" },
];

const PLACES = BUILDINGS;

const NPCS = [
  // Residential
  { id: "jogger", x: 200, color: C.green, label: "Jogger" },
  { id: "halim", x: 1000, color: C.rose, label: "Mr Halim" },
  // Commerce
  { id: "vendor", x: 1900, color: C.purple, label: "Vendor" },
  { id: "yusuf", x: 2150, color: C.coral, label: "Yusuf" },
  { id: "elder", x: 2550, color: C.blue, label: "Older man" },
  { id: "kids", x: 2950, color: C.rose, label: "Students" },
  // Financial
  { id: "trader", x: 3900, color: C.gold, label: "Trader" },
  { id: "protester", x: 4300, color: C.red, label: "Protester" },
];

// ─── QUESTS ─────────────────────────────────────────────────
const QUESTS = {
  // DAY 1 — narrative spine, each quest leads to the next
  q1: { title: "Step outside your flat", desc: "Tomorrow you start at the Bank of Vostan as a key decision-maker on the Monetary Policy Committee. But today, walk among the people. Your neighbour Mr Halim is outside. Press E to talk.", target: "halim_npc", xp: 10, next: "q2" },
  q2: { title: "Go to Amara's Market", desc: "You need groceries. Take the stairs up to the city centre. Then walk to the market with the red awning.", target: "market", xp: 20, next: "q3" },
  q3: { title: "Sort your savings out", desc: "After what you saw at the market, you need to think hard about how much you can actually put aside. Visit the Savings Bank — it's up in the financial district.", target: "fbank", xp: 30, next: "q4" },
  q4: { title: "The trading floor opens at 10", desc: "Stock Exchange — same district, just along the way. Optional but interesting.", target: "stocks", xp: 30, next: "q5" },
  q5: { title: "Head home, it's getting late", desc: "Walk back to your flat. Tomorrow's the big day.", target: "flat", xp: 20, next: "q6" },
  q6: { title: "Sleep on it", desc: "Press the SLEEP button in the flat panel.", target: null, xp: 10, next: "q7" },
  // DAY 2 — work at the Reserve
  q7: { title: "Tuesday morning. Take your seat.", desc: "Your first day on the Monetary Policy Committee. Walk up to the financial district. The gold tower at the far left is the Bank of Vostan.", target: "reserve", xp: 30, next: "q8" },
  q8: { title: "Sit through the briefing & decide", desc: "The committee will share their views. You make the call. Everything you saw yesterday is your evidence.", target: null, xp: 80, next: "q9" },
  q9: { title: "Face the press", desc: "Reporters are waiting outside. You have to say something. Make it count.", target: null, xp: 60, next: "q10" },
  q10: { title: "Walk back and see what you did", desc: "Find Mr Halim, Amara, Yusuf, Desta. Hear how your decision landed in their lives.", target: null, xp: 80, next: null },
};

// ─── STOCK EXCHANGE DATA ────────────────────────────────────
const STOCKS_INIT = [
  { id: "rail", name: "VARENA RAIL", sector: "Infrastructure", price: 84, vol: 0.005, trend: 0, color: C.bBank },
  { id: "tech", name: "KELDRA TECH", sector: "Software", price: 156, vol: 0.022, trend: 0.001, color: C.coral },
  { id: "food", name: "HARBOR FOODS", sector: "Consumer", price: 42, vol: 0.008, trend: 0, color: C.gold },
];

// ─── INITIAL STATE ──────────────────────────────────────────
const initialState = {
  px: 850, target: null, faceDir: -1, moving: false,
  hour: 8, day: 1, dayPhase: "personal",
  sleepAnim: 0, // 0 = none, 1..100 = animation progress // personal | work
  movesToday: 0, gamesPlayed: { bank: false, stocks: false }, npcsMet: 0,
  // Life meters - the emotional spine
  stress: 30, happiness: 60, energy: 80,
  xp: 0, level: 1,
  badges: [], reflections: [],
  activeQuest: "q1",
  completedQuests: [],
  notes: [],
  briefingDone: false,
  decisionDone: false,
  meetingActive: false, meetingPhase: "briefing", meetingStep: 0,
  montageActive: false, montageStep: 0,
  pressActive: false, pressStep: 0, pressStatement: null,
  recoveryActive: false, recoveryChoice: null, recoveryDone: false,
  tradingFloorActive: false, tradingStep: 0,
  walkHomeActive: false, walkHomeStep: 0,
  newsroomActive: false, newsroomStep: 0,
  voiceActive: false, voiceStep: 0,
  impactReviewed: {},
  wallet: 520,
  inflation: 4.2, interestRate: 3.0, pendingRate: 3.0, publicTrust: 38, guidance: "balanced",
  // Full policy toolkit (committed values)
  policy: {
    rate: 3.0,           // bank rate %
    qe: 0,               // -3 (heavy QT) to +3 (heavy QE)
    assetMix: 0.7,       // 0 = pure corp bonds, 1 = pure gov bonds
    innovation: 0,       // -2 (discourage) to +2 (loosen)
    macroPru: 0,         // -2 (loosen) to +2 (tighten)
    liquidity: 1,        // 0 (minimal) to 3 (full activation)
    guidance: "balanced",
  },
  // Pending values shown while player is adjusting in the dashboard
  pendingPolicy: {
    rate: 3.0, qe: 0, assetMix: 0.7, innovation: 0, macroPru: 0, liquidity: 1, guidance: "balanced",
  },
  tradingCash: 500, holdings: {}, stockPrices: { rail: 84, tech: 156, food: 42 }, stockHistory: { rail: [], tech: [], food: [] },
  bankSaved: 0,
  futureYouResult: null, stockGameResult: null,
  phoneOpen: false, phoneTab: "msg",
  yusufReplied: false,
  openPanel: null, mapOpen: false,
  popups: [],
  notifications: [],
  thought: null,
};

// ─── REDUCER ────────────────────────────────────────────────
function reducer(s, a) {
  switch (a.type) {
    case "WALK": {
      const dx = a.dir * 680 * (a.dt || 0.016);
      const nx = Math.max(140, Math.min(WORLD_W - 140, s.px + dx));
      return { ...s, px: nx, faceDir: a.dir, moving: true };
    }
    case "STOP": return { ...s, moving: false, target: null };
    case "WALK_TO": return { ...s, target: a.x };
    case "STEP_TO": {
      if (s.target === null) return s;
      const dx = s.target - s.px;
      const maxStep = 680 * (a.dt || 0.016);
      // Snap to target if we'd reach (or pass) it this frame — no overshoot
      if (Math.abs(dx) <= maxStep + 2) return { ...s, px: s.target, target: null, moving: false };
      const dir = dx > 0 ? 1 : -1;
      return { ...s, px: s.px + dir * maxStep, faceDir: dir, moving: true };
    }
    case "CHANGE_TIER": return s; // deprecated
    case "SLEEP_ANIM_TICK": return { ...s, sleepAnim: a.progress };
    case "TICK_METERS": {
      const dStress = a.stress || 0, dHappy = a.happy || 0, dEnergy = a.energy || 0;
      return {
        ...s,
        stress: Math.max(0, Math.min(100, s.stress + dStress)),
        happiness: Math.max(0, Math.min(100, s.happiness + dHappy)),
        energy: Math.max(0, Math.min(100, s.energy + dEnergy)),
      };
    }
    case "PUSH_NOTIF": {
      return { ...s, notifications: [{ id: Date.now() + Math.random(), ...a.notif, time: Date.now() }, ...(s.notifications || [])].slice(0, 5) };
    }
    case "DISMISS_NOTIF": return { ...s, notifications: (s.notifications || []).filter((n) => n.id !== a.id) };
    case "OPEN_PANEL": {
      let next = { ...s, openPanel: a.id, mapOpen: false };
      if (a.id === "reserve") {
        if (s.dayPhase !== "work") { next.openPanel = "reserve-locked"; return next; }
        if (!s.briefingDone) { next.meetingActive = true; next.meetingPhase = "briefing"; next.meetingStep = 0; }
      }
      // Auto-advance quest if target matches the place
      const cur = QUESTS[s.activeQuest];
      if (cur?.target === a.id && cur.next) {
        next.completedQuests = [...next.completedQuests, s.activeQuest];
        next.activeQuest = cur.next;
        next.xp = next.xp + (cur.xp || 0);
      }
      return next;
    }
    case "TOGGLE_MAP": return { ...s, mapOpen: !s.mapOpen };
    case "FAST_TRAVEL": return { ...s, px: a.x, target: null, moving: false, mapOpen: false };
    case "ADVANCE_QUEST": {
      // Mark current as complete, advance to next
      const cur = QUESTS[s.activeQuest];
      if (!cur || !cur.next) return s;
      const next = { ...s, completedQuests: [...s.completedQuests, s.activeQuest], activeQuest: cur.next, xp: s.xp + (cur.xp || 0) };
      return addPopup(next, { type: "quest", text: `✓ ${cur.title}`, sub: QUESTS[cur.next].title });
    }
    case "START_SLEEP": return { ...s, sleepAnim: 1, openPanel: null };
    case "SLEEP_TO_DAY_2": {
      let next = { ...s, day: 2, hour: 7, dayPhase: "work", openPanel: null, activeQuest: "q7", completedQuests: [...s.completedQuests, "q6"], xp: s.xp + 50, px: 850, sleepAnim: 0 };
      return addPopup(next, { type: "level", text: "Tuesday morning", sub: "First day at the Reserve" });
    }
    case "LOG_MOVE": {
      let next = { ...s, movesToday: s.movesToday + 1 };
      if (a.kind === "bank") next.gamesPlayed = { ...next.gamesPlayed, bank: true };
      if (a.kind === "stocks") next.gamesPlayed = { ...next.gamesPlayed, stocks: true };
      if (a.kind === "npc") next.npcsMet = s.npcsMet + 1;
      return next;
    }
    case "SAVE_FUTURE_RESULT": return { ...s, futureYouResult: a.result };
    case "SAVE_STOCK_RESULT": return { ...s, stockGameResult: a.result };
    case "CLOSE_PANEL": return { ...s, openPanel: null, meetingActive: false };
    case "MEETING_NEXT": return { ...s, meetingStep: s.meetingStep + 1 };
    case "MEETING_PHASE": return { ...s, meetingPhase: a.phase, meetingStep: 0, completedMeetingPhases: [...(s.completedMeetingPhases || []), s.meetingPhase].filter((v,i,arr)=>arr.indexOf(v)===i) };
    case "BRIEFING_END": {
      const next = { ...s, meetingActive: false, briefingDone: true, openPanel: null, activeQuest: "q8", completedQuests: [...s.completedQuests, "q7"], xp: s.xp + 60 };
      return addPopup(next, { type: "quest", text: "✓ Briefing complete", sub: "Time to set the rate" });
    }
    case "DECISION_END": {
      // Reserve → Trading Floor → Press → Newsroom → Voice → Walk Home → Montage
      const next = { ...s, meetingActive: false, decisionDone: true, briefingDone: true, openPanel: null, tradingFloorActive: true, tradingStep: 0, activeQuest: "q9", completedQuests: [...s.completedQuests, "q8"], xp: s.xp + 80 };
      return next;
    }
    case "TRADING_NEXT": return { ...s, tradingStep: s.tradingStep + 1 };
    case "TRADING_END": return { ...s, tradingFloorActive: false, pressActive: true, pressStep: 0 };
    case "PRESS_CHOOSE": return { ...s, pressStatement: a.choice };
    case "PRESS_NEXT": return { ...s, pressStep: s.pressStep + 1 };
    case "PRESS_END": {
      // If rate decision was BAD, force a recovery phase
      const isBad = s.policy?.rateGood === false;
      if (isBad && !s.recoveryDone) {
        return { ...s, pressActive: false, recoveryActive: true };
      }
      return { ...s, pressActive: false, newsroomActive: true, newsroomStep: 0 };
    }
    case "RECOVERY_CHOOSE": return { ...s, recoveryChoice: a.choice, recoveryDone: true };
    case "RECOVERY_END": return { ...s, recoveryActive: false, newsroomActive: true, newsroomStep: 0 };
    case "NEWSROOM_NEXT": return { ...s, newsroomStep: s.newsroomStep + 1 };
    case "NEWSROOM_END": return { ...s, newsroomActive: false, voiceActive: true, voiceStep: 0 };
    case "VOICE_NEXT": return { ...s, voiceStep: s.voiceStep + 1 };
    case "VOICE_END": return { ...s, voiceActive: false, walkHomeActive: true, walkHomeStep: 0 };
    case "WALKHOME_NEXT": return { ...s, walkHomeStep: s.walkHomeStep + 1 };
    case "WALKHOME_END": return { ...s, walkHomeActive: false, montageActive: true, montageStep: 0 };
    case "MONTAGE_NEXT": return { ...s, montageStep: s.montageStep + 1 };
    case "MONTAGE_END": {
      // After montage, advance to impact review quest
      return addPopup({ ...s, montageActive: false, activeQuest: "q10", completedQuests: [...s.completedQuests, "q9"], xp: s.xp + 60 }, { type: "quest", text: "✓ Press done", sub: "Now walk back and see the damage" });
    }
    case "ADD_NOTE": {
      if (s.notes.some((n) => n.from === a.note.from)) return s;
      let next = { ...s, notes: [...s.notes, a.note] };
      next = addPopup(next, { type: "note", text: "📓 Note saved", sub: `${next.notes.length} of 3 gathered` });
      if (next.notes.length >= 3 && s.activeQuest === "q3") {
        next.completedQuests = [...next.completedQuests, "q3"];
        next.activeQuest = "q4";
        next.xp += 80;
        next = addPopup(next, { type: "level", text: "Perspectives gathered", sub: "Head back to the Reserve" });
      }
      return next;
    }
    case "REPLY_YUSUF": {
      const next = { ...s, yusufReplied: true };
      return addPopup(next, { type: "msg", text: "Sent to Yusuf", sub: "" });
    }
    case "SET_RATE": return { ...s, pendingRate: a.rate };
    case "COMMIT_RATE": return { ...s, interestRate: s.pendingRate };
    case "SET_GUIDANCE": return { ...s, guidance: a.guidance, pendingPolicy: { ...s.pendingPolicy, guidance: a.guidance } };
    case "SET_POLICY": return { ...s, pendingPolicy: { ...s.pendingPolicy, [a.tool]: a.value } };
    case "COMMIT_POLICY": return { ...s, policy: { ...s.pendingPolicy }, interestRate: s.pendingPolicy.rate, guidance: s.pendingPolicy.guidance };
    case "TOGGLE_PHONE": return { ...s, phoneOpen: !s.phoneOpen };
    case "SET_PHONE_TAB": return { ...s, phoneTab: a.tab };
    case "STOCK_TICK": {
      const newPrices = { ...s.stockPrices };
      const newHist = { ...s.stockHistory };
      for (const stock of STOCKS_INIT) {
        const cur = newPrices[stock.id];
        const noise = (Math.random() - 0.5) * 2 * stock.vol;
        const trend = stock.trend;
        const next = cur * (1 + noise + trend);
        newPrices[stock.id] = Math.max(5, next);
        newHist[stock.id] = [...(newHist[stock.id] || []), next].slice(-30);
      }
      return { ...s, stockPrices: newPrices, stockHistory: newHist };
    }
    case "BUY_STOCK": {
      const price = s.stockPrices[a.id];
      const cost = price * a.qty;
      if (cost > s.tradingCash) return s;
      const h = s.holdings[a.id] || { qty: 0, avg: 0 };
      const newQty = h.qty + a.qty;
      const newAvg = (h.avg * h.qty + cost) / newQty;
      return { ...s, tradingCash: s.tradingCash - cost, holdings: { ...s.holdings, [a.id]: { qty: newQty, avg: newAvg } } };
    }
    case "SELL_STOCK": {
      const h = s.holdings[a.id];
      if (!h || h.qty < a.qty) return s;
      const price = s.stockPrices[a.id];
      const revenue = price * a.qty;
      const newQty = h.qty - a.qty;
      const newH = newQty > 0 ? { qty: newQty, avg: h.avg } : null;
      const next = { ...s, tradingCash: s.tradingCash + revenue, holdings: { ...s.holdings, [a.id]: newH } };
      if (!newH) delete next.holdings[a.id];
      return next;
    }
    case "BANK_DEPOSIT": {
      const amt = Math.min(a.amount, s.wallet);
      let next = { ...s, wallet: s.wallet - amt, bankSaved: s.bankSaved + amt };
      // Saving reduces stress a bit (peace of mind), small energy hit
      next.stress = Math.max(0, next.stress - 6);
      next.happiness = Math.min(100, next.happiness + 3);
      return next;
    }
    case "TALK_NPC": {
      const note = a.note;
      let next = { ...s };
      if (!s.notes.some((n) => n.from === note.from)) {
        next = { ...next, notes: [...s.notes, note], npcsMet: s.npcsMet + 1, movesToday: s.movesToday + 1 };
      }
      next.happiness = Math.min(100, next.happiness + 4);
      next.stress = Math.max(0, next.stress - 2);
      next = addPopup(next, { type: "note", text: "📓 Note saved", sub: `${next.notes.length} perspectives` });
      // Auto-advance quest if target matches
      const cur = QUESTS[s.activeQuest];
      if (cur?.target === `${a.npcId}_npc`) {
        next.completedQuests = [...next.completedQuests, s.activeQuest];
        next.activeQuest = cur.next;
        next.xp = next.xp + (cur.xp || 0);
      }
      // Impact phase: track NPCs reviewed
      if (a.isImpact && a.npcId) {
        next.impactReviewed = { ...next.impactReviewed, [a.npcId]: true };
        const reviewedCount = Object.keys(next.impactReviewed).length;
        // After 3 impact reviews, finish q10
        if (reviewedCount >= 3 && s.activeQuest === "q10") {
          next.completedQuests = [...next.completedQuests, "q10"];
          next.activeQuest = "q10_done";
          next.xp = next.xp + 80;
          next = addPopup(next, { type: "level", text: "✓ Demo complete", sub: "You walked an economy in someone's shoes" });
        }
      }
      return next;
    }
    case "THOUGHT": return { ...s, thought: a.text };
    case "DISMISS_THOUGHT": return { ...s, thought: null };
    case "DISMISS_POPUP": return { ...s, popups: s.popups.filter((p) => p.id !== a.id) };
    case "AWARD_BADGE": {
      if ((s.badges || []).includes(a.id)) return s;
      const b = BADGES[a.id]; if (!b) return s;
      SFX.badge();
      const next = { ...s, badges: [...(s.badges || []), a.id], xp: s.xp + 40 };
      return addPopup(next, { type: "badge", text: `${b.icon} Badge earned · ${b.name}`, sub: b.desc });
    }
    case "REFLECT": {
      let next = { ...s, reflections: [...(s.reflections || []), { game: a.game, text: a.text }], xp: s.xp + 20 };
      next = addPopup(next, { type: "note", text: "🪞 Taken home", sub: a.text });
      const distinctGames = new Set(next.reflections.map((r) => r.game));
      if (distinctGames.size >= 4 && !(next.badges || []).includes("reflector")) {
        SFX.badge();
        next = { ...next, badges: [...(next.badges || []), "reflector"], xp: next.xp + 40 };
        next = addPopup(next, { type: "badge", text: `🪞 Badge earned · ${BADGES.reflector.name}`, sub: BADGES.reflector.desc });
      }
      return next;
    }
    case "LOAD_STATE": return { ...initialState, ...a.saved, popups: [], notifications: [], target: null, moving: false };
    case "RESET": {
      try { window.localStorage?.removeItem("gv_save_v26"); } catch (e) {}
      return initialState;
    }
    default: return s;
  }
}
function addPopup(s, p) {
  return { ...s, popups: [...s.popups, { ...p, id: Date.now() + Math.random() }] };
}

// ─── HELPERS ────────────────────────────────────────────────
function nearestPlace(px) {
  let best = null, bestD = Infinity;
  for (const p of BUILDINGS) {
    const d = Math.abs(p.x - px);
    if (d < bestD) { bestD = d; best = p; }
  }
  return { place: best, dist: bestD };
}
function nearestNpc(px) {
  let best = null, bestD = Infinity;
  for (const n of NPCS) {
    const d = Math.abs(n.x - px);
    if (d < bestD) { bestD = d; best = n; }
  }
  return { npc: best, dist: bestD };
}
function nearestStair() { return null; } // deprecated

// ─── PLAYER ─────────────────────────────────────────────────
function Player({ x, y, faceDir, moving }) {
  const [t, setT] = useState(0);
  // Spawn pop-in: starts at 0 and animates to 1 over ~0.7s on mount
  const [spawnT, setSpawnT] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      setT(now / 1000);
      // ease-out elastic ish for spawn (0 → 1 over 700ms)
      const elapsed = (now - start) / 1000;
      if (elapsed < 0.75) {
        // overshoot then settle: 0 → 1.4 → 0.85 → 1.08 → 1
        const p = elapsed / 0.75;
        let s;
        if (p < 0.35) s = (p / 0.35) * 1.4;
        else if (p < 0.55) s = 1.4 - ((p - 0.35) / 0.2) * 0.55;
        else if (p < 0.75) s = 0.85 + ((p - 0.55) / 0.2) * 0.23;
        else s = 1;
        setSpawnT(s);
      } else {
        setSpawnT(1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const bob = moving ? Math.sin(t * 12) * 1.8 : Math.sin(t * 2) * 0.6;
  const legL = moving ? Math.sin(t * 12) * 5 : 0;
  const legR = moving ? -Math.sin(t * 12) * 5 : 0;
  const armL = moving ? -Math.sin(t * 12) * 4 : Math.sin(t * 2) * 0.4;
  const armR = moving ? Math.sin(t * 12) * 4 : -Math.sin(t * 2) * 0.4;
  // Spawn opacity
  const spawnOpacity = Math.min(1, spawnT * 1.4);

  return (
    <g transform={`translate(${x},${y + bob}) scale(${1.8 * faceDir * spawnT}, ${1.8 * spawnT})`} opacity={spawnOpacity}>
      {/* SPAWN DUST PUFFS — only visible during the spawn animation */}
      {spawnT < 0.95 && (
        <g opacity={Math.max(0, 1 - spawnT) * 0.7}>
          <circle cx="-9" cy="22" r={3 + (1 - spawnT) * 6} fill="#fff8ee" opacity={Math.max(0, 0.6 - spawnT * 0.6)} />
          <circle cx="9" cy="22" r={3 + (1 - spawnT) * 6} fill="#fff8ee" opacity={Math.max(0, 0.6 - spawnT * 0.6)} />
          <circle cx="0" cy="24" r={4 + (1 - spawnT) * 8} fill={C.gold} opacity={Math.max(0, 0.5 - spawnT * 0.5)} />
          <circle cx="-5" cy="20" r={2} fill={C.coral} opacity={Math.max(0, 0.6 - spawnT * 0.6)} />
          <circle cx="6" cy="20" r={2} fill={C.coral} opacity={Math.max(0, 0.6 - spawnT * 0.6)} />
        </g>
      )}
      {/* Soft drop shadow */}
      <ellipse cx="0" cy="22" rx="14" ry="3.5" fill="#000" opacity="0.28" />
      {/* Back leg */}
      <g transform={`translate(0,${legR * 0.3})`}>
        <rect x="-3.5" y="8" width="4" height="12" fill="#2a3766" rx="1" />
        <rect x="-3.5" y="19" width="5" height="3" fill="#1a0c0a" rx="0.5" />
      </g>
      {/* Front leg */}
      <g transform={`translate(0,${legL * 0.3})`}>
        <rect x="-0.5" y="8" width="4" height="12" fill="#1a2454" rx="1" />
        <rect x="-0.5" y="19" width="5" height="3" fill="#0a0408" rx="0.5" />
      </g>
      {/* Torso — navy fitted blazer */}
      <path d="M -9 -3 Q -10 -8 -6 -10 L 6 -10 Q 10 -8 9 -3 L 11 10 Q 5 12 0 12 Q -5 12 -11 10 Z" fill="#1a2454" />
      {/* Lapel detail */}
      <path d="M -4 -9 L -7 -3 L -4 4 L -2 4 L -2 -8 Z" fill="#0a0f24" opacity="0.7" />
      <path d="M 4 -9 L 7 -3 L 4 4 L 2 4 L 2 -8 Z" fill="#0a0f24" opacity="0.7" />
      {/* Shirt under collar */}
      <path d="M -2 -8 L 0 -6 L 2 -8 L 2 4 L -2 4 Z" fill="#fff8ee" />
      {/* Coral tie */}
      <path d="M -1.2 -5 L 1.2 -5 L 1.5 -2 L -1.5 -2 Z" fill={C.coral} />
      <path d="M -1.5 -2 L 1.5 -2 L 1 8 L -1 8 Z" fill={C.coral} />
      {/* Coral pocket square */}
      <rect x="-8" y="-4" width="2" height="2" fill={C.coral} />
      {/* Back arm — navy */}
      <g transform={`translate(${armR * 0.3},0)`}>
        <rect x="-12" y="-3" width="3" height="10" fill="#0a0f24" rx="1.2" />
        <circle cx="-10.5" cy="8" r="2" fill="#d4a585" />
      </g>
      {/* Front arm — navy */}
      <g transform={`translate(${armL * 0.3},0)`}>
        <rect x="9" y="-3" width="3" height="10" fill="#1a2454" rx="1.2" />
        <circle cx="10.5" cy="8" r="2" fill="#d4a585" />
      </g>
      {/* Neck */}
      <rect x="-2" y="-9" width="4" height="3" fill="#d4a585" />
      {/* Head */}
      <ellipse cx="0" cy="-16" rx="8" ry="9" fill="#d4a585" />
      {/* Hair — neat dark side-part */}
      <path d="M -8 -19 Q -8 -25 -2 -25 L 5 -25 Q 8 -24 8 -20 L 8 -16 Q 6 -19 3 -19 L -7 -19 Z" fill="#1a0c08" />
      <path d="M 1 -23 Q 4 -22 6 -19" stroke="#3a2418" strokeWidth="0.5" fill="none" />
      {/* Subtle ear */}
      <circle cx="-7" cy="-15" r="1.4" fill="#b0805a" />
      {/* Brow */}
      <rect x="-4" y="-17" width="2.5" height="0.8" fill="#1a0c08" rx="0.4" />
      <rect x="1.5" y="-17" width="2.5" height="0.8" fill="#1a0c08" rx="0.4" />
      {/* Eyes (looking slightly forward) */}
      <ellipse cx="-2.5" cy="-15" rx="0.9" ry="1.1" fill="#1a0c08" />
      <ellipse cx="2.5" cy="-15" rx="0.9" ry="1.1" fill="#1a0c08" />
      {/* Eye highlights */}
      <circle cx="-2.2" cy="-15.3" r="0.3" fill="#fff8ee" />
      <circle cx="2.8" cy="-15.3" r="0.3" fill="#fff8ee" />
      {/* Mouth — slight subtle line */}
      <path d="M -1.5 -11.5 Q 0 -10.8 1.5 -11.5" stroke="#5a2418" strokeWidth="0.5" fill="none" strokeLinecap="round" />
      {/* Bank of Vostan lanyard with gold badge */}
      <line x1="-2" y1="-7" x2="0" y2="-2" stroke="#1a0c08" strokeWidth="0.5" />
      <rect x="-1" y="-2" width="2" height="2.5" fill={C.gold} stroke="#1a0c08" strokeWidth="0.3" />
    </g>
  );
}

// ─── BUILDING FACADE ────────────────────────────────────────
function Place({ p, isActive, isQuest, locked }) {
  if (p.type === "fountain") return <Plaza p={p} />;
  const w = 220, h = 280;
  const x = p.x - w / 2;
  const y = GROUND_Y - h;
  return (
    <g>
      {/* Shadow */}
      <ellipse cx={p.x + 6} cy={GROUND_Y + 6} rx={w / 2} ry="12" fill="#000" opacity="0.18" />
      {/* Base body */}
      <rect x={x} y={y + 30} width={w} height={h - 30} fill={p.color} stroke={p.dark} strokeWidth="2" />
      {/* Trim */}
      <rect x={x} y={y + 30} width={w} height="4" fill={p.dark} opacity="0.6" />
      {/* Pediment / roof - varies by type */}
      {p.type === "tower" && (
        <>
          {/* Glowing aura behind the gold tower */}
          <circle cx={x + w/2} cy={y + h/2} r={w * 1.2} fill={C.gold} opacity="0.08" />
          <circle cx={x + w/2} cy={y + 30} r={w * 0.6} fill={C.goldBright} opacity="0.18" />
          <rect x={x - 6} y={y + 16} width={w + 12} height="14" fill={p.dark} />
          <rect x={x - 8} y={y + 8} width={w + 16} height="8" fill={C.gold} />
          {/* Spire (taller) with flag */}
          <rect x={x + 100} y={y - 60} width="20" height="68" fill={p.dark} />
          <polygon points={`${x+110},${y-78} ${x+110},${y-60} ${x+138},${y-60} ${x+128},${y-69}`} fill={C.coral} />
          <circle cx={x + 110} cy={y - 78} r="3" fill={C.gold} />
          {/* Glass facade */}
          <rect x={x + 14} y={y + 44} width={w - 28} height={h - 90} fill={C.bReserveD} opacity="0.3" />
          {/* Floor lines */}
          {[60, 90, 120, 150, 180, 210, 240].map((dy) => (
            <line key={dy} x1={x + 14} y1={y + dy} x2={x + w - 14} y2={y + dy} stroke={p.dark} strokeWidth="1.5" opacity="0.6" />
          ))}
          {/* Vertical mullions */}
          {[1, 2, 3, 4].map((i) => (
            <line key={i} x1={x + 14 + (w - 28) / 5 * i} y1={y + 44} x2={x + 14 + (w - 28) / 5 * i} y2={y + h - 46} stroke={p.dark} strokeWidth="1.2" opacity="0.5" />
          ))}
          {/* Sign */}
          <rect x={x + w / 2 - 50} y={y + h - 40} width="100" height="20" fill={C.gold} />
          <text x={x + w / 2} y={y + h - 26} textAnchor="middle" fill={C.ink} fontFamily={FONT_M} fontSize="10" fontWeight="700" letterSpacing="0.2em">RESERVE</text>
        </>
      )}
      {p.type === "glass" && (
        <>
          {/* Modern flat roof */}
          <rect x={x - 4} y={y + 20} width={w + 8} height="14" fill={p.dark} />
          {/* Bold ticker band */}
          <rect x={x} y={y + 36} width={w} height="22" fill={C.ink} />
          <text x={x + w / 2} y={y + 52} textAnchor="middle" fill={C.green} fontFamily={FONT_M} fontSize="11" fontWeight="700" letterSpacing="0.1em">▲ ELR +1.42%</text>
          {/* Glass facade with grid */}
          <rect x={x + 12} y={y + 64} width={w - 24} height={h - 110} fill="#cfe2f7" stroke={p.dark} strokeWidth="1.5" />
          {[0, 1, 2, 3, 4].map((row) => [0, 1, 2, 3].map((col) => (
            <rect key={`${row}-${col}`} x={x + 18 + col * ((w - 36) / 4)} y={y + 72 + row * ((h - 130) / 5)} width={(w - 36) / 4 - 4} height={(h - 130) / 5 - 4} fill="none" stroke={p.dark} strokeWidth="0.8" opacity="0.4" />
          )))}
          {/* Sign */}
          <rect x={x + w / 2 - 60} y={y + h - 36} width="120" height="20" fill="#fff" stroke={p.dark} strokeWidth="1" />
          <text x={x + w / 2} y={y + h - 22} textAnchor="middle" fill={p.dark} fontFamily={FONT_M} fontSize="9" fontWeight="700" letterSpacing="0.18em">STOCK EXCHANGE</text>
        </>
      )}
      {p.type === "classical" && (
        <>
          {/* Pediment */}
          <polygon points={`${x - 6},${y + 36} ${p.x},${y - 2} ${x + w + 6},${y + 36}`} fill={p.dark} stroke={p.dark} strokeWidth="2" />
          {/* Columns */}
          {[0.15, 0.35, 0.55, 0.75].map((f, i) => (
            <g key={i}>
              <rect x={x + w * f - 8} y={y + 50} width="16" height={h - 80} fill="#fff" stroke={p.dark} strokeWidth="1" />
              <rect x={x + w * f - 11} y={y + 44} width="22" height="8" fill="#fff" stroke={p.dark} strokeWidth="1" />
              <rect x={x + w * f - 11} y={y + h - 38} width="22" height="8" fill="#fff" stroke={p.dark} strokeWidth="1" />
            </g>
          ))}
          {/* Pediment text */}
          <text x={p.x} y={y + 18} textAnchor="middle" fill="#fff" fontFamily={FONT_D} fontSize="14" fontStyle="italic" fontWeight="600">Bank</text>
          {/* Coin emblem */}
          <circle cx={p.x} cy={y + h - 60} r="18" fill={C.gold} stroke={p.dark} strokeWidth="2" />
          <text x={p.x} y={y + h - 54} textAnchor="middle" fill={p.dark} fontFamily={FONT_D} fontSize="18" fontWeight="700">₺</text>
        </>
      )}
      {p.type === "shop" && (
        <>
          {/* Pitched roof */}
          <polygon points={`${x - 8},${y + 36} ${p.x},${y - 6} ${x + w + 8},${y + 36}`} fill={p.dark} stroke={p.dark} strokeWidth="2" />
          {/* Chimney */}
          <rect x={x + 40} y={y - 2} width="16" height="22" fill={p.dark} />
          {/* Striped awning */}
          <path d={`M ${x - 4} ${y + 36} L ${x + w + 4} ${y + 36} L ${x + w - 8} ${y + 52} L ${x + 8} ${y + 52} Z`} fill={C.coral} stroke={p.dark} strokeWidth="1.5" />
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <rect key={f} x={x + w * f - 12} y={y + 36} width="24" height="16" fill="#fff" opacity="0.35" />
          ))}
          {/* Windows */}
          <rect x={x + 22} y={y + 70} width="56" height="62" fill="#fff" stroke={p.dark} strokeWidth="1.5" />
          <line x1={x + 50} y1={y + 70} x2={x + 50} y2={y + 132} stroke={p.dark} strokeWidth="1" />
          <line x1={x + 22} y1={y + 100} x2={x + 78} y2={y + 100} stroke={p.dark} strokeWidth="1" />
          <rect x={x + w - 78} y={y + 70} width="56" height="62" fill="#fff" stroke={p.dark} strokeWidth="1.5" />
          {/* Produce baskets at front */}
          <rect x={x + 12} y={y + 230} width="36" height="30" fill={p.dark} />
          {[20, 30, 40].map((cx, i) => <circle key={i} cx={x + 14 + cx} cy={y + 230} r="6" fill={[C.coral, C.gold, C.green][i]} />)}
          <rect x={x + 172} y={y + 230} width="36" height="30" fill={p.dark} />
          {[20, 30, 40].map((cx, i) => <circle key={i} cx={x + 174 + cx} cy={y + 230} r="6" fill={[C.gold, C.coral, C.purple][i]} />)}
          {/* Door */}
          <rect x={x + w / 2 - 22} y={y + 160} width="44" height="100" fill={p.dark} />
          <rect x={x + w / 2 - 18} y={y + 164} width="36" height="96" fill={C.gold} opacity="0.4" />
          {/* Sign */}
          <rect x={x + w / 2 - 50} y={y + 140} width="100" height="16" fill="#fff" stroke={p.dark} strokeWidth="1" />
          <text x={x + w / 2} y={y + 152} textAnchor="middle" fill={p.dark} fontFamily={FONT_D} fontSize="11" fontStyle="italic" fontWeight="600">AMARA'S</text>
        </>
      )}
      {p.type === "cafe" && (
        <>
          {/* Roof */}
          <polygon points={`${x - 6},${y + 36} ${p.x},${y - 4} ${x + w + 6},${y + 36}`} fill={p.dark} stroke={p.dark} strokeWidth="2" />
          {/* Chimney with smoke */}
          <rect x={x + w - 50} y={y - 6} width="16" height="22" fill={p.dark} />
          <g>
            <circle cx={x + w - 42} cy={y - 10} r="6" fill="#bbb" opacity="0.4">
              <animateTransform attributeName="transform" type="translate" values="0,0; -12,-30; -28,-60" dur="6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.25;0" dur="6s" repeatCount="indefinite" />
            </circle>
          </g>
          {/* Big front window */}
          <rect x={x + 20} y={y + 60} width={w - 40} height="100" fill="#f4a060" stroke={p.dark} strokeWidth="1.5" opacity="0.7" />
          <line x1={p.x} y1={y + 60} x2={p.x} y2={y + 160} stroke={p.dark} strokeWidth="1.5" />
          <line x1={x + 20} y1={y + 100} x2={x + w - 20} y2={y + 100} stroke={p.dark} strokeWidth="1" />
          {/* Striped awning */}
          <path d={`M ${x - 4} ${y + 56} L ${x + w + 4} ${y + 56} L ${x + w - 8} ${y + 70} L ${x + 8} ${y + 70} Z`} fill={C.coral} />
          {/* Door */}
          <rect x={x + w / 2 - 22} y={y + 170} width="44" height="90" fill={p.dark} />
          <rect x={x + w / 2 - 18} y={y + 174} width="36" height="86" fill={C.gold} opacity="0.5" />
          {/* Sign */}
          <text x={p.x} y={y + h - 8} textAnchor="middle" fill={C.gold} fontFamily={FONT_D} fontSize="16" fontStyle="italic" fontWeight="600">Desta's</text>
        </>
      )}
      {p.type === "deco" && (
        <>
          {/* Art deco crown */}
          <rect x={x - 6} y={y + 14} width={w + 12} height="20" fill={p.dark} />
          <rect x={x - 4} y={y + 6} width={w + 8} height="10" fill={p.color} />
          <rect x={x - 2} y={y - 4} width={w + 4} height="12" fill={p.dark} />
          {/* Marquee lights */}
          {[0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.94].map((f, i) => (
            <circle key={i} cx={x + w * f} cy={y + 24} r="3" fill={C.goldBright}>
              <animate attributeName="opacity" values="1;0.3;1" dur={`${1.2 + i * 0.15}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* Marquee panel */}
          <rect x={x + 16} y={y + 52} width={w - 32} height="60" fill="#1a0a08" stroke={p.dark} strokeWidth="1.5" />
          <text x={p.x} y={y + 74} textAnchor="middle" fill={C.goldBright} fontFamily={FONT_D} fontSize="10" letterSpacing="0.2em" fontWeight="600">NOW SHOWING</text>
          <text x={p.x} y={y + 96} textAnchor="middle" fill={C.gold} fontFamily={FONT_D} fontSize="14" fontStyle="italic">"The Keldra Letters"</text>
          {/* Entrance */}
          <rect x={x + w / 2 - 36} y={y + 130} width="72" height="130" fill={p.dark} />
          <rect x={x + w / 2 - 32} y={y + 134} width="64" height="126" fill="#3a1018" />
          <text x={p.x} y={y + h - 8} textAnchor="middle" fill={C.gold} fontFamily={FONT_D} fontSize="16" fontStyle="italic" fontWeight="600">CINEMA</text>
        </>
      )}
      {p.type === "home" && (
        <>
          {/* Pitched roof */}
          <polygon points={`${x - 6},${y + 36} ${p.x},${y - 6} ${x + w + 6},${y + 36}`} fill={p.dark} stroke={p.dark} strokeWidth="2" />
          {/* Dormer */}
          <rect x={p.x - 14} y={y + 6} width="28" height="28" fill="#fff" stroke={p.dark} strokeWidth="1.5" />
          <rect x={p.x - 14} y={y + 6} width="28" height="4" fill={p.dark} />
          {/* Windows */}
          <rect x={x + 22} y={y + 70} width="40" height="50" fill="#fff" stroke={p.dark} strokeWidth="1.5" />
          <line x1={x + 42} y1={y + 70} x2={x + 42} y2={y + 120} stroke={p.dark} strokeWidth="1" />
          <line x1={x + 22} y1={y + 95} x2={x + 62} y2={y + 95} stroke={p.dark} strokeWidth="1" />
          <rect x={x + w - 62} y={y + 70} width="40" height="50" fill="#fff" stroke={p.dark} strokeWidth="1.5" />
          {/* Flower box */}
          <rect x={x + 22} y={y + 124} width="40" height="8" fill={C.bMarketD} />
          <circle cx={x + 30} cy={y + 122} r="3" fill={C.coral} />
          <circle cx={x + 40} cy={y + 124} r="3" fill={C.rose} />
          <circle cx={x + 52} cy={y + 122} r="3" fill={C.gold} />
          {/* Door */}
          <rect x={x + w / 2 - 22} y={y + 160} width="44" height="100" fill={p.dark} />
          <rect x={x + w / 2 - 18} y={y + 164} width="36" height="96" fill="#a85e48" />
          <circle cx={x + w / 2 + 10} cy={y + 210} r="2" fill={C.gold} />
        </>
      )}

      {/* Quest arrow */}
      {isQuest && (
        <g>
          {/* Halo ring */}
          <circle cx={p.x} cy={y - 38} r="36" fill={C.coral} opacity="0.18">
            <animate attributeName="r" values="30;46;30" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.12;0.3;0.12" dur="1.6s" repeatCount="indefinite" />
          </circle>
          {/* Big arrow */}
          <polygon points={`${p.x - 22},${y - 56} ${p.x + 22},${y - 56} ${p.x},${y - 22}`} fill={C.coral} stroke={C.gold} strokeWidth="2">
            <animateTransform attributeName="transform" type="translate" values="0,-4;0,4;0,-4" dur="1.2s" repeatCount="indefinite" />
          </polygon>
          {/* GO HERE label */}
          <rect x={p.x - 36} y={y - 78} width="72" height="18" rx="2" fill={C.coral} stroke={C.gold} strokeWidth="1" />
          <text x={p.x} y={y - 65} textAnchor="middle" fill="#fff" fontFamily={FONT_M} fontSize="10" letterSpacing="0.24em" fontWeight="800">GO HERE</text>
        </g>
      )}

      {/* Active indicator */}
      {isActive && !isQuest && (
        <g>
          {/* Glow halo */}
          <circle cx={p.x} cy={y - 25} r="34" fill={C.coral} opacity="0.2">
            <animate attributeName="r" values="28;42;28" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.35;0.15" dur="1.4s" repeatCount="indefinite" />
          </circle>
          {/* Key cap */}
          <rect x={p.x - 18} y={y - 48} width="36" height="22" rx="4" fill={C.ink} stroke={C.gold} strokeWidth="1.5" />
          <text x={p.x} y={y - 33} textAnchor="middle" fill={C.gold} fontFamily={FONT_M} fontSize="12" fontWeight="800">E</text>
          {/* ENTER label */}
          <rect x={p.x - 26} y={y - 22} width="52" height="12" rx="2" fill={C.coral} />
          <text x={p.x} y={y - 13} textAnchor="middle" fill="#fff" fontFamily={FONT_M} fontSize="7.5" fontWeight="800" letterSpacing="0.22em">ENTER</text>
        </g>
      )}

      {/* Locked indicator for Reserve on Day 1 */}
      {p.id === "reserve" && locked && (
        <g>
          <rect x={p.x - 60} y={y - 36} width="120" height="22" fill={C.ink} rx="3" opacity="0.9" stroke={C.gold} strokeWidth="0.5" />
          <text x={p.x} y={y - 21} textAnchor="middle" fill={C.textMuted} fontFamily={FONT_M} fontSize="9" letterSpacing="0.18em" fontWeight="700">🔒 OPENS TUESDAY 09:00</text>
        </g>
      )}
    </g>
  );
}

function Plaza({ p }) {
  return (
    <g>
      {/* Plaza floor (round area) */}
      <ellipse cx={p.x} cy={GROUND_Y + 12} rx="100" ry="20" fill={C.streetDark} opacity="0.5" />
      {/* Fountain */}
      <circle cx={p.x} cy={GROUND_Y - 40} r="40" fill={C.streetDark} />
      <circle cx={p.x} cy={GROUND_Y - 40} r="36" fill={C.pavement} />
      <circle cx={p.x} cy={GROUND_Y - 40} r="22" fill="#7ba4b8" />
      <circle cx={p.x} cy={GROUND_Y - 40} r="14" fill="none" stroke="#7ba4b8" strokeWidth="1.5">
        <animate attributeName="r" values="14;22;14" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0;0.7" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={p.x} cy={GROUND_Y - 40} r="4" fill={C.gold} />
      {/* Benches */}
      <g transform={`translate(${p.x - 90}, ${GROUND_Y - 12})`}>
        <rect width="40" height="6" fill="#8a5e3e" rx="1" />
        <rect x="2" y="6" width="4" height="10" fill="#6d452a" />
        <rect x="34" y="6" width="4" height="10" fill="#6d452a" />
      </g>
      <g transform={`translate(${p.x + 50}, ${GROUND_Y - 12})`}>
        <rect width="40" height="6" fill="#8a5e3e" rx="1" />
        <rect x="2" y="6" width="4" height="10" fill="#6d452a" />
        <rect x="34" y="6" width="4" height="10" fill="#6d452a" />
      </g>
      {/* Tree */}
      <g transform={`translate(${p.x - 130}, ${GROUND_Y - 40})`}>
        <rect x="-3" y="0" width="6" height="20" fill="#6d452a" />
        <circle cx="0" cy="-6" r="22" fill="#3d5a3a" />
        <circle cx="-6" cy="-12" r="14" fill={C.grass} />
        <circle cx="6" cy="-8" r="16" fill="#7d9b66" />
      </g>
    </g>
  );
}

// ─── NPC ────────────────────────────────────────────────────
function NpcSprite({ npc, isActive }) {
  // Per-character design data
  const looks = {
    halim:     { skin: "#c4956a", hair: "#e8e0d8", hairStyle: "balding", outfit: C.bFlat, outfitDark: C.bFlatD, props: "cane",  body: "stoop", height: 1.5 },
    jogger:    { skin: "#a87049", hair: "#1a0c08", hairStyle: "ponytail", outfit: C.green, outfitDark: "#1a6638", props: "headphones", body: "athletic", height: 1.5 },
    yusuf:     { skin: "#b88660", hair: "#3a2418", hairStyle: "curly", outfit: C.coral, outfitDark: "#8a1240", props: "backpack", body: "tired", height: 1.55 },
    amara:     { skin: "#9a6840", hair: "#1a0c08", hairStyle: "wrap", outfit: C.bMarket, outfitDark: C.bMarketD, props: "apron", body: "strong", height: 1.55 },
    elder:     { skin: "#d4b090", hair: "#f0e8d8", hairStyle: "comb", outfit: C.blue, outfitDark: "#234b7d", props: "glasses", body: "stoop", height: 1.45 },
    kids:      { skin: "#a07050", hair: "#2a1810", hairStyle: "short", outfit: C.rose, outfitDark: "#9a5868", props: "phone", body: "young", height: 1.45 },
    vendor:    { skin: "#8a5838", hair: "#1a0c08", hairStyle: "cap",    outfit: C.purple, outfitDark: "#5e4080", props: "stall", body: "broad", height: 1.55 },
    trader:    { skin: "#c4a585", hair: "#3a2418", hairStyle: "slicked", outfit: C.gold, outfitDark: "#a87918", props: "phone", body: "tall", height: 1.6 },
    protester: { skin: "#a87049", hair: "#3a2418", hairStyle: "bun",   outfit: C.red, outfitDark: "#8a1828", props: "sign", body: "fierce", height: 1.55 },
  };
  const L = looks[npc.id] || { skin: "#c4956a", hair: "#1a0c08", hairStyle: "short", outfit: npc.color, outfitDark: "#3a2418", props: "", body: "normal", height: 1.5 };

  return (
    <g transform={`translate(${npc.x}, ${GROUND_Y - 38}) scale(${L.height})`}>
      <ellipse cx="0" cy="26" rx="10" ry="2.8" fill="#000" opacity="0.28" />

      {/* Legs */}
      <rect x="-3" y="8" width="3" height="10" fill={L.outfitDark} rx="1" />
      <rect x="0" y="8" width="3" height="10" fill={L.outfitDark} rx="1" />
      <rect x="-3" y="17" width="4" height="2.5" fill="#0a0408" rx="0.5" />
      <rect x="0" y="17" width="4" height="2.5" fill="#0a0408" rx="0.5" />

      {/* Body — varies by body type */}
      {L.body === "stoop" && <path d="M -7 -3 Q -8 -7 -4 -8 L 5 -8 Q 8 -7 7 -3 L 9 9 Q 4 11 0 11 Q -4 11 -9 9 Z" fill={L.outfit} />}
      {L.body !== "stoop" && <path d="M -7 -3 Q -8 -8 -4 -9 L 4 -9 Q 8 -8 7 -3 L 9 10 Q 4 12 0 12 Q -4 12 -9 10 Z" fill={L.outfit} />}

      {/* Body details based on props */}
      {L.props === "apron" && (
        <>
          <path d="M -6 -3 L 6 -3 L 7 11 L -7 11 Z" fill="#fff8ee" opacity="0.85" />
          <line x1="-4" y1="-3" x2="-4" y2="-6" stroke="#fff8ee" strokeWidth="0.8" />
          <line x1="4" y1="-3" x2="4" y2="-6" stroke="#fff8ee" strokeWidth="0.8" />
        </>
      )}
      {L.props === "backpack" && (
        <rect x="-9" y="-2" width="3" height="11" fill={L.outfitDark} rx="0.5" />
      )}
      {L.props === "sign" && (
        <g>
          <rect x="-1" y="-22" width="1" height="14" fill="#5a3018" />
          <rect x="-12" y="-30" width="22" height="10" fill="#fff8ee" stroke="#1a0c08" strokeWidth="0.4" />
          <text x="-1" y="-23" textAnchor="middle" fontFamily="sans-serif" fontSize="3" fill="#1a0c08" fontWeight="800">RENT IS</text>
          <text x="-1" y="-20" textAnchor="middle" fontFamily="sans-serif" fontSize="3" fill="#1a0c08" fontWeight="800">THEFT</text>
        </g>
      )}
      {L.props === "cane" && (
        <line x1="-12" y1="-5" x2="-13" y2="14" stroke="#3a2418" strokeWidth="1.2" strokeLinecap="round" />
      )}
      {L.props === "phone" && (
        <rect x="6" y="-6" width="2" height="4" fill="#1a0c08" rx="0.3" />
      )}
      {L.props === "stall" && (
        <>
          <rect x="-14" y="6" width="28" height="2" fill="#5a3018" />
          <rect x="-12" y="2" width="2" height="4" fill="#5a3018" />
          <rect x="10" y="2" width="2" height="4" fill="#5a3018" />
        </>
      )}
      {L.props === "headphones" && (
        <>
          <path d="M -8 -16 Q 0 -22 8 -16" stroke="#1a0c08" strokeWidth="1.2" fill="none" />
          <ellipse cx="-8" cy="-14" rx="2" ry="2.5" fill={C.coral} />
          <ellipse cx="8" cy="-14" rx="2" ry="2.5" fill={C.coral} />
        </>
      )}

      {/* Neck */}
      <rect x="-2" y="-9" width="4" height="3" fill={L.skin} />

      {/* Head */}
      <ellipse cx="0" cy="-15" rx="7" ry="8.5" fill={L.skin} />

      {/* Hair by style */}
      {L.hairStyle === "balding" && (
        <>
          <path d="M -6 -18 Q -7 -22 -3 -22 L 3 -22 Q 7 -22 6 -18" fill={L.hair} />
          <ellipse cx="-5" cy="-15" rx="2" ry="3" fill={L.hair} />
          <ellipse cx="5" cy="-15" rx="2" ry="3" fill={L.hair} />
        </>
      )}
      {L.hairStyle === "ponytail" && (
        <>
          <path d="M -7 -18 Q -8 -23 0 -24 Q 7 -23 7 -18 L 8 -12 Q 5 -14 0 -14 Q -5 -14 -8 -12 Z" fill={L.hair} />
          <path d="M 4 -16 Q 9 -12 11 -6 Q 9 -4 7 -5 Z" fill={L.hair} />
        </>
      )}
      {L.hairStyle === "curly" && (
        <>
          <circle cx="-5" cy="-21" r="3" fill={L.hair} />
          <circle cx="0" cy="-23" r="3.5" fill={L.hair} />
          <circle cx="5" cy="-21" r="3" fill={L.hair} />
          <circle cx="-6" cy="-17" r="2.5" fill={L.hair} />
          <circle cx="6" cy="-17" r="2.5" fill={L.hair} />
        </>
      )}
      {L.hairStyle === "wrap" && (
        <>
          <path d="M -8 -16 Q -9 -24 0 -25 Q 9 -24 8 -16 L 8 -12 Q 4 -13 0 -13 Q -4 -13 -8 -12 Z" fill={C.gold} />
          <path d="M -8 -18 Q 0 -22 8 -18" stroke={C.coral} strokeWidth="1.2" fill="none" />
          <circle cx="-7" cy="-19" r="1.2" fill={C.coral} />
        </>
      )}
      {L.hairStyle === "comb" && (
        <>
          <path d="M -7 -18 Q -7 -22 0 -23 Q 7 -22 7 -18" fill={L.hair} />
          <line x1="-5" y1="-19" x2="-3" y2="-23" stroke="#bfb8a8" strokeWidth="0.4" />
          <line x1="0" y1="-19" x2="2" y2="-23" stroke="#bfb8a8" strokeWidth="0.4" />
          <line x1="4" y1="-19" x2="6" y2="-23" stroke="#bfb8a8" strokeWidth="0.4" />
        </>
      )}
      {L.hairStyle === "short" && (
        <path d="M -7 -18 Q -7 -23 0 -23 Q 7 -23 7 -18 L 7 -13 Q 4 -15 0 -15 Q -4 -15 -7 -13 Z" fill={L.hair} />
      )}
      {L.hairStyle === "cap" && (
        <>
          <rect x="-7" y="-22" width="14" height="6" fill={L.outfitDark} rx="0.5" />
          <ellipse cx="0" cy="-21" rx="9" ry="2" fill={L.outfitDark} />
        </>
      )}
      {L.hairStyle === "slicked" && (
        <>
          <path d="M -7 -18 Q -7 -23 0 -23 Q 7 -23 7 -18" fill={L.hair} />
          <path d="M -5 -20 Q 0 -22 5 -20" stroke="#0a0408" strokeWidth="0.6" fill="none" />
        </>
      )}
      {L.hairStyle === "bun" && (
        <>
          <path d="M -7 -18 Q -7 -22 0 -23 Q 7 -22 7 -18 L 7 -13 Q 4 -14 0 -14 Q -4 -14 -7 -13 Z" fill={L.hair} />
          <circle cx="0" cy="-26" r="3.5" fill={L.hair} />
          <ellipse cx="0" cy="-25" rx="2" ry="1" fill={C.coral} />
        </>
      )}

      {/* Ear */}
      <circle cx="-6.5" cy="-15" r="1.3" fill={L.skin} opacity="0.7" />

      {/* Eyebrows — defined like in the portrait assets */}
      <rect x="-4" y="-17.2" width="2.2" height="0.7" fill={L.hair} rx="0.3" />
      <rect x="1.8" y="-17.2" width="2.2" height="0.7" fill={L.hair} rx="0.3" />

      {/* Glasses (elder) */}
      {L.props === "glasses" && (
        <>
          <circle cx="-2.5" cy="-15" r="2.2" fill="none" stroke="#1a0c08" strokeWidth="0.6" />
          <circle cx="2.5" cy="-15" r="2.2" fill="none" stroke="#1a0c08" strokeWidth="0.6" />
          <line x1="-0.3" y1="-15" x2="0.3" y2="-15" stroke="#1a0c08" strokeWidth="0.6" />
        </>
      )}

      {/* Eyes — defined with highlight */}
      {L.props !== "glasses" && (
        <>
          <ellipse cx="-2.5" cy="-15" rx="0.8" ry="1" fill="#1a0c08" />
          <ellipse cx="2.5" cy="-15" rx="0.8" ry="1" fill="#1a0c08" />
          <circle cx="-2.3" cy="-15.3" r="0.25" fill="#fff8ee" />
          <circle cx="2.7" cy="-15.3" r="0.25" fill="#fff8ee" />
        </>
      )}
      {L.props === "glasses" && (
        <>
          <circle cx="-2.5" cy="-15" r="0.5" fill="#1a0c08" />
          <circle cx="2.5" cy="-15" r="0.5" fill="#1a0c08" />
        </>
      )}

      {/* Mouth — varied expressions */}
      {L.body === "fierce" && <path d="M -2 -11 L 2 -11" stroke="#5a2418" strokeWidth="0.7" strokeLinecap="round" />}
      {L.body === "tired" && <path d="M -1.5 -11.5 Q 0 -11 1.5 -11.5" stroke="#5a2418" strokeWidth="0.5" fill="none" strokeLinecap="round" />}
      {L.body === "athletic" && <path d="M -1.5 -11.5 Q 0 -10.5 1.5 -11.5" stroke="#5a2418" strokeWidth="0.5" fill="none" strokeLinecap="round" />}
      {L.body === "young" && <ellipse cx="0" cy="-11" rx="1.2" ry="0.5" fill="#5a2418" />}
      {(L.body === "normal" || L.body === "stoop" || L.body === "broad" || L.body === "tall" || L.body === "strong") && (
        <path d="M -1.5 -11 Q 0 -10.5 1.5 -11" stroke="#5a2418" strokeWidth="0.5" fill="none" strokeLinecap="round" />
      )}

      {isActive && (
        <g>
          {/* Outer glow ring */}
          <circle cx="0" cy="-50" r="22" fill={C.coral} opacity="0.25">
            <animate attributeName="r" values="18;26;18" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.4;0.15" dur="1.4s" repeatCount="indefinite" />
          </circle>
          {/* Key cap with key letter */}
          <rect x="-16" y="-62" width="32" height="22" rx="4" fill={C.ink} stroke={C.gold} strokeWidth="1.5" />
          <rect x="-14" y="-60" width="28" height="3" rx="1" fill={C.gold} opacity="0.6" />
          <text x="0" y="-46" textAnchor="middle" fill={C.gold} fontFamily={FONT_M} fontSize="11" fontWeight="800" letterSpacing="0.05em">E</text>
          {/* TALK label below */}
          <rect x="-22" y="-36" width="44" height="11" rx="2" fill={C.coral} />
          <text x="0" y="-28" textAnchor="middle" fill="#fff" fontFamily={FONT_M} fontSize="7.5" fontWeight="800" letterSpacing="0.22em">TALK</text>
          {/* Pointer arrow */}
          <polygon points="-3,-23 0,-19 3,-23" fill={C.coral} />
        </g>
      )}
    </g>
  );
}

// ─── ATMOSPHERIC EFFECTS ────────────────────────────────────
function DustMotes({ camX, camY, VW, VH, intensity = 1 }) {
  const motes = [];
  for (let i = 0; i < 30 * intensity; i++) {
    const baseX = (i * 137) % VW;
    const baseY = (i * 89) % VH;
    const driftPhase = i * 0.6;
    motes.push({ x: baseX + camX, y: baseY + camY, r: 0.4 + (i % 3) * 0.3, p: driftPhase });
  }
  return (
    <g opacity="0.6">
      {motes.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={m.r} fill="#fff8ee">
          <animate attributeName="cy" values={`${m.y};${m.y - 30};${m.y}`} dur={`${4 + (i % 5)}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
}

function LightShaft({ x, y, w, h, color = "#fff8ee", opacity = 0.12 }) {
  return (
    <g>
      <polygon points={`${x},${y} ${x + w},${y} ${x + w * 1.6},${y + h} ${x - w * 0.6},${y + h}`} fill={color} opacity={opacity} />
    </g>
  );
}

// ════════════════════════════════════════════════════════════
// ═══ PULSE-INSPIRED UPGRADES ═══════════════════════════════
// New shared components borrowed from the Pulse prototype:
// live vitals, transmission diagram, ambient ticker, approval
// meter. All rendered in Great Vostan's warm cream/coral/gold palette
// instead of the cold bioluminescent Pulse aesthetic.
// ════════════════════════════════════════════════════════════

// Derive macro vitals from current policy state
function computeVitals(state, overrideRate, overrideQE, overrideMP) {
  const rate = overrideRate !== undefined ? overrideRate : (state.policy?.rate ?? state.interestRate ?? 3.0);
  const qe = overrideQE !== undefined ? overrideQE : (state.policy?.qe ?? 0);
  const macroPru = overrideMP !== undefined ? overrideMP : (state.policy?.macroPru ?? 0);
  const guidance = state.policy?.guidance ?? state.guidance ?? "balanced";
  // Baseline inflation is the current state.inflation. Project where it goes.
  const baseInfl = state.inflation ?? 4.2;
  const projInfl = Math.max(0, Math.min(8, baseInfl + (rate < 3 ? (3 - rate) * 0.6 : -(rate - 3) * 0.4) + qe * 0.3 - macroPru * 0.1 - 1.0));
  const gdp = 2.5 - (rate - 3) * 0.3 + qe * 0.25 + (guidance === "dove" ? 0.2 : guidance === "hawk" ? -0.2 : 0);
  const unemp = Math.max(2, Math.min(10, 4.5 + (rate - 3) * 0.25 - qe * 0.15));
  const fx = 1.00 + (rate - 3) * 0.04 - qe * 0.03;
  const approval = state.publicTrust ?? 50;
  return { inflation: projInfl, gdp, unemp, fx, approval };
}

// Build a synthetic sparkline history leading to the current value
function syntheticHistory(currentValue, length = 30, volatility = 0.15) {
  const history = [];
  let v = currentValue * (0.7 + Math.random() * 0.4);
  for (let i = 0; i < length; i++) {
    const k = i / length;
    v = v + (currentValue - v) * 0.15 + (Math.sin(i * 0.7) - 0.5) * volatility;
    history.push(v);
  }
  history[history.length - 1] = currentValue;
  return history;
}

// ─── ECONOMY VITALS STRIP — top-of-screen live readouts ────
function EconomyVitals({ state, projected, projectionLabel, compact = false }) {
  const live = computeVitals(state);
  const proj = projected || null;

  const vitals = [
    {
      label: "INFLATION",     sub: "vs 2.0% target",  value: live.inflation, projValue: proj?.inflation,
      unit: "%", target: 2.0, range: [0, 8], healthy: [1.5, 2.5], decimals: 1,
      diagnosis: live.inflation > 4 ? { tag: "ELEVATED TEMPERATURE", text: "Above target. Cooling indicated.", color: C.coral }
               : live.inflation < 1 ? { tag: "HYPOTHERMIA", text: "Below target. Stimulus may help.", color: C.blue }
               : { tag: "WITHIN BAND", text: "Steady.", color: C.teal }
    },
    {
      label: "GROWTH",        sub: "GDP, annualised", value: live.gdp,      projValue: proj?.gdp,
      unit: "%", target: 2.5, range: [-3, 5], healthy: [1.5, 3.5], decimals: 1,
      diagnosis: live.gdp < 0 ? { tag: "WEAK PULSE", text: "Output contracting.", color: C.coral }
               : live.gdp < 1 ? { tag: "BRADYCARDIA", text: "Below trend.", color: C.gold }
               : live.gdp > 4 ? { tag: "TACHYCARDIA", text: "Overheating risk.", color: C.gold }
               : { tag: "STEADY", text: "On trend.", color: C.teal }
    },
    {
      label: "UNEMPLOYMENT",  sub: "Labour market",    value: live.unemp,    projValue: proj?.unemp,
      unit: "%", target: 4.0, range: [2, 10], healthy: [3, 5], decimals: 1,
      diagnosis: live.unemp > 6 ? { tag: "HIGH PRESSURE", text: "Labour distress.", color: C.coral }
               : live.unemp < 3 ? { tag: "TIGHT", text: "Wage pressure risk.", color: C.gold }
               : { tag: "STABLE", text: "Healthy band.", color: C.teal }
    },
    {
      label: "CURRENCY",      sub: "FX, index",        value: live.fx,       projValue: proj?.fx,
      unit: "", target: 1.0, range: [0.85, 1.15], healthy: [0.95, 1.05], decimals: 3,
      diagnosis: live.fx < 0.95 ? { tag: "WEAK MARKA", text: "Imports pricier.", color: C.gold }
               : live.fx > 1.05 ? { tag: "STRONG MARKA", text: "Exports squeezed.", color: C.gold }
               : { tag: "STABLE", text: "Currency calm.", color: C.teal }
    },
    {
      label: "APPROVAL",      sub: "Public trust",     value: live.approval, projValue: proj?.approval,
      unit: "", target: 60, range: [0, 100], healthy: [55, 100], decimals: 0,
      diagnosis: live.approval < 30 ? { tag: "PUBLIC ANGER", text: "Trust collapsing.", color: C.coral }
               : live.approval < 55 ? { tag: "WARY", text: "Trust below par.", color: C.gold }
               : { tag: "TRUSTED", text: "Public on side.", color: C.teal }
    },
  ];

  return (
    <div style={{
      background: "rgba(8,12,30,0.85)",
      borderTop: `1px solid rgba(245,184,46,0.18)`,
      borderBottom: `1px solid rgba(245,184,46,0.18)`,
      padding: compact ? "10px 24px" : "14px 32px",
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 14,
      backdropFilter: "blur(6px)",
    }}>
      {vitals.map((v) => <VitalCell key={v.label} v={v} compact={compact} />)}
    </div>
  );
}

function VitalCell({ v, compact }) {
  const isHealthy = v.value >= v.healthy[0] && v.value <= v.healthy[1];
  const isHot = v.value > v.healthy[1];
  const color = isHealthy ? C.teal : isHot ? C.coral : C.blue;

  // Synthetic history trailing to current value
  const history = useMemo(() => syntheticHistory(v.value, 24), [v.value.toFixed(1)]);
  const minT = v.range[0], maxT = v.range[1];

  const delta = v.projValue !== undefined ? (v.projValue - v.value) : null;

  return (
    <div style={{ borderLeft: `2px solid ${color}`, paddingLeft: 10, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontFamily: FONT_M, fontSize: 8.5, color: C.textCreamDim, letterSpacing: "0.28em", fontWeight: 700 }}>{v.label}</div>
          {!compact && <div style={{ fontFamily: FONT_M, fontSize: 8.5, color: C.textCreamDim, fontWeight: 300, marginTop: 1, opacity: 0.7 }}>{v.sub}</div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
        <div style={{ fontFamily: FONT_D, fontSize: compact ? 22 : 28, color, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, textShadow: `0 0 16px ${color}66` }}>
          {v.value.toFixed(v.decimals)}{v.unit}
        </div>
        {delta !== null && Math.abs(delta) > 0.05 && (
          <div className="popupIn" style={{ fontFamily: FONT_M, fontSize: 10, color: (delta < 0 && (v.label === "INFLATION" || v.label === "UNEMPLOYMENT")) || (delta > 0 && (v.label === "GROWTH" || v.label === "APPROVAL")) ? C.teal : C.coral, fontWeight: 700, marginLeft: 2 }}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(v.decimals)}
          </div>
        )}
      </div>
      {/* Sparkline */}
      <svg viewBox="0 0 120 22" preserveAspectRatio="none" style={{ width: "100%", height: 18, marginTop: 4, opacity: 0.9 }}>
        {/* Healthy band */}
        <rect x="0" y={22 - ((v.healthy[1] - minT) / (maxT - minT)) * 18 - 2} width="120" height={Math.max(2, ((v.healthy[1] - v.healthy[0]) / (maxT - minT)) * 18)} fill={C.teal} opacity="0.08" />
        <polyline
          points={history.map((t, i) => `${(i / Math.max(history.length - 1, 1)) * 120},${22 - ((t - minT) / (maxT - minT)) * 18 - 2}`).join(" ")}
          stroke={color}
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="119" cy={22 - ((history[history.length - 1] - minT) / (maxT - minT)) * 18 - 2} r="2.5" fill={color}>
          <animate attributeName="r" values="1.5;3;1.5" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </svg>
      {!compact && v.diagnosis && (
        <div style={{ fontFamily: FONT_M, fontSize: 8, color: v.diagnosis.color, letterSpacing: "0.2em", fontWeight: 700, marginTop: 2 }}>
          ◆ {v.diagnosis.tag}
        </div>
      )}
    </div>
  );
}

// ─── MINI TRANSMISSION DIAGRAM (Pulse-style network) ──────
function MiniTransmission({ state, hoveredRate, hoveredQE, hoveredMP, label }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => { setT(performance.now() / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rate = hoveredRate !== undefined ? hoveredRate : (state.policy?.rate ?? 3.0);
  const qe = hoveredQE !== undefined ? hoveredQE : (state.policy?.qe ?? 0);
  const mp = hoveredMP !== undefined ? hoveredMP : (state.policy?.macroPru ?? 0);

  // Six sectors arranged in Great Vostan's hex layout
  const sectors = [
    { id: "house",  short: "HH", name: "HOUSEHOLDS",  color: C.rose,   x: 0.50, y: 0.18 },
    { id: "firm",   short: "FM", name: "FIRMS",       color: C.gold,   x: 0.18, y: 0.38 },
    { id: "bank",   short: "BK", name: "BANKS",       color: C.teal,   x: 0.82, y: 0.38 },
    { id: "gov",    short: "GV", name: "GOVERNMENT",  color: "#fff8ee",x: 0.18, y: 0.66 },
    { id: "foreign",short: "FX", name: "FOREIGN",     color: C.blue,   x: 0.82, y: 0.66 },
    { id: "cb",     short: "CB", name: "RESERVE",     color: C.coral,  x: 0.50, y: 0.86 },
  ];

  // Flow definitions with policy-sensitive multipliers
  const flows = [
    { from: "house", to: "firm",    type: "consumption",  base: 0.7, color: C.rose,   mult: () => Math.max(0.4, 1 - state.inflation * 0.05) },
    { from: "firm",  to: "house",   type: "wages",        base: 0.7, color: C.gold,   mult: () => 1.0 },
    { from: "house", to: "bank",    type: "savings",      base: 0.4, color: C.teal,   mult: () => Math.max(0.5, 1 + (rate - 3) * 0.2) },
    { from: "bank",  to: "house",   type: "mortgages",    base: 0.5, color: C.teal,   mult: () => Math.max(0.2, 1 - (rate - 3) * 0.3) },
    { from: "firm",  to: "bank",    type: "deposits",     base: 0.3, color: C.teal,   mult: () => 1.0 },
    { from: "bank",  to: "firm",    type: "credit",       base: 0.5, color: C.teal,   mult: () => Math.max(0.3, 1 - (rate - 3) * 0.25 - mp * 0.15) },
    { from: "house", to: "gov",     type: "taxes",        base: 0.3, color: "#fff8ee",mult: () => 1.0 },
    { from: "gov",   to: "house",   type: "transfers",    base: 0.25,color: "#fff8ee",mult: () => 1.0 },
    { from: "firm",  to: "foreign", type: "exports",      base: 0.4, color: C.blue,   mult: () => 1 + qe * 0.05 },
    { from: "foreign",to: "firm",   type: "imports",      base: 0.4, color: C.blue,   mult: () => 1 - qe * 0.05 },
    { from: "cb",    to: "bank",    type: "reserves",     base: 0.3, color: C.coral,  mult: () => 1 + qe * 0.4 },
    { from: "bank",  to: "cb",      type: "deposits",     base: 0.2, color: C.coral,  mult: () => 1.0 },
  ];

  const W = 380, H = 320;
  const isPreview = hoveredRate !== undefined || hoveredQE !== undefined || hoveredMP !== undefined;

  return (
    <div style={{ background: "rgba(8,12,30,0.7)", border: `1px solid ${isPreview ? C.coral : 'rgba(245,184,46,0.18)'}`, padding: 14, borderRadius: 3, transition: "border-color 0.2s", boxShadow: isPreview ? `0 0 24px ${C.coral}33` : 'none' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: isPreview ? C.coral : C.gold, letterSpacing: "0.28em", fontWeight: 800 }}>● TRANSMISSION{isPreview ? " · PREVIEW" : " · LIVE"}</div>
        {label && <div style={{ fontFamily: FONT_M, fontSize: 9, color: isPreview ? C.coral : C.textCreamDim, letterSpacing: "0.2em", fontWeight: 700 }}>{label}</div>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <filter id="ts-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Flow paths */}
        {flows.map((flow, i) => {
          const from = sectors.find(s => s.id === flow.from);
          const to = sectors.find(s => s.id === flow.to);
          const x1 = from.x * W, y1 = from.y * H;
          const x2 = to.x * W, y2 = to.y * H;
          const mult = flow.mult();
          const vol = flow.base * mult;
          const stroke = Math.max(0.5, vol * 2.5);
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const offX = -dy / len * 8;
          const offY = dx / len * 8;
          const cx = (x1 + x2) / 2 + offX;
          const cy = (y1 + y2) / 2 + offY;
          const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
          const NP = Math.max(2, Math.floor(vol * 4));
          const speed = 0.35 + vol * 0.4;
          const particles = [];
          for (let p = 0; p < NP; p++) {
            const phase = ((t * speed) + (p / NP) + i * 0.07) % 1;
            const mt = 1 - phase;
            const px = mt * mt * x1 + 2 * mt * phase * cx + phase * phase * x2;
            const py = mt * mt * y1 + 2 * mt * phase * cy + phase * phase * y2;
            particles.push({ x: px, y: py, alpha: Math.sin(phase * Math.PI) });
          }
          return (
            <g key={i}>
              <path d={path} stroke={flow.color} strokeWidth={stroke * 0.4} fill="none" opacity="0.22" />
              {particles.map((p, j) => (
                <circle key={j} cx={p.x} cy={p.y} r={stroke * 0.9} fill={flow.color} opacity={p.alpha * 0.85} filter="url(#ts-glow)" />
              ))}
            </g>
          );
        })}

        {/* Sectors */}
        {sectors.map((sec) => {
          const cx = sec.x * W, cy = sec.y * H;
          const pulse = 1 + Math.sin(t * 1.5 + sec.id.charCodeAt(0)) * 0.08;
          const r = 14;
          return (
            <g key={sec.id}>
              <circle cx={cx} cy={cy} r={r * 2.4 * pulse} fill={sec.color} opacity="0.06" />
              <circle cx={cx} cy={cy} r={r * 1.6 * pulse} fill={sec.color} opacity="0.12" />
              <circle cx={cx} cy={cy} r={r * pulse} fill="rgba(8,12,30,0.95)" stroke={sec.color} strokeWidth="1.2" filter="url(#ts-glow)" />
              <text x={cx} y={cy + 3} textAnchor="middle" fill={sec.color} fontFamily={FONT_M} fontSize="8.5" fontWeight="800" letterSpacing="0.12em">{sec.short}</text>
              <text x={cx} y={cy + r + 12} textAnchor="middle" fill={sec.color} fontFamily={FONT_M} fontSize="6.5" fontWeight="700" letterSpacing="0.22em" opacity="0.7">{sec.name}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily: FONT_M, fontSize: 8, color: C.textCreamDim, letterSpacing: "0.18em", marginTop: 6, lineHeight: 1.5 }}>
        FLOWS THICKEN AND THIN WITH POLICY. WATCH THE MORTGAGE LINE.
      </div>
    </div>
  );
}

// ─── LIVE TICKER for Day 1 world ───────────────────────────
function LiveTicker({ state }) {
  const v = computeVitals(state);
  // Build the ticker payload
  const items = [
    { label: "INFL", value: `${v.inflation.toFixed(1)}%`, color: v.inflation > 3 ? C.coral : C.teal },
    { label: "RATE", value: `${(state.policy?.rate ?? state.interestRate ?? 3.0).toFixed(2)}%`, color: C.gold },
    { label: "UNEMP", value: `${v.unemp.toFixed(1)}%`, color: v.unemp > 5 ? C.coral : C.teal },
    { label: "GDP", value: `${v.gdp.toFixed(1)}%`, color: v.gdp < 1.5 ? C.coral : C.teal },
    { label: "MARKA/USD", value: v.fx.toFixed(3), color: C.blue },
    { label: "TRUST", value: `${Math.round(v.approval)}`, color: v.approval < 40 ? C.coral : C.teal },
    { label: "10Y YIELD", value: `${(2.8 + (state.policy?.rate ?? 3.0) - 3).toFixed(2)}%`, color: C.purple },
    { label: "RESERVE MEETS TOMORROW", value: "0800 GMT", color: C.gold },
  ];

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 28,
      background: "rgba(8,12,30,0.92)",
      borderBottom: `1px solid rgba(245,184,46,0.22)`,
      display: "flex", alignItems: "center", overflow: "hidden", zIndex: 12,
    }}>
      <div style={{
        background: C.coral, color: "#fff", height: "100%",
        padding: "0 12px", display: "flex", alignItems: "center",
        fontFamily: FONT_M, fontSize: 9, letterSpacing: "0.28em", fontWeight: 800,
        flexShrink: 0,
      }}>● LIVE</div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative", height: "100%" }}>
        <div style={{ position: "absolute", whiteSpace: "nowrap", top: "50%", transform: "translateY(-50%)", animation: "scroll 60s linear infinite" }}>
          {[...items, ...items, ...items].map((it, i) => (
            <span key={i} style={{ fontFamily: FONT_M, fontSize: 10.5, letterSpacing: "0.18em", fontWeight: 700, marginRight: 32 }}>
              <span style={{ color: C.textCreamDim, marginRight: 6 }}>{it.label}</span>
              <span style={{ color: it.color }}>{it.value}</span>
              <span style={{ color: "rgba(255,248,238,0.15)", marginLeft: 32 }}>·</span>
            </span>
          ))}
        </div>
      </div>
      <div style={{
        background: "rgba(245,184,46,0.15)", color: C.gold, height: "100%",
        padding: "0 14px", display: "flex", alignItems: "center",
        fontFamily: FONT_M, fontSize: 9, letterSpacing: "0.28em", fontWeight: 700,
        flexShrink: 0, borderLeft: `1px solid rgba(245,184,46,0.22)`,
      }}>VARENA · {new Date().toISOString().split("T")[1].slice(0,5)} GMT</div>
    </div>
  );
}

// ─── ANIMATED APPROVAL METER (for press conf) ─────────────
function LiveApprovalMeter({ value, label = "PUBLIC APPROVAL", delta = 0 }) {
  return (
    <div style={{ background: "rgba(8,12,30,0.88)", border: `1px solid rgba(245,184,46,0.25)`, padding: "12px 18px", borderRadius: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.3em", fontWeight: 800 }}>● {label}</div>
        {delta !== 0 && (
          <div className="popupIn" style={{ fontFamily: FONT_M, fontSize: 11, color: delta > 0 ? C.teal : C.coral, fontWeight: 800 }}>
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div style={{ fontFamily: FONT_D, fontSize: 36, color: value > 55 ? C.teal : value > 35 ? C.gold : C.coral, fontWeight: 900, lineHeight: 1 }}>
          {Math.round(value)}
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.textCreamDim }}>/ 100</div>
      </div>
      <div style={{ height: 6, background: "rgba(255,248,238,0.08)", marginTop: 8, position: "relative", borderRadius: 1, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value}%`,
          background: `linear-gradient(to right, ${value > 55 ? C.teal : value > 35 ? C.gold : C.coral}, ${value > 55 ? C.gold : C.coral})`,
          transition: "width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
          boxShadow: `0 0 12px ${value > 55 ? C.teal : C.coral}66`,
        }} />
        <div style={{ position: "absolute", top: 0, left: "55%", height: "100%", width: 1, background: "rgba(255,248,238,0.4)" }} />
      </div>
    </div>
  );
}

// ─── CRT SCAN LINE OVERLAY (atmospheric) ───────────────────
function ScanLineOverlay({ opacity = 0.04 }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 50 }}>
      <div style={{
        width: "100%", height: 3,
        background: `linear-gradient(to bottom, transparent, ${C.gold}, transparent)`,
        opacity, animation: "scan-line 12s linear infinite"
      }} />
    </div>
  );
}

// ─── SKIP BUTTON for cinematic sequences (demo control) ────
function SkipButton({ onSkip, label = "SKIP" }) {
  return (
    <button onClick={onSkip} style={{
      position: "absolute", top: 14, right: 24, zIndex: 60,
      background: "rgba(8,12,30,0.7)",
      color: C.textCreamDim,
      border: `1px solid rgba(245,184,46,0.3)`,
      padding: "8px 16px",
      fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em",
      cursor: "pointer", borderRadius: 2,
      backdropFilter: "blur(4px)",
      transition: "all 0.15s",
    }} onMouseOver={(e) => { e.currentTarget.style.background = C.coral; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.coral; }}
       onMouseOut={(e) => { e.currentTarget.style.background = "rgba(8,12,30,0.7)"; e.currentTarget.style.color = C.textCreamDim; e.currentTarget.style.borderColor = "rgba(245,184,46,0.3)"; }}>
      {label} →→
    </button>
  );
}

// ─── DEMO CONTROLS — for presenters: skip anywhere, anytime ──
function DemoControls({ state, dispatch }) {
  const [open, setOpen] = useState(false);

  const jumpToBank = () => {
    dispatch({ type: "OPEN_PANEL", id: "fbank" });
    setOpen(false);
  };
  const jumpToStocks = () => {
    dispatch({ type: "OPEN_PANEL", id: "stocks" });
    setOpen(false);
  };
  const jumpToSleep = () => {
    if (state.dayPhase !== "work") {
      // Skip directly to Day 2 morning, no sleep animation
      dispatch({ type: "SLEEP_TO_DAY_2" });
    }
    setOpen(false);
  };
  const jumpToReserve = () => {
    if (state.dayPhase !== "work") {
      // First skip to Day 2, then open Reserve
      dispatch({ type: "SLEEP_TO_DAY_2" });
      setTimeout(() => dispatch({ type: "OPEN_PANEL", id: "reserve" }), 50);
    } else {
      dispatch({ type: "OPEN_PANEL", id: "reserve" });
    }
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: 22, right: 22, zIndex: 998,
        background: "rgba(8,12,30,0.85)",
        color: C.gold,
        border: `1.5px solid ${C.gold}`,
        padding: "10px 18px",
        fontFamily: FONT_M, fontSize: 10, fontWeight: 800, letterSpacing: "0.3em",
        cursor: "pointer", borderRadius: 2,
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        transition: "all 0.15s",
      }} onMouseOver={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#1a1224"; }}
         onMouseOut={(e) => { e.currentTarget.style.background = "rgba(8,12,30,0.85)"; e.currentTarget.style.color = C.gold; }}>
        ⏭ DEMO
      </button>
    );
  }

  return (
    <div className="popupIn" style={{
      position: "fixed", bottom: 22, right: 22, zIndex: 998,
      background: "rgba(8,12,30,0.95)",
      border: `2px solid ${C.gold}`,
      borderRadius: 4, padding: "16px 18px",
      backdropFilter: "blur(12px)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
      minWidth: 240,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● DEMO · JUMP TO</div>
        <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: C.textCreamDim, fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {state.dayPhase !== "work" && (
          <>
            <DemoJumpButton color={C.gold} label="SLEEP NOW" sub="Skip to Day 2 morning" onClick={jumpToSleep} />
            <DemoJumpButton color={C.coral} label="BANK · FUTURE YOU" sub="Open the life simulator" onClick={jumpToBank} />
            <DemoJumpButton color={C.teal} label="STOCKS · THE TRADER" sub="Open the trading game" onClick={jumpToStocks} />
            <DemoJumpButton color={C.purple} label="GO TO RESERVE →" sub="Skip Day 1 entirely, start the meeting" onClick={jumpToReserve} />
          </>
        )}
        {state.dayPhase === "work" && (
          <>
            <DemoJumpButton color={C.purple} label="ENTER RESERVE →" sub="Start the committee meeting" onClick={jumpToReserve} />
            <DemoJumpButton color={C.coral} label="BANK · FUTURE YOU" sub="Open the life simulator" onClick={jumpToBank} />
            <DemoJumpButton color={C.teal} label="STOCKS · THE TRADER" sub="Open the trading game" onClick={jumpToStocks} />
          </>
        )}
      </div>

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid rgba(255,255,255,0.08)`, fontFamily: FONT_M, fontSize: 8, color: C.textCreamDim, letterSpacing: "0.22em", textAlign: "center", fontWeight: 600 }}>
        PRESENTER CONTROLS
      </div>
    </div>
  );
}

function DemoJumpButton({ color, label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: `1px solid rgba(255,255,255,0.1)`, borderLeft: `3px solid ${color}`,
      padding: "10px 14px", cursor: "pointer", borderRadius: 2, textAlign: "left",
      transition: "all 0.15s",
    }} onMouseOver={(e) => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = color; e.currentTarget.style.borderLeftColor = color; }}
       onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderLeftColor = color; }}>
      <div style={{ fontFamily: FONT_M, fontSize: 11, fontWeight: 800, color, letterSpacing: "0.18em" }}>{label}</div>
      <div style={{ fontFamily: FONT_M, fontSize: 9, fontWeight: 500, color: C.textCreamDim, marginTop: 2, letterSpacing: "0.1em" }}>{sub}</div>
    </button>
  );
}

// ─── STREET SCENE ───────────────────────────────────────────
function StreetScene({ state, dispatch, nearestThing }) {
  const VW = 1500;
  const VH = 720;
  const playerY = groundY(state.px);
  // Camera follows player in 2D, clamped to world bounds
  const camX = Math.max(0, Math.min(WORLD_W - VW, state.px - VW / 2));
  const camY = Math.max(0, Math.min(WORLD_H - VH, playerY - VH * 0.6));
  const quest = QUESTS[state.activeQuest];
  const arrowTargetPlace = quest?.target ? BUILDINGS.find((p) => p.id === quest.target) : null;
  const arrowTargetNpc = quest?.target?.endsWith?.("_npc") ? NPCS.find((n) => n.id === quest.target.replace("_npc", "")) : null;

  // Sleep animation: dim sky based on state.sleepAnim (0-100)
  const sleepProg = state.sleepAnim / 100;
  const nightAmount = Math.sin(sleepProg * Math.PI); // 0 → 1 → 0

  // Build ground path SVG path string
  const groundPathPoints = [];
  for (let x = 0; x <= WORLD_W; x += 30) {
    groundPathPoints.push(`${x},${groundY(x)}`);
  }
  const groundLineD = "M " + groundPathPoints.join(" L ");
  const groundFillD = `M 0,${WORLD_H} L 0,${groundY(0)} L ${groundPathPoints.join(" L ")} L ${WORLD_W},${WORLD_H} Z`;

  return (
    <svg viewBox={`${camX} ${camY} ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={state.dayPhase === "work" ? "#5a3470" : "#0f0820"} />
          <stop offset="25%" stopColor={state.dayPhase === "work" ? "#a04880" : "#2a1438"} />
          <stop offset="55%" stopColor={state.dayPhase === "work" ? "#ff8e6e" : "#5a2c5a"} />
          <stop offset="85%" stopColor={state.dayPhase === "work" ? "#ffce8e" : "#a04060"} />
          <stop offset="100%" stopColor={state.dayPhase === "work" ? "#ffce8e" : "#ff8e6e"} />
        </linearGradient>
        <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#040114" />
          <stop offset="50%" stopColor="#0a061f" />
          <stop offset="100%" stopColor="#1a0a2e" />
        </linearGradient>
        <pattern id="cobble" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill={C.street} />
          <ellipse cx="10" cy="10" rx="9" ry="6" fill={C.streetDark} opacity="0.5" />
          <ellipse cx="28" cy="14" rx="8" ry="5" fill={C.pavement} opacity="0.6" />
        </pattern>
        <pattern id="hillside" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="#2a1438" />
          <circle cx="20" cy="30" r="3" fill="#3a1f50" />
          <circle cx="55" cy="60" r="4" fill="#3a1f50" />
          <circle cx="70" cy="15" r="2.5" fill="#3a1f50" />
        </pattern>
      </defs>

      {/* Day sky */}
      <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#sky)" />
      {/* Night sky overlay (for sleep anim) */}
      {nightAmount > 0 && (
        <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#nightSky)" opacity={nightAmount} />
      )}

      {/* Stars (visible during night) */}
      {nightAmount > 0.4 && Array.from({ length: 60 }).map((_, i) => {
        const sx = ((i * 197) % WORLD_W);
        const sy = 30 + ((i * 71) % 280);
        return <circle key={i} cx={sx} cy={sy} r={0.8 + (i % 3) * 0.4} fill="#fff8ee" opacity={nightAmount * (0.4 + (i % 5) * 0.12)} />;
      })}

      {/* Moon (during night) and Sun (during day) */}
      {nightAmount > 0.3 ? (
        <g opacity={nightAmount}>
          <circle cx={camX + VW * 0.7} cy={120 - nightAmount * 30} r="44" fill="#fff8ee" />
          <circle cx={camX + VW * 0.7} cy={120 - nightAmount * 30} r="70" fill="#fff8ee" opacity="0.18" />
          <circle cx={camX + VW * 0.7 + 12} cy={108 - nightAmount * 30} r="6" fill="#e8d8b8" opacity="0.5" />
          <circle cx={camX + VW * 0.7 - 8} cy={132 - nightAmount * 30} r="4" fill="#e8d8b8" opacity="0.5" />
        </g>
      ) : (
        <g opacity={1 - nightAmount}>
          <circle cx={camX + VW * 0.18} cy={150 + (state.dayPhase === "work" ? 0 : 30)} r="40" fill="#fff8ee" opacity={state.dayPhase === "work" ? 1 : 0.85} />
          <circle cx={camX + VW * 0.18} cy={150 + (state.dayPhase === "work" ? 0 : 30)} r="70" fill="#fff8ee" opacity="0.2" />
        </g>
      )}

      {/* Distant mountain silhouette (parallax) */}
      <g transform={`translate(${camX * 0.3}, 0)`} opacity={1 - nightAmount * 0.5}>
        <path d="M 0 380 L 200 280 L 350 340 L 500 220 L 700 320 L 900 240 L 1100 310 L 1300 200 L 1500 280 L 1700 250 L 1900 310 L 2100 220 L 2300 290 L 1900 400 L 0 420 Z" fill="#1a0a2e" opacity="0.7" />
        <path d="M 0 460 L 180 380 L 380 430 L 580 360 L 800 430 L 1000 380 L 1200 440 L 1400 370 L 1600 420 L 1800 380 L 2000 430 L 2200 360 L 2400 420 L 2400 600 L 0 600 Z" fill="#241845" opacity="0.85" />
      </g>

      {/* Hillside fill below ground */}
      <path d={groundFillD} fill="url(#hillside)" />
      {/* Cobble strip - thick stroke along the curve */}
      <path d={groundLineD} stroke="url(#cobble)" strokeWidth="120" fill="none" strokeLinecap="butt" opacity="0.85" />
      {/* Ground top edge */}
      <path d={groundLineD} stroke={C.streetDark} strokeWidth="6" fill="none" />

      {/* Area labels graffitied on the path */}
      <text x="600" y={groundY(600) - 14} fontFamily={FONT_M} fontSize="10" fill={C.gold} letterSpacing="0.3em" fontWeight="700" opacity="0.4">— RIVERSIDE —</text>
      <text x="2300" y={groundY(2300) - 14} fontFamily={FONT_M} fontSize="10" fill={C.gold} letterSpacing="0.3em" fontWeight="700" opacity="0.4">— CITY CENTRE —</text>
      <text x="4000" y={groundY(4000) - 14} fontFamily={FONT_M} fontSize="10" fill={C.gold} letterSpacing="0.3em" fontWeight="700" opacity="0.4">— FINANCIAL DISTRICT —</text>

      {/* Lamp posts along the curve */}
      {Array.from({ length: Math.ceil(WORLD_W / 350) }).map((_, i) => {
        const lx = 180 + i * 350;
        if (lx > WORLD_W - 100) return null;
        const ly = groundY(lx);
        const lampOn = nightAmount > 0.3 || state.dayPhase !== "work";
        return (
          <g key={i} transform={`translate(${lx}, ${ly})`}>
            <rect x="-2" y="-90" width="4" height="90" fill="#1a0a06" />
            <rect x="-12" y="-106" width="24" height="6" fill="#1a0a06" />
            <circle cx="0" cy="-106" r="8" fill={C.goldBright} opacity={lampOn ? 0.95 : 0.4} />
            <circle cx="0" cy="-106" r="5" fill="#fff8ee" opacity={lampOn ? 1 : 0.5} />
            {lampOn && nightAmount > 0.4 && (
              <circle cx="0" cy="-106" r="40" fill={C.goldBright} opacity={nightAmount * 0.18} />
            )}
          </g>
        );
      })}

      {/* All buildings sit on the curve */}
      {BUILDINGS.map((p) => (
        <PlaceAtCurve key={p.id} p={p} isActive={nearestThing.kind === "place" && nearestThing.id === p.id} isQuest={arrowTargetPlace?.id === p.id} locked={p.id === "reserve" && state.dayPhase !== "work"} />
      ))}

      {/* DECORATIVE BACKGROUND CITIZENS — silent, no labels, no interaction.
          Spread across the world to make the city feel inhabited on camera. */}
      {BG_CITIZENS.map((c, i) => (
        <BackgroundCitizen key={i} c={c} groundY={groundY} />
      ))}

      {/* All NPCs on the curve */}
      {NPCS.map((n) => (
        <NpcSpriteAtCurve key={n.id} npc={n} isActive={nearestThing.kind === "npc" && nearestThing.id === n.id} isQuest={arrowTargetNpc?.id === n.id} />
      ))}

      {/* Player */}
      <Player x={state.px} y={playerY - 24} faceDir={state.faceDir} moving={state.moving} />
    </svg>
  );
}

// Buildings sit on the ground curve
// Decorative background citizens — spread across the world, no interaction, no labels.
// They make the city feel inhabited especially on camera. Sized smaller than NPCs.
const BG_CITIZENS = [
  // Riverside area
  { x: 450,  pose: "walk-right", body: "#9C72D4", hair: "#3a2418", phaseOff: 0,    speed: 6 },
  { x: 780,  pose: "stand",      body: "#06B5A0", hair: "#1a0c08", phaseOff: 1.2,  speed: 0 },
  { x: 1100, pose: "walk-left",  body: "#3D7BD9", hair: "#5a3a20", phaseOff: 2.4,  speed: 5 },
  // City centre
  { x: 1700, pose: "stand",      body: "#DA1B5C", hair: "#e8ddc8", phaseOff: 0.6,  speed: 0 },
  { x: 2050, pose: "walk-right", body: "#F5B82E", hair: "#1a0c08", phaseOff: 1.8,  speed: 6 },
  { x: 2400, pose: "sit",        body: "#9C72D4", hair: "#3a2418", phaseOff: 0,    speed: 0 },
  { x: 2750, pose: "walk-left",  body: "#06B5A0", hair: "#2a1810", phaseOff: 3.2,  speed: 5 },
  // Financial district
  { x: 3300, pose: "stand",      body: "#0a0f24", hair: "#1a0c08", phaseOff: 0.8,  speed: 0 },
  { x: 3650, pose: "walk-right", body: "#3D7BD9", hair: "#5a3a20", phaseOff: 2.1,  speed: 7 },
  { x: 4000, pose: "stand",      body: "#1a2454", hair: "#1a0c08", phaseOff: 1.4,  speed: 0 },
  { x: 4350, pose: "walk-left",  body: "#DA1B5C", hair: "#3a2418", phaseOff: 0.4,  speed: 5 },
];

function BackgroundCitizen({ c, groundY }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const tick = (now) => {
      setT((now / 1000) + c.phaseOff);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [c.phaseOff]);
  // Walk between [x-60, x+60] if walking
  const walkRange = 60;
  let xOff = 0;
  let faceDir = 1;
  if (c.speed > 0) {
    xOff = Math.sin(t / 2) * walkRange;
    faceDir = Math.cos(t / 2) > 0 ? 1 : -1;
    if (c.pose === "walk-left") faceDir = -faceDir;
  }
  const cx = c.x + xOff;
  const cy = groundY(cx);
  const bob = c.speed > 0 ? Math.abs(Math.sin(t * c.speed)) * 1.6 : Math.sin(t * 1.4) * 0.5;
  const moving = c.speed > 0;
  const isSit = c.pose === "sit";
  const armL = moving ? -Math.sin(t * c.speed) * 3 : 0;
  const armR = moving ? Math.sin(t * c.speed) * 3 : 0;
  const legL = moving ? Math.sin(t * c.speed) * 4 : 0;
  const legR = moving ? -Math.sin(t * c.speed) * 4 : 0;
  return (
    <g transform={`translate(${cx}, ${cy - 22 + bob}) scale(${1.3 * faceDir}, 1.3)`} opacity="0.78">
      {/* Drop shadow */}
      <ellipse cx="0" cy="18" rx="10" ry="2.5" fill="#000" opacity="0.22" />
      {!isSit && (
        <>
          {/* Legs */}
          <rect x="-5" y="2" width="3" height={moving ? 14 + legR : 14} fill="#1a0c08" rx="1" />
          <rect x="2" y="2" width="3" height={moving ? 14 + legL : 14} fill="#1a0c08" rx="1" />
        </>
      )}
      {isSit && (
        <>
          {/* Bench under */}
          <rect x="-9" y="10" width="18" height="3" fill="#3a2418" rx="1" />
          <rect x="-7" y="13" width="2" height="6" fill="#1a0c08" />
          <rect x="5" y="13" width="2" height="6" fill="#1a0c08" />
          {/* Folded legs */}
          <rect x="-5" y="6" width="10" height="6" fill="#1a0c08" rx="1" />
        </>
      )}
      {/* Torso */}
      <path d="M -7 -3 Q -8 -7 -5 -8 L 5 -8 Q 8 -7 7 -3 L 8 6 Q 4 8 0 8 Q -4 8 -8 6 Z" fill={c.body} />
      {/* Arms */}
      <rect x="-9" y="-3" width="2.5" height="8" fill={c.body} rx="1" transform={`translate(${armR * 0.4},0)`} />
      <rect x="6.5" y="-3" width="2.5" height="8" fill={c.body} rx="1" transform={`translate(${armL * 0.4},0)`} />
      {/* Neck */}
      <rect x="-1.5" y="-9" width="3" height="2.5" fill="#c89880" />
      {/* Head */}
      <ellipse cx="0" cy="-14" rx="6" ry="7" fill="#c89880" />
      {/* Hair */}
      <path d="M -6 -16 Q -6 -21 -1 -21 L 4 -21 Q 6 -20 6 -17 L 6 -14 Q 5 -16 3 -16 L -5 -16 Z" fill={c.hair} />
      {/* Tiny eyes */}
      <circle cx="-2" cy="-13" r="0.6" fill="#1a0c08" />
      <circle cx="2" cy="-13" r="0.6" fill="#1a0c08" />
    </g>
  );
}

function PlaceAtCurve({ p, isActive, isQuest, locked }) {
  const y = groundY(p.x);
  return <g transform={`translate(0, ${y - GROUND_Y})`}><Place p={p} isActive={isActive} isQuest={isQuest} locked={locked} /></g>;
}

function NpcSpriteAtCurve({ npc, isActive, isQuest }) {
  const y = groundY(npc.x);
  return (
    <g transform={`translate(0, ${y - GROUND_Y})`}>
      <NpcSprite npc={npc} isActive={isActive} />
      {isQuest && (
        <g transform={`translate(${npc.x}, ${GROUND_Y - 120})`}>
          {/* Halo */}
          <circle cx="0" cy="2" r="22" fill={C.coral} opacity="0.2">
            <animate attributeName="r" values="16;28;16" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.12;0.3;0.12" dur="1.6s" repeatCount="indefinite" />
          </circle>
          {/* Arrow */}
          <polygon points="0,22 -12,4 12,4" fill={C.coral} stroke={C.gold} strokeWidth="1.5">
            <animateTransform attributeName="transform" type="translate" values="0,-4;0,4;0,-4" dur="1s" repeatCount="indefinite" />
          </polygon>
          {/* Label */}
          <rect x="-32" y="-16" width="64" height="16" rx="2" fill={C.coral} stroke={C.gold} strokeWidth="1" />
          <text x="0" y="-4" textAnchor="middle" fill="#fff" fontFamily={FONT_M} fontSize="9" letterSpacing="0.22em" fontWeight="800">TALK TO</text>
        </g>
      )}
    </g>
  );
}

// ─── TREASURE MAP (full-screen, illustrated, 3 zones) ──────
function TreasureMap({ state, dispatch }) {
  const W = 900, H = 620;
  // Zone display rows: work top, city middle, home bottom
  const ZONE_ROWS = {
    work: { y: 140, label: "FINANCIAL DISTRICT", note: "rates, trades" },
    city: { y: 320, label: "CITY CENTRE", note: "shops, plaza, bank" },
    home: { y: 500, label: "RESIDENTIAL", note: "home, park, cinema" },
  };

  return (
    <div onClick={() => dispatch({ type: "TOGGLE_MAP" })} style={{ position: "absolute", inset: 0, background: "rgba(10,5,20,0.85)", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(10px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: W, width: "100%" }}>
        <button onClick={() => dispatch({ type: "TOGGLE_MAP" })} style={{ position: "absolute", top: -10, right: -10, background: C.coral, color: "#fff", border: `3px solid ${C.surface}`, width: 44, height: 44, borderRadius: "50%", cursor: "pointer", fontSize: 22, fontFamily: FONT_M, fontWeight: 700, zIndex: 5, boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>×</button>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.5))" }}>
          <defs>
            <radialGradient id="paper" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#fff8ee" />
              <stop offset="60%" stopColor="#f0deb4" />
              <stop offset="100%" stopColor="#c4a070" />
            </radialGradient>
          </defs>

          {/* Paper background */}
          <path d="M 20 14 L 30 8 L 60 14 L 100 6 L 160 12 L 220 8 L 290 14 L 360 6 L 440 12 L 520 8 L 600 14 L 680 6 L 760 12 L 820 8 L 860 14 L 880 30 L 884 80 L 878 160 L 884 240 L 880 320 L 884 400 L 880 480 L 884 540 L 880 580 L 870 600 L 820 608 L 750 602 L 660 608 L 560 602 L 460 608 L 360 602 L 260 608 L 180 602 L 100 608 L 50 602 L 28 590 L 20 540 L 14 440 L 20 340 L 14 240 L 20 140 L 14 50 Z" fill="url(#paper)" stroke="#6a4828" strokeWidth="2" />

          {/* Coffee stain */}
          <ellipse cx="780" cy="80" rx="35" ry="28" fill="#a86b3a" opacity="0.15" />

          {/* Title cartouche */}
          <g transform="translate(450, 60)">
            <rect x="-180" y="-30" width="360" height="56" fill="#fff8ee" stroke="#6a4828" strokeWidth="2" rx="4" />
            <text x="0" y="-4" textAnchor="middle" fontFamily={FONT_H} fontSize="30" fontWeight="700" fill="#2a1438">Varena</text>
            <text x="0" y="16" textAnchor="middle" fontFamily={FONT_M} fontSize="8" fontWeight="700" fill="#6a4828" letterSpacing="0.3em">3 DISTRICTS · CHOOSE YOUR PATH</text>
          </g>

          {/* Tier separators */}
          {Object.entries(ZONE_ROWS).map(([zid, zr]) => {
            const tierLabel = zid === "work" ? "FINANCIAL DISTRICT" : zid === "city" ? "CITY CENTRE" : "RESIDENTIAL";
            // Player is in this tier if their x falls in the building cluster
            const inThis = (zid === "work" && state.px >= 3500) || (zid === "city" && state.px >= 1800 && state.px < 3500) || (zid === "home" && state.px < 1800);
            return (
              <g key={zid}>
                <path d={`M 70 ${zr.y} Q 250 ${zr.y - 10} 450 ${zr.y} Q 650 ${zr.y + 10} 830 ${zr.y}`} fill="none" stroke="#6a4828" strokeWidth="3" strokeDasharray="3,5" strokeLinecap="round" />
                <text x="70" y={zr.y - 56} fontFamily={FONT_H} fontSize="22" fill={inThis ? "#cc1d2a" : "#2a1438"} fontWeight="700">{tierLabel.toLowerCase()}</text>
                <text x="70" y={zr.y - 38} fontFamily={FONT_H} fontSize="12" fill="#6a4828" fontStyle="italic">{zr.note}</text>
                {inThis && <text x="225" y={zr.y - 56} fontFamily={FONT_H} fontSize="16" fill="#cc1d2a">← you're here</text>}
              </g>
            );
          })}

          {/* Hillside connecting line */}
          <g>
            <path d="M 780 170 L 770 200 L 780 230 L 770 260 L 780 290 L 770 320" fill="none" stroke="#6a4828" strokeWidth="2" />
            <text x="800" y="245" fontFamily={FONT_H} fontSize="12" fill="#6a4828" fontStyle="italic">hill path</text>
            <path d="M 130 350 L 120 380 L 130 410 L 120 440 L 130 470 L 120 500" fill="none" stroke="#6a4828" strokeWidth="2" />
            <text x="60" y="425" fontFamily={FONT_H} fontSize="12" fill="#6a4828" fontStyle="italic">hill path</text>
          </g>

          {/* Landmarks — assign each building to a row based on x */}
          {(() => {
            return BUILDINGS.map((p) => {
              const zid = p.x >= 3500 ? "work" : p.x >= 1800 ? "city" : "home";
              const row = ZONE_ROWS[zid];
              const startX = 150, endX = 750;
              const span = endX - startX;
              // Normalize x within tier range so they spread along the row
              const tierStart = zid === "work" ? 3500 : zid === "city" ? 1800 : 0;
              const tierEnd = zid === "work" ? WORLD_W : zid === "city" ? 3100 : 1400;
              const px = startX + ((p.x - tierStart) / (tierEnd - tierStart)) * span;
              const locked = p.id === "reserve" && state.dayPhase !== "work";
              const isQuest = QUESTS[state.activeQuest]?.target === p.id;
              const types = { tower: "tower", glass: "modern", classical: "classical", shop: "shop", cafe: "cafe", deco: "deco", home: "home", fountain: "plaza" };
              const type = types[p.type] || "shop";
              return (
                <g key={p.id} style={{ cursor: locked ? "not-allowed" : "pointer" }} onClick={() => !locked && dispatch({ type: "FAST_TRAVEL", x: p.x })}>
                  {isQuest && (
                    <circle cx={px} cy={row.y} r="26" fill={C.coral} opacity="0.25">
                      <animate attributeName="r" values="22;32;22" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <MapLandmark x={px} y={row.y} type={type} color={p.color || "#6a4828"} dark={p.dark || "#3a2418"} locked={locked} />
                  <g transform={`translate(${px}, ${row.y + 36})`}>
                    <rect x="-58" y="-2" width="116" height="18" fill="#fff8ee" opacity="0.9" rx="2" />
                    <text x="0" y="12" textAnchor="middle" fontFamily={FONT_H} fontSize="14" fontWeight="700" fill={locked ? "#8a7060" : "#2a1438"}>{locked ? "🔒 " : ""}{p.name}</text>
                  </g>
                </g>
              );
            });
          })()}

          {/* Player position marker */}
          {(() => {
            const zid = state.px >= 3500 ? "work" : state.px >= 1800 ? "city" : "home";
            const row = ZONE_ROWS[zid];
            const startX = 150, endX = 750;
            const tierStart = zid === "work" ? 3500 : zid === "city" ? 1800 : 0;
            const tierEnd = zid === "work" ? WORLD_W : zid === "city" ? 3100 : 1400;
            const px = startX + ((state.px - tierStart) / (tierEnd - tierStart)) * (endX - startX);
            return (
              <g transform={`translate(${px}, ${row.y - 24})`}>
                <circle r="11" fill={C.coral} stroke="#fff8ee" strokeWidth="2">
                  <animate attributeName="r" values="9;14;9" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <text x="0" y="-18" textAnchor="middle" fontFamily={FONT_H} fontSize="14" fontWeight="700" fill="#cc1d2a">you</text>
              </g>
            );
          })()}

          {/* Legend */}
          <g transform="translate(50, 560)">
            <rect width="200" height="48" fill="#fff8ee" stroke="#6a4828" strokeWidth="1.5" rx="3" />
            <text x="10" y="20" fontFamily={FONT_H} fontSize="14" fontWeight="700" fill="#2a1438">tap any place to travel</text>
            <text x="10" y="38" fontFamily={FONT_H} fontSize="13" fill="#3a2418">use stairs to change district</text>
          </g>

          {/* Compass mini */}
          <g transform="translate(800, 575)">
            <circle r="22" fill="#fff8ee" stroke="#6a4828" strokeWidth="1.5" />
            <polygon points="0,-20 4,0 0,20 -4,0" fill="#6a4828" />
            <polygon points="-20,0 0,-4 20,0 0,4" fill="#a86b3a" />
            <text x="0" y="-24" textAnchor="middle" fontFamily={FONT_D} fontSize="10" fontWeight="800" fill="#2a1438">N</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
function MapLandmark({ x, y, type, color, dark, locked }) {
  const c = locked ? "#a89878" : color;
  const d = locked ? "#6a5848" : dark;
  if (type === "tower") return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-12" y="-30" width="24" height="34" fill={c} stroke={d} strokeWidth="1.5" />
      <polygon points="-12,-30 0,-44 12,-30" fill={d} />
      <rect x="-2" y="-50" width="4" height="8" fill={d} />
      <rect x="-8" y="-22" width="3" height="5" fill={d} opacity="0.5" />
      <rect x="-2" y="-22" width="3" height="5" fill={d} opacity="0.5" />
      <rect x="5" y="-22" width="3" height="5" fill={d} opacity="0.5" />
      <rect x="-8" y="-12" width="3" height="5" fill={d} opacity="0.5" />
      <rect x="5" y="-12" width="3" height="5" fill={d} opacity="0.5" />
    </g>
  );
  if (type === "modern") return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-13" y="-26" width="26" height="30" fill={c} stroke={d} strokeWidth="1.5" />
      <rect x="-10" y="-22" width="6" height="6" fill="#fff8ee" opacity="0.7" />
      <rect x="-2" y="-22" width="6" height="6" fill="#fff8ee" opacity="0.7" />
      <rect x="6" y="-22" width="6" height="6" fill="#fff8ee" opacity="0.7" />
      <rect x="-10" y="-12" width="6" height="6" fill="#fff8ee" opacity="0.7" />
      <rect x="-2" y="-12" width="6" height="6" fill="#fff8ee" opacity="0.7" />
      <rect x="6" y="-12" width="6" height="6" fill="#fff8ee" opacity="0.7" />
    </g>
  );
  if (type === "classical") return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-14" y="-20" width="28" height="24" fill={c} stroke={d} strokeWidth="1.5" />
      <polygon points="-16,-20 0,-32 16,-20" fill={d} />
      <rect x="-10" y="-16" width="3" height="20" fill="#fff8ee" />
      <rect x="-3" y="-16" width="3" height="20" fill="#fff8ee" />
      <rect x="4" y="-16" width="3" height="20" fill="#fff8ee" />
      <circle cx="0" cy="-26" r="3" fill={C.gold} />
    </g>
  );
  if (type === "shop") return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-13" y="-18" width="26" height="22" fill={c} stroke={d} strokeWidth="1.5" />
      <polygon points="-15,-18 0,-28 15,-18" fill={d} />
      <rect x="-10" y="-14" width="20" height="3" fill="#fff8ee" />
      <rect x="-8" y="-8" width="6" height="6" fill="#fff8ee" />
      <rect x="2" y="-8" width="6" height="6" fill="#fff8ee" />
    </g>
  );
  if (type === "cafe") return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-12" y="-18" width="24" height="22" fill={c} stroke={d} strokeWidth="1.5" />
      <polygon points="-14,-18 0,-26 14,-18" fill={d} />
      <rect x="-7" y="-32" width="3" height="6" fill={d} />
      <circle cx="-5.5" cy="-34" r="2" fill="#bbb" opacity="0.6" />
      <rect x="-3" y="-10" width="6" height="14" fill="#fff8ee" />
    </g>
  );
  if (type === "deco") return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-13" y="-22" width="26" height="26" fill={c} stroke={d} strokeWidth="1.5" />
      <rect x="-15" y="-24" width="30" height="3" fill={d} />
      <circle cx="-8" cy="-20" r="1.5" fill={C.gold} />
      <circle cx="0" cy="-20" r="1.5" fill={C.gold} />
      <circle cx="8" cy="-20" r="1.5" fill={C.gold} />
      <rect x="-4" y="-12" width="8" height="16" fill={d} />
    </g>
  );
  if (type === "home") return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-12" y="-16" width="24" height="20" fill={c} stroke={d} strokeWidth="1.5" />
      <polygon points="-14,-16 0,-26 14,-16" fill={d} />
      <rect x="-3" y="-8" width="6" height="12" fill={d} />
      <rect x="-9" y="-10" width="4" height="4" fill="#fff8ee" />
      <rect x="5" y="-10" width="4" height="4" fill="#fff8ee" />
    </g>
  );
  if (type === "plaza") return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="14" fill={C.pavement} stroke={d} strokeWidth="1.5" />
      <circle r="7" fill="#5a9fd4" />
      <circle r="2" fill={C.gold} />
    </g>
  );
  return null;
}

// ─── HUD ────────────────────────────────────────────────────
function HUD({ state }) {
  const q = QUESTS[state.activeQuest];
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "14px 22px", display: "flex", gap: 14, alignItems: "flex-start", zIndex: 5, pointerEvents: "none" }}>
      {/* Logo block */}
      <div style={{ background: C.surface, padding: "8px 14px", borderRadius: 4, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.4)", border: `1.5px solid ${C.borderCream}` }}>
        <div style={{ width: 12, height: 28, background: C.coral, borderRadius: 1 }} />
        <div style={{ width: 12, height: 28, background: C.gold, borderRadius: 1 }} />
        <div style={{ width: 12, height: 28, background: C.teal, borderRadius: 1 }} />
        <div style={{ marginLeft: 6 }}>
          <div style={{ fontFamily: FONT_D, fontSize: 18, color: C.ink, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>GREAT VOSTAN</div>
          <div style={{ fontFamily: FONT_H, fontSize: 14, color: C.coral, fontWeight: 600, lineHeight: 1, marginTop: 1 }}>the living economy</div>
        </div>
      </div>

      {/* Day/time + zone block */}
      <div style={{ background: C.surface, padding: "10px 16px", borderRadius: 4, boxShadow: "0 6px 20px rgba(0,0,0,0.4)", border: `1.5px solid ${C.borderCream}` }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: state.dayPhase === "work" ? C.coral : C.teal, letterSpacing: "0.2em", fontWeight: 700 }}>{state.dayPhase === "work" ? "● TUESDAY · WORK" : "● MONDAY · DAY OFF"}</div>
        <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.ink, fontWeight: 700, lineHeight: 1.1 }}>{state.hour}:00 AM</div>
        <div style={{ fontFamily: FONT_M, fontSize: 8, color: C.purple, letterSpacing: "0.22em", fontWeight: 700, marginTop: 2 }}>📍 {areaAt(state.px)}</div>
      </div>

      {/* Life meters */}
      <div style={{ background: C.surface, padding: "10px 14px", borderRadius: 4, boxShadow: "0 6px 20px rgba(0,0,0,0.4)", border: `1.5px solid ${C.borderCream}`, display: "flex", gap: 16, alignItems: "center" }}>
        <Meter icon="💰" label="CASH" value={`₺${state.wallet}`} color={C.gold} numeric />
        <div style={{ width: 1, height: 26, background: C.borderCream }} />
        <Meter icon="😰" label="STRESS" pct={state.stress} color={state.stress > 70 ? C.coral : state.stress > 40 ? C.gold : C.teal} inverse />
        <Meter icon="😊" label="HAPPY" pct={state.happiness} color={C.rose} />
        <Meter icon="⚡" label="ENERGY" pct={state.energy} color={C.gold} />
      </div>

      <div style={{ flex: 1 }} />

      {/* Quest pill */}
      {q && (
        <div className="popupIn" style={{ background: C.surface, border: `1.5px solid ${C.coral}`, borderLeft: `5px solid ${C.coral}`, padding: "12px 18px", borderRadius: 4, maxWidth: 360, boxShadow: `0 8px 28px ${C.coral}55`, pointerEvents: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <span style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.28em", fontWeight: 800 }}>● CURRENT TASK</span>
            <span style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.2em", fontWeight: 700 }}>{state.completedQuests.length + 1} / 6</span>
          </div>
          <div style={{ fontFamily: FONT_D, fontSize: 17, color: C.ink, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.01em" }}>→ {q.title}</div>
          <div style={{ fontFamily: FONT_B, fontSize: 11.5, color: C.text, lineHeight: 1.4, marginTop: 4 }}>{q.desc}</div>
        </div>
      )}
    </div>
  );
}

function Meter({ icon, label, value, pct, color, numeric, inverse }) {
  return (
    <div style={{ minWidth: numeric ? 70 : 56 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{ fontFamily: FONT_M, fontSize: 8, color: C.textMuted, letterSpacing: "0.18em", fontWeight: 700 }}>{label}</span>
      </div>
      {numeric ? (
        <div style={{ fontFamily: FONT_D, fontSize: 16, color, fontWeight: 700, lineHeight: 1.1, marginTop: 1 }}>{value}</div>
      ) : (
        <div style={{ position: "relative", height: 6, background: C.surface3, borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
        </div>
      )}
    </div>
  );
}

// ─── PHONE ──────────────────────────────────────────────────
function PhoneWidget({ state, dispatch }) {
  const unread = !state.yusufReplied;
  return (
    <button onClick={() => dispatch({ type: "TOGGLE_PHONE" })} style={{ position: "absolute", bottom: 24, right: 24, width: 64, height: 96, background: C.ink, border: `2.5px solid ${unread ? C.coral : C.border}`, borderRadius: 12, cursor: "pointer", zIndex: 20, padding: 5, boxShadow: "0 8px 24px rgba(26,16,8,0.25)" }}>
      <div style={{ width: "100%", height: "100%", background: C.surface2, borderRadius: 7, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ fontSize: 24 }}>📱</div>
        <div style={{ fontSize: 8, fontFamily: FONT_M, color: C.textMuted, letterSpacing: "0.18em", marginTop: 3, fontWeight: 600 }}>PHONE</div>
        {unread && (
          <div style={{ position: "absolute", top: 3, right: 3, background: C.coral, color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontFamily: FONT_M, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.4s ease infinite" }}>!</div>
        )}
      </div>
    </button>
  );
}

function PhonePanel({ state, dispatch }) {
  const tab = state.phoneTab;
  const yusufReplies = [
    { text: "Cheers mate. Don't sell yet — let me look at the numbers this week.", rel: 10 },
    { text: "Honestly bro, I don't know yet. I'll know more by Friday.", rel: 6 },
  ];
  return (
    <div onClick={() => dispatch({ type: "TOGGLE_PHONE" })} style={{ position: "absolute", inset: 0, background: "rgba(26,16,8,0.45)", backdropFilter: "blur(8px)", zIndex: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: "100%", height: "85vh", maxHeight: 720, background: C.ink, border: `3px solid ${C.coral}`, borderRadius: 32, padding: 10, boxShadow: "0 30px 80px rgba(26,16,8,0.4)" }}>
        <div style={{ height: "100%", background: C.surface2, borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", fontFamily: FONT_M, fontSize: 11, color: C.ink, fontWeight: 600 }}>
            <span>8:00 AM · MON</span>
            <span style={{ color: C.coral }}>● Vostanian 5G</span>
          </div>
          <div style={{ display: "flex", gap: 4, padding: "8px 8px", borderBottom: `1px solid ${C.border}` }}>
            {[{ id: "msg", icon: "💬", label: "Messages" }, { id: "news", icon: "📰", label: "News" }, { id: "notes", icon: "📓", label: "Notes" }, { id: "wallet", icon: "💼", label: "Wallet" }].map((t) => (
              <button key={t.id} onClick={() => dispatch({ type: "SET_PHONE_TAB", tab: t.id })} style={{ flex: 1, background: tab === t.id ? C.coral : "transparent", color: tab === t.id ? C.surface : C.text, border: "none", padding: "8px 4px", fontFamily: FONT_M, fontSize: 10, cursor: "pointer", borderRadius: 6, fontWeight: 600 }}>
                <div style={{ fontSize: 14 }}>{t.icon}</div>{t.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "12px 10px" }}>
            {tab === "msg" && (
              <div style={{ background: C.surface, borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_D, fontWeight: 700, fontSize: 14 }}>Y</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Yusuf</div>
                    <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_M }}>Keldra · old mate</div>
                  </div>
                </div>
                {[
                  "Big day mate. Don't forget us when you're up in that tower 😅",
                  "Mortgage went up again Friday. Sara's saying we should sell.",
                  "Anyway. Smash it today. Proud of you.",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "flex-start", marginBottom: 5 }}>
                    <div style={{ background: C.surface3, padding: "8px 11px", borderRadius: "12px 12px 12px 4px", fontSize: 12.5, lineHeight: 1.4, maxWidth: "82%", color: C.text }}>{t}</div>
                  </div>
                ))}
                {state.yusufReplied ? (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
                    <div style={{ background: C.coral, color: "#fff", padding: "8px 11px", borderRadius: "12px 12px 4px 12px", fontSize: 12.5, maxWidth: "82%" }}>{yusufReplies[0].text}<div style={{ fontSize: 9, opacity: 0.7, marginTop: 3 }}>You · 8:08</div></div>
                  </div>
                ) : (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.coral, letterSpacing: "0.15em", marginBottom: 6, fontWeight: 700 }}>QUICK REPLY</div>
                    {yusufReplies.map((r, i) => (
                      <button key={i} onClick={() => dispatch({ type: "REPLY_YUSUF" })} style={{ display: "block", width: "100%", background: C.surface3, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", fontFamily: FONT_B, fontSize: 12, cursor: "pointer", borderRadius: 6, textAlign: "left", marginBottom: 5 }}>{r.text}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === "news" && (
              <div>
                <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.coral, letterSpacing: "0.2em", marginBottom: 8, fontWeight: 700 }}>THIS MORNING</div>
                {[
                  { p: "Vostan Times", t: `Inflation at ${pct(state.inflation)}: families squeezed`, c: C.coral },
                  { p: "Daily Marka", t: "MPC meets this week. Rate decision in spotlight.", c: C.gold },
                  { p: "Varena Post", t: "Cost of living tops public concern, polling shows", c: C.coral },
                  { p: "Markets", t: "Keldra Tech up 4% on AI deal. Rail stocks flat.", c: C.green },
                ].map((h, i) => (
                  <div key={i} style={{ background: C.surface, borderLeft: `3px solid ${h.c}`, padding: "10px 12px", marginBottom: 6, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, fontFamily: FONT_M, color: h.c, letterSpacing: "0.2em", marginBottom: 3, fontWeight: 700 }}>{h.p}</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 13, color: C.ink, lineHeight: 1.4 }}>{h.t}</div>
                  </div>
                ))}
                <div style={{ marginTop: 10, padding: 10, background: C.surface, borderRadius: 6, fontSize: 11, color: C.textMuted, lineHeight: 1.5, fontStyle: "italic" }}>
                  "Inflation" means prices are rising. When inflation is high, the same ₺10 buys less than it did a year ago.
                </div>
              </div>
            )}
            {tab === "notes" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 9, fontFamily: FONT_M, color: C.coral, letterSpacing: "0.2em", fontWeight: 700 }}>RESEARCH NOTEBOOK</span>
                  <span style={{ fontFamily: FONT_D, fontSize: 13, color: state.notes.length >= 3 ? C.green : C.ink, fontWeight: 600 }}>{state.notes.length} / 3+</span>
                </div>
                {state.notes.length === 0 ? (
                  <div style={{ padding: 30, textAlign: "center", color: C.textMuted, fontSize: 12, lineHeight: 1.6 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📓</div>
                    Empty for now. Talk to people on the street. Their words land here.
                  </div>
                ) : (
                  state.notes.map((n, i) => (
                    <div key={i} style={{ background: C.surface, padding: "10px 12px", marginBottom: 6, borderRadius: 6, borderLeft: `3px solid ${C.gold}` }}>
                      <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.gold, letterSpacing: "0.15em", marginBottom: 4, fontWeight: 700 }}>{n.from.toUpperCase()}</div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5, fontStyle: "italic" }}>"{n.text}"</div>
                    </div>
                  ))
                )}
                {state.notes.length >= 3 && !state.decisionDone && (
                  <div style={{ marginTop: 10, padding: 10, background: `${C.green}15`, border: `1.5px solid ${C.green}55`, borderRadius: 6, fontSize: 12, color: C.green, fontWeight: 600 }}>
                    ✓ Head back to the Reserve to make the call.
                  </div>
                )}
              </div>
            )}
            {tab === "wallet" && (
              <div>
                <div style={{ background: C.surface, padding: 16, borderRadius: 10, marginBottom: 10, border: `1.5px solid ${C.border}` }}>
                  <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.textMuted, letterSpacing: "0.2em", marginBottom: 4, fontWeight: 700 }}>IN YOUR POCKET</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 34, color: C.teal, fontWeight: 600, lineHeight: 1 }}>{fmt(state.wallet)}</div>
                </div>
                {state.bankSaved > 0 && (
                  <div style={{ background: C.surface, padding: 14, borderRadius: 10, marginBottom: 10, borderLeft: `3px solid ${C.gold}` }}>
                    <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.gold, letterSpacing: "0.2em", marginBottom: 4, fontWeight: 700 }}>SAVINGS</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.gold, fontWeight: 600 }}>{fmt(state.bankSaved)}</div>
                  </div>
                )}
                {Object.entries(state.holdings).filter(([, h]) => h).length > 0 && (
                  <div style={{ background: C.surface, padding: 14, borderRadius: 10, borderLeft: `3px solid ${C.blue}` }}>
                    <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.blue, letterSpacing: "0.2em", marginBottom: 6, fontWeight: 700 }}>PORTFOLIO</div>
                    {Object.entries(state.holdings).filter(([, h]) => h).map(([id, h]) => {
                      const stock = STOCKS_INIT.find((s) => s.id === id);
                      const val = state.stockPrices[id] * h.qty;
                      return (
                        <div key={id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                          <span style={{ color: C.text }}>{stock.name} × {h.qty}</span>
                          <span style={{ fontFamily: FONT_D, color: C.ink, fontWeight: 600 }}>{fmtD(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <button onClick={() => dispatch({ type: "TOGGLE_PHONE" })} style={{ width: 80, height: 5, background: C.border, border: "none", borderRadius: 3, cursor: "pointer" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PANEL SHELL ────────────────────────────────────────────
function PanelShell({ title, sub, onClose, accent = C.coral, children, wide }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(26,16,8,0.45)", backdropFilter: "blur(8px)", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 4, maxWidth: wide ? 720 : 560, width: "100%", maxHeight: "88vh", overflow: "auto", boxShadow: "0 24px 72px rgba(26,16,8,0.25)" }}>
        <div style={{ background: accent, height: 5 }} />
        <div style={{ padding: "26px 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: FONT_M, letterSpacing: "0.28em", color: accent, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>{sub}</div>
              <div style={{ fontFamily: FONT_D, fontSize: 30, color: C.ink, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.01em" }}>{title}</div>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: `1.5px solid ${C.border}`, color: C.text, width: 36, height: 36, borderRadius: 4, cursor: "pointer", fontSize: 18, fontFamily: FONT_M }}>×</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── MEETING (BRIEFING & REVIEW) ────────────────────────────
const BRIEFING_LINES = [
  { sp: "Nara", role: "Governor", c: C.teal, t: "Welcome to the Committee. You voted for the first time today — alongside the four of us. I'll skip the orientation: we have a real problem and the markets open in two hours." },
  { sp: "Vega", role: "Chief Economist", c: C.coral, t: "Inflation 4.2% last quarter. Food and energy leading. Growth is slowing. The country is hurting and patience is thin." },
  { sp: "Okafor", role: "Doves", c: C.blue, t: "You've been walking the city. You've seen Amara at the market. Yusuf with his mortgage. The students. The old man on the bench. The protester near our gates." },
  { sp: "Liana", role: "Communications", c: C.purple, t: "That counts for more than another spreadsheet. You felt it before you saw it from up here. Carry that in." },
  { sp: "Vega", role: "Chief Economist", c: C.coral, t: "You have six tools today. Bank rate. The balance sheet — QE or QT. The mix of assets we hold. Macroprudential. Innovation policy. Liquidity facilities. They have to point somewhere together." },
  { sp: "Nara", role: "Governor", c: C.teal, t: "There is no perfect call. Only the least bad one — and the clearest signal. Open the dashboard. The committee will lock in behind your direction." },
];
const REVIEW_LINES = [
  { sp: "Nara", role: "Governor", c: C.teal, t: "You're back. Good. What did you find?" },
  { sp: "Liana", role: "Communications", c: C.purple, t: "[Reading your notes] These are people, not numbers. That has weight." },
  { sp: "Vega", role: "Chief Economist", c: C.coral, t: "Right. Do these voices change what we should do?" },
  { sp: "Okafor", role: "Doves", c: C.blue, t: "If Amara folds because we raise too hard, we wear that. If prices keep climbing because we held, we wear that too." },
  { sp: "Nara", role: "Governor", c: C.teal, t: "There's no perfect call. Only the least bad one. It's yours to make." },
];

function MeetingRoom({ state, dispatch }) {
  const phase = state.meetingPhase; // briefing | act1 | act2 | act3 | outcome | review
  const showVitals = phase !== "briefing"; // committee table scene needs the full space
  return (
    <div style={{ position: "absolute", inset: 0, background: "#040714", zIndex: 35, display: "flex", flexDirection: "column" }}>
      {/* Letterbox bars */}
      <div style={{ background: "#000", height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● LIVE · MONETARY POLICY COMMITTEE</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>TUESDAY · 09:00 GMT · BANK OF VOSTAN</div>
      </div>

      {/* PULSE-INSPIRED: live vitals strip across all decision phases */}
      {showVitals && <EconomyVitals state={state} compact />}

      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #0a1230 0%, #1a2454 100%)" }}>
        {phase === "briefing" && <ActBriefing state={state} dispatch={dispatch} />}
        {phase === "rate" && <ActOne state={state} dispatch={dispatch} />}
        {phase === "rateReaction" && <ActRateReaction state={state} dispatch={dispatch} />}
        {phase === "hub" && <ActHub state={state} dispatch={dispatch} />}
        {phase === "qe" && <ActQE state={state} dispatch={dispatch} />}
        {phase === "guidance" && <ActGuidance state={state} dispatch={dispatch} />}
        {phase === "macropru" && <ActMacroPru state={state} dispatch={dispatch} />}
        {phase === "outcome" && <ActOutcome state={state} dispatch={dispatch} />}
        {phase === "review" && <ActReview state={state} dispatch={dispatch} />}
        <ScanLineOverlay />
      </div>

      {/* Bottom letterbox bar */}
      <div style={{ background: "#000", height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>LIFESMART × BANK OF ENGLAND · PROTOTYPE v26</div>
        <div style={{ display: "flex", gap: 5 }}>
          {["briefing","rate","rateReaction","hub","outcome"].map((p, i) => (
            <div key={p} style={{ width: 28, height: 3, background: p === phase ? C.coral : state.completedMeetingPhases?.includes(p) ? C.gold : "rgba(255,255,255,0.15)", borderRadius: 1 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ACT: BRIEFING ──────────────────────────────────────────
function ActBriefing({ state, dispatch }) {
  const step = state.meetingStep;
  const lines = state.meetingPhase === "review" ? REVIEW_LINES : BRIEFING_LINES;
  const cur = lines[step] || lines[0];
  const currentName = cur?.sp?.toLowerCase() || "";

  // CINEMATIC: when the player first enters the chamber, all five spotlights pulse together
  // for ~2 seconds before settling into single-speaker mode. Records beautifully.
  const [ceremonial, setCeremonial] = useState(step === 0 && state.meetingPhase !== "review");
  useEffect(() => {
    if (!ceremonial) return;
    const t = setTimeout(() => setCeremonial(false), 2200);
    return () => clearTimeout(t);
  }, [ceremonial]);

  // Member seats around a long oak table — lifted UP so the bottom dialogue card doesn't cover them
  const seats = [
    { id: "vega",   x: 130, y: 230, name: "VEGA",   role: "ECONOMIST",   c: C.coral,  hair: "#1a0c08", side: "left" },
    { id: "okafor", x: 280, y: 260, name: "OKAFOR", role: "DOVE",        c: C.blue,   hair: "#2a1810", side: "left" },
    { id: "nara",   x: 500, y: 280, name: "NARA",   role: "GOVERNOR",    c: C.teal,   hair: "#1a0c08", side: "head" },
    { id: "liana",  x: 720, y: 260, name: "LIANA",  role: "COMMS",       c: C.purple, hair: "#3a1818", side: "right" },
    { id: "hilal",  x: 870, y: 230, name: "HILAL",  role: "STABILITY",   c: C.gold,   hair: "#e8ddc8", side: "right" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "#080c1f", overflow: "hidden" }}>
      {/* ───────── Wood-panelled committee chamber ───────── */}
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1224" />
            <stop offset="50%" stopColor="#2a1f3a" />
            <stop offset="100%" stopColor="#1a1224" />
          </linearGradient>
          <linearGradient id="tableGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d2810" />
            <stop offset="100%" stopColor="#2a1808" />
          </linearGradient>
          <radialGradient id="chandelier" cx="0.5" cy="0.4">
            <stop offset="0%" stopColor={C.goldBright} stopOpacity="1" />
            <stop offset="60%" stopColor={C.gold} stopOpacity="0.3" />
            <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Wood-panelled back wall */}
        <rect x="0" y="0" width="1000" height="450" fill="url(#wallGrad)" />
        {/* Vertical wood panel divisions */}
        {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((x, i) => (
          <g key={i}>
            <rect x={x} y="0" width="2" height="450" fill="#000" opacity="0.35" />
            <rect x={x + 8} y="50" width="80" height="350" fill="none" stroke="#5a3818" strokeWidth="1" opacity="0.4" />
          </g>
        ))}
        {/* Floor / dais */}
        <rect x="0" y="450" width="1000" height="150" fill="#1a0e08" />
        <rect x="0" y="450" width="1000" height="3" fill={C.gold} opacity="0.6" />

        {/* Chandelier glow */}
        <ellipse cx="500" cy="0" rx="500" ry="180" fill="url(#chandelier)" />
        {/* Hanging chandelier */}
        <line x1="500" y1="0" x2="500" y2="40" stroke={C.gold} strokeWidth="1" />
        <circle cx="500" cy="48" r="14" fill={C.gold} />
        <circle cx="500" cy="48" r="10" fill={C.goldBright} />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => {
          const rad = (a * Math.PI) / 180;
          const x = 500 + Math.cos(rad) * 28;
          const y = 48 + Math.sin(rad) * 14;
          return <circle key={a} cx={x} cy={y} r="2" fill={C.goldBright} />;
        })}

        {/* Framed portraits on wall */}
        {[
          { x: 80, name: "GOV. HADI", years: "1998-2007" },
          { x: 250, name: "GOV. ABARO", years: "2007-2014" },
          { x: 420, name: "BoE CREST", years: "—" },
          { x: 590, name: "GOV. KESEDE", years: "2014-2021" },
          { x: 760, name: "GOV. NIYI", years: "2021-2024" },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x}, 55)`}>
            <rect x="0" y="0" width="120" height="150" fill="#0a0408" stroke={C.gold} strokeWidth="3" />
            <rect x="6" y="6" width="108" height="138" fill="#2a1f3a" />
            {/* Portrait silhouette */}
            <ellipse cx="60" cy="72" rx="28" ry="36" fill="#c4956a" opacity="0.4" />
            <path d="M 32 60 Q 30 35 60 32 Q 90 35 88 60 L 86 78 Q 74 72 60 72 Q 46 72 34 78 Z" fill="#1a0c08" opacity="0.4" />
            <rect x="36" y="100" width="48" height="40" fill={i === 2 ? C.coral : C.bg2} opacity="0.6" />
            {/* Plaque */}
            <rect x="0" y="150" width="120" height="14" fill={C.gold} />
            <text x="60" y="160" textAnchor="middle" fill={C.ink} fontFamily={FONT_M} fontSize="7" fontWeight="800" letterSpacing="0.1em">{p.name}</text>
          </g>
        ))}

        {/* Light shafts down through the room */}
        <polygon points="200,0 280,0 240,500 100,500" fill="#fff8ee" opacity="0.06" />
        <polygon points="750,0 850,0 920,500 720,500" fill="#fff8ee" opacity="0.06" />

        {/* The long oak table — perspective ellipse */}
        <ellipse cx="500" cy="520" rx="480" ry="38" fill="url(#tableGrad)" />
        <ellipse cx="500" cy="510" rx="470" ry="32" fill="#5a3a18" />
        <ellipse cx="500" cy="505" rx="460" ry="26" fill="#3d2810" />
        {/* Table reflection highlights */}
        <ellipse cx="320" cy="500" rx="120" ry="3" fill={C.goldBright} opacity="0.15" />
        <ellipse cx="680" cy="500" rx="120" ry="3" fill={C.goldBright} opacity="0.15" />

        {/* Papers, water glasses, laptops scattered on table */}
        {[180, 380, 580, 780].map((x, i) => (
          <g key={`item-${i}`} transform={`translate(${x}, 490)`}>
            {/* Paper */}
            <rect x="-12" y="0" width="22" height="14" fill="#fff8ee" opacity="0.85" transform="rotate(-3)" />
            <rect x="-10" y="2" width="18" height="1" fill={C.ink} opacity="0.3" transform="rotate(-3)" />
            <rect x="-10" y="5" width="14" height="1" fill={C.ink} opacity="0.3" transform="rotate(-3)" />
            <rect x="-10" y="8" width="16" height="1" fill={C.ink} opacity="0.3" transform="rotate(-3)" />
          </g>
        ))}
        {/* Water glasses */}
        {[230, 430, 630, 830].map((x, i) => (
          <g key={`glass-${i}`} transform={`translate(${x}, 488)`}>
            <ellipse cx="0" cy="0" rx="5" ry="2" fill="#b8e0f0" opacity="0.4" />
            <path d="M -4 0 L -3 -10 L 3 -10 L 4 0 Z" fill="#b8e0f0" opacity="0.55" stroke="#fff" strokeWidth="0.3" />
            <ellipse cx="0" cy="-10" rx="3" ry="1" fill="#7ac0e0" opacity="0.6" />
          </g>
        ))}
        {/* Laptop in front of governor */}
        <g transform="translate(500, 482)">
          <rect x="-22" y="-4" width="44" height="14" fill="#1a0e1a" rx="1" />
          <rect x="-20" y="-2" width="40" height="10" fill={C.teal} opacity="0.6" />
          <rect x="-22" y="10" width="44" height="3" fill="#0a0408" />
        </g>

        {/* ───────── Committee members seated ───────── */}
        {seats.map((s) => {
          const isCurrent = currentName === s.id;
          const showSpotlight = isCurrent || ceremonial;
          return (
            <g key={s.id} transform={`translate(${s.x}, ${s.y})`}>
              {/* Spotlight beam from above — current speaker, OR all 5 during ceremonial entry */}
              {showSpotlight && (
                <g style={{ pointerEvents: "none" }}>
                  <defs>
                    <linearGradient id={`spot-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.c} stopOpacity="0" />
                      <stop offset="40%" stopColor={s.c} stopOpacity={ceremonial ? "0.22" : "0.18"} />
                      <stop offset="100%" stopColor={s.c} stopOpacity={ceremonial ? "0.55" : "0.45"} />
                    </linearGradient>
                  </defs>
                  <polygon points={`-12,-${s.y - 5} 12,-${s.y - 5} 50,40 -50,40`} fill={`url(#spot-${s.id})`}>
                    {ceremonial ? (
                      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" />
                    ) : (
                      <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite" />
                    )}
                  </polygon>
                </g>
              )}
              {/* Pulse ring — current speaker, OR all 5 during ceremonial */}
              {showSpotlight && (
                <circle r="58" fill={s.c} opacity="0.2">
                  <animate attributeName="r" values="48;68;48" dur={ceremonial ? "1.4s" : "1.8s"} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.1;0.3;0.1" dur={ceremonial ? "1.4s" : "1.8s"} repeatCount="indefinite" />
                </circle>
              )}
              {/* Chair back */}
              <rect x="-26" y="40" width="52" height="80" fill="#3a2818" rx="3" />
              <rect x="-22" y="44" width="44" height="72" fill="#5a3a20" rx="2" />
              <rect x="-22" y="44" width="44" height="20" fill="#2a1808" opacity="0.4" />
              {/* Body suit */}
              <path d="M -22 25 Q -22 10 -10 8 L 10 8 Q 22 10 22 25 L 26 70 Q 8 78 0 78 Q -8 78 -26 70 Z" fill={s.c} />
              {/* Lapel */}
              <path d="M 0 14 L -5 24 L 0 32 Z" fill="#0a0408" opacity="0.3" />
              <path d="M 0 14 L 5 24 L 0 32 Z" fill="#0a0408" opacity="0.15" />
              {/* Collar/shirt */}
              <path d="M -7 10 L 0 16 L 7 10 L 6 14 L 0 19 L -6 14 Z" fill="#fff8ee" />
              {/* Neck */}
              <rect x="-3" y="0" width="6" height="9" fill="#c4956a" />
              {/* Head */}
              <ellipse cx="0" cy="-12" rx="13" ry="16" fill="#c4956a" />
              {/* Hair varies per member */}
              {s.id === "hilal" && (
                <>
                  <path d="M -11 -15 Q -10 -25 0 -26 Q 10 -25 11 -15" fill={s.hair} />
                  <ellipse cx="-9" cy="-12" rx="3" ry="4" fill={s.hair} />
                  <ellipse cx="9" cy="-12" rx="3" ry="4" fill={s.hair} />
                </>
              )}
              {s.id === "nara" && (
                <>
                  <path d="M -12 -18 Q -13 -28 0 -29 Q 13 -28 12 -18 L 12 -8 Q 6 -10 0 -10 Q -6 -10 -12 -8 Z" fill={s.hair} />
                  <path d="M -12 -12 Q -16 -2 -14 8" fill={s.hair} />
                  <path d="M 12 -12 Q 16 -2 14 8" fill={s.hair} />
                </>
              )}
              {s.id === "vega" && (
                <>
                  <path d="M -12 -16 Q -12 -27 0 -28 Q 12 -27 12 -16 L 11 -8 Q 6 -10 0 -10 Q -6 -10 -11 -8 Z" fill={s.hair} />
                </>
              )}
              {s.id === "okafor" && (
                <>
                  <path d="M -11 -16 Q -11 -25 0 -26 Q 11 -25 11 -16" fill={s.hair} />
                  <ellipse cx="0" cy="-25" rx="11" ry="4" fill={s.hair} />
                </>
              )}
              {s.id === "liana" && (
                <>
                  <path d="M -12 -16 Q -13 -27 0 -28 Q 13 -27 12 -16 L 14 -2 Q 8 -8 0 -8 Q -8 -8 -14 -2 Z" fill={s.hair} />
                  <ellipse cx="-1" cy="-30" rx="4" ry="2" fill={C.coral} opacity="0.7" />
                </>
              )}
              {/* Glasses for Hilal */}
              {s.id === "hilal" && (
                <>
                  <circle cx="-4" cy="-12" r="3" fill="none" stroke="#0a0408" strokeWidth="0.7" />
                  <circle cx="4" cy="-12" r="3" fill="none" stroke="#0a0408" strokeWidth="0.7" />
                  <line x1="-1" y1="-12" x2="1" y2="-12" stroke="#0a0408" strokeWidth="0.5" />
                  <circle cx="-4" cy="-12" r="0.7" fill="#0a0408" />
                  <circle cx="4" cy="-12" r="0.7" fill="#0a0408" />
                </>
              )}
              {/* Eyes (non-glasses members) */}
              {s.id !== "hilal" && (
                <>
                  <ellipse cx="-4" cy="-12" rx="1.2" ry="1.5" fill="#0a0408" />
                  <ellipse cx="4" cy="-12" rx="1.2" ry="1.5" fill="#0a0408" />
                </>
              )}
              {/* Mouth — open if speaking */}
              {isCurrent ? (
                <ellipse cx="0" cy="-5" rx="2" ry="1.4" fill="#3a1808">
                  <animate attributeName="ry" values="0.5;1.6;0.5" dur="0.4s" repeatCount="indefinite" />
                </ellipse>
              ) : (
                <path d="M -2 -5 Q 0 -4 2 -5" stroke="#3a1808" strokeWidth="0.7" fill="none" strokeLinecap="round" />
              )}
              {/* Name plaque on table edge */}
              <rect x="-30" y="80" width="60" height="14" fill="#0a0408" stroke={s.c} strokeWidth="1" />
              <text x="0" y="90" textAnchor="middle" fill={s.c} fontFamily={FONT_M} fontSize="7.5" fontWeight="800" letterSpacing="0.16em">{s.name}</text>
            </g>
          );
        })}
      </svg>

      {/* Floating dust motes */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <circle key={i} cx={(i * 137) % 1000} cy={50 + (i * 89) % 300} r={0.5 + (i % 3) * 0.3} fill="#fff8ee" opacity="0.5">
            <animate attributeName="cy" values={`${50 + (i * 89) % 300};${80 + (i * 89) % 300};${50 + (i * 89) % 300}`} dur={`${5 + (i % 5)}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Letterbox top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 36, background: "#000", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● LIVE · MONETARY POLICY COMMITTEE</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>FLOOR 8 · BANK OF VOSTAN</div>
      </div>

      {/* CEREMONIAL ENTRY BADGE — visible for the first ~2s while all spotlights pulse */}
      {ceremonial && (
        <div style={{
          position: "absolute", top: "42%", left: "50%", transform: "translate(-50%, -50%)",
          textAlign: "center", zIndex: 5,
          animation: "fadeIn 0.5s ease-out",
          pointerEvents: "none",
        }}>
          <div style={{ fontFamily: FONT_M, fontSize: 12, color: C.gold, letterSpacing: "0.45em", fontWeight: 800, marginBottom: 8 }}>● ASSEMBLED</div>
          <div style={{ fontFamily: FONT_D, fontSize: 72, color: C.textCream, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.9, textShadow: "0 12px 60px rgba(0,0,0,0.8)" }}>The Committee.</div>
          <div style={{ fontFamily: FONT_D, fontSize: 18, color: C.gold, fontWeight: 600, fontStyle: "italic", marginTop: 12, letterSpacing: "-0.005em" }}>Five votes. One decision. Ten million lives.</div>
        </div>
      )}

      {/* Dialogue card — bottom strip, more compact so committee remains visible.
          Hidden during ceremonial entry so the assembled-committee shot can breathe. */}
      {cur && !ceremonial && (
        <div key={step} className="popupIn" style={{
          position: "absolute", bottom: 56, left: "50%", transform: "translateX(-50%)",
          width: "min(840px, 88%)", background: "rgba(8,8,16,0.92)",
          borderTop: `3px solid ${cur.c}`, borderRadius: 4, padding: "14px 22px",
          boxShadow: "0 -16px 50px rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: cur.c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_D, fontWeight: 800, fontSize: 16 }}>{cur.sp[0]}</div>
            <div>
              <div style={{ fontFamily: FONT_D, fontSize: 15, color: C.surface, fontWeight: 800, lineHeight: 1 }}>{cur.sp}</div>
              <div style={{ fontFamily: FONT_M, fontSize: 8, color: cur.c, letterSpacing: "0.22em", fontWeight: 800, marginTop: 3 }}>{cur.role.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ fontFamily: FONT_D, fontSize: 17, color: C.textCream, lineHeight: 1.35, fontWeight: 500, letterSpacing: "-0.005em" }}>
            {cur.t}
          </div>
        </div>
      )}

      {/* Continue button + progress dots */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "#000", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {lines.map((_, i) => (
            <div key={i} style={{ width: 24, height: 3, background: i === step ? C.coral : i < step ? C.gold : "rgba(255,255,255,0.15)", borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => dispatch({ type: "MEETING_PHASE", phase: "rate" })} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid rgba(245,184,46,0.3)`, padding: "10px 20px", fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", cursor: "pointer", borderRadius: 2 }}>
            SKIP TO RATE →→
          </button>
          <button onClick={() => {
            if (step < lines.length - 1) dispatch({ type: "MEETING_NEXT" });
            else dispatch({ type: "MEETING_PHASE", phase: "rate" });
          }} style={{ background: C.coral, color: "#fff", border: "none", padding: "12px 28px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>
            {step < lines.length - 1 ? "CONTINUE →" : "ACT I · THE RATE →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ACT I: THE RATE ────────────────────────────────────────
// ─── ACT I: THE RATE (multi-option, click to set) ──────────
function ActOne({ state, dispatch }) {
  const [hovered, setHovered] = useState(null);
  const options = [
    { id: "cut-hard", title: "CUT HARD", subtitle: "to 1.0%", rate: 1.0, color: C.teal, icon: "🕊",
      line: "Slash rates. Stimulate growth. Pray on inflation.",
      reaction: "DISASTER", impactChips: [{ k: "Inflation", v: "↑↑ ~6.5%", bad: true }, { k: "Borrowers", v: "Cheer", bad: false }, { k: "Pensions", v: "Crushed", bad: true }],
      good: false, tag: "POPULIST" },
    { id: "cut", title: "CUT", subtitle: "to 2.5%", rate: 2.5, color: C.blue, icon: "🌿",
      line: "Ease cautiously. Show we care about growth too.",
      reaction: "MIXED", impactChips: [{ k: "Inflation", v: "Drifts up", bad: true }, { k: "Mortgages", v: "−₺60/mo", bad: false }, { k: "Markets", v: "Cautious", bad: null }],
      good: null, tag: "DOVISH" },
    { id: "hold", title: "HOLD", subtitle: "at 3.0%", rate: 3.0, color: C.gold, icon: "⚖",
      line: "Wait. Watch. Don't shock the patient.",
      reaction: "CALM", impactChips: [{ k: "Inflation", v: "~4% steady", bad: null }, { k: "Markets", v: "Steady", bad: false }, { k: "Critics", v: "'Indecisive'", bad: true }],
      good: null, tag: "WAIT-AND-SEE" },
    { id: "raise", title: "RAISE", subtitle: "to 4.5%", rate: 4.5, color: C.coral, icon: "🦅",
      line: "Tighten. The job is price stability. Do the job.",
      reaction: "TOUGH", impactChips: [{ k: "Inflation", v: "↓ ~3.1%", bad: false }, { k: "Mortgages", v: "+₺240/mo", bad: true }, { k: "Unemp.", v: "+0.8pp", bad: true }],
      good: true, tag: "HAWKISH" },
    { id: "raise-hard", title: "RAISE HARD", subtitle: "to 6.0%", rate: 6.0, color: C.red, icon: "⚡",
      line: "Crush inflation in one blow. Volcker move.",
      reaction: "DISASTER", impactChips: [{ k: "Inflation", v: "↓↓ recession", bad: true }, { k: "Mortgages", v: "+₺540/mo", bad: true }, { k: "Distress", v: "Mass", bad: true }],
      good: false, tag: "SHOCK" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 50px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1px solid rgba(245,184,46,0.12)` }}>
        <div>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● DECISION 1 OF 4 · THE RATE</div>
          <div style={{ fontFamily: FONT_D, fontSize: 46, color: C.surface, fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1, marginTop: 6 }}>Set the policy rate.</div>
          <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.coral, fontWeight: 600, fontStyle: "italic", marginTop: 8, letterSpacing: "-0.005em" }}>"Every quarter-point ripples through ten million lives."</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.24em", fontWeight: 700 }}>HOVER TO PROJECT</div>
          <div style={{ fontFamily: FONT_D, fontSize: 14, color: hovered ? C.gold : C.textCreamDim, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 4 }}>{hovered ? `→ If you ${options.find(o => o.id === hovered)?.title.toLowerCase()}` : "Showing current state"}</div>
        </div>
      </div>

      {/* MAIN ROW: rate options (left) + transmission network (right) */}
      <div style={{ flex: 1, display: "flex", gap: 16, padding: "16px 30px 16px", minHeight: 0 }}>
        {/* Rate option cards */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          {options.map((o) => {
            const isHover = hovered === o.id;
            return (
              <div key={o.id}
                   onMouseEnter={() => setHovered(o.id)}
                   onMouseLeave={() => setHovered(null)}
                   onClick={() => {
                     dispatch({ type: "SET_POLICY", tool: "rate", value: o.rate });
                     dispatch({ type: "SET_POLICY", tool: "actOne", value: o.id });
                     dispatch({ type: "SET_POLICY", tool: "rateGood", value: o.good });
                     dispatch({ type: "MEETING_PHASE", phase: "rateReaction" });
                   }}
                   className="popupIn"
                   style={{
                     flex: 1, position: "relative", overflow: "hidden",
                     background: isHover ? `linear-gradient(90deg, ${o.color} 0%, ${o.color}cc 100%)` : "rgba(8,12,30,0.5)",
                     border: `2px solid ${isHover ? o.color : `${o.color}55`}`,
                     borderLeft: `6px solid ${o.color}`,
                     borderRadius: 4, padding: "14px 22px", cursor: "pointer", transition: "all 0.2s",
                     transform: isHover ? "translateX(10px)" : "translateX(0)",
                     boxShadow: isHover ? `0 14px 50px ${o.color}88, inset 0 0 0 1px rgba(255,255,255,0.2)` : `0 4px 16px rgba(0,0,0,0.4)`,
                     display: "flex", alignItems: "center", gap: 22,
                   }}>
                {/* Big background rate number — much more dramatic */}
                <div style={{ position: "absolute", right: -12, bottom: -28, fontFamily: FONT_D, fontSize: 140, fontWeight: 900, color: "#fff", opacity: isHover ? 0.18 : 0.08, lineHeight: 1, pointerEvents: "none", letterSpacing: "-0.06em" }}>{o.rate.toFixed(1)}</div>

                {/* LEFT: icon + label */}
                <div style={{ minWidth: 200, position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 8,
                    background: isHover ? "rgba(255,255,255,0.18)" : `${o.color}22`,
                    border: `2px solid ${isHover ? "rgba(255,255,255,0.5)" : o.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                    flexShrink: 0,
                  }}>{o.icon}</div>
                  <div>
                    <div style={{ fontFamily: FONT_M, fontSize: 8.5, color: isHover ? "rgba(255,255,255,0.85)" : C.textCreamDim, letterSpacing: "0.24em", fontWeight: 800 }}>OPTION</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 24, color: isHover ? "#fff" : C.surface, fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1, marginTop: 2 }}>{o.title}</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 14, color: isHover ? "rgba(255,255,255,0.9)" : o.color, fontWeight: 800, marginTop: 2 }}>{o.subtitle}</div>
                  </div>
                </div>

                {/* MIDDLE: quote + impact chips */}
                <div style={{ flex: 1, position: "relative", minWidth: 0, paddingRight: 90 }}>
                  <div style={{ fontFamily: FONT_D, fontSize: 14.5, color: isHover ? "#fff" : C.textCream, fontWeight: 600, lineHeight: 1.35, fontStyle: "italic", letterSpacing: "-0.005em" }}>"{o.line}"</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {o.impactChips.map((chip, i) => {
                      const tone = chip.bad === true ? C.coral : chip.bad === false ? C.teal : null;
                      return (
                        <span key={i} style={{
                          fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                          padding: "3px 8px", borderRadius: 2,
                          background: isHover ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.06)",
                          color: isHover ? "#fff" : C.textCream,
                          borderLeft: tone ? `2px solid ${tone}` : `2px solid rgba(255,255,255,0.2)`,
                        }}>
                          <span style={{ opacity: 0.7 }}>{chip.k}: </span>
                          <strong style={{ fontWeight: 800 }}>{chip.v}</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT: tag pill */}
                <div style={{
                  padding: "5px 12px",
                  background: isHover ? "rgba(0,0,0,0.3)" : `${o.color}22`,
                  borderRadius: 2, position: "relative", flexShrink: 0,
                  border: `1px solid ${isHover ? "rgba(255,255,255,0.3)" : `${o.color}55`}`,
                }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: isHover ? "#fff" : o.color, letterSpacing: "0.26em", fontWeight: 800 }}>{o.tag}</div>
                </div>

                {/* Hover arrow */}
                {isHover && (
                  <div style={{ position: "absolute", right: 18, top: 14, fontFamily: FONT_M, fontSize: 11, color: "#fff", letterSpacing: "0.22em", fontWeight: 800, animation: "pulse 1.4s infinite" }}>COMMIT →</div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: live transmission diagram + projected vitals */}
        <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <MiniTransmission state={state} hoveredRate={hovered ? options.find(o => o.id === hovered)?.rate : undefined} label={hovered ? "PREVIEW" : "CURRENT"} />
          {hovered && (
            <div className="popupIn" style={{ background: "rgba(8,12,30,0.85)", border: `2px solid ${options.find(o => o.id === hovered).color}66`, borderTop: `4px solid ${options.find(o => o.id === hovered).color}`, padding: "14px 16px", borderRadius: 4 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: options.find(o => o.id === hovered).color, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 8 }}>◆ DIAGNOSIS AT THIS RATE</div>
              {(() => {
                const o = options.find(opt => opt.id === hovered);
                const proj = computeVitals(state, o.rate);
                const dInfl = proj.inflation - computeVitals(state).inflation;
                const dGdp  = proj.gdp - computeVitals(state).gdp;
                const dUnemp= proj.unemp - computeVitals(state).unemp;
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div><div style={{ fontSize: 8.5, color: C.textCreamDim, letterSpacing: "0.18em", fontFamily: FONT_M, fontWeight: 700 }}>INFL</div><div style={{ fontFamily: FONT_D, fontSize: 22, color: proj.inflation > 3 ? C.coral : C.teal, fontWeight: 900, letterSpacing: "-0.01em" }}>{proj.inflation.toFixed(1)}%</div><div style={{ fontFamily: FONT_M, fontSize: 9, color: dInfl < 0 ? C.teal : C.coral, fontWeight: 800 }}>{dInfl > 0 ? "▲" : "▼"} {Math.abs(dInfl).toFixed(1)}</div></div>
                    <div><div style={{ fontSize: 8.5, color: C.textCreamDim, letterSpacing: "0.18em", fontFamily: FONT_M, fontWeight: 700 }}>GDP</div><div style={{ fontFamily: FONT_D, fontSize: 22, color: proj.gdp < 1 ? C.coral : C.teal, fontWeight: 900, letterSpacing: "-0.01em" }}>{proj.gdp.toFixed(1)}%</div><div style={{ fontFamily: FONT_M, fontSize: 9, color: dGdp > 0 ? C.teal : C.coral, fontWeight: 800 }}>{dGdp > 0 ? "▲" : "▼"} {Math.abs(dGdp).toFixed(1)}</div></div>
                    <div><div style={{ fontSize: 8.5, color: C.textCreamDim, letterSpacing: "0.18em", fontFamily: FONT_M, fontWeight: 700 }}>UNEMP</div><div style={{ fontFamily: FONT_D, fontSize: 22, color: proj.unemp > 5.5 ? C.coral : C.teal, fontWeight: 900, letterSpacing: "-0.01em" }}>{proj.unemp.toFixed(1)}%</div><div style={{ fontFamily: FONT_M, fontSize: 9, color: dUnemp < 0 ? C.teal : C.coral, fontWeight: 800 }}>{dUnemp > 0 ? "▲" : "▼"} {Math.abs(dUnemp).toFixed(1)}</div></div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 50px 14px", textAlign: "center", borderTop: `1px solid rgba(245,184,46,0.12)`, paddingTop: 12 }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em", fontWeight: 700 }}>● HOVER A CARD TO SEE THE PROJECTION ● CLICK TO COMMIT</div>
      </div>
    </div>
  );
}

// ─── RATE REACTION SCENE ──────────────────────────────────
function ActRateReaction({ state, dispatch }) {
  const a1 = state.policy?.actOne;
  const isBad = state.policy?.rateGood === false;
  const isGood = state.policy?.rateGood === true;
  const isCut = a1 === "cut-hard" || a1 === "cut";
  const isHike = a1 === "raise" || a1 === "raise-hard";
  const isHold = a1 === "hold";

  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => Math.min(s + 1, 5)), 700);
    return () => clearInterval(iv);
  }, []);

  // Composed reaction wall
  const reactions = [
    { type: "headline", color: a1 === "cut-hard" ? C.red : isHike ? C.coral : a1 === "cut" ? C.teal : C.gold,
      who: "VOSTAN TIMES · BREAKING",
      text: a1 === "cut-hard" ? "RESERVE CUTS HARD — INFLATION FEARS EXPLODE" :
            a1 === "cut" ? "RESERVE EASES — MORTGAGE RELIEF, INFLATION DOUBT" :
            a1 === "hold" ? "RESERVE HOLDS — 'PARALYSIS' SAYS PRESS" :
            a1 === "raise" ? "RESERVE STRIKES — DECISIVE HIKE TO 4.5%" :
            "RESERVE GOES NUCLEAR — 6% SHOCKS MARKETS" },
    { type: "person", color: C.coral, name: "YUSUF · MORTGAGE",
      text: isHike ? (a1 === "raise-hard" ? "We're selling. Today." : "Another ₺240. I'll find a way.") :
            isCut ? "I can breathe. Thank you." : "Holding pattern. Better than worse." },
    { type: "person", color: C.teal, name: "MR HALIM · PENSIONER",
      text: isCut ? "My pension just halved. You promised stability." :
            isHike ? "First proper interest in a decade. Thank you." : "Boring is a gift. I'll take it." },
    { type: "person", color: C.purple, name: "MARKETS · OPENING PRINT",
      text: a1 === "cut-hard" ? "Marka tanks 4% vs dollar. Bond yields spike." :
            a1 === "raise-hard" ? "Stocks down 6%. Bank stocks down 11%. Carnage." :
            isHike ? "Banks up. Builders down. The usual." :
            isCut ? "Bonds rally. Currency wobbly." : "Quiet. Spreads where they were." },
    { type: "headline", color: isBad ? C.red : C.gold,
      who: a1 === "cut-hard" ? "STREET · 'PROTEST AT THE GATES'" :
           a1 === "raise-hard" ? "RIVERSIDE · 'EVICTION NOTICES UP 340%'" :
           "PUBLIC MOOD · MIXED",
      text: isBad ? "Crowds gathering at the Reserve gates within the hour." :
            isGood ? "Approval split — disciplined supporters, vocal critics." :
            "Approval rating flat. Press divided." },
  ];

  // Simulated public trust shift based on the chosen rate
  const trustShift = a1 === "cut-hard" ? -22 : a1 === "raise-hard" ? -18 : a1 === "raise" ? +5 : a1 === "cut" ? +8 : -2;
  const newTrust = Math.max(0, Math.min(100, (state.publicTrust ?? 38) + (trustShift * Math.min(step + 1, 5) / 5)));

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 50px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● LIVE REACTIONS</div>
          <div style={{ fontFamily: FONT_D, fontSize: 44, color: C.surface, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, marginTop: 4 }}>The wires light up.</div>
        </div>
        <div style={{ minWidth: 260 }}>
          <LiveApprovalMeter value={newTrust} label="LIVE · APPROVAL" delta={step > 0 ? Math.round(trustShift * step / 5) : 0} />
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 50px", overflow: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {reactions.map((r, i) => {
          if (i > step) return null;
          // Headlines get the "newspaper stamp" treatment — rotated, white-bordered, dramatic entry
          if (r.type === "headline") {
            return (
              <div key={i} className="headlineStampIn" style={{
                display: "flex", gap: 14, padding: "16px 22px",
                background: "#f7eedd",
                border: `4px solid ${r.color}`,
                borderRadius: 2,
                color: "#1a0c08",
                transform: "rotate(-2deg)",
                boxShadow: `0 18px 50px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(0,0,0,0.05)`,
                position: "relative",
                marginLeft: 8, marginRight: 8,
              }}>
                {/* Newspaper texture lines */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 14px, rgba(0,0,0,0.04) 14px, rgba(0,0,0,0.04) 15px)",
                  borderRadius: 2,
                }} />
                {/* "STOP PRESS" stamp */}
                <div style={{
                  position: "absolute", top: -10, right: 18,
                  background: r.color, color: "#fff",
                  padding: "4px 12px", fontFamily: FONT_M, fontSize: 9,
                  letterSpacing: "0.32em", fontWeight: 800,
                  transform: "rotate(3deg)",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                }}>STOP PRESS</div>
                <div style={{ width: 48, height: 48, background: r.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FONT_M, fontSize: 9, letterSpacing: "0.18em", fontWeight: 800, position: "relative", zIndex: 1 }}>NEWS</div>
                <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: r.color, letterSpacing: "0.28em", fontWeight: 800, borderBottom: `1px solid ${r.color}55`, paddingBottom: 3 }}>{r.who}</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 22, color: "#1a0c08", fontWeight: 900, lineHeight: 1.15, marginTop: 6, letterSpacing: "-0.015em" }}>{r.text}</div>
                </div>
              </div>
            );
          }
          // Person reactions stay as-is
          return (
            <div key={i} className="popupIn" style={{ display: "flex", gap: 14, padding: "14px 18px", background: "rgba(255,248,238,0.04)", borderLeft: `4px solid ${r.color}`, borderRadius: 3 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: r.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_D, fontWeight: 800, fontSize: 22, flexShrink: 0 }}>{r.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_M, fontSize: 9, color: r.color, letterSpacing: "0.22em", fontWeight: 800 }}>{r.name}</div>
                <div style={{ fontFamily: FONT_D, fontSize: 20, color: C.surface, fontWeight: 500, lineHeight: 1.3, marginTop: 2, fontStyle: "italic" }}>"{r.text}"</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "0 50px 26px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textCreamDim, letterSpacing: "0.22em" }}>{step >= 4 ? "ALL REACTIONS IN" : `${step + 1} / 5`}</div>
        {step >= 4 && (
          <button onClick={() => dispatch({ type: "MEETING_PHASE", phase: "hub" })} style={{ background: C.coral, color: "#fff", border: "none", padding: "16px 36px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2, boxShadow: `0 14px 36px ${C.coral}66` }}>
            WHAT NEXT? →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── HUB: pick what to do next ──────────────────────────
function ActHub({ state, dispatch }) {
  const done = state.policy?.hubDone || [];
  const isBad = state.policy?.rateGood === false;

  const tools = [
    { id: "qe", title: "BALANCE SHEET", subtitle: done.includes("qe") ? "DONE" : "QE / QT", desc: "Buy or sell bonds to ease or tighten further.", color: C.gold, disabled: done.includes("qe") },
    { id: "guidance", title: "FORWARD GUIDANCE", subtitle: done.includes("guidance") ? "DONE" : "SET THE TONE", desc: "Hawkish or dovish? Words move markets as much as actions.", color: C.purple, disabled: done.includes("guidance") },
    { id: "macropru", title: "MACROPRUDENTIAL", subtitle: done.includes("macropru") ? "DONE" : "LENDING RULES", desc: "Tighten or loosen mortgage tests, capital buffers.", color: C.teal, disabled: done.includes("macropru") },
    { id: "press", title: "FACE THE PRESS", subtitle: "CONFRONT THE COUNTRY", desc: "Lock in your toolkit and answer the questions.", color: C.coral, primary: true },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 50px 12px" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>POLICY HUB · DO MORE OR PRESS ON</div>
        <div style={{ fontFamily: FONT_D, fontSize: 48, color: C.surface, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, marginTop: 4 }}>What else do you reach for?</div>
        <div style={{ fontFamily: FONT_D, fontSize: 18, color: isBad ? C.coral : C.gold, fontWeight: 600, fontStyle: "italic", marginTop: 8, letterSpacing: "-0.005em" }}>{isBad ? "The country is hurting. You have more tools — or face the press now." : "Pile on with more tools, or take the rate decision to the press."}</div>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, padding: "12px 40px 22px", minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10 }}>
          {tools.map((t) => (
            <div key={t.id} onClick={() => {
              if (t.disabled) return;
              if (t.id === "press") dispatch({ type: "MEETING_PHASE", phase: "outcome" });
              else dispatch({ type: "MEETING_PHASE", phase: t.id });
            }} style={{
              position: "relative", overflow: "hidden",
              background: t.primary ? t.color : (t.disabled ? "rgba(255,255,255,0.02)" : "rgba(255,248,238,0.04)"),
              border: `2px solid ${t.disabled ? "rgba(255,255,255,0.1)" : t.color}`,
              borderRadius: 4, padding: "20px 20px", cursor: t.disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
              opacity: t.disabled ? 0.5 : 1,
            }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: t.primary ? "rgba(255,255,255,0.85)" : t.color, letterSpacing: "0.28em", fontWeight: 800 }}>{t.subtitle}</div>
              <div style={{ fontFamily: FONT_D, fontSize: 22, color: t.primary ? "#fff" : C.surface, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, marginTop: 6 }}>{t.title}</div>
              <div style={{ fontFamily: FONT_D, fontSize: 12, color: t.primary ? "rgba(255,255,255,0.95)" : C.textCream, fontWeight: 500, marginTop: 10, lineHeight: 1.4, fontStyle: "italic" }}>{t.desc}</div>
              {t.disabled && <div style={{ position: "absolute", bottom: 12, right: 14, fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em", fontWeight: 800 }}>✓ APPLIED</div>}
            </div>
          ))}
        </div>
        <MiniTransmission state={state} label="CURRENT TRANSMISSION" />
      </div>
    </div>
  );
}

// ─── QE / QT sub-action ────────────────────────────────
function ActQE({ state, dispatch }) {
  const a1 = state.policy?.actOne;
  const choices = [
    { id: "qe-hard", label: "RESTART QE · ₺40bn", qe: 3, color: C.teal, line: "Aggressive easing. Long-end rates crash. Inflation risk soars.", impact: "10Y yields ↓↓ | Mortgages ↓ | Inflation: +0.4pp" },
    { id: "qe", label: "GENTLE QE · ₺15bn", qe: 1, color: C.teal, line: "Modest support. Reinvest the maturing book + a little more.", impact: "Yields ↓ slightly | Markets approve" },
    { id: "hold", label: "BALANCE SHEET STEADY", qe: 0, color: C.gold, line: "Reinvest at maturity. No new direction.", impact: "Yields steady | 'Consistent' framing" },
    { id: "qt", label: "QT · ₺20bn ROLL-OFF", qe: -1, color: C.coral, line: "Let bonds mature without replacement. Gradual tightening.", impact: "Yields ↑ | Mortgage costs ↑" },
    { id: "qt-hard", label: "AGGRESSIVE QT · ACTIVE SALES", qe: -3, color: C.red, line: "Sell into the market. Drain liquidity. Gilt market under stress.", impact: "Yields ↑↑ | Markets wobble | 'Twin tightening'" },
  ];
  return <SubActionScreen title="ACT II · BALANCE SHEET" subtitle="How will you handle the ₺840bn book?" choices={choices} keyName="qe" dispatch={dispatch} state={state} markDone="qe" />;
}

function ActGuidance({ state, dispatch }) {
  const choices = [
    { id: "hawk-hard", label: "MORE TO COME", color: C.red, line: "Brutal honesty: this isn't enough. We will tighten further.", impact: "Markets price 2 more hikes | Currency rallies hard | Mortgage rates +" },
    { id: "hawk", label: "HIGHER FOR LONGER", color: C.coral, line: "Steady hand: we'll keep rates at this level until we're sure.", impact: "Yield curve flattens | Disciplined framing" },
    { id: "balanced", label: "DATA DEPENDENT", color: C.gold, line: "The safe word: we react to what we see.", impact: "No commitment | Markets read between lines" },
    { id: "dove", label: "NEAR THE PEAK", color: C.teal, line: "We are nearly done. The pain is almost over.", impact: "Bonds rally | Borrowers cheer | Currency softens" },
    { id: "dove-hard", label: "CUTS COMING", color: C.blue, line: "Strong signal: relief is in sight. Plan accordingly.", impact: "Markets price 3 cuts | Inflation risk rises" },
  ];
  return <SubActionScreen title="ACT III · FORWARD GUIDANCE" subtitle="Words. They cost nothing. They move trillions." choices={choices} keyName="guidance" dispatch={dispatch} state={state} markDone="guidance" actionType="SET_GUIDANCE" />;
}

function ActMacroPru({ state, dispatch }) {
  const choices = [
    { id: "tight-hard", label: "HARD LENDING CAPS", macroPru: 2, color: C.coral, line: "Strict LTI caps, tough mortgage tests, big capital buffers.", impact: "First-time buyers locked out | Housing cools" },
    { id: "tight", label: "TIGHTEN LENDING", macroPru: 1, color: C.purple, line: "Modest tightening of lending standards.", impact: "Mortgage applications -15% | Banks cautious" },
    { id: "hold", label: "HOLD CURRENT RULES", macroPru: 0, color: C.gold, line: "Steady as she goes.", impact: "No structural change | Status quo" },
    { id: "loose", label: "LOOSEN", macroPru: -1, color: C.teal, line: "Ease lending rules. Help marginal buyers in.", impact: "First-time buyers up | Risk in the system rises" },
  ];
  return <SubActionScreen title="MACROPRUDENTIAL" subtitle="The other lever. Lending rules. Quieter, just as powerful." choices={choices} keyName="macroPru" dispatch={dispatch} state={state} markDone="macropru" />;
}

function SubActionScreen({ title, subtitle, choices, keyName, dispatch, state, markDone, actionType }) {
  const [decided, setDecided] = useState(null);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 50px 14px", borderBottom: `1px solid rgba(245,184,46,0.12)` }}>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● {title}</div>
        <div style={{ fontFamily: FONT_D, fontSize: 44, color: C.surface, fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1, marginTop: 6 }}>{subtitle}</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, padding: "16px 50px 16px" }}>
        {choices.map((c) => {
          const isPicked = decided === c.id;
          return (
            <div key={c.id} onClick={() => setDecided(c.id)} className="popupIn" style={{
              position: "relative", overflow: "hidden", flex: 1,
              background: isPicked ? `linear-gradient(90deg, ${c.color} 0%, ${c.color}cc 100%)` : "rgba(8,12,30,0.5)",
              border: `2px solid ${isPicked ? c.color : `${c.color}55`}`,
              borderLeft: `6px solid ${c.color}`,
              borderRadius: 4, padding: "16px 24px", cursor: "pointer", transition: "all 0.2s",
              transform: isPicked ? "translateX(10px)" : "translateX(0)",
              boxShadow: isPicked ? `0 14px 50px ${c.color}88, inset 0 0 0 1px rgba(255,255,255,0.2)` : `0 4px 16px rgba(0,0,0,0.4)`,
              display: "flex", alignItems: "center", gap: 26,
            }}>
              <div style={{ minWidth: 260, position: "relative" }}>
                <div style={{ fontFamily: FONT_M, fontSize: 9, color: isPicked ? "rgba(255,255,255,0.85)" : c.color, letterSpacing: "0.26em", fontWeight: 800 }}>OPTION</div>
                <div style={{ fontFamily: FONT_D, fontSize: 24, color: isPicked ? "#fff" : C.surface, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, marginTop: 4 }}>{c.label}</div>
              </div>
              <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
                <div style={{ fontFamily: FONT_D, fontSize: 16, color: isPicked ? "#fff" : C.textCream, fontStyle: "italic", fontWeight: 600, lineHeight: 1.35, letterSpacing: "-0.005em" }}>"{c.line}"</div>
                <div style={{ fontFamily: FONT_M, fontSize: 9.5, color: isPicked ? "rgba(255,255,255,0.9)" : C.textCreamDim, letterSpacing: "0.14em", marginTop: 8, fontWeight: 700 }}>{c.impact}</div>
              </div>
              {isPicked && (
                <div style={{ fontFamily: FONT_M, fontSize: 11, color: "#fff", letterSpacing: "0.22em", fontWeight: 800, flexShrink: 0, animation: "pulse 1.4s infinite" }}>✓ SELECTED</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "12px 50px 26px", display: "flex", justifyContent: "space-between", borderTop: `1px solid rgba(245,184,46,0.12)` }}>
        <button onClick={() => dispatch({ type: "MEETING_PHASE", phase: "hub" })} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid rgba(255,255,255,0.2)`, padding: "12px 22px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>← BACK TO HUB</button>
        <button disabled={!decided} onClick={() => {
          const c = choices.find(x => x.id === decided);
          if (actionType === "SET_GUIDANCE") {
            dispatch({ type: "SET_GUIDANCE", guidance: c.id });
          } else if (c[keyName] !== undefined) {
            dispatch({ type: "SET_POLICY", tool: keyName, value: c[keyName] });
          }
          dispatch({ type: "SET_POLICY", tool: `${keyName}Choice`, value: c.id });
          dispatch({ type: "SET_POLICY", tool: "hubDone", value: [...(state.policy?.hubDone || []), markDone] });
          dispatch({ type: "MEETING_PHASE", phase: "hub" });
        }} style={{
          background: decided ? C.coral : "rgba(255,255,255,0.08)", color: decided ? "#fff" : "rgba(255,255,255,0.3)",
          border: "none", padding: "14px 34px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em",
          cursor: decided ? "pointer" : "not-allowed", borderRadius: 2,
          boxShadow: decided ? `0 12px 30px ${C.coral}88` : "none",
        }}>LOCK IN → BACK TO HUB</button>
      </div>
    </div>
  );
}

function ActTwo({ state, dispatch }) { return <ActQE state={state} dispatch={dispatch} />; }
function ActThree({ state, dispatch }) { return <ActGuidance state={state} dispatch={dispatch} />; }

// ─── OUTCOME ──────────────────────────────────────────
function ActOutcome({ state, dispatch }) {
  const a1 = state.policy?.actOne;
  const qeC = state.policy?.qeChoice;
  const gC  = state.policy?.guidanceChoice;
  const mpC = state.policy?.macroPruChoice;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "28px 50px" }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>YOUR POLICY · LOCKED</div>
        <div style={{ fontFamily: FONT_D, fontSize: 48, color: C.surface, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 6 }}>The committee has voted.</div>
        <div style={{ fontFamily: FONT_D, fontSize: 18, color: C.gold, fontWeight: 600, fontStyle: "italic", marginTop: 8, letterSpacing: "-0.005em" }}>Watch the transmission. Now the world finds out.</div>
      </div>

      {/* Two-column layout: policy stack (left) + transmission network (right) */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 1100, margin: "0 auto", width: "100%", minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "rgba(255,248,238,0.04)", border: `2px solid ${C.coral}`, borderLeft: `6px solid ${C.coral}`, padding: "14px 18px", borderRadius: 3 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.25em", fontWeight: 800 }}>BANK RATE</div>
            <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.surface, fontWeight: 800, marginTop: 4 }}>{a1?.toUpperCase().replace("-", " ") || "—"}</div>
            <div style={{ fontFamily: FONT_D, fontSize: 14, color: C.coral, fontWeight: 700, marginTop: 2 }}>{state.interestRate?.toFixed(2)}%</div>
          </div>
          <div style={{ background: "rgba(255,248,238,0.04)", border: `2px solid ${C.gold}`, borderLeft: `6px solid ${C.gold}`, padding: "14px 18px", borderRadius: 3 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.25em", fontWeight: 800 }}>BALANCE SHEET</div>
            <div style={{ fontFamily: FONT_D, fontSize: 20, color: C.surface, fontWeight: 800, marginTop: 4 }}>{qeC ? qeC.toUpperCase().replace("-", " ") : "STEADY"}</div>
          </div>
          <div style={{ background: "rgba(255,248,238,0.04)", border: `2px solid ${C.purple}`, borderLeft: `6px solid ${C.purple}`, padding: "14px 18px", borderRadius: 3 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.purple, letterSpacing: "0.25em", fontWeight: 800 }}>GUIDANCE</div>
            <div style={{ fontFamily: FONT_D, fontSize: 20, color: C.surface, fontWeight: 800, marginTop: 4 }}>{gC ? gC.toUpperCase().replace("-", " ") : "NONE"}</div>
          </div>
          <div style={{ background: "rgba(255,248,238,0.04)", border: `2px solid ${C.teal}`, borderLeft: `6px solid ${C.teal}`, padding: "14px 18px", borderRadius: 3 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.teal, letterSpacing: "0.25em", fontWeight: 800 }}>MACROPRU</div>
            <div style={{ fontFamily: FONT_D, fontSize: 20, color: C.surface, fontWeight: 800, marginTop: 4 }}>{mpC ? mpC.toUpperCase().replace("-", " ") : "STEADY"}</div>
          </div>
        </div>

        {/* Transmission network showing how the full policy stack ripples through */}
        <MiniTransmission state={state} label="POST-DECISION FLOWS" />
      </div>

      <div style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 14 }}>
        <button onClick={() => dispatch({ type: "MEETING_PHASE", phase: "hub" })} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid rgba(255,255,255,0.3)`, padding: "14px 26px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>← BACK TO HUB</button>
        <button onClick={() => dispatch({ type: "DECISION_END" })} style={{ background: C.coral, color: "#fff", border: "none", padding: "16px 48px", fontFamily: FONT_M, fontSize: 12, fontWeight: 800, letterSpacing: "0.28em", cursor: "pointer", borderRadius: 2, boxShadow: `0 18px 50px ${C.coral}66` }}>
          FACE THE PRESS →
        </button>
      </div>
    </div>
  );
}

function ActReview({ state, dispatch }) {
  return <ActBriefing state={state} dispatch={dispatch} />;
}

// ─── STOCK EXCHANGE PANEL ──────────────────────────────────
function StockExchangePanel({ state, dispatch }) {
  // "THE TRADER" — live trading game
  const [phase, setPhase] = useState("intro"); // intro | playing | result
  const [cash, setCash] = useState(10000);
  const [day, setDay] = useState(0); // 0..60 (60-day game)
  const [running, setRunning] = useState(false);
  const [currentNews, setCurrentNews] = useState(null);

  // 6 stocks
  const STOCKS_INIT = [
    { sym: "TECH", name: "Verdane Tech",     base: 120, vol: 0.04, color: C.coral,  sector: "tech",   pos: 0, dividend: 0,    sensitivity: { tech: 1.4, rate: -0.6, oil: 0,    housing: 0 } },
    { sym: "BANK", name: "Bank of Vostan",    base: 88,  vol: 0.02, color: C.teal,   sector: "banks",  pos: 0, dividend: 0.04, sensitivity: { tech: 0,   rate: 1.2,  oil: 0,    housing: 0.4 } },
    { sym: "OIL",  name: "Varena Petroleum", base: 64,  vol: 0.05, color: C.gold,   sector: "oil",    pos: 0, dividend: 0.06, sensitivity: { tech: 0,   rate: -0.3, oil: 1.6,  housing: 0 } },
    { sym: "HOMES",name: "Keldra Homes",     base: 42,  vol: 0.03, color: C.purple, sector: "homes",  pos: 0, dividend: 0.03, sensitivity: { tech: 0,   rate: -1.5, oil: 0,    housing: 1.4 } },
    { sym: "GOLD", name: "Gold Bullion ETF", base: 195, vol: 0.015,color: C.gold,   sector: "gold",   pos: 0, dividend: 0,    sensitivity: { tech: -0.3,rate: -0.5, oil: 0.4,  housing: 0 } },
    { sym: "RETAIL",name:"High Street Retail",base: 56, vol: 0.035,color: C.rose,   sector: "retail", pos: 0, dividend: 0.05, sensitivity: { tech: 0,   rate: -0.8, oil: -0.4, housing: 0.3 } },
  ];
  const [stocks, setStocks] = useState(STOCKS_INIT);
  const [holdings, setHoldings] = useState(STOCKS_INIT.map(() => 0)); // shares held
  const [priceHistory, setPriceHistory] = useState(STOCKS_INIT.map(s => [s.base]));

  // News bank
  const NEWS_BANK = [
    { headline: "INFLATION SURPRISES HIGHER · CENTRAL BANK SET TO HIKE", impact: { rate: 1, tech: -0.02, banks: 0.02, housing: -0.03 }, color: C.coral },
    { headline: "GOLD HITS 5-YEAR HIGH ON GEOPOLITICAL TENSION",          impact: { gold: 0.04 }, color: C.gold },
    { headline: "TECH GIANT BEATS EARNINGS — AI SPEND PAYS OFF",          impact: { tech: 0.06 }, color: C.teal },
    { headline: "OIL PRICES SURGE ON SUPPLY SHOCK",                       impact: { oil: 0.05, tech: -0.01, retail: -0.02 }, color: C.coral },
    { headline: "HOUSING MARKET COOLS — RATE CUTS RUMOURED",              impact: { housing: -0.03, banks: -0.01, homes: -0.03 }, color: C.purple },
    { headline: "BANK STRESS TESTS PASS · DIVIDENDS RAISED",              impact: { banks: 0.03 }, color: C.teal },
    { headline: "RECESSION FEARS RISE · MARKETS WOBBLE",                  impact: { tech: -0.03, banks: -0.02, retail: -0.03, gold: 0.02 }, color: C.red },
    { headline: "INFLATION COOLING · CENTRAL BANK SIGNALS PAUSE",         impact: { tech: 0.03, housing: 0.03, banks: -0.01 }, color: C.teal },
    { headline: "RETAIL SALES BEAT EXPECTATIONS",                         impact: { retail: 0.04 }, color: C.gold },
    { headline: "CHINA REOPENING BOOSTS COMMODITY DEMAND",                impact: { oil: 0.03, gold: 0.01 }, color: C.gold },
    { headline: "TECH CORRECTION DEEPENS · 'BUBBLE FEAR' SPREADS",        impact: { tech: -0.06, gold: 0.02 }, color: C.coral },
    { headline: "PEACE TALKS PROGRESS · DEFENCE STOCKS DROP",             impact: { oil: -0.02, gold: -0.02 }, color: C.teal },
  ];
  const [newsLog, setNewsLog] = useState([]);

  // Tick the simulation forward one day
  useEffect(() => {
    if (!running || phase !== "playing") return;
    const tick = setTimeout(() => {
      // Roll news with 25% chance per tick
      let newsImpact = { tech: 0, rate: 0, oil: 0, housing: 0, banks: 0, gold: 0, retail: 0 };
      if (Math.random() < 0.25) {
        const news = NEWS_BANK[Math.floor(Math.random() * NEWS_BANK.length)];
        setCurrentNews({ ...news, day });
        setNewsLog(l => [{ day, ...news }, ...l].slice(0, 8));
        Object.assign(newsImpact, news.impact);
        setTimeout(() => setCurrentNews(null), 2400);
      }

      // Update each stock
      setStocks(prev => prev.map((s, i) => {
        const drift = 0.0006; // small upward drift
        const noise = (Math.random() - 0.5) * s.vol;
        const newsBump = (newsImpact[s.sector] || 0) +
                         (newsImpact.tech || 0) * (s.sensitivity.tech || 0) * 0.5 +
                         (newsImpact.rate || 0) * (s.sensitivity.rate || 0) * 0.02 +
                         (newsImpact.oil || 0) * (s.sensitivity.oil || 0) * 0.4 +
                         (newsImpact.housing || 0) * (s.sensitivity.housing || 0) * 0.4;
        const newPrice = Math.max(1, s.base * (1 + drift + noise + newsBump));
        return { ...s, base: newPrice };
      }));

      setPriceHistory(prev => stocks.map((s, i) => {
        const drift = 0.0006;
        const noise = (Math.random() - 0.5) * s.vol;
        const newsBump = (newsImpact[s.sector] || 0);
        const newPrice = Math.max(1, s.base * (1 + drift + noise + newsBump));
        return [...prev[i], newPrice].slice(-60);
      }));

      setDay(d => d + 1);
      if (day + 1 >= 60) {
        setRunning(false);
        setPhase("result");
      }
    }, 700);
    return () => clearTimeout(tick);
  }, [running, day, phase, stocks]);

  const portfolioValue = stocks.reduce((acc, s, i) => acc + s.base * holdings[i], 0);
  const totalValue = cash + portfolioValue;
  const profit = totalValue - 10000;

  const buy = (i) => {
    const s = stocks[i];
    if (cash < s.base) return;
    setCash(c => c - s.base);
    setHoldings(h => h.map((v, j) => j === i ? v + 1 : v));
  };
  const sell = (i) => {
    if (holdings[i] <= 0) return;
    setCash(c => c + stocks[i].base);
    setHoldings(h => h.map((v, j) => j === i ? v - 1 : v));
  };

  const close = () => dispatch({ type: "CLOSE_PANEL" });

  // ───── INTRO ─────
  if (phase === "intro") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>VARENA STOCK EXCHANGE</div>
          </div>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>MARKET OPENS IN 30 SECONDS</div>
        </div>

        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: `linear-gradient(180deg, #04060f 0%, #0a1230 35%, #2a1c4a 70%, ${C.skyDawn} 92%, ${C.skyHorizon} 100%)` }}>
          <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <circle cx="1300" cy="200" r="80" fill="#fff8ee" opacity="0.95" />
            {Array.from({ length: 40 }).map((_, i) => (
              <circle key={i} cx={(i * 137) % 1600} cy={(i * 89) % 300} r="0.7" fill="#fff8ee" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
              </circle>
            ))}
            <path d="M 0 580 Q 200 540 350 570 Q 600 530 900 560 Q 1200 540 1600 570 L 1600 700 L 0 700 Z" fill="#0a0f24" opacity="0.7" />
          </svg>

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
            <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "44px 60px", maxWidth: 720, width: "100%", borderRadius: 4, boxShadow: "0 40px 100px rgba(0,0,0,0.7)", border: `2px solid ${C.gold}` }}>
              <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.coral, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 6 }}>₺10,000 · 60 DAYS</div>
              <div style={{ fontFamily: FONT_D, fontSize: 60, color: C.ink, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: 12 }}>The Trader.</div>
              <div style={{ fontFamily: FONT_H, fontSize: 22, color: C.gold, fontWeight: 600, marginBottom: 24, lineHeight: 1.3 }}>Buy. Sell. Watch the news. Read the room.</div>

              <div style={{ background: C.surface2, padding: "18px 22px", borderRadius: 4, marginBottom: 20, fontSize: 14, color: C.text, lineHeight: 1.6 }}>
                <strong style={{ color: C.coral }}>Six stocks.</strong> Each one reacts differently to the news. <strong style={{ color: C.teal }}>Tech</strong> hates rates but loves AI. <strong style={{ color: C.gold }}>Gold</strong> loves crisis. <strong style={{ color: C.purple }}>Homes</strong> live and die by the mortgage rate.
                <br/><br/>
                <strong style={{ color: C.coral }}>Click buy to buy.</strong> <strong style={{ color: C.coral }}>Click sell to sell.</strong> Beat the market over 60 days.
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={close} style={{ background: "transparent", color: C.textMuted, border: `1px solid ${C.borderCream}`, padding: "14px 22px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 3 }}>WALK AWAY</button>
                <button onClick={() => { setPhase("playing"); setRunning(true); }} style={{ background: C.coral, color: "#fff", border: "none", padding: "16px 40px", fontFamily: FONT_M, fontSize: 12, fontWeight: 800, letterSpacing: "0.28em", cursor: "pointer", borderRadius: 3, boxShadow: `0 14px 36px ${C.coral}66` }}>
                  OPEN THE MARKET →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#000", height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em" }}>VARENA EXCHANGE · "DON'T CATCH FALLING KNIVES"</div>
        </div>
      </div>
    );
  }

  // ───── RESULT ─────
  if (phase === "result") {
    const pct = (profit / 10000) * 100;
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>MARKET CLOSED · DAY 60</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: `linear-gradient(180deg, #04060f 0%, #1a2454 100%)` }}>
          <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "44px 56px", maxWidth: 820, width: "100%", borderRadius: 4, boxShadow: "0 40px 100px rgba(0,0,0,0.7)", borderTop: `5px solid ${profit >= 0 ? C.teal : C.coral}` }}>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: profit >= 0 ? C.teal : C.coral, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 6 }}>YOUR FINAL P&L</div>
            <div style={{ fontFamily: FONT_D, fontSize: 80, color: profit >= 0 ? C.teal : C.coral, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>{profit >= 0 ? "+" : ""}₺{Math.round(profit).toLocaleString()}</div>
            <div style={{ fontFamily: FONT_D, fontSize: 28, color: C.text, fontWeight: 600, marginTop: 4 }}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}% over 60 days</div>
            <div style={{ fontFamily: FONT_H, fontSize: 22, color: C.gold, fontWeight: 600, marginTop: 16, lineHeight: 1.3 }}>
              {pct > 20 ? "Trader of the year. Don't get cocky." : pct > 5 ? "Solid. Better than the index this quarter." : pct > -5 ? "Roughly flat. Markets are hard." : pct > -20 ? "Tough run. Plenty learn the hard way." : "Margin call territory. Read the news next time."}
            </div>

            <div style={{ marginTop: 26, display: "flex", gap: 12 }}>
              <button onClick={() => { setPhase("intro"); setDay(0); setCash(10000); setHoldings(STOCKS_INIT.map(() => 0)); setStocks(STOCKS_INIT); setNewsLog([]); }} style={{ flex: 1, background: C.surface2, color: C.ink, border: `2px solid ${C.borderCream}`, padding: "14px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>↶ TRADE AGAIN</button>
              <button onClick={close} style={{ flex: 1, background: C.coral, color: "#fff", border: "none", padding: "14px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>BACK TO STREET →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───── PLAYING — main trading interface ─────
  return (
    <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
      {/* Letterbox top with news ticker */}
      <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, background: C.coral, color: "#fff", padding: "0 16px", height: "100%", display: "flex", alignItems: "center", fontFamily: FONT_M, fontSize: 11, letterSpacing: "0.28em", fontWeight: 800 }}>● LIVE</div>
        <div style={{ flex: 1, overflow: "hidden", position: "relative", height: "100%" }}>
          <div style={{ position: "absolute", whiteSpace: "nowrap", animation: "scroll 30s linear infinite", fontFamily: FONT_M, fontSize: 13, color: C.gold, letterSpacing: "0.15em", fontWeight: 700, top: "50%", transform: "translateY(-50%)" }}>
            {newsLog.length === 0 ? "VARENA EXCHANGE · DAY " + day + " · MARKETS NORMAL · STAY DISCIPLINED ·" : newsLog.map(n => `${n.headline} · `).join("")}
          </div>
        </div>
        <div style={{ flexShrink: 0, padding: "0 20px", color: "#fff", fontFamily: FONT_M, fontSize: 11, letterSpacing: "0.22em", fontWeight: 700 }}>DAY {day} / 60</div>
      </div>

      {/* Main board */}
      <div style={{ flex: 1, display: "flex", padding: 16, gap: 14, overflow: "hidden", background: `linear-gradient(180deg, #04060f 0%, #0a0e22 100%)` }}>
        {/* Left: stocks grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gap: 10 }}>
          {stocks.map((s, i) => {
            const prev = priceHistory[i]?.[priceHistory[i].length - 2] || s.base;
            const change = ((s.base - prev) / prev) * 100;
            const up = change >= 0;
            const ph = priceHistory[i] || [s.base];
            const minP = Math.min(...ph), maxP = Math.max(...ph);
            const range = Math.max(maxP - minP, 1);
            return (
              <div key={s.sym} style={{ background: "rgba(255,248,238,0.04)", border: `2px solid ${s.color}`, borderRadius: 3, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", position: "relative" }}>
                {/* Big symbol watermark */}
                <div style={{ position: "absolute", right: -10, top: -20, fontFamily: FONT_D, fontSize: 130, fontWeight: 900, color: s.color, opacity: 0.06, lineHeight: 1, pointerEvents: "none" }}>{s.sym}</div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", position: "relative" }}>
                  <div>
                    <div style={{ fontFamily: FONT_D, fontSize: 26, fontWeight: 900, color: C.surface, letterSpacing: "-0.01em" }}>{s.sym}</div>
                    <div style={{ fontFamily: FONT_M, fontSize: 8.5, color: s.color, letterSpacing: "0.18em", fontWeight: 800 }}>{s.name.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: FONT_D, fontSize: 28, fontWeight: 900, color: up ? C.teal : C.coral, lineHeight: 1 }}>₺{s.base.toFixed(2)}</div>
                    <div style={{ fontFamily: FONT_M, fontSize: 11, color: up ? C.teal : C.coral, fontWeight: 800 }}>{up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%</div>
                  </div>
                </div>

                {/* Sparkline */}
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: "100%", height: 40, marginTop: 8 }}>
                  <polyline points={ph.map((p, j) => `${(j / Math.max(ph.length - 1, 1)) * 100},${30 - ((p - minP) / range) * 26 - 2}`).join(" ")} stroke={s.color} strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
                  <polygon points={`0,30 ${ph.map((p, j) => `${(j / Math.max(ph.length - 1, 1)) * 100},${30 - ((p - minP) / range) * 26 - 2}`).join(" ")} 100,30`} fill={s.color} opacity="0.15" />
                </svg>

                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button onClick={() => buy(i)} disabled={cash < s.base} style={{
                    flex: 1, background: cash >= s.base ? C.teal : "rgba(255,255,255,0.06)", color: cash >= s.base ? "#fff" : "rgba(255,255,255,0.3)",
                    border: "none", padding: "9px 4px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em",
                    cursor: cash >= s.base ? "pointer" : "not-allowed", borderRadius: 2,
                    transition: "all 0.1s",
                    boxShadow: cash >= s.base ? `0 4px 12px ${C.teal}55` : "none",
                  }} onMouseDown={(e) => { if (cash >= s.base) { e.currentTarget.style.transform = "scale(0.96)"; e.currentTarget.style.boxShadow = `0 2px 8px ${C.teal}88, 0 0 0 3px ${C.teal}55`; }}}
                     onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = cash >= s.base ? `0 4px 12px ${C.teal}55` : "none"; }}
                     onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = cash >= s.base ? `0 4px 12px ${C.teal}55` : "none"; }}>BUY</button>
                  <button onClick={() => sell(i)} disabled={holdings[i] <= 0} style={{
                    flex: 1, background: holdings[i] > 0 ? C.coral : "rgba(255,255,255,0.06)", color: holdings[i] > 0 ? "#fff" : "rgba(255,255,255,0.3)",
                    border: "none", padding: "9px 4px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em",
                    cursor: holdings[i] > 0 ? "pointer" : "not-allowed", borderRadius: 2,
                    transition: "all 0.1s",
                    boxShadow: holdings[i] > 0 ? `0 4px 12px ${C.coral}55` : "none",
                  }} onMouseDown={(e) => { if (holdings[i] > 0) { e.currentTarget.style.transform = "scale(0.96)"; e.currentTarget.style.boxShadow = `0 2px 8px ${C.coral}88, 0 0 0 3px ${C.coral}55`; }}}
                     onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = holdings[i] > 0 ? `0 4px 12px ${C.coral}55` : "none"; }}
                     onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = holdings[i] > 0 ? `0 4px 12px ${C.coral}55` : "none"; }}>SELL</button>
                  <div style={{ background: "rgba(255,255,255,0.08)", border: holdings[i] > 0 ? `1px solid ${C.gold}` : `1px solid rgba(255,255,255,0.08)`, padding: "8px 12px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "0.18em" }}>{holdings[i]}×</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: portfolio panel */}
        <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "rgba(255,248,238,0.04)", border: `2px solid ${C.gold}`, borderRadius: 3, padding: "16px 18px" }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.28em", fontWeight: 800 }}>TOTAL VALUE</div>
            <div style={{ fontFamily: FONT_D, fontSize: 38, color: C.surface, fontWeight: 900, lineHeight: 1, marginTop: 4 }}>₺{Math.round(totalValue).toLocaleString()}</div>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: profit >= 0 ? C.teal : C.coral, fontWeight: 800, marginTop: 4 }}>{profit >= 0 ? "▲ +" : "▼ "}₺{Math.abs(Math.round(profit)).toLocaleString()} ({((profit/10000)*100).toFixed(1)}%)</div>
          </div>

          <div style={{ background: "rgba(255,248,238,0.04)", border: `2px solid ${C.borderL}`, borderRadius: 3, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em", fontWeight: 700 }}>CASH</div>
              <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.gold, fontWeight: 800 }}>₺{Math.round(cash).toLocaleString()}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em", fontWeight: 700 }}>PORTFOLIO</div>
              <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.coral, fontWeight: 800 }}>₺{Math.round(portfolioValue).toLocaleString()}</div>
            </div>
          </div>

          {/* News feed */}
          <div style={{ background: "rgba(255,248,238,0.04)", border: `1px solid ${C.borderL}`, borderRadius: 3, padding: "12px 14px", flex: 1, overflow: "hidden" }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 8 }}>NEWSWIRE</div>
            {newsLog.length === 0 && <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textCreamDim, fontStyle: "italic" }}>Quiet so far. The market is watching.</div>}
            {newsLog.map((n, i) => (
              <div key={i} style={{ marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${n.color}` }}>
                <div style={{ fontFamily: FONT_M, fontSize: 8, color: n.color, letterSpacing: "0.18em", fontWeight: 800 }}>DAY {n.day}</div>
                <div style={{ fontFamily: FONT_D, fontSize: 11, color: C.surface, fontWeight: 700, lineHeight: 1.3 }}>{n.headline}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News flash overlay */}
      {currentNews && (
        <div className="popupIn" style={{ position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: currentNews.color, color: "#fff", padding: "20px 40px", borderRadius: 3, boxShadow: `0 24px 70px ${currentNews.color}, 0 0 0 8px rgba(255,255,255,0.08)`, maxWidth: 820, textAlign: "center", border: `2px solid #fff`, animation: "popupIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 0.8s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 11, letterSpacing: "0.4em", fontWeight: 800, opacity: 0.95 }}>● BREAKING · DAY {currentNews.day}</div>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 0.8s infinite" }} />
          </div>
          <div style={{ fontFamily: FONT_D, fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, textShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>{currentNews.headline}</div>
        </div>
      )}

      {/* Bottom controls */}
      <div style={{ background: "#000", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {!running && (
            <button onClick={() => setRunning(true)} style={{ background: C.gold, color: C.ink, border: "none", padding: "10px 22px", fontFamily: FONT_M, fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>▶ RESUME</button>
          )}
          {running && (
            <button onClick={() => setRunning(false)} style={{ background: C.gold, color: C.ink, border: "none", padding: "10px 22px", fontFamily: FONT_M, fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>❚❚ PAUSE</button>
          )}
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textCreamDim, letterSpacing: "0.22em" }}>BUY LOW · SELL HIGH · READ THE NEWS · DON'T PANIC</div>
        <button onClick={() => { setPhase("result"); setRunning(false); }} style={{ background: "transparent", color: C.coral, border: `1px solid ${C.coral}`, padding: "10px 22px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>CLOSE BOOK →</button>
      </div>
    </div>
  );
}

// ─── BANK PANEL · "FUTURE YOU" GAME ────────────────────────
// ─── NEW MINI-GAME: BUDGET HEALTH CHECK ─────────────────────
// Pick a neighbour, allocate their monthly income, run 12 months with shocks,
// see the household + national resilience outcome.
function BudgetHealthCheck({ state, dispatch, onBack }) {
  const [phase, setPhase] = useState("pick"); // pick | allocate | simulate | result
  const [pickedId, setPickedId] = useState(null);
  // 4-jar allocation in percent (must sum to 100)
  const [alloc, setAlloc] = useState({ needs: 55, debt: 15, save: 15, life: 15 });
  const [month, setMonth] = useState(0);
  const [emergency, setEmergency] = useState(0); // savings jar balance
  const [debtBal, setDebtBal] = useState(0);
  const [stress, setStress] = useState(50);
  const [happiness, setHappiness] = useState(50);
  const [shocks, setShocks] = useState([]);
  const [timeline, setTimeline] = useState([{ month: 0, emergency: 0, debtBal: 0, stress: 50, happiness: 50 }]);
  const [running, setRunning] = useState(false);
  const [sortAnswers, setSortAnswers] = useState({}); // needs-vs-wants warm-up drill

  const NEIGHBOURS = {
    yusuf: { name: "Yusuf", role: "Family of 4 · Mortgage stress", income: 3200, startDebt: 1200, fixedNeeds: 1700, color: C.coral, icon: "👨‍👩‍👧‍👦",
      hint: "Mortgage just jumped from ₺820 to ₺1,200. Two kids. Sara works part-time. Needs floor is high — they can't cut food." },
    halim: { name: "Mr Halim", role: "Retired · Fixed pension", income: 1400, startDebt: 0, fixedNeeds: 800, color: C.teal, icon: "👴",
      hint: "No debt. Owns his flat. Lives modestly. The danger is the boiler giving up, or a medical bill. Emergency fund is everything." },
    amara: { name: "Amara", role: "Self-employed · Variable income", income: 2400, startDebt: 600, fixedNeeds: 1300, color: C.purple, icon: "👩",
      hint: "Income varies by month. Has a supplier loan to pay off. One child at university. Needs a cushion for slow weeks." },
  };

  const picked = pickedId ? NEIGHBOURS[pickedId] : null;
  const allocSum = alloc.needs + alloc.debt + alloc.save + alloc.life;
  const needsMet = picked ? (picked.income * alloc.needs / 100) >= picked.fixedNeeds : false;

  const setSlider = (key, val) => {
    const newVal = Math.max(0, Math.min(100, val));
    const other = 100 - newVal;
    const sumOthers = Object.entries(alloc).filter(([k]) => k !== key).reduce((s, [, v]) => s + v, 0);
    const scale = sumOthers > 0 ? other / sumOthers : 0;
    setAlloc({
      needs: key === "needs" ? newVal : Math.round(alloc.needs * scale),
      debt:  key === "debt"  ? newVal : Math.round(alloc.debt  * scale),
      save:  key === "save"  ? newVal : Math.round(alloc.save  * scale),
      life:  key === "life"  ? newVal : Math.round(alloc.life  * scale),
    });
  };

  // Simulation tick — 12 months at ~600ms/month
  useEffect(() => {
    if (!running || phase !== "simulate") return;
    if (month >= 12) {
      setRunning(false);
      if (emergency / picked.fixedNeeds >= 3) dispatch({ type: "AWARD_BADGE", id: "bufferBuilder" });
      SFX.win();
      setPhase("result");
      return;
    }
    const t = setTimeout(() => {
      const monthlyIncome = picked.income;
      const toNeeds = monthlyIncome * alloc.needs / 100;
      const toDebt = monthlyIncome * alloc.debt / 100;
      const toSave = monthlyIncome * alloc.save / 100;
      const toLife = monthlyIncome * alloc.life / 100;

      // Random shock chance ~22%
      let monthShock = null;
      if (Math.random() < 0.22) {
        const pool = [
          { id: "boiler", cost: 800, name: "Boiler broke", icon: "🔧" },
          { id: "med", cost: 450, name: "Medical bill", icon: "🩺" },
          { id: "car", cost: 600, name: "Car repair", icon: "🚗" },
          { id: "bonus", cost: -700, name: "Work bonus!", icon: "🎉" },
          { id: "gift", cost: -300, name: "Family gift", icon: "💌" },
          { id: "tax", cost: 350, name: "Tax catch-up", icon: "🧾" },
        ];
        monthShock = pool[Math.floor(Math.random() * pool.length)];
      }

      let nextEmergency = emergency + toSave;
      let nextDebt = Math.max(0, debtBal - toDebt);
      let nextStress = stress;
      let nextHappiness = happiness;

      // Apply shock
      if (monthShock) {
        if (monthShock.cost > 0) {
          // pay from emergency, else stress + debt rises
          if (nextEmergency >= monthShock.cost) {
            nextEmergency -= monthShock.cost;
            nextStress -= 4; // covered easily
          } else {
            const shortfall = monthShock.cost - nextEmergency;
            nextEmergency = 0;
            nextDebt += shortfall * 1.2; // borrow at penalty
            nextStress += 14;
            nextHappiness -= 5;
          }
        } else {
          nextEmergency += -monthShock.cost; // bonus / gift → emergency
          nextStress -= 3;
          nextHappiness += 6;
        }
        setShocks(s => [...s, { month: month + 1, ...monthShock }]);
      }

      // Needs not met = stress climbs
      if (toNeeds < picked.fixedNeeds) {
        nextStress += 8;
        nextHappiness -= 4;
      }
      // Life share helps happiness
      if (toLife > 200) nextHappiness += 1;
      if (toLife < 50)  nextHappiness -= 2;

      // Soft caps
      nextStress = Math.max(0, Math.min(100, nextStress));
      nextHappiness = Math.max(0, Math.min(100, nextHappiness));

      setEmergency(nextEmergency);
      setDebtBal(nextDebt);
      setStress(nextStress);
      setHappiness(nextHappiness);
      setTimeline(t => [...t, { month: month + 1, emergency: nextEmergency, debtBal: nextDebt, stress: nextStress, happiness: nextHappiness }]);
      setMonth(m => m + 1);
    }, 600);
    return () => clearTimeout(t);
  }, [running, month, phase, emergency, debtBal, stress, happiness, alloc, picked]);

  // ─── PHASE: PICK ─────────────────────────────────────
  if (phase === "pick") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.teal, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>BUDGET HEALTH CHECK · PICK A NEIGHBOUR</div>
          </div>
          <button onClick={onBack} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid ${C.borderL}`, padding: "6px 14px", fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 2 }}>← BACK</button>
        </div>

        <div style={{ flex: 1, position: "relative", background: `linear-gradient(180deg, #04060f 0%, #0a1230 50%, #1a2454 100%)`, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <div style={{ textAlign: "center", maxWidth: 720 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.coral, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 8 }}>● THREE NEIGHBOURS · ONE BUDGET PROBLEM EACH</div>
            <div style={{ fontFamily: FONT_D, fontSize: 44, color: C.textCream, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>Who would you help first?</div>
            <div style={{ fontFamily: FONT_H, fontSize: 18, color: C.gold, fontWeight: 500, marginTop: 8 }}>Each starts with a different income, a different fixed cost, a different fear.</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, maxWidth: 1100, width: "100%" }}>
            {Object.entries(NEIGHBOURS).map(([id, n]) => (
              <button key={id} onClick={() => { setPickedId(id); setDebtBal(n.startDebt); setEmergency(0); setMonth(0); setShocks([]); setStress(50); setHappiness(50); setTimeline([{ month: 0, emergency: 0, debtBal: n.startDebt, stress: 50, happiness: 50 }]); setSortAnswers({}); setPhase("sort"); }} className="popupIn" style={{
                background: "rgba(255,248,238,0.97)", border: `2px solid ${n.color}`, borderRadius: 6,
                padding: "24px 22px", textAlign: "left", cursor: "pointer", transition: "all 0.2s",
                boxShadow: `0 14px 40px ${n.color}55`,
              }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ fontSize: 44, marginBottom: 6 }}>{n.icon}</div>
                <div style={{ fontFamily: FONT_D, fontSize: 26, color: C.ink, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1 }}>{n.name}</div>
                <div style={{ fontFamily: FONT_M, fontSize: 9, color: n.color, letterSpacing: "0.22em", fontWeight: 800, marginTop: 4 }}>{n.role.toUpperCase()}</div>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, fontFamily: FONT_M, color: C.textMuted }}>
                  <div><div style={{ fontSize: 8, letterSpacing: "0.22em", fontWeight: 800 }}>INCOME/MO</div><div style={{ fontFamily: FONT_D, fontSize: 18, color: C.ink, fontWeight: 800 }}>₺{n.income.toLocaleString()}</div></div>
                  <div><div style={{ fontSize: 8, letterSpacing: "0.22em", fontWeight: 800 }}>FIXED COSTS</div><div style={{ fontFamily: FONT_D, fontSize: 18, color: C.ink, fontWeight: 800 }}>₺{n.fixedNeeds.toLocaleString()}</div></div>
                  <div><div style={{ fontSize: 8, letterSpacing: "0.22em", fontWeight: 800 }}>DEBT</div><div style={{ fontFamily: FONT_D, fontSize: 18, color: n.startDebt > 0 ? C.coral : C.teal, fontWeight: 800 }}>₺{n.startDebt.toLocaleString()}</div></div>
                  <div><div style={{ fontSize: 8, letterSpacing: "0.22em", fontWeight: 800 }}>BUFFER</div><div style={{ fontFamily: FONT_D, fontSize: 18, color: C.coral, fontWeight: 800 }}>₺0</div></div>
                </div>
                <div style={{ marginTop: 12, fontFamily: FONT_B, fontSize: 12, color: C.text, lineHeight: 1.45, fontStyle: "italic" }}>"{n.hint}"</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: SORT — needs vs wants warm-up (v26) ──────
  // Research: this 30-second drill is the prerequisite skill for
  // budgeting — most teenagers cannot do it consistently.
  if (phase === "sort") {
    const ITEMS = [
      { id: "rent",     label: "Rent",                icon: "🏠", need: true },
      { id: "food",     label: "Weekly food shop",    icon: "🛒", need: true },
      { id: "stream",   label: "Streaming subscription", icon: "📺", need: false },
      { id: "bus",      label: "Bus pass to work",    icon: "🚌", need: true },
      { id: "trainers", label: "New trainers",        icon: "👟", need: false },
      { id: "elec",     label: "Electricity bill",    icon: "💡", need: true },
      { id: "takeaway", label: "Friday takeaway",     icon: "🍕", need: false },
      { id: "phone",    label: "Basic phone contract", icon: "📱", need: true },
    ];
    const answeredCount = Object.keys(sortAnswers).length;
    const correctCount = ITEMS.filter(it => sortAnswers[it.id] === it.need).length;
    const allDone = answeredCount === ITEMS.length;
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: picked.color, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>WARM-UP · NEEDS vs WANTS</div>
          </div>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>{answeredCount} OF {ITEMS.length} SORTED</div>
        </div>
        <div style={{ flex: 1, background: `linear-gradient(180deg, #04060f 0%, #0a1230 50%, #1a2454 100%)`, padding: 26, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, overflow: "auto" }}>
          <div style={{ textAlign: "center", maxWidth: 760 }}>
            <div style={{ fontFamily: FONT_D, fontSize: 36, color: C.textCream, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>Before you touch {picked.name}'s money…</div>
            <div style={{ fontFamily: FONT_D, fontSize: 15, color: C.gold, fontWeight: 600, fontStyle: "italic", marginTop: 8 }}>A need keeps life running. A want makes life nicer. Budgets fail when the two get confused. Sort these eight.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, maxWidth: 940, width: "100%" }}>
            {ITEMS.map((it) => {
              const ans = sortAnswers[it.id];
              const answered = ans !== undefined;
              const correct = answered && ans === it.need;
              return (
                <div key={it.id} className="popupIn" style={{ background: "rgba(255,248,238,0.97)", borderRadius: 6, padding: "14px 14px", border: `2px solid ${!answered ? C.borderCream : correct ? C.teal : C.coral}`, transition: "border 0.25s" }}>
                  <div style={{ fontSize: 26, textAlign: "center" }}>{it.icon}</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 14, color: C.ink, fontWeight: 800, textAlign: "center", lineHeight: 1.15, marginTop: 4, minHeight: 32 }}>{it.label}</div>
                  {!answered ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                      <button onClick={() => { setSortAnswers(a => ({ ...a, [it.id]: true })); if (it.need) SFX.coin(); else SFX.lose(); }} style={{ background: C.teal, color: "#fff", border: "none", padding: "8px 4px", fontFamily: FONT_M, fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", cursor: "pointer", borderRadius: 3 }}>NEED</button>
                      <button onClick={() => { setSortAnswers(a => ({ ...a, [it.id]: false })); if (!it.need) SFX.coin(); else SFX.lose(); }} style={{ background: C.rose, color: "#fff", border: "none", padding: "8px 4px", fontFamily: FONT_M, fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", cursor: "pointer", borderRadius: 3 }}>WANT</button>
                    </div>
                  ) : (
                    <div className="popupIn" style={{ marginTop: 8, textAlign: "center", fontFamily: FONT_M, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", color: correct ? C.teal : C.coral }}>
                      {correct ? "✓ " : "✗ "}{it.need ? "A NEED" : "A WANT"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {allDone && (
            <div className="popupIn" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ fontFamily: FONT_D, fontSize: 19, color: correctCount === ITEMS.length ? C.teal : C.gold, fontWeight: 800, fontStyle: "italic" }}>
                {correctCount === ITEMS.length ? "Perfect. Eight from eight — your instincts are sharp." : `${correctCount} of ${ITEMS.length}. Worth a second look at the ones in red.`}
              </div>
              <button onClick={() => { if (correctCount === ITEMS.length) dispatch({ type: "AWARD_BADGE", id: "needsKnower" }); SFX.click(); setPhase("allocate"); }} style={{ background: picked.color, color: "#fff", border: "none", padding: "15px 44px", fontFamily: FONT_M, fontSize: 12, fontWeight: 800, letterSpacing: "0.26em", cursor: "pointer", borderRadius: 3, boxShadow: `0 14px 36px ${picked.color}88` }}>
                NOW BUILD THE BUDGET →
              </button>
            </div>
          )}
        </div>
        <div style={{ background: "#000", height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em" }}>NEEDS FIRST · WANTS AFTER · ALWAYS</div>
        </div>
      </div>
    );
  }

  // ─── PHASE: ALLOCATE ─────────────────────────────────
  if (phase === "allocate") {
    const monthly = picked.income;
    const toNeeds = monthly * alloc.needs / 100;
    const toDebt = monthly * alloc.debt / 100;
    const toSave = monthly * alloc.save / 100;
    const toLife = monthly * alloc.life / 100;
    const projectedEmergency = toSave * 12;
    const projectedDebt = Math.max(0, debtBal - toDebt * 12);
    // Resilience score: needs covered + 3mo emergency + debt down + life > 0
    const monthsCovered = projectedEmergency / picked.fixedNeeds;
    const resilience = Math.max(0, Math.min(100,
      (needsMet ? 30 : -10) +
      Math.min(35, monthsCovered * 10) +
      (debtBal === 0 ? 15 : (1 - projectedDebt / Math.max(1, debtBal)) * 15) +
      (toLife > 100 ? 15 : toLife > 0 ? 8 : 0) +
      (allocSum === 100 ? 5 : -20)
    ));

    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: picked.color, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>BUDGET HEALTH CHECK · HELPING {picked.name.toUpperCase()}</div>
          </div>
          <button onClick={() => setPhase("pick")} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid ${C.borderL}`, padding: "6px 14px", fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 2 }}>← PICK ANOTHER</button>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, padding: 22, background: `linear-gradient(180deg, #04060f 0%, #0a1230 60%, #1a2454 100%)`, minHeight: 0 }}>

          {/* LEFT: Allocator */}
          <div style={{ background: "rgba(255,248,238,0.97)", borderRadius: 6, padding: "22px 26px", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, paddingBottom: 14, borderBottom: `2px solid ${C.borderCream}` }}>
              <div style={{ width: 56, height: 56, background: picked.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, borderRadius: 6 }}>{picked.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_D, fontSize: 24, color: C.ink, fontWeight: 900, lineHeight: 1 }}>{picked.name}'s monthly</div>
                <div style={{ fontFamily: FONT_M, fontSize: 10, color: picked.color, letterSpacing: "0.2em", fontWeight: 800, marginTop: 4 }}>INCOME ₺{monthly.toLocaleString()} · FIXED NEEDS ₺{picked.fixedNeeds.toLocaleString()}</div>
              </div>
            </div>

            {/* 50/30/20 — show the rule of thumb, let it snap (v26) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, padding: "10px 14px", background: `${C.gold}14`, border: `1.5px solid ${C.gold}88`, borderRadius: 5 }}>
              <div style={{ fontFamily: FONT_B, fontSize: 11.5, color: C.text, lineHeight: 1.45 }}>
                <strong>The <Term k="50/30/20">50/30/20 rule</Term>:</strong> 50% needs, 30% life, 20% saving and debt. A starting point, not a law — {picked.name}'s fixed costs may demand more.
              </div>
              <button onClick={() => { SFX.coin(); setAlloc(picked.startDebt > 0 ? { needs: 50, debt: 10, save: 10, life: 30 } : { needs: 50, debt: 0, save: 20, life: 30 }); }} style={{ background: C.gold, color: C.ink, border: "none", padding: "10px 16px", fontFamily: FONT_M, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.18em", cursor: "pointer", borderRadius: 3, whiteSpace: "nowrap", flexShrink: 0 }}>
                SNAP TO 50/30/20
              </button>
            </div>

            <BudgetSlider label="NEEDS" sub="Rent · food · bills · utilities" icon="🏠"
              value={alloc.needs} onChange={(v) => setSlider("needs", v)} color={needsMet ? C.teal : C.coral}
              amount={toNeeds} target={picked.fixedNeeds}
              warning={!needsMet ? "Below fixed costs — stress will climb fast." : null} />
            <BudgetSlider label="DEBT PAYDOWN" sub="Pay down loans, cards, supplier credit" icon="💳"
              value={alloc.debt} onChange={(v) => setSlider("debt", v)} color={C.purple}
              amount={toDebt} target={null} note={debtBal > 0 ? `Current debt: ₺${debtBal.toLocaleString()}` : "No debt to pay"} />
            <BudgetSlider label="EMERGENCY · SAVE" sub="Build a buffer for shocks" icon="💰"
              value={alloc.save} onChange={(v) => setSlider("save", v)} color={C.gold}
              amount={toSave} target={null} note="3 months of needs = a strong buffer" />
            <BudgetSlider label="LIFE" sub="Family, hobbies, joy — not optional" icon="🎉"
              value={alloc.life} onChange={(v) => setSlider("life", v)} color={C.rose}
              amount={toLife} target={null} note={toLife < 50 ? "Too austere — burnout risk" : null} />

            <div style={{ marginTop: 18, padding: "12px 16px", background: allocSum === 100 ? `${C.teal}22` : `${C.coral}22`, border: `2px solid ${allocSum === 100 ? C.teal : C.coral}`, borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.text, letterSpacing: "0.22em", fontWeight: 800 }}>TOTAL ALLOCATED</div>
                <div style={{ fontFamily: FONT_D, fontSize: 22, fontWeight: 900, color: allocSum === 100 ? C.teal : C.coral }}>{allocSum}%</div>
              </div>
              <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: "0.1em" }}>
                {allocSum === 100 ? "✓ READY TO RUN" : allocSum > 100 ? `Over by ${allocSum - 100}% — trim somewhere` : `Under by ${100 - allocSum}% — assign the rest`}
              </div>
            </div>
          </div>

          {/* RIGHT: Live forecast + Vostan resilience */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
            <div style={{ background: "rgba(255,248,238,0.97)", borderRadius: 6, padding: "18px 22px" }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 8 }}>● 12-MONTH FORECAST</div>
              <ForecastRow label="Emergency fund after 1 year" value={`₺${Math.round(projectedEmergency).toLocaleString()}`} sub={`${monthsCovered.toFixed(1)} months of needs`} color={monthsCovered >= 3 ? C.teal : monthsCovered >= 1.5 ? C.gold : C.coral} />
              <ForecastRow label="Debt remaining" value={`₺${Math.round(projectedDebt).toLocaleString()}`} sub={debtBal === 0 ? "No debt" : projectedDebt === 0 ? "✓ Debt cleared" : `Down from ₺${debtBal.toLocaleString()}`} color={projectedDebt === 0 ? C.teal : C.purple} />
              <ForecastRow label="Resilience score" value={`${Math.round(resilience)}/100`} sub={resilience >= 70 ? "Strong — can weather shocks" : resilience >= 40 ? "Fragile — one shock away from trouble" : "Critical — debt likely to spiral"} color={resilience >= 70 ? C.teal : resilience >= 40 ? C.gold : C.coral} big />
            </div>

            {/* Great Vostan resilience preview */}
            <div style={{ flex: 1, background: "linear-gradient(180deg, #0a1230 0%, #1a2454 60%, #2a1c4a 100%)", borderRadius: 6, padding: "14px 16px", border: `1px solid ${C.borderL}`, display: "flex", flexDirection: "column", minHeight: 180 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 6 }}>● NATIONAL IMPACT · IF 10,000 VOSTANIANS DID THIS</div>
              <div style={{ flex: 1, position: "relative" }}>
                <VostanSkyline resilience={resilience} />
              </div>
              <div style={{ fontFamily: FONT_B, fontSize: 11.5, color: C.textCream, lineHeight: 1.45, fontStyle: "italic", marginTop: 6 }}>
                {resilience >= 70 ? "Households absorb shocks. The Bank intervenes less. The currency stays stable. The Reserve has room to act when it matters."
                  : resilience >= 40 ? "Most weather small shocks. The big ones still tip the country. The Bank's tools work harder than they should."
                  : "Households break under shocks. Defaults rise. The Reserve carries the country — and loses leverage to do anything else."}
              </div>
            </div>

            <button onClick={() => { setRunning(true); setPhase("simulate"); }} disabled={allocSum !== 100} style={{
              background: allocSum === 100 ? C.coral : C.surface3,
              color: allocSum === 100 ? "#fff" : C.textMuted,
              border: "none", padding: "16px 28px",
              fontFamily: FONT_M, fontSize: 13, fontWeight: 800, letterSpacing: "0.28em",
              cursor: allocSum === 100 ? "pointer" : "not-allowed", borderRadius: 3,
              boxShadow: allocSum === 100 ? `0 14px 36px ${C.coral}66` : "none",
            }}>RUN 12 MONTHS →</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: SIMULATE ─────────────────────────────────
  if (phase === "simulate") {
    const recentShock = shocks[shocks.length - 1];
    const isShockMonth = recentShock && recentShock.month === month;
    const monthly = picked.income;
    const toNeeds = monthly * alloc.needs / 100;
    const toDebt = monthly * alloc.debt / 100;
    const toSave = monthly * alloc.save / 100;
    const toLife = monthly * alloc.life / 100;
    const targetEmergency = picked.fixedNeeds * 3;
    const mood = stress > 80 ? "😩" : stress > 60 ? "😰" : stress > 40 ? "😐" : happiness > 60 ? "😊" : "🙂";
    const moodLabel = stress > 80 ? "OVERWHELMED" : stress > 60 ? "STRESSED" : stress > 40 ? "COPING" : happiness > 60 ? "AT EASE" : "STEADY";
    const moodColor = stress > 80 ? C.red : stress > 60 ? C.coral : stress > 40 ? C.gold : C.teal;

    // Sparkline data — emergency fund growth & debt over months
    const maxFund = Math.max(targetEmergency, ...timeline.map(p => p.emergency), 100);
    const maxDebt = Math.max(picked.startDebt || 1, ...timeline.map(p => p.debtBal), 100);

    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>● LIVE · MONTH {month}/12 · {picked.name.toUpperCase()}</div>
          </div>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>FAST FORWARD</div>
        </div>

        <div style={{ flex: 1, position: "relative", background: `linear-gradient(180deg, #04060f 0%, #0a1230 35%, #1a1c4a 70%, #4a2c5a 100%)`, overflow: "hidden", padding: "20px 28px", display: "grid", gridTemplateColumns: "1.3fr 1fr", gridTemplateRows: "auto 1fr auto", gap: 16 }}>

          {/* TOP-LEFT — Month counter + progress dots */}
          <div style={{ gridColumn: "1", gridRow: "1", display: "flex", alignItems: "center", gap: 22 }}>
            <div>
              <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>MONTH</div>
              <div style={{ fontFamily: FONT_D, fontSize: 76, color: C.textCream, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.9, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}>{month}<span style={{ fontSize: 26, color: C.textCreamDim, fontWeight: 700 }}>/12</span></div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.28em", fontWeight: 700 }}>YEAR PROGRESS</div>
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: 12 }).map((_, i) => {
                  const monthShock = shocks.find(s => s.month === i + 1);
                  return (
                    <div key={i} style={{
                      flex: 1, height: 18, borderRadius: 2,
                      background: i < month ? (monthShock ? (monthShock.cost > 0 ? C.coral : C.teal) : C.gold) : "rgba(255,255,255,0.08)",
                      border: i === month - 1 ? `2px solid ${C.gold}` : "none",
                      transition: "background 0.3s",
                      position: "relative",
                    }}>
                      {monthShock && i < month && <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 11 }}>{monthShock.icon}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TOP-RIGHT — Neighbour mood card */}
          <div style={{ gridColumn: "2", gridRow: "1", background: "rgba(255,248,238,0.97)", borderRadius: 6, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14, borderLeft: `4px solid ${moodColor}` }}>
            <div style={{ width: 56, height: 56, background: picked.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, borderRadius: 8 }}>{picked.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 800 }}>{picked.name.toUpperCase()}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 28 }}>{mood}</span>
                <span style={{ fontFamily: FONT_D, fontSize: 16, color: moodColor, fontWeight: 900, letterSpacing: "-0.01em" }}>{moodLabel}</span>
              </div>
            </div>
          </div>

          {/* CENTRE-LEFT — Animated coin flow into 4 jars */}
          <div style={{ gridColumn: "1", gridRow: "2", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", minHeight: 0 }}>
            {/* Income coin source — pulses each month */}
            <div key={`income-${month}`} style={{
              background: "rgba(255,248,238,0.97)", padding: "10px 22px", borderRadius: 30,
              fontFamily: FONT_D, fontSize: 22, fontWeight: 900, color: C.ink,
              boxShadow: `0 8px 30px ${C.gold}66`, border: `2px solid ${C.gold}`,
              display: "flex", alignItems: "center", gap: 10,
              animation: month > 0 ? "pulse 0.5s ease-out" : "none",
            }}>
              <span style={{ fontSize: 22 }}>💵</span>
              <span>INCOME ₺{monthly.toLocaleString()}</span>
            </div>

            {/* Falling coins SVG between income source and jars */}
            <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" style={{ marginTop: 6 }}>
              {[
                { x: 60, color: needsMet ? C.teal : C.coral, delay: 0 },
                { x: 160, color: C.purple, delay: 0.1 },
                { x: 240, color: C.gold, delay: 0.2 },
                { x: 340, color: C.rose, delay: 0.3 },
              ].map((coin, i) => (
                <g key={`coin-${month}-${i}`}>
                  <line x1="200" y1="2" x2={coin.x} y2="58" stroke={coin.color} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.5" />
                  <circle cx={coin.x} cy="58" r="6" fill={coin.color}>
                    <animateMotion key={month} path={`M 0,-56 L ${coin.x - 200},0`} dur="0.6s" begin={`${coin.delay}s`} fill="freeze" />
                  </circle>
                </g>
              ))}
            </svg>

            {/* 4 jars side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, width: "100%" }}>
              <BudgetJar label="NEEDS" amount={toNeeds} color={needsMet ? C.teal : C.coral} icon="🏠" fillPct={Math.min(100, (toNeeds / picked.fixedNeeds) * 100)} sub={`₺${Math.round(toNeeds)}/mo`} />
              <BudgetJar label="DEBT" amount={toDebt} color={C.purple} icon="💳" fillPct={picked.startDebt > 0 ? Math.max(2, 100 - (debtBal / picked.startDebt) * 100) : 100} sub={`₺${Math.round(debtBal).toLocaleString()} left`} />
              <BudgetJar label="EMERGENCY" amount={toSave} color={C.gold} icon="💰" fillPct={Math.min(100, (emergency / targetEmergency) * 100)} sub={`₺${Math.round(emergency).toLocaleString()}`} big />
              <BudgetJar label="LIFE" amount={toLife} color={C.rose} icon="🎉" fillPct={Math.min(100, (toLife / 400) * 100)} sub={`₺${Math.round(toLife)}/mo`} />
            </div>
          </div>

          {/* CENTRE-RIGHT — Live sparkline chart */}
          <div style={{ gridColumn: "2", gridRow: "2", background: "rgba(255,248,238,0.04)", border: `1px solid ${C.borderL}`, borderRadius: 6, padding: "14px 16px", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 6 }}>● 12-MONTH TRAJECTORY</div>
            <div style={{ flex: 1, position: "relative", minHeight: 140 }}>
              <svg viewBox="0 0 240 140" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                {/* Y-axis ticks (subtle) */}
                {[0, 35, 70, 105, 140].map((y, i) => (
                  <line key={i} x1="0" y1={y} x2="240" y2={y} stroke={C.borderL} strokeWidth="0.4" opacity="0.4" />
                ))}
                {/* Target emergency line */}
                <line x1="0" y1="35" x2="240" y2="35" stroke={C.teal} strokeWidth="0.6" strokeDasharray="2 3" opacity="0.6" />
                <text x="3" y="33" fill={C.teal} fontFamily={FONT_M} fontSize="6" fontWeight="700" letterSpacing="0.1em">3-MONTH TARGET</text>

                {/* Emergency fund line (teal/gold) */}
                {timeline.length > 1 && (
                  <polyline
                    points={timeline.map(p => `${(p.month / 12) * 240},${140 - (p.emergency / maxFund) * 100}`).join(" ")}
                    fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 4px ${C.gold}88)` }}
                  />
                )}
                {/* Debt line (purple) */}
                {timeline.length > 1 && picked.startDebt > 0 && (
                  <polyline
                    points={timeline.map(p => `${(p.month / 12) * 240},${140 - (p.debtBal / maxDebt) * 100}`).join(" ")}
                    fill="none" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 4px ${C.purple}88)` }}
                  />
                )}
                {/* Stress line (coral, thin) */}
                {timeline.length > 1 && (
                  <polyline
                    points={timeline.map(p => `${(p.month / 12) * 240},${140 - (p.stress / 100) * 100}`).join(" ")}
                    fill="none" stroke={C.coral} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" opacity="0.7"
                  />
                )}
                {/* Latest data dot */}
                {timeline.length > 1 && (
                  <circle cx={(timeline[timeline.length - 1].month / 12) * 240} cy={140 - (timeline[timeline.length - 1].emergency / maxFund) * 100} r="4" fill={C.gold} stroke="#fff" strokeWidth="1">
                    <animate attributeName="r" values="3;6;3" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_M, fontSize: 9, color: C.textCream, letterSpacing: "0.12em", fontWeight: 700 }}>
                <span style={{ width: 14, height: 2, background: C.gold, display: "inline-block", borderRadius: 1 }} />EMERGENCY ₺{Math.round(emergency).toLocaleString()}
              </div>
              {picked.startDebt > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_M, fontSize: 9, color: C.textCream, letterSpacing: "0.12em", fontWeight: 700 }}>
                  <span style={{ width: 14, height: 2, background: C.purple, display: "inline-block", borderRadius: 1 }} />DEBT ₺{Math.round(debtBal).toLocaleString()}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_M, fontSize: 9, color: C.textCream, letterSpacing: "0.12em", fontWeight: 700 }}>
                <span style={{ width: 14, height: 2, background: C.coral, display: "inline-block", borderRadius: 1 }} />STRESS {Math.round(stress)}%
              </div>
            </div>
          </div>

          {/* BOTTOM: 4 live meters spanning full width */}
          <div style={{ gridColumn: "1 / 3", gridRow: "3", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <SimMeter label="EMERGENCY FUND" value={`₺${Math.round(emergency).toLocaleString()}`} pct={Math.min(100, (emergency / targetEmergency) * 100)} color={C.teal} icon="💰" />
            <SimMeter label="DEBT" value={`₺${Math.round(debtBal).toLocaleString()}`} pct={picked.startDebt > 0 ? Math.min(100, (debtBal / picked.startDebt) * 100) : 0} color={C.purple} icon="💳" inverse />
            <SimMeter label="STRESS" value={`${Math.round(stress)}%`} pct={stress} color={C.coral} icon="😰" inverse />
            <SimMeter label="HAPPINESS" value={`${Math.round(happiness)}%`} pct={happiness} color={C.rose} icon="😊" />
          </div>

          {/* Floating shock event card */}
          {isShockMonth && (
            <div key={recentShock.month} className="popupIn" style={{
              position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)",
              background: recentShock.cost > 0 ? `${C.coral}` : `${C.teal}`,
              color: "#fff", padding: "14px 26px", borderRadius: 6,
              fontFamily: FONT_D, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em",
              boxShadow: `0 16px 50px ${recentShock.cost > 0 ? C.coral : C.teal}88`,
              display: "flex", alignItems: "center", gap: 12, zIndex: 5,
              border: `2px solid #fff`,
            }}>
              <span style={{ fontSize: 32 }}>{recentShock.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontFamily: FONT_M, letterSpacing: "0.22em", fontWeight: 800, opacity: 0.85 }}>{recentShock.cost > 0 ? "● UNEXPECTED COST" : "● GOOD NEWS"}</div>
                <div>{recentShock.name} {recentShock.cost > 0 ? `−₺${recentShock.cost}` : `+₺${-recentShock.cost}`}</div>
              </div>
            </div>
          )}

          {/* Skyline at very bottom — lights tick on as resilience grows */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, overflow: "hidden", opacity: 0.7, pointerEvents: "none" }}>
            <VostanSkyline resilience={Math.max(0, Math.min(100, 30 + (emergency / 100) - (stress / 4)))} thin />
          </div>
        </div>

        <div style={{ background: "#000", height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em" }}>12 MONTHS · ONE HOUSEHOLD · ONE COUNTRY</div>
        </div>
      </div>
    );
  }

  // ─── PHASE: RESULT ──────────────────────────────────
  const monthsCovered = emergency / picked.fixedNeeds;
  const resilienceFinal = Math.max(0, Math.min(100,
    (needsMet ? 30 : -10) +
    Math.min(35, monthsCovered * 12) +
    (debtBal === 0 ? 18 : Math.max(0, (1 - debtBal / Math.max(1, picked.startDebt)) * 18)) +
    (happiness > 50 ? 12 : happiness > 30 ? 6 : -4) +
    ((100 - stress) / 100) * 15
  ));
  const grade = resilienceFinal >= 80 ? "A" : resilienceFinal >= 65 ? "B" : resilienceFinal >= 45 ? "C" : "D";
  const headline = resilienceFinal >= 80 ? "Resilient. Sheltered. Sleeping well."
    : resilienceFinal >= 65 ? "Solid. Not invincible. Building."
    : resilienceFinal >= 45 ? "Hanging on. One bad month from trouble."
    : "Fragile. Debt up. Stress up. The shocks won.";

  return (
    <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.gold, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>BUDGET HEALTH CHECK · RESULT · {picked.name.toUpperCase()}</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>12 MONTHS COMPLETE</div>
      </div>

      <div style={{ flex: 1, padding: 30, background: `linear-gradient(180deg, #04060f 0%, #0a1230 60%, #1a2454 100%)`, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22, overflow: "auto" }}>
        {/* LEFT: Score */}
        <div style={{ background: "rgba(255,248,238,0.97)", borderRadius: 6, padding: "30px 36px" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: picked.color, letterSpacing: "0.32em", fontWeight: 800 }}>● HOUSEHOLD RESILIENCE</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 10 }}>
            <div style={{ fontFamily: FONT_D, fontSize: 130, color: C.ink, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.85 }}>{Math.round(resilienceFinal)}</div>
            <div style={{ paddingBottom: 14 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 700 }}>OUT OF 100</div>
              <div style={{ fontFamily: FONT_D, fontSize: 38, color: grade === "A" ? C.teal : grade === "B" ? C.gold : grade === "C" ? C.coral : C.red, fontWeight: 900, lineHeight: 1 }}>GRADE {grade}</div>
            </div>
          </div>
          <div style={{ fontFamily: FONT_H, fontSize: 24, color: C.ink, fontWeight: 600, marginTop: 8 }}>{headline}</div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.borderCream}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <ResultRow label="Final emergency fund" value={`₺${Math.round(emergency).toLocaleString()}`} sub={`${monthsCovered.toFixed(1)} months of needs`} color={C.teal} />
            <ResultRow label="Final debt" value={`₺${Math.round(debtBal).toLocaleString()}`} sub={debtBal === 0 ? "Debt-free" : "Still carrying"} color={debtBal === 0 ? C.teal : C.purple} />
            <ResultRow label="Stress level" value={`${Math.round(stress)}%`} sub={stress < 40 ? "Low" : stress < 70 ? "Moderate" : "High"} color={C.coral} />
            <ResultRow label="Happiness" value={`${Math.round(happiness)}%`} sub={happiness > 60 ? "Life felt full" : happiness > 35 ? "Coping" : "Joyless"} color={C.rose} />
          </div>

          {shocks.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.borderCream}` }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 800, marginBottom: 8 }}>● {shocks.length} SHOCK{shocks.length === 1 ? "" : "S"} OVER THE YEAR</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {shocks.map((s, i) => (
                  <div key={i} style={{ background: s.cost > 0 ? `${C.coral}22` : `${C.teal}22`, border: `1px solid ${s.cost > 0 ? C.coral : C.teal}`, padding: "5px 10px", borderRadius: 3, fontFamily: FONT_M, fontSize: 10, color: C.text, fontWeight: 700 }}>
                    <span style={{ marginRight: 4 }}>{s.icon}</span>{s.name} · M{s.month}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: National impact + lessons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "linear-gradient(180deg, #0a1230 0%, #1a2454 60%, #2a1c4a 100%)", borderRadius: 6, padding: "18px 22px", border: `2px solid ${C.gold}66` }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.28em", fontWeight: 800 }}>● NATIONAL IMPACT</div>
            <div style={{ fontFamily: FONT_D, fontSize: 28, color: C.textCream, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 6 }}>
              If 10,000 Vostanians budget like this…
            </div>
            <div style={{ marginTop: 14, height: 90, position: "relative" }}>
              <VostanSkyline resilience={resilienceFinal} />
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 4 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.22em", fontWeight: 800, marginBottom: 6 }}>PROJECTED COUNTRY-LEVEL EFFECTS</div>
              <div style={{ fontFamily: FONT_B, fontSize: 12, color: C.textCream, lineHeight: 1.5 }}>
                {resilienceFinal >= 80 ? "Default rates ↓ 38%. Personal insolvencies ↓ 44%. Central bank can keep rates lower for longer. ₺2.1bn saved in intervention costs."
                  : resilienceFinal >= 65 ? "Default rates ↓ 22%. Insolvencies ↓ 28%. The Reserve has more room to act in a real crisis. ₺840m saved."
                  : resilienceFinal >= 45 ? "Default rates ↓ 6%. The Reserve carries more weight. Tools wear thin in normal times — less left for shocks."
                  : "Default rates ↑ 12%. The Reserve becomes the safety net for households. Currency credibility under strain."}
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,248,238,0.95)", borderRadius: 6, padding: "16px 20px" }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 8 }}>● THE LESSON</div>
            <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.ink, fontWeight: 700, lineHeight: 1.4 }}>
              {monthsCovered >= 3 ? "Three months of expenses in reserve is the line between 'shock' and 'crisis'. You held that line." :
               monthsCovered >= 1 ? "Some buffer is better than none. Aim for three months — that's the resilience floor central banks count on." :
               "Without an emergency fund, every shock becomes new debt. Build the cushion first, then everything else."}
            </div>
          </div>

          {/* WHAT HAPPENED, AND WHY — specific to this run (v26) */}
          <div style={{ background: "rgba(255,248,238,0.95)", borderRadius: 6, padding: "16px 20px" }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.blue, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 8 }}>● WHAT HAPPENED, AND WHY</div>
            <div style={{ fontFamily: FONT_B, fontSize: 12, color: C.text, lineHeight: 1.6 }}>
              {(() => {
                const lines = [];
                const costShocks = shocks.filter(sh => sh.cost > 0);
                if (!needsMet) lines.push(`You allocated ₺${Math.round(picked.income * alloc.needs / 100).toLocaleString()} to needs against fixed costs of ₺${picked.fixedNeeds.toLocaleString()} — the gap fed stress every single month.`);
                if (debtBal > picked.startDebt) lines.push(`The emergency jar could not absorb ${costShocks.length === 1 ? "the shock" : "the shocks"}, so the shortfall became new debt at a penalty rate. That is the trap a buffer exists to prevent.`);
                else if (costShocks.length > 0 && monthsCovered >= 1) lines.push(`${costShocks.length === 1 ? "One shock" : `${costShocks.length} shocks`} hit, and the emergency jar absorbed ${debtBal <= picked.startDebt ? "them without new borrowing" : "most of it"} — that is exactly what it is for.`);
                if (costShocks.length === 0) lines.push("No costly shocks landed this year. A kind year — but the buffer you built is what makes the unkind years survivable.");
                if (alloc.life * picked.income / 100 < 50) lines.push("Almost nothing went to life. Budgets that feel like punishment get abandoned — joy is a line item, not a luxury.");
                if (lines.length === 0) lines.push("A balanced plan met a normal year: needs covered, buffer growing, debt falling, life funded. This is what boring, brilliant budgeting looks like.");
                return lines.slice(0, 3).map((l, i) => <div key={i} style={{ marginBottom: 6 }}>◦ {l}</div>);
              })()}
            </div>
            <TakeThisHome game="budget" accent={C.teal} dispatch={dispatch} options={[
              "Write down my real fixed costs — the honest number",
              "Open a separate space for an emergency fund, even ₺10/week",
              "Try 50/30/20 against my own income this month",
            ]} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => { setPickedId(null); setPhase("pick"); setAlloc({ needs: 55, debt: 15, save: 15, life: 15 }); }} style={{ flex: 1, background: "transparent", color: C.textCream, border: `1px solid ${C.borderL}`, padding: "14px 20px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>HELP ANOTHER →</button>
            <button onClick={onBack} style={{ flex: 1, background: C.coral, color: "#fff", border: "none", padding: "14px 20px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>DONE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BudgetHealthCheck helpers ─────────────────────────────
function BudgetSlider({ label, sub, icon, value, onChange, color, amount, target, note, warning }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontFamily: FONT_M, fontSize: 10, color: C.text, letterSpacing: "0.18em", fontWeight: 800 }}>{label}</span>
          <span style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, marginLeft: 6 }}>{sub}</span>
        </div>
        <div style={{ fontFamily: FONT_D, fontSize: 18, color, fontWeight: 800 }}>
          {value}<span style={{ fontSize: 11 }}>%</span>
          <span style={{ fontFamily: FONT_M, fontSize: 10, color: C.textMuted, marginLeft: 8, fontWeight: 700 }}>₺{Math.round(amount).toLocaleString()}</span>
        </div>
      </div>
      <input type="range" min="0" max="80" step="1" value={value} onChange={(e) => onChange(parseInt(e.target.value))} style={{ width: "100%", accentColor: color }} />
      {warning && <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.coral, marginTop: 2, fontWeight: 600 }}>⚠ {warning}</div>}
      {note && !warning && <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function ForecastRow({ label, value, sub, color, big }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.surface3}` }}>
      <div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.18em", fontWeight: 700 }}>{label}</div>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.text, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontFamily: FONT_D, fontSize: big ? 26 : 18, color, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

// Visual jar that fills based on percentage
function BudgetJar({ label, color, icon, fillPct, sub, amount, big }) {
  return (
    <div style={{ background: "rgba(255,248,238,0.97)", borderRadius: 6, padding: "10px 12px 14px", borderTop: `3px solid ${color}`, position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: FONT_M, fontSize: 8, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 800 }}>{label}</span>
      </div>
      {/* Jar visualisation */}
      <div style={{ position: "relative", height: big ? 88 : 64, background: "#e8dcb8", borderRadius: "4px 4px 6px 6px", overflow: "hidden", border: `1px solid ${C.borderCream}` }}>
        {/* Liquid fill */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${Math.max(2, Math.min(100, fillPct))}%`,
          background: `linear-gradient(180deg, ${color}88 0%, ${color} 60%)`,
          transition: "height 0.6s cubic-bezier(0.34, 1.2, 0.5, 1)",
        }}>
          {/* Wave at the top of the liquid */}
          <div style={{ position: "absolute", top: -3, left: 0, right: 0, height: 6, background: color, opacity: 0.8, borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />
        </div>
        {/* Fill percentage */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_D, fontSize: big ? 22 : 16, fontWeight: 900, color: fillPct > 50 ? "#fff" : C.ink, textShadow: fillPct > 50 ? "0 1px 2px rgba(0,0,0,0.3)" : "none", letterSpacing: "-0.01em" }}>
          {Math.round(fillPct)}<span style={{ fontSize: big ? 12 : 10 }}>%</span>
        </div>
      </div>
      <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.06em", fontWeight: 700, marginTop: 6, textAlign: "center" }}>{sub}</div>
    </div>
  );
}

function SimMeter({ label, value, pct, color, icon, inverse }) {
  return (
    <div style={{ background: "rgba(255,248,238,0.95)", borderRadius: 4, padding: "10px 14px", borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: FONT_M, fontSize: 9, color: C.text, letterSpacing: "0.22em", fontWeight: 800 }}>{icon} {label}</span>
      </div>
      <div style={{ fontFamily: FONT_D, fontSize: 22, color, fontWeight: 900, lineHeight: 1 }}>{value}</div>
      <div style={{ position: "relative", height: 4, background: C.surface3, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, width: `${Math.max(2, Math.min(100, pct))}%`, background: color, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function ResultRow({ label, value, sub, color }) {
  return (
    <div style={{ padding: "10px 12px", background: C.surface2, borderRadius: 3, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.2em", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.ink, fontWeight: 900, marginTop: 2 }}>{value}</div>
      <div style={{ fontFamily: FONT_M, fontSize: 10, color, fontWeight: 700, marginTop: 1 }}>{sub}</div>
    </div>
  );
}

// VostanSkyline: shows the country's resilience as a skyline with windows lighting up
function VostanSkyline({ resilience, thin }) {
  const lit = Math.round((resilience / 100) * 96); // up to 96 windows
  const buildings = [
    { x: 20, w: 50, h: thin ? 38 : 78, c: C.bStocks },
    { x: 85, w: 40, h: thin ? 28 : 58, c: C.bBank },
    { x: 140, w: 55, h: thin ? 46 : 92, c: C.bMarket },
    { x: 210, w: 38, h: thin ? 32 : 64, c: C.bCinema },
    { x: 263, w: 60, h: thin ? 50 : 100, c: C.gold }, // The Reserve
    { x: 338, w: 42, h: thin ? 30 : 60, c: C.bFlat },
    { x: 395, w: 50, h: thin ? 38 : 78, c: C.bStocks },
    { x: 460, w: 36, h: thin ? 26 : 54, c: C.bBank },
    { x: 510, w: 48, h: thin ? 36 : 72, c: C.bMarket },
    { x: 572, w: 40, h: thin ? 32 : 64, c: C.bCinema },
  ];
  let windowCount = 0;
  return (
    <svg viewBox={`0 0 632 ${thin ? 60 : 110}`} preserveAspectRatio="xMidYEnd meet" style={{ width: "100%", height: "100%" }}>
      {buildings.map((b, i) => {
        const cols = 3;
        const rows = Math.max(1, Math.floor((b.h - 10) / (thin ? 7 : 12)));
        return (
          <g key={i}>
            <rect x={b.x} y={(thin ? 60 : 110) - b.h} width={b.w} height={b.h} fill={b.c} opacity="0.85" />
            <rect x={b.x} y={(thin ? 60 : 110) - b.h} width={b.w} height={b.h} fill="#0a0f24" opacity="0.4" />
            {/* Special: Reserve building has a gold accent */}
            {i === 4 && <rect x={b.x} y={(thin ? 60 : 110) - b.h} width={b.w} height="3" fill={C.goldBright} />}
            {/* Windows */}
            {Array.from({ length: rows }).map((_, r) => (
              Array.from({ length: cols }).map((_, c) => {
                const wx = b.x + 5 + c * ((b.w - 10) / cols);
                const wy = (thin ? 60 : 110) - b.h + 6 + r * (thin ? 7 : 12);
                const isLit = windowCount++ < lit;
                return <rect key={`${r}-${c}`} x={wx} y={wy} width={thin ? 3 : 4} height={thin ? 4 : 6}
                  fill={isLit ? C.goldBright : "#1a0f2a"} opacity={isLit ? 1 : 0.5}>
                  {isLit && <animate attributeName="opacity" values="0.7;1;0.7" dur={`${2 + (windowCount % 4)}s`} repeatCount="indefinite" />}
                </rect>;
              })
            ))}
          </g>
        );
      })}
      {/* Ground line */}
      <rect x="0" y={(thin ? 60 : 110) - 4} width="632" height="4" fill="#0a0f24" />
    </svg>
  );
}

// ─── NEW MINI-GAME: COMPOUND RACE ───────────────────────────
// Pick a monthly contribution. Watch three strategies race forty years side-by-side.
function CompoundRace({ state, dispatch, onBack }) {
  const [phase, setPhase] = useState("setup"); // setup | racing | result
  const [monthly, setMonthly] = useState(150); // monthly contribution
  const [year, setYear] = useState(0);
  const [mattress, setMattress] = useState(500); // cash
  const [safe, setSafe] = useState(500); // bonds
  const [growth, setGrowth] = useState(500); // stocks
  const [history, setHistory] = useState([{ year: 0, mattress: 500, safe: 500, growth: 500 }]);
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [lateGrowth, setLateGrowth] = useState(0); // ghost runner — same habit, started 10 years late

  // Generate a deterministic-ish event schedule per game
  const eventSchedule = useMemo(() => {
    const sched = {};
    // 2-3 crashes
    const crashYears = [];
    for (let i = 0; i < 3; i++) {
      const y = Math.floor(8 + Math.random() * 30);
      if (!crashYears.includes(y)) crashYears.push(y);
    }
    crashYears.forEach(y => { sched[y] = { type: "crash", growthDelta: -0.22 - Math.random() * 0.12, name: "MARKET CRASH", icon: "📉" }; });
    // 2 booms
    const boomYears = [];
    for (let i = 0; i < 2; i++) {
      let y;
      do { y = Math.floor(5 + Math.random() * 32); } while (sched[y]);
      boomYears.push(y);
    }
    boomYears.forEach(y => { sched[y] = { type: "boom", growthDelta: 0.18 + Math.random() * 0.12, name: "BULL RUN", icon: "🚀" }; });
    // 1 inflation spike (affects mattress)
    let infY;
    do { infY = Math.floor(10 + Math.random() * 24); } while (sched[infY]);
    sched[infY] = { type: "inflation", mattressDelta: -0.05, safeDelta: -0.02, name: "INFLATION SPIKE", icon: "🔥" };
    return sched;
  }, [phase === "setup" ? "fresh" : "stable"]); // regenerate only on setup

  // Race tick
  useEffect(() => {
    if (!running || phase !== "racing") return;
    if (year >= 40) { setRunning(false); SFX.win(); setPhase("result"); return; }
    const t = setTimeout(() => {
      // Returns (real, after inflation)
      let mattressRet = -0.018; // cash loses to inflation by ~1.8% real
      let safeRet = 0.03 + (Math.random() - 0.5) * 0.02;
      let growthRet = 0.075 + (Math.random() - 0.5) * 0.10;

      // Apply event for this year
      const event = eventSchedule[year + 1];
      if (event) {
        if (event.growthDelta) growthRet += event.growthDelta;
        if (event.mattressDelta) mattressRet += event.mattressDelta;
        if (event.safeDelta) safeRet += event.safeDelta;
        setEvents(e => [...e, { ...event, year: year + 1 }]);
      }

      const annualContrib = monthly * 12;
      const newMattress = Math.max(0, mattress * (1 + mattressRet) + annualContrib);
      const newSafe = Math.max(0, safe * (1 + safeRet) + annualContrib);
      const newGrowth = Math.max(0, growth * (1 + growthRet) + annualContrib);
      // Ghost runner — identical Growth strategy, but starts at year 10
      const newLate = (year + 1) < 10 ? 0 : (year + 1) === 10 ? 500 + annualContrib : Math.max(0, lateGrowth * (1 + growthRet) + annualContrib);

      setMattress(newMattress);
      setSafe(newSafe);
      setGrowth(newGrowth);
      setLateGrowth(newLate);
      setHistory(h => [...h, { year: year + 1, mattress: newMattress, safe: newSafe, growth: newGrowth }]);
      setYear(y => y + 1);
    }, 240);
    return () => clearTimeout(t);
  }, [running, year, phase, mattress, safe, growth, monthly, eventSchedule, lateGrowth]);

  const formatMoney = (n) => {
    if (n >= 1000000) return `₺${(n / 1000000).toFixed(2)}m`;
    if (n >= 10000) return `₺${Math.round(n / 1000)}k`;
    return `₺${Math.round(n).toLocaleString()}`;
  };

  // ─── PHASE: SETUP ─────────────────────────────────
  if (phase === "setup") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.gold, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>COMPOUND RACE · SET YOUR STAKE</div>
          </div>
          <button onClick={onBack} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid ${C.borderL}`, padding: "6px 14px", fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 2 }}>← BACK</button>
        </div>

        <div style={{ flex: 1, position: "relative", background: `linear-gradient(180deg, #04060f 0%, #0a1230 40%, #2a1c4a 80%, ${C.skyHorizon} 100%)`, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "40px 50px", maxWidth: 760, width: "100%", borderRadius: 6, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: `2px solid ${C.gold}` }}>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.coral, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 6 }}>● THE 40-YEAR EXPERIMENT</div>
            <div style={{ fontFamily: FONT_D, fontSize: 50, color: C.ink, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: 12 }}>Compound Race.</div>
            <div style={{ fontFamily: FONT_H, fontSize: 22, color: C.gold, fontWeight: 600, marginBottom: 22 }}>Same starting pot. Same monthly habit. Three different homes for the money.</div>

            {/* Three strategy preview cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
              <StrategyPreview color={C.coral} icon="🛏" name="MATTRESS" desc="Cash under the bed. Safe? Or eaten alive by inflation?" />
              <StrategyPreview color={C.teal} icon="🛡" name="SAFE" desc="Government bonds. Steady. Just above inflation." />
              <StrategyPreview color={C.gold} icon="📈" name="GROWTH" desc="Stocks. Wild swings. Crashes hurt. Time forgives." />
            </div>

            <div style={{ padding: "18px 22px", background: C.surface2, borderRadius: 6, border: `1px solid ${C.borderCream}`, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.text, letterSpacing: "0.22em", fontWeight: 800 }}>SAVE THIS MUCH EACH MONTH</div>
                <div style={{ fontFamily: FONT_D, fontSize: 34, color: C.coral, fontWeight: 900 }}>₺{monthly}<span style={{ fontSize: 16, color: C.textMuted, fontWeight: 700 }}>/mo</span></div>
              </div>
              <input type="range" min="25" max="500" step="25" value={monthly} onChange={(e) => setMonthly(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.coral }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: FONT_M, color: C.textMuted, marginTop: 4 }}>
                <span>₺25 · symbolic</span><span>₺150 · realistic</span><span>₺300 · committed</span><span>₺500 · serious</span>
              </div>
              <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.textMuted, marginTop: 10, lineHeight: 1.4 }}>
                Starting pot ₺500 · 40 years · same contribution into all three accounts.
                Across the whole race that's <strong style={{ color: C.ink }}>₺{(monthly * 12 * 40).toLocaleString()}</strong> of your own money going in.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={onBack} style={{ background: "transparent", color: C.textMuted, border: `1px solid ${C.borderCream}`, padding: "14px 24px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 3 }}>← WALK AWAY</button>
              <button onClick={() => {
                setMattress(500); setSafe(500); setGrowth(500); setLateGrowth(0); setYear(0); setEvents([]); setHistory([{ year: 0, mattress: 500, safe: 500, growth: 500 }]);
                setPhase("racing"); setRunning(true);
              }} style={{ background: C.gold, color: "#0a0f24", border: "none", padding: "16px 42px", fontFamily: FONT_M, fontSize: 13, fontWeight: 800, letterSpacing: "0.28em", cursor: "pointer", borderRadius: 3, boxShadow: `0 14px 36px ${C.gold}88` }}>
                START THE RACE 🏁
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PHASE: RACING ─────────────────────────────────
  if (phase === "racing" || phase === "result") {
    const maxVal = Math.max(mattress, safe, growth, 5000); // scale bars to fit
    const recentEvent = events[events.length - 1];
    const isEventYear = recentEvent && recentEvent.year === year;

    const lanes = [
      { id: "mattress", value: mattress, color: C.coral, icon: "🛏", name: "MATTRESS",  desc: "Cash" },
      { id: "safe",     value: safe,     color: C.teal,  icon: "🛡", name: "SAFE",      desc: "Bonds" },
      { id: "growth",   value: growth,   color: C.gold,  icon: "📈", name: "GROWTH",    desc: "Stocks" },
    ];
    // Find leader for crown
    const leader = lanes.reduce((a, b) => a.value > b.value ? a : b).id;

    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: phase === "result" ? C.gold : C.coral, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>● {phase === "result" ? "RACE COMPLETE" : "LIVE"} · YEAR {year}/40 · ₺{monthly}/MO</div>
          </div>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>{phase === "result" ? "FINAL TALLY" : "FAST FORWARD"}</div>
        </div>

        <div style={{ flex: 1, position: "relative", background: `linear-gradient(180deg, #04060f 0%, #0a1230 35%, #1a1c4a 70%, #4a2c5a 100%)`, overflow: "hidden", padding: "24px 36px 14px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* TOP: Year counter + invested-so-far */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>YEAR</div>
              <div style={{ fontFamily: FONT_D, fontSize: 68, color: C.textCream, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.9, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{year}<span style={{ fontSize: 22, color: C.textCreamDim, fontWeight: 700 }}>/40</span></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.28em", fontWeight: 700 }}>OUT OF YOUR POCKET</div>
              <div style={{ fontFamily: FONT_D, fontSize: 28, color: C.textCream, fontWeight: 900, letterSpacing: "-0.01em" }}>₺{(monthly * 12 * year + 500).toLocaleString()}</div>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.18em", marginTop: 2 }}>₺{monthly}/mo × {year} yrs + ₺500 start</div>
            </div>
          </div>

          {/* THE RACE — three lanes growing vertically */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, minHeight: 0 }}>
            {lanes.map((lane) => {
              const pct = Math.min(100, (lane.value / maxVal) * 100);
              const isLeader = lane.id === leader && year > 5;
              // Is this lane being shocked this year?
              const affectedByEvent = isEventYear && recentEvent && (
                (lane.id === "growth" && (recentEvent.type === "crash" || recentEvent.type === "boom")) ||
                (lane.id === "mattress" && recentEvent.type === "inflation") ||
                (lane.id === "safe" && recentEvent.type === "inflation")
              );
              const isBadEvent = affectedByEvent && (recentEvent.type === "crash" || recentEvent.type === "inflation");
              const isGoodEvent = affectedByEvent && recentEvent.type === "boom";
              return (
                <div key={lane.id} className={affectedByEvent ? "shakeOnce" : ""} style={{ position: "relative", background: "rgba(255,248,238,0.04)", border: `2px solid ${affectedByEvent ? (isBadEvent ? C.red : C.teal) : `${lane.color}88`}`, borderRadius: 8, padding: "14px 14px 18px", display: "flex", flexDirection: "column", overflow: "hidden", transition: "border 0.3s" }}>
                  {/* Flash overlay when affected */}
                  {affectedByEvent && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: isBadEvent ? C.red : C.teal,
                      animation: isBadEvent ? "redFlash 0.7s ease-out" : "goldFlash 0.7s ease-out",
                      pointerEvents: "none", zIndex: 1,
                    }} />
                  )}
                  {/* Lane header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, position: "relative", zIndex: 2 }}>
                    <div style={{ width: 44, height: 44, background: lane.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, borderRadius: 8 }}>{lane.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT_M, fontSize: 10, color: lane.color, letterSpacing: "0.24em", fontWeight: 800 }}>{lane.name}</div>
                      <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.12em" }}>{lane.desc}</div>
                    </div>
                    {isLeader && <div style={{ fontSize: 22, animation: "pulse 1.5s infinite" }}>👑</div>}
                  </div>

                  {/* The growing column */}
                  <div style={{ flex: 1, position: "relative", background: "rgba(0,0,0,0.3)", borderRadius: 6, overflow: "hidden", minHeight: 200 }}>
                    {/* Liquid fill */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: `${pct}%`,
                      background: `linear-gradient(180deg, ${lane.color}cc 0%, ${lane.color} 60%, ${lane.color}99 100%)`,
                      transition: "height 0.45s cubic-bezier(0.34, 1.2, 0.5, 1)",
                    }}>
                      {/* Wave at top */}
                      <div style={{ position: "absolute", top: -4, left: 0, right: 0, height: 8, background: lane.color, borderRadius: "50% 50% 0 0 / 100% 100% 0 0", opacity: 0.9 }} />
                      {/* Subtle horizontal lines = "coin layers" */}
                      <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 7px)` }} />
                    </div>
                    {/* Late-start ghost marker — same habit, started year 10 */}
                    {lane.id === "growth" && lateGrowth > 0 && (
                      <div style={{ position: "absolute", bottom: `${Math.min(98, (lateGrowth / maxVal) * 100)}%`, left: 0, right: 0, borderTop: `2.5px dashed ${C.textCream}`, opacity: 0.8, zIndex: 3, transition: "bottom 0.45s cubic-bezier(0.34, 1.2, 0.5, 1)" }}>
                        <div style={{ position: "absolute", top: 3, right: 6, fontFamily: FONT_M, fontSize: 8, color: C.textCream, letterSpacing: "0.14em", fontWeight: 800, background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: 2, whiteSpace: "nowrap" }}>LATE START · {formatMoney(lateGrowth)}</div>
                      </div>
                    )}
                    {/* Current value over the bar */}
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", zIndex: 2 }}>
                      <div style={{ fontFamily: FONT_M, fontSize: 9, color: pct > 30 ? "rgba(255,255,255,0.85)" : C.textCreamDim, letterSpacing: "0.22em", fontWeight: 700 }}>NOW WORTH</div>
                      <div style={{ fontFamily: FONT_D, fontSize: 32, color: pct > 30 ? "#fff" : C.textCream, fontWeight: 900, letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{formatMoney(lane.value)}</div>
                      {/* Growth multiple vs invested */}
                      <div style={{ fontFamily: FONT_M, fontSize: 10, color: pct > 30 ? "rgba(255,255,255,0.85)" : C.textCreamDim, letterSpacing: "0.18em", fontWeight: 700, marginTop: 4 }}>
                        {year > 0 ? `${(lane.value / (monthly * 12 * year + 500)).toFixed(2)}× input` : "−"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent event popup */}
          {isEventYear && (
            <div key={`evt-${recentEvent.year}`} className="popupIn" style={{
              position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)",
              background: recentEvent.type === "crash" || recentEvent.type === "inflation" ? C.coral : C.teal,
              color: "#fff", padding: "14px 26px", borderRadius: 6,
              fontFamily: FONT_D, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em",
              boxShadow: `0 16px 50px ${recentEvent.type === "crash" || recentEvent.type === "inflation" ? C.coral : C.teal}88`,
              display: "flex", alignItems: "center", gap: 12, zIndex: 5,
              border: `2px solid #fff`,
            }}>
              <span style={{ fontSize: 32 }}>{recentEvent.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontFamily: FONT_M, letterSpacing: "0.22em", fontWeight: 800, opacity: 0.85 }}>YEAR {recentEvent.year}</div>
                <div>{recentEvent.name}</div>
              </div>
            </div>
          )}
        </div>

        {/* RESULT OVERLAY when race ends */}
        {phase === "result" && (() => {
          const winner = lanes.reduce((a, b) => a.value > b.value ? a : b);
          const loser = lanes.reduce((a, b) => a.value < b.value ? a : b);
          const totalInvested = monthly * 12 * 40 + 500;
          const winnerGain = winner.value - totalInvested;
          const winnerVsLoser = winner.value - loser.value;
          return (
            <div className="popupIn" style={{
              position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
              background: "rgba(255,248,238,0.98)", padding: "26px 36px", borderRadius: 10,
              maxWidth: 720, width: "92%", border: `3px solid ${winner.color}`, zIndex: 10,
              boxShadow: `0 40px 100px rgba(0,0,0,0.7)`, maxHeight: "88%", overflowY: "auto",
            }}>
              <div style={{ fontFamily: FONT_M, fontSize: 11, color: winner.color, letterSpacing: "0.32em", fontWeight: 800 }}>● 40 YEARS LATER · WINNER</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
                <div style={{ fontSize: 48 }}>{winner.icon}</div>
                <div>
                  <div style={{ fontFamily: FONT_D, fontSize: 38, color: C.ink, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>{winner.name}</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 30, color: winner.color, fontWeight: 900, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{formatMoney(winner.value)}</div>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: "14px 18px", background: C.surface2, borderRadius: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.2em", fontWeight: 700 }}>YOU PUT IN</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.ink, fontWeight: 900 }}>₺{totalInvested.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.2em", fontWeight: 700 }}>WINNER GAINED</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 22, color: winner.color, fontWeight: 900 }}>+{formatMoney(winnerGain)}</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.2em", fontWeight: 700 }}>WINNER vs LOSER</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.coral, fontWeight: 900 }}>+{formatMoney(winnerVsLoser)}</div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.2em", fontWeight: 700 }}>EVENTS WEATHERED</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.ink, fontWeight: 900 }}>{events.length}</div>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: "14px 18px", background: `${winner.color}15`, borderLeft: `4px solid ${winner.color}`, borderRadius: 4 }}>
                <div style={{ fontFamily: FONT_M, fontSize: 9, color: winner.color, letterSpacing: "0.22em", fontWeight: 800 }}>● THE LESSON</div>
                <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.ink, fontWeight: 700, lineHeight: 1.45, marginTop: 4 }}>
                  {winner.id === "growth" ? "Time in the market beats trying to time it. The crashes hurt — and the recovery rewarded patience." :
                   winner.id === "safe" ? "Bonds did their job — slow, steady, dependable. They beat cash. They lost to stocks over the long run." :
                   "Cash felt safe — but inflation ate its value. In nominal terms it grew. In real terms it shrank."}
                </div>
                <div style={{ fontFamily: FONT_B, fontSize: 12, color: C.textMuted, lineHeight: 1.45, marginTop: 6, fontStyle: "italic" }}>
                  Run the race again with different events. Note how often growth still wins despite the crashes — and how often it doesn't.
                </div>
              </div>

              {/* THE COST OF WAITING — the lesson people refuse to believe until they see it */}
              {lateGrowth > 0 && (
                <div style={{ marginTop: 14, padding: "14px 18px", background: `${C.coral}10`, borderLeft: `4px solid ${C.coral}`, borderRadius: 4 }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.22em", fontWeight: 800 }}>⏳ THE COST OF WAITING</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                    <div style={{ fontFamily: FONT_D, fontSize: 30, color: C.coral, fontWeight: 900 }}>−{formatMoney(Math.max(0, growth - lateGrowth))}</div>
                    <div style={{ fontFamily: FONT_B, fontSize: 12, color: C.text, fontWeight: 600 }}>for starting the same habit ten years late</div>
                  </div>
                  <div style={{ fontFamily: FONT_B, fontSize: 12, color: C.textMuted, lineHeight: 1.45, marginTop: 4, fontStyle: "italic" }}>
                    The dashed line in the Growth lane was you, starting at year 10 with the exact same ₺{monthly}/month. Same discipline, same markets — {formatMoney(lateGrowth)} instead of {formatMoney(growth)}. Time is the one ingredient you cannot buy back.
                  </div>
                </div>
              )}

              <div style={{ marginTop: 10, fontFamily: FONT_M, fontSize: 9.5, color: C.textMuted, letterSpacing: "0.1em", lineHeight: 1.5 }}>
                ◦ All figures are in today's money — <Term k="inflation">inflation</Term> is already stripped out. That is why the Mattress shrinks even though no one touched it.
              </div>

              <KnowledgeCheck
                question="Three crashes hit Growth on the way. Why did it usually still come out ahead?"
                options={[
                  "It recovered after each crash and kept compounding in between",
                  "Crashes do not really affect stock investments",
                  "The Reserve refunds investors after every crash",
                ]}
                correctIndex={0}
                onCorrect={() => { dispatch({ type: "AWARD_BADGE", id: "compoundConvert" }); }}
              />

              <TakeThisHome game="race" accent={C.gold} dispatch={dispatch} options={[
                "Set up a small automatic monthly transfer — even ₺25 — this week",
                "Check whether my savings are at least beating inflation",
                "Stop checking investments daily; judge them in years, not weeks",
              ]} />

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={() => { setPhase("setup"); setRunning(false); }} style={{ flex: 1, background: "transparent", color: C.text, border: `1.5px solid ${C.borderCream}`, padding: "14px 20px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>RACE AGAIN →</button>
                <button onClick={onBack} style={{ flex: 1, background: C.coral, color: "#fff", border: "none", padding: "14px 20px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>DONE</button>
              </div>
            </div>
          );
        })()}

        <div style={{ background: "#000", height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em" }}>40 YEARS · ONE HABIT · THREE STRATEGIES</div>
        </div>
      </div>
    );
  }

  return null;
}

// Tiny helper for the setup-screen strategy preview cards
function StrategyPreview({ color, icon, name, desc }) {
  return (
    <div style={{ background: C.surface2, border: `2px solid ${color}`, borderRadius: 4, padding: "12px 12px" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontFamily: FONT_M, fontSize: 10, color, letterSpacing: "0.22em", fontWeight: 800, marginTop: 4 }}>{name}</div>
      <div style={{ fontFamily: FONT_B, fontSize: 11, color: C.text, lineHeight: 1.4, marginTop: 4 }}>{desc}</div>
    </div>
  );
}

function BankPanel({ state, dispatch }) {
  // Five mini-games available at the Savings Bank (v26)
  const [mode, setMode] = useState(null); // null | "future" | "budget" | "race" | "scam" | "debt"
  if (mode === null) return <BankModeChooser onPick={setMode} dispatch={dispatch} state={state} />;
  if (mode === "budget") return <BudgetHealthCheck dispatch={dispatch} state={state} onBack={() => setMode(null)} />;
  if (mode === "race") return <CompoundRace dispatch={dispatch} state={state} onBack={() => setMode(null)} />;
  if (mode === "scam") return <ScamLab dispatch={dispatch} state={state} onBack={() => setMode(null)} />;
  if (mode === "debt") return <DebtTrap dispatch={dispatch} state={state} onBack={() => setMode(null)} />;
  return <FutureYouSim dispatch={dispatch} state={state} onBack={() => setMode(null)} />;
}

// ─── The five-tool chooser at the Savings Bank entrance ────
function ToolCard({ onPick, color, icon, eyebrow, title, desc, tags, delay, isNew }) {
  return (
    <button onClick={() => { SFX.click(); onPick(); }} style={{
      background: "rgba(255,248,238,0.97)", border: `2px solid ${color}`, borderRadius: 6,
      padding: "16px 16px", textAlign: "left", cursor: "pointer", transition: "all 0.2s",
      boxShadow: `0 14px 36px ${color}44`, position: "relative",
      animation: `popupIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`,
      display: "flex", flexDirection: "column",
    }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
      {isNew && <div style={{ position: "absolute", top: 9, right: 9, background: C.coral, color: "#fff", padding: "3px 8px", fontFamily: FONT_M, fontSize: 8, letterSpacing: "0.2em", fontWeight: 800, borderRadius: 2 }}>NEW</div>}
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontFamily: FONT_M, fontSize: 8.5, color, letterSpacing: "0.24em", fontWeight: 800, marginTop: 6 }}>● {eyebrow}</div>
      <div style={{ fontFamily: FONT_D, fontSize: 20, color: C.ink, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, marginTop: 5 }}>{title}</div>
      <div style={{ fontFamily: FONT_B, fontSize: 11, color: C.text, lineHeight: 1.45, marginTop: 7, flex: 1 }}>{desc}</div>
      <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
        {tags.map(t => <span key={t} style={{ background: C.surface3, color: C.text, padding: "3px 7px", fontFamily: FONT_M, fontSize: 7.5, letterSpacing: "0.16em", fontWeight: 700, borderRadius: 2 }}>{t}</span>)}
      </div>
    </button>
  );
}

function BankModeChooser({ onPick, dispatch, state }) {
  const close = () => dispatch({ type: "CLOSE_PANEL" });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>SAVINGS BANK · VOSTAN HIGH STREET</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>PICK A TOOL</div>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "auto", background: `linear-gradient(180deg, #04060f 0%, #0a1230 35%, #2a1c4a 70%, ${C.skyDawn} 92%, ${C.skyHorizon} 100%)` }}>
        <svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <circle cx="1300" cy="200" r="80" fill="#fff8ee" opacity="0.85" />
          <circle cx="1300" cy="200" r="160" fill={C.gold} opacity="0.15" />
          <path d="M 0 580 Q 200 540 350 570 Q 600 530 900 560 Q 1200 540 1600 570 L 1600 800 L 0 800 Z" fill="#0a0f24" opacity="0.7" />
          <rect x="0" y="640" width="1600" height="160" fill="#04060f" />
        </svg>

        <div style={{ position: "relative", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "26px 30px", gap: 18 }}>
          <div style={{ textAlign: "center", maxWidth: 860, background: "rgba(4,6,15,0.7)", padding: "14px 28px", borderRadius: 4, borderTop: `2px solid ${C.gold}55`, borderBottom: `2px solid ${C.gold}55` }}>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.coral, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 6 }}>● FIVE TOOLS · ONE OUTCOME</div>
            <div style={{ fontFamily: FONT_D, fontSize: 34, color: C.textCream, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.05 }}>Strong households build a strong country.</div>
            <div style={{ fontFamily: FONT_D, fontSize: 15, color: C.gold, fontWeight: 600, fontStyle: "italic", marginTop: 7 }}>Plan a future. Help a neighbour. Race three strategies. Spot the scams. Escape the trap.</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))", gap: 13, maxWidth: 1380, width: "100%" }}>
            <ToolCard onPick={() => onPick("future")} color={C.coral} icon="📈" eyebrow="PERSONAL · 30 YEARS" title="Future You" delay={0}
              desc="You are 22. Set a savings plan, pick an investment style, then live through 30 years of life events. See where you land at 52."
              tags={["COMPOUND", "RISK", "LIFE EVENTS"]} />
            <ToolCard onPick={() => onPick("budget")} color={C.teal} icon="🏘" eyebrow="A NEIGHBOUR · 12 MONTHS" title="Budget Health Check" delay={0.12}
              desc="Sort needs from wants, then run a neighbour's budget through a year of shocks. Watch one household ripple into the country."
              tags={["50/30/20", "EMERGENCY FUND", "NATIONAL IMPACT"]} />
            <ToolCard onPick={() => onPick("race")} color={C.gold} icon="🏁" eyebrow="THREE STRATEGIES · 40 YEARS" title="Compound Race" delay={0.24}
              desc="Cash under the mattress, safe bonds, and growth race forty years side by side. Now with the cost of starting ten years late."
              tags={["COMPOUND", "INFLATION", "LATE START"]} />
            <ToolCard onPick={() => onPick("scam")} color={C.purple} icon="🕵" eyebrow="SIX MESSAGES · 10 SECONDS" title="The Scam Lab" delay={0.36} isNew
              desc="Real-looking texts, emails and calls land in your inbox. Some are genuine. Some want your money. Trust your gut — fast."
              tags={["FRAUD", "PHISHING", "STOP · CHALLENGE · PROTECT"]} />
            <ToolCard onPick={() => onPick("debt")} color={C.rose} icon="🪤" eyebrow="ONE DEBT · THREE WAYS OUT" title="Minimum Payment Trap" delay={0.48} isNew
              desc="A ₺1,200 credit card debt at 24.9% APR. Three repayment strategies race to freedom. The minimum is not your friend."
              tags={["CREDIT", "APR", "DEBT"]} />
          </div>

          <DidYouKnow />

          <button onClick={close} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid ${C.borderL}`, padding: "11px 22px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>← WALK AWAY</button>
        </div>
      </div>

      <div style={{ background: "#000", height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em" }}>BANK OF VOSTAN · "INVEST EARLY · INVEST OFTEN"</div>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   THE SCAM LAB — fraud & scam recognition (v26)
   Six messages. Ten seconds each. Real or rotten?
   ════════════════════════════════════════════════════════════ */
const SCAM_SCENARIOS = [
  {
    id: "parcel", kind: "sms", from: "VOSTAN POST", genuine: false,
    body: "Your parcel could not be delivered. A redelivery fee of ₺2.99 is required. Pay now to avoid return: vostan-post.delivery-fee.xyz",
    flags: ["A surprise fee out of nowhere", "Pressure to act immediately", "The web address is not the real Vostan Post domain"],
    explain: "Delivery-fee texts are one of the most common scams in the world. The link leads to a fake payment page that harvests your card details.",
  },
  {
    id: "banksec", kind: "email", from: "Bank of Vostan Security <security@bankofvostan-alerts.com>", subject: "URGENT: Your account will be SUSPENDED", genuine: false,
    body: "Dear customer, we have detected unusual activity. Your account will be suspended within 24 HOURS unless you verify your identity. Click here and confirm your card number, PIN and password.",
    flags: ["Threats and a countdown — urgency is the scammer's favourite tool", "Asks for PIN and password — your bank never will", "'Dear customer' — they don't know your name", "Sender address is not the bank's real domain"],
    explain: "Banks never ask for your PIN or full password, by any channel, ever. Real security alerts tell you to log in through your usual app — never through a link.",
  },
  {
    id: "voiceclone", kind: "call", from: "📞 Incoming call · 'Bank of Vostan Fraud Team'", genuine: false,
    body: "\"We've detected fraud on your account. Your money is at risk right now. To protect it, you need to move your balance to a safe account immediately. I'll stay on the line and give you the details.\"",
    flags: ["A 'safe account' does not exist — that is the scam", "Pressure to act while they stay on the line", "Real fraud teams freeze cards; they never ask you to move money", "Voice cloning can make a call sound exactly like your bank"],
    explain: "This is authorised push payment fraud — the most expensive scam type. If anyone tells you to move money to keep it safe, hang up and call your bank on the number printed on your card.",
  },
  {
    id: "crypto", kind: "social", from: "@wealth_mindset_vst · Varngram", genuine: false,
    body: "I turned ₺200 into ₺9,400 in TWO WEEKS with VostCoin staking. GUARANTEED returns, zero risk. Spots are limited — DM me 'WEALTH' to get in before it closes 🚀💰",
    flags: ["'Guaranteed returns' is a guarantee of a scam", "Artificial scarcity — 'limited spots', 'before it closes'", "Recruiting through DMs, not a regulated platform", "If the returns were real, they wouldn't need you"],
    explain: "Nobody can guarantee investment returns. High return always means high risk — anyone promising both is taking your money, not growing it.",
  },
  {
    id: "romance", kind: "sms", from: "Daniyar ❤", genuine: false,
    body: "I know we've only talked online but I feel so close to you. My visa fee is stuck and I can't fly out to meet you without ₺350. Could you send it? I'll pay you back the moment we're together ❤",
    flags: ["You've never met — and money has entered the chat", "Emotional pressure tied to an urgent payment", "A stranger who needs YOUR money to come to YOU"],
    explain: "Romance scams cost victims more per person than almost any other fraud. The relationship is the product; the 'emergency' is the invoice.",
  },
  {
    id: "estatement", kind: "email", from: "Bank of Vostan <no-reply@bankofvostan.vs>", subject: "Your May e-statement is ready", genuine: true,
    body: "Hello Ali, your statement for May is now available. To view it, log in to the Bank of Vostan app or website as usual. We will never ask for your PIN or password by email.",
    flags: ["Greets you by name", "No link to click, no details requested — log in your usual way", "No urgency, no threat, no fee"],
    explain: "This is what a genuine bank message looks like: calm, no links to chase, and it tells you to log in the way you always do.",
  },
  {
    id: "gp", kind: "sms", from: "VARENA HEALTH CTR", genuine: true,
    body: "Reminder: you have an appointment on Tue 18 June at 10:30. Reply C to confirm or X to cancel. Call us on 01 555 0142 to rearrange.",
    flags: ["Expected — you booked this appointment", "No payment, no link, no personal details requested", "A real phone number you can verify independently"],
    explain: "Genuine reminders ask for nothing of value. When in doubt, contact the organisation through a number or app you already trust — never the one in the message.",
  },
];


// ─── Scam Lab chrome + message renderer (hoisted so timers don't remount them) ───
function ScamShell({ children, footer, counter, onBack }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>THE SCAM LAB · FRAUD RECOGNITION UNIT</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {counter && <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>{counter}</div>}
          <button onClick={onBack} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid ${C.borderL}`, padding: "6px 14px", fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 2 }}>← BACK</button>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", background: `linear-gradient(180deg, #04060f 0%, #160a1e 50%, #2a0f1e 100%)`, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 26 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent 38px, ${C.coral}0a 38px, ${C.coral}0a 39px), repeating-linear-gradient(90deg, transparent 0, transparent 38px, ${C.coral}0a 38px, ${C.coral}0a 39px)`, pointerEvents: "none" }} />
        {children}
      </div>
      <div style={{ background: "#000", height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em" }}>{footer || "STOP · CHALLENGE · PROTECT"}</div>
      </div>
    </div>
  );
}

// Render a message in its native habitat — SMS bubble, email window, call card, social post
function ScamMessageCard({ s, frozen }) {
    const kindMeta = {
      sms:    { label: "TEXT MESSAGE", icon: "💬", tint: C.teal },
      email:  { label: "EMAIL", icon: "✉️", tint: C.blue },
      call:   { label: "PHONE CALL", icon: "📞", tint: C.coral },
      social: { label: "SOCIAL POST", icon: "📱", tint: C.purple },
    }[s.kind];
    return (
      <div className="popupIn" style={{ background: C.surface, borderRadius: 10, width: "100%", maxWidth: 640, boxShadow: "0 30px 80px rgba(0,0,0,0.7)", overflow: "hidden", border: `1px solid ${C.borderCream}`, opacity: frozen ? 0.92 : 1 }}>
        {/* Window chrome */}
        <div style={{ background: C.ink, padding: "9px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15 }}>{kindMeta.icon}</span>
          <span style={{ fontFamily: FONT_M, fontSize: 9, color: kindMeta.tint, letterSpacing: "0.26em", fontWeight: 800 }}>{kindMeta.label}</span>
          <span style={{ flex: 1 }} />
          <span style={{ display: "flex", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.coral }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} />
          </span>
        </div>
        <div style={{ padding: "18px 22px" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textMuted, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 4 }}>FROM: <span style={{ color: C.ink }}>{s.from}</span></div>
          {s.subject && <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.ink, fontWeight: 800, marginBottom: 8 }}>{s.subject}</div>}
          <div style={{
            fontFamily: s.kind === "call" ? FONT_D : FONT_B, fontSize: s.kind === "call" ? 16 : 14, color: C.text, lineHeight: 1.6,
            fontStyle: s.kind === "call" ? "italic" : "normal", fontWeight: s.kind === "call" ? 600 : 500,
            background: s.kind === "sms" || s.kind === "social" ? C.surface2 : "transparent",
            padding: s.kind === "sms" || s.kind === "social" ? "12px 16px" : 0,
            borderRadius: s.kind === "sms" ? "14px 14px 14px 3px" : s.kind === "social" ? 6 : 0,
            border: s.kind === "social" ? `1px solid ${C.borderCream}` : "none",
          }}>{s.body}</div>
        </div>
      </div>
    );
  }

function ScamLab({ state, dispatch, onBack }) {
  const [phase, setPhase] = useState("intro"); // intro | round | reveal | result
  const [deck, setDeck] = useState([]);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState([]); // {id, said, correct, timedOut}
  const [timeLeft, setTimeLeft] = useState(10);
  const [lastPick, setLastPick] = useState(null);

  const startRun = () => {
    // Shuffle, keep all 7 but play 6: always include both genuine ones
    const scams = SCAM_SCENARIOS.filter(s => !s.genuine).sort(() => Math.random() - 0.5).slice(0, 4);
    const real = SCAM_SCENARIOS.filter(s => s.genuine);
    const d = [...scams, ...real].sort(() => Math.random() - 0.5);
    setDeck(d); setRound(0); setAnswers([]); setTimeLeft(10); setLastPick(null); setPhase("round");
  };

  const current = deck[round];

  // Countdown timer per round
  useEffect(() => {
    if (phase !== "round") return;
    if (timeLeft <= 0) {
      // Hesitation counts as a miss — scammers rely on you freezing
      SFX.alarm();
      setAnswers(a => [...a, { id: current.id, said: null, correct: false, timedOut: true }]);
      setLastPick(null);
      setPhase("reveal");
      return;
    }
    const t = setTimeout(() => { setTimeLeft(t2 => t2 - 0.1); if (timeLeft < 3.05 && timeLeft > 2.95) SFX.tick(); }, 100);
    return () => clearTimeout(t);
  }, [phase, timeLeft, current]);

  const answer = (saysScam) => {
    const correct = saysScam !== current.genuine;
    if (correct) SFX.coin(); else SFX.lose();
    setAnswers(a => [...a, { id: current.id, said: saysScam, correct, timedOut: false }]);
    setLastPick(saysScam);
    setPhase("reveal");
  };

  const nextRound = () => {
    if (round + 1 >= deck.length) {
      const score = answers.filter(a => a.correct).length;
      if (score >= 5) { dispatch({ type: "AWARD_BADGE", id: "scamSpotter" }); }
      SFX.win();
      setPhase("result");
    } else {
      setRound(r => r + 1); setTimeLeft(10); setLastPick(null); setPhase("round");
    }
  };

  const counter = phase !== "intro" && phase !== "result" ? `MESSAGE ${round + 1} OF ${deck.length}` : null;
  const Shell = ({ children, footer }) => (
    <ScamShell counter={counter} onBack={onBack} footer={footer}>{children}</ScamShell>
  );
  const MessageCard = ScamMessageCard;

  // ─── INTRO ───
  if (phase === "intro") {
    return (
      <Shell>
        <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "40px 50px", maxWidth: 720, width: "100%", borderRadius: 6, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: `2px solid ${C.coral}`, position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.coral, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 6 }}>● SIX MESSAGES · TEN SECONDS EACH</div>
          <div style={{ fontFamily: FONT_D, fontSize: 50, color: C.ink, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: 12 }}>The Scam Lab.</div>
          <div style={{ fontFamily: FONT_D, fontSize: 18, color: C.gold, fontWeight: 700, fontStyle: "italic", marginBottom: 20 }}>Real messages land in real inboxes. Some are genuine. Some want your money. You get ten seconds — because that's all the scammer gives you.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
            <div style={{ background: C.surface2, border: `2px solid ${C.coral}`, borderRadius: 4, padding: "12px 14px" }}>
              <div style={{ fontSize: 22 }}>🛑</div>
              <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.coral, letterSpacing: "0.2em", fontWeight: 800, marginTop: 4 }}>STOP</div>
              <div style={{ fontFamily: FONT_B, fontSize: 11, color: C.text, lineHeight: 1.4, marginTop: 4 }}>Urgency is the weapon. A pause defeats it.</div>
            </div>
            <div style={{ background: C.surface2, border: `2px solid ${C.gold}`, borderRadius: 4, padding: "12px 14px" }}>
              <div style={{ fontSize: 22 }}>🔍</div>
              <div style={{ fontFamily: FONT_M, fontSize: 10, color: "#a87918", letterSpacing: "0.2em", fontWeight: 800, marginTop: 4 }}>CHALLENGE</div>
              <div style={{ fontFamily: FONT_B, fontSize: 11, color: C.text, lineHeight: 1.4, marginTop: 4 }}>Could this be fake? It's fine to refuse, hang up, ignore.</div>
            </div>
            <div style={{ background: C.surface2, border: `2px solid ${C.teal}`, borderRadius: 4, padding: "12px 14px" }}>
              <div style={{ fontSize: 22 }}>🛡</div>
              <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.teal, letterSpacing: "0.2em", fontWeight: 800, marginTop: 4 }}>PROTECT</div>
              <div style={{ fontFamily: FONT_B, fontSize: 11, color: C.text, lineHeight: 1.4, marginTop: 4 }}>Contact the real organisation through a route YOU trust.</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={onBack} style={{ background: "transparent", color: C.textMuted, border: `1px solid ${C.borderCream}`, padding: "14px 24px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 3 }}>← WALK AWAY</button>
            <button onClick={startRun} style={{ background: C.coral, color: "#fff", border: "none", padding: "16px 42px", fontFamily: FONT_M, fontSize: 13, fontWeight: 800, letterSpacing: "0.28em", cursor: "pointer", borderRadius: 3, boxShadow: `0 14px 36px ${C.coral}88` }}>OPEN THE INBOX 🕵</button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── ROUND ───
  if (phase === "round" && current) {
    const timerPct = Math.max(0, (timeLeft / 10) * 100);
    const urgent = timeLeft <= 3;
    return (
      <Shell footer={`SCORE SO FAR · ${answers.filter(a => a.correct).length} OF ${answers.length}`}>
        <div style={{ width: "100%", maxWidth: 640, position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Timer bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: urgent ? C.red : C.gold, letterSpacing: "0.28em", fontWeight: 800 }}>{urgent ? "⚠ DECIDE NOW" : "● TRUST YOUR GUT"}</div>
              <div style={{ fontFamily: FONT_D, fontSize: 26, color: urgent ? C.red : C.textCream, fontWeight: 900, lineHeight: 1 }}>{Math.max(0, timeLeft).toFixed(1)}s</div>
            </div>
            <div style={{ height: 8, background: "rgba(255,248,238,0.12)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${timerPct}%`, background: urgent ? C.red : `linear-gradient(90deg, ${C.gold}, ${C.coral})`, transition: "width 0.1s linear", borderRadius: 4 }} />
            </div>
          </div>

          <MessageCard s={current} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button onClick={() => answer(true)} style={{ background: C.coral, color: "#fff", border: "none", padding: "18px", fontFamily: FONT_M, fontSize: 14, fontWeight: 800, letterSpacing: "0.26em", cursor: "pointer", borderRadius: 5, boxShadow: `0 12px 32px ${C.coral}66`, transition: "transform 0.12s" }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>🚨 SCAM</button>
            <button onClick={() => answer(false)} style={{ background: C.teal, color: "#fff", border: "none", padding: "18px", fontFamily: FONT_M, fontSize: 14, fontWeight: 800, letterSpacing: "0.26em", cursor: "pointer", borderRadius: 5, boxShadow: `0 12px 32px ${C.teal}66`, transition: "transform 0.12s" }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>✅ GENUINE</button>
          </div>
        </div>
      </Shell>
    );
  }

  // ─── REVEAL ───
  if (phase === "reveal" && current) {
    const last = answers[answers.length - 1];
    const verdictColor = last.correct ? C.teal : C.coral;
    return (
      <Shell footer={`SCORE · ${answers.filter(a => a.correct).length} OF ${answers.length}`}>
        <div style={{ width: "100%", maxWidth: 640, position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Verdict banner */}
          <div className="popupIn" style={{ background: verdictColor, color: "#fff", borderRadius: 6, padding: "14px 22px", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 14px 44px ${verdictColor}88`, border: "2px solid #fff" }}>
            <div style={{ fontSize: 32 }}>{last.timedOut ? "⏱" : last.correct ? "✓" : "✗"}</div>
            <div>
              <div style={{ fontFamily: FONT_M, fontSize: 9, letterSpacing: "0.26em", fontWeight: 800, opacity: 0.9 }}>
                {last.timedOut ? "YOU FROZE — SCAMMERS COUNT ON THAT" : last.correct ? "CORRECT" : "CAUGHT OUT"}
              </div>
              <div style={{ fontFamily: FONT_D, fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>
                This was {current.genuine ? "GENUINE" : "A SCAM"}.
              </div>
            </div>
          </div>

          <MessageCard s={current} frozen />

          {/* Flags */}
          <div className="popupIn" style={{ background: "rgba(255,248,238,0.97)", borderRadius: 6, padding: "16px 22px", borderLeft: `5px solid ${current.genuine ? C.teal : C.coral}` }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: current.genuine ? C.teal : C.coral, letterSpacing: "0.26em", fontWeight: 800, marginBottom: 8 }}>
              {current.genuine ? "● WHY IT'S SAFE" : "⚑ THE RED FLAGS"}
            </div>
            {current.flags.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontFamily: FONT_B, fontSize: 12.5, color: C.text, lineHeight: 1.5, marginBottom: 4, fontWeight: 600 }}>
                <span style={{ color: current.genuine ? C.teal : C.coral, fontWeight: 900 }}>{current.genuine ? "✓" : "⚑"}</span>{f}
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.borderCream}`, fontFamily: FONT_B, fontSize: 12, color: C.textMuted, lineHeight: 1.5, fontStyle: "italic" }}>{current.explain}</div>
          </div>

          <button onClick={nextRound} style={{ background: C.gold, color: C.ink, border: "none", padding: "15px", fontFamily: FONT_M, fontSize: 12, fontWeight: 800, letterSpacing: "0.26em", cursor: "pointer", borderRadius: 4, boxShadow: `0 12px 32px ${C.gold}55` }}>
            {round + 1 >= deck.length ? "SEE YOUR RESULTS →" : "NEXT MESSAGE →"}
          </button>
        </div>
      </Shell>
    );
  }

  // ─── RESULT ───
  if (phase === "result") {
    const score = answers.filter(a => a.correct).length;
    const total = answers.length;
    const headline = score === total ? "Unscammable. For today." : score >= 5 ? "Sharp eyes. They'd have to work for it." : score >= 3 ? "Half-armed. The fast ones would get you." : "Easy money — for them. Time to train.";
    const grade = score === total ? "A+" : score >= 5 ? "A" : score >= 4 ? "B" : score >= 3 ? "C" : "D";
    return (
      <Shell footer="FRAUD IS THE MOST COMMON CRIME IN MOST ADVANCED ECONOMIES">
        <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "32px 42px", maxWidth: 700, width: "100%", borderRadius: 8, boxShadow: "0 40px 100px rgba(0,0,0,0.7)", borderTop: `6px solid ${score >= 5 ? C.teal : C.coral}`, position: "relative", zIndex: 2, maxHeight: "86%", overflowY: "auto" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.coral, letterSpacing: "0.3em", fontWeight: 800 }}>● SCAM LAB · DEBRIEF</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 8 }}>
            <div style={{ fontFamily: FONT_D, fontSize: 96, color: C.ink, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.85 }}>{score}<span style={{ fontSize: 36, color: C.textMuted }}>/{total}</span></div>
            <div style={{ paddingBottom: 10 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 700 }}>CAUGHT</div>
              <div style={{ fontFamily: FONT_D, fontSize: 34, color: score >= 5 ? C.teal : score >= 3 ? C.gold : C.coral, fontWeight: 900, lineHeight: 1 }}>GRADE {grade}</div>
            </div>
          </div>
          <div style={{ fontFamily: FONT_D, fontSize: 19, color: C.ink, fontWeight: 700, fontStyle: "italic", marginTop: 6 }}>{headline}</div>

          {score >= 5 && (
            <div className="popupIn" style={{ marginTop: 14, padding: "12px 16px", background: `${C.coral}12`, border: `2px solid ${C.coral}`, borderRadius: 5, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 30 }}>🕵</span>
              <div>
                <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.24em", fontWeight: 800 }}>BADGE EARNED</div>
                <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.ink, fontWeight: 900 }}>Scam Spotter</div>
              </div>
            </div>
          )}

          {/* The three rules, restated as the takeaway */}
          <div style={{ marginTop: 14, padding: "14px 18px", background: C.surface2, borderRadius: 5, borderLeft: `4px solid ${C.gold}` }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: "#a87918", letterSpacing: "0.24em", fontWeight: 800, marginBottom: 6 }}>● THE ONLY THREE RULES YOU NEED</div>
            <div style={{ fontFamily: FONT_B, fontSize: 12.5, color: C.text, lineHeight: 1.65 }}>
              <strong>Stop</strong> — urgency is the weapon; a pause defeats it. <strong>Challenge</strong> — it is never rude to refuse, hang up or ignore. <strong>Protect</strong> — contact the real organisation through a route you already trust, never one inside the message.
            </div>
          </div>

          <TakeThisHome game="scam" accent={C.coral} dispatch={dispatch} options={[
            "Tell one family member about the 'safe account' phone scam",
            "Turn on two-step verification for my bank and email",
            "Make a rule: never pay or click from inside a message — always go to the app",
          ]} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={startRun} style={{ flex: 1, background: "transparent", color: C.text, border: `1.5px solid ${C.borderCream}`, padding: "14px 20px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>NEW INBOX →</button>
            <button onClick={onBack} style={{ flex: 1, background: C.coral, color: "#fff", border: "none", padding: "14px 20px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>DONE</button>
          </div>
        </div>
      </Shell>
    );
  }

  return null;
}


/* ════════════════════════════════════════════════════════════
   THE MINIMUM PAYMENT TRAP — credit & debt (v26)
   One debt. Three repayment strategies. Watch the trap close.
   ════════════════════════════════════════════════════════════ */
function DebtTrap({ state, dispatch, onBack }) {
  const [phase, setPhase] = useState("setup"); // setup | racing | result
  const [debt, setDebt] = useState(1200);
  const APR = 24.9;
  const monthlyRate = APR / 100 / 12;

  const makeLanes = (d) => ([
    { id: "min",  name: "MINIMUM ONLY", icon: "🪤", color: C.coral,  desc: "Pay what the card asks", balance: d, interestPaid: 0, totalPaid: 0, months: 0, done: false, pay: (bal) => Math.max(25, bal * 0.025) },
    { id: "mid",  name: "FIXED ₺60",    icon: "📅", color: C.gold,   desc: "Same amount every month", balance: d, interestPaid: 0, totalPaid: 0, months: 0, done: false, pay: () => 60 },
    { id: "high", name: "FIXED ₺120",   icon: "⚡", color: C.teal,   desc: "Attack the balance", balance: d, interestPaid: 0, totalPaid: 0, months: 0, done: false, pay: () => 120 },
  ]);

  const [lanes, setLanes] = useState(() => makeLanes(1200));
  const [month, setMonth] = useState(0);
  const [running, setRunning] = useState(false);

  // Race tick — months advance; once the fixed lanes finish, fast-forward
  useEffect(() => {
    if (!running || phase !== "racing") return;
    const allDone = lanes.every(l => l.done);
    if (allDone || month >= 300) {
      setRunning(false);
      SFX.win();
      dispatch({ type: "AWARD_BADGE", id: "debtDestroyer" });
      setPhase("result");
      return;
    }
    const finishedCount = lanes.filter(l => l.done).length;
    const speed = finishedCount >= 2 ? 30 : 130;
    const t = setTimeout(() => {
      setLanes(prev => prev.map(l => {
        if (l.done) return l;
        const interest = l.balance * monthlyRate;
        let payment = Math.min(l.pay(l.balance), l.balance + interest);
        const newBal = Math.max(0, l.balance + interest - payment);
        const done = newBal <= 0.5;
        return { ...l, balance: done ? 0 : newBal, interestPaid: l.interestPaid + interest, totalPaid: l.totalPaid + payment, months: l.months + 1, done };
      }));
      setMonth(m => m + 1);
      if (month % 12 === 0) SFX.tick();
    }, speed);
    return () => clearTimeout(t);
  }, [running, phase, month, lanes, monthlyRate, dispatch]);

  const fmtYrs = (m) => m >= 12 ? `${Math.floor(m / 12)}y ${m % 12}m` : `${m}m`;

  // ─── SETUP ───
  if (phase === "setup") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.purple, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>THE MINIMUM PAYMENT TRAP · CREDIT LAB</div>
          </div>
          <button onClick={onBack} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid ${C.borderL}`, padding: "6px 14px", fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 2 }}>← BACK</button>
        </div>

        <div style={{ flex: 1, position: "relative", background: `linear-gradient(180deg, #04060f 0%, #140a28 50%, #2a1438 100%)`, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
          <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "40px 50px", maxWidth: 760, width: "100%", borderRadius: 6, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: `2px solid ${C.purple}` }}>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.purple, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 6 }}>● ONE DEBT · THREE WAYS OUT</div>
            <div style={{ fontFamily: FONT_D, fontSize: 46, color: C.ink, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: 12 }}>The Minimum Payment Trap.</div>
            <div style={{ fontFamily: FONT_D, fontSize: 17, color: C.gold, fontWeight: 700, fontStyle: "italic", marginBottom: 20 }}>
              Zara's washing machine died on a Tuesday. The replacement went on a credit card at {APR}% <Term k="APR">APR</Term>. The statement arrives with a friendly suggestion: "just pay the minimum."
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
              <StrategyPreview color={C.coral} icon="🪤" name="MINIMUM ONLY" desc="Pay only what the card asks. The 'easy' option." />
              <StrategyPreview color={C.gold} icon="📅" name="FIXED ₺60" desc="A steady ₺60 every month, no matter what." />
              <StrategyPreview color={C.teal} icon="⚡" name="FIXED ₺120" desc="Hit it hard. Short pain, long gain." />
            </div>

            <div style={{ padding: "18px 22px", background: C.surface2, borderRadius: 6, border: `1px solid ${C.borderCream}`, marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.text, letterSpacing: "0.22em", fontWeight: 800 }}>THE DEBT ON THE CARD</div>
                <div style={{ fontFamily: FONT_D, fontSize: 34, color: C.purple, fontWeight: 900 }}>₺{debt.toLocaleString()}</div>
              </div>
              <input type="range" min="600" max="3000" step="100" value={debt} onChange={(e) => setDebt(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.purple }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: FONT_M, color: C.textMuted, marginTop: 4 }}>
                <span>₺600 · a phone</span><span>₺1,200 · a washer</span><span>₺3,000 · a holiday</span>
              </div>
              <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.textMuted, marginTop: 10, lineHeight: 1.4 }}>
                {APR}% APR · <Term k="minimum payment">minimum payment</Term> is 2.5% of the balance (floor ₺25) · interest charged monthly.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={onBack} style={{ background: "transparent", color: C.textMuted, border: `1px solid ${C.borderCream}`, padding: "14px 24px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 3 }}>← WALK AWAY</button>
              <button onClick={() => { setLanes(makeLanes(debt)); setMonth(0); setPhase("racing"); setRunning(true); SFX.stamp(); }} style={{ background: C.purple, color: "#fff", border: "none", padding: "16px 42px", fontFamily: FONT_M, fontSize: 13, fontWeight: 800, letterSpacing: "0.28em", cursor: "pointer", borderRadius: 3, boxShadow: `0 14px 36px ${C.purple}88` }}>
                RUN THE STATEMENTS ⛓
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RACING + RESULT ───
  const minLane = lanes.find(l => l.id === "min");
  const highLane = lanes.find(l => l.id === "high");

  return (
    <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: phase === "result" ? C.gold : C.purple, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>● {phase === "result" ? "TRAP REVEALED" : "LIVE"} · ₺{debt.toLocaleString()} AT {APR}% APR</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>{phase === "result" ? "FINAL STATEMENTS" : "EACH TICK = ONE MONTH"}</div>
      </div>

      <div style={{ flex: 1, position: "relative", background: `linear-gradient(180deg, #04060f 0%, #140a28 40%, #2a1438 100%)`, overflow: "hidden", padding: "20px 36px 14px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Month counter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.purple, letterSpacing: "0.32em", fontWeight: 800 }}>STATEMENTS PAID</div>
            <div style={{ fontFamily: FONT_D, fontSize: 58, color: C.textCream, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.9, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>{month}<span style={{ fontSize: 20, color: C.textCreamDim, fontWeight: 700 }}> months ({fmtYrs(month)})</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.28em", fontWeight: 700 }}>THE LENDER HAS EARNED</div>
            <div style={{ fontFamily: FONT_D, fontSize: 28, color: C.coral, fontWeight: 900, letterSpacing: "-0.01em" }}>₺{Math.round(lanes.reduce((s, l) => s + l.interestPaid, 0)).toLocaleString()}</div>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.18em", marginTop: 2 }}>in interest, across all three</div>
          </div>
        </div>

        {/* THE LANES — debt columns draining down */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, minHeight: 0 }}>
          {lanes.map((lane) => {
            const pctLeft = Math.min(100, (lane.balance / debt) * 100);
            return (
              <div key={lane.id} style={{ position: "relative", background: "rgba(255,248,238,0.04)", border: `2px solid ${lane.done ? C.teal : `${lane.color}88`}`, borderRadius: 8, padding: "12px 14px 16px", display: "flex", flexDirection: "column", overflow: "hidden", transition: "border 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, background: lane.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, borderRadius: 8 }}>{lane.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_M, fontSize: 10, color: lane.color, letterSpacing: "0.22em", fontWeight: 800 }}>{lane.name}</div>
                    <div style={{ fontFamily: FONT_M, fontSize: 8.5, color: C.textCreamDim, letterSpacing: "0.1em" }}>{lane.desc}</div>
                  </div>
                  {lane.done && <div style={{ fontSize: 20 }}>🔓</div>}
                </div>

                {/* Draining debt column */}
                <div style={{ flex: 1, position: "relative", background: "rgba(0,0,0,0.3)", borderRadius: 6, overflow: "hidden", minHeight: 160 }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: `${pctLeft}%`,
                    background: `linear-gradient(180deg, ${lane.color} 0%, ${lane.color}cc 60%, ${lane.color}88 100%)`,
                    transition: "height 0.18s linear",
                  }}>
                    <div style={{ position: "absolute", bottom: -4, left: 0, right: 0, height: 8, background: lane.color, borderRadius: "0 0 50% 50% / 0 0 100% 100%", opacity: 0.9 }} />
                    <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent 6px, rgba(0,0,0,0.1) 6px, rgba(0,0,0,0.1) 7px)` }} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", zIndex: 2 }}>
                    {lane.done ? (
                      <div className="popupIn" style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.teal, letterSpacing: "0.26em", fontWeight: 800 }}>✓ DEBT FREE</div>
                        <div style={{ fontFamily: FONT_D, fontSize: 30, color: C.textCream, fontWeight: 900 }}>{fmtYrs(lane.months)}</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontFamily: FONT_M, fontSize: 9, color: pctLeft > 40 ? "rgba(255,255,255,0.85)" : C.textCreamDim, letterSpacing: "0.22em", fontWeight: 700 }}>STILL OWED</div>
                        <div style={{ fontFamily: FONT_D, fontSize: 30, color: pctLeft > 40 ? "#fff" : C.textCream, fontWeight: 900, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>₺{Math.round(lane.balance).toLocaleString()}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Lane stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "6px 8px" }}>
                    <div style={{ fontFamily: FONT_M, fontSize: 7.5, color: C.textCreamDim, letterSpacing: "0.18em", fontWeight: 700 }}>INTEREST PAID</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.coral, fontWeight: 900 }}>₺{Math.round(lane.interestPaid).toLocaleString()}</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "6px 8px" }}>
                    <div style={{ fontFamily: FONT_M, fontSize: 7.5, color: C.textCreamDim, letterSpacing: "0.18em", fontWeight: 700 }}>MONTHS</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.textCream, fontWeight: 900 }}>{lane.done ? lane.months : month}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RESULT OVERLAY */}
        {phase === "result" && (
          <div className="popupIn" style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            background: "rgba(255,248,238,0.98)", padding: "26px 36px", borderRadius: 10,
            maxWidth: 720, width: "92%", border: `3px solid ${C.purple}`, zIndex: 10,
            boxShadow: `0 40px 100px rgba(0,0,0,0.7)`, maxHeight: "88%", overflowY: "auto",
          }}>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.purple, letterSpacing: "0.32em", fontWeight: 800 }}>● THE TRAP, IN NUMBERS</div>
            <div style={{ fontFamily: FONT_D, fontSize: 32, color: C.ink, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 6 }}>
              Same debt. Same card. {minLane.months >= highLane.months * 2 ? `${Math.round(minLane.months / Math.max(1, highLane.months))}× longer` : "Years longer"} in the trap.
            </div>

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {lanes.map(l => (
                <div key={l.id} style={{ background: C.surface2, borderTop: `4px solid ${l.color}`, borderRadius: 4, padding: "12px 14px" }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: l.color, letterSpacing: "0.2em", fontWeight: 800 }}>{l.icon} {l.name}</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 24, color: C.ink, fontWeight: 900, marginTop: 4 }}>{l.done ? fmtYrs(l.months) : `${fmtYrs(300)}+`}</div>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.1em", marginTop: 2 }}>to debt-free</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 15, color: C.coral, fontWeight: 800, marginTop: 6 }}>₺{Math.round(l.interestPaid).toLocaleString()} interest</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: "14px 18px", background: `${C.purple}12`, borderLeft: `4px solid ${C.purple}`, borderRadius: 4 }}>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.purple, letterSpacing: "0.22em", fontWeight: 800 }}>● THE LESSON</div>
              <div style={{ fontFamily: FONT_D, fontSize: 15, color: C.ink, fontWeight: 700, lineHeight: 1.45, marginTop: 4 }}>
                The minimum payment is not a kindness — it is a product. It is calculated to keep you paying interest for as long as legally possible. Every Marka above the minimum goes straight at the debt itself.
              </div>
              <div style={{ fontFamily: FONT_B, fontSize: 12, color: C.textMuted, lineHeight: 1.45, marginTop: 6, fontStyle: "italic" }}>
                Minimum-only paid ₺{Math.round(minLane.interestPaid).toLocaleString()} in interest. Fixed ₺120 paid ₺{Math.round(highLane.interestPaid).toLocaleString()}. The difference bought the lender's lunch — for years.
              </div>
            </div>

            <TakeThisHome game="debt" accent={C.purple} dispatch={dispatch} options={[
              "Check what I'm actually paying on any card or BNPL balance",
              "Set a fixed repayment above the minimum, even ₺10 more",
              "Pause before putting anything new on credit this month",
            ]} />

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => { setPhase("setup"); setRunning(false); }} style={{ flex: 1, background: "transparent", color: C.text, border: `1.5px solid ${C.borderCream}`, padding: "14px 20px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>TRY ANOTHER DEBT →</button>
              <button onClick={onBack} style={{ flex: 1, background: C.purple, color: "#fff", border: "none", padding: "14px 20px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>DONE</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "#000", height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em" }}>THE MINIMUM PAYMENT IS A PRODUCT · NOT A FAVOUR</div>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   PAUSE MENU (Esc) — progress, badges, journal, sound (v26)
   ════════════════════════════════════════════════════════════ */
function PauseMenu({ state, dispatch, onClose, soundOn, onToggleSound }) {
  const questOrder = ["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10"];
  const doneSet = new Set(state.completedQuests);
  const reflections = state.reflections || [];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(4,6,15,0.88)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 30 }}>
      <div onClick={(e) => e.stopPropagation()} className="popupIn" style={{ background: "rgba(255,248,238,0.98)", borderRadius: 8, maxWidth: 880, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 40px 120px rgba(0,0,0,0.8)", border: `2px solid ${C.gold}` }}>
        {/* Header */}
        <div style={{ background: C.ink, padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "6px 6px 0 0" }}>
          <div>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● PAUSED · GREAT VOSTAN</div>
            <div style={{ fontFamily: FONT_D, fontSize: 26, color: C.textCream, fontWeight: 900, letterSpacing: "-0.02em" }}>Your day so far.</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={onToggleSound} style={{ background: "transparent", color: C.textCream, border: `1.5px solid ${C.borderL}`, padding: "9px 16px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", cursor: "pointer", borderRadius: 3 }}>
              {soundOn ? "🔊 SOUND ON" : "🔇 SOUND OFF"}
            </button>
            <button onClick={onClose} style={{ background: C.gold, color: C.ink, border: "none", padding: "9px 18px", fontFamily: FONT_M, fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", cursor: "pointer", borderRadius: 3 }}>▶ RESUME</button>
          </div>
        </div>

        <div style={{ padding: "22px 28px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
          {/* LEFT: quest line */}
          <div>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.26em", fontWeight: 800, marginBottom: 10 }}>● THE STORY · DAY {state.day}</div>
            {questOrder.map((qid) => {
              const q = QUESTS[qid];
              const done = doneSet.has(qid);
              const active = state.activeQuest === qid;
              return (
                <div key={qid} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.borderCream}55`, opacity: done || active ? 1 : 0.45 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: done ? C.teal : active ? C.coral : C.surface3, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, animation: active ? "pulse 1.4s infinite" : "none" }}>
                    {done ? "✓" : active ? "●" : ""}
                  </div>
                  <div style={{ fontFamily: FONT_B, fontSize: 12.5, color: C.ink, fontWeight: done ? 600 : active ? 800 : 500, lineHeight: 1.35 }}>{q.title}</div>
                </div>
              );
            })}
            <div style={{ marginTop: 12, fontFamily: FONT_M, fontSize: 10, color: C.textMuted, letterSpacing: "0.14em", fontWeight: 700 }}>XP {state.xp} · {state.notes.length} PERSPECTIVES GATHERED</div>
          </div>

          {/* RIGHT: badges + journal */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontFamily: FONT_M, fontSize: 9, color: "#a87918", letterSpacing: "0.26em", fontWeight: 800, marginBottom: 10 }}>🏅 BADGES · {(state.badges || []).length} OF {Object.keys(BADGES).length}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(BADGES).map(([id, b]) => {
                  const earned = (state.badges || []).includes(id);
                  return (
                    <div key={id} title={b.desc} style={{ background: earned ? `${b.color}14` : C.surface2, border: `1.5px solid ${earned ? b.color : C.borderCream}`, borderRadius: 5, padding: "9px 11px", display: "flex", gap: 9, alignItems: "center", opacity: earned ? 1 : 0.45, filter: earned ? "none" : "grayscale(0.9)" }}>
                      <span style={{ fontSize: 20 }}>{b.icon}</span>
                      <div>
                        <div style={{ fontFamily: FONT_D, fontSize: 12, color: C.ink, fontWeight: 800, lineHeight: 1.1 }}>{b.name}</div>
                        <div style={{ fontFamily: FONT_M, fontSize: 7.5, color: earned ? b.color : C.textMuted, letterSpacing: "0.12em", fontWeight: 700, marginTop: 1 }}>{earned ? "EARNED" : "LOCKED"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {reflections.length > 0 && (
              <div>
                <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.teal, letterSpacing: "0.26em", fontWeight: 800, marginBottom: 8 }}>🪞 TAKING HOME</div>
                {reflections.slice(-4).map((r, i) => (
                  <div key={i} style={{ fontFamily: FONT_B, fontSize: 11.5, color: C.text, lineHeight: 1.45, padding: "5px 0", borderBottom: `1px solid ${C.borderCream}55`, fontStyle: "italic" }}>"{r.text}"</div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
              <button onClick={() => { if (window.confirm("Restart the whole demo? Your saved progress will be wiped.")) { dispatch({ type: "RESET" }); onClose(); } }} style={{ flex: 1, background: "transparent", color: C.coral, border: `1.5px solid ${C.coral}`, padding: "11px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", cursor: "pointer", borderRadius: 3 }}>↶ RESTART DEMO</button>
            </div>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.14em", textAlign: "center" }}>PROGRESS SAVES AUTOMATICALLY · PRESS ESC TO RESUME</div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Future You — 30 year life sim (the original BankPanel content) ─────
function FutureYouSim({ state, dispatch, onBack }) {
  // "FUTURE YOU: 30 YEARS" — a real life simulator
  const [phase, setPhase] = useState("setup"); // setup | running | event | final
  const [allocation, setAllocation] = useState("balanced"); // cash | safe | balanced | growth
  const [monthlyRate, setMonthlyRate] = useState(0.15); // % of income saved
  const [age, setAge] = useState(22);
  const [wealth, setWealth] = useState(500);
  const [income, setIncome] = useState(2400);
  const [history, setHistory] = useState([{ age: 22, wealth: 500, event: null }]);
  const [running, setRunning] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [eventLog, setEventLog] = useState([]);

  // Asset class returns (annual) and volatility
  const RETURNS = { cash: 0.025, safe: 0.045, balanced: 0.062, growth: 0.085 };
  const VOLATILITY = { cash: 0.0, safe: 0.02, balanced: 0.08, growth: 0.18 };
  const ALLOC_LABELS = {
    cash: { name: "ALL CASH", sub: "0% stocks", desc: "Safe. Loses to inflation every year.", color: C.textMuted, icon: "💵" },
    safe: { name: "MOSTLY SAFE", sub: "20% stocks", desc: "Steady. Beats inflation slightly.", color: C.teal, icon: "🛡" },
    balanced: { name: "BALANCED", sub: "50% stocks", desc: "Bumps along but climbs.", color: C.gold, icon: "⚖️" },
    growth: { name: "GROWTH", sub: "90% stocks", desc: "Wild ride, biggest reward.", color: C.coral, icon: "📈" },
  };

  // Life events bank
  const EVENT_BANK = [
    { age: 24, t: "wedding", title: "A FRIEND'S WEDDING ABROAD", body: "Best man duties. Three days in Lisbon. Flight + hotel + suit + gift = ₺2,400.", choices: [
      { id: "go",   label: "GO. ALL IN.",      cost: 2400, mood: 8,  lesson: "Memories matter. So does the dent." },
      { id: "lite", label: "SCALE IT BACK",    cost: 1100, mood: 4,  lesson: "Cheap flight, no hotel — you got both worlds." },
      { id: "skip", label: "POLITELY DECLINE", cost: 0,    mood: -6, lesson: "Saved cash. Lost a friendship a little." },
    ]},
    { age: 27, t: "crash", title: "MARKET CRASH", body: "An index goes down 28% in five weeks. Your stocks just took a haircut. The headlines call it 'carnage'.", choices: [
      { id: "sell", label: "SELL TO SAFETY",   apply: { stockHit: 0.28, lockedInLoss: true },  lesson: "You locked in the loss. The market recovered in 11 months." },
      { id: "hold", label: "HOLD. DO NOTHING.", apply: { stockHit: 0.28 },                      lesson: "You held. The dip recovered. Boring is brave." },
      { id: "buy",  label: "BUY MORE (₺1,500)", apply: { stockHit: 0.28, extraIn: 1500 },       lesson: "You bought the dip. Risky but it paid." },
    ]},
    { age: 30, t: "promotion", title: "PROMOTION!", body: "+₺600 a month after tax. Your boss took you out to lunch. You can feel your standards rising.", choices: [
      { id: "lifestyle", label: "TREAT YOURSELF",       apply: { incomeBoost: 600, expenseBoost: 600 }, lesson: "Lifestyle creep. The money never reached you." },
      { id: "split",     label: "HALF SAVE, HALF SPEND", apply: { incomeBoost: 600, expenseBoost: 300 }, lesson: "Healthy compromise. Future you nods." },
      { id: "save",      label: "INVEST IT ALL",         apply: { incomeBoost: 600 },                    lesson: "Lifestyle steady. Wealth velocity up." },
    ]},
    { age: 33, t: "home", title: "A HOME OF YOUR OWN?", body: "₺38,000 down payment. Mortgage at 5.4%. The flat you've been renting is up for sale.", choices: [
      { id: "buy",  label: "BUY IT",          apply: { drain: 38000, expenseBoost: 100 },  lesson: "You own. Equity replaces rent. Maintenance is real." },
      { id: "rent", label: "KEEP RENTING",    apply: { },                                  lesson: "Stayed liquid. Watching prices climb stings." },
      { id: "wait", label: "WAIT FOR A DROP", apply: { },                                  lesson: "Waited. The drop didn't come. It rarely does." },
    ]},
    { age: 38, t: "kids", title: "CHILDREN — YES OR LATER?", body: "Sara is asking. Two kids = ₺850/mo extra. Joyful, irreversible.", choices: [
      { id: "now",  label: "START NOW",       apply: { expenseBoost: 850, mood: 10 },     lesson: "Worth every penny, every late night." },
      { id: "one",  label: "JUST ONE",        apply: { expenseBoost: 450, mood: 6 },      lesson: "A smaller hit. A bigger room for everything else." },
      { id: "no",   label: "NOT FOR US",      apply: { mood: -2 },                         lesson: "Wealth higher. Houses quieter." },
    ]},
    { age: 42, t: "recession", title: "RECESSION HITS YOUR INDUSTRY", body: "Hours cut. Income down 35% for a year. Markets also down 22%. Your emergency fund — what was it again?", choices: [
      { id: "cut",   label: "CUT SAVINGS TO ZERO",   apply: { stockHit: 0.22, incomeCut: 0.35 },               lesson: "Survived without selling. Smart." },
      { id: "tap",   label: "TAP SAVINGS TO LIVE",   apply: { stockHit: 0.22, incomeCut: 0.35, drain: 8000 },  lesson: "You sold low. Painful but you ate." },
      { id: "card",  label: "USE THE CREDIT CARD",   apply: { stockHit: 0.22, incomeCut: 0.35, debt: 5000 },   lesson: "18% interest. The debt followed you for years." },
    ]},
    { age: 47, t: "inheritance", title: "INHERITANCE", body: "An aunt you barely knew left you ₺18,000. Tax-free. Now what?", choices: [
      { id: "invest", label: "INVEST ALL OF IT", apply: { extraIn: 18000 },                lesson: "Compounded for 18 years. Aunt would approve." },
      { id: "house",  label: "PAY DOWN MORTGAGE", apply: { drain: 18000, expenseDrop: 200 }, lesson: "Less debt, more peace. Boring works." },
      { id: "fun",    label: "AROUND THE WORLD", apply: { drain: 18000, mood: 12 },          lesson: "Magic year. Numbers slightly lower forever." },
    ]},
    { age: 52, t: "boom", title: "MARKET RUNNING HOT — 'IRRATIONAL EXUBERANCE'", body: "Stocks have gone up 80% in three years. Friends are quitting jobs to day trade. You feel like you're missing out.", choices: [
      { id: "fomo",  label: "GO ALL IN",       apply: { allInStocks: true },              lesson: "Maximum exposure right before the peak. It happens." },
      { id: "trim",  label: "TAKE SOME OFF",   apply: { trim: 0.2 },                       lesson: "Locked in some gains. Slept better." },
      { id: "hold",  label: "STAY THE COURSE", apply: { },                                 lesson: "The plan is the plan. You stuck to it." },
    ]},
    { age: 58, t: "career", title: "EARLY RETIREMENT? OR ONE MORE BIG GIG?", body: "An offer: 3 years on a high-pressure role. ₺1,400/mo more after tax. Or step back now.", choices: [
      { id: "take", label: "TAKE IT",     apply: { incomeBoost: 1400, mood: -4 },         lesson: "Three hard years. The numbers thank you." },
      { id: "soft", label: "PART-TIME",   apply: { incomeBoost: 400, mood: 4 },           lesson: "Balanced exit. You kept your health." },
      { id: "step", label: "STEP BACK",   apply: { incomeBoost: 0, mood: 8 },             lesson: "Free time. Less money. Plenty of life left." },
    ]},
  ];

  // Apply an event choice
  const applyChoice = (event, choice) => {
    const apply = choice.apply || {};
    let newWealth = wealth;
    let newIncome = income;
    let newExpense = 0;

    if (choice.cost) newWealth -= choice.cost;
    if (apply.drain) newWealth -= apply.drain;
    if (apply.extraIn) newWealth += apply.extraIn;
    if (apply.debt) newWealth -= apply.debt;
    if (apply.stockHit) {
      // Hit only the stock portion
      const stockPct = allocation === "growth" ? 0.9 : allocation === "balanced" ? 0.5 : allocation === "safe" ? 0.2 : 0;
      newWealth = newWealth * (1 - stockPct * apply.stockHit);
    }
    if (apply.incomeBoost) newIncome += apply.incomeBoost;
    if (apply.incomeCut) newIncome = newIncome * (1 - apply.incomeCut);
    if (apply.lockedInLoss) {
      // Move to cash for 3 years
      setAllocation("cash");
    }
    if (apply.allInStocks) setAllocation("growth");
    if (apply.trim) {
      // Lock in 20% gains
    }

    setWealth(Math.max(0, newWealth));
    setIncome(newIncome);
    setDecisions(d => [...d, { age: event.age, eventId: event.t, choiceId: choice.id, lesson: choice.lesson }]);
    setEventLog(l => [...l, { age: event.age, title: event.title, choice: choice.label, lesson: choice.lesson }]);
    setCurrentEvent(null);
    setPhase("running");
  };

  // Yearly tick — wealth grows based on allocation
  useEffect(() => {
    if (!running || phase !== "running") return;
    const tick = setTimeout(() => {
      const r = RETURNS[allocation];
      const vol = VOLATILITY[allocation];
      const yearly = r + (Math.random() - 0.5) * vol * 2;
      const monthlySavings = income * monthlyRate;
      const annualSavings = monthlySavings * 12;
      const newWealth = wealth * (1 + yearly) + annualSavings;

      setWealth(newWealth);
      setAge(a => a + 1);
      setHistory(h => [...h, { age: age + 1, wealth: newWealth, event: null }]);

      // Check for events
      const event = EVENT_BANK.find(e => e.age === age + 1);
      if (event) {
        setRunning(false);
        setCurrentEvent(event);
        setPhase("event");
      }
      // End at age 52
      if (age + 1 >= 52) {
        setRunning(false);
        setPhase("final");
      }
    }, 700);
    return () => clearTimeout(tick);
  }, [running, age, wealth, allocation, income, monthlyRate, phase]);

  const close = () => dispatch({ type: "CLOSE_PANEL" });

  // ───── SETUP PHASE ─────
  if (phase === "setup") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
        {/* Letterbox top */}
        <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>THE BANK · FUTURE YOU · 30 YEARS</div>
          </div>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>SET YOUR STRATEGY</div>
        </div>

        {/* Full cityscape backdrop */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: `linear-gradient(180deg, #04060f 0%, #0a1230 35%, #2a1c4a 70%, ${C.skyDawn} 92%, ${C.skyHorizon} 100%)` }}>
          <svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <circle cx="1300" cy="200" r="80" fill="#fff8ee" opacity="0.95" />
            <circle cx="1300" cy="200" r="160" fill={C.gold} opacity="0.18" />
            {Array.from({ length: 40 }).map((_, i) => (
              <circle key={i} cx={(i * 137) % 1600} cy={(i * 89) % 300} r="0.7" fill="#fff8ee" opacity="0.5">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
              </circle>
            ))}
            <path d="M 0 580 Q 200 540 350 570 Q 600 530 900 560 Q 1200 540 1600 570 L 1600 800 L 0 800 Z" fill="#0a0f24" opacity="0.7" />
            <rect x="0" y="640" width="1600" height="160" fill="#04060f" />
          </svg>

          {/* Centered setup card */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
            <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "50px 60px", maxWidth: 880, width: "100%", borderRadius: 4, boxShadow: "0 40px 100px rgba(0,0,0,0.7)", border: `2px solid ${C.gold}` }}>
              <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.coral, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 6 }}>YOU ARE 22. THIS IS YOUR LIFE.</div>
              <div style={{ fontFamily: FONT_D, fontSize: 60, color: C.ink, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: 12 }}>Future You.</div>
              <div style={{ fontFamily: FONT_H, fontSize: 28, color: C.gold, fontWeight: 600, marginBottom: 30 }}>Thirty years. One starting plan. Life happens along the way.</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
                {Object.entries(ALLOC_LABELS).map(([id, opt]) => (
                  <button key={id} onClick={() => setAllocation(id)} style={{
                    background: allocation === id ? opt.color : C.surface2,
                    border: `2px solid ${allocation === id ? opt.color : C.borderCream}`,
                    padding: "20px 16px", borderRadius: 4, textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>{opt.icon}</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 18, fontWeight: 900, color: allocation === id ? "#fff" : C.ink, letterSpacing: "-0.01em" }}>{opt.name}</div>
                    <div style={{ fontFamily: FONT_M, fontSize: 9, color: allocation === id ? "rgba(255,255,255,0.85)" : opt.color, letterSpacing: "0.18em", fontWeight: 800, marginTop: 2 }}>{opt.sub}</div>
                    <div style={{ fontSize: 11, color: allocation === id ? "rgba(255,255,255,0.85)" : C.textMuted, marginTop: 6, lineHeight: 1.35 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 20, padding: "16px 20px", background: C.surface2, borderRadius: 4, border: `1px solid ${C.borderCream}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.text, letterSpacing: "0.22em", fontWeight: 800 }}>SAVE THIS % OF YOUR INCOME</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 30, color: C.coral, fontWeight: 900 }}>{Math.round(monthlyRate * 100)}<span style={{ fontSize: 18 }}>%</span></div>
                </div>
                <input type="range" min="0.05" max="0.40" step="0.01" value={monthlyRate} onChange={(e) => setMonthlyRate(parseFloat(e.target.value))} style={{ width: "100%", accentColor: C.coral }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: FONT_M, color: C.textMuted, marginTop: 4 }}>
                  <span>5% · tight</span><span>15% · average</span><span>25% · disciplined</span><span>40% · monk</span>
                </div>
                <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textMuted, marginTop: 8, lineHeight: 1.4 }}>
                  Starting income: ₺{income.toLocaleString()}/mo. That's ₺{Math.round(income * monthlyRate).toLocaleString()}/mo set aside.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={close} style={{ background: "transparent", color: C.textMuted, border: `1px solid ${C.borderCream}`, padding: "14px 24px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 3 }}>WALK AWAY</button>
                <button onClick={() => { setPhase("running"); setRunning(true); }} style={{ background: C.coral, color: "#fff", border: "none", padding: "16px 40px", fontFamily: FONT_M, fontSize: 12, fontWeight: 800, letterSpacing: "0.28em", cursor: "pointer", borderRadius: 3, boxShadow: `0 14px 36px ${C.coral}66` }}>
                  BEGIN. AGE 22 →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#000", height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.32em" }}>BANK OF VOSTAN · "INVEST EARLY · INVEST OFTEN"</div>
        </div>
      </div>
    );
  }

  // ───── RUNNING / EVENT / FINAL ─────
  const yearsPassed = age - 22;
  const totalIn = (income * monthlyRate * 12 * yearsPassed) + 500;
  const growth = wealth - totalIn;
  const maxWealth = Math.max(...history.map(h => h.wealth));

  return (
    <div style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 40, display: "flex", flexDirection: "column" }}>
      {/* Top letterbox */}
      <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>FUTURE YOU · {ALLOC_LABELS[allocation].name} · SAVING {Math.round(monthlyRate * 100)}%</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>AGE {age} · {phase === "final" ? "FINAL" : `${52 - age} YEARS LEFT`}</div>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: `linear-gradient(180deg, #04060f 0%, #0a1230 50%, #1a2454 100%)` }}>
        {/* Background floating particles */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {Array.from({ length: 25 }).map((_, i) => (
            <circle key={i} cx={(i * 137) % 1600} cy={(i * 89) % 700} r="0.8" fill="#fff8ee" opacity="0.4">
              <animate attributeName="cy" values={`${(i * 89) % 700};${((i * 89) % 700) - 30};${(i * 89) % 700}`} dur={`${5 + (i % 5)}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>

        {/* Header strip: age + wealth */}
        <div style={{ position: "absolute", top: 30, left: 40, right: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 5 }}>
          <div>
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>AGE</div>
            <div style={{ fontFamily: FONT_D, fontSize: 120, color: C.textCream, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.06em", textShadow: "0 8px 32px rgba(0,0,0,0.7)" }}>{age}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.coral, letterSpacing: "0.32em", fontWeight: 800 }}>NET WORTH</div>
            <div style={{ fontFamily: FONT_D, fontSize: 64, color: C.coral, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em" }}>₺{Math.round(wealth).toLocaleString()}</div>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.textCreamDim, letterSpacing: "0.18em", marginTop: 4 }}>
              <span>PUT IN: ₺{Math.round(totalIn).toLocaleString()}</span> · <span style={{ color: growth >= 0 ? C.teal : C.coral }}>GROWTH: ₺{Math.round(growth).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Wealth chart over time — full width line graph */}
        <div style={{ position: "absolute", left: 40, right: 40, top: 200, bottom: 200 }}>
          <svg viewBox="0 0 1500 400" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
            {/* Grid */}
            {[0, 100, 200, 300, 400].map(y => (
              <line key={y} x1="0" y1={y} x2="1500" y2={y} stroke="rgba(255,248,238,0.06)" strokeWidth="1" />
            ))}
            {[0, 5, 10, 15, 20, 25, 30].map(y => (
              <g key={y}>
                <line x1={y * 50} y1="0" x2={y * 50} y2="400" stroke="rgba(255,248,238,0.06)" strokeWidth="1" />
                <text x={y * 50 + 4} y="395" fill={C.textCreamDim} fontFamily={FONT_M} fontSize="10" fontWeight="600">{22 + y}</text>
              </g>
            ))}
            {/* Wealth line */}
            <polyline points={history.map((h, i) => {
              const x = ((h.age - 22) / 30) * 1500;
              const y = 400 - Math.min(390, (h.wealth / Math.max(maxWealth, 1)) * 380);
              return `${x},${y}`;
            }).join(" ")} stroke={C.coral} strokeWidth="3.5" fill="none" strokeLinejoin="round" />
            {/* Filled area */}
            <polygon points={`0,400 ${history.map(h => {
              const x = ((h.age - 22) / 30) * 1500;
              const y = 400 - Math.min(390, (h.wealth / Math.max(maxWealth, 1)) * 380);
              return `${x},${y}`;
            }).join(" ")} ${((age - 22) / 30) * 1500},400`} fill={C.coral} opacity="0.15" />
            {/* Event markers */}
            {eventLog.map((e, i) => {
              const x = ((e.age - 22) / 30) * 1500;
              return (
                <g key={i}>
                  <line x1={x} y1="0" x2={x} y2="400" stroke={C.gold} strokeWidth="1" strokeDasharray="3,4" opacity="0.5" />
                  <circle cx={x} cy="20" r="5" fill={C.gold} />
                </g>
              );
            })}
            {/* Current age marker */}
            <line x1={((age - 22) / 30) * 1500} y1="0" x2={((age - 22) / 30) * 1500} y2="400" stroke={C.coral} strokeWidth="2" />
            <circle cx={((age - 22) / 30) * 1500} cy={400 - Math.min(390, (wealth / Math.max(maxWealth, 1)) * 380)} r="8" fill={C.coral} stroke="#fff" strokeWidth="2" />
          </svg>
        </div>

        {/* EVENT POPUP */}
        {phase === "event" && currentEvent && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(4,6,15,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, backdropFilter: "blur(6px)" }}>
            <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "40px 50px", maxWidth: 880, width: "90%", borderRadius: 4, boxShadow: `0 40px 120px ${C.coral}55, 0 0 0 8px rgba(218,27,92,0.12)`, borderTop: `6px solid ${C.coral}`, position: "relative" }}>
              <div style={{ position: "absolute", top: -14, left: 40, background: C.coral, color: "#fff", padding: "5px 14px", borderRadius: 2, fontFamily: FONT_M, fontSize: 9, letterSpacing: "0.32em", fontWeight: 800, boxShadow: `0 4px 14px ${C.coral}88` }}>AGE {currentEvent.age} · LIFE EVENT</div>
              <div style={{ fontFamily: FONT_D, fontSize: 44, color: C.ink, fontWeight: 900, letterSpacing: "-0.025em", lineHeight: 1, marginTop: 8, marginBottom: 14 }}>{currentEvent.title}</div>
              <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.text, lineHeight: 1.5, marginBottom: 24, fontStyle: "italic", fontWeight: 600 }}>{currentEvent.body}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {currentEvent.choices.map((c, i) => (
                  <button key={c.id} onClick={() => applyChoice(currentEvent, c)} style={{
                    background: C.surface2, border: `2px solid ${C.borderCream}`, padding: "18px 20px", cursor: "pointer", borderRadius: 3,
                    textAlign: "left", transition: "all 0.15s",
                  }} onMouseOver={(e) => { e.currentTarget.style.borderColor = C.coral; e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 30px ${C.coral}44`; }}
                     onMouseOut={(e) => { e.currentTarget.style.borderColor = C.borderCream; e.currentTarget.style.background = C.surface2; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 8 }}>● OPTION {i + 1}</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 18, color: C.ink, fontWeight: 800, lineHeight: 1.2 }}>{c.label}</div>
                    {c.cost > 0 && <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textMuted, marginTop: 8, letterSpacing: "0.18em", fontWeight: 700 }}>COST ₺{c.cost.toLocaleString()}</div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FINAL screen */}
        {phase === "final" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(4,6,15,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, padding: 40 }}>
            <div className="popupIn" style={{ background: "rgba(255,248,238,0.98)", padding: "44px 56px", maxWidth: 920, width: "100%", borderRadius: 4, boxShadow: "0 40px 100px rgba(0,0,0,0.7)", borderTop: `5px solid ${C.gold}` }}>
              <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.coral, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 6 }}>AGE 52 · YOUR LIFE SO FAR</div>
              <div style={{ fontFamily: FONT_D, fontSize: 56, color: C.ink, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>You have ₺{Math.round(wealth).toLocaleString()}.</div>
              <div style={{ fontFamily: FONT_H, fontSize: 24, color: C.gold, fontWeight: 600, marginBottom: 24 }}>
                {wealth > 600000 ? "Comfortable retirement awaits. Future You is grinning." : wealth > 300000 ? "Solid foundation. The next decade matters." : wealth > 100000 ? "Modest. There's still time to push." : "Tight. Lessons learned the hard way."}
              </div>

              {/* THE COMPOUND REVEAL — people guess deposits built the pile. Watch the teal. (v26) */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 800, marginBottom: 6 }}>WHERE THE PILE ACTUALLY CAME FROM</div>
                <div style={{ display: "flex", height: 34, borderRadius: 5, overflow: "hidden", border: `1.5px solid ${C.borderCream}` }}>
                  <div style={{ width: `${Math.max(4, Math.min(96, (totalIn / Math.max(wealth, 1)) * 100))}%`, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_M, fontSize: 9.5, color: "#fff", fontWeight: 800, letterSpacing: "0.1em", whiteSpace: "nowrap", overflow: "hidden", transition: "width 1s ease-out" }}>YOUR DEPOSITS</div>
                  <div style={{ flex: 1, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_M, fontSize: 9.5, color: "#fff", fontWeight: 800, letterSpacing: "0.1em", whiteSpace: "nowrap", overflow: "hidden" }}>{growth > 0 ? "COMPOUND GROWTH" : ""}</div>
                </div>
                <div style={{ fontFamily: FONT_B, fontSize: 11.5, color: C.textMuted, marginTop: 6, fontStyle: "italic", lineHeight: 1.45 }}>
                  {growth > totalIn ? `The growth (₺${Math.round(growth).toLocaleString()}) is bigger than everything you put in — that is compound interest doing the heavy lifting.` : growth > 0 ? `₺${Math.round(growth).toLocaleString()} of this pile is money your money made on its own.` : "This run, your deposits did all the work — markets and choices ate the growth."}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
                <div style={{ background: C.surface2, padding: 16, borderLeft: `4px solid ${C.coral}`, borderRadius: 3 }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.22em", fontWeight: 800 }}>TOTAL CONTRIBUTED</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 26, color: C.ink, fontWeight: 900, marginTop: 4 }}>₺{Math.round(totalIn).toLocaleString()}</div>
                </div>
                <div style={{ background: C.surface2, padding: 16, borderLeft: `4px solid ${C.teal}`, borderRadius: 3 }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.teal, letterSpacing: "0.22em", fontWeight: 800 }}>FROM MARKETS & COMPOUNDING</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 26, color: C.ink, fontWeight: 900, marginTop: 4 }}>₺{Math.round(growth).toLocaleString()}</div>
                </div>
                <div style={{ background: C.surface2, padding: 16, borderLeft: `4px solid ${C.gold}`, borderRadius: 3 }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.22em", fontWeight: 800 }}>FINAL MULTIPLIER</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 26, color: C.ink, fontWeight: 900, marginTop: 4 }}>{(wealth / Math.max(totalIn, 1)).toFixed(2)}×</div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 800, marginBottom: 8 }}>WHAT YOU LEARNED ALONG THE WAY</div>
                {eventLog.slice(-4).map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${C.borderCream}` : "none" }}>
                    <div style={{ fontFamily: FONT_D, fontSize: 14, color: C.gold, fontWeight: 800, minWidth: 40 }}>AGE {e.age}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONT_D, fontSize: 13, color: C.ink, fontWeight: 700 }}>{e.choice}</div>
                      <div style={{ fontFamily: FONT_D, fontSize: 13, color: C.textMuted, fontStyle: "italic", fontWeight: 500 }}>{e.lesson}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => { setPhase("setup"); setAge(22); setWealth(500); setIncome(2400); setHistory([{ age: 22, wealth: 500 }]); setDecisions([]); setEventLog([]); }} style={{ flex: 1, background: C.surface2, color: C.ink, border: `2px solid ${C.borderCream}`, padding: "14px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>↶ TRY AGAIN</button>
                <button onClick={close} style={{ flex: 1, background: C.coral, color: "#fff", border: "none", padding: "14px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>WALK OUT →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom letterbox / controls */}
      <div style={{ background: "#000", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {phase === "running" && !running && (
            <button onClick={() => setRunning(true)} style={{ background: C.gold, color: C.ink, border: "none", padding: "10px 22px", fontFamily: FONT_M, fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>▶ PLAY</button>
          )}
          {running && (
            <button onClick={() => setRunning(false)} style={{ background: C.gold, color: C.ink, border: "none", padding: "10px 22px", fontFamily: FONT_M, fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>❚❚ PAUSE</button>
          )}
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>{eventLog.length} LIFE EVENTS · INCOME ₺{Math.round(income).toLocaleString()}/MO</div>
        {phase !== "final" && (
          <button onClick={close} style={{ background: "transparent", color: C.textCreamDim, border: `1px solid ${C.textCreamDim}`, padding: "10px 18px", fontFamily: FONT_M, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 3 }}>WALK OUT</button>
        )}
      </div>
    </div>
  );
}
function Tile({ label, value, color }) {
  return (
    <div style={{ background: C.surface2, padding: "12px 14px", borderRadius: 4, border: `1.5px solid ${C.border}` }}>
      <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: FONT_D, fontSize: 22, color, fontWeight: 600, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function ProjTile({ label, value, color, sub }) {
  return (
    <div style={{ background: "rgba(255,248,238,0.05)", padding: "8px 10px", borderRadius: 3, border: "1px solid rgba(245,184,46,0.15)" }}>
      <div style={{ fontSize: 8, fontFamily: FONT_M, color: C.textCreamDim, letterSpacing: "0.2em", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: FONT_D, fontSize: 18, color, fontWeight: 800, lineHeight: 1.05, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 8.5, color: C.textCreamDim, fontFamily: FONT_M, marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function Voice({ color, who, text }) {
  return (
    <div style={{ borderLeft: `2.5px solid ${color}`, paddingLeft: 8 }}>
      <div style={{ fontFamily: FONT_M, fontSize: 8, color, letterSpacing: "0.18em", fontWeight: 700 }}>{who.toUpperCase()}</div>
      <div style={{ fontFamily: FONT_D, fontSize: 11.5, color: C.text, fontStyle: "italic", lineHeight: 1.3, marginTop: 1 }}>"{text}"</div>
    </div>
  );
}

// ─── MARKET PANEL ───────────────────────────────────────────
function MarketPanel({ state, dispatch }) {
  // Phases: shock (first time on q2) → choice → done
  const [phase, setPhase] = useState(state.activeQuest === "q2" || (state.activeQuest === "q3" && !state.marketShockSeen) ? "shock" : "browse");
  const [view, setView] = useState("chat");
  const inflMult = 1 + ((state.inflation - 2) / 100) * 8;

  // The shopping list — last week vs this week
  const ITEMS = [
    { name: "Loaf of bread", base: 1.8, icon: "🍞" },
    { name: "Litre of milk", base: 1.4, icon: "🥛" },
    { name: "Cooking oil", base: 4.5, icon: "🫒" },
    { name: "Eggs (dozen)", base: 5.2, icon: "🥚" },
    { name: "Rice (2kg)", base: 6.4, icon: "🌾" },
    { name: "Chicken (1kg)", base: 8.5, icon: "🍗" },
    { name: "Tomatoes (1kg)", base: 3.2, icon: "🍅" },
    { name: "Tea (200g)", base: 4.1, icon: "🍵" },
    { name: "Apples (1kg)", base: 2.8, icon: "🍎" },
    { name: "Pasta (500g)", base: 1.9, icon: "🍝" },
  ];
  const lastWeekTotal = ITEMS.reduce((s, i) => s + i.base, 0);
  const thisWeekTotal = ITEMS.reduce((s, i) => s + i.base * inflMult, 0);
  const extra = thisWeekTotal - lastWeekTotal;
  const planned = 100; // wallet for shopping
  const overBy = thisWeekTotal - planned;

  if (phase === "shock") {
    return (
      <PanelShell title="Amara's Market" sub="The chalkboard's been redone again" onClose={() => { dispatch({ type: "CLOSE_PANEL" }); }} accent={C.coral} wide>
        <div style={{ background: `${C.coral}10`, borderLeft: `4px solid ${C.coral}`, padding: 16, borderRadius: 4, marginBottom: 14 }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6 }}>AMARA, AT THE TILL</div>
          <div style={{ fontFamily: FONT_D, fontSize: 17, color: C.ink, fontWeight: 500, lineHeight: 1.5, fontStyle: "italic" }}>
            "Same shop, love. Same shelves. I just keep rewriting the prices. Sorry."
          </div>
        </div>

        <div style={{ background: C.surface2, borderRadius: 4, border: `1.5px solid ${C.borderCream}`, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 700 }}>YOUR USUAL WEEKLY SHOP</div>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.18em", fontWeight: 700 }}>INFLATION {pct(state.inflation)}</div>
          </div>
          <div>
            {ITEMS.map((it, i) => {
              const newP = it.base * inflMult;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0", borderBottom: i < ITEMS.length - 1 ? `1px solid ${C.border}30` : "none" }}>
                  <span style={{ fontSize: 18 }}>{it.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: C.text }}>{it.name}</span>
                  <span style={{ fontSize: 10, color: C.textDim, fontFamily: FONT_M, textDecoration: "line-through", minWidth: 36, textAlign: "right" }}>{fmt(it.base)}</span>
                  <span style={{ fontFamily: FONT_D, fontSize: 14, color: C.coral, fontWeight: 700, minWidth: 50, textAlign: "right" }}>{fmt(newP)}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: `2px solid ${C.coral}` }}>
            <span style={{ fontFamily: FONT_M, fontSize: 11, color: C.textMuted, letterSpacing: "0.2em", fontWeight: 700 }}>TOTAL</span>
            <span>
              <span style={{ fontSize: 13, color: C.textDim, fontFamily: FONT_M, textDecoration: "line-through", marginRight: 8 }}>{fmt(lastWeekTotal)}</span>
              <span style={{ fontFamily: FONT_D, fontSize: 24, color: C.coral, fontWeight: 800 }}>{fmt(thisWeekTotal)}</span>
            </span>
          </div>
          <div style={{ textAlign: "right", marginTop: 4, fontFamily: FONT_M, fontSize: 11, color: C.coral, fontWeight: 700 }}>
            +{fmt(extra)} more than last week ({Math.round((extra / lastWeekTotal) * 100)}% up)
          </div>
        </div>

        <div style={{ background: C.ink, padding: 14, borderRadius: 4, marginBottom: 14 }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 4 }}>YOUR INNER MONOLOGUE</div>
          <div style={{ fontFamily: FONT_H, fontSize: 18, color: C.surface, lineHeight: 1.45 }}>
            You'd budgeted {fmt(planned)} for this. The full shop is {fmt(thisWeekTotal)}. {overBy > 0 ? `That's ${fmt(overBy)} over.` : ""} You can't both eat well and save what you planned this month. Something has to give.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => { dispatch({ type: "ADD_NOTE", note: { from: "Amara's Market", text: `Weekly shop went from ${fmt(lastWeekTotal)} to ${fmt(thisWeekTotal)}. Same basket. Same shop. Just chalkboard maths.` } }); setPhase("browse"); }} style={{ background: C.coral, color: "#fff", border: "none", padding: "13px", fontFamily: FONT_M, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", cursor: "pointer", borderRadius: 4 }}>
            BUY THE FULL SHOP · {fmt(thisWeekTotal)} <span style={{ opacity: 0.85, fontSize: 10 }}>(eat well, save less)</span>
          </button>
          <button onClick={() => { dispatch({ type: "ADD_NOTE", note: { from: "Amara's Market", text: `Couldn't afford the full shop. Skipped meat, dropped to own-brand. Saved ${fmt(thisWeekTotal - planned)}. Felt small.` } }); setPhase("browse"); }} style={{ background: C.gold, color: C.ink, border: "none", padding: "13px", fontFamily: FONT_M, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", cursor: "pointer", borderRadius: 4 }}>
            CUT BACK · KEEP TO {fmt(planned)} <span style={{ opacity: 0.85, fontSize: 10 }}>(skip meat, drop to own-brand)</span>
          </button>
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Amara's Market" sub="7th Street · high street" onClose={() => dispatch({ type: "CLOSE_PANEL" })} accent={C.coral} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setView("chat"); dispatch({ type: "TALK_NPC", note: { from: "Amara (market)", text: state.inflation > 4 ? "Suppliers raising prices every week. Chalkboard's been redone twice this month. Eldest at uni — don't know how to keep both going." : "Tight. Trying not to pass it all on. Can't eat the difference forever." } }); }} style={{ background: view === "chat" ? `${C.coral}22` : C.surface2, border: `1.5px solid ${view === "chat" ? C.coral : C.border}`, padding: "11px", fontFamily: FONT_M, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4 }}>💬 TALK TO AMARA</button>
        <button onClick={() => setView("prices")} style={{ background: view === "prices" ? `${C.coral}22` : C.surface2, border: `1.5px solid ${view === "prices" ? C.coral : C.border}`, padding: "11px", fontFamily: FONT_M, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4 }}>📋 SEE PRICES</button>
      </div>

      {view === "chat" && (
        <div style={{ background: C.surface2, padding: 16, borderLeft: `3px solid ${C.coral}`, borderRadius: 4 }}>
          <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.coral, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6 }}>AMARA</div>
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.65 }}>
            <p>"Twenty years I've had this shop. Took it over from my dad in '06."</p>
            <p style={{ marginTop: 10 }}>"My supplier put the oil up again last week. Same with the bread flour. I write a new chalkboard every Monday. People look at it longer than they used to."</p>
            <p style={{ marginTop: 10, fontStyle: "italic", color: C.textMuted }}>She glances at your Reserve lanyard.</p>
            <p style={{ marginTop: 6 }}>"You're young to be working there. You'll be alright. Just don't forget what a chalkboard costs to redo."</p>
          </div>
        </div>
      )}

      {view === "prices" && (
        <div style={{ background: C.surface2, padding: 16, borderRadius: 4 }}>
          <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.coral, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 10 }}>THE CHALKBOARD · INFLATION {pct(state.inflation)}</div>
          {ITEMS.slice(0, 5).map((it, i) => {
            const p = it.base * inflMult;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 22 }}>{it.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: C.text }}>{it.name}</span>
                <span style={{ fontSize: 11, color: C.textDim, fontFamily: FONT_M, textDecoration: "line-through" }}>{fmt(it.base)}</span>
                <span style={{ fontFamily: FONT_D, fontSize: 16, color: p > it.base ? C.coral : C.green, fontWeight: 600, minWidth: 50, textAlign: "right" }}>{fmt(p)}</span>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => { dispatch({ type: "CLOSE_PANEL" }); }} style={{ width: "100%", background: C.ink, color: C.gold, border: "none", padding: "12px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", cursor: "pointer", borderRadius: 4, marginTop: 14 }}>HEAD TO THE BANK NEXT →</button>
    </PanelShell>
  );
}

// ─── COFFEE PANEL ───────────────────────────────────────────
function CoffeePanel({ state, dispatch }) {
  const loanRepay = 800 * (1 + ((state.interestRate - 2) / 100) * 4);
  useEffect(() => {
    dispatch({ type: "TALK_NPC", note: { from: "Desta (coffee)", text: loanRepay > 1100 ? "Loan repayment 800 → 1200 in a year. Same loan, same business. Already let two drivers go." : "Loan crept up. Holding everyone on for now but it's tight." } });
  }, []); // eslint-disable-line

  return (
    <PanelShell title="Desta's Coffee" sub="Morash quarter" onClose={() => dispatch({ type: "CLOSE_PANEL" })} accent={C.bCoffee}>
      <div style={{ background: C.surface2, padding: 16, borderLeft: `3px solid ${C.bCoffee}`, borderRadius: 4, marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.bCoffee, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6 }}>DESTA</div>
        <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.65 }}>
          <p>"Eight years. Started with one van and one regular run. Took a loan out in '21 to expand. Smartest thing I ever did. Until last year."</p>
          <p style={{ marginTop: 10 }}>"My repayment was ₺800 a month at the start. It's nearly twelve hundred now. Same loan. Same business."</p>
          <p style={{ marginTop: 10 }}>"Two daughters at home. They don't know any of this. I'd like to keep it that way."</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <Tile label="HER LOAN REPAYMENT" value={`${fmt(loanRepay)}/mo`} color={loanRepay > 1000 ? C.coral : C.gold} />
        <Tile label="STARTED AT" value="₺800/mo" color={C.text} />
      </div>
      <button onClick={() => { dispatch({ type: "CLOSE_PANEL" }); }} style={{ width: "100%", background: C.coral, color: "#fff", border: "none", padding: "12px", fontFamily: FONT_M, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", cursor: "pointer" }}>☕ BUY A COFFEE · ₺3.50</button>
    </PanelShell>
  );
}

// ─── CINEMA PANEL ───────────────────────────────────────────
function CinemaPanel({ state, dispatch }) {
  return (
    <PanelShell title="Plaza Cinema" sub="Now showing: The Keldra Letters" onClose={() => dispatch({ type: "CLOSE_PANEL" })} accent={C.bCinema}>
      <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginTop: 0, marginBottom: 16 }}>
        Marquee lights buzzing. A queue starting to form. Ticket: <strong style={{ color: C.coral }}>₺12</strong> (up from ₺10 last year).
      </p>
      <button onClick={() => { dispatch({ type: "CLOSE_PANEL" }); }} style={{ width: "100%", background: C.bCinema, color: "#fff", border: "none", padding: "13px", fontFamily: FONT_M, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", cursor: "pointer" }}>🎬 BUY A TICKET</button>
    </PanelShell>
  );
}

// ─── FLAT PANEL ─────────────────────────────────────────────
function FlatPanel({ state, dispatch }) {
  const [view, setView] = useState("evening");
  const canSleep = state.dayPhase === "personal" && (state.activeQuest === "q5" || state.activeQuest === "q6");
  const isMorning = state.dayPhase === "work";
  const wallet = state.wallet;
  const inBank = state.bankSaved;

  return (
    <PanelShell title="Your Flat" sub="Apartment 4B · top floor · 7:48pm" onClose={() => dispatch({ type: "CLOSE_PANEL" })} accent={C.bFlatD} wide>
      {/* Interior illustration */}
      <div style={{ background: "linear-gradient(180deg, #2a1438 0%, #4a2860 40%, #8a4870 100%)", borderRadius: 6, padding: 18, marginBottom: 14, position: "relative", overflow: "hidden", height: 180 }}>
        <svg viewBox="0 0 600 180" style={{ width: "100%", height: "100%", display: "block" }}>
          {/* Wall */}
          <rect x="0" y="0" width="600" height="180" fill="#3a1f50" />
          {/* Window with sunset (or morning) */}
          <rect x="40" y="20" width="170" height="110" fill={isMorning ? "#ffd28e" : "#ff8e6e"} />
          <rect x="40" y="20" width="170" height="55" fill={isMorning ? "#a8c8e8" : "#a04060"} />
          <line x1="125" y1="20" x2="125" y2="130" stroke="#2a1850" strokeWidth="3" />
          <line x1="40" y1="75" x2="210" y2="75" stroke="#2a1850" strokeWidth="3" />
          <rect x="36" y="16" width="178" height="118" fill="none" stroke="#1a0a06" strokeWidth="5" />
          {/* Sill plant */}
          <ellipse cx="125" cy="135" rx="14" ry="4" fill="#2a1438" />
          <path d="M 119 134 Q 117 122 113 116 M 125 134 Q 125 118 125 110 M 131 134 Q 133 122 137 118" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
          {/* Sofa */}
          <rect x="260" y="115" width="170" height="50" fill="#7a4060" rx="6" />
          <rect x="260" y="100" width="170" height="22" fill="#8a4870" rx="6" />
          {/* Lamp on side table */}
          <rect x="445" y="125" width="40" height="40" fill="#2a1438" />
          <rect x="455" y="90" width="20" height="35" fill="#1a0a06" />
          <ellipse cx="465" cy="85" rx="22" ry="14" fill={C.gold} opacity="0.9" />
          <circle cx="465" cy="85" r="32" fill={C.gold} opacity="0.18" />
          {/* Coffee table with bank statement */}
          <rect x="280" y="158" width="120" height="14" fill="#3a1f30" />
          <rect x="305" y="150" width="70" height="10" fill="#fff5e1" />
          <line x1="312" y1="153" x2="368" y2="153" stroke="#1a0a06" strokeWidth="0.6" />
          <line x1="312" y1="156" x2="345" y2="156" stroke="#1a0a06" strokeWidth="0.6" />
          {/* Picture frame on wall */}
          <rect x="500" y="40" width="60" height="48" fill="#1a0a06" />
          <rect x="504" y="44" width="52" height="40" fill="#a04060" />
          <path d="M 510 78 Q 520 60 530 70 Q 540 50 550 70 L 552 82 L 506 82 Z" fill="#3a1f50" />
        </svg>
      </div>

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
        {[
          { id: "evening", label: "🕯 EVENING" },
          { id: "notes", label: "📓 NOTES" },
          { id: "sleep", label: "🌙 SLEEP" },
        ].map((t) => (
          <button key={t.id} onClick={() => setView(t.id)} style={{ background: view === t.id ? `${C.bFlat}22` : C.surface2, border: `1.5px solid ${view === t.id ? C.bFlat : C.border}`, padding: "10px 8px", fontFamily: FONT_M, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.15em", cursor: "pointer", borderRadius: 4, color: view === t.id ? C.coral : C.text }}>{t.label}</button>
        ))}
      </div>

      {view === "evening" && (
        <div>
          <div style={{ background: C.surface2, padding: 16, borderLeft: `3px solid ${C.bFlat}`, borderRadius: 4, marginBottom: 14 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.bFlat, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6 }}>HOW THE DAY FELT</div>
            <div style={{ fontFamily: FONT_D, fontSize: 16, color: C.ink, lineHeight: 1.55, fontStyle: "italic" }}>
              {isMorning ? '"Already Tuesday. Coffee. Suit. The Reserve in ninety minutes. You can do this."' : '"Kettle on. Bank statement on the table. Your week\'s shopping cost more than the same shop two months ago and you don\'t need a chart to know that. Tomorrow you walk into the Reserve."'}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <Tile label="WALLET" value={fmt(wallet)} color={C.teal} />
            <Tile label="IN THE BANK" value={fmt(inBank)} color={C.gold} />
          </div>
          <div style={{ background: C.ink, padding: 14, borderRadius: 4 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6 }}>TOMORROW'S BRIEF</div>
            <div style={{ fontFamily: FONT_D, fontSize: 14.5, color: C.surface, lineHeight: 1.55 }}>
              First Monetary Policy Committee meeting. They'll brief you on the data. They'll want your view. You set the rate for ten million people.
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 14, fontFamily: FONT_M, fontSize: 10.5, fontWeight: 700 }}>
              <span style={{ color: C.coral }}>Inflation {pct(state.inflation)}</span>
              <span style={{ color: C.gold }}>Rate {pct(state.interestRate)}</span>
            </div>
          </div>
        </div>
      )}

      {view === "notes" && (
        <div>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.bFlat, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 10 }}>{state.notes.length} VOICES IN YOUR HEAD</div>
          {state.notes.length === 0 ? (
            <div style={{ background: C.surface2, padding: 16, borderRadius: 4, fontSize: 13, color: C.textMuted, fontStyle: "italic", textAlign: "center" }}>
              You didn't talk to anyone today. Tomorrow you'll wish you had.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
              {state.notes.map((n, i) => (
                <div key={i} style={{ background: C.surface2, padding: 12, borderRadius: 4, borderLeft: `3px solid ${C.gold}` }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.2em", fontWeight: 700, marginBottom: 4 }}>{n.from.toUpperCase()}</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 13.5, color: C.text, lineHeight: 1.5, fontStyle: "italic" }}>"{n.text}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "sleep" && (
        <div>
          <div style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #3a1f50 100%)", padding: 22, borderRadius: 6, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 56 }}>🌙</div>
            <div style={{ fontFamily: FONT_H, fontSize: 30, color: C.surface, fontWeight: 600, marginTop: 6 }}>Sleep on it</div>
            <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.textCreamDim, letterSpacing: "0.15em", marginTop: 4 }}>The committee meets at nine.</div>
          </div>
          {canSleep ? (
            <button onClick={() => { dispatch({ type: "START_SLEEP" }); }} style={{ width: "100%", background: C.coral, color: "#fff", border: "none", padding: "16px", fontFamily: FONT_M, fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 4 }}>
              😴 SLEEP · ADVANCE TO TUESDAY →
            </button>
          ) : state.dayPhase === "personal" ? (
            <div style={{ padding: 14, background: C.surface2, borderLeft: `3px solid ${C.gold}`, borderRadius: 4, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              Not ready yet. {state.activeQuest === "q1" ? "Talk to Mr Halim outside first." : state.activeQuest === "q2" ? "See what's happening at Amara's Market." : state.activeQuest === "q3" ? "Visit the savings bank — work out what you can actually save." : state.activeQuest === "q4" ? "The trading floor opens at ten. Worth a look." : "Keep going."}
            </div>
          ) : (
            <div style={{ padding: 14, background: `${C.green}15`, borderLeft: `3px solid ${C.green}`, borderRadius: 4, fontSize: 13, color: C.text }}>It's Tuesday. Head to the Reserve.</div>
          )}
        </div>
      )}
    </PanelShell>
  );
}

// ─── NPC DIALOGUE (sidewalk encounters) ────────────────────
function NpcDialogue({ npc, dispatch, state }) {
  const [step, setStep] = useState(0);
  const rate = state.interestRate;
  const hike = rate > 3.5;
  const cut = rate < 2.5;
  const isImpactPhase = state.activeQuest === "q10";

  // DAY 1 multi-beat dialogues — deeper, setting up Day 2
  const day1 = {
    halim: {
      name: "Mr Halim", color: C.rose,
      beats: [
        "Morning, neighbour! Off to the shop, are you? Mind how you go — Amara's been redoing the chalkboard every other week.",
        "I've lived in this building forty-one years. Watched the families change. The young ones come, struggle, then leave. The old ones stay because we paid off long ago.",
        "My grandson — Adam, lovely boy — bought his first flat last year. Six per cent mortgage. Thinks he can afford it. I haven't the heart to tell him.",
        "Anyway. I saw the announcement. They've put you on the committee. I'm proud to say I knew you before you were important. Just don't forget us up here when you're up there.",
      ],
      note: { from: "Mr Halim (neighbour)", text: "Forty-one years here. Grandson Adam just bought first flat at 6%. Said he's proud I'm on the committee. Asked me not to forget the people up here when I'm up there." }
    },
    yusuf: {
      name: "Yusuf", color: C.coral,
      beats: [
        "Mate! Funny seeing you here. I was just heading to mine — Sara's been doing the maths on the kitchen table again.",
        "Look. The mortgage went from ₺820 to ₺1,200 in a year. Same flat. Same loan. Just the rate.",
        "We've cut everything we can cut. Gym gone. Holidays gone. We even cancelled the kids' swimming lessons last month and I haven't told my mum because she'd weep.",
        "Tomorrow — whatever you do — just be honest with us. We can survive bad news. We can't survive being lied to.",
      ],
      note: { from: "Yusuf (friend, mortgage)", text: "Payment ₺820 → ₺1,200 in a year. Cut everything. Cancelled the kids' swimming. Asked me to be honest tomorrow. 'We can survive bad news. We can't survive being lied to.'" }
    },
    elder: {
      name: "Older man on the bench", color: C.blue,
      beats: [
        "Used to be you could buy a flat on one wage. My grandson works two jobs and rents a room. Same city, same currency, different country.",
        "I worked thirty-eight years. Saved every month. Paid off my flat at fifty-two. The system worked because the maths worked.",
        "Now my pension interest is half what it used to be. I'm not poor — but my niece in Keldra is. She can't make her loan repayments and her landlord raised her rent by twenty per cent.",
        "Whatever you do tomorrow, young one — make the rules work again. The maths has to add up. For everyone.",
      ],
      note: { from: "Older man · pensioner", text: "Worked 38 years. Paid off flat at 52. Pension interest halved. Niece in Keldra can't pay loans, rent up 20%. 'Make the rules work again. The maths has to add up.'" }
    },
    kids: {
      name: "Two students", color: C.rose,
      beats: [
        "Yo, you're the new finance guy yeah? Bro. Rent ate my whole student loan. Like, all of it.",
        "I'm eating tinned beans till May. Mate's been buying me lunches. I'm too embarrassed to call my mum.",
        "Everyone says we just need to wait. Wait for what? Wait till we're sixty?",
        "If you can do anything tomorrow that means we can stop being scared of our landlord... that'd be nice. Yeah. Nice would be nice.",
      ],
      note: { from: "Two students", text: "Rent ate the whole student loan. Tinned beans till May. Too embarrassed to call mum. 'If you can do anything that means we stop being scared of our landlord, that'd be nice.'" }
    },
    protester: {
      name: "Protester", color: C.red,
      beats: [
        "Hey. You. You're going in there tomorrow, aren't you? I saw your photo in the paper.",
        "My mum's seventy-three. She turns the heating off when I'm not visiting because she's worried about the bills. She tells me to wear a jumper instead.",
        "Her rent went up nine per cent last quarter. Her pension went up two. Tell me how that maths works.",
        "I'll be here tomorrow. Whatever you do. Just remember — somebody's mum is in every spreadsheet you look at. Don't forget. Please. Please don't forget.",
      ],
      note: { from: "Protester near the Reserve", text: "Mum is 73. Turns heating off so I don't worry. Rent up 9%, pension up 2%. 'Somebody's mum is in every spreadsheet.' She'll be here tomorrow." }
    },
    vendor: {
      name: "Street vendor", color: C.purple,
      beats: [
        "Half-price chargers. Cash only. You buy now, you save twenty.",
        "Heard you're going up there tomorrow. The tower. Good luck with that, mate. Keep your wallet on the inside of your jacket.",
      ],
      note: { from: "Street vendor", text: "Cash only mate. Wished me luck. Told me to keep my wallet on the inside of my jacket. Wisdom of the streets." }
    },
    jogger: {
      name: "Jogger", color: C.green,
      beats: [
        "Morning! Beautiful day. I run this loop every morning. Cheapest therapy I know.",
        "Don't get me wrong, I read the papers. But for forty minutes a day I just... breathe. You should try it. Tomorrow, especially. Big day ahead, I hear.",
      ],
      note: { from: "Morning jogger", text: "Runs the loop daily. 'Cheapest therapy I know.' Recommended I try it before tomorrow." }
    },
    trader: {
      name: "Trader", color: C.gold,
      beats: [
        "First day at the Reserve tomorrow, eh? I saw the press release.",
        "Word of advice. Whatever rate you set, half the screens up there will be screaming about how wrong you got it by lunch. The other half will be scrolling Instagram.",
        "Wear it lightly. The markets always recover. The people sometimes don't. Choose carefully which one you're more worried about.",
      ],
      note: { from: "Trader on his lunch break", text: "Half the screens scream you got it wrong, half scroll Instagram. 'Markets recover, people sometimes don't. Choose carefully which one you're more worried about.'" }
    },
  };

  // DAY 2 (impact) — single-beat reactions reflecting rate decision
  const day2 = {
    halim: { name: "Mr Halim", color: C.rose,
      text: hike ? "Adam's mortgage went up. He's looking at lodgers. But you know what — better the truth than the slow drip. My pension's worth more this month, first time in years. Mixed feelings, dear. Mixed feelings." : cut ? "Adam's mortgage came down — relief on his face I haven't seen in months. My pension interest dropped though. That's the thing isn't it — somebody loses." : "Steady. I'll take steady. Adam can plan. I can plan. Boring is a gift at my age.",
      note: { from: "Mr Halim · after", text: hike ? "Adam looking at lodgers. Pension worth more. Mixed feelings." : cut ? "Adam's relief visible. Halim's pension interest dropped. 'Somebody loses.'" : "Boring is a gift at his age. He'll take steady." }
    },
    yusuf: { name: "Yusuf", color: C.coral,
      text: hike ? "Mate. Mate. Payment up another two hundred. We're putting the flat on the market next week. I'm not angry at you. I think. I haven't decided." : cut ? "MATE. Payment came down ₺140. First good news in eighteen months. Drinks tomorrow on me. Sara's actually smiled." : "Held. I can keep planning. The cancellation list stays cancelled but at least it's not getting longer. Thank you.",
      note: { from: "Yusuf · after", text: hike ? "Selling the flat. 'I haven't decided if I'm angry.'" : cut ? "Down ₺140. Sara smiled. Drinks on him tomorrow." : "Can keep planning. Cancellation list stays cancelled." }
    },
    elder: { name: "Older man", color: C.blue,
      text: hike ? "Discipline. Good. My pension interest's up for the first time in a decade. Don't apologise for doing the job. The system has to mean something." : cut ? "You cut. At a time like this. My savings interest has halved overnight. My niece's loan is no easier — banks won't pass it on for months. Worst of both worlds." : "Hold. Wait. Watch. My father's way. Sensible.",
      note: { from: "Older man · after", text: hike ? "Pension interest up first time in a decade. 'Don't apologise for doing the job.'" : cut ? "Savings halved. Niece's loan no easier. 'Worst of both worlds.'" : "Father's way. Sensible." }
    },
    kids: { name: "Students", color: C.rose,
      text: hike ? "Bro. Bro. Landlord's already said rent's going up next month because his mortgage went up. So thanks for that. Beans till the END of May now." : cut ? "Wait — does this mean rents go down? Eventually? Maybe? It's been a year of just maybe. We'll see." : "Bro. Nothing changed. As predicted. Cool. Beans forever then.",
      note: { from: "Students · after", text: hike ? "Landlord raising rent next month because his mortgage rose. 'Beans till END of May now.'" : cut ? "'A year of just maybe. We'll see.'" : "Nothing changed. Beans forever." }
    },
    protester: { name: "Protester", color: C.red,
      text: hike ? "Eight hundred of us here yesterday. Mum can't afford heat AND rent now. You raised both at once. There's a name for that. I'll find it." : cut ? "You cut. Good. Now do the rest. Build housing. Tax wealth. Cap rents. This is one decision. There are seventeen more." : "Nothing. You did nothing. Mum still freezes. Rent still rises. There were a thousand of us this morning. There'll be two thousand by Friday.",
      note: { from: "Protester · after", text: hike ? "800 here yesterday. Mum can't afford heat AND rent. 'There's a name for that. I'll find it.'" : cut ? "'This is one decision. There are seventeen more.'" : "Nothing. 1000 today. 2000 by Friday." }
    },
    vendor: { name: "Street vendor", color: C.purple,
      text: "Heard you on the radio. Strong words. Strong words sell newspapers. Don't sell chargers. Cash only, mate.",
      note: { from: "Vendor · after", text: "Cash only. Some economies run beneath the rate." }
    },
    jogger: { name: "Jogger", color: C.green,
      text: "Saw the press conference. Held up well. Same loop tomorrow if you fancy it. Six AM. Not slowing down for you.",
      note: { from: "Jogger · after", text: "Six AM. Not slowing down." }
    },
    trader: { name: "Trader", color: C.gold,
      text: hike ? "Index down 4.1%. Quite the morning. I made money short, so don't feel bad. Welcome to the job." : cut ? "Currency wobble but conviction always prices in. You looked decisive. Markets respect that more than most things." : "Boring. I'll take it. Quiet days are good days for me.",
      note: { from: "Trader · after", text: hike ? "Index down 4.1%. He's short. The market eats either direction." : cut ? "Markets respect conviction." : "Quiet days are good days." }
    },
  };

  if (isImpactPhase) {
    const item = day2[npc.id] || day1[npc.id];
    if (!item) return null;
    return (
      <PanelShell title={item.name} sub="After the announcement" onClose={() => dispatch({ type: "CLOSE_PANEL" })} accent={item.color}>
        <div style={{ background: `${item.color}15`, padding: 10, borderLeft: `3px solid ${item.color}`, borderRadius: 4, marginBottom: 12, fontFamily: FONT_M, fontSize: 9.5, color: item.color, letterSpacing: "0.18em", fontWeight: 700 }}>
          POST-DECISION · YOUR CHOICE AT WORK
        </div>
        <div style={{ background: C.surface2, padding: 18, borderLeft: `3px solid ${item.color}`, borderRadius: 4, marginBottom: 16 }}>
          <div style={{ fontFamily: FONT_D, fontSize: 16.5, color: C.ink, lineHeight: 1.55, fontStyle: "italic" }}>"{item.text}"</div>
        </div>
        <button onClick={() => { dispatch({ type: "TALK_NPC", note: item.note, npcId: npc.id, isImpact: true }); dispatch({ type: "CLOSE_PANEL" }); }} style={{ width: "100%", background: C.ink, color: C.surface, border: "none", padding: "12px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", cursor: "pointer" }}>SAVE NOTE & MOVE ON →</button>
      </PanelShell>
    );
  }

  // Day 1 multi-beat — RENDERED AS CINEMATIC SCENE
  const item = day1[npc.id];
  if (!item) return null;
  const isLast = step >= item.beats.length - 1;

  // Per-NPC environmental backdrop
  const backdrops = {
    yusuf: <YusufBackdrop step={step} />,
    halim: <HalimBackdrop step={step} />,
    elder: <ElderBackdrop step={step} />,
    protester: <ProtesterBackdrop step={step} />,
    kids: <KidsBackdrop step={step} />,
    vendor: <VendorBackdrop step={step} />,
    jogger: <JoggerBackdrop step={step} />,
    trader: <TraderBackdrop step={step} />,
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#040714", zIndex: 40, display: "flex", flexDirection: "column" }}>
      {/* Letterbox top */}
      <div style={{ background: "#000", height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: item.color, letterSpacing: "0.32em", fontWeight: 800 }}>● TALKING WITH {item.name.toUpperCase()}</div>
        </div>
        <button onClick={() => dispatch({ type: "CLOSE_PANEL" })} style={{ background: "transparent", color: "#fff", border: `1px solid rgba(255,255,255,0.3)`, padding: "4px 12px", fontFamily: FONT_M, fontSize: 9, letterSpacing: "0.18em", cursor: "pointer", borderRadius: 2 }}>× WALK AWAY</button>
      </div>

      {/* Scene */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {backdrops[npc.id] || <DefaultBackdrop color={item.color} />}

        {/* Floating dust motes */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <circle key={i} cx={(i * 137) % 1600} cy={50 + (i * 89) % 400} r="0.7" fill="#fff8ee" opacity="0.5">
              <animate attributeName="cy" values={`${50 + (i * 89) % 400};${70 + (i * 89) % 400};${50 + (i * 89) % 400}`} dur={`${4 + (i % 5)}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>

        {/* Dialogue overlay — bottom anchored */}
        <div key={step} className="popupIn" style={{
          position: "absolute", bottom: 86, left: "50%", transform: "translateX(-50%)",
          width: "min(900px, 90%)", background: "rgba(8,8,16,0.95)",
          borderTop: `3px solid ${item.color}`, borderRadius: 4, padding: "22px 32px",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.7)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: item.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_D, fontWeight: 800, fontSize: 22 }}>{item.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT_D, fontSize: 20, color: C.surface, fontWeight: 800 }}>{item.name}</div>
              <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                {item.beats.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, background: i <= step ? item.color : "rgba(255,255,255,0.15)", borderRadius: 2, transition: "background 0.2s" }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.textCream, lineHeight: 1.4, fontWeight: 500, fontStyle: "italic" }}>"{item.beats[step]}"</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: "#000", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textCreamDim, letterSpacing: "0.22em" }}>{step + 1} / {item.beats.length}</div>
        {!isLast ? (
          <button onClick={() => setStep(step + 1)} style={{ background: item.color, color: "#fff", border: "none", padding: "12px 30px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>CONTINUE →</button>
        ) : (
          <button onClick={() => { dispatch({ type: "TALK_NPC", note: item.note, npcId: npc.id }); dispatch({ type: "CLOSE_PANEL" }); }} style={{ background: C.coral, color: "#fff", border: "none", padding: "12px 30px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>SAVE TO NOTEBOOK →</button>
        )}
      </div>
    </div>
  );
}

// ─── PER-NPC BACKDROPS ──────────────────────────────────────
function YusufBackdrop({ step }) {
  // Living room with budget pie chart that changes per beat
  const slices = [
    { label: "MORTGAGE", value: 48, color: C.coral },
    { label: "FOOD", value: 14, color: C.gold },
    { label: "BILLS", value: 12, color: C.teal },
    { label: "KIDS", value: step >= 2 ? 6 : 11, color: C.purple, cut: step >= 2 },
    { label: "TRANSPORT", value: 8, color: C.blue },
    { label: "GYM", value: step >= 2 ? 0 : 4, color: C.rose, cut: step >= 2 },
    { label: "SAVING", value: step >= 1 ? 0 : 3, color: C.green, cut: step >= 1 },
  ].filter(s => s.value > 0);
  const total = slices.reduce((a, b) => a + b.value, 0);
  let acc = 0;
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="livingRoom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1f3a" />
          <stop offset="60%" stopColor="#1a1224" />
          <stop offset="100%" stopColor="#0a0814" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#livingRoom)" />
      {/* Wall pattern */}
      {[200, 500, 800, 1100, 1400].map((x) => (
        <rect key={x} x={x} y="0" width="2" height="540" fill="#3a2848" opacity="0.3" />
      ))}
      {/* Floor line */}
      <rect x="0" y="540" width="1600" height="160" fill="#1a0e14" />
      {/* Window with light */}
      <rect x="60" y="80" width="200" height="280" fill="#5a8aa8" opacity="0.5" />
      <rect x="60" y="80" width="200" height="280" fill="none" stroke="#3a2848" strokeWidth="6" />
      <line x1="160" y1="80" x2="160" y2="360" stroke="#3a2848" strokeWidth="4" />
      <line x1="60" y1="220" x2="260" y2="220" stroke="#3a2848" strokeWidth="4" />
      {/* Kitchen table */}
      <rect x="200" y="500" width="500" height="14" fill="#5a3018" />
      <rect x="220" y="514" width="6" height="40" fill="#3a1808" />
      <rect x="674" y="514" width="6" height="40" fill="#3a1808" />
      {/* Papers + calculator on table */}
      <rect x="250" y="470" width="80" height="50" fill="#fff8ee" transform="rotate(-4 290 495)" />
      <rect x="360" y="475" width="60" height="40" fill="#1a1224" transform="rotate(3 390 495)" />
      <rect x="440" y="478" width="90" height="44" fill="#fff8ee" transform="rotate(-2 485 500)" />

      {/* Yusuf and Sara sitting at table */}
      <g transform="translate(310, 460)">
        {/* Yusuf */}
        <rect x="-14" y="0" width="28" height="40" fill={C.coral} />
        <ellipse cx="0" cy="-14" rx="13" ry="15" fill="#b88660" />
        <path d="M -11 -18 Q -10 -28 0 -29 Q 10 -28 11 -18 L 10 -10 Q 6 -12 0 -12 Q -6 -12 -10 -10 Z" fill="#3a2418" />
        <circle cx="-4" cy="-14" r="3" fill="#3a2418" />
        <circle cx="4" cy="-14" r="3" fill="#3a2418" />
        <ellipse cx="-4" cy="-14" rx="1.2" ry="1.5" fill="#0a0408" />
        <ellipse cx="4" cy="-14" rx="1.2" ry="1.5" fill="#0a0408" />
        <path d="M -3 -8 Q 0 -7 3 -8" stroke="#3a1808" strokeWidth="0.8" fill="none" />
      </g>
      <g transform="translate(620, 460)">
        {/* Sara */}
        <rect x="-14" y="0" width="28" height="40" fill={C.purple} />
        <ellipse cx="0" cy="-14" rx="13" ry="15" fill="#c4956a" />
        <path d="M -13 -16 Q -14 -26 0 -27 Q 14 -26 13 -16 L 14 -4 Q 8 -10 0 -10 Q -8 -10 -14 -4 Z" fill="#1a0c08" />
        <ellipse cx="-4" cy="-14" rx="1.2" ry="1.5" fill="#0a0408" />
        <ellipse cx="4" cy="-14" rx="1.2" ry="1.5" fill="#0a0408" />
        <path d="M -3 -8 Q 0 -7 3 -8" stroke="#3a1808" strokeWidth="0.8" fill="none" />
      </g>

      {/* ── INTERACTIVE PIE CHART ── */}
      <g transform="translate(1200, 260)">
        <text x="0" y="-150" textAnchor="middle" fill={C.gold} fontFamily={FONT_M} fontSize="14" fontWeight="800" letterSpacing="0.22em">YUSUF'S BUDGET</text>
        <text x="0" y="-126" textAnchor="middle" fill="#fff" fontFamily={FONT_H} fontSize="20" fontWeight="500">{step === 0 ? "₺3,200/mo · before" : step === 1 ? "savings gone" : step >= 2 ? "kids' swimming cancelled" : "what now?"}</text>
        {slices.map((s, i) => {
          const start = (acc / total) * 360;
          acc += s.value;
          const end = (acc / total) * 360;
          const a1 = (start - 90) * Math.PI / 180;
          const a2 = (end - 90) * Math.PI / 180;
          const x1 = Math.cos(a1) * 100;
          const y1 = Math.sin(a1) * 100;
          const x2 = Math.cos(a2) * 100;
          const y2 = Math.sin(a2) * 100;
          const large = (end - start) > 180 ? 1 : 0;
          // Outer label
          const midA = ((start + end) / 2 - 90) * Math.PI / 180;
          const lx = Math.cos(midA) * 125;
          const ly = Math.sin(midA) * 125;
          return (
            <g key={s.label}>
              <path d={`M 0 0 L ${x1} ${y1} A 100 100 0 ${large} 1 ${x2} ${y2} Z`} fill={s.color} stroke="#0a0408" strokeWidth="2" />
              <text x={lx} y={ly} textAnchor={lx > 0 ? "start" : "end"} fill="#fff" fontFamily={FONT_M} fontSize="9" fontWeight="800" letterSpacing="0.1em">{s.label} · {s.value}%</text>
            </g>
          );
        })}
        {/* Centre */}
        <circle r="32" fill="#0a0408" stroke={C.gold} strokeWidth="2" />
        <text y="-2" textAnchor="middle" fill={C.gold} fontFamily={FONT_M} fontSize="7" fontWeight="800" letterSpacing="0.15em">RATE</text>
        <text y="10" textAnchor="middle" fill="#fff" fontFamily={FONT_D} fontSize="14" fontWeight="800">{step === 0 ? "5.2%" : step === 1 ? "6.4%" : "6.4%"}</text>
        {/* Cut indicator */}
        {step >= 1 && (
          <g transform="translate(0, 150)">
            <rect x="-100" y="-12" width="200" height="24" fill={C.coral} />
            <text x="0" y="4" textAnchor="middle" fill="#fff" fontFamily={FONT_M} fontSize="10" fontWeight="800" letterSpacing="0.22em">CUT FROM THE PIE</text>
          </g>
        )}
      </g>
    </svg>
  );
}

function HalimBackdrop({ step }) {
  // Memories scattered as polaroids — they fade in one by one
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="hallwaySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4470" />
          <stop offset="100%" stopColor="#1a2454" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#hallwaySky)" />
      {/* Tower block in distance */}
      <rect x="200" y="200" width="180" height="340" fill="#1a1432" />
      {Array.from({ length: 12 }).map((_, r) => Array.from({ length: 4 }).map((_, c) => {
        const lit = ((r + c) * 7 + 3) % 5 < 3;
        return <rect key={`${r}-${c}`} x={215 + c * 38} y={215 + r * 26} width="20" height="14" fill={lit ? C.gold : "#0a0408"} opacity={lit ? 0.85 : 1} />;
      }))}
      {/* Bench in foreground */}
      <rect x="400" y="580" width="220" height="14" fill="#5a3018" />
      <rect x="400" y="540" width="220" height="8" fill="#5a3018" />
      <rect x="410" y="594" width="8" height="60" fill="#3a1808" />
      <rect x="602" y="594" width="8" height="60" fill="#3a1808" />

      {/* Halim sitting */}
      <g transform="translate(510, 530)">
        <rect x="-16" y="0" width="32" height="44" fill={C.bFlat} />
        <ellipse cx="0" cy="-18" rx="14" ry="17" fill="#c4956a" />
        <path d="M -10 -22 Q -10 -30 0 -31 Q 10 -30 10 -22" fill="#e8e0d8" />
        <ellipse cx="-9" cy="-18" rx="3" ry="4" fill="#e8e0d8" />
        <ellipse cx="9" cy="-18" rx="3" ry="4" fill="#e8e0d8" />
        <ellipse cx="-4" cy="-16" rx="1.5" ry="1.8" fill="#0a0408" />
        <ellipse cx="4" cy="-16" rx="1.5" ry="1.8" fill="#0a0408" />
        <path d="M -3 -10 Q 0 -9 3 -10" stroke="#3a1808" strokeWidth="0.8" fill="none" />
        <line x1="-20" y1="20" x2="-22" y2="60" stroke="#3a2418" strokeWidth="3" />
      </g>

      {/* MEMORY POLAROIDS — appearing as he talks */}
      {[
        { x: 850, y: 100, rot: -8, label: "1984 · MOVED IN", desc: "He was 37", color: "#5a3a18" },
        { x: 1100, y: 150, rot: 6, label: "1996 · WEDDING", desc: "Adam's parents", color: "#3a1820" },
        { x: 950, y: 350, rot: -3, label: "2014 · ADAM 16", desc: "First job", color: "#4a3a50" },
        { x: 1200, y: 380, rot: 9, label: "2024 · 6% MORTGAGE", desc: "First flat", color: "#5a2438" },
      ].map((p, i) => {
        if (i > step) return null;
        return (
          <g key={i} className="popupIn" transform={`translate(${p.x}, ${p.y}) rotate(${p.rot})`}>
            <rect x="-80" y="-80" width="160" height="160" fill="#fff8ee" stroke="#c9b178" strokeWidth="2" />
            <rect x="-72" y="-72" width="144" height="100" fill={p.color} />
            <ellipse cx="0" cy="-22" rx="36" ry="44" fill="#c4956a" opacity="0.5" />
            <path d="M -36 -50 Q -36 -68 0 -70 Q 36 -68 36 -50" fill="#1a0c08" opacity="0.5" />
            <text x="0" y="50" textAnchor="middle" fontFamily={FONT_H} fontSize="14" fill="#1a0c08" fontWeight="500">{p.label}</text>
            <text x="0" y="68" textAnchor="middle" fontFamily={FONT_M} fontSize="8" letterSpacing="0.18em" fill="#7a6048" fontWeight="700">{p.desc}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ElderBackdrop({ step }) {
  // Park bench scene
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="parkSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4470" />
          <stop offset="100%" stopColor="#7a6480" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#parkSky)" />
      {/* Sun */}
      <circle cx="1400" cy="180" r="60" fill="#fff8ee" opacity="0.9" />
      <circle cx="1400" cy="180" r="100" fill="#fff8ee" opacity="0.15" />
      {/* Distant city */}
      <path d="M 0 460 L 80 440 L 80 400 L 160 400 L 160 460 L 220 460 L 220 360 L 300 360 L 300 460 L 1600 460 L 1600 540 L 0 540 Z" fill="#1a2454" opacity="0.8" />
      {/* Grass */}
      <rect x="0" y="540" width="1600" height="160" fill="#3d8a5c" opacity="0.5" />
      <rect x="0" y="540" width="1600" height="160" fill="#1a4030" opacity="0.5" />
      {/* Tree */}
      <rect x="280" y="380" width="20" height="200" fill="#3a2418" />
      <circle cx="290" cy="370" r="80" fill="#3d8a5c" />
      <circle cx="270" cy="360" r="60" fill="#4d9a6c" />
      <circle cx="310" cy="370" r="65" fill="#2d7a4c" />
      {/* Bench */}
      <rect x="500" y="570" width="280" height="16" fill="#5a3018" />
      <rect x="500" y="530" width="280" height="8" fill="#5a3018" />
      <rect x="514" y="586" width="10" height="60" fill="#3a1808" />
      <rect x="758" y="586" width="10" height="60" fill="#3a1808" />
      {/* Elder sitting */}
      <g transform="translate(640, 510)">
        <rect x="-18" y="0" width="36" height="46" fill={C.blue} />
        <ellipse cx="0" cy="-20" rx="14" ry="17" fill="#d4b090" />
        <path d="M -10 -24 Q -10 -32 0 -33 Q 10 -32 10 -24" fill="#f0e8d8" />
        {/* Glasses */}
        <circle cx="-5" cy="-19" r="3" fill="none" stroke="#0a0408" strokeWidth="0.8" />
        <circle cx="5" cy="-19" r="3" fill="none" stroke="#0a0408" strokeWidth="0.8" />
        <line x1="-2" y1="-19" x2="2" y2="-19" stroke="#0a0408" strokeWidth="0.6" />
        <path d="M -3 -11 Q 0 -10 3 -11" stroke="#3a1808" strokeWidth="0.8" fill="none" />
        {/* Newspaper in lap */}
        <rect x="-22" y="20" width="44" height="22" fill="#fff8ee" transform="rotate(-5 0 30)" />
      </g>
    </svg>
  );
}

function ProtesterBackdrop({ step }) {
  // Reserve gates with growing crowd
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width="1600" height="700" fill="#0a0f24" />
      <rect width="1600" height="700" fill={C.coral} opacity="0.08" />
      {/* Reserve facade */}
      <rect x="400" y="180" width="800" height="300" fill={C.gold} opacity="0.85" />
      <rect x="400" y="180" width="800" height="300" fill="#0a0f24" opacity="0.4" />
      {[440, 520, 600, 680, 760, 840, 920, 1000, 1080, 1160].map((x) => (
        <rect key={x} x={x - 8} y="200" width="16" height="280" fill="#0a0f24" opacity="0.6" />
      ))}
      <polygon points="380,180 1220,180 800,120" fill={C.goldBright} />
      <ellipse cx="800" cy="140" rx="60" ry="40" fill={C.gold} />
      {/* Gates */}
      <rect x="600" y="380" width="6" height="120" fill={C.gold} />
      <rect x="994" y="380" width="6" height="120" fill={C.gold} />
      {[620, 660, 700, 740, 780, 820, 860, 900, 940, 980].map((x) => (
        <rect key={x} x={x} y="400" width="2" height="100" fill={C.gold} opacity="0.7" />
      ))}
      {/* Ground */}
      <rect x="0" y="500" width="1600" height="200" fill="#1a0e14" />

      {/* Crowd — grows per beat */}
      {Array.from({ length: 20 + step * 15 }).map((_, i) => {
        const x = 100 + (i * 37) % 1400;
        const y = 540 + (i * 13) % 60;
        const c = [C.coral, C.red, "#6a2818", C.bMarket][i % 4];
        return (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <ellipse cx="0" cy="14" rx="10" ry="2" fill="#000" opacity="0.4" />
            <rect x="-8" y="-12" width="16" height="22" fill={c} />
            <ellipse cx="0" cy="-22" rx="9" ry="11" fill="#c4956a" />
            <path d="M -8 -28 Q -7 -33 0 -34 Q 7 -33 8 -28" fill="#1a0c08" />
            {i % 4 === 0 && (
              <g>
                <rect x="-1" y="-50" width="2" height="20" fill="#5a3018" />
                <rect x="-14" y="-62" width="28" height="14" fill="#fff8ee" />
                <text x="0" y="-52" textAnchor="middle" fontFamily="sans-serif" fontSize="5" fontWeight="800" fill="#0a0408">{["WE FEEL IT", "BE BRAVE", "WE SEE YOU", "FAIRNESS"][i % 4]}</text>
              </g>
            )}
          </g>
        );
      })}

      {/* Crowd count indicator */}
      <g transform="translate(100, 80)">
        <rect x="0" y="0" width="200" height="60" fill="rgba(255,248,238,0.95)" stroke={C.coral} strokeWidth="3" />
        <text x="100" y="22" textAnchor="middle" fill={C.coral} fontFamily={FONT_M} fontSize="11" fontWeight="800" letterSpacing="0.22em">CROWD COUNT</text>
        <text x="100" y="48" textAnchor="middle" fill={C.ink} fontFamily={FONT_D} fontSize="24" fontWeight="900">{(20 + step * 80).toLocaleString()} +</text>
      </g>
    </svg>
  );
}

function KidsBackdrop({ step }) {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width="1600" height="700" fill="#1a1432" />
      {/* Plaza tiles */}
      <rect x="0" y="500" width="1600" height="200" fill="#2a1f3a" />
      {[100, 300, 500, 700, 900, 1100, 1300, 1500].map((x) => (
        <line key={x} x1={x} y1="500" x2={x} y2="700" stroke="#1a1224" strokeWidth="2" />
      ))}
      {/* Streetlamp */}
      <rect x="200" y="200" width="6" height="320" fill="#1a0c08" />
      <circle cx="203" cy="200" r="14" fill={C.gold} />
      <circle cx="203" cy="200" r="40" fill={C.gold} opacity="0.2" />
      {/* Two students sitting on step */}
      <rect x="700" y="540" width="400" height="20" fill="#3a2848" />
      <g transform="translate(820, 510)">
        <rect x="-12" y="0" width="24" height="32" fill={C.rose} />
        <ellipse cx="0" cy="-14" rx="11" ry="13" fill="#a07050" />
        <path d="M -9 -18 Q -8 -25 0 -26 Q 8 -25 9 -18" fill="#2a1810" />
        <ellipse cx="-3" cy="-13" rx="1" ry="1.3" fill="#0a0408" />
        <ellipse cx="3" cy="-13" rx="1" ry="1.3" fill="#0a0408" />
        {/* Phone glow */}
        <rect x="-6" y="6" width="6" height="12" fill={C.teal} opacity="0.9" />
        <rect x="-7" y="5" width="8" height="14" fill="#1a0c08" />
        <rect x="-6" y="6" width="6" height="12" fill={C.teal} opacity="0.9" />
      </g>
      <g transform="translate(960, 510)">
        <rect x="-12" y="0" width="24" height="32" fill={C.purple} />
        <ellipse cx="0" cy="-14" rx="11" ry="13" fill="#c4956a" />
        <path d="M -9 -18 Q -8 -25 0 -26 Q 8 -25 9 -18 L 9 -10 Q 4 -12 0 -12 Q -4 -12 -9 -10 Z" fill="#1a0c08" />
        <ellipse cx="-3" cy="-13" rx="1" ry="1.3" fill="#0a0408" />
        <ellipse cx="3" cy="-13" rx="1" ry="1.3" fill="#0a0408" />
      </g>
      {/* Empty tin in foreground */}
      <g transform="translate(1100, 660)">
        <rect x="-14" y="-22" width="28" height="22" fill="#a8a08a" />
        <rect x="-14" y="-22" width="28" height="6" fill="#fff8ee" />
        <text x="0" y="-26" textAnchor="middle" fontFamily={FONT_M} fontSize="6" fontWeight="800" fill="#3a2418" letterSpacing="0.18em">BEANS</text>
      </g>
    </svg>
  );
}

function VendorBackdrop({ step }) {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width="1600" height="700" fill="#1a1432" />
      <rect x="0" y="540" width="1600" height="160" fill="#0a0814" />
      {/* Stall */}
      <rect x="500" y="380" width="600" height="20" fill={C.purple} />
      <rect x="500" y="400" width="600" height="180" fill="#1a0e08" />
      <rect x="510" y="420" width="580" height="140" fill="#2a1f3a" />
      <rect x="500" y="380" width="600" height="20" fill={C.purple} />
      {/* Wares */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={530 + i * 70} y="450" width="50" height="30" fill={["#1a0c08", "#3a2418", "#1a0c08", "#5a3a20"][i % 4]} stroke={C.gold} strokeWidth="1" />
      ))}
      {/* Vendor */}
      <g transform="translate(800, 360)">
        <rect x="-14" y="0" width="28" height="40" fill={C.purple} />
        <ellipse cx="0" cy="-14" rx="13" ry="15" fill="#8a5838" />
        <rect x="-11" y="-22" width="22" height="8" fill="#3a1f50" />
        <ellipse cx="0" cy="-21" rx="14" ry="3" fill="#3a1f50" />
        <ellipse cx="-4" cy="-12" rx="1.2" ry="1.5" fill="#0a0408" />
        <ellipse cx="4" cy="-12" rx="1.2" ry="1.5" fill="#0a0408" />
      </g>
      {/* Sign */}
      <rect x="540" y="320" width="200" height="40" fill="#fff8ee" />
      <text x="640" y="346" textAnchor="middle" fontFamily={FONT_H} fontSize="24" fill={C.coral} fontWeight="600">CASH ONLY</text>
    </svg>
  );
}

function JoggerBackdrop({ step }) {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="parkSkyJog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a5470" />
          <stop offset="100%" stopColor="#E891A2" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#parkSkyJog)" />
      <circle cx="1300" cy="200" r="80" fill="#fff8ee" opacity="0.9" />
      {/* Hills */}
      <path d="M 0 480 Q 400 420 800 450 Q 1200 410 1600 450 L 1600 700 L 0 700 Z" fill="#3d8a5c" />
      <path d="M 0 540 Q 400 500 800 520 Q 1200 490 1600 510 L 1600 700 L 0 700 Z" fill="#2a6d44" />
      {/* Path */}
      <path d="M 200 700 Q 600 600 1000 580 Q 1300 560 1600 540" stroke="#7a6840" strokeWidth="20" fill="none" />
      {/* Jogger mid-stride */}
      <g transform="translate(820, 580)">
        <rect x="-8" y="0" width="14" height="22" fill={C.green} />
        <rect x="-12" y="22" width="6" height="14" fill="#1a0e08" transform="rotate(20 -9 22)" />
        <rect x="4" y="22" width="6" height="14" fill="#1a0e08" transform="rotate(-15 7 22)" />
        <ellipse cx="0" cy="-12" rx="10" ry="11" fill="#a87049" />
        <path d="M -8 -14 Q -7 -23 0 -24 Q 7 -23 8 -14 L 8 -10 Q 4 -11 0 -11 Q -4 -11 -8 -10 Z" fill="#1a0c08" />
        <path d="M 4 -16 Q 9 -10 11 -2" stroke="#1a0c08" strokeWidth="2" fill="none" />
        {/* Headphones */}
        <path d="M -8 -22 Q 0 -28 8 -22" stroke="#0a0408" strokeWidth="2" fill="none" />
        <ellipse cx="-8" cy="-20" rx="2" ry="3" fill={C.coral} />
        <ellipse cx="8" cy="-20" rx="2" ry="3" fill={C.coral} />
      </g>
    </svg>
  );
}

function TraderBackdrop({ step }) {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width="1600" height="700" fill="#0a0e22" />
      {/* Glass building exterior */}
      <rect x="200" y="80" width="1200" height="540" fill="#1a2046" />
      {Array.from({ length: 18 }).map((_, r) => Array.from({ length: 24 }).map((_, c) => {
        const lit = ((r * c + r) * 11 + 7) % 13 < 8;
        return <rect key={`${r}-${c}`} x={220 + c * 48} y={90 + r * 28} width="36" height="20" fill={lit ? (((r + c) % 5 === 0) ? C.coral : C.gold) : "#0a0408"} opacity={lit ? 0.6 : 1} />;
      }))}
      {/* Ticker band */}
      <rect x="0" y="400" width="1600" height="40" fill="#000" />
      <rect x="0" y="400" width="1600" height="3" fill={C.gold} opacity="0.5" />
      <rect x="0" y="437" width="1600" height="3" fill={C.gold} opacity="0.5" />
      <text x="40" y="426" fill={C.teal} fontFamily={FONT_M} fontSize="14" fontWeight="800">ELR/USD 1.022 ▲ · MAIN IDX 1612 ▲ · GOLD 1986 ▲ · BANKS 158 ▲ · </text>
      <text x="940" y="426" fill={C.coral} fontFamily={FONT_M} fontSize="14" fontWeight="800">BRENT 84.6 ▼ · HOMES 248 ▼</text>
      {/* Trader on lunch */}
      <g transform="translate(800, 600)">
        <ellipse cx="0" cy="14" rx="20" ry="3" fill="#000" opacity="0.4" />
        <rect x="-14" y="-12" width="28" height="34" fill={C.gold} />
        <ellipse cx="0" cy="-22" rx="13" ry="15" fill="#c4956a" />
        <path d="M -10 -26 Q -10 -34 0 -35 Q 10 -34 10 -26" fill="#3a2418" />
        <ellipse cx="-4" cy="-22" rx="1.4" ry="1.7" fill="#0a0408" />
        <ellipse cx="4" cy="-22" rx="1.4" ry="1.7" fill="#0a0408" />
      </g>
    </svg>
  );
}

function DefaultBackdrop({ color }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 30%, ${color}22 0%, #0a0814 70%)` }} />
  );
}

// ─── POPUPS ─────────────────────────────────────────────────
function PressConference({ state, dispatch }) {
  const rate = state.interestRate;
  const hike = rate > 3.5;
  const cut = rate < 2.5;

  // CAMERA FLASHBULBS — random bursts from the press pit. Looks great on camera.
  const [flashes, setFlashes] = useState([]);
  useEffect(() => {
    const spawn = () => {
      const id = Math.random().toString(36).slice(2, 8);
      const x = 5 + Math.random() * 90; // 5-95% from left
      const y = 65 + Math.random() * 25; // bottom band
      setFlashes((f) => [...f, { id, x, y }]);
      setTimeout(() => setFlashes((f) => f.filter((p) => p.id !== id)), 400);
    };
    // initial burst — three quick flashes
    spawn();
    setTimeout(spawn, 250);
    setTimeout(spawn, 480);
    // then ongoing every 1.5-3s
    const iv = setInterval(spawn, 1800 + Math.random() * 1200);
    return () => clearInterval(iv);
  }, [state.pressStep]);

  // Press conference has phases: intro → questions → statement choice → reaction
  const pol = state.policy;
  const heavyQE = pol.qe > 1.5;
  const heavyQT = pol.qe < -1.5;
  const tightMacroPru = pol.macroPru > 0.5;
  const guidanceLabel = state.guidance === "hawk" ? "'higher for longer'" : state.guidance === "dove" ? "'we may have done enough'" : "'data-dependent'";
  const balanceSheetMove = heavyQE ? `restarted QE — buying ${Math.round(15 + pol.qe * 8)}bn over six months` : heavyQT ? "accelerated QT — selling assets faster than expected" : "held the balance sheet steady";

  const QUESTIONS = [
    { who: "Sasha Voss, Varena Times", color: C.purple, q: "Governor, you've just " + (hike ? "raised rates to " + pct(rate) + ". Many will struggle with mortgages. What's your message to them?" : cut ? "cut rates to " + pct(rate) + ". Critics say you're being soft on inflation. Your response?" : "held rates at " + pct(rate) + ". Inflation is at " + pct(state.inflation) + " and you did nothing. People needed help. Why didn't they get any?") },
    { who: "Marcus Ode, financial wire", color: C.coral, q: "You also " + balanceSheetMove + ". " + (heavyQE ? "Many are calling this a return to easy money. Is the inflation fight over?" : heavyQT ? "Markets are wobbling on the pace. Are you trying to break something?" : "Some say the balance sheet should be doing more work. Why so passive?") },
    { who: "Layla Daud, public broadcaster", color: C.teal, q: tightMacroPru ? "You've also tightened macroprudential rules. First-time buyers will struggle even more now. What do you say to them?" : "Your forward guidance was " + guidanceLabel + ". People are listening for one thing — when will it get better?" },
    { who: "Sasha Voss, Varena Times", color: C.purple, q: "Last question. Just for the headlines. In one sentence — what do you say to the country tonight?" },
  ];

  const STATEMENTS = hike ? [
    { id: "discipline", label: "Discipline. We had no choice.", reaction: { public: -8, markets: 5, press: 0, story: "Public mood: cold. Markets: respectful. Tomorrow's headline calls it 'principled but lonely'." } },
    { id: "empathy", label: "I know this will hurt. I am sorry. But the alternative was worse.", reaction: { public: 5, markets: -3, press: 8, story: "Public mood: warmed. Markets: slightly uneasy you flinched. Press call it 'a Governor with a soul'." } },
    { id: "blame", label: "External shocks left us no choice. This is not our fault.", reaction: { public: -12, markets: -5, press: -10, story: "Public mood: angry — feels evasive. Markets: spooked you're not in control. Press call it 'finger-pointing'." } },
  ] : cut ? [
    { id: "relief", label: "Today is relief. Borrowers, breathe.", reaction: { public: 10, markets: 0, press: 5, story: "Public mood: relieved. Markets: cautious. Press call it 'a populist gift'." } },
    { id: "vigilant", label: "We cut, but we're watching inflation like hawks.", reaction: { public: 0, markets: 5, press: 8, story: "Public mood: steady. Markets: confident in your judgment. Press call it 'measured and serious'." } },
    { id: "aggressive", label: "Growth matters more than the price index right now.", reaction: { public: 5, markets: -10, press: -5, story: "Public mood: split. Markets: panic, currency wobbles. Press call it 'a gamble'." } },
  ] : [
    { id: "steady", label: "Stability is what people need. We will not panic with them.", reaction: { public: -5, markets: 5, press: 0, story: "Public mood: cold. Felt scolded. Markets: appreciated the calm. Press split — half called it 'statesmanlike', half called it 'condescending'." } },
    { id: "patient", label: "We are watching every line of data. We will act when the moment is right.", reaction: { public: -3, markets: 8, press: 6, story: "Public mood: skeptical. Markets: trust the process. Press call it 'the cleanest defence of a hold this year'." } },
    { id: "weak", label: "Honestly, the data is mixed. We needed more time.", reaction: { public: -15, markets: -8, press: -12, story: "Public mood: betrayed. People are paying their rent in advance because they think prices will keep rising. Markets: smell weakness. Press call it 'the most honest thing a Governor has ever said — and the most damning'." } },
  ];

  if (state.pressStep < QUESTIONS.length) {
    const cur = QUESTIONS[state.pressStep];
    return (
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,5,20,0.92)", zIndex: 38, display: "flex", flexDirection: "column", padding: 30, justifyContent: "center" }}>
        {/* CAMERA FLASHBULBS */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
          {flashes.map((f) => (
            <div key={f.id} style={{
              position: "absolute", left: `${f.x}%`, top: `${f.y}%`,
              width: 80, height: 80, borderRadius: "50%",
              background: `radial-gradient(circle, #fff 0%, ${C.gold}66 30%, transparent 65%)`,
              transform: "translate(-50%, -50%)",
              animation: "spawnDust 0.4s ease-out forwards",
              filter: "blur(2px)",
            }} />
          ))}
        </div>
        {/* PULSE-INSPIRED: live approval meter + mini-network in corners */}
        <div style={{ position: "absolute", top: 24, right: 24, width: 240 }}>
          <LiveApprovalMeter value={state.publicTrust ?? 50} label="LIVE · PUBLIC APPROVAL" />
        </div>
        <div style={{ position: "absolute", top: 24, left: 24, width: 260 }}>
          <EconomyVitals state={state} compact />
        </div>
        <div style={{ textAlign: "center", marginBottom: 24, marginTop: 80 }}>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.3em", fontWeight: 700 }}>RESERVE LOBBY · {state.pressStep + 1} OF {QUESTIONS.length + 1}</div>
          <div style={{ fontFamily: FONT_H, fontSize: 38, color: C.surface, fontWeight: 600, marginTop: 4 }}>The press conference</div>
          <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.textCreamDim, letterSpacing: "0.15em", marginTop: 4 }}>Cameras. Flashbulbs. Notebooks. Twelve voices shouting your name.</div>
        </div>
        <div style={{ maxWidth: 760, width: "100%", margin: "0 auto" }}>
          <div className="popupIn" style={{ background: C.surface, border: `3px solid ${cur.color}`, borderRadius: 8, padding: "28px 34px", boxShadow: `0 20px 60px ${cur.color}40` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: cur.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_D, fontWeight: 800, fontSize: 22 }}>{cur.who[0]}</div>
              <div>
                <div style={{ fontFamily: FONT_D, fontSize: 18, color: C.ink, fontWeight: 800 }}>{cur.who}</div>
                <div style={{ fontFamily: FONT_M, fontSize: 10, color: cur.color, letterSpacing: "0.22em", fontWeight: 700 }}>JOURNALIST</div>
              </div>
            </div>
            <div style={{ fontFamily: FONT_D, fontSize: 20, color: C.ink, lineHeight: 1.45, fontStyle: "italic" }}>"{cur.q}"</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
            <button onClick={() => dispatch({ type: "PRESS_NEXT" })} style={{ background: C.coral, color: "#fff", border: "none", padding: "12px 30px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 4 }}>
              {state.pressStep < QUESTIONS.length - 1 ? "NEXT QUESTION →" : "RESPOND TO ALL →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Statement choice
  if (!state.pressStatement) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,5,20,0.92)", zIndex: 38, display: "flex", flexDirection: "column", padding: 30, justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 24, right: 24, width: 240 }}>
          <LiveApprovalMeter value={state.publicTrust ?? 50} label="LIVE · PUBLIC APPROVAL" />
        </div>
        <div style={{ textAlign: "center", marginBottom: 24, marginTop: 60 }}>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.3em", fontWeight: 700 }}>YOUR STATEMENT</div>
          <div style={{ fontFamily: FONT_H, fontSize: 36, color: C.surface, fontWeight: 600, marginTop: 4 }}>What do you say?</div>
          <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.textCreamDim, letterSpacing: "0.15em", marginTop: 4 }}>Twelve cameras. One sentence. Pick carefully.</div>
        </div>
        <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {STATEMENTS.map((st, i) => {
            // Tone color based on how the statement reads
            const tone = st.reaction.public > 0 ? C.teal : st.reaction.public < -10 ? C.red : C.gold;
            const toneLabel = st.reaction.public > 5 ? "EMPATHETIC" : st.reaction.public < -10 ? "RISKY" : st.reaction.public < 0 ? "TOUGH" : "MEASURED";
            return (
              <button key={st.id} onClick={() => dispatch({ type: "PRESS_CHOOSE", choice: st })} className="popupIn" style={{
                background: C.surface, border: `2px solid ${C.borderCream}`, borderLeft: `5px solid ${tone}`,
                padding: "18px 26px",
                cursor: "pointer", borderRadius: 4, transition: "all 0.15s",
                textAlign: "left", position: "relative",
                animation: `popupIn 0.4s ${i * 0.08}s both`,
              }} onMouseOver={(e) => { e.currentTarget.style.borderColor = tone; e.currentTarget.style.borderLeftColor = tone; e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = `0 10px 30px ${tone}33`; }}
                 onMouseOut={(e) => { e.currentTarget.style.borderColor = C.borderCream; e.currentTarget.style.borderLeftColor = tone; e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: tone, letterSpacing: "0.28em", fontWeight: 800 }}>● OPTION {i + 1} · {toneLabel}</div>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.18em", fontWeight: 700 }}>EST. APPROVAL {st.reaction.public > 0 ? "+" : ""}{st.reaction.public}</div>
                </div>
                <div style={{ fontFamily: FONT_D, fontSize: 19, fontWeight: 700, color: C.ink, fontStyle: "italic", lineHeight: 1.35 }}>"{st.label}"</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Reaction
  const r = state.pressStatement.reaction;
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(10,5,20,0.94)", zIndex: 38, display: "flex", flexDirection: "column", padding: 30, justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 24, right: 24, width: 240 }}>
        <LiveApprovalMeter value={Math.max(0, Math.min(100, (state.publicTrust ?? 50) + r.public))} label="POST-STATEMENT" delta={r.public} />
      </div>
      <div style={{ textAlign: "center", marginBottom: 22, marginTop: 60 }}>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.3em", fontWeight: 700 }}>THE REACTION</div>
        <div style={{ fontFamily: FONT_H, fontSize: 36, color: C.surface, fontWeight: 600, marginTop: 4 }}>How it landed</div>
      </div>
      <div style={{ maxWidth: 720, width: "100%", margin: "0 auto" }}>
        <div className="popupIn" style={{ background: C.surface, border: `3px solid ${C.coral}`, borderRadius: 8, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.coral, letterSpacing: "0.25em", fontWeight: 700, marginBottom: 6 }}>YOU SAID</div>
          <div style={{ fontFamily: FONT_D, fontSize: 19, color: C.ink, fontStyle: "italic", fontWeight: 500, marginBottom: 18, lineHeight: 1.45 }}>"{state.pressStatement.label}"</div>
          <div style={{ background: C.surface2, padding: 16, borderRadius: 4, borderLeft: `3px solid ${C.coral}`, marginBottom: 14 }}>
            <div style={{ fontFamily: FONT_D, fontSize: 15, color: C.ink, lineHeight: 1.5, fontWeight: 500 }}>{r.story}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <ReactionBar label="PUBLIC" value={r.public} />
            <ReactionBar label="MARKETS" value={r.markets} />
            <ReactionBar label="PRESS" value={r.press} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
          <button onClick={() => dispatch({ type: "PRESS_END" })} style={{ background: C.coral, color: "#fff", border: "none", padding: "12px 30px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 4 }}>
            SEE THE RIPPLE →
          </button>
        </div>
      </div>
    </div>
  );
}

function ReactionBar({ label, value }) {
  const positive = value >= 0;
  const color = value > 5 ? C.green : value > 0 ? C.teal : value > -5 ? C.gold : C.coral;
  return (
    <div style={{ background: C.surface, padding: 10, borderRadius: 4, border: `1.5px solid ${C.borderCream}` }}>
      <div style={{ fontSize: 9, fontFamily: FONT_M, color: C.textMuted, letterSpacing: "0.22em", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: FONT_D, fontSize: 22, color, fontWeight: 800, marginTop: 2 }}>{positive ? "+" : ""}{value}</div>
    </div>
  );
}

// ─── NEWSROOM: PRINTING PRESS ───────────────────────────────
// ─── RECOVERY: emergency statement after a disaster ────────
function RecoveryStatement({ state, dispatch }) {
  const a1 = state.policy?.actOne;
  const isCutHard = a1 === "cut-hard";
  const isRaiseHard = a1 === "raise-hard";
  const [picked, setPicked] = useState(null);

  // Three statements: apologise / double-down / explain
  const statements = [
    { id: "apologise", color: C.teal, label: "APOLOGISE AND COURSE-CORRECT",
      preview: "Acknowledge harm. Hint at action. Settle markets.",
      line: isCutHard ? "We hear the country. The cut was the wrong call given the inflation print. The committee will meet again in two weeks to consider a partial reversal. We are not ideological — we are responsive." :
            isRaiseHard ? "We hear the pain. The hike was necessary but the pace was too aggressive. We will not raise further this year. We will support borrowers and lenders through this transition." :
            "We hear you.",
      result: "RECOVERED · approval +12 · press treat it as 'humility'", good: true },
    { id: "double", color: C.coral, label: "DOUBLE DOWN",
      preview: "Stand by the decision. Pile on rhetoric.",
      line: isCutHard ? "We stand by today's cut. Inflation will moderate. The country needs growth and we will deliver it. Anyone forecasting catastrophe is engaging in fear-mongering." :
            isRaiseHard ? "We stand by today's hike. The pain is necessary medicine. Anyone soft on inflation is soft on stability. The committee will not flinch." :
            "We hold the line.",
      result: "DEEPENS THE CRISIS · approval -8 · markets sell off further", good: false },
    { id: "explain", color: C.gold, label: "EXPLAIN. CONTEXT. CONTEXT.",
      preview: "Set out the reasoning. Trust the country to understand.",
      line: isCutHard ? "Here is what we saw: growth slowing, unemployment climbing, leading indicators flashing. The inflation print was last month's print. We acted on tomorrow's data, not yesterday's headline." :
            isRaiseHard ? "Here is what we saw: inflation entrenched, expectations becoming unanchored. A delay would have meant a deeper, longer hike later. We chose front-loaded pain over prolonged uncertainty." :
            "Let me explain the data.",
      result: "MIXED · approval flat · 'patient but cold' framing", good: null },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "#040714", zIndex: 38, display: "flex", flexDirection: "column" }}>
      {/* Letterbox top */}
      <div style={{ background: "#000", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.red, animation: "pulse 1s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.red, letterSpacing: "0.32em", fontWeight: 800 }}>● CRISIS · EMERGENCY STATEMENT WINDOW</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>17:42 · MARKETS STILL OPEN · 12 MINUTES</div>
      </div>

      {/* Stage */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "radial-gradient(circle at 50% 30%, #2a1828 0%, #04060f 70%)" }}>
        {/* Background news crawl */}
        <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}>
          <rect width="1600" height="700" fill="#0a0814" />
          {Array.from({ length: 10 }).map((_, i) => (
            <text key={i} x="20" y={60 + i * 70} fill={i % 2 === 0 ? C.red : C.coral} fontFamily={FONT_M} fontSize="22" fontWeight="800" letterSpacing="0.12em">
              {isCutHard ? "INFLATION FEARS · MARKA -4% · " : "EVICTION NOTICES UP · MORTGAGE DEFAULTS · "}
              {i % 2 === 0 ? "PROTESTS GROW · " : "MARKETS DEMAND ACTION · "}
            </text>
          ))}
        </svg>

        <div style={{ position: "relative", padding: "30px 60px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT_M, fontSize: 11, color: C.red, letterSpacing: "0.32em", fontWeight: 800 }}>THE DAY GOT AWAY FROM YOU</div>
          <div style={{ fontFamily: FONT_D, fontSize: 56, color: C.surface, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>One chance to steady the ship.</div>
          <div style={{ fontFamily: FONT_H, fontSize: 24, color: C.gold, fontWeight: 600, marginTop: 8 }}>"Communication is half the job. Issue a statement before markets close."</div>

          {!picked ? (
            <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {statements.map((s) => (
                <div key={s.id} onClick={() => setPicked(s.id)} style={{
                  background: "rgba(255,248,238,0.04)", border: `2px solid ${s.color}`,
                  padding: "22px 22px", borderRadius: 3, cursor: "pointer", transition: "all 0.15s",
                }} onMouseOver={(e) => { e.currentTarget.style.background = `${s.color}33`; }}
                   onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,248,238,0.04)"; }}>
                  <div style={{ fontFamily: FONT_M, fontSize: 9, color: s.color, letterSpacing: "0.28em", fontWeight: 800 }}>STATEMENT</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.surface, fontWeight: 900, marginTop: 6, lineHeight: 1.1 }}>{s.label}</div>
                  <div style={{ fontFamily: FONT_D, fontSize: 14, color: C.textCream, fontStyle: "italic", fontWeight: 600, marginTop: 10, lineHeight: 1.4 }}>"{s.preview}"</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="popupIn" style={{ marginTop: 30 }}>
              {(() => {
                const s = statements.find(x => x.id === picked);
                return (
                  <div style={{ background: s.color, color: "#fff", padding: "30px 36px", borderRadius: 4, boxShadow: `0 24px 60px ${s.color}88` }}>
                    <div style={{ fontFamily: FONT_M, fontSize: 10, color: "rgba(255,255,255,0.85)", letterSpacing: "0.32em", fontWeight: 800 }}>YOU READ:</div>
                    <div style={{ fontFamily: FONT_D, fontSize: 26, color: "#fff", fontWeight: 600, fontStyle: "italic", lineHeight: 1.35, marginTop: 10 }}>"{s.line}"</div>
                    <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(0,0,0,0.25)", borderRadius: 2 }}>
                      <div style={{ fontFamily: FONT_M, fontSize: 10, letterSpacing: "0.28em", fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>RESULT</div>
                      <div style={{ fontFamily: FONT_D, fontSize: 17, color: "#fff", fontWeight: 700, marginTop: 4 }}>{s.result}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#000", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.textCreamDim, letterSpacing: "0.22em" }}>{picked ? "STATEMENT FILED" : "PICK ONE · CAREFULLY"}</div>
        {picked && (
          <button onClick={() => { dispatch({ type: "RECOVERY_CHOOSE", choice: picked }); dispatch({ type: "RECOVERY_END" }); }} style={{ background: C.coral, color: "#fff", border: "none", padding: "14px 32px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>
            WATCH THE WIRES →
          </button>
        )}
      </div>
    </div>
  );
}

function NewsroomPress({ state, dispatch }) {
  const a1 = state.policy?.actOne;
  const a2 = state.policy?.actTwo;
  const a3 = state.policy?.actThree;
  const step = state.newsroomStep || 0;
  const [typed, setTyped] = useState("");

  // Three big headlines, one per second-ish, dramatic typewriter
  const headlines = [
    {
      paper: "VOSTAN TIMES",
      mast: "Quality journalism since 1924",
      kicker: "BREAKING · MONETARY POLICY",
      big: a1 === "raise" ? "RESERVE STRIKES" : "RESERVE HOLDS",
      sub: a1 === "raise" ? "Rate raised to 4.5%. Mortgage holders brace for impact." : "Rate held at 3.0%. Critics call it 'paralysis in the face of price rises'.",
      colour: a1 === "raise" ? C.coral : C.gold,
    },
    {
      paper: "MARKET WIRE",
      mast: "Real-time financial intelligence",
      kicker: "BALANCE SHEET · LIVE",
      big: a2 === "qe" ? "QE RETURNS" : a2 === "qt" ? "QT ACCELERATES" : "BALANCE SHEET HELD",
      sub: a2 === "qe" ? "Reserve to buy ₺25bn of bonds over six months. Gilt yields fall sharply within the hour." : a2 === "qt" ? "Selling pace doubles. 10-year yields up 25 basis points — largest single-day move in 18 months." : "Reinvestment continues at maturity. Markets call it 'consistent'.",
      colour: a2 === "qt" ? C.coral : a2 === "qe" ? C.teal : C.gold,
    },
    {
      paper: "THE GLOBE",
      mast: "International perspectives",
      kicker: "GUIDANCE · WORLD REACTS",
      big: a3 === "hawk" ? '"HIGHER FOR LONGER"' : '"WE\'RE NEAR THE PEAK"',
      sub: a3 === "hawk" ? "Governor signals tightening cycle has further to run. Currency rallies; bonds sell off." : "Governor signals the end of the tightening cycle is in sight. Currency softens; bonds rally.",
      colour: a3 === "hawk" ? C.coral : C.teal,
    },
  ];
  const cur = headlines[step];

  useEffect(() => {
    if (!cur) return;
    setTyped("");
    let i = 0;
    const text = cur.big;
    const iv = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, 60);
    return () => clearInterval(iv);
  }, [step, cur?.big]);

  if (!cur) {
    setTimeout(() => dispatch({ type: "NEWSROOM_END" }), 50);
    return null;
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0a0a14", zIndex: 38, display: "flex", flexDirection: "column" }}>
      <SkipButton onSkip={() => dispatch({ type: "NEWSROOM_END" })} label="SKIP TO NEXT" />
      {/* Letterbox top */}
      <div style={{ background: "#000", height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● ROLLING THE PRESSES</div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>HEADLINE {step + 1} OF {headlines.length}</div>
      </div>

      {/* Stage with printing press */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 50% 40%, #2a2438 0%, #0a0a14 70%)" }}>
        {/* Press rollers background */}
        <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.6 }}>
          {/* Large industrial rollers */}
          {[100, 400, 700, 1000].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy="120" r="55" fill="#1a1a28" stroke="#3a3a50" strokeWidth="2" />
              <circle cx={x} cy="120" r="45" fill="#0e0e18" />
              <circle cx={x} cy="120" r="38" fill="none" stroke="#3a3a50" strokeWidth="0.5">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${x} 120`} to={`360 ${x} 120`} dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={x} cy="120" r="6" fill={C.gold} />
              <circle cx={x} cy="600" r="55" fill="#1a1a28" stroke="#3a3a50" strokeWidth="2" />
              <circle cx={x} cy="600" r="45" fill="#0e0e18" />
              <circle cx={x} cy="600" r="38" fill="none" stroke="#3a3a50" strokeWidth="0.5">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${x} 600`} to={`-360 ${x} 600`} dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={x} cy="600" r="6" fill={C.gold} />
            </g>
          ))}
          {/* Paper feed lines */}
          {[100, 400, 700, 1000].map((x, i) => (
            <rect key={`p${i}`} x={x - 80} y="165" width="160" height="390" fill="#1f1f30" opacity="0.4" />
          ))}
          {/* Light shafts */}
          <polygon points="0,0 300,0 200,700 -50,700" fill="#fff8ee" opacity="0.03" />
          <polygon points="900,0 1200,0 1250,700 1000,700" fill="#fff8ee" opacity="0.03" />
        </svg>

        {/* Front-of-stage newspaper */}
        <div className="popupIn" key={step} style={{ position: "relative", zIndex: 2, background: "#fff8ee", padding: "44px 56px", maxWidth: 760, boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 -20px 80px rgba(245,184,46,0.15)", transform: "rotate(-1.5deg)", border: "1px solid #c9b178" }}>
          {/* Masthead */}
          <div style={{ borderBottom: `3px double ${C.ink}`, paddingBottom: 12, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontFamily: FONT_D, fontSize: 38, color: C.ink, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>{cur.paper}</div>
              <div style={{ fontFamily: FONT_D, fontSize: 12, color: C.textMuted, fontWeight: 500, marginTop: 2, fontStyle: "italic" }}>{cur.mast}</div>
            </div>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.22em", textAlign: "right" }}>EVENING EDITION<br/>TUESDAY · LATE</div>
          </div>

          {/* Kicker */}
          <div style={{ background: cur.colour, color: "#fff", display: "inline-block", padding: "4px 10px", fontFamily: FONT_M, fontSize: 10, letterSpacing: "0.28em", fontWeight: 800, marginBottom: 14 }}>{cur.kicker}</div>

          {/* The big headline (typewriter) */}
          <div style={{ fontFamily: FONT_D, fontSize: 68, color: C.ink, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: 14, minHeight: 130 }}>
            {typed}
            {typed.length < cur.big.length && <span style={{ color: cur.colour, opacity: 0.6 }}>▮</span>}
          </div>

          {/* Sub */}
          <div style={{ fontFamily: FONT_D, fontSize: 17, color: C.text, fontWeight: 500, lineHeight: 1.45, marginBottom: 16 }}>{cur.sub}</div>

          {/* Author line */}
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textMuted, letterSpacing: "0.18em", paddingTop: 12, borderTop: `1px solid ${C.borderCream}` }}>
            FILED BY THE ECONOMICS DESK · PRINTED LIVE FROM THE FLOOR
          </div>
        </div>
      </div>

      {/* Bottom letterbox + button */}
      <div style={{ background: "#000", height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {headlines.map((_, i) => (
            <div key={i} style={{ width: 28, height: 3, background: i === step ? C.coral : i < step ? C.gold : "rgba(255,255,255,0.15)", borderRadius: 1 }} />
          ))}
        </div>
        <button onClick={() => {
          if (step < headlines.length - 1) dispatch({ type: "NEWSROOM_NEXT" });
          else dispatch({ type: "NEWSROOM_END" });
        }} style={{ background: C.coral, color: "#fff", border: "none", padding: "12px 30px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>
          {step < headlines.length - 1 ? "NEXT EDITION →" : "VOICE OF THE COUNTRY →"}
        </button>
      </div>
    </div>
  );
}

// ─── VOICE OF THE COUNTRY: POLAROID MONTAGE ────────────────
function VoiceOfCountry({ state, dispatch }) {
  const a1 = state.policy?.actOne;
  const a2 = state.policy?.actTwo;
  const a3 = state.policy?.actThree;
  const step = state.voiceStep || 0;

  // Each polaroid is a citizen
  const voices = [
    { who: "Yusuf", age: 38, role: "Mortgage holder · two kids", c: C.coral,
      line: a1 === "raise" ? "An extra ₺240 a month. I've cancelled the kids' swimming." : "We hold the line. I can plan again.",
      bg: "#5a3a30" },
    { who: "Amara", age: 52, role: "Market stallholder", c: C.bMarket,
      line: a1 === "raise" ? "Customers stopped coming. Prices fell. Stock didn't move." : "Prices keep climbing. I can't keep up. My regulars are choosing between fruit and rent.",
      bg: "#5a2438" },
    { who: "Mr Halim", age: 78, role: "Pensioner · 41 years here", c: C.bFlat,
      line: a1 === "raise" ? "My grandson's mortgage just went up. He's working two jobs." : "I worked all my life. Held my savings. Now they're worth less every week.",
      bg: "#4a3a50" },
    { who: "Liana Voss", age: 29, role: "Fintech founder · Series A", c: C.teal,
      line: a2 === "qe" ? "QE means cheap money. We just unlocked our next round." : a2 === "qt" ? "Tighter conditions. We've paused hiring. Pivoting to profit." : "Wait-and-see for our sector. Nothing dramatic.",
      bg: "#1a4a48" },
    { who: "Ben & Sara", age: "32, 30", role: "First-time buyers", c: C.gold,
      line: a3 === "dove" ? "If rates are peaking, we'll move in spring. We've been waiting." : "We're priced out for another year. Maybe two.",
      bg: "#5a4818" },
    { who: "The protester", age: "—", role: "On the Reserve gates", c: C.coral,
      line: "You sat in that room. You used your tools. You made your call. We live with it.",
      bg: "#3a1820" },
  ];

  const cur = voices[step];
  if (!cur) {
    setTimeout(() => dispatch({ type: "VOICE_END" }), 50);
    return null;
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#080812", zIndex: 38, display: "flex", flexDirection: "column" }}>
      <SkipButton onSkip={() => dispatch({ type: "VOICE_END" })} label="SKIP TO NEXT" />
      {/* Top letterbox */}
      <div style={{ background: "#000", height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>VOICE OF THE COUNTRY</div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>{step + 1} OF {voices.length}</div>
      </div>

      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Layered background — previous polaroids stacked */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {voices.slice(0, step).map((v, i) => {
            const angle = ((i * 17) % 30) - 15;
            const tx = ((i * 137) % 60) - 30;
            const ty = ((i * 89) % 50) - 25;
            return (
              <div key={i} style={{
                position: "absolute",
                left: `${15 + (i * 13) % 70}%`,
                top: `${20 + (i * 21) % 50}%`,
                transform: `translate(${tx}px, ${ty}px) rotate(${angle}deg)`,
                width: 240, height: 280,
                background: "#fff8ee",
                padding: "14px 14px 28px",
                boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
                opacity: 0.85,
              }}>
                <div style={{ width: "100%", height: 180, background: v.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 100 120" style={{ width: "60%" }}>
                    <ellipse cx="50" cy="55" rx="22" ry="26" fill="#c4956a" />
                    <path d="M 28 45 Q 26 25 50 24 Q 74 25 72 45 L 70 60 Q 60 55 50 55 Q 40 55 30 60 Z" fill="#1a0c08" />
                    <circle cx="42" cy="55" r="2" fill="#1a0c08" />
                    <circle cx="58" cy="55" r="2" fill="#1a0c08" />
                    <rect x="36" y="80" width="28" height="40" fill={v.c} rx="2" />
                  </svg>
                </div>
                <div style={{ fontFamily: FONT_H, fontSize: 16, color: C.ink, marginTop: 8, textAlign: "center" }}>{v.who}</div>
              </div>
            );
          })}
        </div>

        {/* Current polaroid — large, centred, dramatic */}
        <div className="popupIn" key={step} style={{
          position: "relative", zIndex: 5,
          background: "#fff8ee",
          padding: "20px 20px 36px",
          width: 480,
          boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 -10px 60px rgba(245,184,46,0.15)",
          border: "1px solid #c9b178",
          transform: "rotate(-2deg)",
        }}>
          {/* Polaroid photo */}
          <div style={{ width: "100%", height: 280, background: cur.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            {/* Subtle film grain via dots */}
            <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}>
              {Array.from({ length: 80 }).map((_, i) => (
                <circle key={i} cx={(i * 23) % 200} cy={(i * 31) % 200} r="0.5" fill="#fff8ee" />
              ))}
            </svg>
            {/* Big stylised portrait */}
            <svg viewBox="0 0 200 240" style={{ width: "70%", position: "relative" }}>
              {/* Head */}
              <ellipse cx="100" cy="110" rx="46" ry="56" fill="#c4956a" />
              {/* Hair */}
              <path d="M 56 90 Q 52 50 100 48 Q 148 50 144 90 L 142 120 Q 124 110 100 110 Q 76 110 58 120 Z" fill="#1a0c08" />
              {/* Eyes */}
              <ellipse cx="86" cy="110" rx="4" ry="5" fill="#1a0c08" />
              <ellipse cx="114" cy="110" rx="4" ry="5" fill="#1a0c08" />
              {/* Eye highlights */}
              <circle cx="87" cy="108" r="1" fill="#fff8ee" />
              <circle cx="115" cy="108" r="1" fill="#fff8ee" />
              {/* Brow */}
              <rect x="80" y="100" width="12" height="2" fill="#1a0c08" rx="1" />
              <rect x="108" y="100" width="12" height="2" fill="#1a0c08" rx="1" />
              {/* Mouth */}
              <path d="M 92 138 Q 100 142 108 138" stroke="#5a2418" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* Body */}
              <path d="M 60 200 Q 60 175 76 170 L 124 170 Q 140 175 140 200 L 145 240 L 55 240 Z" fill={cur.c} />
              {/* Neck */}
              <rect x="92" y="160" width="16" height="14" fill="#c4956a" />
            </svg>
          </div>
          {/* Caption */}
          <div style={{ marginTop: 14, paddingLeft: 6, paddingRight: 6 }}>
            <div style={{ fontFamily: FONT_H, fontSize: 26, color: C.ink, fontWeight: 600, lineHeight: 1.1 }}>{cur.who}</div>
            <div style={{ fontFamily: FONT_M, fontSize: 9, color: cur.c, letterSpacing: "0.22em", fontWeight: 800, marginTop: 2 }}>{cur.role.toUpperCase()}</div>
          </div>
        </div>

        {/* Quote text — appearing big at the bottom right */}
        <div className="popupIn" key={`q${step}`} style={{
          position: "absolute", right: 60, bottom: 80, maxWidth: 480,
          fontFamily: FONT_D, fontSize: 36, color: C.surface, fontWeight: 500, lineHeight: 1.2, fontStyle: "italic",
          textShadow: "0 4px 24px rgba(0,0,0,0.8)",
        }}>
          "{cur.line}"
        </div>
      </div>

      <div style={{ background: "#000", height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {voices.map((_, i) => (
            <div key={i} style={{ width: 28, height: 3, background: i === step ? C.coral : i < step ? C.gold : "rgba(255,255,255,0.15)", borderRadius: 1 }} />
          ))}
        </div>
        <button onClick={() => {
          if (step < voices.length - 1) dispatch({ type: "VOICE_NEXT" });
          else dispatch({ type: "VOICE_END" });
        }} style={{ background: C.coral, color: "#fff", border: "none", padding: "12px 30px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>
          {step < voices.length - 1 ? "NEXT VOICE →" : "WALK BACK INTO THE CITY →"}
        </button>
      </div>
    </div>
  );
}

// ─── TRADING FLOOR — RIGHT AFTER THE DECISION ────────────
function TradingFloor({ state, dispatch }) {
  const a1 = state.policy?.actOne;
  const a2 = state.policy?.actTwo;
  const a3 = state.policy?.actThree;
  const step = state.tradingStep || 0;
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf;
    const tick = () => { setT(performance.now() / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const direction = a1 === "raise" ? "tight" : "loose";

  // Beats
  const beats = [
    { caption: "09:01 · The decision hits the wires.", sub: "Bloomberg terminals across Varena flash red." },
    { caption: a1 === "raise" ? "09:02 · Yields jump. Bonds sell off." : "09:02 · Bond markets relax. Yields ease.", sub: a1 === "raise" ? "Two-year up 22bps in twelve minutes." : "Two-year down 14bps. Buyers everywhere." },
    { caption: "09:08 · The Marka moves on the FX board.", sub: a1 === "raise" ? "Currency rallies 0.8% against the dollar." : "Currency softens 0.6% against the dollar." },
    { caption: "09:15 · The phones don't stop ringing.", sub: "Every desk is recalibrating exposure to the new path." },
  ];
  const cur = beats[step];
  if (!cur) {
    setTimeout(() => dispatch({ type: "TRADING_END" }), 50);
    return null;
  }

  // Ticker symbols + live-feel prices
  const tickers = [
    { sym: "ELR/USD", base: 1.02, c: a1 === "raise" ? C.teal : C.coral },
    { sym: "EL 2Y",   base: a1 === "raise" ? 4.62 : 3.10, c: a1 === "raise" ? C.coral : C.teal },
    { sym: "EL 10Y",  base: a1 === "raise" ? 4.32 : 3.45, c: a1 === "raise" ? C.coral : C.teal },
    { sym: "MAIN IDX", base: a1 === "raise" ? 1487 : 1612, c: a1 === "raise" ? C.coral : C.teal },
    { sym: "GOLD",    base: 1986, c: C.gold },
    { sym: "BRENT",   base: 84.6, c: C.purple },
    { sym: "BANKS",   base: a1 === "raise" ? 142 : 158, c: a1 === "raise" ? C.coral : C.teal },
    { sym: "HOMES",   base: a1 === "raise" ? 244 : 268, c: a1 === "raise" ? C.coral : C.teal },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "#040714", zIndex: 38, display: "flex", flexDirection: "column" }}>
      <SkipButton onSkip={() => dispatch({ type: "TRADING_END" })} label="SKIP TO PRESS" />
      {/* Letterbox top */}
      <div style={{ background: "#000", height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.coral, animation: "pulse 1s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● THE TRADING FLOOR · MARKETS REACT</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>VARENA EXCHANGE · 09:00 MEETING</div>
      </div>

      {/* Stage: glass-walled floor with massive ticker wall */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0e22" />
              <stop offset="100%" stopColor="#1a2046" />
            </linearGradient>
          </defs>
          <rect width="1600" height="800" fill="url(#floorGrad)" />

          {/* Ticker wall at back */}
          <rect x="0" y="60" width="1600" height="280" fill="#000" />
          <rect x="0" y="60" width="1600" height="3" fill={C.gold} opacity="0.5" />
          <rect x="0" y="337" width="1600" height="3" fill={C.gold} opacity="0.5" />

          {/* Big ticker rows */}
          {[0, 1, 2, 3].map((row) => {
            const offset = (t * (40 + row * 8)) % 800;
            return (
              <g key={row} transform={`translate(${-offset}, ${80 + row * 65})`}>
                {[...tickers, ...tickers].map((tk, i) => {
                  const flicker = Math.sin(t * 3 + i * 1.7) * 0.012;
                  const v = tk.base * (1 + flicker);
                  const arrow = flicker > 0 ? "▲" : flicker < -0.005 ? "▼" : "·";
                  return (
                    <g key={i} transform={`translate(${i * 220}, 0)`}>
                      <text x="0" y="20" fill="#fff" fontFamily={FONT_M} fontSize="22" fontWeight="800" letterSpacing="0.08em">{tk.sym}</text>
                      <text x="120" y="20" fill={tk.c} fontFamily={FONT_M} fontSize="22" fontWeight="800">{typeof tk.base === "number" && tk.base > 100 ? v.toFixed(1) : v.toFixed(3)}</text>
                      <text x="195" y="20" fill={tk.c} fontFamily={FONT_M} fontSize="16">{arrow}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Side screens with charts */}
          <g transform="translate(60, 380)">
            <rect x="0" y="0" width="280" height="170" fill="#0a0e22" stroke={C.gold} strokeWidth="2" />
            <text x="14" y="22" fill={C.gold} fontFamily={FONT_M} fontSize="11" fontWeight="800" letterSpacing="0.18em">2Y YIELD · INTRADAY</text>
            {/* Sparkline */}
            <polyline points={Array.from({ length: 30 }, (_, i) => `${20 + i * 9},${100 - (a1 === "raise" ? i * 1.8 : -i * 1.2) - Math.sin(i + t * 2) * 3}`).join(" ")} stroke={a1 === "raise" ? C.coral : C.teal} strokeWidth="2" fill="none" />
            <line x1="14" y1="140" x2="266" y2="140" stroke="#fff" strokeWidth="0.3" opacity="0.3" />
            <text x="14" y="158" fill="#fff" fontFamily={FONT_M} fontSize="9" opacity="0.6">09:00 · MEETING · NOW</text>
          </g>

          <g transform="translate(1260, 380)">
            <rect x="0" y="0" width="280" height="170" fill="#0a0e22" stroke={C.gold} strokeWidth="2" />
            <text x="14" y="22" fill={C.gold} fontFamily={FONT_M} fontSize="11" fontWeight="800" letterSpacing="0.18em">MARKA / USD · INTRADAY</text>
            <polyline points={Array.from({ length: 30 }, (_, i) => `${20 + i * 9},${100 - (a1 === "raise" ? i * 1.2 : -i * 0.8) - Math.sin(i + t * 1.5) * 2}`).join(" ")} stroke={a1 === "raise" ? C.teal : C.coral} strokeWidth="2" fill="none" />
            <line x1="14" y1="140" x2="266" y2="140" stroke="#fff" strokeWidth="0.3" opacity="0.3" />
          </g>

          {/* Trading desks (silhouettes) */}
          {[200, 380, 560, 740, 920, 1100].map((x, i) => (
            <g key={i} transform={`translate(${x}, 580)`}>
              {/* Desk */}
              <rect x="-50" y="40" width="100" height="50" fill="#1a1a2e" />
              <rect x="-50" y="40" width="100" height="4" fill="#3a3a4e" />
              {/* Monitor */}
              <rect x="-30" y="-10" width="60" height="45" fill="#000" stroke="#3a3a4e" strokeWidth="1.5" />
              <rect x="-26" y="-6" width="52" height="37" fill={i % 2 === 0 ? (a1 === "raise" ? C.coral : C.teal) : C.gold} opacity="0.7" />
              {/* Trader (back of head + shoulders) */}
              <rect x="-18" y="2" width="36" height="36" fill={["#5a3a18", "#3a1810", "#5a3018", "#3a2008", "#4a2a18", "#5a3a20"][i]} />
              <ellipse cx="0" cy="-2" rx="15" ry="18" fill="#c4956a" opacity="0.95" />
              <path d="M -14 -8 Q -13 -22 0 -23 Q 13 -22 14 -8" fill="#1a0c08" />
              {/* Phone */}
              {i % 2 === 0 && <rect x="14" y="-6" width="3" height="10" fill="#0a0408" />}
            </g>
          ))}

          {/* Reserve panel observer (player + 1) on a balcony */}
          <g transform="translate(800, 660)">
            <rect x="-80" y="0" width="160" height="6" fill={C.gold} opacity="0.6" />
            <rect x="-80" y="6" width="160" height="40" fill="#1a1a2e" opacity="0.7" />
            <g transform="translate(-30, -30)">
              <ellipse cx="0" cy="20" rx="14" ry="3" fill="#000" opacity="0.4" />
              <rect x="-7" y="-2" width="14" height="22" fill={C.coral} rx="2" />
              <ellipse cx="0" cy="-10" rx="8" ry="9" fill="#c4956a" />
              <path d="M -7 -12 Q -7 -19 0 -20 Q 7 -19 7 -12" fill="#1a0c08" />
            </g>
            <g transform="translate(30, -30)">
              <ellipse cx="0" cy="20" rx="14" ry="3" fill="#000" opacity="0.4" />
              <rect x="-7" y="-2" width="14" height="22" fill={C.teal} rx="2" />
              <ellipse cx="0" cy="-10" rx="8" ry="9" fill="#c4956a" />
              <path d="M -7 -12 Q -7 -19 0 -20 Q 7 -19 7 -12" fill="#1a0c08" />
            </g>
            <text x="0" y="-50" textAnchor="middle" fill={C.gold} fontFamily={FONT_M} fontSize="10" fontWeight="800" letterSpacing="0.22em">RESERVE OBSERVATION DECK</text>
          </g>
        </svg>

        {/* Caption overlay */}
        <div key={step} className="popupIn" style={{
          position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)",
          width: "min(720px, 86%)", textAlign: "center",
        }}>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 8 }}>{cur.caption}</div>
          <div style={{ fontFamily: FONT_D, fontSize: 30, color: C.textCream, fontWeight: 600, lineHeight: 1.3, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>{cur.sub}</div>
        </div>
      </div>

      <div style={{ background: "#000", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {beats.map((_, i) => (
            <div key={i} style={{ width: 24, height: 3, background: i === step ? C.coral : i < step ? C.gold : "rgba(255,255,255,0.15)", borderRadius: 1 }} />
          ))}
        </div>
        <button onClick={() => {
          if (step < beats.length - 1) dispatch({ type: "TRADING_NEXT" });
          else dispatch({ type: "TRADING_END" });
        }} style={{ background: C.coral, color: "#fff", border: "none", padding: "12px 28px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>
          {step < beats.length - 1 ? "WATCH ON →" : "TO THE PRESS →"}
        </button>
      </div>
    </div>
  );
}

// ─── WALK HOME AT SUNSET ──────────────────────────────────
function WalkHome({ state, dispatch }) {
  const a1 = state.policy?.actOne;
  const step = state.walkHomeStep || 0;
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => { setT(performance.now() / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Camera pans through the city at dusk. Each beat is a vignette.
  const beats = [
    { focus: "amara", line: a1 === "raise" ? "Amara packs up two hours early. Eight stalls already shut." : "Amara restocks for tomorrow. The same regulars. The same worries.", who: "AMARA · MARKET STALL" },
    { focus: "yusuf", line: a1 === "raise" ? "Yusuf is on the phone outside his flat. Calculator in his other hand." : "Yusuf is on a video call with his accountant. Some relief in his face.", who: "YUSUF · KELDRA TOWERS" },
    { focus: "halim", line: a1 === "raise" ? "Mr Halim watches the news through his window. He's smiling, just a little." : "Mr Halim is on the bench again. He looks unsettled.", who: "MR HALIM · BENCH" },
    { focus: "gates", line: "The protesters are still there. Bigger banners now.", who: "RESERVE GATES" },
  ];
  const cur = beats[step];
  if (!cur) {
    setTimeout(() => dispatch({ type: "WALKHOME_END" }), 50);
    return null;
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#080812", zIndex: 38, display: "flex", flexDirection: "column" }}>
      <SkipButton onSkip={() => dispatch({ type: "WALKHOME_END" })} label="SKIP HOME" />
      <div style={{ background: "#000", height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● THE WALK HOME · 6:42 PM</div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>VARENA · GOLDEN HOUR</div>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="duskSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1840" />
              <stop offset="40%" stopColor="#5a2a48" />
              <stop offset="80%" stopColor="#E891A2" />
              <stop offset="100%" stopColor="#F5B82E" />
            </linearGradient>
          </defs>
          <rect width="1600" height="700" fill="url(#duskSky)" />
          {/* Sun setting */}
          <circle cx="1300" cy="500" r="80" fill="#F5B82E" opacity="0.9" />
          <circle cx="1300" cy="500" r="140" fill="#F5B82E" opacity="0.2" />
          {/* Distant city skyline silhouette */}
          <path d="M 0 480 L 80 460 L 80 420 L 160 420 L 160 480 L 220 480 L 220 380 L 300 380 L 300 470 L 400 470 L 400 410 L 460 410 L 460 480 L 540 480 L 540 360 L 620 360 L 620 480 L 720 480 L 720 420 L 800 420 L 800 380 L 880 380 L 880 470 L 1600 470 L 1600 700 L 0 700 Z" fill="#0a0f24" />
          {/* Closer street silhouettes */}
          <rect x="0" y="540" width="1600" height="160" fill="#040614" />

          {/* The focused vignette */}
          {cur.focus === "amara" && (
            <g transform="translate(800, 540)">
              {/* Stall canopy */}
              <rect x="-160" y="-100" width="320" height="20" fill={a1 === "raise" ? "#3a1818" : C.bMarket} />
              <rect x="-160" y="-80" width="320" height="60" fill="#1a0e08" />
              {/* Crates */}
              <rect x="-120" y="-15" width="240" height="20" fill="#5a3818" />
              {/* Stallholder (Amara) */}
              <g transform="translate(0, -30)">
                <rect x="-12" y="0" width="24" height="30" fill={C.bMarket} />
                <path d="M -10 0 L 10 0 L 12 30 L -12 30 Z" fill="#fff8ee" opacity="0.85" />
                <ellipse cx="0" cy="-12" rx="10" ry="12" fill="#9a6840" />
                <path d="M -10 -15 Q -11 -22 0 -23 Q 11 -22 10 -15 L 10 -9 Q 4 -10 0 -10 Q -4 -10 -10 -9 Z" fill={C.gold} />
                <ellipse cx="-3" cy="-11" rx="1" ry="1.2" fill="#0a0408" />
                <ellipse cx="3" cy="-11" rx="1" ry="1.2" fill="#0a0408" />
              </g>
              {/* Empty stall sign */}
              <rect x="-50" y="40" width="100" height="20" fill="#fff8ee" />
              <text x="0" y="54" textAnchor="middle" fill={C.coral} fontFamily={FONT_H} fontSize="14" fontWeight="600">{a1 === "raise" ? "CLOSING EARLY" : "OPEN TOMORROW 7AM"}</text>
            </g>
          )}

          {cur.focus === "yusuf" && (
            <g transform="translate(800, 540)">
              {/* Building outline */}
              <rect x="-150" y="-220" width="300" height="220" fill="#1a1432" />
              <rect x="-150" y="-220" width="300" height="220" fill="#fff8ee" opacity="0.05" />
              {[-180, -140, -100, -60, -20].map((y) => (
                <g key={y}>
                  <rect x="-140" y={y} width="20" height="14" fill={C.gold} opacity="0.6" />
                  <rect x="-110" y={y} width="20" height="14" fill={C.coral} opacity="0.4" />
                  <rect x="-80" y={y} width="20" height="14" fill="#1a0e08" />
                  <rect x="-50" y={y} width="20" height="14" fill={C.gold} opacity="0.5" />
                  <rect x="-20" y={y} width="20" height="14" fill={C.gold} opacity="0.7" />
                  <rect x="10" y={y} width="20" height="14" fill="#1a0e08" />
                  <rect x="40" y={y} width="20" height="14" fill={C.coral} opacity="0.7" />
                  <rect x="70" y={y} width="20" height="14" fill={C.gold} opacity="0.5" />
                  <rect x="100" y={y} width="20" height="14" fill={C.coral} opacity="0.6" />
                </g>
              ))}
              {/* Highlighted window with Yusuf silhouette */}
              <rect x="-50" y="-100" width="20" height="14" fill={C.gold} opacity="1" stroke={C.coral} strokeWidth="2">
                <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite" />
              </rect>
              <circle cx="-40" cy="-93" r="3" fill="#1a0c08" />
            </g>
          )}

          {cur.focus === "halim" && (
            <g transform="translate(800, 540)">
              {/* Bench */}
              <rect x="-80" y="0" width="160" height="10" fill="#5a3018" />
              <rect x="-80" y="-30" width="160" height="6" fill="#5a3018" />
              <rect x="-78" y="10" width="6" height="40" fill="#3a1808" />
              <rect x="72" y="10" width="6" height="40" fill="#3a1808" />
              {/* Halim sitting */}
              <g transform="translate(0, -10)">
                <rect x="-10" y="0" width="20" height="20" fill={C.bFlat} />
                <ellipse cx="0" cy="-12" rx="9" ry="11" fill="#c4956a" />
                <path d="M -8 -16 Q -8 -22 0 -23 Q 8 -22 8 -16" fill="#e8e0d8" />
                <ellipse cx="-3" cy="-11" rx="1" ry="1.2" fill="#0a0408" />
                <ellipse cx="3" cy="-11" rx="1" ry="1.2" fill="#0a0408" />
                {a1 === "raise" ? <path d="M -2 -7 Q 0 -6 2 -7" stroke="#3a1808" strokeWidth="0.6" fill="none" /> : <path d="M -2 -7 Q 0 -8 2 -7" stroke="#3a1808" strokeWidth="0.6" fill="none" />}
              </g>
              {/* Cane */}
              <line x1="-14" y1="10" x2="-16" y2="50" stroke="#3a2418" strokeWidth="2" />
              {/* Newspaper in lap */}
              <rect x="-22" y="6" width="22" height="14" fill="#fff8ee" />
              <text x="-11" y="14" textAnchor="middle" fontFamily={FONT_M} fontSize="3" fontWeight="800" fill="#0a0408">{a1 === "raise" ? "RESERVE STRIKES" : "RESERVE HOLDS"}</text>
            </g>
          )}

          {cur.focus === "gates" && (
            <g transform="translate(800, 540)">
              {/* The Reserve gates */}
              <rect x="-200" y="-200" width="10" height="200" fill={C.gold} />
              <rect x="190" y="-200" width="10" height="200" fill={C.gold} />
              {[-180, -140, -100, -60, -20, 20, 60, 100, 140, 180].map((x) => (
                <rect key={x} x={x} y="-180" width="3" height="180" fill={C.gold} opacity="0.6" />
              ))}
              <path d="M -200 -200 L -190 -210 L 190 -210 L 200 -200" stroke={C.gold} strokeWidth="3" fill="none" />
              {/* Crowd of protesters */}
              {Array.from({ length: 12 }).map((_, i) => {
                const x = -180 + (i * 30);
                const sway = Math.sin(t * 2 + i) * 2;
                return (
                  <g key={i} transform={`translate(${x + sway}, -10)`}>
                    {/* Body */}
                    <rect x="-6" y="0" width="12" height="20" fill={[C.coral, C.red, "#6a2818", C.bMarket][i % 4]} />
                    {/* Head */}
                    <ellipse cx="0" cy="-8" rx="6" ry="7" fill="#c4956a" />
                    {/* Sign */}
                    {i % 3 === 0 && (
                      <g>
                        <rect x="-1" y="-30" width="2" height="20" fill="#5a3018" />
                        <rect x="-12" y="-40" width="24" height="14" fill="#fff8ee" />
                        <text x="0" y="-31" textAnchor="middle" fontFamily="sans-serif" fontSize="4" fontWeight="800" fill="#0a0408">{["RENT IS THEFT", "YOU DECIDED", "WE FEEL IT", "DO BETTER"][i % 4]}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Player walking past (small in foreground) */}
          <g transform={`translate(${200 + Math.sin(t * 0.5 + step * 1.5) * 30}, 660)`}>
            <ellipse cx="0" cy="6" rx="8" ry="2" fill="#000" opacity="0.4" />
            <rect x="-4" y="-12" width="8" height="14" fill={C.coral} rx="1" />
            <ellipse cx="0" cy="-18" rx="5" ry="6" fill="#c4956a" />
            <path d="M -4 -22 Q -4 -25 0 -26 Q 4 -25 4 -22" fill="#1a0c08" />
          </g>
        </svg>

        {/* Caption */}
        <div key={step} className="popupIn" style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", textAlign: "center", maxWidth: 880 }}>
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.32em", fontWeight: 800, marginBottom: 8 }}>{cur.who}</div>
          <div style={{ fontFamily: FONT_H, fontSize: 38, color: C.textCream, fontWeight: 600, lineHeight: 1.25, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>{cur.line}</div>
        </div>
      </div>

      <div style={{ background: "#000", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {beats.map((_, i) => (
            <div key={i} style={{ width: 24, height: 3, background: i === step ? C.coral : i < step ? C.gold : "rgba(255,255,255,0.15)", borderRadius: 1 }} />
          ))}
        </div>
        <button onClick={() => {
          if (step < beats.length - 1) dispatch({ type: "WALKHOME_NEXT" });
          else dispatch({ type: "WALKHOME_END" });
        }} style={{ background: C.coral, color: "#fff", border: "none", padding: "12px 28px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 2 }}>
          {step < beats.length - 1 ? "WALK ON →" : "EPILOGUE →"}
        </button>
      </div>
    </div>
  );
}

function ConsequenceMontage({ state, dispatch }) {
  const rate = state.interestRate;
  const hike = rate > 3.5;
  const cut = rate < 2.5;
  const statementId = state.pressStatement?.id || "";
  const harshStatement = statementId === "blame" || statementId === "weak" || statementId === "aggressive";
  const pol = state.policy;
  const heavyQE = pol.qe > 1.5;
  const heavyQT = pol.qe < -1.5;
  const looseInnov = pol.innovation > 0.5;
  const tightMacroPru = pol.macroPru > 0.5;
  const fullLiquidity = pol.liquidity > 2;

  // Each scene is a vignette: NPC quote, headline, or chart
  const scenes = [
    {
      type: "headline",
      paper: "VOSTAN TIMES",
      color: hike ? C.coral : cut ? C.teal : C.red,
      bigHeadline: hike ? "RESERVE STRIKES" : cut ? "RESERVE BLINKS" : "RESERVE FROZEN AT THE WHEEL",
      subhead: hike ? `Rate hike to ${pct(rate)} — Governor invokes 'discipline'. Mortgage holders reel across Varena.` : cut ? `Cut to ${pct(rate)} sparks borrower relief — and immediate inflation fears.` : `Hold at ${pct(rate)} while inflation runs at ${pct(state.inflation)}. Critics call it 'paralysis'. Editorial pages: 'do something'.`,
      kicker: harshStatement ? "PRESS REACT: 'This was the wrong tone'" : hike ? "Markets opened down 3%" : cut ? "Currency wobbles" : "Editorial: 'Cowardice in a cardigan'",
    },
    // Balance sheet scene (NEW)
    {
      type: "headline",
      paper: "MARKET WIRE · BALANCE SHEET",
      color: heavyQE ? C.teal : heavyQT ? C.coral : C.gold,
      bigHeadline: heavyQE ? "RESERVE REOPENS QE — ASSET PURCHASES RESUME" : heavyQT ? "AGGRESSIVE QT — BALANCE SHEET TO SHRINK FAST" : "BALANCE SHEET HELD STEADY",
      subhead: heavyQE ? `The Reserve will buy ${Math.round(15 + pol.qe * 8)}bn of assets over six months. ${pol.assetMix > 0.7 ? "Almost entirely government bonds — lowering public borrowing costs." : pol.assetMix < 0.3 ? "Weighted to corporate debt — propping up firms directly." : "A balanced mix of gov and corporate paper."}` : heavyQT ? `Selling pace doubles. ${pol.assetMix > 0.7 ? "Gov bonds first — gilts under pressure already." : "Corporate paper unwinding — credit spreads widening."}` : "Reinvestment continues at maturity. No fireworks. Markets call it 'consistent'.",
      kicker: heavyQE ? "Gilt yields fell 18bps within an hour" : heavyQT ? "10-year yields up 25bps — biggest one-day move in 18 months" : "",
    },
    {
      type: "scene",
      who: looseInnov ? "Fintech founder" : tightMacroPru ? "Mortgage broker" : "Single mum, Keldra",
      role: looseInnov ? "New lending platform · Series A" : tightMacroPru ? "Twelve phones ringing" : "Three jobs, two kids",
      color: C.coral,
      icon: looseInnov ? "💡" : tightMacroPru ? "📞" : "👩",
      line: looseInnov ? "We can finally launch the SME credit product. Three years of working group meetings. The Reserve just unlocked it overnight. Our investors are calling already." : tightMacroPru ? "Twenty-eight files declined this morning. New LTI cap. New affordability tests. People who were approved last month aren't approved today. I'm explaining this on the phone all day." : "I work three jobs. Rent's up twice this year. Food's up. The Reserve looked at this and " + (hike ? "raised rates" : cut ? "cut rates" : "did nothing") + ". I don't know what to tell my kids.",
      detail: looseInnov ? "Sector commentary: regulatory shift opens ₺2bn TAM" : tightMacroPru ? "First-time buyer applications down 31% week-on-week" : "Real wages down 4.2% YoY",
    },
    {
      type: "protest",
      color: C.coral,
      bigHeadline: hike ? "PROTESTS OUTSIDE THE RESERVE" : cut ? "PENSIONERS STORM THE PLAZA" : "'DO SOMETHING' MARCH — THOUSANDS",
      subhead: hike ? "Crowd of around 1,400 by 4pm. Banners read 'YOU CHOSE THIS PAIN'. Riot police deployed at 5:15. Three arrests for criminal damage to the Reserve gates." : cut ? "An estimated 900 pensioners gathered on the Plaza. Former Governor Hadi spoke for nine minutes — most of it boos. Mounted police now stationed nearby." : "Estimated 2,200 protesters from rent unions, debt charities and youth groups marching from Riverside to the Reserve. 'YOU SAW US. YOU DID NOTHING.' on twelve-foot banners.",
      kicker: hike ? "Three arrests · police presence to remain through night" : cut ? "Letter to the Times signed by 1,200 pensioners" : "Six MPs joined the march. The Speaker has 'concerns'.",
    },
    // Liquidity & macropru scene (NEW)
    {
      type: "scene",
      who: fullLiquidity ? "Bond trader" : tightMacroPru ? "Estate agent" : "Bank CEO",
      role: fullLiquidity ? "Sovereign desk" : tightMacroPru ? "Riverside branch" : "Tier 2 lender",
      color: C.blue,
      icon: fullLiquidity ? "📈" : tightMacroPru ? "🏘" : "🏦",
      line: fullLiquidity ? "Liquidity facilities at full standby. We're sleeping better tonight. Repo markets functioning normally even after the announcement." : tightMacroPru ? "Three sales fell through in an hour. Mortgage tests just got hard. We're advising buyers to come back in March. The market is going to hibernate." : pol.innovation < -0.5 ? "Innovation policy got tightened. Our new product launch is on ice until further notice. Compliance is rewriting the playbook." : "Quiet day on our end. Spreads where they were. Nothing dramatic.",
      detail: fullLiquidity ? "Backstop facilities: ₺40bn available · ₺0 drawn" : tightMacroPru ? "Mortgage approvals projected -22% next quarter" : "Capital ratios unchanged",
    },
    {
      type: "headline",
      paper: "PUBLIC BROADCASTER · 6PM NEWS",
      color: C.teal,
      bigHeadline: harshStatement ? "GOVERNOR FACES CALLS TO RESIGN" : hike ? "FINANCE MINISTER 'DEEPLY CONCERNED'" : cut ? "SHADOW MINISTER: 'INFLATIONARY GAMBLE'" : "OPPOSITION: 'A FAILURE OF NERVE'",
      subhead: harshStatement ? "Two backbench MPs and a former MPC member have publicly called the statement 'unbecoming'. Number 11 has declined to comment. The press lobby is openly hostile." : hike ? "Cross-party pressure mounting. The Finance Minister gave a thirty-second doorstep that pundits are calling 'pointed'." : cut ? "The pound under pressure. The IMF released a statement 'noting' the cut. Currency markets reading that as 'concerned'." : "The opposition leader: 'Inflation is robbing this country and the Governor stared at it and did nothing.' Live debate scheduled tomorrow at 11am.",
      kicker: "Approval rating: " + (harshStatement ? "29% (-14)" : hike ? "41% (-6)" : cut ? "46% (-3)" : "34% (-13)"),
    },
    {
      type: "scene",
      who: "TalkBack Live · phone-in",
      role: "National radio · prime time",
      color: C.gold,
      icon: "📻",
      line: hike ? "Caller after caller. 'I voted for safety and the Reserve raised my mortgage.' 'My business is over.' Host can't get a word in. Lines jammed forty minutes." : cut ? "Caller after caller. 'My mum's been saving since the 70s and you've cut her interest in half.' Twenty texts to the show every minute." : "Caller after caller. 'You SAW the inflation. You SAW the prices. You did NOTHING.' Host tries to defend. Caller hangs up.",
      detail: "Listeners reporting they switched off in disgust",
    },
    {
      type: "summary",
      who: "Governor Nara",
      role: "End of the day · committee room",
      color: C.teal,
      icon: "🏛",
      line: harshStatement ? "Right. We need to talk about the statement. Not the decision — the decision is defensible. The wording will be remembered." : "Right. Well. You used all the tools. Some agreed. Some are calling for your head. Welcome to the job. Get some sleep — we do this again in six weeks.",
      detail: `Bank rate ${pct(rate)} · ${heavyQE ? "QE active" : heavyQT ? "QT active" : "balance sheet steady"} · macropru ${tightMacroPru ? "tightened" : "held"} · guidance ${state.guidance}`,
    },
  ];

  const cur = scenes[state.montageStep];
  const done = state.montageStep >= scenes.length;
  if (done) { setTimeout(() => dispatch({ type: "MONTAGE_END" }), 100); return null; }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(8,4,18,0.94)", zIndex: 38, display: "flex", flexDirection: "column", padding: 30, justifyContent: "center" }}>
      <SkipButton onSkip={() => dispatch({ type: "MONTAGE_END" })} label="SKIP TO BED" />
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.3em", fontWeight: 700 }}>THE WEEK YOU MADE · {state.montageStep + 1} / {scenes.length}</div>
        <div style={{ fontFamily: FONT_H, fontSize: 32, color: C.surface, fontWeight: 600, marginTop: 2 }}>What happened next</div>
      </div>
      <div style={{ maxWidth: 760, width: "100%", margin: "0 auto" }}>
        {(cur.type === "headline" || cur.type === "protest") && (
          <div className="popupIn" style={{ background: cur.type === "protest" ? "#1a0808" : C.surface, border: `4px solid ${cur.color}`, padding: 28, borderRadius: 4 }}>
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: cur.color, letterSpacing: "0.3em", fontWeight: 700, paddingBottom: 8, borderBottom: `2px solid ${cur.color}`, marginBottom: 14 }}>{cur.paper || "BREAKING"}</div>
            <div style={{ fontFamily: FONT_D, fontSize: 38, color: cur.type === "protest" ? C.surface : C.ink, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 10 }}>{cur.bigHeadline}</div>
            <div style={{ fontFamily: FONT_D, fontSize: 17, color: cur.type === "protest" ? C.textCreamDim : C.text, fontWeight: 500, lineHeight: 1.4, marginBottom: cur.kicker ? 12 : 0 }}>{cur.subhead}</div>
            {cur.kicker && (
              <div style={{ background: cur.color, color: cur.type === "protest" ? C.ink : "#fff", padding: "8px 14px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", display: "inline-block", borderRadius: 2 }}>
                {cur.kicker}
              </div>
            )}
          </div>
        )}
        {(cur.type === "scene" || cur.type === "summary") && (
          <div className="popupIn" style={{ background: C.surface, border: `3px solid ${cur.color}`, borderRadius: 8, padding: 26, boxShadow: `0 20px 60px ${cur.color}40` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: cur.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{cur.icon}</div>
              <div>
                <div style={{ fontFamily: FONT_D, fontSize: 22, color: C.ink, fontWeight: 800 }}>{cur.who}</div>
                <div style={{ fontFamily: FONT_M, fontSize: 10, color: cur.color, letterSpacing: "0.22em", fontWeight: 700 }}>{cur.role.toUpperCase()}</div>
              </div>
            </div>
            <div style={{ fontFamily: FONT_D, fontSize: 19, color: C.ink, lineHeight: 1.45, fontStyle: "italic", fontWeight: 500, marginBottom: 12 }}>"{cur.line}"</div>
            {cur.detail && (
              <div style={{ background: C.surface2, padding: "8px 12px", borderRadius: 4, fontFamily: FONT_M, fontSize: 11, color: cur.color, fontWeight: 700, letterSpacing: "0.1em", borderLeft: `3px solid ${cur.color}` }}>
                {cur.detail}
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
          <button onClick={() => dispatch({ type: "MONTAGE_NEXT" })} style={{ background: C.coral, color: "#fff", border: "none", padding: "13px 30px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", cursor: "pointer", borderRadius: 4, boxShadow: "0 8px 24px rgba(255,71,87,0.4)" }}>
            {state.montageStep < scenes.length - 1 ? "NEXT →" : "GO BACK TO THE CITY →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SleepAnimation({ state, dispatch }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("dimming"); // dimming → night → dawn → done
  const [phaseText, setPhaseText] = useState("Closing your eyes...");

  useEffect(() => {
    const startedAt = performance.now();
    let raf;
    const tick = (now) => {
      const elapsed = (now - startedAt) / 1000; // seconds
      // Total animation: 4.5 seconds
      // 0–1.5s: dimming (sky darkens, sun sets)
      // 1.5–2.8s: deep night (moon high, stars)
      // 2.8–4.0s: dawn (sky brightens)
      // 4.0–4.5s: morning (commit state change)
      if (elapsed < 1.5) {
        const p = elapsed / 1.5;
        setProgress(p * 50);
        if (p > 0.5 && phaseText !== "Night falling...") setPhaseText("Night falling...");
      } else if (elapsed < 2.8) {
        setProgress(50);
        if (phaseText !== "Deep into sleep...") setPhaseText("Deep into sleep...");
      } else if (elapsed < 4.0) {
        const p = (elapsed - 2.8) / 1.2;
        setProgress(50 + p * 50);
        if (phaseText !== "Dawn breaks over Varena...") setPhaseText("Dawn breaks over Varena...");
      } else if (elapsed < 4.5) {
        setProgress(100);
        if (phaseText !== "Tuesday morning.") setPhaseText("Tuesday morning.");
      } else {
        dispatch({ type: "SLEEP_TO_DAY_2" });
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line

  // Sky color based on progress
  const t = progress / 100;
  // Day (sunset) → Night (deep) → Dawn → Morning
  let skyTop, skyMid, skyBot;
  if (t < 0.3) {
    // Day → dusk
    const p = t / 0.3;
    skyTop = `rgb(${Math.round(42 - 38*p)}, ${Math.round(20 - 14*p)}, ${Math.round(56 - 24*p)})`;
    skyMid = `rgb(${Math.round(90 - 80*p)}, ${Math.round(44 - 38*p)}, ${Math.round(90 - 60*p)})`;
    skyBot = `rgb(${Math.round(255 - 215*p)}, ${Math.round(142 - 130*p)}, ${Math.round(110 - 80*p)})`;
  } else if (t < 0.6) {
    // Deep night
    skyTop = "rgb(4, 1, 20)";
    skyMid = "rgb(10, 6, 31)";
    skyBot = "rgb(26, 10, 46)";
  } else {
    // Dawn → morning
    const p = (t - 0.6) / 0.4;
    skyTop = `rgb(${Math.round(4 + 86*p)}, ${Math.round(1 + 53*p)}, ${Math.round(20 + 92*p)})`;
    skyMid = `rgb(${Math.round(10 + 150*p)}, ${Math.round(6 + 66*p)}, ${Math.round(31 + 97*p)})`;
    skyBot = `rgb(${Math.round(26 + 229*p)}, ${Math.round(10 + 196*p)}, ${Math.round(46 + 96*p)})`;
  }

  // Moon position (rises during night, sets during dawn)
  const moonY = t < 0.5 ? 200 - t * 240 : 80 + (t - 0.5) * 240;
  const moonOpacity = t > 0.15 && t < 0.85 ? Math.min(1, Math.min((t - 0.15) * 5, (0.85 - t) * 5)) : 0;
  // Sun rises in last 30%
  const sunY = t > 0.7 ? 500 - (t - 0.7) * 1200 : 600;
  const sunOpacity = t > 0.7 ? Math.min(1, (t - 0.7) * 3.3) : 0;
  // Stars visible during 30%-70%
  const starOpacity = t > 0.25 && t < 0.75 ? Math.min(1, Math.min((t - 0.25) * 4, (0.75 - t) * 4)) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 14, right: 24, zIndex: 60, pointerEvents: "auto" }}>
        <button onClick={() => dispatch({ type: "SLEEP_TO_DAY_2" })} style={{
          background: "rgba(8,12,30,0.7)",
          color: C.textCreamDim,
          border: `1px solid rgba(245,184,46,0.3)`,
          padding: "8px 16px",
          fontFamily: FONT_M, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em",
          cursor: "pointer", borderRadius: 2,
          backdropFilter: "blur(4px)",
          transition: "all 0.15s",
        }} onMouseOver={(e) => { e.currentTarget.style.background = C.coral; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.coral; }}
           onMouseOut={(e) => { e.currentTarget.style.background = "rgba(8,12,30,0.7)"; e.currentTarget.style.color = C.textCreamDim; e.currentTarget.style.borderColor = "rgba(245,184,46,0.3)"; }}>
          WAKE UP →→
        </button>
      </div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg viewBox="0 0 1500 720" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id="sleepSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="50%" stopColor={skyMid} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1500" height="720" fill="url(#sleepSky)" />

        {/* Stars */}
        {starOpacity > 0 && Array.from({ length: 80 }).map((_, i) => {
          const sx = (i * 197) % 1500;
          const sy = 40 + ((i * 71) % 340);
          const tw = 0.7 + ((i * 13) % 100) / 100;
          return <circle key={i} cx={sx} cy={sy} r={tw} fill="#fff8ee" opacity={starOpacity * (0.4 + (i % 5) * 0.12)}>
            <animate attributeName="opacity" values={`${starOpacity * 0.3};${starOpacity};${starOpacity * 0.3}`} dur={`${2 + (i % 4)}s`} repeatCount="indefinite" />
          </circle>;
        })}

        {/* Moon */}
        {moonOpacity > 0 && (
          <g opacity={moonOpacity}>
            <circle cx="1100" cy={moonY} r="120" fill="#fff8ee" opacity="0.15" />
            <circle cx="1100" cy={moonY} r="80" fill="#fff8ee" opacity="0.3" />
            <circle cx="1100" cy={moonY} r="54" fill="#fff8ee" />
            <circle cx="1115" cy={moonY - 12} r="8" fill="#e8d8b8" opacity="0.6" />
            <circle cx="1085" cy={moonY + 18} r="6" fill="#e8d8b8" opacity="0.6" />
            <circle cx="1120" cy={moonY + 22} r="4" fill="#e8d8b8" opacity="0.4" />
          </g>
        )}

        {/* Sun rising */}
        {sunOpacity > 0 && (
          <g opacity={sunOpacity}>
            <circle cx="350" cy={sunY} r="160" fill="#ffce8e" opacity="0.18" />
            <circle cx="350" cy={sunY} r="110" fill="#ffce8e" opacity="0.32" />
            <circle cx="350" cy={sunY} r="70" fill="#ffd28e" />
          </g>
        )}

        {/* Silhouette of city hill — kept dark throughout */}
        <path d="M 0 600 L 0 540 L 250 540 L 380 460 L 600 460 L 750 380 L 1500 380 L 1500 720 L 0 720 Z" fill="#0a0418" opacity="0.95" />
        {/* Little building silhouettes */}
        <rect x="80" y="490" width="60" height="50" fill="#0a0418" />
        <rect x="180" y="500" width="40" height="40" fill="#0a0418" />
        <rect x="450" y="410" width="50" height="50" fill="#0a0418" />
        <rect x="850" y="320" width="40" height="60" fill="#0a0418" />
        <rect x="950" y="290" width="50" height="90" fill="#0a0418" />
        <rect x="1100" y="270" width="80" height="110" fill="#0a0418" />
        <rect x="1140" y="200" width="10" height="70" fill="#0a0418" />

        {/* Window lights on city — flicker on at night */}
        {starOpacity > 0 && (
          <g opacity={starOpacity}>
            <rect x="92" y="500" width="6" height="6" fill="#ffce8e" />
            <rect x="110" y="510" width="6" height="6" fill="#ffce8e" />
            <rect x="92" y="520" width="6" height="6" fill="#ffce8e" />
            <rect x="190" y="510" width="4" height="4" fill="#ffce8e" />
            <rect x="200" y="520" width="4" height="4" fill="#ffce8e" />
            <rect x="462" y="425" width="6" height="6" fill="#ffce8e" />
            <rect x="478" y="430" width="6" height="6" fill="#ffce8e" />
            <rect x="858" y="335" width="5" height="5" fill="#ffce8e" />
            <rect x="858" y="355" width="5" height="5" fill="#ffce8e" />
            <rect x="958" y="300" width="6" height="6" fill="#ffce8e" />
            <rect x="975" y="320" width="6" height="6" fill="#ffce8e" />
            <rect x="975" y="340" width="6" height="6" fill="#ffce8e" />
            <rect x="1110" y="280" width="8" height="8" fill="#ffce8e" />
            <rect x="1125" y="295" width="8" height="8" fill="#ffce8e" />
            <rect x="1145" y="280" width="8" height="8" fill="#ffce8e" />
          </g>
        )}

        {/* "Zzz" floating during night */}
        {t > 0.3 && t < 0.75 && (
          <g opacity={Math.min(1, Math.min((t - 0.3) * 6, (0.75 - t) * 6))}>
            <text x="750" y="220" fontFamily={FONT_H} fontSize="80" fontWeight="600" fill="#fff8ee" opacity="0.6">Zzz<animate attributeName="y" values="220;200;220" dur="3s" repeatCount="indefinite" /></text>
          </g>
        )}
      </svg>

      {/* Text overlay */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 130, textAlign: "center", color: "#fff8ee" }}>
        <div style={{ fontFamily: FONT_H, fontSize: 52, fontWeight: 600, textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>{phaseText}</div>
      </div>

      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

function NotificationToasts({ notifications, dispatch }) {
  useEffect(() => {
    const t = (notifications || []).map((n) => setTimeout(() => dispatch({ type: "DISMISS_NOTIF", id: n.id }), 5000));
    return () => t.forEach(clearTimeout);
  }, [notifications, dispatch]);
  if (!notifications || notifications.length === 0) return null;
  return (
    <div style={{ position: "absolute", bottom: 140, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 18, pointerEvents: "none", maxWidth: 320 }}>
      {notifications.slice(0, 3).map((n) => (
        <div key={n.id} className="popupIn" style={{ background: C.surface, border: `1.5px solid ${C.borderCream}`, borderLeft: `4px solid ${n.color || C.coral}`, borderRadius: 6, padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14 }}>{n.icon || "💬"}</span>
            <span style={{ fontFamily: FONT_M, fontSize: 9, color: n.color || C.coral, letterSpacing: "0.2em", fontWeight: 700 }}>{n.from || "VARENA"}</span>
          </div>
          <div style={{ fontFamily: FONT_D, fontSize: 13, color: C.ink, fontWeight: 600, lineHeight: 1.35 }}>{n.title}</div>
          {n.body && <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.4, marginTop: 3 }}>{n.body}</div>}
        </div>
      ))}
    </div>
  );
}

function Popups({ popups, dispatch }) {
  useEffect(() => {
    const t = popups.map((p) => setTimeout(() => dispatch({ type: "DISMISS_POPUP", id: p.id }), 3200));
    return () => t.forEach(clearTimeout);
  }, [popups, dispatch]);
  return (
    <div style={{ position: "absolute", top: 110, left: 22, display: "flex", flexDirection: "column", gap: 8, zIndex: 6, pointerEvents: "none" }}>
      {popups.map((p) => (
        <div key={p.id} className="popupIn" style={{ background: p.type === "badge" ? C.purple : p.type === "level" ? C.gold : p.type === "note" ? C.green : p.type === "quest" ? C.coral : C.blue, color: "#fff", padding: "11px 18px", borderRadius: 4, minWidth: 240, boxShadow: "0 10px 30px rgba(26,16,8,0.25)" }}>
          <div style={{ fontFamily: FONT_D, fontSize: 15, fontWeight: 600 }}>{p.text}</div>
          {p.sub && <div style={{ fontSize: 11, opacity: 0.95, fontFamily: FONT_M, marginTop: 2, letterSpacing: "0.08em" }}>{p.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── INTRO ──────────────────────────────────────────────────
function IntroScreen({ onStart, canResume, onResume }) {
  // Sequential reveal: 0=sky only, 1=buildings rise, 2=title text, 3=reserve glows, 4=desc+button
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),    // buildings rise
      setTimeout(() => setPhase(2), 2200),   // title appears
      setTimeout(() => setPhase(3), 4400),   // reserve glow on
      setTimeout(() => setPhase(4), 5600),   // description + button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Allow click-to-skip to end of animation
  const skip = () => setPhase(4);

  return (
    <div onClick={phase < 4 ? skip : undefined} style={{ position: "absolute", inset: 0, background: "#04060f", zIndex: 50, overflow: "hidden", cursor: phase < 4 ? "pointer" : "default" }}>
      {/* Letterbox top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48, background: "#000", zIndex: 5, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.coral, animation: "pulse 1.4s infinite" }} />
          <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.34em", fontWeight: 800 }}>LIFESMART × BANK OF ENGLAND · PROTOTYPE</div>
        </div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>v26 · THE LEARNING ECONOMY</div>
      </div>

      {/* Full-bleed cityscape */}
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#04060f" />
            <stop offset="40%" stopColor="#0a1230" />
            <stop offset="75%" stopColor="#2a1c4a" />
            <stop offset="92%" stopColor={C.skyDawn} />
            <stop offset="100%" stopColor={C.skyHorizon} />
          </linearGradient>
          <radialGradient id="sunGlow" cx="0.5" cy="0.5">
            <stop offset="0%" stopColor="#fff8ee" stopOpacity="1" />
            <stop offset="50%" stopColor={C.gold} stopOpacity="0.4" />
            <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="1600" height="900" fill="url(#skyGrad)" />

        {/* Stars (top) */}
        {Array.from({ length: 60 }).map((_, i) => (
          <circle key={i} cx={(i * 137) % 1600} cy={((i * 89) % 350)} r={0.4 + (i % 3) * 0.3} fill="#fff8ee" opacity={0.4 + (i % 3) * 0.2}>
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Sun glow */}
        <circle cx="1200" cy="500" r="320" fill="url(#sunGlow)" />
        <circle cx="1200" cy="500" r="80" fill="#fff8ee" opacity="0.95" />
        <circle cx="1200" cy="500" r="60" fill="#fff8ee" />

        {/* Distant mountains */}
        <path d="M 0 580 Q 200 520 350 560 Q 500 510 700 550 Q 900 500 1100 540 Q 1300 510 1600 550 L 1600 900 L 0 900 Z" fill="#0a0f24" opacity="0.7" />

        {/* Mid skyline */}
        <path d="M 0 640 L 60 640 L 60 580 L 100 580 L 100 620 L 160 620 L 160 540 L 220 540 L 220 600 L 280 600 L 280 560 L 340 560 L 340 620 L 400 620 L 400 580 L 460 580 L 460 640 L 520 640 L 520 590 L 580 590 L 580 620 L 640 620 L 640 540 L 720 540 L 720 620 L 1600 620 L 1600 900 L 0 900 Z" fill="#0f1530" />

        {/* Foreground: the financial district — rises from below */}
        <g style={{
          transformOrigin: "center bottom",
          transform: phase >= 1 ? "translateY(0)" : "translateY(360px)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "transform 1.4s cubic-bezier(0.34, 1.2, 0.5, 1), opacity 0.8s ease-out",
        }}>
          {/* The Reserve — neoclassical monument with dome */}
          <g transform="translate(800, 540)">
            {/* Aura — pulses on phase >= 3 */}
            <circle cx="0" cy="0" r="280" fill={C.gold} style={{ opacity: phase >= 3 ? 0.28 : 0.06, transition: "opacity 1.2s" }}>
              {phase >= 3 && <animate attributeName="opacity" values="0.18;0.4;0.18" dur="2.4s" repeatCount="indefinite" />}
            </circle>
            <circle cx="0" cy="-40" r="160" fill={C.goldBright} style={{ opacity: phase >= 3 ? 0.45 : 0.08, transition: "opacity 1.2s" }}>
              {phase >= 3 && <animate attributeName="opacity" values="0.25;0.6;0.25" dur="2.4s" repeatCount="indefinite" />}
            </circle>
            {/* Main body */}
            <rect x="-100" y="0" width="200" height="180" fill={C.gold} />
            <rect x="-100" y="0" width="200" height="180" fill="url(#skyGrad)" opacity="0.3" />
            {/* Columns */}
            {[-80, -50, -20, 10, 40, 70].map((x, i) => (
              <g key={i}>
                <rect x={x - 6} y="20" width="12" height="140" fill="#0a0f24" opacity="0.4" />
                <rect x={x - 8} y="14" width="16" height="8" fill={C.goldBright} />
                <rect x={x - 8} y="160" width="16" height="6" fill={C.goldBright} />
              </g>
            ))}
            {/* Pediment */}
            <polygon points="-110,14 110,14 0,-30" fill={C.goldBright} />
            <polygon points="-110,14 110,14 0,-30" fill="#0a0f24" opacity="0.1" />
            {/* Dome */}
            <ellipse cx="0" cy="-25" rx="50" ry="40" fill={C.gold} />
            <ellipse cx="0" cy="-30" rx="45" ry="35" fill={C.goldBright} />
            <rect x="-3" y="-90" width="6" height="30" fill="#0a0f24" />
            <polygon points="-10,-90 10,-90 5,-100 -5,-100" fill={C.coral} />
            <circle cx="0" cy="-100" r="3" fill={C.gold} />
            {/* Extra glow rim when activated */}
            {phase >= 3 && (
              <g>
                <rect x="-100" y="0" width="200" height="180" fill={C.goldBright} opacity="0.15">
                  <animate attributeName="opacity" values="0.05;0.25;0.05" dur="2.4s" repeatCount="indefinite" />
                </rect>
                <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#fff8ee" opacity="0.3">
                  <animate attributeName="opacity" values="0.15;0.45;0.15" dur="2.4s" repeatCount="indefinite" />
                </ellipse>
              </g>
            )}
            {/* Steps */}
            <rect x="-130" y="170" width="260" height="6" fill={C.bReserveD} />
            <rect x="-140" y="176" width="280" height="6" fill="#3a2418" />
            {/* Sign */}
            <rect x="-50" y="60" width="100" height="22" fill="#0a0f24" />
            <text x="0" y="76" textAnchor="middle" fill={C.gold} fontFamily={FONT_M} fontSize="11" fontWeight="800" letterSpacing="0.2em">RESERVE</text>
          </g>

          {/* Other tall buildings */}
          {[
            { x: 200, w: 80, h: 280, c: C.bStocks },
            { x: 350, w: 60, h: 220, c: C.bBank },
            { x: 440, w: 70, h: 320, c: C.bMarket },
            { x: 560, w: 60, h: 260, c: C.bCinema },
            { x: 1030, w: 70, h: 290, c: C.bStocks },
            { x: 1130, w: 80, h: 240, c: C.bBank },
            { x: 1240, w: 60, h: 320, c: C.bMarket },
            { x: 1340, w: 70, h: 270, c: C.bCinema },
            { x: 1450, w: 80, h: 220, c: C.bFlat },
          ].map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={720 - b.h} width={b.w} height={b.h} fill={b.c} opacity="0.85" />
              <rect x={b.x} y={720 - b.h} width={b.w} height={b.h} fill="#0a0f24" opacity="0.35" />
              {/* Windows */}
              {Array.from({ length: Math.floor(b.h / 30) }).map((_, j) => (
                <g key={j}>
                  <rect x={b.x + 8} y={720 - b.h + 20 + j * 30} width="6" height="10" fill={C.gold} opacity="0.85" />
                  <rect x={b.x + 22} y={720 - b.h + 20 + j * 30} width="6" height="10" fill={C.coral} opacity="0.7" />
                  <rect x={b.x + 36} y={720 - b.h + 20 + j * 30} width="6" height="10" fill={C.goldBright} opacity="0.85" />
                  {b.w > 65 && <rect x={b.x + 50} y={720 - b.h + 20 + j * 30} width="6" height="10" fill={C.teal} opacity="0.7" />}
                </g>
              ))}
            </g>
          ))}

          {/* Street level */}
          <rect x="0" y="720" width="1600" height="180" fill="#0a0f24" />
        </g>

        {/* Light shafts */}
        <polygon points="1100,520 1300,520 1500,900 900,900" fill="#fff8ee" opacity="0.06" />
        <polygon points="500,400 700,400 600,900 200,900" fill="#fff8ee" opacity="0.04" />
      </svg>

      {/* Dramatic dust motes */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <circle key={i} cx={(i * 137) % 1600} cy={400 + (i * 89) % 400} r={0.6 + (i % 3) * 0.4} fill="#fff8ee">
            <animate attributeName="cy" values={`${400 + (i * 89) % 400};${380 + (i * 89) % 400};${400 + (i * 89) % 400}`} dur={`${4 + (i % 5)}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.7;0.1" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Title overlay — sequential phased reveal */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, padding: "0 60px" }}>
        {/* Translucent backing for the title block — fades in with the text, keeps buildings visible */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "min(1100px, 86%)", height: 360,
          background: "radial-gradient(ellipse at center, rgba(4,6,15,0.78) 0%, rgba(4,6,15,0.55) 55%, rgba(4,6,15,0) 100%)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 1.2s",
          pointerEvents: "none",
        }} />
        <div style={{
          fontFamily: FONT_H, fontSize: 36, color: C.coral, fontWeight: 600, marginBottom: 8,
          textShadow: "0 2px 18px rgba(0,0,0,0.8)",
          opacity: phase >= 2 ? 0.95 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.9s 0.0s, transform 0.9s 0.0s",
          position: "relative", zIndex: 1,
        }}>a central-bank story</div>
        <div style={{
          fontFamily: FONT_D, fontSize: 160, color: C.textCream, fontWeight: 900,
          letterSpacing: "-0.06em", lineHeight: 0.85,
          textShadow: "0 12px 60px rgba(0,0,0,0.85), 0 2px 12px rgba(0,0,0,0.6)",
          marginBottom: 4,
          opacity: phase >= 2 ? 1 : 0,
          animation: phase >= 2 ? "letterPop 1.1s 0.4s both" : "none",
          position: "relative", zIndex: 1,
        }}>GREAT VOSTAN</div>
        <div style={{
          fontFamily: FONT_H, fontSize: 36, color: C.gold, fontWeight: 600,
          textShadow: "0 2px 18px rgba(0,0,0,0.8)",
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.9s 1.2s, transform 0.9s 1.2s",
          position: "relative", zIndex: 1,
        }}>the living economy</div>

        <div style={{
          marginTop: 50, maxWidth: 760, textAlign: "center",
          padding: "18px 28px",
          background: "rgba(4,6,15,0.72)",
          borderTop: `2px solid ${C.gold}66`,
          borderBottom: `2px solid ${C.gold}66`,
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.8s 0.0s, transform 0.8s 0.0s",
          position: "relative", zIndex: 1,
          backdropFilter: "blur(2px)",
        }}>
          <p style={{ fontFamily: FONT_D, fontSize: 22, color: C.textCream, lineHeight: 1.45, margin: 0, fontWeight: 500 }}>
            You're not just starting a job. You're about to become a key decision-maker at the <span style={{ color: C.gold, fontWeight: 700 }}>Bank of Vostan</span>.<br/>
            Today: walk through Varena and meet the people who'll feel your decisions.<br/>
            Tomorrow: walk into the Bank of Vostan and decide.
          </p>
        </div>

        <button onClick={onStart} style={{
          marginTop: 48, background: C.coral, color: "#fff", border: `2px solid ${C.gold}`,
          padding: "22px 64px", fontFamily: FONT_M, fontSize: 14, fontWeight: 800, letterSpacing: "0.36em",
          cursor: phase >= 4 ? "pointer" : "default",
          boxShadow: `0 24px 80px ${C.coral}, 0 0 0 6px rgba(245,184,46,0.18)`, borderRadius: 2,
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.8s 0.4s, transform 0.8s 0.4s, box-shadow 0.15s",
          pointerEvents: phase >= 4 ? "auto" : "none",
          display: "inline-flex", alignItems: "center", gap: 14,
        }} onMouseOver={(e) => { if (phase >= 4) { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = `0 30px 100px ${C.coral}, 0 0 0 10px rgba(245,184,46,0.28)`; } }}
           onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 24px 80px ${C.coral}, 0 0 0 6px rgba(245,184,46,0.18)`; }}>
          BEGIN
          <span style={{ fontSize: 20, animation: "pulse 1.6s infinite" }}>→</span>
        </button>

        {/* v26 — resume a saved run */}
        {canResume && (
          <button onClick={(e) => { e.stopPropagation(); onResume && onResume(); }} style={{
            marginTop: 16, background: "transparent", color: C.gold, border: `1.5px solid ${C.gold}`,
            padding: "13px 36px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.3em",
            cursor: phase >= 4 ? "pointer" : "default", borderRadius: 2,
            opacity: phase >= 4 ? 1 : 0, transition: "opacity 0.8s 0.7s",
            pointerEvents: phase >= 4 ? "auto" : "none",
          }}>↻ RESUME SAVED GAME</button>
        )}

        {/* "click to skip" hint during animation */}
        {phase < 4 && (
          <div style={{
            position: "absolute", bottom: 80, fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim,
            letterSpacing: "0.28em", opacity: 0.6, animation: "pulse 2s infinite",
          }}>CLICK ANYWHERE TO SKIP</div>
        )}
      </div>

      {/* Bottom letterbox */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "#000", zIndex: 5, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.textCreamDim, letterSpacing: "0.22em" }}>VARENA · CAPITAL OF GREAT VOSTAN · POPULATION 9.8M</div>
        <div style={{ fontFamily: FONT_M, fontSize: 9, color: C.gold, letterSpacing: "0.32em", fontWeight: 800 }}>● ENTER FULLSCREEN FOR BEST EXPERIENCE</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showIntro, setShowIntro] = useState(true);
  const [showControlsHint, setShowControlsHint] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => !SFX.isMuted());
  const [hasSave, setHasSave] = useState(false);
  const toggleSound = () => { const m = !SFX.isMuted(); SFX.setMuted(m); setSoundOn(!m); if (!m) SFX.coin(); };

  // Click ripple — small gold burst at the cursor on every click. Looks great on camera.
  const [ripples, setRipples] = useState([]);
  useEffect(() => {
    const onClick = (e) => {
      // Only ripple on left-clicks. Skip if target is inside an input/range/textarea.
      if (e.button !== 0) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const id = Math.random().toString(36).slice(2, 8);
      setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);
      SFX.click();
      setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 720);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  // v26 — Esc toggles the pause menu
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape" && !showIntro) setPauseOpen((p) => !p); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [showIntro]);

  // v26 — auto-save so a school lesson can stop and resume
  useEffect(() => {
    try { if (window.localStorage?.getItem("gv_save_v26")) setHasSave(true); } catch (e) {}
  }, []);
  useEffect(() => {
    if (showIntro) return;
    const t = setTimeout(() => {
      try {
        const snapshot = { ...state, popups: [], notifications: [], openPanel: null, meetingActive: false, tradingFloorActive: false, pressActive: false, recoveryActive: false, newsroomActive: false, voiceActive: false, walkHomeActive: false, montageActive: false, sleepAnim: 0, target: null, moving: false, mapOpen: false, phoneOpen: false, thought: null };
        window.localStorage?.setItem("gv_save_v26", JSON.stringify(snapshot));
      } catch (e) {}
    }, 800);
    return () => clearTimeout(t);
  }, [state, showIntro]);

  const resumeSave = () => {
    try {
      const raw = window.localStorage?.getItem("gv_save_v26");
      if (raw) dispatch({ type: "LOAD_STATE", saved: JSON.parse(raw) });
    } catch (e) {}
    setShowIntro(false);
  };

  // Show controls hint briefly after intro dismisses
  useEffect(() => {
    if (!showIntro) {
      setShowControlsHint(true);
      const t = setTimeout(() => setShowControlsHint(false), 7000);
      return () => clearTimeout(t);
    }
  }, [showIntro]);

  // Step movement
  useEffect(() => {
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state.target !== null) dispatch({ type: "STEP_TO", dt });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state.target]);

  // Periodic notifications
  useEffect(() => {
    if (showIntro) return;
    const NOTIFS = [
      { from: "YUSUF", icon: "💬", color: C.coral, title: "Bro, my landlord just messaged. Rent up again.", body: "Third time this year." },
      { from: "VOSTAN TIMES", icon: "📰", color: C.purple, title: "Food prices jump again across Great Vostan", body: "Grocery basket up 6% this month." },
      { from: "AMARA", icon: "💬", color: C.bMarket, title: "Hi love, can I get a price on this oil?", body: "Suppliers won't talk. Everything's moving." },
      { from: "VARNGRAM", icon: "📱", color: C.rose, title: "@finance_bro_22 just posted", body: "\"This is why everyone should be buying gold rn 🚀\"" },
      { from: "BANK ALERT", icon: "💰", color: C.gold, title: "Your savings earned ₺1.20 in interest", body: "Set up auto-save to grow it faster." },
      { from: "DESTA", icon: "💬", color: C.bCoffee, title: "Loan came up for renewal. They want 9.5%.", body: "It was 6.5% last year. Same business." },
      { from: "RESERVE WIRE", icon: "🏦", color: C.gold, title: "Inflation data due Thursday", body: "Markets bracing." },
      { from: "MUM", icon: "💬", color: C.bFlat, title: "Saw your face on the news. Proud of you.", body: "Don't forget to eat." },
    ];
    let i = 0;
    const id = setInterval(() => {
      if (state.phoneOpen || state.meetingActive || state.openPanel) return;
      dispatch({ type: "PUSH_NOTIF", notif: NOTIFS[i % NOTIFS.length] });
      i++;
    }, 22000);
    // First one after 8s
    const first = setTimeout(() => {
      if (!state.phoneOpen && !state.meetingActive && !state.openPanel) {
        dispatch({ type: "PUSH_NOTIF", notif: NOTIFS[0] });
        i = 1;
      }
    }, 8000);
    return () => { clearInterval(id); clearTimeout(first); };
  }, [showIntro]); // eslint-disable-line

  // Keyboard
  useEffect(() => {
    const down = {};
    const handler = (e) => {
      if (state.openPanel || state.meetingActive || state.phoneOpen || state.mapOpen || showIntro) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") down.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") down.right = true;
      if ((e.key === "e" || e.key === "E")) {
        const { place, dist } = nearestPlace(state.px);
        if (place && dist < 140 && place.type !== "fountain") { dispatch({ type: "OPEN_PANEL", id: place.id }); return; }
        const { npc, dist: nd } = nearestNpc(state.px);
        if (npc && nd < 110) { dispatch({ type: "OPEN_PANEL", id: `npc-${npc.id}` }); }
      }
    };
    window.addEventListener("keydown", handler);
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (down.left && !down.right) dispatch({ type: "WALK", dir: -1, dt });
      else if (down.right && !down.left) dispatch({ type: "WALK", dir: 1, dt });
      else if (state.moving && state.target === null) dispatch({ type: "STOP" });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") down.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") down.right = false;
    };
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", up);
      cancelAnimationFrame(raf);
    };
  }, [state.px, state.openPanel, state.meetingActive, state.phoneOpen, state.mapOpen, showIntro, state.moving, state.target]);

  // Click-to-walk
  const onWorldClick = (e) => {
    if (state.openPanel || state.meetingActive || state.phoneOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const dir = fx < 0.5 ? -1 : 1;

    // Find the nearest NPC or building in the direction of the click
    const candidates = [];
    NPCS.forEach((n) => {
      if ((dir > 0 && n.x > state.px + 30) || (dir < 0 && n.x < state.px - 30)) {
        candidates.push({ x: n.x, kind: "npc" });
      }
    });
    BUILDINGS.forEach((p) => {
      if (p.type === "fountain") return;
      if ((dir > 0 && p.x > state.px + 30) || (dir < 0 && p.x < state.px - 30)) {
        candidates.push({ x: p.x, kind: "place" });
      }
    });
    candidates.sort((a, b) => Math.abs(a.x - state.px) - Math.abs(b.x - state.px));

    let newTarget;
    if (candidates.length > 0) {
      // Stop just before the nearest thing in that direction (within interaction range)
      newTarget = candidates[0].x - dir * 70;
    } else {
      // No thing in that direction — walk a moderate distance
      newTarget = state.px + dir * 400;
    }
    newTarget = Math.max(140, Math.min(WORLD_W - 140, newTarget));
    dispatch({ type: "WALK_TO", x: newTarget });
  };

  const nearestThing = (() => {
    const { place, dist: pd } = nearestPlace(state.px);
    const { npc, dist: nd } = nearestNpc(state.px);
    if (place && place.type !== "fountain" && pd < 140 && (!npc || pd < nd)) return { kind: "place", id: place.id, name: place.name };
    if (npc && nd < 110) return { kind: "npc", id: npc.id, name: npc.label };
    return { kind: null };
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; color: ${C.text}; font-family: ${FONT_B}; overflow: hidden; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popupIn { 0% { opacity: 0; transform: translateX(-30px) scale(0.9); } 70% { opacity: 1; transform: translateX(0) scale(1.05); } 100% { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes scan-line { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes glowPulse { 0%, 100% { filter: drop-shadow(0 0 6px currentColor); } 50% { filter: drop-shadow(0 0 16px currentColor); } }
        @keyframes riseUp { from { transform: translateY(120%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes reserveGlow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
        @keyframes letterPop { 0% { opacity: 0; transform: scale(0.3) translateY(40px); filter: blur(10px); } 60% { opacity: 1; transform: scale(1.08) translateY(0); filter: blur(0); } 100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } }
        @keyframes spawnPop { 0% { opacity: 0; transform: scale(0) translateY(-40px); } 35% { opacity: 1; transform: scale(1.4) translateY(0); } 55% { transform: scale(0.85) translateY(0); } 75% { transform: scale(1.08) translateY(0); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spawnDust { 0% { opacity: 0; transform: scale(0); } 30% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(2.4); } }
        @keyframes shake { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-4px, -2px) rotate(-0.4deg); } 20% { transform: translate(5px, 2px) rotate(0.5deg); } 30% { transform: translate(-3px, 3px) rotate(-0.3deg); } 40% { transform: translate(4px, -3px) rotate(0.4deg); } 50% { transform: translate(-5px, 1px) rotate(-0.5deg); } 60% { transform: translate(3px, 3px) rotate(0.3deg); } 70% { transform: translate(-3px, -2px) rotate(-0.2deg); } 80% { transform: translate(2px, 2px) rotate(0.2deg); } 90% { transform: translate(-1px, -1px) rotate(-0.1deg); } }
        @keyframes screenShake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-3px, 2px); } 50% { transform: translate(3px, -2px); } 75% { transform: translate(-2px, -3px); } }
        @keyframes redFlash { 0%, 100% { opacity: 0; } 30%, 50% { opacity: 0.35; } }
        @keyframes goldFlash { 0%, 100% { opacity: 0; } 30%, 50% { opacity: 0.45; } }
        @keyframes headlineStamp { 0% { opacity: 0; transform: scale(2.5) rotate(-12deg); filter: blur(8px); } 60% { opacity: 1; transform: scale(0.92) rotate(-3deg); filter: blur(0); } 80% { transform: scale(1.04) rotate(-2deg); } 100% { opacity: 1; transform: scale(1) rotate(-2deg); filter: blur(0); } }
        @keyframes spotlightSweep { 0% { opacity: 0; } 30% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0.5; } }
        @keyframes ceremonialPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes sceneFadeIn { 0% { opacity: 0; filter: brightness(0.3); } 100% { opacity: 1; filter: brightness(1); } }
        @keyframes clickRipple { 0% { transform: scale(0); opacity: 0.7; } 100% { transform: scale(4); opacity: 0; } }
        @keyframes idleWalk { 0%, 100% { transform: translateX(0) translateY(0); } 50% { transform: translateX(0) translateY(-1px); } }
        @keyframes windowFlicker { 0%, 80%, 100% { opacity: 1; } 82%, 85% { opacity: 0.3; } }
        @keyframes hintArrow { 0%, 100% { transform: translateY(0); opacity: 0.7; } 50% { transform: translateY(-6px); opacity: 1; } }
        @keyframes glowRing { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
        .shakeOnce { animation: shake 0.45s cubic-bezier(.36,.07,.19,.97); }
        .screenShakeOnce { animation: screenShake 0.3s; }
        .headlineStampIn { animation: headlineStamp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .ceremonialMode circle.ceremonial { animation: ceremonialPulse 1.2s ease-in-out infinite; }
        .popupIn { animation: popupIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        input[type=range] { height: 6px; -webkit-appearance: none; background: ${C.surface3}; border-radius: 3px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: ${C.coral}; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 6px rgba(26,16,8,0.3); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      `}</style>
      <div style={{ width: "100vw", height: "100vh", background: C.bg, position: "relative", overflow: "hidden", fontFamily: FONT_B }}>
        <div onClick={onWorldClick} style={{ width: "100%", height: "100%", cursor: "pointer" }}>
          <StreetScene state={state} dispatch={dispatch} nearestThing={nearestThing} />
        </div>
        {/* PULSE-INSPIRED: live macro data ticker — only on Day 1 walking world */}
        {!state.meetingActive && !state.openPanel && !state.tradingFloorActive && !state.walkHomeActive && !state.newsroomActive && !state.voiceActive && !state.pressActive && !state.recoveryActive && !state.montageActive && !state.sleepActive && <LiveTicker state={state} />}
        <HUD state={state} />
        <Popups popups={state.popups} dispatch={dispatch} />
        <NotificationToasts notifications={state.notifications} dispatch={dispatch} />
        <PhoneWidget state={state} dispatch={dispatch} />
        <button onClick={() => dispatch({ type: "TOGGLE_MAP" })} style={{ position: "absolute", top: 22, right: 22, background: C.surface, color: C.ink, border: `2px solid ${C.coral}`, padding: "10px 18px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", cursor: "pointer", borderRadius: 4, boxShadow: "0 6px 18px rgba(0,0,0,0.4)", zIndex: 8, display: "flex", alignItems: "center", gap: 8 }}>
          🗺 <span>MAP</span>
        </button>
        <button onClick={toggleSound} title="Toggle sound" style={{ position: "absolute", top: 70, right: 22, background: C.surface, color: C.ink, border: `2px solid ${soundOn ? C.teal : C.borderCream}`, padding: "8px 14px", fontFamily: FONT_M, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", cursor: "pointer", borderRadius: 4, boxShadow: "0 6px 18px rgba(0,0,0,0.4)", zIndex: 8 }}>
          {soundOn ? "🔊" : "🔇"}
        </button>
        {state.mapOpen && <TreasureMap state={state} dispatch={dispatch} />}

        <div style={{ position: "absolute", bottom: 24, left: 22, background: C.surface, border: `1.5px solid ${C.coral}`, borderRadius: 4, padding: "10px 18px", fontSize: 11, fontFamily: FONT_M, color: C.text, letterSpacing: "0.16em", fontWeight: 700, boxShadow: "0 6px 20px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 14 }}>
          <span><span style={{ background: C.ink, color: C.gold, padding: "2px 7px", borderRadius: 2, fontFamily: FONT_M, fontWeight: 800, marginRight: 4 }}>← →</span> WALK</span>
          <span style={{ color: C.borderCream }}>·</span>
          <span><span style={{ background: C.ink, color: C.gold, padding: "2px 7px", borderRadius: 2, fontFamily: FONT_M, fontWeight: 800, marginRight: 4 }}>E</span> TALK / ENTER</span>
          <span style={{ color: C.borderCream }}>·</span>
          <span>🗺 <span style={{ marginLeft: 4 }}>MAP</span></span>
          <span style={{ color: C.borderCream }}>·</span>
          <span><span style={{ background: C.ink, color: C.gold, padding: "2px 7px", borderRadius: 2, fontFamily: FONT_M, fontWeight: 800, marginRight: 4 }}>ESC</span> MENU</span>
        </div>

        {/* Watermark for video capture */}
        <div style={{ position: "absolute", bottom: 22, right: 22, display: "flex", alignItems: "center", gap: 8, opacity: 0.55, pointerEvents: "none" }}>
          <div style={{ display: "flex", gap: 2 }}>
            <div style={{ width: 4, height: 14, background: C.coral, borderRadius: 0.5 }} />
            <div style={{ width: 4, height: 14, background: C.gold, borderRadius: 0.5 }} />
            <div style={{ width: 4, height: 14, background: C.teal, borderRadius: 0.5 }} />
          </div>
          <div style={{ fontFamily: FONT_M, fontSize: 8.5, color: C.surface, letterSpacing: "0.25em", fontWeight: 700 }}>LIFESMART × BANK OF ENGLAND · PROTOTYPE</div>
        </div>

        {state.phoneOpen && <PhonePanel state={state} dispatch={dispatch} />}
        {state.meetingActive && <MeetingRoom state={state} dispatch={dispatch} />}
        {state.tradingFloorActive && <TradingFloor state={state} dispatch={dispatch} />}
        {state.pressActive && <PressConference state={state} dispatch={dispatch} />}
        {state.recoveryActive && <RecoveryStatement state={state} dispatch={dispatch} />}
        {state.newsroomActive && <NewsroomPress state={state} dispatch={dispatch} />}
        {state.voiceActive && <VoiceOfCountry state={state} dispatch={dispatch} />}
        {state.walkHomeActive && <WalkHome state={state} dispatch={dispatch} />}
        {state.montageActive && <ConsequenceMontage state={state} dispatch={dispatch} />}
        {state.sleepAnim > 0 && <SleepAnimation state={state} dispatch={dispatch} />}
        {state.openPanel === "reserve-locked" && (
          <PanelShell title="Locked until Tuesday" sub="The Bank of Vostan" onClose={() => dispatch({ type: "CLOSE_PANEL" })} accent={C.gold}>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.65, marginTop: 0, marginBottom: 14 }}>The security guard checks her clipboard. <em>"You don't start until tomorrow. Get some rest. Sort your own affairs out. Walk the city if you like — you'll be making decisions for it soon enough."</em></p>
            <div style={{ background: `${C.gold}15`, padding: "12px 14px", borderLeft: `3px solid ${C.gold}`, borderRadius: 4, fontSize: 13, color: C.text, lineHeight: 1.55 }}>
              <strong style={{ color: C.gold }}>Today's job:</strong> live your own financial life. Try the Bank's <em>Future You</em> game. Try the Stock Exchange. Talk to people on the street. Sleep when you've done three things.
            </div>
          </PanelShell>
        )}
        {state.openPanel === "reserve" && !state.meetingActive && state.briefingDone && (
          <PanelShell title="Bank of Vostan · Floor 8" sub="After the meeting" onClose={() => dispatch({ type: "CLOSE_PANEL" })} accent={C.gold}>
            <p style={{ color: C.text }}>The committee's gone home. The decision is made. The rate is <strong>{pct(state.interestRate)}</strong>. You should walk the city and see how it's landing.</p>
          </PanelShell>
        )}
        {state.openPanel === "stocks" && <StockExchangePanel state={state} dispatch={dispatch} />}
        {(state.openPanel === "bank" || state.openPanel === "fbank") && <BankPanel state={state} dispatch={dispatch} />}
        {state.openPanel === "market" && <MarketPanel state={state} dispatch={dispatch} />}
        {state.openPanel === "coffee" && <CoffeePanel state={state} dispatch={dispatch} />}
        {state.openPanel === "cinema" && <CinemaPanel state={state} dispatch={dispatch} />}
        {state.openPanel === "flat" && <FlatPanel state={state} dispatch={dispatch} />}
        {state.openPanel?.startsWith?.("npc-") && (() => {
          const id = state.openPanel.replace("npc-", "");
          const npc = NPCS.find((n) => n.id === id);
          return npc ? <NpcDialogue npc={npc} dispatch={dispatch} state={state} /> : null;
        })()}

        {pauseOpen && !showIntro && <PauseMenu state={state} dispatch={dispatch} onClose={() => setPauseOpen(false)} soundOn={soundOn} onToggleSound={toggleSound} />}

        {showIntro && <IntroScreen onStart={() => setShowIntro(false)} canResume={hasSave} onResume={resumeSave} />}

        {/* DEMO CONTROLS — floating bottom-right, lets presenter skip anywhere */}
        {!showIntro && !state.meetingActive && (
          <DemoControls state={state} dispatch={dispatch} />
        )}

        {/* First-time controls hint */}
        {showControlsHint && !state.openPanel && !state.meetingActive && (
          <div className="popupIn" style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            zIndex: 999, background: "rgba(8,12,30,0.92)", border: `2px solid ${C.gold}`,
            borderRadius: 6, padding: "32px 44px", textAlign: "center",
            boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 0 8px rgba(245,184,46,0.08)`,
            backdropFilter: "blur(12px)", maxWidth: 540,
            pointerEvents: "auto",
          }}>
            <div style={{ fontFamily: FONT_M, fontSize: 10, color: C.gold, letterSpacing: "0.4em", fontWeight: 800, marginBottom: 14 }}>● HOW TO PLAY</div>
            <div style={{ fontFamily: FONT_D, fontSize: 32, color: C.surface, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 18 }}>Walk the city. Meet the people.</div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 18, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: C.ink, border: `2px solid ${C.gold}`, color: C.gold, padding: "6px 12px", borderRadius: 3, fontFamily: FONT_M, fontWeight: 800, fontSize: 14 }}>←  →</div>
                <span style={{ fontFamily: FONT_M, fontSize: 11, color: C.textCream, letterSpacing: "0.18em", fontWeight: 700 }}>WALK</span>
              </div>
              <div style={{ width: 1, height: 24, background: "rgba(245,184,46,0.3)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: C.ink, border: `2px solid ${C.gold}`, color: C.gold, padding: "6px 12px", borderRadius: 3, fontFamily: FONT_M, fontWeight: 800, fontSize: 14 }}>E</div>
                <span style={{ fontFamily: FONT_M, fontSize: 11, color: C.textCream, letterSpacing: "0.18em", fontWeight: 700 }}>TALK / ENTER</span>
              </div>
            </div>
            <div style={{ fontFamily: FONT_D, fontSize: 15, color: C.gold, fontStyle: "italic", fontWeight: 600, lineHeight: 1.45 }}>
              Tomorrow you walk into the Reserve. <br/>
              Tonight, listen to who will feel your decisions.
            </div>
            <button onClick={() => setShowControlsHint(false)} style={{
              marginTop: 22, background: C.coral, color: "#fff", border: "none",
              padding: "12px 36px", fontFamily: FONT_M, fontSize: 11, fontWeight: 800, letterSpacing: "0.3em",
              cursor: "pointer", borderRadius: 2, boxShadow: `0 10px 30px ${C.coral}66`,
            }}>GOT IT</button>
          </div>
        )}
      </div>

      {/* CLICK RIPPLES — gold particle burst at every left-click. Adds polish on screen recording. */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
        {ripples.map((r) => (
          <div key={r.id} style={{
            position: "fixed", left: r.x - 18, top: r.y - 18, width: 36, height: 36,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.goldBright} 0%, ${C.gold}88 35%, transparent 70%)`,
            border: `2px solid ${C.gold}`,
            animation: "clickRipple 0.7s ease-out forwards",
            pointerEvents: "none",
          }} />
        ))}
      </div>
    </>
  );
}
