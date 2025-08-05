import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const OPEN_SHEET_URL =
  "https://opensheet.elk.sh/17fvrm7R-obGWYHILPcmqp4h7mW55xVmWpenjYAFzMAI/1";

const PUBLIC_IMAGES_DIR = path.resolve("./public/images");
const DATA_DIR = path.resolve("./src/data"); // 👈 NEW
const OUTPUT_JSON_PATH = path.join(DATA_DIR, "projects-with-local-images.json"); // 👈 NEW

if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true }); // 👈 Ensure src/data exists
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function getFileExtension(contentType) {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("gif")) return "gif";
  return "jpg"; // fallback
}

async function downloadImage(url, savePath) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to download ${url}: ${res.statusText}`);
    return false;
  }
  const buffer = await res.buffer();
  fs.writeFileSync(savePath, buffer);
  console.log(`Saved image to ${savePath}`);
  return true;
}

function extractDriveFileId(url) {
  const regex = /id=([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getDirectDriveUrl(url) {
  const fileId = extractDriveFileId(url);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function processProject(project) {
  const email = sanitizeFilename(project["Email Address"] || "unknown_email");
  const projectName = sanitizeFilename(
    project["Project Name"] || "unknown_project",
  );
  const folderPath = path.join(PUBLIC_IMAGES_DIR, email, projectName);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const imageKeys = Object.keys(project).filter((key) =>
    key.toLowerCase().startsWith("image "),
  );

  const newProject = { ...project };

  for (const key of imageKeys) {
    const url = project[key];
    if (!url) continue;

    const directUrl = getDirectDriveUrl(url);
    if (!directUrl) {
      console.warn(`Skipping non-GDrive or invalid URL for ${key}: ${url}`);
      continue;
    }

    try {
      const headRes = await fetch(directUrl, { method: "HEAD" });
      const contentType = headRes.headers.get("content-type");
      const ext = getFileExtension(contentType);

      const fileName = `${key.replace(/\s+/g, "_").toLowerCase()}.${ext}`;
      const savePath = path.join(folderPath, fileName);

      const downloaded = await downloadImage(directUrl, savePath);
      if (downloaded) {
        newProject[key] = `/images/${email}/${projectName}/${fileName}`;
      }
    } catch (err) {
      console.error(`Error downloading ${url}:`, err);
    }
  }

  return newProject;
}

async function main() {
  console.log("Fetching projects JSON...");
  const res = await fetch(OPEN_SHEET_URL);
  const projects = await res.json();

  const updatedProjects = [];
  for (const project of projects) {
    const updated = await processProject(project);
    updatedProjects.push(updated);
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(updatedProjects, null, 2));
  console.log(`✅ Saved updated JSON to ${OUTPUT_JSON_PATH}`);
}

main().catch(console.error);
