/**
 * Referral Code Management System
 * Generates unique referral codes for users and validates them during payment
 */

import { db } from "./db";
import { referralCodes, users } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Generate a unique referral code for a user
 * Format: STORIFY-{RANDOM_6_CHARS}
 */
export async function generateReferralCode(userId: string): Promise<string> {
  const randomPart = generateRandomString(6);
  const code = `STORIFY-${randomPart}`.toUpperCase();
  
  // Check if code already exists
  const existing = await db.query.referralCodes.findFirst({
    where: eq(referralCodes.code, code),
  });
  
  if (existing) {
    // If collision, try again (very rare)
    return generateReferralCode(userId);
  }
  
  // Create the referral code
  const [newCode] = await db.insert(referralCodes).values({
    code,
    userId,
    discountPercent: 10,
    commissionPercent: 5,
    usageCount: 0,
    isActive: true,
  }).returning();
  
  return newCode.code;
}

/**
 * Get user's referral code (create if doesn't exist)
 */
export async function getUserReferralCode(userId: string): Promise<string> {
  const existing = await db.query.referralCodes.findFirst({
    where: and(
      eq(referralCodes.userId, userId),
      eq(referralCodes.isActive, true)
    ),
  });
  
  if (existing) {
    return existing.code;
  }
  
  return await generateReferralCode(userId);
}

/**
 * Validate a referral code and return discount info
 */
export async function validateReferralCode(code: string, userId?: string | null): Promise<{
  valid: boolean;
  discountPercent: number;
  commissionPercent: number;
  ownerId: string | null;
  ownerName: string | null;
  message: string;
}> {
  if (!code || code.trim() === "") {
    return {
      valid: false,
      discountPercent: 0,
      commissionPercent: 0,
      ownerId: null,
      ownerName: null,
      message: "Kode referral tidak boleh kosong",
    };
  }
  
  const referral = await db.query.referralCodes.findFirst({
    where: eq(referralCodes.code, code.toUpperCase().trim()),
  });
  
  if (!referral) {
    return {
      valid: false,
      discountPercent: 0,
      commissionPercent: 0,
      ownerId: null,
      ownerName: null,
      message: "Kode referral tidak valid",
    };
  }
  
  // Check if user is trying to use their own code (only if userId is provided)
  if (userId && referral.userId === userId) {
    return {
      valid: false,
      discountPercent: 0,
      commissionPercent: 0,
      ownerId: null,
      ownerName: null,
      message: "Anda tidak bisa menggunakan kode referral sendiri",
    };
  }
  
  // Check if inactive
  if (!referral.isActive) {
    return {
      valid: false,
      discountPercent: 0,
      commissionPercent: 0,
      ownerId: null,
      ownerName: null,
      message: "Kode referral sudah tidak aktif",
    };
  }
  
  // Check if expired
  if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
    return {
      valid: false,
      discountPercent: 0,
      commissionPercent: 0,
      ownerId: null,
      ownerName: null,
      message: "Kode referral sudah kadaluarsa",
    };
  }
  
  // Check max usage
  if (referral.maxUsage && referral.usageCount >= referral.maxUsage) {
    return {
      valid: false,
      discountPercent: 0,
      commissionPercent: 0,
      ownerId: null,
      ownerName: null,
      message: "Kode referral sudah mencapai batas penggunaan",
    };
  }

  const [owner] = await db
    .select({
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, referral.userId))
    .limit(1);

  const ownerName =
    owner?.name ||
    [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim() ||
    owner?.email ||
    null;
  
  return {
    valid: true,
    discountPercent: referral.discountPercent,
    commissionPercent: referral.commissionPercent,
    ownerId: referral.userId,
    ownerName,
    message: `Diskon ${referral.discountPercent}% akan diterapkan`,
  };
}

/**
 * Calculate discounted amount
 */
export function calculateDiscount(
  originalAmount: number,
  discountPercent: number
): {
  discountAmount: number;
  finalAmount: number;
} {
  const discountAmount = Math.floor(originalAmount * discountPercent / 100);
  const finalAmount = originalAmount - discountAmount;
  
  return {
    discountAmount,
    finalAmount,
  };
}

/**
 * Calculate commission amount for referral owner
 */
export function calculateCommission(
  paidAmount: number,
  commissionPercent: number
): number {
  return Math.floor((paidAmount * commissionPercent) / 100);
}

/**
 * Increment usage count when referral code is used successfully
 */
export async function incrementReferralUsage(code: string): Promise<void> {
  await db
    .update(referralCodes)
    .set({
      usageCount: sql`${referralCodes.usageCount} + 1`,
    })
    .where(eq(referralCodes.code, code.toUpperCase().trim()));
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string): Promise<{
  code: string | null;
  totalUsage: number;
  discountPercent: number;
  commissionPercent: number;
}> {
  const referral = await db.query.referralCodes.findFirst({
    where: and(
      eq(referralCodes.userId, userId),
      eq(referralCodes.isActive, true)
    ),
  });
  
  if (!referral) {
    return {
      code: null,
      totalUsage: 0,
      discountPercent: 10,
      commissionPercent: 5,
    };
  }
  
  return {
    code: referral.code,
    totalUsage: referral.usageCount,
    discountPercent: referral.discountPercent,
    commissionPercent: referral.commissionPercent,
  };
}

/**
 * Helper: Generate random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
