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
        // Override status if time has run out
        status: isActuallyExpired ? 'expired' : sub.status
      };
    });

    // 4. Calculate stats using the updated array
    const active = subscriptionsWithRealStatus.filter(s => s.status === 'active').length;
    const inactive = subscriptionsWithRealStatus.filter(s => s.status === 'expired').length;
    const failed = subscriptionsWithRealStatus.filter(s => s.status === 'cancelled').length;
    
    const revenue = subscriptionsWithRealStatus
      .filter(s => s.status === 'active')
      .reduce((sum, sub) => sum + (sub.planId?.price || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        active,
        revenue,
        inactive,
        failed,
      },
      plans: merchantPlans,
      // CRITICAL: Send the updated array here, not the original 'subscriptions'
      customers: subscriptionsWithRealStatus 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}