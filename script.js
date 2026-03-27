import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.28.0/dist/module/supabase.js";

// Your Supabase credentials
const SUPABASE_URL = "https://tzspnjmksbfloelujzjc.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6c3Buam1rc2JmbG9lbHVqempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4ODExNDYsImV4cCI6MjA4ODQ1NzE0Nn0.6ymNLXSgyE50BlU1cgD4czM2R5S1jhpHN5ykfr2Q0rc";
const TABLE = "traffic_light";

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function setState(state) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ state: state }]);

  if (error) {
    console.error("Error:", error.message);
    document.getElementById("status").textContent = "Error sending state!";
  } else {
    document.getElementById("status").textContent = "Current State: " + state.toUpperCase();
  }
}

// Button events
document.getElementById("red").onclick = () => setState("red");
document.getElementById("yellow").onclick = () => setState("yellow");
document.getElementById("green").onclick = () => setState("green");
document.getElementById("auto").onclick = () => setState("auto");