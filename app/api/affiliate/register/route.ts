import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Affiliate from "../../../models/Affiliate";
import { sendEmail } from "../../../lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      name,
      email,
      password,
      country,
      timeZone,
      primaryPlatform,
      socialProfiles,
      preferredPayout,
      walletAddress,
    } = body;

    // 1. Core Profile Structural & Credential Validation
    if (!name || !email || !country || !timeZone || !primaryPlatform || !socialProfiles) {
      return NextResponse.json(
        { success: false, message: "Missing required profile fields." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Conditional Payout Validation
    let cleanWallet: string | undefined = undefined;

    if (preferredPayout === "USDC") {
      if (!walletAddress) {
        return NextResponse.json({ success: false, message: "Wallet address required." }, { status: 400 });
      }

      const targetWallet = walletAddress.trim().toLowerCase();

      if (!/^0x[a-fA-F0-9]{40}$/.test(targetWallet)) {
        return NextResponse.json({ success: false, message: "Invalid wallet address structure." }, { status: 400 });
      }

      cleanWallet = targetWallet;
    } else if (preferredPayout === "Bank") {
      if (!body.bankName || !body.accountName || !body.accountNumber) {
        return NextResponse.json({ success: false, message: "Missing bank wire details." }, { status: 400 });
      }
    }

    // 3. Collision Checks
    const queryConditions: any[] = [{ email: cleanEmail }];
    if (cleanWallet) queryConditions.push({ walletAddress: cleanWallet });

    const existingApplication = await Affiliate.findOne({ $or: queryConditions });
    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: "An application is already registered using these credentials." },
        { status: 409 }
      );
    }

    // 4. Hash Password & Generate Affiliate Tracking Code
    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanName = name.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const affiliateCode = cleanName.length > 0 
      ? `${cleanName.slice(0, 8)}${Math.floor(100 + Math.random() * 900)}`
      : `REF${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Save to Database
    const newApplication = await Affiliate.create({
      ...body,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      affiliateCode,
      walletAddress: cleanWallet,
      isVerified: true,
      status: "pending",
    });

    // 6. Automated Email Notification System
    try {
      await sendEmail({
        to: cleanEmail,
        subject: "Your Application is Under Review - Paynexa Partners",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Application Received</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                      
                      <!-- Header Accent -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 6px 0;"></td>
                      </tr>

                      <!-- Main Body Content -->
                      <tr>
                        <td style="padding: 40px 32px;">
                          <!-- Branding Context -->
                          <div style="font-weight: 800; font-size: 20px; letter-spacing: -0.025em; color: #0f172a; margin-bottom: 32px;">
                            PAYNEXA<span style="color: #4f46e5; font-weight: 500;">PARTNERS</span>
                          </div>

                          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; tracking: -0.025em; margin: 0 0 16px 0; line-height: 1.25;">
                            Application Received!
                          </h1>
                          
                          <p style="font-size: 16px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                            Hi ${name.trim()},<br><br>
                            Thank you for applying to the Paynexa Partner Framework. Our review team is currently evaluating your profile details and community channels.
                          </p>

                          <!-- Review Status Card -->
                          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td style="font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px;">
                                  Current Status
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <span style="display: inline-block; background-color: #fef3c7; color: #d97706; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 9999px; border: 1px solid #fde68a;">
                                    Awaiting Admin Validation
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- Application Overview -->
                          <h2 style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0;">
                            Submission Summary
                          </h2>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 32px;">
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-size: 14px; color: #64748b;" width="40%">Primary Platform</td>
                              <td style="padding: 10px 0; font-size: 14px; font-weight: 500; color: #334155;" width="60%">${primaryPlatform}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-size: 14px; color: #64748b;">Preferred Payout</td>
                              <td style="padding: 10px 0; font-size: 14px; font-weight: 500; color: #334155;">${preferredPayout}</td>
                            </tr>
                            ${cleanWallet ? `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-size: 14px; color: #64748b;">Wallet Target</td>
                              <td style="padding: 10px 0; font-size: 13px; font-family: monospace; color: #334155; word-break: break-all;">${cleanWallet}</td>
                            </tr>
                            ` : ''}
                          </table>

                          <!-- Next Steps Section -->
                          <h3 style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">What happens next?</h3>
                          <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin: 0;">
                            Our screening process typically wraps up within 24-48 business hours. Once verified, you will receive an approval email containing your custom tracking engine links and onboarding resource dashboard keys.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer Zone -->
                      <tr>
                        <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 4px 0;">
                            &copy; 2026 Paynexa Ecosystem. All rights reserved.
                          </p>
                          <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                            You received this email because you submitted an onboarding form to our partner pipeline.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });
      console.log(`Confirmation email successfully dispatched to: ${cleanEmail}`);
    } catch (emailErr: any) {
      console.error("EMAIL_DISPATCH_FAILURE:", emailErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully! Check your inbox for confirmation.",
      data: { id: newApplication._id, email: cleanEmail },
    });
  } catch (error: any) {
    console.error("AFFILIATE_REGISTRATION_ROUTE_ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}