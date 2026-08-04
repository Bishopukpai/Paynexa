import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business";
import { getStoredReferralCode, clearStoredReferralCode } from "../../../lib/referral";
import { resolveSignupAttribution } from "../../../lib/attribution";

const generateAffiliateCode = (name: string): string => {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return cleanName.length > 0 ? `${cleanName.slice(0, 10)}${randomSuffix}` : `REF${randomSuffix}`;
};

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { privyId, email, referredBy } = await req.json();

    if (!privyId) {
      return NextResponse.json({ error: "Privy Unique Identifier is required." }, { status: 400 });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    // 1. Check for existing merchant account
    let business = await Business.findOne({
      $or: [
        { privyId },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    });

    if (business) {
      if (!business.privyId) {
        business.privyId = privyId;
        await business.save();
      }

      return NextResponse.json({ 
        success: true, 
        message: "Merchant recognized successfully.", 
        businessId: business._id 
      });
    }

    // 2. Resolve Referrals (Query param or Cookie)
    const cookieRefCode = await getStoredReferralCode();
    const candidateCode = referredBy?.trim() || cookieRefCode;

    // 3. Anti-Fraud Attribution Engine
    const attribution = await resolveSignupAttribution(normalizedEmail || "", candidateCode);
    const isAttributed = attribution.status === "APPLIED";

    const defaultName = normalizedEmail ? normalizedEmail.split("@")[0] : `Merchant_${privyId.slice(-6)}`;
    const newAffiliateCode = generateAffiliateCode(defaultName);

    // 4. Create Merchant Entry
    business = await Business.create({
      name: defaultName,
      email: normalizedEmail,
      privyId,
      provider: "privy",
      role: "user",
      isVerified: true,
      affiliateCode: newAffiliateCode,
      
      referredBy: isAttributed ? attribution.referredByCode : null,
      referrerId: isAttributed ? attribution.referrerId : null,
      referrerModel: isAttributed ? attribution.referrerModel : null,

      attributionLocked: true,
      attributionDate: new Date(),
    });

    if (cookieRefCode) {
      await clearStoredReferralCode();
    }

    return NextResponse.json(
      { success: true, message: "Privy merchant account synchronized.", businessId: business._id },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ PRIVY_SYNC_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to process social authentication synchronization." }, 
      { status: 500 }
    );
  }
}