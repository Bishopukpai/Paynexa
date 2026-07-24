// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business"; 
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { getStoredReferralCode, clearStoredReferralCode } from "../../../lib/referral";
import { resolveSignupAttribution } from "../../../lib/attribution";

// Initialize Resend with secure environment variable API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to generate a clean, unique affiliate code from business name
const generateAffiliateCode = (name: string): string => {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return cleanName.length > 0 ? `${cleanName.slice(0, 10)}${randomSuffix}` : `REF${randomSuffix}`;
};

export async function POST(req: Request) {
  try {
    // Establish active database connection
    await dbConnect();
    
    // Extract incoming payload parameters
    const { businessName, email, password, referredBy } = await req.json();

    // =========================================================================
    // STEP 1: VALIDATE PAYLOAD & PREVENT DUPLICATE EMAIL (First Line of Defense)
    // =========================================================================
    if (!businessName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required registration parameters." }, 
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Security restriction: Password must be at least 8 characters long." }, 
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check email uniqueness to prevent duplicate account creation
    const existingBusiness = await Business.findOne({ email: normalizedEmail });
    if (existingBusiness) {
      return NextResponse.json(
        { error: "An active registration matching this email address already exists." }, 
        { status: 409 }
      );
    }

    // =========================================================================
    // STEP 2: RESOLVE COOKIE & DIRECT CODE (Priority Resolution)
    // =========================================================================
    const cookieRefCode = await getStoredReferralCode();
    const candidateCode = referredBy?.trim() || cookieRefCode;

    // =========================================================================
    // STEP 3: EXECUTE FRAUD CHECKS IN RESOLVER (Anti-Fraud Engine)
    // =========================================================================
    // Verifies code existence across Affiliate and Business models, sanitizes regex, 
    // and blocks self-referral attempts (normalizedReferrerEmail === normalizedUserEmail)
    const attribution = await resolveSignupAttribution(normalizedEmail, candidateCode);
    const isAttributed = attribution.status === "APPLIED";

    // Hash user password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Cryptographic verification token (24h lifespan)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Generate unique affiliate code for the new account
    const newAffiliateCode = generateAffiliateCode(businessName);

    // =========================================================================
    // STEP 4: SEAL PERMANENT ATTRIBUTION LOCK (1 Merchant = 1 Affiliate Rule)
    // =========================================================================
    // If self-referral or fake code occurred, attribution status is not "APPLIED",
    // setting referredBy/referrerId/referrerModel to null while hard-locking attribution.
    const newMerchant = await Business.create({
      name: businessName,        
      email: normalizedEmail,
      password: hashedPassword,  
      provider: "credentials",
      role: "user",
      isVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpires: tokenExpiry,
      affiliateCode: newAffiliateCode,
      
      // Step 3 Attribution Output (Null if blocked by anti-fraud or unreferred)
      referredBy: isAttributed ? attribution.referredByCode : null,
      referrerId: isAttributed ? attribution.referrerId : null,
      referrerModel: isAttributed ? attribution.referrerModel : null,

      // Hard Attribution Lock (Locks permanently upon document creation)
      attributionLocked: true, 
      attributionDate: new Date(),
    });

    // Compose activation link
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${verificationToken}`;
    
    // Dispatch Verification Email via Resend
    await resend.emails.send({
      from: "Paynexa <onboarding@resend.dev>", 
      to: normalizedEmail,
      subject: "Verify your Paynexa Merchant Account Workspace",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 16px;">
          <h2 style="color: #1e1b4b; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Welcome to Paynexa!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 24px;">Please confirm your email address to activate your gateway developer portal and merchant workspace components.</p>
          <div style="margin: 32px 0;">
            <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 14px;">
              Verify Account Activation
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin-top: 32px;">
            If you did not request this sign up sequence, you can safely ignore this automated message. This security token link expires in 24 hours.
          </p>
        </div>
      `,
    });

    // Clean up tracking cookie post-registration
    if (cookieRefCode) {
      await clearStoredReferralCode();
    }

    // Comprehensive Monitoring Log Output
    console.log("----------------------------------------------------------------------");
    console.log(`✉️ RESEND DISPATCH SUCCESS: Email routed to ${normalizedEmail}`);
    if (isAttributed) {
      console.log(`🔒 ATTRIBUTION LOCKED (APPLIED): Merchant ${newMerchant._id} -> Referred by ${attribution.referredByCode} (${attribution.referrerModel}: ${attribution.referrerId})`);
    } else {
      console.log(`🔒 ATTRIBUTION LOCKED (${attribution.status}): Merchant ${newMerchant._id} -> Unreferred / Fraud Blocked`);
    }
    console.log("----------------------------------------------------------------------");

    return NextResponse.json(
      { 
        success: true, 
        requiresVerification: true,
        message: "Merchant verification record compiled smoothly. Verification email sent via Resend." 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ CRITICAL CONTROL FLOW SIGNUP_BACKEND_ERROR:", error);
    return NextResponse.json(
      { error: "Internal service routing or email delivery engine failure." }, 
      { status: 500 }
    );
  }
}