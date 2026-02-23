export const EXT = {
  image:        ["png","jpg","jpeg","gif","webp","svg","bmp","ico","avif","tiff","heic"],
  video:        ["mp4","webm","mov","mkv","m4v","ogv","avi","flv","wmv","3gp"],
  audio:        ["mp3","wav","ogg","flac","aac","m4a","wma","opus","aiff"],
  pdf:          ["pdf"],
  docx:         ["doc","docx","odt","rtf"],
  spreadsheet:  ["xls","xlsx","csv","numbers","ods"],
  presentation: ["ppt","pptx","key","odp"],
  archive:      ["zip","rar","7z","tar","gz","bz2","xz","zst","lz4"],
  code: [
    // Web
    "js","ts","jsx","tsx","vue","svelte","astro","mdx","html","htm","css","scss","sass","less",
    // Backend
    "py","java","kt","kts","go","rs","rb","php","cs","cpp","c","h","hpp","swift","dart",
    // JVM / functional
    "scala","groovy","clj","cljs","gradle","hs","ml","mli","fs","fsx","elm","purs","re","resi",
    // Systems
    "zig","v","nim","d","asm","s","ex","exs","erl","hrl",
    // Config / data
    "json","jsonc","json5","yaml","yml","xml","toml","ini","env","cfg","lock",
    "graphql","gql","proto","prisma","tf","hcl","bicep",
    // Shell / scripting
    "sh","bash","zsh","fish","ps1","bat","cmd","lua","r","m","coffee",
    // Misc
    "sql","makefile","dockerfile","gitignore","editorconfig","npmrc",
    "reason","dart","clojure",
  ],
  text: ["txt","md","log","markdown","rst","adoc"],
};

// ── Resolve preview type from mimeType + filename ────────────────────────────
export function resolvePreviewType(mimeType = "", name = "") {
  const cleanName = (name || "").replace(/\.enc$/i, "");
  const ext  = cleanName.split(".").pop()?.toLowerCase() || "";
  const mime = mimeType.toLowerCase();

  if (mime.startsWith("image/")              || EXT.image.includes(ext))        return "image";
  if (mime.startsWith("video/")              || EXT.video.includes(ext))        return "video";
  if (mime.startsWith("audio/")              || EXT.audio.includes(ext))        return "audio";
  if (mime === "application/pdf"             || EXT.pdf.includes(ext))          return "pdf";
  if (mime.includes("wordprocessingml")      || mime.includes("msword")
   || EXT.docx.includes(ext))                                                   return "docx";
  if (mime.includes("spreadsheetml")         || mime.includes("excel")
   || EXT.spreadsheet.includes(ext))                                            return "spreadsheet";
  if (mime.includes("presentationml")        || mime.includes("powerpoint")
   || EXT.presentation.includes(ext))                                           return "presentation";
  if (EXT.code.includes(ext)                || EXT.text.includes(ext)
   || mime.startsWith("text/"))                                                  return "text";

  return "unsupported";
}

// ── Get a display label ───────────────────────────────────────────────────────
export function getFileTypeLabel(mimeType = "", name = "") {
  const type = resolvePreviewType(mimeType, name);
  const labels = {
    image:"Image", video:"Video", audio:"Audio", pdf:"PDF",
    docx:"Word", spreadsheet:"Spreadsheet", presentation:"Presentation",
    text:"Text/Code", unsupported:"File",
  };
  return labels[type] || "File";
}

// ── Get Lucide icon component name for a file ─────────────────────────────────
// Usage: import { getFileIconName } from "@/utils/fileTypes"
// Then: const Icon = iconMap[getFileIconName(file.mimeType, file.name)]
export function getFileIconName(mimeType = "", name = "") {
  const type = resolvePreviewType(mimeType, name);
  return {
    image:"FileImage", video:"Video", audio:"Music", pdf:"FileText",
    docx:"FileText", spreadsheet:"Table2", presentation:"GalleryHorizontal",
    text:"Code2", unsupported:"File",
  }[type] || "File";
}

// ── Is this file previewable at all? ─────────────────────────────────────────
export function isPreviewable(mimeType, name) {
  return resolvePreviewType(mimeType, name) !== "unsupported";
}

// ── Is this file shareable via email? ─────────────────────────────────────────
const NON_SHAREABLE = new Set([
  "exe","dll","so","dylib","bin","dmg","apk","ipa",
  "bat","cmd","ps1","vbs","wsf","msi","pkg","deb","rpm",
  "keystore","jks","p12","pfx","pem","cer","crt","key","der",
  "db","sqlite","sqlite3",
]);
export function isShareable(name = "") {
  return !NON_SHAREABLE.has(name.split(".").pop()?.toLowerCase() || "");
}
