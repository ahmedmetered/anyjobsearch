// Indeed one-time login v2: opens a visible window, waits for FULL sign-in
// (verified in a separate tab so the main page is never disturbed), then closes.
import { chromium } from "patchright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const profile = path.join(here, "indeed-profile");

const ctx = await chromium.launchPersistentContext(profile, { headless: false, viewport: null });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto("https://it.indeed.com");

console.log("WINDOW OPEN - sign in, and enter the verification code when it comes.");
console.log("The window verifies the session itself and closes on its own when you are truly in.");

async function reallyLoggedIn() {
  // check in a separate tab so Ahmed's typing is never interrupted
  const p2 = await ctx.newPage();
  try {
    await p2.goto("https://secure.indeed.com/account/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));
    const u = p2.url();
    const loggedOut = /login|signin|SignIn/i.test(u);
    return !loggedOut;
  } catch (e) { return false; }
  finally { await p2.close().catch(() => {}); }
}

let loggedInStreak = 0;
for (let i = 0; i < 360; i++) { // up to 30 minutes
  await new Promise(r => setTimeout(r, 5000));
  try {
    if (await reallyLoggedIn()) {
      loggedInStreak++;
    } else {
      loggedInStreak = 0;
    }
    if (loggedInStreak >= 2) { // two consecutive verifications, 5s apart
      console.log("SIGNED IN (verified) - closing window in 15s. No action needed.");
      await new Promise(r => setTimeout(r, 15000));
      await ctx.close();
      console.log("LOGIN COMPLETE");
      process.exit(0);
    }
  } catch (e) { /* ignore transient errors */ }
}
console.log("TIMEOUT after 30 minutes. Run node indeed-login.mjs again if needed.");
await ctx.close();
process.exit(1);
