import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db';
import Plan from '../../models/Plans';
import { createClient } from '@supabase/supabase-js';

// Initialize your Supabase Client using backend environment tokens
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS backend-side
);

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
 * POST: Create a new Subscription Plan for a SaaS provider with Logo Storage Upload
 * Payload format: multipart/form-data (FormData object)
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // Parse incoming stream as FormData instead of standard JSON
    const data = await req.formData();
    
    const businessAddress = data.get('businessAddress') as string;
    const title = data.get('title') as string;
    const price = data.get('price') as string;
    const interval = data.get('interval') as string;
    const webhookUrl = data.get('webhookUrl') as string;
    const currency = data.get('currency') as string || 'USDT';
    const mode = data.get('mode') as string; // 🚀 FIXED: Explicitly extracted from incoming payload
    
    // Check if the file is being parsed properly as a File type object
    const logoFile = data.get('logo') as File | null;

    // 1. VALIDATION: Check all required fields (including billing mode)
    if (!businessAddress || !title || !price || !interval || !webhookUrl || !mode) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields: businessAddress, title, price, interval, webhookUrl, or mode." 
      }, { status: 400 });
    }

    // 2. NORMALIZE INTERVAL & MODE VALIDATION
    const submittedInterval = interval.toLowerCase();
    const allowedIntervals = ['hourly', 'daily', 'monthly', 'yearly'];

    if (!allowedIntervals.includes(submittedInterval)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid interval. Use: hourly, daily, monthly, or yearly." 
      }, { status: 400 });
    }

    const submittedMode = mode.toLowerCase();
    if (!['testnet', 'production'].includes(submittedMode)) {
      return NextResponse.json({
        success: false,
        message: "Invalid mode context configuration. Use: testnet or production."
      }, { status: 400 });
    }

    let logoUrl = '';

    // 3. CRITICAL: Handle File Upload to Supabase Bucket Storage
    if (logoFile && logoFile.size > 0) {
      try {
        const fileExtension = logoFile.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        
        const arrayBuffer = await logoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, buffer, {
            contentType: logoFile.type,
            upsert: true
          });

        if (uploadError) {
          console.error("Supabase Storage error processing payload:", uploadError);
          return NextResponse.json({
            success: false,
            error: `Supabase Storage Upload Failed: ${uploadError.message}`
          }, { status: 400 });
        }

        // Pull down the clean public read link layout
        const { data: publicUrlData } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);
          
        logoUrl = publicUrlData.publicUrl;
      } catch (uploadCatchErr: any) {
        console.error("Failed to execute storage intercept wrapper:", uploadCatchErr.message);
        return NextResponse.json({
          success: false,
          error: `Server failed processing file attachment: ${uploadCatchErr.message}`
        }, { status: 500 });
      }
    }

    // 4. CREATE THE PLAN IN MONGODB
    const newPlan = await Plan.create({
      businessAddress: businessAddress.toLowerCase(),
      title,
      price: Number(price),
      currency,
      interval: submittedInterval,
      webhookUrl,
      logoUrl, 
      mode: submittedMode, // 🚀 FIXED: Directly passed into model instantiations
      active: true,
    });

    console.log(`✨ New Co-Branded Plan Created: ${newPlan.title} [${newPlan.mode.toUpperCase()}] (${newPlan.price} ${newPlan.currency})`);

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

/**
 * PUT: Update an existing transaction tier framework
 */
export async function PUT(req: Request) {
  try {
    await dbConnect();
    const { id, title, price, webhookUrl, active, mode } = await req.json();

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { title, price, webhookUrl, active, mode },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedPlan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}