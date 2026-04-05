import { execFile } from "child_process";
import { promisify } from "util";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

export interface VideoInfo {
  downloadUrl: string;
  filename: string;
  title: string;
  thumbnail: string;
  quality: string;
}

function detectPlatform(url: string): string {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com") || url.includes("fb.watch")) return "facebook";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  return "unknown";
}

async function getVideoInfo(url: string): Promise<{ title: string; thumbnail: string; ext: string }> {
  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      url,
    ], { timeout: 30000 });
    const info = JSON.parse(stdout);
    return {
      title: info.title || "video",
      thumbnail: info.thumbnail || "",
      ext: info.ext || "mp4",
    };
  } catch {
    return { title: "video", thumbnail: "", ext: "mp4" };
  }
}

export async function getDownloadLink(url: string, platform: string): Promise<VideoInfo> {
  const detectedPlatform = platform || detectPlatform(url);
  logger.info({ url, platform: detectedPlatform }, "Getting download link for video");

  let formatArgs: string[] = [];

  if (detectedPlatform === "youtube") {
    formatArgs = ["-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[ext=mp4]/best"];
  } else {
    formatArgs = ["-f", "bestvideo+bestaudio/best[ext=mp4]/best"];
  }

  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      "--get-url",
      "--no-playlist",
      "--no-warnings",
      ...formatArgs,
      url,
    ], { timeout: 30000 });

    const downloadUrl = stdout.trim().split("\n")[0];

    if (!downloadUrl || !downloadUrl.startsWith("http")) {
      throw new Error("Could not get direct video URL");
    }

    const info = await getVideoInfo(url);
    const safeName = info.title
      .replace(/[^a-zA-Z0-9\s-_]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 50);

    const filename = `${safeName || "video"}_HD.${info.ext}`;

    return {
      downloadUrl,
      filename,
      title: info.title,
      thumbnail: info.thumbnail,
      quality: "HD",
    };
  } catch (err) {
    logger.error({ err, url, platform: detectedPlatform }, "Failed to get video download link");
    throw new Error("Failed to extract video download link. The URL might be private or unsupported.");
  }
}
