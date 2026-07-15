import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

// Manually parse .env.local without using external 'dotenv' library
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const index = trimmed.indexOf("=");
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        // Remove surrounding quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const DEFAULT_PASSWORD = "DemoPassword123!";

async function main() {
  console.log("Starting user seeding script...");

  // 1. Fetch departments
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("id, name");

  if (deptError || !departments) {
    console.error("Error fetching departments:", deptError);
    process.exit(1);
  }

  console.log(`Found departments: ${departments.map(d => d.name).join(", ")}`);

  // Map to store department name to id mapping
  const deptMap = new Map<string, string>();
  departments.forEach(d => deptMap.set(d.name, d.id));

  // Define users to seed
  const usersToSeed = [
    // Admin
    {
      email: "admin@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "System Admin",
      role: "admin",
      deptName: null,
    },
    // Officers
    {
      email: "officer.water@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Rajesh Kumar - Water Dept",
      role: "officer",
      deptName: "Water Supply",
    },
    {
      email: "officer.electricity@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Priya Sharma - Electricity Dept",
      role: "officer",
      deptName: "Electricity",
    },
    {
      email: "officer.roads@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Amit Patel - Roads Dept",
      role: "officer",
      deptName: "Roads",
    },
    {
      email: "officer.sanitation@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Sunita Deshmukh - Sanitation Dept",
      role: "officer",
      deptName: "Sanitation",
    },
    {
      email: "officer.other@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Vikram Malhotra - General Dept",
      role: "officer",
      deptName: "Other",
    },
    // Citizens
    {
      email: "citizen1@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Aarav Mehta",
      role: "citizen",
      deptName: null,
    },
    {
      email: "citizen2@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Diya Iyer",
      role: "citizen",
      deptName: null,
    },
    {
      email: "citizen3@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Kabir Singh",
      role: "citizen",
      deptName: null,
    },
    {
      email: "citizen4@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Ananya Rao",
      role: "citizen",
      deptName: null,
    },
    {
      email: "citizen5@demo.com",
      password: DEFAULT_PASSWORD,
      fullName: "Rohan Gupta",
      role: "citizen",
      deptName: null,
    },
  ];

  const results: any[] = [];

  for (const u of usersToSeed) {
    console.log(`Processing: ${u.email}...`);

    // Resolve department_id
    let departmentId: string | null = null;
    if (u.deptName) {
      departmentId = deptMap.get(u.deptName) || null;
      if (!departmentId) {
        console.warn(`Warning: Department '${u.deptName}' not found. Seeding without department assignment.`);
      }
    }

    // Check if user already exists in auth.users by email lookup
    const { data: existingUserList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`Error listing users:`, listError);
      continue;
    }

    const existingUser = existingUserList.users.find(usr => usr.email === u.email);

    let userId: string;

    if (existingUser) {
      console.log(`User '${u.email}' already exists. Linking profile...`);
      userId = existingUser.id;
    } else {
      // Create auth.user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          full_name: u.fullName,
          role: u.role,
          department_id: departmentId,
        },
      });

      if (createError || !newUser.user) {
        console.error(`Error creating user '${u.email}':`, createError);
        continue;
      }

      userId = newUser.user.id;
      console.log(`Created auth user for '${u.email}' (ID: ${userId})`);
    }

    // Create or update profiles row
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: u.fullName,
        role: u.role,
        department_id: departmentId,
      });

    if (profileError) {
      console.error(`Error syncing profile for '${u.email}':`, profileError);
    } else {
      console.log(`Synced profile for '${u.email}'`);
      results.push({
        email: u.email,
        password: u.password,
        role: u.role,
        department: u.deptName || "N/A",
        name: u.fullName,
      });
    }
  }

  console.log("\n==================================================");
  console.log("SEEDING COMPLETED!");
  console.log("==================================================");
  console.table(results);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
