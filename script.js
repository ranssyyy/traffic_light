// Use the official Supabase JS module
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- Replace these with your info ---
const SUPABASE_URL = "https://tzspnjmksbfloelujzjc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6c3Buam1rc2JmbG9lbHVqempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODExNDYsImV4cCI6MjA4ODQ1NzE0Nn0.6ymNLXSgyE50BlU1cgD4czM2R5S1jhpHN5ykfr2Q0rc";
const TABLE = "traffic_light";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Function to insert state ---
async function setState(state) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ state }]);

  if (error) {
    console.error("Supabase insert error:", error.message);
    document.getElementById("status").textContent = "Error sending state!";
  } else {
    document.getElementById("status").textContent = "Current State: " + state.toUpperCase();
  }
}

// --- Button event listeners ---
document.getElementById("red").onclick = () => setState("red");
document.getElementById("yellow").onclick = () => setState("yellow");
document.getElementById("green").onclick = () => setState("green");
document.getElementById("auto").onclick = () => setState("auto");