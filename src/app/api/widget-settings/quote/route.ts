import { db } from "@/db";
import { widgetSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { ensureDatabaseInitialized } from "@/db/init-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: publicly available (used by login page)
export async function GET() {
  await ensureDatabaseInitialized();
  let row = await db.select().from(widgetSettings).where(eq(widgetSettings.id, 1)).limit(1);
  if (row.length === 0) {
    await db.insert(widgetSettings).values({ id: 1 });
    row = await db.select().from(widgetSettings).where(eq(widgetSettings.id, 1)).limit(1);
  }
  const r = row[0];
  return Response.json({
    data: {
      quoteText: r.quoteText,
      quoteAuthor: r.quoteAuthor,
      quoteImage: r.quoteImage || "",
      quoteImageFit: r.quoteImageFit || "contain",
      flagImage: (r as Record<string, unknown>).flagImage || "",
    },
  });
}

// PUT: admin-only
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "بدنه نامعتبر" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.quoteText === "string") update.quoteText = body.quoteText.trim().slice(0, 1000);
  if (typeof body.quoteAuthor === "string") update.quoteAuthor = body.quoteAuthor.trim().slice(0, 200);
  if (typeof body.quoteImage === "string") update.quoteImage = body.quoteImage;
  if (body.quoteImageFit === "cover" || body.quoteImageFit === "contain") update.quoteImageFit = body.quoteImageFit;
  if (typeof body.flagImage === "string") update.flagImage = body.flagImage;

  await db.update(widgetSettings).set(update).where(eq(widgetSettings.id, 1));

  const row = await db.select().from(widgetSettings).where(eq(widgetSettings.id, 1)).limit(1);
  const r = row[0];
  return Response.json({
    data: {
      quoteText: r.quoteText,
      quoteAuthor: r.quoteAuthor,
      quoteImage: r.quoteImage || "",
      quoteImageFit: r.quoteImageFit || "contain",
      flagImage: (r as Record<string, unknown>).flagImage || "",
    },
  });
}
