import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.28.0/dist/module/supabase.js";

const SUPABASE_URL = "https://tzspnjmksbfloelujzjc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE = "traffic_light";

async function setState(state) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ state: state }]); // insert a new row

  if (error) {
    console.error("Error:", error.message);
    document.getElementById("status").textContent = "Error sending state!";
  } else {
    document.getElementById("status").textContent = "Current State: " + state.toUpperCase();
  }
}

// Button listeners
document.getElementById("red").onclick = () => setState("red");
document.getElementById("yellow").onclick = () => setState("yellow");
document.getElementById("green").onclick = () => setState("green");
document.getElementById("auto").onclick = () => setState("auto");