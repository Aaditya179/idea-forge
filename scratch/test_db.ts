import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};

envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const parts = trimmed.split("=");
    const key = parts[0]?.trim();
    const value = parts.slice(1).join("=").trim();
    if (key && value) {
      env[key] = value;
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testSubmit() {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*");

  console.log("Profiles in system:", profiles);

  if (profileError) {
    console.error(profileError);
  }

  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("*");

  console.log("Departments in database:", departments);

  if (deptError) {
    console.error(deptError);
  }
}

testSubmit();
