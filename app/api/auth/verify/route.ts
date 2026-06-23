import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business";

/**
 * ✉️ 1. GET METHOD: Email Verification Link Receiver
 * Catches token clicks from Resend verification emails.
 */
export async function GET(req: Request) {
  try {
    await dbConnect();

    // Parse the token parameter out of the link URL query string
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=InvalidToken`);
    }

    // Locate matching token where expiration threshold is still in the future
    const business = await Business.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!business) {
      // Token is either invalid, malicious, or has passed its 24hr expiration window
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=TokenExpiredOrInvalid`);
    }

    // Update verification flags and purge tracking strings entirely
    business.isVerified = true;
    business.verificationToken = undefined;
    business.verificationTokenExpires = undefined;
    await business.save();

    // Redirect smoothly to login with a success verification flag for UI banners
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`);
  } catch (error) {
    console.error("EMAIL_VERIFICATION_ROUTE_ERROR:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=InternalError`);
  }
}

/**
 * 🌐 2. POST METHOD: SIWE Web3 Wallet Verification
 * Preserves your original crypto wallet signature assertion engine.
 */
export async function POST(req: Request) {
  try {
    const { message, signature } = await req.json();

    // The message arriving here is the raw string from prepareMessage()
    // We pass it directly to the constructor
    const siweMessage = new SiweMessage(message);

    // Perform verification
    const result = await siweMessage.verify({
      signature,
      // CRITICAL: This MUST match exactly what window.location.host sent
      domain: "localhost:3000", 
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Assertion failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      address: result.data.address,
    });
  } catch (err: any) {
    // If you see the parser error here, it means the string was mangled 
    // during the fetch transit or the domains don't match.
    console.error("SIWE VERIFY ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Invalid signature" },
      { status: 400 }
    );
  }
}