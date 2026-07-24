// app/api/affiliate/admin/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import crypto from "crypto";
import dbConnect from "../../../lib/db";
import Affiliate from "../../../models/Affiliate";
import { sendEmail } from "../../../lib/email";
import { authOptions } from "../../auth/[...nextauth]/route"; 

/**
 * Helper utility to verify admin privileges.
 */
async function verifyAdminAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized: Missing active session." },
        { status: 401 }
      ),
    };
  }

  // Cast session.user to safely check the role field without TypeScript errors
  const userWithRole = session.user as { role?: string };
  const isAdmin = userWithRole.role === "admin";

  if (!isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Forbidden: Admin privileges required." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}

// ==========================================
// GET: Fetch all affiliate applications
// ==========================================
export async function GET(req: Request) {
  try {
    // 1. Route Protection Check
    const auth = await verifyAdminAuth();
    if (!auth.authorized) return auth.response;

    // 2. Connect to Database
    await dbConnect();

    // 3. Fetch all affiliates sorted newest first
    const affiliates = await Affiliate.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: affiliates.length,
        data: affiliates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/affiliate/admin error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch affiliate directory.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH: Approve, Reject, or Suspend Affiliate
// ==========================================
export async function PATCH(req: Request) {
  try {
    // 1. Route Protection Check
    const auth = await verifyAdminAuth();
    if (!auth.authorized) return auth.response;

    // 2. Connect to Database
    await dbConnect();
    const { affiliateId, action } = await req.json();

    if (!affiliateId || !["approve", "reject", "suspend"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload or unsupported action type." },
        { status: 400 }
      );
    }

    const affiliate = await Affiliate.findById(affiliateId);
    if (!affiliate) {
      return NextResponse.json(
        { success: false, message: "Affiliate profile not found." },
        { status: 404 }
      );
    }

    let updatedStatus: "approved" | "rejected" | "suspended";
    let emailSubject = "";
    let emailBody = "";

    switch (action) {
      case "approve": {
        updatedStatus = "approved";

        // Auto-generate clean referral code if missing (e.g. alex-a4b8)
        if (!affiliate.referralCode) {
          const cleanName = affiliate.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          const randomHash = crypto.randomBytes(2).toString("hex");
          affiliate.referralCode = `${cleanName}-${randomHash}`;
        }

        emailSubject = "Approved: Welcome to the Paynexa Partner Network!";
        emailBody = `
          <h2>Application Approved!</h2>
          <p>Hi ${affiliate.name},</p>
          <p>Your affiliate application has been officially verified and approved.</p>
          <p><strong>Your Assigned Referral Code:</strong> <code>${affiliate.referralCode}</code></p>
          <p>You can now generate tracking links and view live commission performance on your dashboard.</p>
        `;
        break;
      }

      case "reject": {
        updatedStatus = "rejected";
        emailSubject = "Update on your Paynexa Partner Application";
        emailBody = `
          <p>Hi ${affiliate.name},</p>
          <p>Thank you for applying to Paynexa Partners. After evaluating your platform and profile, we cannot approve your application at this time.</p>
        `;
        break;
      }

      case "suspend": {
        updatedStatus = "suspended";
        emailSubject = "Paynexa Partner Account Suspended";
        emailBody = `
          <p>Hi ${affiliate.name},</p>
          <p>Your partner account has been temporarily <strong>Suspended</strong>. All active referral links associated with code <code>${affiliate.referralCode || "N/A"}</code> have been deactivated.</p>
        `;
        break;
      }

      default: {
        return NextResponse.json(
          { success: false, message: "Unhandled action parameter." },
          { status: 400 }
        );
      }
    }

    affiliate.status = updatedStatus;
    await affiliate.save();

    // Trigger notification email (non-blocking catch)
    try {
      await sendEmail({
        to: affiliate.email,
        subject: emailSubject,
        html: emailBody,
      });
    } catch (emailErr: any) {
      console.error("STATUS_UPDATE_EMAIL_FAILURE:", emailErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Affiliate status transitioned to ${updatedStatus}.`,
      data: {
        id: affiliate._id,
        status: affiliate.status,
        referralCode: affiliate.referralCode,
      },
    });
  } catch (error: any) {
    console.error("ADMIN_AFFILIATE_ACTION_ERROR:", error.message);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}