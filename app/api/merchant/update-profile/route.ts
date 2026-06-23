import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "../../../lib/db";
import Business from "../../../models/Business";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user session credentials context
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized access call." }, { status: 401 });
    }

    await dbConnect();

    // 2. Parse clean JSON parameters from the frontend request
    const { name, imageUrl } = await req.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Business name must be at least 2 characters." }, { status: 400 });
    }

    // 3. Build the update payload object dynamically
    const updatePayload: any = { name: name.trim() };
    if (imageUrl) {
      updatePayload.image = imageUrl; // This will save the clean Supabase public URL string
    }

    // 4. Update the business tracking parameters collection document state in MongoDB
    const updatedBusiness = await Business.findOneAndUpdate(
      { email: session.user.email },
      updatePayload,
      { new: true }
    );

    if (!updatedBusiness) {
      return NextResponse.json({ error: "Merchant profile record not found." }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully!",
      user: {
        name: updatedBusiness.name,
        image: updatedBusiness.image
      }
    });
  } catch (error: any) {
    console.error("❌ PROFILE_UPDATE_API_ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal processing error." }, { status: 500 });
  }
}