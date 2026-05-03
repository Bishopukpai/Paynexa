import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Plan from '../../../models/Plans';
import Subscription from '../../../models/Subscription';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address')?.toLowerCase();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // 1. Find all plans created by this merchant
    const merchantPlans = await Plan.find({ businessAddress: address });
    const planIds = merchantPlans.map(p => p._id);

    // 2. Find all subscriptions belonging to those plans
    const subscriptions = await Subscription.find({ planId: { $in: planIds } })
      .populate('planId')
      .sort({ createdAt: -1 });

    const now = new Date();

    // 3. Calculate "Real-Time" status based on clock
    const subscriptionsWithRealStatus = subscriptions.map(sub => {
      const isActuallyExpired = new Date(sub.expiryDate) < now;
      
      return {
        ...sub._doc,
        status: isActuallyExpired ? 'expired' : sub.status
      };
    });

    // --- FEE LOGIC CONSTANTS ---
    const FEE_RATE = 0.015; // 1.5%
    const MERCHANT_SHARE = 1 - FEE_RATE; // 0.985

    // 4. Calculate stats using the updated array
    const active = subscriptionsWithRealStatus.filter(s => s.status === 'active').length;
    const inactive = subscriptionsWithRealStatus.filter(s => s.status === 'expired').length;
    const failed = subscriptionsWithRealStatus.filter(s => s.status === 'cancelled').length;
    
    // Revenue now reflects the net amount after the 1.5% platform fee
    const netRevenue = subscriptionsWithRealStatus
      .filter(s => s.status === 'active')
      .reduce((sum, sub) => {
        const grossPrice = sub.planId?.price || 0;
        return sum + (grossPrice * MERCHANT_SHARE);
      }, 0);

    return NextResponse.json({
      success: true,
      stats: {
        active,
        revenue: netRevenue, // This is now the take-home pay
        inactive,
        failed,
      },
      plans: merchantPlans,
      customers: subscriptionsWithRealStatus 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}