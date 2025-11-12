import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const OPEN_SHEET_URL =
  "https://opensheet.elk.sh/17fvrm7R-obGWYHILPcmqp4h7mW55xVmWpenjYAFzMAI/1";

const PUBLIC_IMAGES_DIR = path.resolve("./public/images");
const DATA_DIR = path.resolve("./src/data");
const OUTPUT_JSON_PATH = path.join(DATA_DIR, "projects-with-local-images.json");

const ASSET_FIELD_REGEX = /^(image|file) \d+$/i;
const CONCURRENT_PROJECTS = 10;
const MOV_EXTENSIONS = new Set(["mov"]);
const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

const HEIC_BRANDS = new Set([
  "ftypheic",
  "ftypheix",
  "ftyphevc",
  "ftypheim",
  "ftypheis",
  "ftypmif1",
  "ftypmsf1",
]);

const execFileAsync = promisify(execFile);

if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

const MIME_EXTENSION_MAP = [
  { match: /png/, ext: "png" },
  { match: /jpe?g/, ext: "jpg" },
  { match: /gif/, ext: "gif" },
  { match: /webp/, ext: "webp" },
  { match: /heic|heif/, ext: "heic" },
  { match: /svg/, ext: "svg" },
  { match: /video\/mp4/, ext: "mp4" },
  { match: /quicktime/, ext: "mov" },
  { match: /x-m4v/, ext: "m4v" },
  { match: /webm/, ext: "webm" },
  { match: /pdf/, ext: "pdf" },
];

const DISPOSITION_FILENAME_REGEX = /filename\*?=(?:UTF-8''|"?)([^";]+)/i;

const extractExtensionFromFilename = (filename) => {
  if (!filename) return "";
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
};

const getExtensionFromDisposition = (disposition) => {
  if (!disposition) return "";
  const match = disposition.match(DISPOSITION_FILENAME_REGEX);
  if (!match) return "";
  let filename = match[1];
  filename = filename.replace(/"/g, "").trim();
  try {
    filename = decodeURIComponent(filename);
  } catch (err) {
    // ignore decode issues but keep reference to err for lint
    if (process.env.DEBUG) console.warn("decodeURIComponent failed:", err);
  }
  return extractExtensionFromFilename(filename);
};

function getFileExtension(contentType, contentDisposition) {
  const dispositionExt = getExtensionFromDisposition(contentDisposition);
  if (dispositionExt) return dispositionExt;

  if (contentType) {
    const lower = contentType.toLowerCase();
    const hit = MIME_EXTENSION_MAP.find(({ match }) => match.test(lower));
    if (hit) return hit.ext;
  }

  return "bin";
}

const extensionFromFileName = (filename) => {
  if (!filename) return "";
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
};

const shouldConvertToMp4 = (extension) =>
  extension ? MOV_EXTENSIONS.has(extension.toLowerCase()) : false;

const shouldConvertToJpg = (extension) =>
  extension ? HEIC_EXTENSIONS.has(extension.toLowerCase()) : false;

const resolveTargetExtension = (extension) => {
  const lower = (extension || "").toLowerCase();
  if (shouldConvertToMp4(lower)) return "mp4";
  if (shouldConvertToJpg(lower)) return "jpg";
  return lower;
};

async function convertMovToMp4(inputPath, outputPath) {
  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-vf",
      "scale=iw:ih",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-profile:v",
      "high",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-preset",
      "medium",
      outputPath,
    ]);
    fs.unlinkSync(inputPath);
    console.log(`Converted ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    return outputPath;
  } catch (err) {
    console.error(`Failed to convert ${inputPath} to mp4:`, err);
    return inputPath;
  }
}

async function convertHeicToJpg(inputPath, outputPath) {
  try {
    await execFileAsync("sips", ["-s", "format", "jpeg", inputPath, "--out", outputPath]);
    fs.unlinkSync(inputPath);
    console.log(`Converted ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    return outputPath;
  } catch (err) {
    console.error(`Failed to convert ${inputPath} to jpg:`, err);
    return inputPath;
  }
}

const detectHeicBySignature = (filePath) => {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
  // Strip NULs from brand
  const brand = buffer.toString("ascii", 4, 12).replace(/\0+/g, "");
    return HEIC_BRANDS.has(brand);
  } catch (err) {
    if (process.env.DEBUG) console.warn("detectHeicBySignature failed:", err);
    return false;
  }
};

async function downloadImage(url, savePath) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to download ${url}: ${res.statusText}`);
    return { success: false, contentType: "", contentDisposition: "" };
  }
  const buffer = await res.buffer();
  fs.writeFileSync(savePath, buffer);
  console.log(`Saved asset to ${savePath}`);
  return {
    success: true,
    contentType: res.headers.get("content-type") || "",
    contentDisposition: res.headers.get("content-disposition") || "",
  };
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

function getAssetBaseName(key) {
  return key.replace(/\s+/g, "_").toLowerCase();
}

function findExistingAssetFile(folderPath, baseName) {
  if (!fs.existsSync(folderPath)) return null;
  const files = fs.readdirSync(folderPath);
  return files.find((file) => file.startsWith(`${baseName}.`)) || null;
}

async function processProject(project) {
  const email = sanitizeFilename(project["Email Address"] || "unknown_email");
  const projectName = sanitizeFilename(
    project["Your Project Name"] || project["Project Name"] || "unknown_project",
  );
  const folderPath = path.join(PUBLIC_IMAGES_DIR, email, projectName);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const assetKeys = Object.keys(project).filter(
    (key) => ASSET_FIELD_REGEX.test(key) && project[key],
  );

  const newProject = { ...project };

  for (const key of assetKeys) {
    const url = project[key];
    if (!url) continue;
    if (typeof url === "string" && url.startsWith("/images/")) {
      newProject[key] = url;
      continue;
    }

    const directUrl = getDirectDriveUrl(url);
    if (!directUrl) {
      console.warn(`Skipping non-GDrive or invalid URL for ${key}: ${url}`);
      continue;
    }

    try {
      const baseName = getAssetBaseName(key);
      const existingFile = findExistingAssetFile(folderPath, baseName);
      const existingExt = existingFile
        ? extensionFromFileName(existingFile)
        : "";
      const existingTargetExt = existingExt ? resolveTargetExtension(existingExt) : "";

      let headContentType = "";
      let headDisposition = "";
      let headExtension = "";

      try {
        const headRes = await fetch(directUrl, { method: "HEAD" });
        if (headRes.ok) {
          headContentType = headRes.headers.get("content-type") || "";
          headDisposition = headRes.headers.get("content-disposition") || "";
          headExtension = getFileExtension(headContentType, headDisposition);
        } else {
          console.warn(
            `HEAD request failed for ${directUrl}: ${headRes.status} ${headRes.statusText}`,
          );
        }
      } catch (headErr) {
        console.warn(`Unable to fetch HEAD for ${directUrl}:`, headErr);
      }

      let normalizedExt = (headExtension || existingExt || "bin").toLowerCase();
      let targetExt = resolveTargetExtension(normalizedExt);

      if (existingFile) {
        const existingFileExt = extensionFromFileName(existingFile);
        if (
          (targetExt !== "bin" && existingFileExt === targetExt) ||
          (existingTargetExt && existingFileExt === existingTargetExt)
        ) {
          newProject[key] = `/images/${email}/${projectName}/${existingFile}`;
          continue;
        }

        try {
          fs.unlinkSync(path.join(folderPath, existingFile));
        } catch (unlinkErr) {
          console.warn(`Unable to remove outdated asset ${existingFile}:`, unlinkErr);
        }
      }

      const initialFileName = `${baseName}.${normalizedExt}`;
      const initialSavePath = path.join(folderPath, initialFileName);

      const downloadResult = await downloadImage(directUrl, initialSavePath);
      if (!downloadResult.success) {
        continue;
      }

      let effectiveExt = normalizedExt;
      if (effectiveExt === "bin") {
        const derivedExt = getFileExtension(
          downloadResult.contentType,
          downloadResult.contentDisposition,
        );
        if (derivedExt && derivedExt !== "bin") {
          effectiveExt = derivedExt.toLowerCase();
        }
      }

      let finalFileName = `${baseName}.${effectiveExt}`;
      let finalFilePath = initialSavePath;

      if (effectiveExt !== normalizedExt) {
        const adjustedPath = path.join(folderPath, finalFileName);
        fs.renameSync(initialSavePath, adjustedPath);
        finalFilePath = adjustedPath;
      }

      if (
        !shouldConvertToMp4(effectiveExt) &&
        !shouldConvertToJpg(effectiveExt) &&
        detectHeicBySignature(finalFilePath)
      ) {
        effectiveExt = "heic";
      }

      if (effectiveExt && extensionFromFileName(finalFileName) !== effectiveExt) {
        const adjustedPath = path.join(folderPath, `${baseName}.${effectiveExt}`);
        fs.renameSync(finalFilePath, adjustedPath);
        finalFilePath = adjustedPath;
        finalFileName = path.basename(finalFilePath);
      }

      if (shouldConvertToMp4(effectiveExt)) {
        const outputPath = path.join(folderPath, `${baseName}.mp4`);
        finalFilePath = await convertMovToMp4(finalFilePath, outputPath);
        finalFileName = path.basename(finalFilePath);
        effectiveExt = extensionFromFileName(finalFileName) || effectiveExt;
      } else if (shouldConvertToJpg(effectiveExt)) {
        const outputPath = path.join(folderPath, `${baseName}.jpg`);
        finalFilePath = await convertHeicToJpg(finalFilePath, outputPath);
        finalFileName = path.basename(finalFilePath);
        effectiveExt = extensionFromFileName(finalFileName) || effectiveExt;
      }

      const finalTargetExt = resolveTargetExtension(effectiveExt);
      targetExt = finalTargetExt === "" ? targetExt : finalTargetExt;

      if (targetExt !== "bin" && extensionFromFileName(finalFileName) !== targetExt) {
        const adjustedPath = path.join(folderPath, `${baseName}.${targetExt}`);
        fs.renameSync(finalFilePath, adjustedPath);
        finalFilePath = adjustedPath;
        finalFileName = path.basename(finalFilePath);
      }

      newProject[key] = `/images/${email}/${projectName}/${finalFileName}`;
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

  const updatedProjects = new Array(projects.length);

  for (let i = 0; i < projects.length; i += CONCURRENT_PROJECTS) {
    const slice = projects.slice(i, i + CONCURRENT_PROJECTS);
    const processed = await Promise.all(
      slice.map((project) => processProject(project)),
    );
    processed.forEach((project, index) => {
      updatedProjects[i + index] = project;
    });
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(updatedProjects, null, 2));
  console.log(`✅ Saved updated JSON to ${OUTPUT_JSON_PATH}`);
}

main().catch(console.error);
