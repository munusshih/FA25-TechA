import { spawn } from "child_process";

/**
 * Run a node script and stream output in real-time
 */
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [scriptPath], {
      stdio: ["inherit", "inherit", "inherit"],
      cwd: process.cwd(),
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Main sync function
 */
async function sync() {
  try {
    await runScript("./src/scripts/download-images.js");
    await runScript("./src/scripts/generate-thumbnails.js");
    console.log("\n✨ Sync complete!\n");
  } catch (err) {
    console.error("\n❌ Sync failed:", err.message);
    process.exit(1);
  }
}

sync().catch(console.error);
