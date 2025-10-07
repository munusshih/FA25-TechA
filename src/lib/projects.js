import rawProjects from "../data/projects-with-local-images.json";

export const MODULE_ORDER = [
  "Project 1: Flexible Manifesto",
  "Project 2: Data Sculpture",
  "Project 3: Community Protocol",
];

export const PROJECT_TITLE_FIELD = "Your Project Name";
export const PROJECT_FALLBACK_TITLE_FIELD = "Project Name";
export const DESCRIPTION_FIELD = "Your Project Description (max 2000 characters)";
export const DESCRIPTION_FALLBACK_FIELD = "Project Description";
export const P5_FIELD = "p5 Editor Link ";
export const P5_FALLBACK_FIELD = "p5 Editor Link";
export const MODULE_FIELD = "Which Module is this?";

export const PRIMARY_METADATA_FIELDS = [
  { key: "Your Name (First + Last Name)", label: "Student" },
  { key: "What is your section?", label: "Section" },
  { key: MODULE_FIELD, label: "Module" },
];

export const SECONDARY_METADATA_GROUPS = [
  {
    title: "Project Context",
    fields: [
      {
        key: "Is there a web or code component to your project?",
        label: "Web or code component",
      },
    ],
  },
  {
    title: "Credits & Inspiration",
    fields: [
      {
        key: "Credit (List out collaborators, tutorials, libraries, references, AI agents used)",
        label: "Credits",
      },
      {
        key: "Anyone's work inspired you at the open classroom?",
        label: "Inspired by",
      },
    ],
  },
  {
    title: "Additional Notes",
    fields: [
      {
        key: "Other links (etc. Documentation site, your portfolio, arena board and etc.)",
        label: "Other links",
      },
    ],
  },
];

const LINK_COUNT = 3;

export const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
]);

export const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
]);

const slugify = (value) =>
  value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-{2,}/g, "-") || "project";

const asLineArray = (value) => {
  if (typeof value !== "string") {
    if (value === undefined || value === null) return [];
    return [String(value)];
  }
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const moduleNameForProject = (project) => {
  const rawValue = project[MODULE_FIELD];
  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return "Other";
};

const parseTimestamp = (value) => {
  if (typeof value !== "string") return Number.NEGATIVE_INFINITY;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
};

export const getProjectTitle = (project) =>
  project[PROJECT_TITLE_FIELD] ||
  project[PROJECT_FALLBACK_TITLE_FIELD] ||
  "Untitled project";

export const getProjectAuthor = (project) =>
  project["Your Name (First + Last Name)"] || "Unknown";

const baseSlugForProject = (project, moduleName) => {
  const email = project["Email Address"] || project["Your Name (First + Last Name)"] || "project";
  const emailSlug = email.split("@")[0] || email;
  const title = getProjectTitle(project);
  const parts = [emailSlug, moduleName, title];
  return slugify(parts.filter(Boolean).join("-"));
};

const latestProjectsByStudentAndModule = () => {
  const latestByKey = new Map();
  rawProjects.forEach((project) => {
    const moduleName = moduleNameForProject(project);
    const email =
      project["Email Address"] || project["Your Name (First + Last Name)"] || "unknown";
    const key = `${email}|${moduleName}`;
    const timestamp = parseTimestamp(project.Timestamp);
    const existing = latestByKey.get(key);
    if (!existing || timestamp > existing.timestamp) {
      latestByKey.set(key, { project, timestamp });
    }
  });
  return Array.from(latestByKey.values()).map(({ project }) => project);
};

const processedProjects = (() => {
  const latestProjects = latestProjectsByStudentAndModule();
  const slugCounts = new Map();
  return latestProjects.map((project) => {
    const moduleName = moduleNameForProject(project);
    const baseSlug = baseSlugForProject(project, moduleName);
    const slugCount = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, slugCount + 1);
    const slug = slugCount === 0 ? baseSlug : `${baseSlug}-${slugCount + 1}`;
    return {
      ...project,
      moduleName,
      slug,
      timestampValue: parseTimestamp(project.Timestamp),
    };
  });
})();

export const projectsWithMeta = processedProjects;
export const projectBySlug = new Map(processedProjects.map((project) => [project.slug, project]));

export const groupProjectsByModule = (projects = projectsWithMeta) => {
  const buckets = new Map();
  projects.forEach((project) => {
    if (!buckets.has(project.moduleName)) {
      buckets.set(project.moduleName, []);
    }
    buckets.get(project.moduleName).push(project);
  });

  const orderedModules = [
    ...MODULE_ORDER,
    ...Array.from(buckets.keys()).filter((name) => !MODULE_ORDER.includes(name)),
  ];

  return orderedModules
    .map((name) => [
      name,
      (buckets.get(name) ?? []).sort((a, b) => a.timestampValue - b.timestampValue),
    ])
    .filter(([, list]) => list.length > 0);
};

export const buildLinkList = (project) =>
  Array.from({ length: LINK_COUNT }, (_, index) => {
    const number = index + 1;
    const rawUrl = project[`Link ${number} URL`];
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!url) return null;
    const rawLabel = project[`Link ${number} Title`];
    return {
      url,
      label:
        typeof rawLabel === "string" && rawLabel.trim()
          ? rawLabel.trim()
          : `Link ${number}`,
    };
  }).filter(Boolean);

export const buildFieldEntries = (project, fields) =>
  fields
    .map(({ key, label }) => {
      const value = project[key];
      if (!value) return null;
      return {
        key,
        label,
        lines: asLineArray(value),
      };
    })
    .filter(Boolean);

const extractExtension = (value) => {
  if (typeof value !== "string") return "";
  const match = value.toLowerCase().match(/\.([a-z0-9]+)(?:[?#].*)?$/);
  return match ? `.${match[1]}` : "";
};

export const getAssetType = (value) => {
  if (typeof value !== "string") return "external";
  const trimmed = value.trim();
  if (!trimmed) return "external";
  const extension = extractExtension(trimmed);
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (trimmed.startsWith("/images/")) return "local";
  return "external";
};

export const fileEntriesForProject = (project) => {
  const indices = new Set();

  Object.keys(project).forEach((key) => {
    const match = key.match(/^(File|Image) (\d+)$/i);
    if (match && project[key]) {
      indices.add(match[2]);
    }
  });

  return Array.from(indices)
    .sort((a, b) => Number(a) - Number(b))
    .map((index) => {
      const fileKey = `File ${index}`;
      const imageKey = `Image ${index}`;
      const key = project[fileKey]
        ? fileKey
        : project[imageKey]
          ? imageKey
          : null;
      if (!key) return null;

      const rawValue = project[key];
      const sanitizedValue =
        typeof rawValue === "string" ? rawValue.trim() : rawValue;
      if (!sanitizedValue) return null;

      const description = (() => {
        const fileDescription = project[`File ${index} description`];
        if (typeof fileDescription === "string" && fileDescription.trim()) {
          return fileDescription.trim();
        }
        const imageDescription = project[`Image ${index} description`];
        if (typeof imageDescription === "string" && imageDescription.trim()) {
          return imageDescription.trim();
        }
        return null;
      })();

      const labelPrefix = key.startsWith("File") ? "File" : "Image";
      const type = getAssetType(sanitizedValue);

      return {
        key,
        value: sanitizedValue,
        description,
        label: `${labelPrefix} ${index}`,
        type,
      };
    })
    .filter(Boolean);
};

export const buildParagraphs = (value) => {
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) =>
      paragraph
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean);
};

export const getPrimaryMediaEntry = (project) =>
  fileEntriesForProject(project).find((entry) => entry.type === "image");

export const DESCRIPTION_FIELDS = [DESCRIPTION_FIELD, DESCRIPTION_FALLBACK_FIELD];
