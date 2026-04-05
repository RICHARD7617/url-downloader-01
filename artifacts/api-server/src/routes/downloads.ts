import { Router, type IRouter } from "express";
import { db, downloadsTable, usersTable } from "@workspace/db";
import { sql, eq, count, desc } from "drizzle-orm";
import { CreateDownloadBody } from "@workspace/api-zod";
import { getDownloadLink } from "../lib/downloader";

const router: IRouter = Router();

router.post("/downloads", async (req, res): Promise<void> => {
  const parsed = CreateDownloadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { url, platform, userIp } = parsed.data;
  const ip = userIp || req.ip || "unknown";

  const [downloadRecord] = await db.insert(downloadsTable).values({
    url,
    platform,
    userIp: ip,
    success: false,
  }).returning();

  try {
    const videoInfo = await getDownloadLink(url, platform);

    await db.update(downloadsTable)
      .set({ success: true, filename: videoInfo.filename })
      .where(eq(downloadsTable.id, downloadRecord.id));

    const existingUser = await db.select().from(usersTable).where(eq(usersTable.ip, ip)).limit(1);
    if (existingUser.length > 0) {
      await db.update(usersTable)
        .set({
          totalDownloads: sql`${usersTable.totalDownloads} + 1`,
          lastSeen: new Date(),
        })
        .where(eq(usersTable.ip, ip));
    } else {
      await db.insert(usersTable).values({ ip, totalDownloads: 1 });
    }

    res.json({
      success: true,
      downloadUrl: videoInfo.downloadUrl,
      filename: videoInfo.filename,
      platform,
      quality: videoInfo.quality,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      downloadId: downloadRecord.id,
    });
  } catch (err) {
    req.log.error({ err, url, platform }, "Download failed");

    await db.update(downloadsTable)
      .set({ success: false, errorMessage: err instanceof Error ? err.message : "Unknown error" })
      .where(eq(downloadsTable.id, downloadRecord.id));

    res.status(500).json({
      error: "download_failed",
      message: err instanceof Error ? err.message : "Failed to download video. Please check the URL and try again.",
    });
  }
});

router.get("/downloads/stats", async (_req, res): Promise<void> => {
  const [totalResult] = await db.select({ count: count() }).from(downloadsTable).where(eq(downloadsTable.success, true));
  const [userResult] = await db.select({ count: count() }).from(usersTable);

  const platformResults = await db
    .select({ platform: downloadsTable.platform, count: count() })
    .from(downloadsTable)
    .where(eq(downloadsTable.success, true))
    .groupBy(downloadsTable.platform);

  const byPlatform: Record<string, number> = {};
  for (const row of platformResults) {
    byPlatform[row.platform] = Number(row.count);
  }

  res.json({
    totalDownloads: Number(totalResult.count),
    totalUsers: Number(userResult.count),
    byPlatform,
  });
});

export default router;
