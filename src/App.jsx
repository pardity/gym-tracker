import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── Theme ────────────────────────────────────────────────────────────────────
function getTheme(dark) {
  return dark ? {
    bg:       "#0f1117",
    card:     "#1a1d27",
    border:   "#2d3148",
    border2:  "#3d4262",
    text:     "#f1f5f9",
    textMid:  "#94a3b8",
    textSoft: "#64748b",
    accent:   "#3b82f6",
    accentBg: "#1e3a5f",
    orange:   "#fb923c",
    orangeBg: "#431407",
    green:    "#4ade80",
    greenBg:  "#052e16",
    red:      "#f87171",
    redBg:    "#450a0a",
    yellow:   "#fbbf24",
  } : {
    bg:       "#f8f9fb",
    card:     "#ffffff",
    border:   "#e2e8f0",
    border2:  "#cbd5e1",
    text:     "#0f172a",
    textMid:  "#475569",
    textSoft: "#94a3b8",
    accent:   "#2563eb",
    accentBg: "#eff6ff",
    orange:   "#ea580c",
    orangeBg: "#fff7ed",
    green:    "#16a34a",
    greenBg:  "#f0fdf4",
    red:      "#dc2626",
    redBg:    "#fef2f2",
    yellow:   "#d97706",
  };
}
// T is set at app level and injected via a module-level variable so all components see it
let T = getTheme(false);

// ─── Constants ────────────────────────────────────────────────────────────────
const CONDITIONING_MODES = ["Row","Bike","Ski-Erg","Run/Treadmill","Elliptical","Walk"];
const WEEK_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const BAR_WEIGHT = 45;

const PLATE_INVENTORY = [
  { weight:45, perSide:4, color:"#ef4444" },
  { weight:35, perSide:4, color:"#3b82f6" },
  { weight:25, perSide:4, color:"#f59e0b" },
  { weight:10, perSide:4, color:"#22c55e" },
  { weight:5,  perSide:4, color:"#a855f7" },
  { weight:2.5,perSide:2, color:"#94a3b8" },
];

const RPE_COLORS = {
  6:"#16a34a", 6.5:"#22c55e", 7:"#ca8a04",
  7.5:"#d97706", 8:"#ea580c", 8.5:"#dc4e09",
  9:"#dc2626", 9.5:"#b91c1c", 10:"#7f1d1d",
};
function getRPEColor(rpe) { return RPE_COLORS[parseFloat(rpe)] || T.textSoft; }

// ─── Real Program Data (extracted from official BBM spreadsheets) ────────────
// Keys: "2Day", "3DaySS", "3DayTCH"
// Each key → weeks 1-12 → days 1-N → exercises[]
// exercise: { name, sets:[{reps,rpe,label?}], restMin, notes, optional }
const PROGRAM_DATA = {"2Day":{"1":{"days":{"1":[{"name":"Squat","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. No back off sets","optional":false},{"name":"Incline Bench","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. No back off sets","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs.","optional":false},{"name":"DB Incline Bench","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ 6, 10 reps @ 7, 10 reps @ 8. No back off sets. 2 minutes rest between work sets.","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. No back off sets","optional":false},{"name":"Deadlift","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. No back off sets","optional":false},{"name":"Split Squat","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs.","optional":false},{"name":"Lat Pulldown","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ 6, 10 reps @ 7, 10 reps @ 8. No back off sets. 2 minutes rest between work sets.","optional":true}]},"conditioning":[]},"2":{"days":{"1":[{"name":"Squat","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 63%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 63%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 63%e1RM EMOM #3"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 63% e1RM x 5 reps every 3 minutes on the minute x 3 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Incline Bench","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 66% e1RM x 5 reps every 3 minutes on the minute x 4 sets(or RPE 8, whichever comes first)","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Incline Bench","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 63%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 63%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 63%e1RM EMOM #3"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 63% e1RM x 5 reps every 3 minutes on the minute x 3 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 66% e1RM x 5 reps every 3 minutes on the minute x 4 sets(or RPE 8, whichever comes first)","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Lat Pulldown","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 60% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[]},"3":{"days":{"1":[{"name":"Squat","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #3"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 66% e1RM x 5 reps every 3 minutes on the minute x 3 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Incline Bench","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 69% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 3 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Incline Bench","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 66%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 66% e1RM x 5 reps every 3 minutes on the minute x 4 sets(or RPE 8, whichever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 69% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Lat Pulldown","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 60% e1RM x 10 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[]},"4":{"days":{"1":[{"name":"Squat","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 69% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Incline Bench","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 72% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 3 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Incline Bench","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 69%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 69% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 72% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Lat Pulldown","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 60% e1RM x 10 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[]},"5":{"days":{"1":[{"name":"Squat","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 72% e1RM x 5 reps every 3 minutes on the minute x 4 sets(or RPE 8, whichever comes first)","optional":false},{"name":"Incline Bench","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 74% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 3 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Incline Bench","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 72% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 74% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Lat Pulldown","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 60% e1RM x 10 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[]},"6":{"days":{"1":[{"name":"Squat","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 74% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Incline Bench","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 76%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 76%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 76%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 76%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 76% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 3 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Incline Bench","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 74%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 74% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":8,"rpe":"8","label":"5-8 @ RPE8 top set"},{"reps":5,"rpe":"7","label":"5 @ 76%e1RM EMOM #1"},{"reps":5,"rpe":"7","label":"5 @ 76%e1RM EMOM #2"},{"reps":5,"rpe":"7","label":"5 @ 76%e1RM EMOM #3"},{"reps":5,"rpe":"7","label":"5 @ 76%e1RM EMOM #4"}],"restMin":3,"notes":"5 to 8 reps @ RPE 8, then 76% e1RM x 5 reps every 3 minutes on the minute x 4 sets (or RPE 8, whichever comes first)","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Lat Pulldown","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10-12 reps @ RPE 8, then 60% e1RM x 10 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[]},"7":{"days":{"1":[{"name":"Squat","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. No back off sets.","optional":false},{"name":"Overhead Press","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. No back off sets.","optional":false},{"name":"Seated Row","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ RPE 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets.","optional":false},{"name":"DB Flat Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back off sets. Rest 2 minutes between work sets.","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. No back off sets.","optional":false},{"name":"Deadlift","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. No back off sets.","optional":false},{"name":"Leg Press","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ RPE 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets.","optional":false},{"name":"Pulldown","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back off sets. Rest 2 minutes between work sets.","optional":true}]},"conditioning":[{"duration":"20","zone":"2","rpe":"4"}]},"8":{"days":{"1":[{"name":"Squat","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 67%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 67%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 67%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 67%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 67% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Overhead Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 70% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Seated Row","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Flat Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs.","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 70% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 67%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 67%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 67%e1RM EMOM #3"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 67% e1RM x 4 reps every 3 minutes on the minute x 3 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Leg Press","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Pulldown","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[{"duration":"20","zone":"2","rpe":"4"}]},"9":{"days":{"1":[{"name":"Squat","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 70% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Overhead Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 72% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Seated Row","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Flat Bench","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 2 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 72% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 70%e1RM EMOM #3"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 70% e1RM x 4 reps every 3 minutes on the minute x 3 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Leg Press","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Pulldown","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[{"duration":"20","zone":"2","rpe":"4"}]},"10":{"days":{"1":[{"name":"Squat","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 72% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Overhead Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 75% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Seated Row","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Flat Bench","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 75% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #3"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 72% e1RM x 4 reps every 3 minutes on the minute x 3 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Leg Press","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Pulldown","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[{"duration":"20","zone":"2","rpe":"4"}]},"11":{"days":{"1":[{"name":"Squat","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 72% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Overhead Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 75% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Seated Row","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Flat Bench","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 75% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #3"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 72% e1RM x 4 reps every 3 minutes on the minute x 3 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Leg Press","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Pulldown","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[{"duration":"20","zone":"2","rpe":"4"}]},"12":{"days":{"1":[{"name":"Squat","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 72% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Overhead Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 75% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Seated Row","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"DB Flat Bench","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 3 sets (or until RPE 9, whichever comes first)","optional":true}],"2":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #3"},{"reps":4,"rpe":"7","label":"4 @ 75%e1RM EMOM #4"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 75% e1RM x 4 reps every 3 minutes on the minute x 4 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Deadlift","sets":[{"reps":6,"rpe":"8","label":"4-6 @ RPE8 top set"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #1"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #2"},{"reps":4,"rpe":"7","label":"4 @ 72%e1RM EMOM #3"}],"restMin":3,"notes":"4 to 6 reps @ RPE 8, then 72% e1RM x 4 reps every 3 minutes on the minute x 3 sets (or RPE 8, whatever comes first)","optional":false},{"name":"Leg Press","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"6-8 reps @ RPE 8, then 65% e1RM x 10 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":false},{"name":"Pulldown","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8-10 reps @ RPE 8, then 65% e1RM x 8 reps every 2 minutes on the minute x 4 sets (or until RPE 9, whichever comes first)","optional":true}]},"conditioning":[{"duration":"20","zone":"2","rpe":"4"}]}},"3DaySS":{"1":{"days":{"1":[{"name":"Squat","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. No back off sets.","optional":false},{"name":"Close Grip Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":3,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back off sets.","optional":false},{"name":"Romanian Deadlift","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets.","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"8 to 12 reps @ RPE 8 x 3 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. No back off sets.","optional":false},{"name":"Pause Squat","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets.","optional":false},{"name":"DB Incline Bench","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back off sets.","optional":false},{"name":"Single Leg RDL","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10 to 12 reps @ RPE 8 x 3 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. No back off sets.","optional":false},{"name":"Incline Bench","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. No back off sets.","optional":false},{"name":"Split Squat","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back off sets.","optional":false},{"name":"Chin-Up","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 3 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"2":{"days":{"1":[{"name":"Squat","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -8% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Close Grip Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":3,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. -8% from 8 @ 8 x 1 set of 8.","optional":false},{"name":"Romanian Deadlift","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -8% from 6 @ 8 x 1 set of 6","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"8 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -5% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Pause Squat","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -5% from 6 @ 8 x 1 set of 6","optional":false},{"name":"DB Incline Bench","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. Repeat 10 reps @ RPE 8 x 1 set","optional":false},{"name":"Single Leg RDL","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -10% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Incline Bench","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Split Squat","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Chin-Up","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"3":{"days":{"1":[{"name":"Squat","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -8% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Close Grip Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":3,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. -8% from 8 @ 8 x 1 set of 8.","optional":false},{"name":"Romanian Deadlift","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -8% from 6 @ 8 x 1 set of 6","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"8 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -5% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Pause Squat","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -5% from 6 @ 8 x 1 set of 6","optional":false},{"name":"DB Incline Bench","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. Repeat 10 reps @ RPE 8 x 1 set","optional":false},{"name":"Single Leg RDL","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -10% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Incline Bench","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Split Squat","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Chin-Up","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"4":{"days":{"1":[{"name":"Squat","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -8% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Close Grip Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":3,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. -8% from 8 @ 8 x 1 set of 8.","optional":false},{"name":"Romanian Deadlift","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -8% from 6 @ 8 x 1 set of 6","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"8 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. Repeat 4 @ 8 x 1 set of 4","optional":false},{"name":"Pause Squat","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -5% from 6 @ 8 x 1 set of 6","optional":false},{"name":"DB Incline Bench","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. Repeat 10 reps @ RPE 8 x 1 set","optional":false},{"name":"Single Leg RDL","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -10% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Incline Bench","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. Repeat 5 @ 8 x 1 set","optional":false},{"name":"Split Squat","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Chin-Up","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"5":{"days":{"1":[{"name":"Squat","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -5% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Close Grip Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"9"}],"restMin":3,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8, 8 reps @ RPE 9,  -5% from 8 @ 9 x 1 set of 8.","optional":false},{"name":"Romanian Deadlift","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -5% from 6 @ 8 x 1 set of 6","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"8 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. Repeat 4 @ 8 x 1 set of 4","optional":false},{"name":"Pause Squat","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"DB Incline Bench","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"},{"reps":10,"rpe":"9"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8, 10 reps @ RPE 9. No back offs","optional":false},{"name":"Single Leg RDL","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -8% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Incline Bench","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. Repeat 5 @ 8 x 1 set","optional":false},{"name":"Split Squat","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Chin-Up","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"6":{"days":{"1":[{"name":"Squat","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -5% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Close Grip Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"9"}],"restMin":3,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8, 8 reps @ RPE 9,  -5% from 8 @ 9 x 1 set of 8.","optional":false},{"name":"Romanian Deadlift","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -5% from 6 @ 8 x 1 set of 6","optional":false},{"name":"Chest-Supported Row","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"8 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. Repeat 4 @ 8 x 1 set of 4","optional":false},{"name":"Pause Squat","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"DB Incline Bench","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"},{"reps":10,"rpe":"9"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8, 10 reps @ RPE 9. No back offs","optional":false},{"name":"Single Leg RDL","sets":[{"reps":12,"rpe":"8"}],"restMin":2,"notes":"10 to 12 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -8% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Incline Bench","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. Repeat 5 @ 8 x 1 set","optional":false},{"name":"Split Squat","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Chin-Up","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"7":{"days":{"1":[{"name":"Squat","sets":[{"reps":3,"rpe":"6"},{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps @ 6, 3 reps @ 7, 3 reps @ 8. No back off sets.","optional":false},{"name":"Pause Bench","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets.","optional":false},{"name":"Deficit Deadlift","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":2,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. No back off sets.","optional":false},{"name":"Seated Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"6-10 reps @ RPE 8 x 3 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":3,"rpe":"6"},{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps @ 6, 3 reps @ 7, 3 reps @ 8. No back off sets.","optional":false},{"name":"Pin Squat","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. No back off sets.","optional":false},{"name":"Close Grip Incline","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back off sets.","optional":false},{"name":"Single Leg Curl","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 3 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":3,"rpe":"6"},{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps @ 6, 3 reps @ 7, 3 reps @ 8. No back off sets.","optional":false},{"name":"Overhead Press","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. No back off sets.","optional":false},{"name":"Leg Press","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets.","optional":false},{"name":"Pulldown","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"5-8 reps @ RPE 8 x 3 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"8":{"days":{"1":[{"name":"Squat","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8. -8% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Pause Bench","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -5% from 6 @ 8 x 1 set of 6","optional":false},{"name":"Deficit Deadlift","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":2,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -8% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Seated Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"6-10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":3,"rpe":"6"},{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps @ 6, 3 reps @ 7, 3 reps @ 8. Repeat 3 @ 8 x 1 set of 3","optional":false},{"name":"Pin Squat","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Close Grip Incline","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Single Leg Curl","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8.  -10% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Overhead Press","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -5% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Leg Press","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"Pulldown","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"5-8 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"9":{"days":{"1":[{"name":"Squat","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8. -8% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Pause Bench","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. -5% from 6 @ 8 x 1 set of 6","optional":false},{"name":"Deficit Deadlift","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":2,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -8% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Seated Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"6-10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":3,"rpe":"6"},{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps @ 6, 3 reps @ 7, 3 reps @ 8. Repeat 3 @ 8 x 1 set of 3","optional":false},{"name":"Pin Squat","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Close Grip Incline","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Single Leg Curl","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8.  -10% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Overhead Press","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8, then -5% from 4 @ 8 x 1 set of 4.","optional":false},{"name":"Leg Press","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"Pulldown","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"5-8 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"10":{"days":{"1":[{"name":"Squat","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8. -8% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Pause Bench","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"Deficit Deadlift","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":2,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Seated Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"6-10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":3,"rpe":"6"},{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps @ 6, 3 reps @ 7, 3 reps @ 8. Repeat 3 @ 8 x 1 set of 3","optional":false},{"name":"Pin Squat","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Close Grip Incline","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Single Leg Curl","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8.  -10% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Overhead Press","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. Repeat 4 @ 8 x 1 set of 4","optional":false},{"name":"Leg Press","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"Pulldown","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"5-8 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"11":{"days":{"1":[{"name":"Squat","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8. -8% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Pause Bench","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"Deficit Deadlift","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":2,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Seated Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"6-10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":3,"rpe":"6"},{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps @ 6, 3 reps @ 7, 3 reps @ 8. Repeat 3 @ 8 x 1 set of 3","optional":false},{"name":"Pin Squat","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Close Grip Incline","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Single Leg Curl","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8.  -10% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Overhead Press","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. Repeat 4 @ 8 x 1 set of 4","optional":false},{"name":"Leg Press","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"Pulldown","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"5-8 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]},"12":{"days":{"1":[{"name":"Squat","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8. -8% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Pause Bench","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":3,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"Deficit Deadlift","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":2,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Seated Row","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"6-10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"2":[{"name":"Pause Bench","sets":[{"reps":3,"rpe":"6"},{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps @ 6, 3 reps @ 7, 3 reps @ 8. Repeat 3 @ 8 x 1 set of 3","optional":false},{"name":"Pin Squat","sets":[{"reps":5,"rpe":"6"},{"reps":5,"rpe":"7"},{"reps":5,"rpe":"8"}],"restMin":3,"notes":"5 reps @ RPE 6, 5 reps @ RPE 7, 5 reps @ RPE 8. -5% from 5 @ 8 x 1 set of 5 reps","optional":false},{"name":"Close Grip Incline","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ 6, 8 reps @ RPE 7, 8 reps @ RPE 8. Repeat 8 reps @ RPE 8 x 1 set of 8","optional":false},{"name":"Single Leg Curl","sets":[{"reps":10,"rpe":"8"}],"restMin":2,"notes":"8 to 10 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}],"3":[{"name":"Deadlift","sets":[{"reps":3,"rpe":"7"},{"reps":3,"rpe":"8"}],"restMin":3,"notes":"3 reps 6, 3 reps @ 7, 3 reps @ 8.  -10% from 3 @ 8 x 1 set of 3","optional":false},{"name":"Overhead Press","sets":[{"reps":4,"rpe":"6"},{"reps":4,"rpe":"7"},{"reps":4,"rpe":"8"}],"restMin":3,"notes":"4 reps @ RPE 6, 4 reps @ RPE 7, 4 reps @ RPE 8. Repeat 4 @ 8 x 1 set of 4","optional":false},{"name":"Leg Press","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ 6, 6 reps @ RPE 7, 6 reps @ RPE 8. Repeat 6 @ 8 x 1 set of 6","optional":false},{"name":"Pulldown","sets":[{"reps":8,"rpe":"8"}],"restMin":2,"notes":"5-8 reps @ RPE 8 x 4 sets. Superset with exercise 3. Rest 2-3 minutes between supersets","optional":true}]},"conditioning":[]}},"3DayTCH":{"1":{"days":{"1":[{"name":"Low Incline Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs. 2 minutes rest between sets. 15 minute cap.","optional":false},{"name":"Seated OHP","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 12 minute cap.","optional":false},{"name":"DB Flat Bench","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":false},{"name":"DB Incline Fly","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":true}],"2":[{"name":"Pendlay Row","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs. 2 minutes rest between sets. 15 minute cap.","optional":false},{"name":"Lat Pulldown","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 12 minute cap.","optional":false},{"name":"Seated Row","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":false},{"name":"DB Bent Over Fly","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":true}],"3":[{"name":"Safety Bar Squat","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs. 2 minutes rest between sets. 15 minute cap.","optional":false},{"name":"Romanian Deadlift","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs. 2 minutes rest between sets. 12 minute cap.","optional":false},{"name":"Lunges","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":false},{"name":"Leg Curl","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":true}]},"conditioning":[]},"2":{"days":{"1":[{"name":"Low Incline Bench","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 5 reps before time is up. 15 minute cap.","optional":false},{"name":"Seated OHP","sets":[],"restMin":2,"notes":"Using 10 @ 7 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Flat Bench","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Pendlay Row","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Lat Pulldown","sets":[],"restMin":2,"notes":"Using 10 @ 7 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"Seated Row","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Safety Bar Squat","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Romanian Deadlift","sets":[],"restMin":2,"notes":"Using 8 @ 7 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Lunges","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"3":{"days":{"1":[{"name":"Low Incline Bench","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 5 reps before time is up. 15 minute cap.\nGo up in weight if you did sets of 8 for first set previous week. Otherwise, try and do more reps.","optional":false},{"name":"Seated OHP","sets":[],"restMin":2,"notes":"Using 10 @ 7 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Flat Bench","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Pendlay Row","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Lat Pulldown","sets":[],"restMin":2,"notes":"Using 10 @ 7 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"Seated Row","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Safety Bar Squat","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Romanian Deadlift","sets":[],"restMin":2,"notes":"Using 8 @ 7 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Lunges","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"4":{"days":{"1":[{"name":"Low Incline Bench","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 5 reps before time is up. 15 minute cap.\nGo up in weight if you did sets of 8 for first set previous week. Otherwise, try and do more reps.","optional":false},{"name":"Seated OHP","sets":[],"restMin":2,"notes":"Using 10 @ 7 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Flat Bench","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Pendlay Row","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Lat Pulldown","sets":[],"restMin":2,"notes":"Using 10 @ 7 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"Seated Row","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Safety Bar Squat","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Romanian Deadlift","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Lunges","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"5":{"days":{"1":[{"name":"Low Incline Bench","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 5 reps before time is up. 15 minute cap.\nGo up in weight if you did sets of 8 for first set previous week. Otherwise, try and do more reps.","optional":false},{"name":"Seated OHP","sets":[],"restMin":2,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Flat Bench","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Pendlay Row","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Lat Pulldown","sets":[],"restMin":2,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"Seated Row","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Safety Bar Squat","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Romanian Deadlift","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Lunges","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"6":{"days":{"1":[{"name":"Low Incline Bench","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 5 reps before time is up. 15 minute cap.\nGo up in weight if you did sets of 8 for first set previous week. Otherwise, try and do more reps.","optional":false},{"name":"Seated OHP","sets":[],"restMin":2,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Flat Bench","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Pendlay Row","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Lat Pulldown","sets":[],"restMin":2,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 12 minutes.","optional":false},{"name":"Seated Row","sets":[],"restMin":5,"notes":"Using 10 @ 8 load, do as many sets of 10 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Safety Bar Squat","sets":[{"reps":8,"rpe":"6","timeCap":15,"label":"5-8 @ RPE6, 15-min cap"}],"restMin":2,"notes":"5 to 8 reps @ RPE 6/4 RIR. Repeat weight for up to 3 sets of 5-8 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 8 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Romanian Deadlift","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Lunges","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"7":{"days":{"1":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ RPE 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets. 3 minutes rest between sets. 15 minute cap.","optional":false},{"name":"High Incline Bench","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs. 2 minutes rest between sets. 15 minute cap.","optional":false},{"name":"Hammer Incline","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":5,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs. 2 minutes rest between sets. 15 minute cap.","optional":false},{"name":"Lateral Raise","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":true}],"2":[{"name":"Chest-Supported Row","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ RPE 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets. 3 minutes rest between sets. 15 minute cap.","optional":false},{"name":"Pulldown","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":2,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs. 2 minutes rest between sets. 15 minute cap.","optional":false},{"name":"DB Row","sets":[{"reps":8,"rpe":"6"},{"reps":8,"rpe":"7"},{"reps":8,"rpe":"8"}],"restMin":5,"notes":"8 reps @ RPE 6, 8 reps @ RPE 7, 8 reps @ RPE 8. No back offs. 2 minutes rest between sets. 15 minute cap.","optional":false},{"name":"Rear Delt Fly","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":true}],"3":[{"name":"Squat","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ RPE 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets. 3 minutes rest between sets. 15 minute cap.","optional":false},{"name":"Hip Thrust","sets":[{"reps":6,"rpe":"6"},{"reps":6,"rpe":"7"},{"reps":6,"rpe":"8"}],"restMin":2,"notes":"6 reps @ RPE 6, 6 reps @ RPE 7, 6 reps @ RPE 8. No back off sets. 3 minutes rest between sets. 12 minute cap.","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":5,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":false},{"name":"Leg Curl","sets":[{"reps":10,"rpe":"6"},{"reps":10,"rpe":"7"},{"reps":10,"rpe":"8"}],"restMin":2,"notes":"10 reps @ RPE 6, 10 reps @ RPE 7, 10 reps @ RPE 8. No back offs. 2 minutes rest between sets. 10 minute cap.","optional":true}]},"conditioning":[]},"8":{"days":{"1":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 4 reps. 15 minute cap.","optional":false},{"name":"High Incline Bench","sets":[],"restMin":2,"notes":"Using 8 @ 7 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Hammer Incline","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Chest-Supported Row","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 2 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Pulldown","sets":[],"restMin":2,"notes":"Using 8 @ 7 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Row","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Squat","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 4 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Hip Thrust","sets":[],"restMin":2,"notes":"Using 6 @ 7 load, do as many sets of 6 in 12 minutes.","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"9":{"days":{"1":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 4 reps. 15 minute cap.\nGo up in weight if you did a set of 6 for first set previous week. Otherwise, try and do more reps.","optional":false},{"name":"High Incline Bench","sets":[],"restMin":2,"notes":"Using 8 @ 7 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Hammer Incline","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Chest-Supported Row","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 2 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Pulldown","sets":[],"restMin":2,"notes":"Using 8 @ 7 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Row","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Squat","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 4 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Hip Thrust","sets":[],"restMin":2,"notes":"Using 6 @ 7 load, do as many sets of 6 in 12 minutes.","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"10":{"days":{"1":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 4 reps. 15 minute cap.\nGo up in weight if you did a set of 6 for first set previous week. Otherwise, try and do more reps.","optional":false},{"name":"High Incline Bench","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Hammer Incline","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Chest-Supported Row","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 2 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Pulldown","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Row","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Squat","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 4 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Hip Thrust","sets":[],"restMin":2,"notes":"Using 6 @ 8 load, do as many sets of 6 in 12 minutes.","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"11":{"days":{"1":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 4 reps. 15 minute cap.\nGo up in weight if you did a set of 6 for first set previous week. Otherwise, try and do more reps.","optional":false},{"name":"High Incline Bench","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Hammer Incline","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Chest-Supported Row","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 2 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Pulldown","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Row","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Squat","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 4 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Hip Thrust","sets":[],"restMin":2,"notes":"Using 6 @ 8 load, do as many sets of 6 in 12 minutes.","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]},"12":{"days":{"1":[{"name":"Bench Press","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for as many sets of 4 reps. 15 minute cap.\nGo up in weight if you did a set of 6 for first set previous week. Otherwise, try and do more reps.","optional":false},{"name":"High Incline Bench","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"Hammer Incline","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"2":[{"name":"Chest-Supported Row","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 2 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Pulldown","sets":[],"restMin":2,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 12 minutes.","optional":false},{"name":"DB Row","sets":[],"restMin":5,"notes":"Using 8 @ 8 load, do as many sets of 8 repetitions as possible in 10 minutes.","optional":false}],"3":[{"name":"Squat","sets":[{"reps":6,"rpe":"6"}],"restMin":2,"notes":"4-6 reps @ RPE 6/4 RIR. Repeat weight for up to 4 sets of 4-6 reps. RPE/RIR can go up to 8/2. 15 minute cap.\nGo up in weight if you did sets of 6 for all sets previous week. Otherwise, try and do more reps.","optional":false},{"name":"Hip Thrust","sets":[],"restMin":2,"notes":"Using 6 @ 8 load, do as many sets of 6 in 12 minutes.","optional":false},{"name":"Split Squat","sets":[{"reps":10,"rpe":"7"}],"restMin":5,"notes":"8-10 reps @ RPE 7/3 RIR. Repeat weight for up to 3 sets of 8-10 reps. RPE/RIR can go up to 9/1. 10 minute cap.\nGo up in weight if you did sets of 10 for all sets previous week. Otherwise, try and do more reps.","optional":false}]},"conditioning":[]}}};

const TEMPLATE_KEY_MAP = {
  "2-Day":                     "2Day",
  "3-Day Superset Strength":   "3DaySS",
  "3-Day Time Cap Hypertrophy":"3DayTCH",
  "4-Day Time Cap Strength":   "2Day",   // placeholder
  "4-Day Superset Hypertrophy":"3DaySS", // placeholder
  "Train Everyday":            "2Day",   // placeholder
};

const TEMPLATES = {
  "2-Day":                     { days:2, focus:"Strength & Conditioning" },
  "3-Day Superset Strength":   { days:3, focus:"Strength" },
  "3-Day Time Cap Hypertrophy":{ days:3, focus:"Hypertrophy" },
  "4-Day Time Cap Strength":   { days:4, focus:"Strength" },
  "4-Day Superset Hypertrophy":{ days:4, focus:"Hypertrophy" },
  "Train Everyday":            { days:7, focus:"Strength & Conditioning" },
};

// Convert raw program data for a given template+week into a day array
// Returns: array of day objects { exercises, conditioning, sessionRPE, notes }
function getPrescription(templateName, weekNum) {
  const key = TEMPLATE_KEY_MAP[templateName] || "2Day";
  const weekData = PROGRAM_DATA[key]?.[String(weekNum)];
  if (!weekData) return null;

  const numDays = TEMPLATES[templateName]?.days || 2;
  const days = [];

  for (let d = 1; d <= numDays; d++) {
    const rawExercises = weekData.days?.[String(d)] || [];
    const cond = weekData.conditioning || [];

    const exercises = rawExercises.map(ex => ({
      name: ex.name,
      sets: ex.sets.map(s => ({
        prescribedReps: s.reps,
        prescribedRpe:  s.rpe,
        label:          s.label || null,
        timeCap:        s.timeCap || null,
        amrapMin:       s.amrapMin || null,
        weight: "",
        reps:   String(s.reps),
        rpe:    s.rpe,
        actual: false,
      })),
      restMin:  ex.restMin || 2,
      notes:    ex.notes || "",
      optional: ex.optional || false,
      exNotes:  "",
    }));

    const condObj = cond.length > 0
      ? { duration: cond[0].duration, zone: cond[0].zone, rpe: cond[0].rpe, mode: "" }
      : { duration: "45", zone: "1", rpe: "3", mode: "" };

    days.push({ exercises, conditioning: condObj, sessionRPE: "", notes: "" });
  }

  return days;
}

// ─── Build week log from prescription ────────────────────────────────────────
function buildWeekLog(templateName, weekNum, prevWeekLogs) {
  const prescribed = getPrescription(templateName, weekNum);
  if (!prescribed) return [];

  return prescribed.map((dayPrescription, dayIdx) => {
    const prevDay = prevWeekLogs?.[dayIdx];

    const exercises = dayPrescription.exercises.map((ex, exIdx) => {
      const prevEx = prevDay?.exercises?.[exIdx];
      // Find best e1RM from prior week for this exact exercise name
      let priorE1RM = null;
      if (prevDay) {
        prevDay.exercises.filter(pe => pe.name === ex.name).forEach(pe => {
          pe.sets.forEach(s => {
            const v = calcE1RM(s.weight, s.reps, s.rpe);
            if (v && (!priorE1RM || v > priorE1RM)) priorE1RM = v;
          });
        });
      }

      const sets = ex.sets.map(ps => {
        const suggested = priorE1RM
          ? suggestWeight(priorE1RM, ps.prescribedReps, ps.prescribedRpe)
          : null;
        return {
          ...ps,
          weight: suggested ? String(suggested) : "",
          actual: false,
        };
      });

      return { ...ex, sets, exNotes: "" };
    });

    return {
      exercises,
      conditioning: { ...dayPrescription.conditioning },
      sessionRPE: "", notes: "",
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcE1RM(weight, reps, rpe) {
  if (!weight || !reps) return null;
  const w = parseFloat(weight), r = parseFloat(reps), e = parseFloat(rpe);
  const rir = isNaN(e) ? 0 : (10 - e);
  const effReps = r + rir;
  return Math.round(w * (1 + effReps / 30));
}

function suggestWeight(e1rm, targetReps, targetRpe) {
  if (!e1rm || !targetReps) return null;
  const r = parseFloat(targetReps), e = parseFloat(targetRpe) || 8;
  const rir = 10 - e;
  const effReps = r + rir;
  const raw = e1rm / (1 + effReps / 30);
  return Math.round(raw / 5) * 5;
}

function saveData(state) {
  try { localStorage.setItem("tc_tracker_v4", JSON.stringify(state)); } catch {}
}


// ─── Name migration map (old → new) ──────────────────────────────────────────
const NAME_MIGRATIONS = {
  "High Bar Back Squat":"Squat","High Bar Squat":"Squat","Low Bar Back Squat":"Squat",
  "2-Count Paused Squat":"Pause Squat","Split Squats":"Split Squat",
  "Conventional Deadlift":"Deadlift","Deficit Deadlift":"Deficit Deadlift",
  "Touch and Go Bench":"Bench Press","1-Count Paused Bench":"Pause Bench",
  "2-Count Paused Bench Press":"Pause Bench",
  "Close Grip Bench Press":"Close Grip Bench","Close Grip Incline Bench":"Close Grip Incline",
  "Incline Bench Press (High)":"Incline Bench",
  "High Incline Bench Press (45*) Barbell":"High Incline Bench",
  "Low Incline (15*) Bench Press":"Low Incline Bench",
  "Hammer Strength Incline":"Hammer Incline",
  "Dumbbell Bench Press (Flat)":"DB Flat Bench","Dumbbell Bench Press (High Incline)":"DB Incline Bench",
  "Dumbbell Flat Bench":"DB Flat Bench","Dumbell Flye (Incline)":"DB Incline Fly",
  "Bent Over Dumbbell Flyes":"DB Bent Over Fly","Lateral Raises":"Lateral Raise",
  "Rear Pec-Deck Flye":"Rear Delt Fly","Seated Overhead Press":"Seated OHP",
  "High Pulley Machine Pull Down":"Pulldown","High Handle Pull Down":"Pulldown",
  "Lat Pull Down":"Lat Pulldown","1-Arm DB Row":"DB Row",
  "Lying Leg Curl":"Leg Curl","Seated Hamstrings Curl":"Leg Curl",
  "Single Leg Hamstring Curl":"Single Leg Curl","Walking Lunges":"Lunges",
};

// ─── Data migration (handles renamed exercises from old localStorage) ─────────
const EXERCISE_RENAMES = {
  "High Bar Back Squat":"Squat","High Bar Squat":"Squat","Low Bar Back Squat":"Squat",
  "2-Count Paused Squat":"Pause Squat","Split Squats":"Split Squat",
  "Conventional Deadlift":"Deadlift","Deficit Deadlift":"Deficit Deadlift",
  "Touch and Go Bench":"Bench Press","1-Count Paused Bench":"Pause Bench",
  "2-Count Paused Bench Press":"Pause Bench",
  "Close Grip Bench Press":"Close Grip Bench","Close Grip Incline Bench":"Close Grip Incline",
  "Incline Bench Press (High)":"Incline Bench",
  "High Incline Bench Press (45*) Barbell":"High Incline Bench",
  "Low Incline (15*) Bench Press":"Low Incline Bench",
  "Hammer Strength Incline":"Hammer Incline",
  "Dumbbell Bench Press (Flat)":"DB Flat Bench",
  "Dumbbell Bench Press (High Incline)":"DB Incline Bench",
  "Dumbbell Flat Bench":"DB Flat Bench","Dumbell Flye (Incline)":"DB Incline Fly",
  "Bent Over Dumbbell Flyes":"DB Bent Over Fly","Lateral Raises":"Lateral Raise",
  "Rear Pec-Deck Flye":"Rear Delt Fly","Seated Overhead Press":"Seated OHP",
  "High Pulley Machine Pull Down":"Pulldown","High Handle Pull Down":"Pulldown",
  "Lat Pull Down":"Lat Pulldown","1-Arm DB Row":"DB Row",
  "Lying Leg Curl":"Leg Curl","Seated Hamstrings Curl":"Leg Curl",
  "Single Leg Hamstring Curl":"Single Leg Curl","Walking Lunges":"Lunges",
};

function migrateLoadedData(data) {
  if (!data) return data;
  // Walk weeks → days → exercises and rename any stale names
  if (Array.isArray(data.weeks)) {
    data.weeks = data.weeks.map(week =>
      (week || []).map(day => ({
        ...day,
        exercises: (day?.exercises || []).map(ex => ({
          ...ex,
          name: EXERCISE_RENAMES[ex.name] || ex.name,
        }))
      }))
    );
  }
  return data;
}

function loadData() {
  try {
    const raw = JSON.parse(localStorage.getItem("tc_tracker_v4"));
    return migrateLoadedData(raw);
  } catch { return null; }
}

// ─── Compact bit-packed codec (~23 chars) ────────────────────────────────────
// Stores: current week (4 bits) + up to 8 exercises × (weight 7b + reps 5b + rpe 4b)
// = 132 bits → 22-23 base64url chars
// Exercises are the unique exercise names seen across all days, in order, up to 8.
// For each exercise, saves the most recent set that has weight+reps logged.

const RPE_ENC = [6,6.5,7,7.5,8,8.5,9,9.5,10]; // idx 1-9, 0=empty
const RPE_DEC = {6:"6",6.5:"6.5",7:"7",7.5:"7.5",8:"8",8.5:"8.5",9:"9",9.5:"9.5",10:"10"};

function getExerciseSlots(logs) {
  // Collect up to 8 unique exercise names in encounter order
  const seen = [], order = [];
  (logs || []).forEach(week =>
    (week || []).forEach(day =>
      (day?.exercises || []).forEach(ex => {
        if (ex?.name && !seen.includes(ex.name)) { seen.push(ex.name); order.push(ex.name); }
      })
    )
  );
  return order.slice(0, 8);
}

function encodeState(template, logs) {
  const slots = getExerciseSlots(logs);
  // Find current week (last week with any logged set)
  let curWeek = 0;
  (logs || []).forEach((week, wi) => {
    (week || []).forEach(day =>
      (day?.exercises || []).forEach(ex =>
        (ex?.sets || []).forEach(s => { if (s?.actual && s?.weight && s?.reps) curWeek = wi; })
      )
    );
  });

  // For each slot, find most recent logged set
  const slotData = slots.map(name => {
    let best = null;
    (logs || []).forEach(week =>
      (week || []).forEach(day =>
        (day?.exercises || []).forEach(ex => {
          if (ex?.name !== name) return;
          (ex?.sets || []).forEach(s => {
            if (s?.actual && s?.weight && s?.reps) best = s;
          });
        })
      )
    );
    return best;
  });
  // Pad to 8 slots
  while (slotData.length < 8) slotData.push(null);

  // Bit-pack into BigInt
  let val = BigInt(curWeek & 0xF);
  for (const s of slotData) {
    const w = s?.weight ? Math.min(Math.round(parseFloat(s.weight) / 5), 127) || 1 : 0;
    const r = s?.reps   ? Math.min(Math.max(Math.round(parseFloat(s.reps)), 0), 20) : 0;
    const rpeRaw = s?.rpe ? parseFloat(s.rpe) : 0;
    const rpeIdx = rpeRaw ? (RPE_ENC.indexOf(rpeRaw) + 1 || 0) : 0;
    val = (val << 7n) | BigInt(w & 0x7F);
    val = (val << 5n) | BigInt(r & 0x1F);
    val = (val << 4n) | BigInt(rpeIdx & 0xF);
  }

  // Encode exercise name index as a short prefix (base36 length + initials)
  const nameKey = slots.map(n => n.split(" ").map(w=>w[0]||"").join("")).join("").toUpperCase().slice(0,8);

  // Convert BigInt to 17-byte buffer then base64url
  const bytes = [];
  let tmp = val;
  for (let i = 0; i < 17; i++) { bytes.unshift(Number(tmp & 0xFFn)); tmp >>= 8n; }
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
  return b64;
}

function decodeState(pw, logs) {
  try {
    const slots = getExerciseSlots(logs);
    const clean = pw.replace(/[\s\-]/g,"");
    const padded = clean.replace(/-/g,"+").replace(/_/g,"/") + "=".repeat((4 - clean.length % 4) % 4);
    const bin = atob(padded);
    const bytes = Array.from(bin).map(c => c.charCodeAt(0));
    let val = BigInt(0);
    for (const b of bytes) val = (val << 8n) | BigInt(b);

    const slotData = [];
    for (let i = 7; i >= 0; i--) {
      const rpeIdx = Number(val & 0xFn); val >>= 4n;
      const r     = Number(val & 0x1Fn); val >>= 5n;
      const w     = Number(val & 0x7Fn); val >>= 7n;
      slotData.unshift({
        weight: w ? String(w * 5) : "",
        reps:   r ? String(r)     : "",
        rpe:    rpeIdx ? String(RPE_ENC[rpeIdx - 1] ?? "") : "",
      });
    }
    const curWeek = Number(val & 0xFn);

    return { slots, slotData, curWeek };
  } catch { return null; }
}

function chunkPw(pw) { return pw.match(/.{1,5}/g)?.join("-") || pw; }

// ─── CRT colors ──────────────────────────────────────────────────────────────
const CRT = {
  bg:"#000a00", green:"#00ff41", dimGreen:"#00b32c",
  darkGreen:"#003a0f", glow:"0 0 8px #00ff41, 0 0 20px #00b32c44",
  glowSm:"0 0 6px #00ff4180", border:"#00ff4140",
};

// ─── SetRow ───────────────────────────────────────────────────────────────────
function SetRow({ set, idx, onChange, onDelete }) {
  const e1rm = calcE1RM(set.weight, set.reps, set.rpe);
  const isEdited = set.actual;
  const hasSuggestion = set.weight && !set.actual;

  return (
    <div style={{
      display:"grid", gridTemplateColumns:"22px 1fr 1fr 60px 46px 24px",
      gap:"3px", alignItems:"center", padding:"7px 0",
      borderBottom:`1px solid ${T.border}`,
    }}>
      <span style={{ color:T.textSoft, fontSize:"11px", fontFamily:"monospace", fontWeight:600 }}>
        S{idx+1}
      </span>

      {/* Weight */}
      <div style={{ position:"relative" }}>
        <input type="number" value={set.weight}
          placeholder={set.weight || "lbs"}
          onChange={e => onChange({ ...set, weight:e.target.value, actual:true })}
          style={{
            width:"100%", background: hasSuggestion ? T.accentBg : T.bg,
            border:`1px solid ${isEdited ? T.accent : hasSuggestion ? "#93c5fd" : T.border2}`,
            borderRadius:"6px", color:T.text, padding:"5px 7px", fontSize:"13px",
          }} />
        {hasSuggestion && (
          <div style={{ position:"absolute", top:"-7px", right:"3px",
            fontSize:"11px", color:T.accent, fontWeight:700, letterSpacing:"0.05em" }}>
            SUGGESTED
          </div>
        )}
      </div>

      {/* Reps */}
      <input type="number" value={set.reps}
        onChange={e => onChange({ ...set, reps:e.target.value, actual:true })}
        style={{
          width:"100%", background:T.bg, border:`1px solid ${T.border2}`,
          borderRadius:"6px", color:T.text, padding:"5px 7px", fontSize:"13px",
        }} />

      {/* RPE badge */}
      <div style={{
        background: set.rpe ? getRPEColor(set.rpe)+"18" : T.bg,
        border:`1px solid ${set.rpe ? getRPEColor(set.rpe) : T.border2}`,
        borderRadius:"6px", padding:"4px 4px", textAlign:"center",
        color: set.rpe ? getRPEColor(set.rpe) : T.textSoft,
        fontSize:"12px", fontWeight:700,
      }}>
        {set.prescribedRpe ? `@${set.prescribedRpe}` : "RPE"}
      </div>

      {/* e1RM */}
      <span style={{ fontSize:"11px", color: e1rm ? T.orange : T.textSoft,
        fontWeight:600, textAlign:"right", paddingRight:"4px" }}>
        {e1rm ? `~${e1rm}` : "—"}
      </span>

      <button onClick={onDelete} style={{
        background:"transparent", border:"none",
        color:T.textSoft, cursor:"pointer", fontSize:"15px", lineHeight:1,
      }}>×</button>
    </div>
  );
}

// ─── ExerciseBlock ────────────────────────────────────────────────────────────
function ExerciseBlock({ exercise, onChange, onDelete, weekIdx, exIdx, allWeeks, templateName }) {
  const [expanded, setExpanded] = useState(true);
  const doneSets = exercise.sets.filter(s => s.weight && s.reps).length;
  const totalSets = exercise.sets.length;

  // Find prior best e1RM for suggestion label
  let priorE1RM = null;
  if (weekIdx > 0) {
    const prevWeek = allWeeks[weekIdx - 1];
    // search all days
    prevWeek?.forEach(day => {
      day.exercises.filter(e => e.name === exercise.name).forEach(e => {
        e.sets.forEach(s => {
          const v = calcE1RM(s.weight, s.reps, s.rpe);
          if (v && (!priorE1RM || v > priorE1RM)) priorE1RM = v;
        });
      });
    });
  }

  const addSet = () => onChange({
    ...exercise,
    sets:[...exercise.sets,{prescribedReps:"",prescribedRpe:"",weight:"",reps:"",rpe:"",actual:true}]
  });
  const updateSet = (i,s) => onChange({ ...exercise, sets:exercise.sets.map((x,idx)=>idx===i?s:x) });
  const deleteSet = (i) => onChange({ ...exercise, sets:exercise.sets.filter((_,idx)=>idx!==i) });

  return (
    <div style={{
      background:T.card, border:`1px solid ${T.border}`,
      borderRadius:"12px", marginBottom:"10px",
      boxShadow:"0 1px 3px rgba(0,0,0,0.06)",
      borderLeft: exercise.optional ? `3px solid ${T.textSoft}` : `3px solid ${T.accent}`,
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"12px 14px", cursor:"pointer" }}
        onClick={() => setExpanded(e=>!e)}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"18px" }}>{expanded?"▾":"▸"}</span>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span style={{ fontWeight:700, color:T.text, fontSize:"14px" }}>{exercise.name}</span>
              {exercise.optional && (
                <span style={{ fontSize:"11px", background:T.border, color:T.textMid,
                  padding:"1px 6px", borderRadius:"10px", textTransform:"uppercase",
                  letterSpacing:"0.05em" }}>Optional</span>
              )}
            </div>
            {exercise.notes && (
              <div style={{ fontSize:"11px", color:T.textMid, marginTop:"1px" }}>
                {exercise.notes}
              </div>
            )}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {priorE1RM && (
            <div style={{ fontSize:"10px", background:T.orangeBg, color:T.orange,
              padding:"2px 8px", borderRadius:"10px", fontWeight:600 }}>
              Prior e1RM: {priorE1RM}
            </div>
          )}
          <div style={{ fontSize:"11px", background: doneSets===totalSets ? T.greenBg : T.accentBg,
            color: doneSets===totalSets ? T.green : T.accent,
            padding:"2px 8px", borderRadius:"10px", fontWeight:600 }}>
            {doneSets}/{totalSets} sets
          </div>
          <div style={{ fontSize:"11px", color:T.textSoft }}>
            {exercise.restMin}min rest
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding:"0 14px 14px" }}>
          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:"22px 1fr 1fr 60px 46px 24px",
            gap:"4px", padding:"0 0 4px" }}>
            {["","Weight (lbs)","Reps","Target","e1RM",""].map((h,i) => (
              <span key={i} style={{ fontSize:"10px", color:T.textSoft,
                textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</span>
            ))}
          </div>

          {exercise.sets.map((s,i) => (
            <SetRow key={i} set={s} idx={i}
              onChange={u=>updateSet(i,u)} onDelete={()=>deleteSet(i)} />
          ))}

          <div style={{ display:"flex", gap:"8px", marginTop:"10px", alignItems:"center" }}>
            <button onClick={addSet} style={{
              background:"transparent", border:`1px dashed ${T.border2}`,
              borderRadius:"6px", color:T.textMid, cursor:"pointer",
              fontSize:"12px", padding:"5px 14px", transition:"all 0.15s" }}
              onMouseEnter={e=>{e.target.style.borderColor=T.accent;e.target.style.color=T.accent;}}
              onMouseLeave={e=>{e.target.style.borderColor=T.border2;e.target.style.color=T.textMid;}}>
              + Add Set
            </button>

            <input placeholder="Exercise notes…" value={exercise.exNotes}
              onChange={e=>onChange({...exercise,exNotes:e.target.value})}
              style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`,
                borderRadius:"6px", color:T.textMid, padding:"5px 10px", fontSize:"12px" }} />

            <button onClick={onDelete} style={{ background:"transparent",
              border:`1px solid ${T.border}`, borderRadius:"6px",
              color:T.textSoft, cursor:"pointer", fontSize:"11px", padding:"5px 10px" }}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ConditioningBlock ────────────────────────────────────────────────────────
function ConditioningBlock({ cond, onChange }) {
  return (
    <div style={{ background:T.card, border:`1px solid #bae6fd`,
      borderRadius:"12px", padding:"14px", marginBottom:"12px" }}>
      <div style={{ color:"#0284c7", fontSize:"11px", fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"10px" }}>
        🫀 Conditioning
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:"6px" }}>
        {[
          { label:"Mode", key:"mode", type:"select",
            options: CONDITIONING_MODES },
          { label:"Duration (min)", key:"duration", type:"number" },
          { label:"Zone", key:"zone", type:"select",
            options:["","1","2","3","4","5"], labels:["—","Zone 1","Zone 2","Zone 3","Zone 4","Zone 5"] },
          { label:"RPE", key:"rpe", type:"select",
            options:["","3","4","5","6","7","8","9","10"] },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize:"10px", color:T.textSoft, textTransform:"uppercase",
              display:"block", marginBottom:"4px" }}>{f.label}</label>
            {f.type==="select" ? (
              <select value={cond[f.key]} onChange={e=>onChange({...cond,[f.key]:e.target.value})}
                style={{ width:"100%", background:T.bg, border:`1px solid ${T.border2}`,
                  borderRadius:"6px", color:T.text, padding:"5px 6px", fontSize:"13px" }}>
                {(f.options).map((v,i) =>
                  <option key={v} value={v}>{f.labels?f.labels[i]:v||"—"}</option>)}
              </select>
            ) : (
              <input type="number" value={cond[f.key]}
                onChange={e=>onChange({...cond,[f.key]:e.target.value})}
                style={{ width:"100%", background:T.bg, border:`1px solid ${T.border2}`,
                  borderRadius:"6px", color:T.text, padding:"5px 7px", fontSize:"13px",
                  boxSizing:"border-box" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WorkoutDay ───────────────────────────────────────────────────────────────
function WorkoutDay({ day, dayNum, onUpdate, weekIdx, allWeeks, templateName }) {
  const DEFAULT_EXERCISE = {
    name:"Bench Press", sets:[{prescribedReps:5,prescribedRpe:"8",weight:"",reps:"5",rpe:"8",actual:false}],
    restMin:2, notes:"", optional:false, exNotes:""
  };

  const totalDone = day.exercises.reduce((a,ex)=>
    a+ex.sets.filter(s=>s.weight&&s.reps).length,0);

  return (
    <div style={{ paddingBottom:"40px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:"16px" }}>
        <div>
          <h2 style={{ margin:0, color:T.text, fontSize:"22px", fontWeight:700 }}>Day {dayNum}</h2>
          {totalDone > 0 && (
            <span style={{ fontSize:"12px", color:T.green, fontWeight:600 }}>
              ✓ {totalDone} sets logged
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <span style={{ fontSize:"11px", color:T.textMid }}>Session RPE</span>
          <select value={day.sessionRPE}
            onChange={e=>onUpdate({...day,sessionRPE:e.target.value})}
            style={{ background:T.bg, border:`1px solid ${day.sessionRPE?getRPEColor(day.sessionRPE):T.border2}`,
              borderRadius:"6px", color:day.sessionRPE?getRPEColor(day.sessionRPE):T.textMid,
              padding:"4px 8px", fontSize:"12px", fontWeight:600 }}>
            <option value="">—</option>
            {[5,6,7,8,9,10].map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {day.exercises.map((ex,i) => (
        <ExerciseBlock key={i} exercise={ex}
          weekIdx={weekIdx} exIdx={i}
          allWeeks={allWeeks} templateName={templateName}
          onChange={u=>onUpdate({...day,exercises:day.exercises.map((e,idx)=>idx===i?u:e)})}
          onDelete={()=>onUpdate({...day,exercises:day.exercises.filter((_,idx)=>idx!==i)})} />
      ))}

      <button
        onClick={()=>onUpdate({...day,exercises:[...day.exercises,{...DEFAULT_EXERCISE}]})}
        style={{ width:"100%", background:T.bg, border:`1px dashed ${T.accent}`,
          borderRadius:"10px", color:T.accent, cursor:"pointer", fontSize:"13px",
          padding:"11px", marginBottom:"12px", fontWeight:600, transition:"all 0.15s" }}
        onMouseEnter={e=>e.target.style.background=T.accentBg}
        onMouseLeave={e=>e.target.style.background=T.bg}>
        + Add Exercise
      </button>

      <ConditioningBlock cond={day.conditioning}
        onChange={c=>onUpdate({...day,conditioning:c})} />

      <div>
        <label style={{ fontSize:"11px", color:T.textMid, fontWeight:600,
          display:"block", marginBottom:"6px" }}>Session Notes</label>
        <textarea value={day.notes} onChange={e=>onUpdate({...day,notes:e.target.value})}
          placeholder="How did it go? Notes for next time…"
          style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`,
            borderRadius:"8px", color:T.textMid, padding:"10px", fontSize:"13px",
            resize:"vertical", minHeight:"64px", boxSizing:"border-box" }} />
      </div>
    </div>
  );
}

// ─── Plate Calculator logic ───────────────────────────────────────────────────
function calcPlates(targetWeight) {
  if (!targetWeight || targetWeight < BAR_WEIGHT) return null;
  const perSide = (targetWeight - BAR_WEIGHT) / 2;
  let remaining = perSide;
  const used = [];
  for (const plate of PLATE_INVENTORY) {
    if (remaining <= 0) break;
    const maxCount = plate.perSide;
    const count = Math.min(maxCount, Math.floor(remaining / plate.weight));
    if (count > 0) {
      used.push({ ...plate, count });
      remaining -= count * plate.weight;
    }
  }
  const loaded = BAR_WEIGHT + used.reduce((a,p) => a + p.weight * p.count * 2, 0);
  return { used, loaded, remainder: Math.round((targetWeight - loaded) * 10) / 10 };
}

// ─── Plate Calculator ─────────────────────────────────────────────────────────
function PlateCalc() {
  const [target, setTarget] = useState("");
  const result = target ? calcPlates(parseFloat(target)) : null;
  const maxPossible = BAR_WEIGHT + PLATE_INVENTORY.reduce((a,p)=>a+p.weight*p.perSide*2,0);

  return (
    <div style={{ paddingTop:"20px", paddingBottom:"40px" }}>
      <h2 style={{ margin:"0 0 4px", color:T.text, fontSize:"22px", fontWeight:700 }}>
        Plate Calculator
      </h2>
      <p style={{ color:T.textMid, fontSize:"13px", margin:"0 0 20px" }}>
        45 lb bar · max loadable: <span style={{ color:T.orange, fontWeight:600 }}>{maxPossible} lbs</span>
      </p>

      <input type="number" value={target} onChange={e=>setTarget(e.target.value)}
        placeholder="Enter target weight (lbs)"
        style={{ width:"100%", background:T.card, border:`2px solid ${T.border2}`,
          borderRadius:"12px", color:T.text, padding:"14px 16px",
          fontSize:"18px", boxSizing:"border-box", outline:"none", transition:"border-color 0.2s",
          marginBottom:"16px" }}
        onFocus={e=>e.target.style.borderColor=T.accent}
        onBlur={e=>e.target.style.borderColor=T.border2} />

      {target && !result && (
        <div style={{ background:T.redBg, border:`1px solid #fca5a5`,
          borderRadius:"10px", padding:"12px 16px", color:T.red, fontSize:"14px" }}>
          Below bar weight (45 lbs)
        </div>
      )}

      {result && <>
        {/* Visual bar */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:"12px",
          padding:"20px", marginBottom:"14px" }}>
          <div style={{ fontSize:"11px", color:T.textSoft, textTransform:"uppercase",
            letterSpacing:"0.08em", marginBottom:"12px", fontWeight:600 }}>Bar Diagram</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:"2px", minHeight:"56px", overflowX:"auto" }}>
            <div style={{ width:"8px", height:"44px", background:"#94a3b8", borderRadius:"3px 0 0 3px", flexShrink:0 }} />
            {[...result.used].reverse().map((p,i)=>
              Array.from({length:p.count}).map((_,j)=>(
                <div key={`l-${i}-${j}`} style={{ width:"15px", flexShrink:0,
                  height:`${Math.max(26,Math.min(56,26+p.weight*0.55))}px`,
                  background:p.color, borderRadius:"2px", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:"7px", color:"#fff", fontWeight:700,
                  writingMode:"vertical-rl", transform:"rotate(180deg)",
                  boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.2)" }}>{p.weight}</div>
              ))
            )}
            <div style={{ height:"10px", width:"80px", flexShrink:0,
              background:"linear-gradient(180deg,#cbd5e1,#94a3b8,#cbd5e1)",
              borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"11px", color:"#fff", fontWeight:700 }}>BAR 45</div>
            {result.used.map((p,i)=>
              Array.from({length:p.count}).map((_,j)=>(
                <div key={`r-${i}-${j}`} style={{ width:"15px", flexShrink:0,
                  height:`${Math.max(26,Math.min(56,26+p.weight*0.55))}px`,
                  background:p.color, borderRadius:"2px", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:"7px", color:"#fff", fontWeight:700,
                  writingMode:"vertical-rl",
                  boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.2)" }}>{p.weight}</div>
              ))
            )}
            <div style={{ width:"8px", height:"44px", background:"#94a3b8", borderRadius:"0 3px 3px 0", flexShrink:0 }} />
          </div>
        </div>

        {/* Per side breakdown */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`,
          borderRadius:"12px", padding:"16px", marginBottom:"12px" }}>
          <div style={{ fontSize:"11px", color:T.textSoft, textTransform:"uppercase",
            letterSpacing:"0.08em", marginBottom:"10px", fontWeight:600 }}>Per Side</div>
          {result.used.length===0
            ? <div style={{ color:T.textMid }}>Bar only (45 lbs)</div>
            : result.used.map(p=>(
              <div key={p.weight} style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ width:"12px", height:"26px", background:p.color, borderRadius:"3px" }} />
                  <span style={{ color:T.text, fontSize:"15px", fontWeight:600 }}>{p.weight} lbs</span>
                </div>
                <span style={{ color:T.textMid }}>×{p.count} per side</span>
              </div>
            ))
          }
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          <div style={{ background:T.greenBg, border:`1px solid #86efac`,
            borderRadius:"10px", padding:"14px", textAlign:"center" }}>
            <div style={{ fontSize:"26px", color:T.green, fontWeight:800 }}>{result.achieved}</div>
            <div style={{ fontSize:"11px", color:T.textMid, marginTop:"2px" }}>Achieved (lbs)</div>
          </div>
          <div style={{ background: result.remaining>0 ? T.redBg : T.greenBg,
            border:`1px solid ${result.remaining>0?"#fca5a5":"#86efac"}`,
            borderRadius:"10px", padding:"14px", textAlign:"center" }}>
            <div style={{ fontSize:"26px", fontWeight:800,
              color: result.remaining>0 ? T.red : T.green }}>
              {result.remaining>0 ? `-${result.remaining}` : "✓"}
            </div>
            <div style={{ fontSize:"11px", color:T.textMid, marginTop:"2px" }}>
              {result.remaining>0 ? "Short (lbs)" : "Exact match"}
            </div>
          </div>
        </div>
        {result.remaining>0 && (
          <div style={{ marginTop:"10px", background:T.redBg, border:`1px solid #fca5a5`,
            borderRadius:"8px", padding:"10px 14px", fontSize:"12px", color:T.red }}>
            ⚠ Can't hit {target} lbs exactly — closest is {result.achieved} lbs.
          </div>
        )}
      </>}

      {/* Inventory */}
      <div style={{ marginTop:"20px", background:T.card, border:`1px solid ${T.border}`,
        borderRadius:"12px", padding:"16px" }}>
        <div style={{ fontSize:"11px", color:T.textSoft, textTransform:"uppercase",
          letterSpacing:"0.08em", marginBottom:"10px", fontWeight:600 }}>Your Plate Inventory</div>
        {PLATE_INVENTORY.map(p=>(
          <div key={p.weight} style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <div style={{ width:"10px", height:"20px", background:p.color, borderRadius:"2px" }} />
              <span style={{ color:T.text, fontSize:"14px" }}>{p.weight} lbs</span>
            </div>
            <span style={{ color:T.textMid, fontSize:"13px" }}>
              {p.perSide*2} total ({p.perSide}/side)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Progress View ────────────────────────────────────────────────────────────
function ProgressView({ weeks }) {
  const allExerciseNames = [...new Set(
    weeks.flat().flatMap(d => d.exercises.map(e => e.name))
  )];
  const loggedExerciseNames = new Set(
    weeks.flat().flatMap(d => d.exercises.filter(e=>e.sets.some(s=>s.weight&&s.reps)).map(e=>e.name))
  );
  const [selectedEx, setSelectedEx] = useState(allExerciseNames[0] || "Squat");

  const e1rmTrend = weeks.map((wDays,wi)=>{
    let best = null;
    wDays.forEach(d=>d.exercises.filter(e=>e.name===selectedEx).forEach(e=>
      e.sets.forEach(s=>{
        const v=calcE1RM(s.weight,s.reps,s.rpe);
        if(v&&(!best||v>best)) best=v;
      })));
    return { week:`W${wi+1}`, e1rm:best };
  }).filter(p=>p.e1rm!==null);

  const allSets = weeks.flat().flatMap(d=>d.exercises.flatMap(e=>e.sets.filter(s=>s.weight&&s.reps)));
  const totalSets = allSets.length;
  const totalReps = allSets.reduce((a,s)=>a+(parseInt(s.reps)||0),0);
  const weeksActive = weeks.filter(wDays=>wDays.some(d=>d.exercises.some(e=>e.sets.some(s=>s.weight)))).length;

  const exCounts = {};
  weeks.flat().forEach(d=>d.exercises.forEach(e=>{
    if(e.sets.some(s=>s.weight&&s.reps))
      exCounts[e.name]=(exCounts[e.name]||0)+e.sets.filter(s=>s.weight&&s.reps).length;
  }));
  const topEx = Object.entries(exCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);

  const weeklyVol = weeks.map((wDays,i)=>({
    week:`W${i+1}`,
    sets:wDays.reduce((a,d)=>a+d.exercises.reduce((b,e)=>b+e.sets.filter(s=>s.weight&&s.reps).length,0),0),
  })).filter(w=>w.sets>0);

  const Tip = ({ active, payload, label }) => active&&payload?.length ? (
    <div style={{ background:T.card, border:`1px solid ${T.border}`,
      borderRadius:"8px", padding:"8px 12px", fontSize:"12px", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
      <div style={{ color:T.textMid }}>{label}</div>
      <div style={{ color:T.orange, fontWeight:700 }}>
        {payload[0].value} {payload[0].name==="e1rm"?"lbs (e1RM)":"sets"}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ paddingTop:"20px", paddingBottom:"40px" }}>
      <h2 style={{ margin:"0 0 20px", color:T.text, fontSize:"22px", fontWeight:700 }}>Progress</h2>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:"10px", marginBottom:"20px" }}>
        {[
          {label:"Total Sets",   value:totalSets,   color:T.accent},
          {label:"Total Reps",   value:totalReps,   color:"#0284c7"},
          {label:"Weeks Active", value:weeksActive, color:T.green},
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`,
            borderRadius:"12px", padding:"14px", textAlign:"center",
            boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize:"28px", color:s.color, fontWeight:800 }}>{s.value}</div>
            <div style={{ fontSize:"10px", color:T.textSoft, textTransform:"uppercase",
              letterSpacing:"0.05em", marginTop:"4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* e1RM chart */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`,
        borderRadius:"12px", padding:"16px", marginBottom:"14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <div style={{ fontSize:"12px", color:T.textMid, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.08em" }}>Estimated 1RM Trend</div>
          <select value={selectedEx} onChange={e=>setSelectedEx(e.target.value)}
            style={{ background:T.card, border:`1px solid ${T.border2}`,
              borderRadius:"6px", color:T.text, padding:"4px 8px", fontSize:"11px",
              colorScheme: "light dark" }}>
            {(allExerciseNames.length>0?allExerciseNames:["Squat"]).map(ex=>
              <option key={ex} value={ex}>{loggedExerciseNames.has(ex) ? "● " : ""}{ex}</option>)}
          </select>
        </div>
        {e1rmTrend.length<2 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:T.textSoft, fontSize:"13px" }}>
            Log at least 2 weeks of <strong style={{color:T.orange}}>{selectedEx}</strong> to see trend
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={e1rmTrend} margin={{top:4,right:8,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="week" tick={{fill:T.textSoft,fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:T.textSoft,fontSize:11}} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="e1rm" stroke={T.orange} strokeWidth={2.5}
                dot={{fill:T.orange,r:4,strokeWidth:0}} activeDot={{r:6}} name="e1rm" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Volume chart */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`,
        borderRadius:"12px", padding:"16px", marginBottom:"14px" }}>
        <div style={{ fontSize:"12px", color:T.textMid, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"12px" }}>
          Weekly Volume (Sets)
        </div>
        {weeklyVol.length<2 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:T.textSoft, fontSize:"13px" }}>
            Log at least 2 weeks to see trend
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={weeklyVol} margin={{top:4,right:8,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="week" tick={{fill:T.textSoft,fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:T.textSoft,fontSize:11}} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="sets" stroke={T.accent} strokeWidth={2}
                dot={{fill:T.accent,r:3,strokeWidth:0}} activeDot={{r:5}} name="sets" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {topEx.length>0 && (
        <div style={{ background:T.card, border:`1px solid ${T.border}`,
          borderRadius:"12px", padding:"16px" }}>
          <div style={{ fontSize:"12px", color:T.textMid, fontWeight:700,
            textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"12px" }}>Most Trained</div>
          {topEx.map(([name,count])=>{
            const pct=Math.round((count/(topEx[0][1]||1))*100);
            return (
              <div key={name} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                  <span style={{ color:T.text, fontSize:"13px" }}>{name}</span>
                  <span style={{ color:T.orange, fontSize:"13px", fontWeight:700 }}>{count} sets</span>
                </div>
                <div style={{ height:"4px", background:T.border, borderRadius:"2px" }}>
                  <div style={{ height:"100%", width:`${pct}%`,
                    background:`linear-gradient(90deg,${T.accent},${T.orange})`,
                    borderRadius:"2px", transition:"width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CRT Password View ────────────────────────────────────────────────────────
function CRTScreen({ children }) {
  return (
    <div style={{ background:CRT.bg, border:`1px solid ${CRT.border}`, borderRadius:"8px",
      padding:"24px", position:"relative", overflow:"hidden",
      boxShadow:`inset 0 0 60px #001a0088, 0 0 30px #00ff4112` }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:10,
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)" }} />
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:9,
        background:"radial-gradient(ellipse at center,transparent 60%,rgba(0,0,0,0.5) 100%)" }} />
      <div style={{ position:"relative", zIndex:11 }}>{children}</div>
    </div>
  );
}

function PasswordView({ template, weeks, onRestore }) {
  const [mode, setMode] = useState("save");
  const [copyFlash, setCopyFlash] = useState(false);
  const [inputPw, setInputPw] = useState("");
  const [loadStatus, setLoadStatus] = useState(null);
  const [cursor, setCursor] = useState(true);
  const [typed, setTyped] = useState(0);

  // New compact encoder — pass full weeks so it can find exercise names + recent sets
  const fullPw = encodeState(template, weeks);
  const chunked = chunkPw(fullPw);

  useEffect(() => {
    const t = setInterval(()=>setCursor(b=>!b), 530);
    return ()=>clearInterval(t);
  }, []);

  useEffect(() => {
    if (mode!=="save") return;
    setTyped(0);
    let i=0;
    const t = setInterval(()=>{
      i+=3; // faster reveal — 3 chars at a time
      setTyped(i);
      if(i>=chunked.length) clearInterval(t);
    }, 12);
    return ()=>clearInterval(t);
  }, [mode, chunked]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chunked).catch(()=>{});
    setCopyFlash(true);
    setTimeout(()=>setCopyFlash(false), 1800);
  };

  const handleLoad = () => {
    const decoded = decodeState(inputPw, weeks);
    if (!decoded?.slots) { setLoadStatus("err"); setTimeout(()=>setLoadStatus(null),2500); return; }
    // Apply decoded weights/reps/rpe back into the current week log by exercise name
    const { slots, slotData } = decoded;
    const newWeeks = weeks.map(wDays =>
      wDays.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => {
          const idx = slots.indexOf(ex.name);
          if (idx < 0 || !slotData[idx]?.weight) return ex;
          const sd = slotData[idx];
          return {
            ...ex,
            sets: ex.sets.map(s => ({
              ...s,
              weight: sd.weight || s.weight,
              reps:   sd.reps   || s.reps,
              rpe:    sd.rpe    || s.rpe,
              actual: false,
            }))
          };
        })
      }))
    );
    onRestore(template, newWeeks);
    setLoadStatus("ok");
    setTimeout(()=>setLoadStatus(null), 2000);
  };

  const mono = { fontFamily:"'Courier New',Courier,monospace" };

  return (
    <div style={{ paddingTop:"20px", paddingBottom:"40px" }}>
      <div style={{ marginBottom:"20px" }}>
        <div style={{ fontSize:"10px", color:CRT.dimGreen, letterSpacing:"0.2em",
          textTransform:"uppercase", marginBottom:"4px", ...mono }}>System</div>
        <h2 style={{ margin:0, color:CRT.green, fontSize:"22px",
          textShadow:CRT.glow, ...mono }}>PASSWORD SAVE</h2>
        <p style={{ color:CRT.dimGreen, fontSize:"12px", margin:"6px 0 0", ...mono }}>
          Encode your logged weights into a ~23-char save code.
        </p>
      </div>

      <div style={{ display:"flex", marginBottom:"20px",
        border:`1px solid ${CRT.border}`, borderRadius:"6px", overflow:"hidden" }}>
        {["save","load"].map(m=>(
          <button key={m} onClick={()=>{setMode(m);setLoadStatus(null);setInputPw("");}}
            style={{ flex:1, padding:"10px", background:mode===m?CRT.darkGreen:CRT.bg,
              border:"none", cursor:"pointer", color:mode===m?CRT.green:CRT.dimGreen,
              ...mono, fontSize:"12px", fontWeight:700, letterSpacing:"0.15em",
              textTransform:"uppercase", textShadow:mode===m?CRT.glowSm:"none" }}>
            {m==="save"?"► GENERATE":"◄ RESTORE"}
          </button>
        ))}
      </div>

      {mode==="save" && (
        <CRTScreen>
          <div style={{ ...mono, marginBottom:"12px", fontSize:"11px", color:CRT.dimGreen, lineHeight:"1.8" }}>
            <div>TEMPLATE: <span style={{color:CRT.green}}>{template.toUpperCase()}</span></div>
            <div>WEEKS: <span style={{color:CRT.green}}>12</span>{"  "}
              PAYLOAD: <span style={{color:CRT.green}}>{Math.ceil(fullPw.length * 0.75 / 100) / 10} KB</span>
            </div>
          </div>
          <div style={{ background:"#000500", border:`1px solid ${CRT.border}`,
            borderRadius:"4px", padding:"16px", marginBottom:"14px", minHeight:"80px" }}>
            <div style={{ fontSize:"11px", color:CRT.dimGreen, letterSpacing:"0.15em",
              marginBottom:"8px", ...mono }}>SAVE CODE:</div>
            <div style={{ ...mono, fontSize:"12px", color:CRT.green,
              textShadow:CRT.glowSm, lineHeight:"2", wordBreak:"break-all",
              letterSpacing:"0.1em" }}>
              {chunked.slice(0, typed)}
              <span style={{opacity:cursor?1:0,color:CRT.green}}>█</span>
            </div>
          </div>
          <button onClick={handleCopy} style={{ width:"100%", padding:"11px",
            background:copyFlash?CRT.darkGreen:"transparent",
            border:`2px solid ${copyFlash?CRT.green:CRT.border}`,
            borderRadius:"4px", cursor:"pointer",
            color:copyFlash?CRT.green:CRT.dimGreen, ...mono,
            fontSize:"13px", fontWeight:700, letterSpacing:"0.2em",
            textTransform:"uppercase", textShadow:copyFlash?CRT.glow:"none",
            transition:"all 0.2s" }}>
            {copyFlash?"✓ COPIED TO CLIPBOARD":"[ COPY PASSWORD ]"}
          </button>
          <div style={{ marginTop:"14px", padding:"12px", background:"#000500",
            border:`1px solid ${CRT.darkGreen}`, borderRadius:"4px",
            ...mono, fontSize:"10px", color:CRT.dimGreen, lineHeight:"1.8" }}>
            <div style={{color:CRT.green,marginBottom:"4px"}}>INSTRUCTIONS:</div>
            <div>1. Copy the password above and save it somewhere safe.</div>
            <div>2. On any device: go to PASSWORD → RESTORE.</div>
            <div>3. Paste and press LOAD GAME to restore your data.</div>
          </div>
        </CRTScreen>
      )}

      {mode==="load" && (
        <CRTScreen>
          <div style={{ ...mono, fontSize:"11px", color:CRT.dimGreen,
            letterSpacing:"0.1em", marginBottom:"12px" }}>
            ENTER SAVE CODE TO RESTORE SESSION
          </div>
          <textarea value={inputPw} onChange={e=>{setInputPw(e.target.value);setLoadStatus(null);}}
            placeholder={"PASTE YOUR SAVE CODE HERE...\n\nExample: ABCDEF-GHIJKL-MNOPQR-..."}
            rows={5}
            style={{ width:"100%", background:"#000500",
              border:`2px solid ${loadStatus==="err"?"#ff0040":loadStatus==="ok"?CRT.green:CRT.border}`,
              borderRadius:"4px", color:CRT.green, ...mono, fontSize:"12px",
              padding:"12px", resize:"none", outline:"none",
              letterSpacing:"0.1em", lineHeight:"1.8", boxSizing:"border-box",
              textShadow:CRT.glowSm, marginBottom:"12px" }} />
          {loadStatus==="err" && (
            <div style={{ ...mono, background:"#1a0000", border:"1px solid #ff0040",
              borderRadius:"4px", padding:"10px 14px", marginBottom:"12px",
              color:"#ff0040", fontSize:"12px", letterSpacing:"0.08em" }}>
              ✗ INVALID CODE — CHECK AND TRY AGAIN
            </div>
          )}
          {loadStatus==="ok" && (
            <div style={{ ...mono, background:CRT.darkGreen, border:`1px solid ${CRT.green}`,
              borderRadius:"4px", padding:"10px 14px", marginBottom:"12px",
              color:CRT.green, fontSize:"12px", textShadow:CRT.glowSm }}>
              ✓ SAVE DATA RESTORED — CONTINUE YOUR GAME
            </div>
          )}
          <button onClick={handleLoad} disabled={!inputPw.trim()}
            style={{ width:"100%", padding:"13px",
              background:inputPw.trim()?CRT.darkGreen:"#000500",
              border:`2px solid ${inputPw.trim()?CRT.green:CRT.border}`,
              borderRadius:"4px", cursor:inputPw.trim()?"pointer":"not-allowed",
              color:inputPw.trim()?CRT.green:"#004010", ...mono,
              fontSize:"14px", fontWeight:700, letterSpacing:"0.25em",
              textShadow:inputPw.trim()?CRT.glow:"none" }}>
            ► LOAD GAME
          </button>
        </CRTScreen>
      )}

      <div style={{ marginTop:"18px", textAlign:"center", ...mono,
        fontSize:"10px", color:"#003010", lineHeight:"1.8" }}>
        <div>TIME CRUNCH TRACKER v4.0</div>
        <div>© BARBELL MEDICINE</div>
        <div style={{color:"#004a18", marginTop:"4px"}}>{cursor?"█":" "} SYSTEM READY</div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
// ─── Rest Timer ───────────────────────────────────────────────────────────────
function RestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [preset, setPreset] = useState(180); // default 3 min
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false);
            clearInterval(intervalRef.current);
            // Vibrate if supported
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = (secs) => {
    setSeconds(secs ?? preset);
    setRunning(true);
  };

  const stop = () => { setRunning(false); setSeconds(0); };
  const reset = () => { setRunning(false); setSeconds(preset); };

  const pct = seconds / preset;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2,"0")}`;

  const PRESETS = [
    { label:"1m",  secs:60  },
    { label:"2m",  secs:120 },
    { label:"3m",  secs:180 },
    { label:"5m",  secs:300 },
  ];

  const urgent = seconds > 0 && seconds <= 10;
  const done   = !running && seconds === 0;

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:200,
      background:T.card, borderTop:`2px solid ${running ? (urgent ? T.red : T.accent) : T.border}`,
      boxShadow:"0 -4px 20px rgba(0,0,0,0.12)",
      transition:"border-color 0.3s",
    }}>
      {/* Progress bar */}
      {(running || seconds > 0) && (
        <div style={{ height:"3px", background:T.border, position:"relative" }}>
          <div style={{
            position:"absolute", left:0, top:0, height:"100%",
            width:`${pct * 100}%`,
            background: urgent ? T.red : T.accent,
            transition:"width 1s linear, background 0.3s",
          }} />
        </div>
      )}

      <div style={{ maxWidth:"680px", margin:"0 auto",
        padding:"10px 16px", display:"flex", alignItems:"center", gap:"10px" }}>

        {/* Timer display */}
        <div style={{
          fontFamily:"'Courier New',monospace", fontSize:"26px", fontWeight:700,
          color: urgent ? T.red : running ? T.accent : T.textMid,
          minWidth:"64px", letterSpacing:"0.05em",
          textShadow: urgent ? `0 0 12px ${T.red}60` : running ? `0 0 12px ${T.accent}40` : "none",
          transition:"color 0.3s",
        }}>
          {display}
        </div>

        {/* Preset buttons */}
        <div style={{ display:"flex", gap:"4px", flex:1 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { setPreset(p.secs); start(p.secs); }}
              style={{
                flex:1, padding:"7px 0", borderRadius:"7px", border:"none",
                background: preset === p.secs && running ? T.accent : T.bg,
                color: preset === p.secs && running ? "#fff" : T.textMid,
                fontSize:"12px", fontWeight:600, cursor:"pointer",
                transition:"all 0.15s",
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Stop / Reset */}
        <button onClick={running ? stop : () => start()}
          style={{
            padding:"7px 14px", borderRadius:"7px", border:"none",
            background: running ? T.redBg : T.accentBg,
            color: running ? T.red : T.accent,
            fontSize:"13px", fontWeight:700, cursor:"pointer",
            minWidth:"52px",
          }}>
          {running ? "✕" : done ? "↺" : "▶"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [template, setTemplate] = useState(()=>loadData()?.template||"2-Day");

  // weeks = array of 12, each = array of day objects with exercises + logs
  const [weeks, setWeeks] = useState(()=>{
    const saved = loadData();
    if(saved?.weeks) return saved.weeks;
    return Array.from({length:12},(_,wi)=>
      buildWeekLog("2-Day", wi+1, null));
  });

  const [activeWeek, setActiveWeek]   = useState(0);
  const [activeDay, setActiveDay]     = useState(0);
  const [view, setView]               = useState("log");
  const [restoreFlash, setRestoreFlash] = useState(false);
  const saveTimer = useRef(null);

  const numDays = TEMPLATES[template]?.days || 2;

  // Auto-save
  useEffect(()=>{
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>saveData({template,weeks}),600);
  },[template,weeks]);

  // When template changes, rebuild weeks from prescription (keep logs if available)
  const prevTemplate = useRef(template);
  const handleTemplateChange = (newTemplate) => {
    setTemplate(newTemplate);
    if(newTemplate !== prevTemplate.current) {
      const rebuilt = Array.from({length:12},(_,wi)=>
        buildWeekLog(newTemplate, wi+1,
          wi > 0 ? weeks[wi-1] : null));
      setWeeks(rebuilt);
      setActiveDay(0);
      prevTemplate.current = newTemplate;
    }
  };

  const updateDay = (wi, di, dayData) => {
    setWeeks(prev => {
      const next = prev.map((wDays,wIdx) => {
        if(wIdx !== wi) return wDays;
        return wDays.map((d,dIdx) => dIdx===di ? dayData : d);
      });
      // Re-suggest weights for subsequent weeks based on this updated week
      // (only recalc the next week to avoid cascade lag)
      if(wi + 1 < next.length) {
        next[wi+1] = buildWeekLog(template, wi+2, next[wi]);
      }
      return next;
    });
  };

  const handleRestore = (restoredTemplate, restoredLogs) => {
    setTemplate(restoredTemplate);
    // Merge logs into fresh prescription
    const merged = Array.from({length:12},(_,wi) => {
      const prescribed = buildWeekLog(restoredTemplate, wi+1,
        wi > 0 ? restoredLogs[wi-1] : null);
      const savedDays  = restoredLogs[wi];
      if(!savedDays) return prescribed;
      return prescribed.map((day, di) => {
        const savedDay = savedDays[di];
        if(!savedDay) return day;
        return {
          ...day,
          sessionRPE: savedDay.sessionRPE || "",
          notes:      savedDay.notes || "",
          exercises:  day.exercises.map((ex, ei) => {
            const savedEx = savedDay.exercises?.[ei];
            if(!savedEx) return ex;
            return {
              ...ex,
              exNotes: savedEx.exNotes || "",
              sets: ex.sets.map((s, si) => {
                const savedSet = savedEx.sets?.[si];
                if(!savedSet) return s;
                return { ...s, weight:savedSet.weight||"", reps:savedSet.reps||s.reps, rpe:savedSet.rpe||s.rpe, actual:!!savedSet.weight };
              }),
            };
          }),
        };
      });
    });
    setWeeks(merged);
    setActiveWeek(0); setActiveDay(0);
    setRestoreFlash(true);
    setTimeout(()=>setRestoreFlash(false), 3000);
  };

  const currentWeek = weeks[activeWeek] || [];
  const currentDay  = currentWeek[activeDay];
  const displayDays = Math.min(numDays, 7);
  const weekProgress = currentWeek.reduce((a,d)=>
    a+(d.exercises.some(e=>e.sets.some(s=>s.weight))?1:0), 0);

  const VIEWS = [
    {id:"log",      label:"Log"},
    {id:"progress", label:"Progress"},
    {id:"plates",   label:"Plates"},
  ];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(()=>localStorage.getItem("tc_dark")==="1");
  T = getTheme(darkMode);

  useEffect(()=>{ document.body.style.background = T.bg; }, [darkMode]);

  return (
    <div style={{ minHeight:"100vh", background:T.bg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:T.text }}>
      <style>{`
        * { box-sizing:border-box; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:${T.bg}; }
        ::-webkit-scrollbar-thumb { background:${T.border2}; border-radius:2px; }
        select, select option { background:${T.card}; color:${T.text}; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slidein { from{transform:translateY(-100%)} to{transform:translateY(0)} }
      `}</style>

      {/* Restore flash */}
      {restoreFlash && (
        <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:999,
          background:"#000a00", borderBottom:"2px solid #00ff41", padding:"10px",
          textAlign:"center", fontFamily:"'Courier New',monospace", fontSize:"13px",
          color:"#00ff41", letterSpacing:"0.2em", textShadow:"0 0 8px #00ff41",
          animation:"slidein 0.3s ease-out" }}>
          ✓ SAVE DATA LOADED — CONTINUE YOUR GAME
        </div>
      )}

      {/* Header */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`,
        padding:"12px 16px", position:"sticky", top:0, zIndex:100,
        boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth:"680px", margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:"11px", color:T.accent, letterSpacing:"0.2em",
                textTransform:"uppercase", fontWeight:700, marginBottom:"1px" }}>
                Barbell Medicine
              </div>
              <h1 style={{ margin:0, fontSize:"18px", fontWeight:800, color:T.text }}>
                Time Crunch Tracker
              </h1>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:T.green,
                animation:"pulse 2s infinite" }} />
              <span style={{ fontSize:"10px", color:T.green, fontWeight:600 }}>Saved</span>
            </div>
          </div>

          <div style={{ display:"flex", gap:"4px", marginTop:"10px", alignItems:"center" }}>
            {VIEWS.map(v=>(
              <button key={v.id} onClick={()=>{setView(v.id);setSettingsOpen(false);}} style={{
                flex:1, background: view===v.id ? T.accent : "transparent",
                border:`1px solid ${view===v.id ? T.accent : T.border2}`,
                borderRadius:"6px",
                color: view===v.id ? "#fff" : T.textMid,
                padding:"7px 4px", fontSize:"13px", cursor:"pointer",
                fontWeight: view===v.id ? 700 : 500,
              }}>
                {v.label}
              </button>
            ))}
            <button onClick={()=>setSettingsOpen(o=>!o)} style={{
              background: settingsOpen ? T.accentBg : "transparent",
              border:`1px solid ${settingsOpen ? T.accent : T.border2}`,
              borderRadius:"6px", padding:"7px 10px", cursor:"pointer",
              fontSize:"15px", lineHeight:1,
            }}>⚙️</button>
          </div>

          {/* Settings panel */}
          {settingsOpen && (
            <div style={{ marginTop:"10px", padding:"12px", background:T.bg,
              border:`1px solid ${T.border}`, borderRadius:"10px" }}>
              <div style={{ fontSize:"11px", color:T.textSoft, textTransform:"uppercase",
                letterSpacing:"0.08em", marginBottom:"8px", fontWeight:600 }}>Template</div>
              <select value={template} onChange={e=>{handleTemplateChange(e.target.value);}}
                style={{ width:"100%", background:T.card, border:`1px solid ${T.border2}`,
                  borderRadius:"6px", color:T.text, padding:"8px 10px", fontSize:"14px",
                  fontWeight:600 }}>
                {Object.keys(TEMPLATES).map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ fontSize:"11px", color:T.textSoft, textTransform:"uppercase",
                letterSpacing:"0.08em", margin:"12px 0 8px", fontWeight:600 }}>Password Save</div>
              <button onClick={()=>{setView("password");setSettingsOpen(false);}}
                style={{ width:"100%", background:"#000a00", border:"1px solid #00ff41",
                  borderRadius:"6px", color:"#00ff41", padding:"8px", fontSize:"13px",
                  cursor:"pointer", fontFamily:"'Courier New',monospace", fontWeight:700,
                  letterSpacing:"0.1em" }}>
                💾 OPEN PASSWORD SAVE
              </button>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                marginTop:"12px" }}>
                <span style={{ fontSize:"13px", color:T.textMid, fontWeight:600 }}>Dark Mode</span>
                <button onClick={()=>setDarkMode(d=>{
                  const next=!d;
                  localStorage.setItem("tc_dark", next?"1":"0");
                  return next;
                })} style={{
                  width:"44px", height:"24px", borderRadius:"12px", border:"none",
                  background: darkMode ? T.accent : T.border2,
                  position:"relative", cursor:"pointer", transition:"background 0.2s",
                }}>
                  <div style={{
                    position:"absolute", top:"3px",
                    left: darkMode ? "23px" : "3px",
                    width:"18px", height:"18px", borderRadius:"50%",
                    background:"#fff", transition:"left 0.2s",
                    boxShadow:"0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"0 16px" }}>

        {view==="progress"  && <ProgressView weeks={weeks} />}
        {view==="plates"    && <PlateCalc />}
        {view==="password"  && <PasswordView template={template} weeks={weeks} onRestore={handleRestore} />}

        {view==="log" && (
          <>
            {/* Week strip */}
            <div style={{ paddingTop:"14px", paddingBottom:"4px" }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:"6px" }}>
                <span style={{ fontSize:"11px", color:T.textMid, fontWeight:600,
                  textTransform:"uppercase", letterSpacing:"0.05em" }}>12-Week Program</span>
                <span style={{ fontSize:"11px", color:T.accent, fontWeight:600 }}>
                  Week {activeWeek+1} · {weekProgress}/{displayDays} days done
                </span>
              </div>
              <div style={{ display:"flex", gap:"3px", overflowX:"auto", paddingBottom:"4px" }}>
                {weeks.map((wDays,i)=>{
                  const hasData = wDays.some(d=>d.exercises.some(e=>e.sets.some(s=>s.weight)));
                  return (
                    <button key={i} onClick={()=>setActiveWeek(i)} style={{
                      flexShrink:0, width:"34px", height:"34px",
                      background: activeWeek===i?T.accent:hasData?"#dbeafe":T.bg,
                      border:`1px solid ${activeWeek===i?T.accent:hasData?"#93c5fd":T.border2}`,
                      borderRadius:"7px",
                      color: activeWeek===i?"#fff":hasData?T.accent:T.textSoft,
                      cursor:"pointer", fontSize:"12px", fontWeight:700 }}>{i+1}</button>
                  );
                })}
              </div>
            </div>

            {/* Day strip */}
            <div style={{ display:"flex", gap:"5px", paddingTop:"10px", paddingBottom:"14px" }}>
              {Array.from({length:displayDays},(_,i)=>{
                const d = currentWeek[i];
                const done = d?.exercises.some(e=>e.sets.some(s=>s.weight));
                return (
                  <button key={i} onClick={()=>setActiveDay(i)} style={{
                    flex:1, padding:"9px 4px",
                    background: activeDay===i?T.accent:done?"#dbeafe":T.card,
                    border:`1px solid ${activeDay===i?T.accent:done?"#93c5fd":T.border2}`,
                    borderRadius:"9px",
                    color: activeDay===i?"#fff":done?T.accent:T.textMid,
                    cursor:"pointer", fontSize:"12px", fontWeight:activeDay===i?700:500 }}>
                    Day {i+1}
                    {done && <div style={{fontSize:"11px",opacity:0.8}}>✓</div>}
                  </button>
                );
              })}
            </div>

            {/* Schedule reference */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`,
              borderRadius:"9px", padding:"8px 12px", marginBottom:"14px" }}>
              <div style={{ fontSize:"11px", color:T.textSoft, textTransform:"uppercase",
                letterSpacing:"0.1em", marginBottom:"5px", fontWeight:600 }}>
                {template} · {TEMPLATES[template]?.focus} · Week {activeWeek+1}
              </div>
              <div style={{ display:"flex", gap:"4px" }}>
                {WEEK_DAYS.map((d,i)=>{
                  const isOn = numDays>=7
                    ||(numDays===4?[1,2,4,5].includes(i)
                    :numDays===3?[1,3,5].includes(i)
                    :[1,4].includes(i));
                  return (
                    <div key={d} style={{ flex:1, textAlign:"center", fontSize:"10px",
                      color: isOn?T.accent:T.textSoft,
                      background: isOn?T.accentBg:"transparent",
                      borderRadius:"4px", padding:"2px 0", fontWeight:isOn?700:400 }}>{d}</div>
                  );
                })}
              </div>
            </div>

            {currentDay && (
              <WorkoutDay
                day={currentDay}
                dayNum={activeDay+1}
                weekIdx={activeWeek}
                allWeeks={weeks}
                templateName={template}
                onUpdate={d=>updateDay(activeWeek,activeDay,d)} />
            )}
          </>
        )}
      </div>

      {/* Rest Timer — sticky bottom bar */}
      <RestTimer />

      {/* Spacer so content isn't hidden behind timer bar */}
      <div style={{ height:"70px" }} />
    </div>
  );
}