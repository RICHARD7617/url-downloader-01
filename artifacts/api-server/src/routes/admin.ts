import { Router, type IRouter } from "express";
import { db, downloadsTable, usersTable } from "@workspace/db";
import { sql, eq, count, desc, gte } from "drizzle-orm";
import { VerifyAdminPinBody, GetAdminDashboardQueryParams, ListAdminDownloadsQueryParams } from "@workspace/api-zod";

const ADMIN_PIN = "207617";

const router: IRouter = Router();

function verifyPin(pin: string): boolean {
  return pin === ADMIN_PIN;
}

router.post("/admin/verify", async (req, res): Promise<void> => {
  const parsed = VerifyAdminPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request" });
    return;
  }

  if (verifyPin(parsed.data.pin)) {
    res.json({ valid: true, message: "Access granted" });
  } else {
    res.status(401).json({ error: "invalid_pin", message: "Invalid PIN" });
  }
});

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  const parsed = GetAdminDashboardQueryParams.safeParse(req.query);
  if (!parsed.success || !verifyPin(parsed.data.pin)) {
    res.status(401).json({ error: "unauthorized", message: "Invalid PIN" });
    return;
  }

  const [totalResult] = await db.select({ count: count() }).from(downloadsTable).where(eq(downloadsTable.success, true));
  const [userResult] = await db.select({ count: count() }).from(usersTable);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayResult] = await db.select({ count: count() })
    .from(downloadsTable)
    .where(sql`${downloadsTable.success} = true AND ${downloadsTable.createdAt} >= ${todayStart}`);

  const platformResults = await db
    .select({ platform: downloadsTable.platform, count: count() })
    .from(downloadsTable)
    .where(eq(downloadsTable.success, true))
    .groupBy(downloadsTable.platform);

  const byPlatform: Record<string, number> = {};
  for (const row of platformResults) {
    byPlatform[row.platform] = Number(row.count);
  }

  const recentDownloads = await db
    .select()
    .from(downloadsTable)
    .orderBy(desc(downloadsTable.createdAt))
    .limit(10);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyRaw = await db.execute(sql`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM downloads
    WHERE success = true AND created_at >= ${thirtyDaysAgo}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `);

  const dailyStats = (dailyRaw.rows as Array<{ date: unknown; count: unknown }>).map(row => ({
    date: String(row.date),
    count: Number(row.count),
  }));

  res.json({
    totalDownloads: Number(totalResult.count),
    totalUsers: Number(userResult.count),
    todayDownloads: Number(todayResult.count),
    byPlatform,
    recentDownloads: recentDownloads.map(d => ({
      id: d.id,
      url: d.url,
      platform: d.platform,
      userIp: d.userIp || "",
      createdAt: d.createdAt.toISOString(),
      filename: d.filename || "",
      success: d.success,
    })),
    dailyStats,
  });
});

router.get("/admin/downloads", async (req, res): Promise<void> => {
  const parsed = ListAdminDownloadsQueryParams.safeParse(req.query);
  if (!parsed.success || !verifyPin(parsed.data.pin)) {
    res.status(401).json({ error: "unauthorized", message: "Invalid PIN" });
    return;
  }

  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 20;
  const offset = (page - 1) * limit;

  const [totalResult] = await db.select({ count: count() }).from(downloadsTable);
  const downloads = await db
    .select()
    .from(downloadsTable)
    .orderBy(desc(downloadsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    downloads: downloads.map(d => ({
      id: d.id,
      url: d.url,
      platform: d.platform,
      userIp: d.userIp || "",
      createdAt: d.createdAt.toISOString(),
      filename: d.filename || "",
      success: d.success,
    })),
    total: Number(totalResult.count),
    page,
    limit,
  });
});

export default router;
