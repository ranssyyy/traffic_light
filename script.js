/**
 * RANSY TRAFFIC LIGHT — fixed/enhanced script.js
 * Supabase table: traffic_light | column: state
 * Values: "red" | "yellow" | "green" | "auto" | "off"
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ──────────────────────────────
// SUPABASE CONFIG
// ──────────────────────────────
const SUPABASE_URL = "https://tzspnjmksbfloelujzjc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6c3Buam1rc2JmbG9lbHVqemljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTM2MDAwMH0.REPLACE_WITH_YOUR_ACTUAL_ANON_KEY";

let supabase     = null;
let currentState = null;
let autoTimer    = null;
let insertCount  = 0;
let logCount     = 0;

const AUTO_CYCLE     = ["green", "yellow", "red"];
const AUTO_DURATIONS = { green: 4000, yellow: 2000, red: 4000 };
let autoStep        = 0;

// ──────────────────────────────
// DOM REFERENCES
// ──────────────────────────────
const redLight       = document.getElementById("redLight");
const yellowLight    = document.getElementById("yellowLight");
const greenLight     = document.getElementById("greenLight");
const stateValue     = document.getElementById("currentStateValue");
const autoIndicator  = document.getElementById("autoIndicator");
const lastUpdateEl   = document.getElementById("lastUpdate");
const laneAEl        = document.getElementById("laneAStatus");
const laneBEl        = document.getElementById("laneBStatus");
const logsBody       = document.getElementById("logsBody");
const logCountEl     = document.getElementById("logCount");

// Cars
const carsLTR = document.querySelectorAll(".car-ltr");
const carsRTL = document.querySelectorAll(".car-rtl");

// Mini traffic lights
const miniRedLtr    = document.getElementById("miniRedLtr");
const miniYellowLtr = document.getElementById("miniYellowLtr");
const miniGreenLtr  = document.getElementById("miniGreenLtr");
const miniRedRtl    = document.getElementById("miniRedRtl");
const miniYellowRtl = document.getElementById("miniYellowRtl");
const miniGreenRtl  = document.getElementById("miniGreenRtl");

// ──────────────────────────────
// CLOCK
// ──────────────────────────────
function timeNow() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
}
setInterval(() => lastUpdateEl.textContent = timeNow(), 1000);

// ──────────────────────────────
// LOGS
// ──────────────────────────────
const DOT_CLASS = { red:"log-dot-red", yellow:"log-dot-yellow", green:"log-dot-green", auto:"log-dot-auto", off:"log-dot-off", info:"log-dot-info" };
function addLog(msg, type="info") {
  logCount++;
  logCountEl.textContent = `${logCount} entr${logCount===1?"y":"ies"}`;
  const row = document.createElement("div");
  row.className = "log-row";
  const ts = document.createElement("span"); ts.className = "log-ts"; ts.textContent = timeNow();
  const dot = document.createElement("span"); dot.className = "log-dot "+DOT_CLASS[type];
  const text = document.createElement("span"); text.className = "log-msg"; text.textContent = msg;
  row.append(ts,dot,text);
  logsBody.insertBefore(row, logsBody.firstChild);
}
window.clearLogs = () => { logsBody.innerHTML=""; logCount=0; logCountEl.textContent="0 entries"; addLog("Logs cleared","info"); };

// ──────────────────────────────
// SUPABASE INIT
// ──────────────────────────────
function initSupabase() {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    addLog("Supabase connected. Fetching latest state...","info");
    fetchLatestState();
  } catch(err) {
    addLog("Supabase connection error: "+err.message,"info");
  }
}

// ──────────────────────────────
// FETCH LATEST STATE
// ──────────────────────────────
async function fetchLatestState() {
  if(!supabase) return;
  const { data, error } = await supabase.from("traffic_light").select("state").order("id",{ascending:false}).limit(1);
  if(error) return addLog("Fetch error: "+error.message,"info");
  if(data && data.length>0) applyState(data[0].state);
  else addLog("No records found.","info");
}

// ──────────────────────────────
// BUTTON STATE CHANGE
// ──────────────────────────────
window.setState = async function(state){
  const btn = document.querySelector(`[data-state='${state}']`);
  if(btn){ 
    btn.classList.add("loading"); 
    const icon = btn.querySelector(".btn-icon"); 
    const orig = icon?icon.textContent:""; 
    if(icon) icon.textContent="⟳"; 
    setTimeout(()=>{ btn.classList.remove("loading"); if(icon) icon.textContent=orig; },700); 
  }

  if(supabase){
    const { error } = await supabase.from("traffic_light").insert({state});
    if(error) return addLog("Insert error: "+error.message,"info");
  }

  applyState(state);

  const msgs = {
    red:"Switched to RED — Lane A stopped, Lane B moving.",
    yellow:"Switched to YELLOW — All lanes slowing down.",
    green:"Switched to GREEN — Lane A moving, Lane B stopped.",
    auto:"AUTO mode activated — cycling signals automatically.",
    off:"System turned OFF — All traffic stopped."
  };
  addLog(msgs[state]||"State changed: "+state,state);
};

// ──────────────────────────────
// APPLY STATE
// ──────────────────────────────
function applyState(state){
  currentState = state;
  clearTimeout(autoTimer);
  autoTimer=null;

  document.querySelectorAll(".ctrl-btn").forEach(b=>b.classList.toggle("active",b.dataset.state===state));
  stateValue.textContent = state.toUpperCase();
  stateValue.className = "state-value state-"+state;
  autoIndicator.classList.toggle("visible",state==="auto");
  lastUpdateEl.textContent = timeNow();

  switch(state){
    case "red":
      setMainLight("red");
      setCarMode(carsLTR,"stop");
      setCarMode(carsRTL,"move");
      setMiniLights("red","ltr");
      setMiniLights("green","rtl");
      updateStats("STOPPED ◼","MOVING ▶");
      break;
    case "yellow":
      setMainLight("yellow");
      setCarMode(carsLTR,"slow");
      setCarMode(carsRTL,"slow");
      setMiniLights("yellow","ltr");
      setMiniLights("yellow","rtl");
      updateStats("SLOWING ◈","SLOWING ◈");
      // optional timed stop after yellow
      setTimeout(()=>{ setCarMode(carsLTR,"stop"); setCarMode(carsRTL,"stop"); },2000);
      break;
    case "green":
      setMainLight("green");
      setCarMode(carsLTR,"move");
      setCarMode(carsRTL,"stop");
      setMiniLights("green","ltr");
      setMiniLights("red","rtl");
      updateStats("MOVING ▶","STOPPED ◼");
      break;
    case "auto":
      startAutoMode();
      break;
    case "off":
      setMainLight(null);
      setCarMode(carsLTR,"stop");
      setCarMode(carsRTL,"stop");
      setMiniLights("off","ltr");
      setMiniLights("off","rtl");
      updateStats("SYSTEM OFF","SYSTEM OFF");
      break;
  }
}

// ──────────────────────────────
// MAIN TRAFFIC LIGHT
// ──────────────────────────────
function setMainLight(active){
  redLight.classList.toggle("active",active==="red");
  yellowLight.classList.toggle("active",active==="yellow");
  greenLight.classList.toggle("active",active==="green");
}

// ──────────────────────────────
// MINI TRAFFIC LIGHTS
// ──────────────────────────────
function setMiniLights(signal,lane){
  let r = lane==="ltr"? miniRedLtr:miniRedRtl;
  let y = lane==="ltr"? miniYellowLtr:miniYellowRtl;
  let g = lane==="ltr"? miniGreenLtr:miniGreenRtl;
  [r,y,g].forEach(b=>b.classList.remove("on-red","on-yellow","on-green"));
  if(signal==="red") r.classList.add("on-red");
  if(signal==="yellow") y.classList.add("on-yellow");
  if(signal==="green") g.classList.add("on-green");
}

// ──────────────────────────────
// CAR ANIMATION
// ──────────────────────────────
function setCarMode(cars,mode){
  cars.forEach(c=>{
    c.classList.remove("move","slow","stop");
    c.classList.add(mode);
  });
}

// ──────────────────────────────
// AUTO MODE
// ──────────────────────────────
function startAutoMode(){
  function runStep(){
    const s = AUTO_CYCLE[autoStep%AUTO_CYCLE.length];

    setMainLight(s);
    stateValue.textContent = "AUTO: "+s.toUpperCase();
    stateValue.className = "state-value state-"+s;
    lastUpdateEl.textContent = timeNow();

    if(s==="green"){
      setCarMode(carsLTR,"move");
      setCarMode(carsRTL,"stop");
      setMiniLights("green","ltr");
      setMiniLights("red","rtl");
      updateStats("MOVING ▶","STOPPED ◼");
    } else if(s==="yellow"){
      setCarMode(carsLTR,"slow");
      setCarMode(carsRTL,"slow");
      setMiniLights("yellow","ltr");
      setMiniLights("yellow","rtl");
      updateStats("SLOWING ◈","SLOWING ◈");
      setTimeout(()=>{ setCarMode(carsLTR,"stop"); setCarMode(carsRTL,"stop"); },2000);
    } else if(s==="red"){
      setCarMode(carsLTR,"stop");
      setCarMode(carsRTL,"move");
      setMiniLights("red","ltr");
      setMiniLights("green","rtl");
      updateStats("STOPPED ◼","MOVING ▶");
    }

    autoStep++;
    autoTimer = setTimeout(runStep,AUTO_DURATIONS[s]);
  }
  runStep();
}

// ──────────────────────────────
// STATS & CENTER ICON
// ──────────────────────────────
function updateStats(laneA,laneB){ laneAEl.textContent=laneA; laneBEl.textContent=laneB; }
function setCenterIcon(icon,color){ centerIcon.textContent=icon; centerIcon.style.color=color; centerIcon.style.opacity="0.85"; centerIcon.style.textShadow=`0 0 14px ${color}`; }

// ──────────────────────────────
// INIT
// ──────────────────────────────
(function init(){
  if(initTsEl) initTsEl.textContent=timeNow();
  initSupabase();
})();