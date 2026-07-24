// lib/attribution.ts
import dbConnect from "./db";
import Business from "../models/Business";
import Affiliate from "../models/Affiliate";

export interface AttributionResult {
  status: "APPLIED" | "NO_CODE" | "INVALID_CODE" | "SELF_REFERRAL_BLOCKED";
  referredByCode: string | null;
  referrerId: string | null;
  referrerModel: "Business" | "Affiliate" | null;
}

// Escapes special regex characters to prevent regex injection attacks
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function resolveSignupAttribution(
  userEmail: string,
  rawCode?: string | null
): Promise<AttributionResult> {
  // 1. Rule: Handle Missing or Empty Codes
  if (!rawCode || !rawCode.trim()) {
    return {
      status: "NO_CODE",
      referredByCode: null,
      referrerId: null,
      referrerModel: null,
    };
  }

  await dbConnect();
  const cleanCode = rawCode.trim();
  const safeRegex = new RegExp(`^${escapeRegex(cleanCode)}$`, "i");

  // 2. Query Affiliate collection first (supports referralCode or affiliateCode)
  let referrer: any = await Affiliate.findOne({
    $or: [
      { referralCode: safeRegex },
      { affiliateCode: safeRegex },
    ],
  });

  let referrerModel: "Affiliate" | "Business" = "Affiliate";

  // 3. Fallback: Query Business collection
  if (!referrer) {
    referrer = await Business.findOne({
      $or: [
        { referralCode: safeRegex },
        { affiliateCode: safeRegex },
      ],
    });
    referrerModel = "Business";
  }

  // 4. Rule: Ignore Invalid Codes
  if (!referrer) {
    return {
      status: "INVALID_CODE",
      referredByCode: null,
      referrerId: null,
      referrerModel: null,
    };
  }

  // 5. Rule: Prevent Self-Referral (Exact Case-Insensitive Email Match)
  const normalizedUserEmail = userEmail.toLowerCase().trim();
  const normalizedReferrerEmail = referrer.email?.toLowerCase().trim();

  if (normalizedReferrerEmail && normalizedReferrerEmail === normalizedUserEmail) {
    console.warn(`🛡️ ANTI-FRAUD: Self-referral attempt blocked for ${normalizedUserEmail}`);
    return {
      status: "SELF_REFERRAL_BLOCKED",
      referredByCode: null,
      referrerId: null,
      referrerModel: null,
    };
  }

  // 6. Resolution Success
  const matchedCode = referrer.referralCode || referrer.affiliateCode || cleanCode;

  return {
    status: "APPLIED",
    referredByCode: matchedCode,
    referrerId: referrer._id.toString(),
    referrerModel: referrerModel,
  };
}