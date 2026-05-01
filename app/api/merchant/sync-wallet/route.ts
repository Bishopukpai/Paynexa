import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db'; // Adjust path if necessary
import Business from '../../../models/Business'; // Using your existing model

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, walletAddress, name, image } = body;

    if (!email || !walletAddress) {
      return NextResponse.json({ error: "Missing email or walletAddress" }, { status: 400 });
    }

    // We use the Business model here since that's what you have
    const updatedBusiness = await Business.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        walletAddress: walletAddress.toLowerCase(),
        name: name, // Syncing the Google Name
        image: image // Syncing the Google Profile Pic
      },
      { 
        new: true, 
        upsert: true // Creates the record if it doesn't exist
      }
    );

    console.log(`✅ Business Synced: ${email} -> ${walletAddress}`);

    return NextResponse.json({ 
      success: true, 
      data: updatedBusiness 
    });
  } catch (error: any) {
    console.error("SYNC_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}