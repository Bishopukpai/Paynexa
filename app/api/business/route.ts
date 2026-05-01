import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db';
import Business from '../../models/Business';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { walletAddress } = await req.json();

    // Find or Create business
    let business = await Business.findOne({ walletAddress });
    if (!business) {
      business = await Business.create({ walletAddress });
    }

    return NextResponse.json({ success: true, data: business });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}