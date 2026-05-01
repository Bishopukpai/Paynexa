import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Subscription from '../../../models/Subscription';

export async function GET(req: Request) {
  try {
    await dbConnect();

    // 1. Get the parameters from the URL (e.g., ?address=0x...&planId=...)
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const planId = searchParams.get('planId');

    if (!address || !planId) {
      return NextResponse.json({ active: false, message: "Missing params" }, { status: 400 });
    }

    // 2. Query the database
   const sub = await Subscription.findOne({
  userAddress: address.toLowerCase(),
  planId: planId,
}).sort({ createdAt: -1 }); // Get the latest record, even if expired

if (!sub) {
  return NextResponse.json({ active: false, status: null });
}

const isExpired = new Date() > new Date(sub.expiryDate);

return NextResponse.json({ 
  active: sub.status === 'active' && !isExpired,
  status: isExpired ? 'expired' : sub.status,
  expiryDate: sub.expiryDate 
});

  } catch (error: any) {
    console.error("Database Check Error:", error);
    return NextResponse.json({ active: false, error: error.message }, { status: 500 });
  }
}