const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";

const checks = [
  { path: "/", mustContain: "Amarargarh High School" },
  { path: "/about", mustContain: "About" },
  { path: "/admissions", mustContain: "Admissions" },
  { path: "/academics", mustContain: "Academics" },
  { path: "/contact", mustContain: "Contact" },
  { path: "/teachers", mustContain: "Teachers' Corner" },
  { path: "/achievements", mustContain: "Student Achievements" },
  { path: "/events", mustContain: "Events Calendar" },
  { path: "/notices", mustContain: "Notice Board" },
  { path: "/magazine", mustContain: "School Magazine" },
  { path: "/privacy", mustContain: "Privacy Policy" },
  { path: "/terms", mustContain: "Terms of Use" },
  { path: "/admin", mustContain: "Admin Panel Login" },
];

let failed = 0;

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const ok = res.ok && text.toLowerCase().includes(check.mustContain.toLowerCase());

    if (!ok) {
      failed += 1;
      console.error(`✗ ${check.path} failed (status ${res.status}, missing: "${check.mustContain}")`);
      continue;
    }

    console.log(`✓ ${check.path}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${check.path} failed (${error instanceof Error ? error.message : String(error)})`);
  }
}

if (failed > 0) {
  console.error(`\nSmoke test failed: ${failed} route(s) did not pass.`);
  process.exit(1);
}

console.log("\nSmoke test passed for all routes.");
