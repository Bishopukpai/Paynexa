import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Subscription from '../../../models/Subscription';
import Plan from '../../../models/Plans';

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ success: false, message: "Missing merchant address" }, { status: 400 });
    }

    // 🔽 FIX: Create a case-insensitive regular expression match object 🔽
    const addressRegex = new RegExp(`^${address}$`, 'i');

    // 1. Fetch all subscription plans using the case-insensitive expression
    const plans = await Plan.find({ businessAddress: addressRegex });
    const planIds = plans.map(p => p._id);

    // If no plans exist for this address, return initial structures immediately
    if (planIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: { active: 0, inactive: 0, failed: 0, revenue: 0 },
        plans: [],
        customers: []
      });
    }

    // 2. Fetch all customer records belonging to those merchant plans
    const customers = await Subscription.find({ planId: { $in: planIds } })
      .populate('planId') 
      .sort({ createdAt: -1 });

    // 3. Count statuses cleanly
    let activeCount = 0;
    let inactiveCount = 0;
    let failedCount = 0;
    let totalRevenue = 0;

    customers.forEach((sub: any) => {
      if (sub.status === 'active') {
        activeCount++;
        
        // Pull price safely from populated plan document
        const planPrice = sub.planId?.price ? Number(sub.planId.price) : 0;
        
        // Net revenue after 1.5% fee split
        const netMerchantPrice = planPrice * 0.985; 
        
        totalRevenue += netMerchantPrice;
      } else if (sub.status === 'expired' || sub.status === 'cancelled') {
        inactiveCount++;
      } else {
        failedCount++;
      }
    });

    // 4. Return exact structured payload format expected by your state hook
    return NextResponse.json({
      success: true,
      stats: {
        active: activeCount,
        inactive: inactiveCount,
        failed: failedCount,
        revenue: totalRevenue 
      },
      plans: plans,
      customers: customers
    });

  } catch (error: any) {
    console.error("STATS_API_ERROR:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}