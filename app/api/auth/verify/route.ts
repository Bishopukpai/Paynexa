import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";

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