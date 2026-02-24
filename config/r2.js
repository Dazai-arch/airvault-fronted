const { S3Client, ListBucketsCommand,  ListObjectsV2Command } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const isLocal = process.env.NODE_ENV !== "production";

// Local mock for R2
const localR2 = {
  async putObject({ key, body, contentType }) {
    const dir = path.join(__dirname, "../uploads/r2mock", path.dirname(key));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(__dirname, "../uploads/r2mock", key), body);
    return { key };
  },
  async getObject({ key }) {
    const filePath = path.join(__dirname, "../uploads/r2mock", key);
    return fs.readFileSync(filePath);
  },
  async deleteObject({ key }) {
    const filePath = path.join(__dirname, "../uploads/r2mock", key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  },
  async generateUploadUrl(key) {
    return `http://localhost:5000/api/local-upload/${encodeURIComponent(key)}`;
  },
  async generateDownloadUrl(key, filename) {
    return `http://localhost:5000/uploads/r2mock/${key}`;
  }
};

// Real R2 client for production
const r2Client = isLocal ? null : new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const connectR2 = async () => {
  if (isLocal) {
    const mockDir = path.join(__dirname, "../uploads/r2mock");
    fs.mkdirSync(mockDir, { recursive: true });
    console.log("R2 Connected ✅ (local mock — files saved to uploads/r2mock)");
    return;
  }

  try {
    const data = await r2Client.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: 1,
    }));
    console.log(`R2 Connected ✅ — Bucket: ${process.env.R2_BUCKET_NAME}`);
    //const buckets = data.Buckets?.map(b => b.Name).join(", ") || "no buckets yet";
    //console.log(`R2 Connected ✅ — Buckets: ${buckets}`);
  } catch (err) {
    console.error("R2 Connection Error:", err.message);
    console.log("⚠️ Server will continue without R2");
  }
};

module.exports = { r2Client, localR2, connectR2, isLocal };