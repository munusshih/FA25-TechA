import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve("./end-of-year-packages");
const PUBLIC_IMAGES_DIR = path.resolve("./public/images");
const DATA_FILE = path.resolve("./src/data/projects-with-local-images.json");

function getInstructorFromSection(section) {
  if (!section) return "Other";

  // Extract instructor name from section string
  // Examples: "01 Anna Fangan Xu" -> "Anna Fangan Xu"

  // Remove leading section number pattern (e.g., "01 ", "02 ", etc.)
  const instructorName = section.replace(/^\d+\s+/, "").trim();

  return instructorName || "Other";
}

function sanitizeFolderName(name) {
  return name
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function packageEndOfYear() {
  console.log("🎓 Starting End-of-Year Packaging...\n");

  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log("🗑️  Removing existing packages...");
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load project data
  if (!fs.existsSync(DATA_FILE)) {
    console.error("❌ Projects data file not found. Run 'npm run sync' first.");
    process.exit(1);
  }

  const projectsData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const totalProjects = projectsData.length;
  console.log(`📚 Found ${totalProjects} projects\n`);

  // Build a map of email -> most frequent name
  const emailToNameMap = new Map();
  const emailNameCounts = new Map();

  for (const project of projectsData) {
    const email = project["Email Address"];
    const name = project["Your Name (First + Last Name)"];

    if (email && name) {
      if (!emailNameCounts.has(email)) {
        emailNameCounts.set(email, new Map());
      }
      const nameCounts = emailNameCounts.get(email);
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    }
  }

  // For each email, pick the most frequent name
  for (const [email, nameCounts] of emailNameCounts.entries()) {
    let mostFrequentName = "";
    let maxCount = 0;

    for (const [name, count] of nameCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentName = name;
      }
    }

    emailToNameMap.set(email, mostFrequentName);
  }

  const stats = {
    instructors: {},
    totalProjects: 0,
    totalFiles: 0,
  };

  function createProgressBar(
    current,
    total,
    studentName = "",
    projectTitle = "",
    width = 30,
  ) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((width * current) / total);
    const empty = width - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    const info =
      studentName && projectTitle ? ` - ${studentName} - ${projectTitle}` : "";
    return `[${bar}] ${percentage}% (${current}/${total})${info}`;
  }

  let processedCount = 0;

  // Process each project
  for (const project of projectsData) {
    const email = project["Email Address"] || "";
    const projectTitle = project["Your Project Name"] || "Untitled";
    const section = project["What is your section?"] || "";

    if (!email) {
      processedCount++;
      continue;
    }

    // Use the most frequent name for this email
    const studentName =
      emailToNameMap.get(email) ||
      project["Your Name (First + Last Name)"] ||
      "Unknown";

    const instructor = getInstructorFromSection(section);
    const sanitizedStudent = sanitizeFolderName(studentName);
    const sanitizedProject = sanitizeFolderName(projectTitle);

    // Create folder structure
    const projectFolder = path.join(
      OUTPUT_DIR,
      instructor,
      sanitizedStudent,
      sanitizedProject,
    );
    fs.mkdirSync(projectFolder, { recursive: true });

    // Track stats
    if (!stats.instructors[instructor]) {
      stats.instructors[instructor] = { students: new Set(), projects: 0 };
    }
    stats.instructors[instructor].students.add(sanitizedStudent);
    stats.instructors[instructor].projects++;
    stats.totalProjects++;

    // Copy all project files (File 1, File 2, Image 1, Image 2, etc.)
    let fileCount = 0;
    for (const [key, value] of Object.entries(project)) {
      if (typeof value === "string" && value.startsWith("/images/")) {
        // Extract the actual file path from public directory
        const filePath = path.join("./public", value);

        if (fs.existsSync(filePath)) {
          const fileName = path.basename(filePath);
          const destFile = path.join(projectFolder, fileName);
          fs.copyFileSync(filePath, destFile);
          stats.totalFiles++;
          fileCount++;
        }
      }
    }

    // Create a project info file
    const infoContent = `Project: ${projectTitle}
Student: ${studentName}
Email: ${email}
Section: ${section}
Instructor: ${instructor}

Description:
${project["Your Project Description (max 2000 characters)"] || "No description available"}

Credits:
${project["Credit (List out collaborators, tutorials, libraries, references, AI agents used)"] || "No credits listed"}
`;

    fs.writeFileSync(path.join(projectFolder, "PROJECT_INFO.txt"), infoContent);

    // Update progress bar
    processedCount++;
    const progress = createProgressBar(
      processedCount,
      totalProjects,
      studentName,
      projectTitle,
    );
    process.stdout.write(`\r${progress}`);
  }

  // Final progress update
  const finalProgress = createProgressBar(
    totalProjects,
    totalProjects,
    "Complete!",
    "",
  );
  process.stdout.write(`\r${finalProgress}\n\n`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📦 PACKAGING COMPLETE!\n");
  console.log(`📍 Location: ${OUTPUT_DIR}\n`);
  console.log("📊 Summary:");
  console.log(`   Total Projects: ${stats.totalProjects}`);
  console.log(`   Total Files: ${stats.totalFiles}\n`);

  console.log("👥 By Instructor:");
  for (const [instructor, data] of Object.entries(stats.instructors)) {
    console.log(
      `   ${instructor}: ${data.projects} projects, ${data.students.size} students`,
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log(
    `\n✨ You can now view these files in Finder at:\n   ${OUTPUT_DIR}\n`,
  );
}

packageEndOfYear().catch((error) => {
  console.error("❌ Error during packaging:", error);
  process.exit(1);
});
