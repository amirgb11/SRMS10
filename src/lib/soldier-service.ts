import { db } from "@/db";
import { soldiers, serviceAdjustments } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { computeServiceEndDate } from "./service-date";
import { SOLDIER_FIELDS } from "./fields";
import { toEnDigits } from "./jalali";

/** Recompute and persist serviceEndDate for a soldier from base + adjustments. */
export async function recomputeServiceEndDate(soldierId: number) {
  const rows = await db
    .select()
    .from(soldiers)
    .where(eq(soldiers.id, soldierId))
    .limit(1);
  const soldier = rows[0];
  if (!soldier) return null;

  const adj = await db
    .select()
    .from(serviceAdjustments)
    .where(eq(serviceAdjustments.soldierId, soldierId));

  const end = computeServiceEndDate(soldier.dispatchDate, adj);
  if (end) {
    await db
      .update(soldiers)
      .set({ serviceEndDate: end, updatedAt: new Date() })
      .where(eq(soldiers.id, soldierId));
  }
  return end;
}

/**
 * Actual DB column names on the `soldiers` table (camelCase).
 * Any key NOT in this set is automatically persisted inside the `metadata` JSONB column,
 * so we can add new form fields (e.g. for printed forms) without a DB migration.
 * Keep this list in sync with the `soldiers` pgTable in `src/db/schema.ts`.
 */
const SOLDIER_COLUMN_KEYS = new Set<string>([
  "id", "rowNumber",
  "personnelCode", "nationalCode", "firstName", "lastName", "fatherName",
  "birthDate", "birthPlace", "identityBookletNumber",
  "phoneNumber", "homePhone", "mobilePhone", "city", "fullAddress", "postalCode",
  "serviceUnit", "rank", "membershipType", "dutyType", "recruitmentType",
  "maritalStatus", "marriageDate", "childrenCount",
  "dispatchDate", "serviceStartDate", "serviceEndDate",
  "fileNumber", "archiveNumber", "documentDate",
  "educationLevel", "educationMajor", "educationCode",
  "educationAtDispatch", "majorAtDispatch", "educationAtEndCard", "majorAtEndCard",
  "eyeColor", "hairColor", "skinColor", "bloodType",
  "weight", "height", "wearsGlasses", "specialMark",
  "physicalStatus", "diseaseType", "injuryStatus", "injuryDate", "injuryReason",
  "disabilityPercentage",
  "legalServiceDuration", "completedServiceDuration",
  "serviceFromDate", "serviceToDate", "serviceLocation", "serviceLocationCode", "serviceRole",
  "dispatchOffice", "dispatchIssueDate", "absenceDuration", "extraServiceOnDispatch", "issuingOffice",
  "generalTrainingType", "generalTrainingFrom", "generalTrainingTo", "generalTrainingLocation",
  "specializedTrainingType", "specializedTrainingFrom", "specializedTrainingTo", "specializedTrainingLocation",
  "frontPresence", "expulsionStatus", "separationType",
  "leaveTypes", "rewardsAndPunishments", "confirmedBySignature", "notes",
  "metadata", "deletedAt", "createdBy", "createdAt", "updatedAt", "attachment",
]);

/** Fields stored as real columns (as opposed to metadata-only fields). */
export const FIXED_KEYS = SOLDIER_COLUMN_KEYS;

/** Split an incoming record into fixed columns + metadata bag, normalizing Persian/Arabic digits. */
export function splitPayload(input: Record<string, unknown>) {
  const fixed: Record<string, unknown> = {};
  const metadata: Record<string, unknown> = {};
  for (const [k, rawV] of Object.entries(input)) {
    if (k === "id" || k === "metadata") continue;
    let v = typeof rawV === "string" ? toEnDigits(rawV) : rawV;

    if (k === "childrenCount" || k === "rowNumber") {
      v = v === null || v === "" || v === undefined ? null : Number(v) || 0;
    }

    if (FIXED_KEYS.has(k)) fixed[k] = v === "" ? null : v;
    else metadata[k] = v;
  }
  return { fixed, metadata };
}

export async function listActiveSoldiers() {
  return db
    .select()
    .from(soldiers)
    .where(isNull(soldiers.deletedAt))
    .orderBy(soldiers.id);
}

export async function getSoldier(id: number) {
  const rows = await db
    .select()
    .from(soldiers)
    .where(and(eq(soldiers.id, id), isNull(soldiers.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}
