// app/api/affiliate/referral-link/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Affiliate from "../../../models/Affiliate";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const affiliate = await Affiliate.findOne({ email: email.trim().toLowerCase() });

    if (!affiliate) {
      return NextResponse.json(
        { success: false, message: "Affiliate record not found." },
        { status: 404 }
      );
    }

    // Protection Check: Block non-approved statuses
    if (affiliate.status === "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Your application is still under review. Referral links cannot be generated yet.",
          status: affiliate.status,
        },
        { status: 403 }
      );
    }

    if (affiliate.status === "suspended") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is currently suspended. Access to referral links is disabled.",
          status: affiliate.status,
        },
        { status: 403 }
      );
    }

    if (affiliate.status === "rejected") {
      return NextResponse.json(
        {
          success: false,
          message: "Your partner application was not approved.",
          status: affiliate.status,
        },
        { status: 403 }
      );
    }

    // Construct full tracking URL safely with fallback string
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paynexxa.com";
    const referralCode = affiliate.referralCode || "";
    const referralUrl = `${baseUrl}?ref=${referralCode}`;

    return NextResponse.json({
      success: true,
      data: {
        referralCode,
        referralUrl,
        status: affiliate.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}