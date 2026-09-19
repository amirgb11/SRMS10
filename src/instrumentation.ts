/**
 * Next.js instrumentation — یک‌بار هنگام بالا آمدن سرور اجرا می‌شود.
 * اینجا زمان‌بند پشتیبان‌گیری خودکار را راه می‌اندازیم.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { startBackupScheduler } = await import("./lib/backup-scheduler");
    startBackupScheduler();
  } catch (e) {
    console.error("[SRMS] instrumentation failed", e);
  }
}
