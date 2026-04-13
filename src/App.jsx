import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {

  neon: {
    name: "Neon",
    emoji: "🕹️",
    bg:        "#0a0014",
    card:      "#110022",
    cardWarm:  "#0f001e",
    border:    "#3a006a",
    border2:   "#5a00a0",
    text:      "#f0e0ff",
    textMid:   "#c080ff",
    textSoft:  "#7040a0",
    accent:    "#e040ff",
    accentBg:  "#1a0030",
    green:     "#40ffb0",
    greenBg:   "#001a10",
    red:       "#ff4060",
    redBg:     "#1a000a",
    orange:    "#ff8040",
    orangeBg:  "#1a0800",
    yellow:    "#ffff40",
    shadow:    "0 0 16px rgba(224,64,255,0.35)",
    shadowLg:  "0 0 32px rgba(224,64,255,0.45)",
    font:      "'Courier New', Courier, monospace",
    headFont:  "'Courier New', Courier, monospace",
    extraCss:  `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
      h1 { font-family: 'Orbitron', monospace !important; text-shadow: 0 0 20px rgba(224,64,255,0.8), 0 0 40px rgba(224,64,255,0.4) !important; }
      .theme-card { box-shadow: 0 0 16px rgba(224,64,255,0.2) !important; }
      body { background-image: radial-gradient(ellipse at 20% 50%, rgba(90,0,160,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(64,255,176,0.08) 0%, transparent 50%); }
    `,
  },

  comic: {
    name: "Comic",
    emoji: "💥",
    bg:        "#fff9e6",
    card:      "#ffffff",
    cardWarm:  "#fffde8",
    border:    "#1a1a1a",
    border2:   "#1a1a1a",
    text:      "#1a1a1a",
    textMid:   "#333333",
    textSoft:  "#666666",
    accent:    "#e8001c",
    accentBg:  "#fff0f0",
    green:     "#007a1e",
    greenBg:   "#e8ffe8",
    red:       "#e8001c",
    redBg:     "#fff0f0",
    orange:    "#ff6600",
    orangeBg:  "#fff3e0",
    yellow:    "#cc8800",
    shadow:    "4px 4px 0px #1a1a1a",
    shadowLg:  "6px 6px 0px #1a1a1a",
    font:      "'Bangers', 'Impact', 'Arial Black', sans-serif",
    headFont:  "'Bangers', 'Impact', sans-serif",
    extraCss:  `
      @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');
      .theme-card { border: 2.5px solid #1a1a1a !important; }
      .theme-header { border-bottom: 3px solid #1a1a1a !important; }
      body { background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #fff9e6 6px), repeating-linear-gradient(rgba(255,200,0,0.07), rgba(255,200,0,0.07)); }
    `,
  },

  newspaper: {
    name: "Press",
    emoji: "📰",
    bg:        "#f4f0e8",
    card:      "#faf8f2",
    cardWarm:  "#f0ece0",
    border:    "#b8b0a0",
    border2:   "#8a8070",
    text:      "#1a180e",
    textMid:   "#4a4030",
    textSoft:  "#8a8070",
    accent:    "#1a180e",
    accentBg:  "#e8e4d8",
    green:     "#2a4a1a",
    greenBg:   "#e8ede0",
    red:       "#8a1a0a",
    redBg:     "#f0e8e4",
    orange:    "#6a3a10",
    orangeBg:  "#f0ead8",
    yellow:    "#6a5a10",
    shadow:    "2px 2px 0 rgba(26,24,14,0.15)",
    shadowLg:  "4px 4px 0 rgba(26,24,14,0.15)",
    font:      "'Times New Roman', Times, serif",
    headFont:  "'Times New Roman', Times, serif",
    extraCss:  `
      body { background-image: repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(26,24,14,0.04) 24px, rgba(26,24,14,0.04) 25px); }
      .theme-header { border-bottom: 4px double #1a180e !important; }
      h1, h2 { text-transform: uppercase; letter-spacing: 0.05em; }
    `,
  },

  terminal: {
    name: "Terminal",
    emoji: "🖥️",
    bg:        "#0a0f0a",
    card:      "#0f160f",
    cardWarm:  "#0d140d",
    border:    "#1a3a1a",
    border2:   "#2a5a2a",
    text:      "#4ade80",
    textMid:   "#22c55e",
    textSoft:  "#166534",
    accent:    "#4ade80",
    accentBg:  "#052e16",
    green:     "#4ade80",
    greenBg:   "#052e16",
    red:       "#f87171",
    redBg:     "#2a0a0a",
    orange:    "#fb923c",
    orangeBg:  "#2a1000",
    yellow:    "#fbbf24",
    shadow:    "0 0 12px rgba(74,222,128,0.15)",
    shadowLg:  "0 0 24px rgba(74,222,128,0.2)",
    font:      "'Courier New', Courier, monospace",
    headFont:  "'Courier New', Courier, monospace",
    extraCss:  `
      * { text-shadow: 0 0 6px rgba(74,222,128,0.3) !important; }
      input, select, textarea { color: #4ade80 !important; caret-color: #4ade80; }
      body::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
        background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px); }
    `,
  },

  blueprint: {
    name: "Blueprint",
    emoji: "📐",
    bg:        "#0a1628",
    card:      "#0f1e38",
    cardWarm:  "#0d1c34",
    border:    "#1e3a5f",
    border2:   "#2a5080",
    text:      "#e8f4ff",
    textMid:   "#90bcdc",
    textSoft:  "#4a7a9a",
    accent:    "#60b8ff",
    accentBg:  "#0a2040",
    green:     "#60ffb8",
    greenBg:   "#0a2a1a",
    red:       "#ff8080",
    redBg:     "#2a0a0a",
    orange:    "#ffb860",
    orangeBg:  "#2a1800",
    yellow:    "#ffe060",
    shadow:    "0 0 0 1px #1e3a5f, 0 4px 16px rgba(0,0,0,0.4)",
    shadowLg:  "0 0 0 1px #2a5080, 0 8px 32px rgba(0,0,0,0.5)",
    font:      "'Courier New', Courier, monospace",
    headFont:  "'Courier New', Courier, monospace",
    extraCss:  `
      body { background-image:
        linear-gradient(rgba(96,184,255,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(96,184,255,0.07) 1px, transparent 1px);
        background-size: 24px 24px; }
      .theme-card { border-style: solid !important; }
      h1, h2 { letter-spacing: 0.08em; text-transform: uppercase; }
    `,
  },

  warm: {
    name: "Warm",
    emoji: "☕",
    bg:        "#faf7f4",
    card:      "#ffffff",
    cardWarm:  "#fdf9f6",
    border:    "#e8e0d8",
    border2:   "#d4c9be",
    text:      "#2a2118",
    textMid:   "#6b5c4e",
    textSoft:  "#a8998c",
    accent:    "#c2622a",
    accentBg:  "#fdf0e8",
    green:     "#3d7a4a",
    greenBg:   "#eef6f0",
    red:       "#b53a2f",
    redBg:     "#fdf0ee",
    orange:    "#c2622a",
    orangeBg:  "#fdf0e8",
    yellow:    "#9a6f1a",
    shadow:    "0 2px 12px rgba(42,33,24,0.08)",
    shadowLg:  "0 8px 32px rgba(42,33,24,0.12)",
    font:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headFont:  "'Georgia', serif",
    extraCss:  "",
  },

  chalkboard: {
    name: "Chalk",
    emoji: "🖊️",
    bg:        "#2a3a2e",
    card:      "#324038",
    cardWarm:  "#2e3c32",
    border:    "#4a5e50",
    border2:   "#5a7060",
    text:      "#f0f0e8",
    textMid:   "#c8d4c0",
    textSoft:  "#8a9e88",
    accent:    "#f0d060",
    accentBg:  "#3a4030",
    green:     "#80e880",
    greenBg:   "#2a3e2a",
    red:       "#f08080",
    redBg:     "#3e2a2a",
    orange:    "#f0a060",
    orangeBg:  "#3a3020",
    yellow:    "#f0d060",
    shadow:    "0 2px 8px rgba(0,0,0,0.3)",
    shadowLg:  "0 4px 20px rgba(0,0,0,0.4)",
    font:      "'Segoe Print', 'Comic Sans MS', cursive",
    headFont:  "'Segoe Print', 'Comic Sans MS', cursive",
    extraCss:  `
      body { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); }
      * { letter-spacing: 0.02em; }
    `,
  },
};

let T = THEMES.warm;

// ─── Exercise Lists ───────────────────────────────────────────────────────────
const SQUAT_VARIATIONS = [
  "Squat", "Pause Squat", "Front Squat", "Box Squat",
  "Safety Bar Squat", "Goblet Squat", "Split Squat", "Leg Press",
];
const BENCH_VARIATIONS = [
  "Bench Press", "Incline Bench", "Decline Bench", "Close Grip Bench",
  "Pause Bench", "DB Flat Bench", "DB Incline Bench", "Push Press",
];
const DEADLIFT_VARIATIONS = [
  "Deadlift", "Romanian Deadlift", "Sumo Deadlift", "Trap Bar Deadlift",
  "Deficit Deadlift", "Single Leg RDL", "Hip Thrust", "Good Morning",
];
const ARM_EXERCISES = [
  // Biceps
  "Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Cable Curl",
  "Incline Dumbbell Curl", "Concentration Curl",
  // Triceps
  "Tricep Pushdown", "Tricep Kickback", "Tricep Extension",
  "Overhead Tricep Extension", "Skull Crushers", "Close Grip Bench Press", "Dips",
  "Cable Overhead Extension", "Single Arm Pushdown",
  // Shoulders
  "Overhead Press", "Seated OHP", "Lateral Raise", "Front Raise",
  "Rear Delt Fly", "Face Pull", "Arnold Press", "Cable Lateral Raise",
];

const RPE_COLORS = {
  6:"#3d7a4a", 6.5:"#4e9460", 7:"#8a7a1a", 7.5:"#a88c1a",
  8:"#c2622a", 8.5:"#b84e1e", 9:"#b53a2f", 9.5:"#8f2920", 10:"#6b1a14",
};
function getRPEColor(rpe) { return RPE_COLORS[parseFloat(rpe)] || T.textSoft; }

// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "gym_tracker_v1";

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

// ─── Password Codec ───────────────────────────────────────────────────────────
const RPE_ENC = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

function encodeWorkouts(workouts) {
  // Encode last 8 unique exercises with their most recent weight/reps/rpe
  const slots = [];
  const seen = new Set();
  [...workouts].reverse().forEach(w => {
    [...(w.mainSets || []), ...(w.armSets || [])].forEach(s => {
      if (s.actual && s.weight && s.reps && !seen.has(w.mainExercise + w.armExercise)) {
        seen.add(w.mainExercise);
      }
    });
  });

  // Simpler: grab last 8 exercise+weight combos
  const exMap = {};
  workouts.forEach(w => {
    [
      { name: w.mainExercise, sets: w.mainSets },
      { name: w.armExercise,  sets: w.armSets  },
    ].forEach(({ name, sets }) => {
      if (!name) return;
      (sets || []).forEach(s => {
        if (s.actual && s.weight && s.reps) exMap[name] = s;
      });
    });
  });

  const entries = Object.entries(exMap).slice(0, 8);
  while (entries.length < 8) entries.push([null, null]);

  let val = BigInt(Math.min(workouts.length, 15) & 0xF);
  for (const [, s] of entries) {
    const w = s?.weight ? Math.min(Math.round(parseFloat(s.weight) / 5), 127) || 1 : 0;
    const r = s?.reps   ? Math.min(Math.max(Math.round(parseFloat(s.reps)), 0), 20) : 0;
    const rpeRaw = s?.rpe ? parseFloat(s.rpe) : 0;
    const rpeIdx = rpeRaw ? (RPE_ENC.indexOf(rpeRaw) + 1 || 0) : 0;
    val = (val << 7n) | BigInt(w & 0x7F);
    val = (val << 5n) | BigInt(r & 0x1F);
    val = (val << 4n) | BigInt(rpeIdx & 0xF);
  }

  const bytes = [];
  let tmp = val;
  for (let i = 0; i < 17; i++) { bytes.unshift(Number(tmp & 0xFFn)); tmp >>= 8n; }
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}

function chunkCode(s) { return s.match(/.{1,5}/g)?.join("-") || s; }

// ─── e1RM ─────────────────────────────────────────────────────────────────────
function calcE1RM(weight, reps, rpe) {
  if (!weight || !reps) return null;
  const w = parseFloat(weight), r = parseFloat(reps), e = parseFloat(rpe) || 8;
  const rir = 10 - e;
  return Math.round(w * (1 + (r + rir) / 30));
}

// ─── Plate Calculator ─────────────────────────────────────────────────────────
const BAR = 45;
const PLATES = [
  { weight:45, count:4, color:"#c0392b" },
  { weight:35, count:4, color:"#2980b9" },
  { weight:25, count:4, color:"#d4ac0d" },
  { weight:10, count:4, color:"#27ae60" },
  { weight:5,  count:4, color:"#8e44ad" },
  { weight:2.5,count:2, color:"#7f8c8d" },
];

function calcPlates(target) {
  if (!target || target < BAR) return null;
  let remaining = (target - BAR) / 2;
  const used = [];
  for (const p of PLATES) {
    if (remaining <= 0) break;
    const count = Math.min(p.count, Math.floor(remaining / p.weight));
    if (count > 0) { used.push({ ...p, count }); remaining -= count * p.weight; }
  }
  const loaded = BAR + used.reduce((a, p) => a + p.weight * p.count * 2, 0);
  return { used, loaded, off: Math.round((target - loaded) * 10) / 10 };
}

// ─── Default workout state ────────────────────────────────────────────────────
function newSet() {
  return { weight: "", reps: "10", rpe: "8", actual: false };
}

function newWorkout(date) {
  return {
    id: Date.now(),
    date: date || new Date().toISOString().split("T")[0],
    mainExercise: "Squat",
    armExercise: "Barbell Curl",
    mainSets: [newSet(), newSet(), newSet()],
    armSets:  [newSet(), newSet(), newSet()],
    notes: "",
  };
}

// ─── SetRow ───────────────────────────────────────────────────────────────────
function SetRow({ set, idx, onChange, onDelete }) {
  const e1rm = calcE1RM(set.weight, set.reps, set.rpe);
  const rpeColor = set.rpe ? getRPEColor(set.rpe) : T.border2;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "22px 1fr 1fr 56px 44px 22px",
      gap: "4px", alignItems: "center",
      padding: "8px 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ color: T.textSoft, fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>
        {idx + 1}
      </span>

      {/* Weight */}
      <div style={{ position: "relative" }}>
        <input
          type="number" inputMode="decimal" value={set.weight}
          placeholder="lbs"
          onChange={e => onChange({ ...set, weight: e.target.value, actual: true })}
          style={{
            width: "100%", background: set.actual ? T.card : T.accentBg,
            border: `1.5px solid ${set.actual ? T.accent : T.border}`,
            borderRadius: "7px", color: T.text, padding: "6px 8px", fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Reps */}
      <input
        type="number" inputMode="numeric" value={set.reps}
        onChange={e => onChange({ ...set, reps: e.target.value, actual: true })}
        style={{
          width: "100%", background: T.card, border: `1.5px solid ${T.border}`,
          borderRadius: "7px", color: T.text, padding: "6px 8px", fontSize: "14px",
          outline: "none",
        }}
      />

      {/* RPE */}
      <select value={set.rpe} onChange={e => onChange({ ...set, rpe: e.target.value, actual: true })}
        style={{
          background: set.rpe ? rpeColor + "18" : T.card,
          border: `1.5px solid ${set.rpe ? rpeColor : T.border}`,
          borderRadius: "7px", color: set.rpe ? rpeColor : T.textSoft,
          padding: "6px 4px", fontSize: "12px", fontWeight: 700,
          outline: "none", textAlign: "center",
        }}>
        <option value="">RPE</option>
        {[6,6.5,7,7.5,8,8.5,9,9.5,10].map(r =>
          <option key={r} value={r}>{r}</option>
        )}
      </select>

      {/* e1RM */}
      <span style={{
        fontSize: "11px", color: e1rm ? T.accent : T.textSoft,
        fontWeight: 600, textAlign: "right",
      }}>
        {e1rm ? `~${e1rm}` : "—"}
      </span>

      <button onClick={onDelete} style={{
        background: "transparent", border: "none",
        color: T.textSoft, cursor: "pointer", fontSize: "16px", lineHeight: 1,
        padding: 0,
      }}>×</button>
    </div>
  );
}

// ─── ExerciseSection ──────────────────────────────────────────────────────────
function ExerciseSection({ label, exercise, setExercise, options, sets, setSets }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: "14px", padding: "16px", marginBottom: "12px",
      boxShadow: T.shadow,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.12em", color: T.accent,
        }}>{label}</span>
        <select value={exercise} onChange={e => setExercise(e.target.value)}
          style={{
            background: T.accentBg, border: `1.5px solid ${T.border}`,
            borderRadius: "8px", color: T.text, padding: "5px 10px",
            fontSize: "13px", fontWeight: 600, outline: "none",
            maxWidth: "200px",
          }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "22px 1fr 1fr 56px 44px 22px",
        gap: "4px", marginBottom: "2px",
      }}>
        {["#", "Weight", "Reps", "RPE", "e1RM", ""].map((h, i) => (
          <span key={i} style={{
            fontSize: "10px", color: T.textSoft, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.06em",
            textAlign: i === 4 ? "right" : "left",
          }}>{h}</span>
        ))}
      </div>

      {sets.map((s, i) => (
        <SetRow key={i} set={s} idx={i}
          onChange={u => setSets(sets.map((x, j) => j === i ? u : x))}
          onDelete={() => setSets(sets.filter((_, j) => j !== i))} />
      ))}

      <button onClick={() => setSets([...sets, newSet()])}
        style={{
          width: "100%", marginTop: "10px", padding: "8px",
          background: "transparent", border: `1.5px dashed ${T.border2}`,
          borderRadius: "8px", color: T.textMid, cursor: "pointer",
          fontSize: "13px", fontWeight: 600,
        }}>
        + Add Set
      </button>
    </div>
  );
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────
function LogView({ workouts, setWorkouts }) {
  const today = new Date().toISOString().split("T")[0];
  const todayIdx = workouts.findIndex(w => w.date === today);
  const [editing, setEditing] = useState(todayIdx >= 0 ? todayIdx : null);

  const current = editing !== null ? workouts[editing] : null;

  function updateCurrent(patch) {
    setWorkouts(ws => ws.map((w, i) => i === editing ? { ...w, ...patch } : w));
  }

  function startToday() {
    const w = newWorkout(today);
    setWorkouts(ws => {
      const next = [w, ...ws];
      setEditing(0);
      return next;
    });
  }

  // Recent workouts list
  const recent = workouts.slice(0, 10);

  return (
    <div style={{ paddingTop: "20px", paddingBottom: "100px" }}>
      {current ? (
        <>
          {/* Date header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: T.text }}>
                {new Date(current.date + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" })}
              </div>
              <div style={{ fontSize: "12px", color: T.textSoft, marginTop: "2px" }}>
                {workouts.length} total sessions logged
              </div>
            </div>
            <button onClick={() => setEditing(null)}
              style={{
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: "8px", padding: "6px 12px", color: T.textMid,
                fontSize: "12px", cursor: "pointer", fontWeight: 600,
              }}>
              ← Back
            </button>
          </div>

          <ExerciseSection
            label="Main Lift — Big 3"
            exercise={current.mainExercise}
            setExercise={v => updateCurrent({ mainExercise: v })}
            options={[...SQUAT_VARIATIONS, ...BENCH_VARIATIONS, ...DEADLIFT_VARIATIONS]}
            sets={current.mainSets}
            setSets={v => updateCurrent({ mainSets: v })}
          />

          <ExerciseSection
            label="Arm Work"
            exercise={current.armExercise}
            setExercise={v => updateCurrent({ armExercise: v })}
            options={ARM_EXERCISES}
            sets={current.armSets}
            setSets={v => updateCurrent({ armSets: v })}
          />

          {/* Notes */}
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: "14px", padding: "16px", boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.12em", color: T.textSoft, marginBottom: "8px" }}>Session Notes</div>
            <textarea value={current.notes}
              onChange={e => updateCurrent({ notes: e.target.value })}
              placeholder="How did it feel? Notes for next time…"
              style={{
                width: "100%", background: T.cardWarm, border: `1.5px solid ${T.border}`,
                borderRadius: "8px", color: T.textMid, padding: "10px",
                fontSize: "13px", resize: "vertical", minHeight: "72px",
                outline: "none", boxSizing: "border-box",
              }} />
          </div>
        </>
      ) : (
        <>
          {/* Start today button */}
          {todayIdx < 0 && (
            <button onClick={startToday} style={{
              width: "100%", padding: "18px",
              background: T.accent, border: "none",
              borderRadius: "14px", color: "#fff",
              fontSize: "16px", fontWeight: 700, cursor: "pointer",
              marginBottom: "20px", letterSpacing: "0.03em",
              boxShadow: `0 4px 16px ${T.accent}50`,
            }}>
              + Start Today's Workout
            </button>
          )}

          {todayIdx >= 0 && (
            <button onClick={() => setEditing(todayIdx)} style={{
              width: "100%", padding: "18px",
              background: T.accentBg, border: `2px solid ${T.accent}`,
              borderRadius: "14px", color: T.accent,
              fontSize: "16px", fontWeight: 700, cursor: "pointer",
              marginBottom: "20px",
            }}>
              ✏️ Continue Today's Workout
            </button>
          )}

          {/* Recent sessions */}
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: T.textSoft, marginBottom: "10px" }}>
            Recent Sessions
          </div>

          {recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.textSoft, fontSize: "14px" }}>
              No sessions yet. Start your first workout above!
            </div>
          ) : (
            recent.map((w, i) => {
              const mainLogged = (w.mainSets || []).filter(s => s.actual && s.weight).length;
              const armLogged  = (w.armSets  || []).filter(s => s.actual && s.weight).length;
              const bestE1RM   = Math.max(0, ...(w.mainSets || []).map(s => calcE1RM(s.weight, s.reps, s.rpe) || 0));
              return (
                <button key={w.id} onClick={() => setEditing(workouts.indexOf(w))}
                  style={{
                    width: "100%", textAlign: "left",
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: "12px", padding: "14px 16px",
                    marginBottom: "8px", cursor: "pointer",
                    boxShadow: T.shadow, display: "block",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: T.text, marginBottom: "4px" }}>
                        {new Date(w.date + "T12:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
                      </div>
                      <div style={{ fontSize: "12px", color: T.textMid }}>
                        {w.mainExercise} · {w.armExercise}
                      </div>
                      <div style={{ fontSize: "11px", color: T.textSoft, marginTop: "3px" }}>
                        {mainLogged + armLogged} sets logged
                      </div>
                    </div>
                    {bestE1RM > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: T.accent }}>{bestE1RM}</div>
                        <div style={{ fontSize: "10px", color: T.textSoft }}>e1RM</div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </>
      )}
    </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────
function ProgressView({ workouts }) {
  const allExercises = [...new Set(workouts.flatMap(w => [w.mainExercise, w.armExercise].filter(Boolean)))];
  const [selectedEx, setSelectedEx] = useState(allExercises[0] || "Squat");

  const trend = workouts
    .filter(w => w.mainExercise === selectedEx || w.armExercise === selectedEx)
    .map(w => {
      const sets = w.mainExercise === selectedEx ? w.mainSets : w.armSets;
      const best = Math.max(0, ...(sets || []).map(s => calcE1RM(s.weight, s.reps, s.rpe) || 0));
      return best > 0 ? { date: w.date.slice(5), e1rm: best } : null;
    })
    .filter(Boolean)
    .reverse();

  const totalSets = workouts.reduce((a, w) =>
    a + (w.mainSets || []).filter(s => s.actual && s.weight).length
      + (w.armSets  || []).filter(s => s.actual && s.weight).length, 0);
  const totalWorkouts = workouts.length;

  // Volume per session
  const volData = workouts.slice(0, 12).reverse().map(w => ({
    date: w.date.slice(5),
    sets: (w.mainSets || []).filter(s => s.actual && s.weight).length
        + (w.armSets  || []).filter(s => s.actual && s.weight).length,
  })).filter(d => d.sets > 0);

  const Tip = ({ active, payload, label }) => active && payload?.length ? (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: "8px", padding: "8px 12px", fontSize: "12px",
      boxShadow: T.shadow,
    }}>
      <div style={{ color: T.textMid }}>{label}</div>
      <div style={{ color: T.accent, fontWeight: 700 }}>
        {payload[0].value} {payload[0].name === "e1rm" ? "lbs" : "sets"}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ paddingTop: "20px", paddingBottom: "100px" }}>
      <h2 style={{ margin: "0 0 16px", color: T.text, fontSize: "22px", fontWeight: 800 }}>Progress</h2>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "Total Sessions", value: totalWorkouts, color: T.accent },
          { label: "Total Sets",     value: totalSets,     color: T.green },
        ].map(s => (
          <div key={s.label} style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: "12px", padding: "16px", textAlign: "center",
            boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: "32px", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: T.textSoft, textTransform: "uppercase",
              letterSpacing: "0.06em", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* e1RM chart */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: "14px", padding: "16px", marginBottom: "14px",
        boxShadow: T.shadow,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: T.textMid }}>e1RM Trend</div>
          <select value={selectedEx} onChange={e => setSelectedEx(e.target.value)}
            style={{
              background: T.cardWarm, border: `1px solid ${T.border}`,
              borderRadius: "7px", color: T.text, padding: "4px 8px",
              fontSize: "12px", outline: "none", fontWeight: 600,
              colorScheme: "light",
            }}>
            {allExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>
        {trend.length < 2 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: T.textSoft, fontSize: "13px" }}>
            Log at least 2 sessions with <strong style={{ color: T.accent }}>{selectedEx}</strong>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textSoft }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSoft }} width={40} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="e1rm" stroke={T.accent}
                strokeWidth={2.5} dot={{ r: 4, fill: T.accent }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Volume chart */}
      {volData.length > 1 && (
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: "14px", padding: "16px",
          boxShadow: T.shadow,
        }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: T.textMid, marginBottom: "12px" }}>Sets Per Session</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={volData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textSoft }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSoft }} width={28} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="sets" fill={T.accent} radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Plate Calculator ─────────────────────────────────────────────────────────
function PlateCalcView() {
  const [target, setTarget] = useState("");
  const result = target ? calcPlates(parseFloat(target)) : null;
  const maxLoad = BAR + PLATES.reduce((a, p) => a + p.weight * p.count * 2, 0);

  return (
    <div style={{ paddingTop: "20px", paddingBottom: "100px" }}>
      <h2 style={{ margin: "0 0 4px", color: T.text, fontSize: "22px", fontWeight: 800 }}>Plates</h2>
      <p style={{ color: T.textSoft, fontSize: "13px", margin: "0 0 20px" }}>
        45 lb bar · max <span style={{ color: T.accent, fontWeight: 600 }}>{maxLoad} lbs</span>
      </p>

      <input type="number" inputMode="decimal" value={target}
        onChange={e => setTarget(e.target.value)}
        placeholder="Enter target weight (lbs)"
        style={{
          width: "100%", background: T.card, border: `2px solid ${T.border2}`,
          borderRadius: "12px", color: T.text, padding: "16px",
          fontSize: "20px", boxSizing: "border-box", outline: "none",
          marginBottom: "16px", transition: "border-color 0.2s", display: "block",
        }}
        onFocus={e => e.target.style.borderColor = T.accent}
        onBlur={e => e.target.style.borderColor = T.border2}
      />

      {target && !result && (
        <div style={{
          background: T.redBg, border: `1px solid ${T.red}40`,
          borderRadius: "10px", padding: "12px 16px", color: T.red, fontSize: "14px",
        }}>
          Below bar weight (45 lbs)
        </div>
      )}

      {result && (
        <>
          {/* Visual bar */}
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: "14px", padding: "20px", marginBottom: "12px",
            boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: "11px", color: T.textSoft, textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: "14px", fontWeight: 600 }}>Bar Diagram</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
              gap: "2px", minHeight: "60px", overflowX: "auto" }}>
              <div style={{ width: "8px", height: "44px", background: T.border2,
                borderRadius: "3px 0 0 3px", flexShrink: 0 }} />
              {[...result.used].reverse().map((p, i) =>
                Array.from({ length: p.count }).map((_, j) => (
                  <div key={`l-${i}-${j}`} style={{
                    width: "14px", flexShrink: 0,
                    height: `${Math.max(28, Math.min(58, 28 + p.weight * 0.5))}px`,
                    background: p.color, borderRadius: "2px",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
                  }} />
                ))
              )}
              <div style={{
                height: "12px", width: "76px", flexShrink: 0,
                background: "linear-gradient(180deg,#c8c0b8,#a0988e,#c8c0b8)",
                borderRadius: "4px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "10px", color: "#fff", fontWeight: 700,
              }}>BAR 45</div>
              {result.used.map((p, i) =>
                Array.from({ length: p.count }).map((_, j) => (
                  <div key={`r-${i}-${j}`} style={{
                    width: "14px", flexShrink: 0,
                    height: `${Math.max(28, Math.min(58, 28 + p.weight * 0.5))}px`,
                    background: p.color, borderRadius: "2px",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
                  }} />
                ))
              )}
              <div style={{ width: "8px", height: "44px", background: T.border2,
                borderRadius: "0 3px 3px 0", flexShrink: 0 }} />
            </div>
          </div>

          {/* Per side */}
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: "14px", padding: "16px", marginBottom: "10px",
            boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: "11px", color: T.textSoft, textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: "10px", fontWeight: 600 }}>Per Side</div>
            {result.used.length === 0
              ? <div style={{ color: T.textMid }}>Bar only</div>
              : result.used.map(p => (
                <div key={p.weight} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: `1px solid ${T.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "12px", height: "28px", background: p.color, borderRadius: "3px" }} />
                    <span style={{ color: T.text, fontSize: "15px", fontWeight: 600 }}>{p.weight} lbs</span>
                  </div>
                  <span style={{ color: T.textMid, fontWeight: 600 }}>×{p.count} per side</span>
                </div>
              ))
            }
            <div style={{ marginTop: "12px", padding: "10px", background: T.accentBg,
              borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.textMid, fontWeight: 600 }}>Loaded</span>
              <span style={{ color: T.accent, fontWeight: 800, fontSize: "16px" }}>{result.loaded} lbs</span>
            </div>
            {result.off !== 0 && (
              <div style={{ marginTop: "6px", fontSize: "12px", color: T.textSoft, textAlign: "center" }}>
                {result.off > 0 ? `${result.off} lbs short` : `${Math.abs(result.off)} lbs over`}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Password View ────────────────────────────────────────────────────────────
function PasswordView({ workouts }) {
  const [mode, setMode]         = useState("save");
  const [inputPw, setInputPw]   = useState("");
  const [copied, setCopied]     = useState(false);
  const [status, setStatus]     = useState(null);
  const [typed, setTyped]       = useState(0);
  const [cursor, setCursor]     = useState(true);

  const code    = encodeWorkouts(workouts);
  const chunked = chunkCode(code);

  useEffect(() => {
    const t = setInterval(() => setCursor(b => !b), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (mode !== "save") return;
    setTyped(0);
    let i = 0;
    const t = setInterval(() => {
      i += 2; setTyped(i);
      if (i >= chunked.length) clearInterval(t);
    }, 15);
    return () => clearInterval(t);
  }, [mode, chunked]);

  const mono = { fontFamily: "'Courier New',Courier,monospace" };
  const CRT  = { bg:"#0a0f0a", green:"#4ade80", dim:"#22c55e60", border:"#22c55e30" };

  return (
    <div style={{ paddingTop: "20px", paddingBottom: "100px" }}>
      <h2 style={{ margin: "0 0 4px", color: T.text, fontSize: "22px", fontWeight: 800 }}>Password Save</h2>
      <p style={{ color: T.textSoft, fontSize: "13px", margin: "0 0 20px" }}>
        Encode your progress into a short save code.
      </p>

      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {["save", "load"].map(m => (
          <button key={m} onClick={() => { setMode(m); setStatus(null); setInputPw(""); }}
            style={{
              flex: 1, padding: "10px",
              background: mode === m ? "#0a0f0a" : T.card,
              border: `1px solid ${mode === m ? "#4ade80" : T.border}`,
              borderRadius: "8px", cursor: "pointer",
              color: mode === m ? "#4ade80" : T.textMid,
              ...mono, fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
            {m === "save" ? "► GENERATE" : "◄ RESTORE"}
          </button>
        ))}
      </div>

      {mode === "save" && (
        <div style={{ background: "#0a0f0a", border: "1px solid #22c55e30",
          borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "10px", color: "#22c55e60", letterSpacing: "0.2em", marginBottom: "8px", ...mono }}>
            SAVE CODE:
          </div>
          <div style={{ ...mono, fontSize: "15px", color: "#4ade80",
            lineHeight: "2", wordBreak: "break-all", letterSpacing: "0.12em",
            minHeight: "40px" }}>
            {chunked.slice(0, typed)}
            <span style={{ opacity: cursor ? 1 : 0 }}>█</span>
          </div>
          <button onClick={() => {
            navigator.clipboard.writeText(chunked).catch(() => {});
            setCopied(true); setTimeout(() => setCopied(false), 2000);
          }} style={{
            width: "100%", marginTop: "16px", padding: "11px",
            background: copied ? "#14532d" : "transparent",
            border: `1px solid ${copied ? "#4ade80" : "#22c55e40"}`,
            borderRadius: "6px", cursor: "pointer",
            color: copied ? "#4ade80" : "#22c55e80",
            ...mono, fontSize: "12px", fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase",
          }}>
            {copied ? "✓ COPIED" : "[ COPY ]"}
          </button>
        </div>
      )}

      {mode === "load" && (
        <div style={{ background: "#0a0f0a", border: "1px solid #22c55e30",
          borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "10px", color: "#22c55e60", letterSpacing: "0.2em",
            marginBottom: "8px", ...mono }}>ENTER CODE:</div>
          <input value={inputPw} onChange={e => setInputPw(e.target.value)}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXX"
            style={{
              width: "100%", background: "#050a05",
              border: "1px solid #22c55e40", borderRadius: "6px",
              color: "#4ade80", padding: "10px 12px", ...mono,
              fontSize: "14px", letterSpacing: "0.1em", outline: "none",
              boxSizing: "border-box",
            }} />
          <p style={{ color: "#22c55e60", fontSize: "11px", ...mono, marginTop: "8px" }}>
            Note: restore pre-fills your latest weights — your full session history stays in localStorage.
          </p>
          {status === "err" && (
            <div style={{ color: "#f87171", fontSize: "12px", ...mono, marginTop: "8px" }}>
              ✕ Invalid code
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Rest Timer ───────────────────────────────────────────────────────────────
function RestTimer() {
  const [seconds,  setSeconds]  = useState(0);
  const [running,  setRunning]  = useState(false);
  const [preset,   setPreset]   = useState(180);
  const endTimeRef = useRef(null);  // wall-clock time when timer should hit zero
  const rafRef     = useRef(null);  // requestAnimationFrame handle

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    // On start/resume: set the absolute end time
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + seconds * 1000;
    }

    function tick() {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        setSeconds(0);
        setRunning(false);
        endTimeRef.current = null;
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        return;
      }
      setSeconds(remaining);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    // Recalculate on visibility change (tab comes back to foreground)
    function onVisible() {
      if (document.visibilityState === "visible" && running && endTimeRef.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [running]);

  const start = (s) => {
    const duration = s ?? preset;
    endTimeRef.current = Date.now() + duration * 1000;
    setSeconds(duration);
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    setSeconds(0);
    endTimeRef.current = null;
  };
  const pct   = preset > 0 ? seconds / preset : 0;
  const urgent = seconds > 0 && seconds <= 10;
  const display = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const PRESETS = [{ l:"1m", s:60 }, { l:"2m", s:120 }, { l:"3m", s:180 }, { l:"5m", s:300 }];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: T.card,
      borderTop: `2px solid ${running ? (urgent ? T.red : T.accent) : T.border}`,
      boxShadow: "0 -4px 20px rgba(42,33,24,0.10)",
      transition: "border-color 0.3s",
    }}>
      {(running || seconds > 0) && (
        <div style={{ height: "3px", background: T.border }}>
          <div style={{
            height: "100%", width: `${pct * 100}%`,
            background: urgent ? T.red : T.accent,
            transition: "width 1s linear, background 0.3s",
          }} />
        </div>
      )}
      <div style={{ maxWidth: "680px", margin: "0 auto",
        padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          fontFamily: "'Courier New',monospace", fontSize: "26px", fontWeight: 700,
          color: urgent ? T.red : running ? T.accent : T.textSoft,
          minWidth: "60px", letterSpacing: "0.04em",
          transition: "color 0.3s",
        }}>
          {display}
        </div>
        <div style={{ display: "flex", gap: "4px", flex: 1 }}>
          {PRESETS.map(p => (
            <button key={p.l} onClick={() => { setPreset(p.s); start(p.s); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: "7px", border: "none",
                background: preset === p.s && running ? T.accent : T.bg,
                color: preset === p.s && running ? "#fff" : T.textMid,
                fontSize: "12px", fontWeight: 600, cursor: "pointer",
              }}>
              {p.l}
            </button>
          ))}
        </div>
        <button onClick={running ? stop : () => start()}
          style={{
            padding: "10px 14px", borderRadius: "7px", border: "none",
            background: running ? T.redBg : T.accentBg,
            color: running ? T.red : T.accent,
            fontSize: "13px", fontWeight: 700, cursor: "pointer", minWidth: "48px",
          }}>
          {running ? "✕" : seconds === 0 ? "▶" : "↺"}
        </button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const saved = loadData();
  const [workouts,  setWorkouts]  = useState(saved?.workouts || []);
  const [view,      setView]      = useState("log");
  const [settings,  setSettings]  = useState(false);
  const [themeKey,  setThemeKey]  = useState(saved?.theme || "neon");
  T = THEMES[themeKey] || THEMES.warm;

  // Persist on every change
  useEffect(() => {
    saveData({ workouts, theme: themeKey });
    document.body.style.background = T.bg;
  }, [workouts, themeKey]);

  const VIEWS = [
    { id: "log",      label: "Log"      },
    { id: "progress", label: "Progress" },
    { id: "plates",   label: "Plates"   },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: T.font,
      color: T.text,
    }}>
      <style>{`
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 4px; }
        select, select option { background: ${T.card}; color: ${T.text}; }
        button { font-family: inherit; }
        input, textarea, select { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        body { font-family: ${T.font}; background: ${T.bg}; }
        ${T.extraCss}
      `}</style>

      {/* Header */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "12px 16px", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 8px rgba(42,33,24,0.06)",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.2em",
                textTransform: "uppercase", fontWeight: 700, marginBottom: "1px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                Strength Log
              </div>
              <h1 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: T.text,
                letterSpacing: "-0.02em", fontFamily: T.headFont }}>
                Gym Tracker
              </h1>
            </div>
            <button onClick={() => setSettings(o => !o)} style={{
              background: settings ? T.accentBg : "transparent",
              border: `1px solid ${settings ? T.accent : T.border}`,
              borderRadius: "8px", padding: "7px 10px",
              cursor: "pointer", fontSize: "16px", lineHeight: 1,
            }}>⚙️</button>
          </div>

          {/* Settings panel */}
          {settings && (
            <div style={{
              marginTop: "10px", padding: "14px", background: T.cardWarm,
              border: `1px solid ${T.border}`, borderRadius: "10px",
            }}>
              <button onClick={() => { setView("password"); setSettings(false); }}
                style={{
                  width: "100%", background: "#0a0f0a",
                  border: "1px solid #22c55e40", borderRadius: "8px",
                  color: "#4ade80", padding: "10px",
                  fontFamily: "'Courier New',monospace", fontSize: "13px",
                  fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
                }}>
                💾 PASSWORD SAVE
              </button>
            </div>
          )}

          {/* Nav */}
          <div style={{ display: "flex", gap: "4px", marginTop: "10px" }}>
            {VIEWS.map(v => (
              <button key={v.id} onClick={() => { setView(v.id); setSettings(false); }}
                style={{
                  flex: 1, padding: "8px 4px",
                  background: view === v.id ? T.accent : "transparent",
                  border: `1px solid ${view === v.id ? T.accent : T.border}`,
                  borderRadius: "7px",
                  color: view === v.id ? "#fff" : T.textMid,
                  fontSize: "13px", fontWeight: view === v.id ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}>
                {v.label}
              </button>
            ))}
          </div>

          {/* Theme switcher */}
          <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
            {Object.entries(THEMES).map(([key, th]) => (
              <button key={key} onClick={() => setThemeKey(key)}
                style={{
                  flex: 1, padding: "6px 2px",
                  background: themeKey === key ? T.accent : "transparent",
                  border: `1px solid ${themeKey === key ? T.accent : T.border}`,
                  borderRadius: "6px", cursor: "pointer",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                }}>
                <span style={{ fontSize: "16px", lineHeight: 1 }}>{th.emoji}</span>
                <span style={{
                  fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em",
                  color: themeKey === key ? "#fff" : T.textSoft,
                  textTransform: "uppercase",
                }}>{th.name}</span>
              </button>
            ))}
          </div>

          
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px" }}>
        {view === "log"      && <LogView      workouts={workouts} setWorkouts={setWorkouts} />}
        {view === "progress" && <ProgressView workouts={workouts} />}
        {view === "plates"   && <PlateCalcView />}
        {view === "password" && <PasswordView workouts={workouts} />}
      </div>

      <RestTimer />
      <div style={{ height: "70px" }} />
    </div>
  );
}