import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business";
import bcrypt from "bcryptjs";
import {
  getStoredReferralCode,
  clearStoredReferralCode,
} from "../../../lib/referral";
import { resolveSignupAttribution } from "../../../lib/attribution";

// Helper function to generate a clean, unique affiliate code from business name
const generateAffiliateCode = (name: string): string => {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return cleanName.length > 0
    ? `${cleanName.slice(0, 10)}${randomSuffix}`
    : `REF${randomSuffix}`;
};

export async function POST(req: Request) {
  try {
    // Establish active database connection
    await dbConnect();

    // Extract incoming payload parameters
    const { businessName, email, password, referredBy } = await req.json();

    // =========================================================================
    // STEP 1: VALIDATE PAYLOAD & PREVENT DUPLICATE EMAIL
    // =========================================================================
    if (!businessName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required registration parameters." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Security restriction: Password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check email uniqueness
    const existingBusiness = await Business.findOne({
      email: normalizedEmail,
    });

    if (existingBusiness) {
      return NextResponse.json(
        {
          error:
            "An active registration matching this email address already exists.",
        },
        { status: 409 }
      );
    }

    // =========================================================================
    // STEP 2: RESOLVE REFERRAL CODE
    // =========================================================================
    const cookieRefCode = await getStoredReferralCode();
    const candidateCode = referredBy?.trim() || cookieRefCode;

    // =========================================================================
    // STEP 3: EXECUTE FRAUD CHECKS
    // =========================================================================
    const attribution = await resolveSignupAttribution(
      normalizedEmail,
      candidateCode
    );

    const isAttributed = attribution.status === "APPLIED";

    // =========================================================================
    // STEP 4: HASH PASSWORD
    // =========================================================================
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // =========================================================================
    // STEP 5: GENERATE UNIQUE AFFILIATE CODE
    // =========================================================================
    const newAffiliateCode = generateAffiliateCode(businessName);

    // =========================================================================
    // STEP 6: CREATE MERCHANT ACCOUNT
    // =========================================================================
    // Email verification is disabled.
    // New accounts are immediately considered verified.
    const newMerchant = await Business.create({
      name: businessName,
      email: normalizedEmail,
      password: hashedPassword,
      provider: "credentials",
      role: "user",

      // Email verification disabled
      isVerified: true,

      affiliateCode: newAffiliateCode,

      // Attribution
      referredBy: isAttributed ? attribution.referredByCode : null,
      referrerId: isAttributed ? attribution.referrerId : null,
      referrerModel: isAttributed ? attribution.referrerModel : null,

      // Hard Attribution Lock
      attributionLocked: true,
      attributionDate: new Date(),
    });

    // =========================================================================
    // STEP 7: CLEAN UP REFERRAL COOKIE
    // =========================================================================
    if (cookieRefCode) {
      await clearStoredReferralCode();
    }

    // =========================================================================
    // STEP 8: MONITORING LOG
    // =========================================================================
    console.log("----------------------------------------------------------------------");
    console.log(
      `✅ SIGNUP SUCCESS: Merchant ${newMerchant._id} created for ${normalizedEmail}`
    );
    console.log(`🔓 EMAIL VERIFICATION: Disabled`);

    if (isAttributed) {
      console.log(
        `🔒 ATTRIBUTION LOCKED (APPLIED): Merchant ${newMerchant._id} -> Referred by ${attribution.referredByCode} (${attribution.referrerModel}: ${attribution.referrerId})`
      );
    } else {
      console.log(
        `🔒 ATTRIBUTION LOCKED (${attribution.status}): Merchant ${newMerchant._id} -> Unreferred / Fraud Blocked`
      );
    }

    console.log("----------------------------------------------------------------------");

    return NextResponse.json(
      {
        success: true,
        requiresVerification: false,
        message: "Merchant account created successfully.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ SIGNUP_BACKEND_ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to create merchant account.",
      },
      { status: 500 }
    );
  }
}