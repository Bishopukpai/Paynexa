import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business"; 
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";

// Initialize Resend with your secure environment variable API Key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // 1. Establish database connection active state
    await dbConnect();
    
    // Parse the payload body delivered by the client registration form interface
    const { businessName, email, password } = await req.json();

    // 2. Perform parameter validation checks
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

    // Normalize email layout string
    const normalizedEmail = email.toLowerCase().trim();
    
    // 3. Prevent database duplication anomalies
    const existingBusiness = await Business.findOne({ email: normalizedEmail });
    if (existingBusiness) {
      return NextResponse.json(
        { error: "An active registration matching this email address already exists." }, 
        { status: 409 }
      );
    }

    // 4. Securely hash credentials baseline
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. Generate high-entropy cryptographic verification strings (Valid for 24 Hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 6. Persist unverified merchant profile document to database cluster context
    await Business.create({
      name: businessName,        
      email: normalizedEmail,
      password: hashedPassword,  
      provider: "credentials",
      isVerified: false, // Locks NextAuth interactive sessions until token validation
      verificationToken: verificationToken,
      verificationTokenExpires: tokenExpiry
    });

    // 7. Compose absolute link targeting verification receiver route hook
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${verificationToken}`;
    
    // 8. Live Outbound Email Dispatch using Resend
    // NOTE: If your Resend account is in test/sandbox mode, you can only send emails to YOURSELF.
    // To send to external users, change 'onboarding@resend.dev' to your verified custom domain.
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

    // 🕵️ System Console Monitoring Trace Pipeline Logs
    console.log("----------------------------------------------------------------------");
    console.log(`✉️ RESEND DISPATCH SUCCESS: Email routed to ${normalizedEmail}`);
    console.log(`🔗 Verification Link: ${verifyUrl}`);
    console.log("----------------------------------------------------------------------");

    // 9. Return data feedback indicating verification is now required
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