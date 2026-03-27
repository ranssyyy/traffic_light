import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Your Supabase info
const SUPABASE_URL = "https://tzspnjmksbfloelujzjc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // your anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE = "traffic_light";

async function setState(state) {
  const { data, error } = await supabase.from(TABLE).insert([{ state }]);
  if (error) {
    console.error("Supabase insert error:", error.message);
    document.getElementById("status").textContent = "Error sending state!";
  } else {
    document.getElementById("status").textContent = "Current State: " + state.toUpperCase();
  }
}

document.getElementById("red").onclick = () => setState("red");
document.getElementById("yellow").onclick = () => setState("yellow");
document.getElementById("green").onclick = () => setState("green");
document.getElementById("auto").onclick = () => setState("auto");