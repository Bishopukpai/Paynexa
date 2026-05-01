import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db';
import Plan from '../../models/Plans';

/**
 * GET: Fetch a specific plan or all plans for a business address
 * URL Params: ?id=PLAN_ID or ?address=0xWALLET
 */
export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const address = searchParams.get('address');

    // Fetch a single plan by its ID (Used on the Checkout Page)
    if (id) {
      const plan = await Plan.findById(id);
      if (!plan) {
        return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: plan });
    }

    // Fetch all plans owned by a specific SaaS business address (Used in Dashboard)
    if (address) {
      const plans = await Plan.find({ businessAddress: address.toLowerCase() }).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, data: plans });
    }

    return NextResponse.json({ success: false, message: "Missing id or address parameter" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Create a new Subscription Plan for a SaaS provider
 * Body: { businessAddress, title, price, interval, webhookUrl, currency }
 */
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // 1. VALIDATION: Check all required fields
    // Ensure webhookUrl is present as per your Schema requirements
    if (!body.businessAddress || !body.title || !body.price || !body.interval || !body.webhookUrl) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields: businessAddress, title, price, interval, or webhookUrl." 
      }, { status: 400 });
    }

    // 2. NORMALIZE INTERVAL & CURRENCY
    const submittedInterval = body.interval.toLowerCase();
    const allowedIntervals = ['hourly', 'daily', 'monthly', 'yearly'];

    if (!allowedIntervals.includes(submittedInterval)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid interval. Use: hourly, daily, monthly, or yearly." 
      }, { status: 400 });
    }

    // 3. CREATE THE PLAN
    const newPlan = await Plan.create({
      businessAddress: body.businessAddress.toLowerCase(),
      title: body.title,
      price: Number(body.price),
      currency: body.currency || 'USDT', // Defaults to USDT if not specified
      interval: submittedInterval,
      webhookUrl: body.webhookUrl,
      active: true,
    });

    console.log(`✨ New USDT Plan Created: ${newPlan.title} (${newPlan.price} ${newPlan.currency})`);

    return NextResponse.json({ 
      success: true, 
      message: "Plan created successfully", 
      data: newPlan 
    });

  } catch (error: any) {
    console.error("PLAN_POST_ERROR:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const { id, title, price, webhookUrl, active } = await req.json();

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { title, price, webhookUrl, active },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedPlan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}