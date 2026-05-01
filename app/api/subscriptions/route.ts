import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db';
import Subscription from '../../models/Subscription';
import Plan from '../../models/Plans';
import { resend } from '../../lib/resend';

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Parse Request Body
    // We added 'currency' to the destructuring to track the asset type
    const { userAddress, userEmail, planId, transactionHash, currency } = await req.json();

    // 2. Validation
    if (!userAddress || !userEmail || !planId || !transactionHash) {
      return NextResponse.json(
        { error: "Missing required fields (Address, Email, Plan, or Hash)." },
        { status: 400 }
      );
    }

    // 3. Fetch Plan to calculate Expiry and get Merchant details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    // 4. Calculate Expiry Date based on Plan Interval
    const expiryDate = new Date();
    const interval = plan.interval.toLowerCase();

    if (interval === 'hourly') {
      // 1-minute expiry for developer testing
      expiryDate.setMinutes(expiryDate.getMinutes() + 1); 
    } else if (interval === 'daily') {
      expiryDate.setDate(expiryDate.getDate() + 1);
    } else if (interval === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (interval === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    // 5. Create the subscription in the DB
    const newSubscription = await Subscription.create({
      userAddress: userAddress.toLowerCase(),
      userEmail: userEmail.toLowerCase(),
      planId,
      transactionHash,
      expiryDate,
      status: 'active',
    });

    // 6. TRIGGER THE WEBHOOK
    // Notify the SaaS merchant that a USDT payment was received
    const saasWebhookUrl = plan.webhookUrl;
    
    if (saasWebhookUrl) {
      try {
        // Fire-and-forget: we don't 'await' this to keep response times fast
        fetch(saasWebhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Paynexa-Event': 'subscription.activated'
          },
          body: JSON.stringify({
            event: 'subscription.activated',
            data: {
              userAddress: userAddress.toLowerCase(),
              userEmail: userEmail.toLowerCase(),
              planId: planId,
              amount: plan.price,
              currency: currency || plan.currency || 'USDT',
              expiryDate: expiryDate,
              transactionHash: transactionHash
            }
          }),
        });
        console.log(`📡 Webhook signaled to merchant at ${saasWebhookUrl}`);
      } catch (webhookErr) {
        console.error("📡 Webhook delivery failed:", webhookErr);
      }
    }

    // 7. TRIGGER THE CONFIRMATION EMAIL
    try {
      await resend.emails.send({
        from: 'Paynexa <onboarding@resend.dev>',
        to: userEmail,
        subject: 'Payment Confirmed - Your Subscription is Active!',
        html: `
          <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px;">
            <h2 style="color: #2563eb; margin-top: 0;">Payment Successful!</h2>
            <p>Your access is now active. Here are your transaction details:</p>
            
            <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Plan:</strong> ${plan.title}</p>
              <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ${plan.price} ${currency || 'USDT'}</p>
              <p style="margin: 4px 0;"><strong>Valid Until:</strong> ${expiryDate.toLocaleString()}</p>
            </div>

            <p style="font-size: 13px; color: #64748b;">
              <strong>Transaction Hash:</strong><br />
              <code style="word-break: break-all;">${transactionHash}</code>
            </p>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
              Powered by Paynexa Infrastructure
            </p>
          </div>
        `
      });
      console.log("✅ Confirmation email sent to:", userEmail);
    } catch (emailError) {
      console.error("❌ Email failed to send:", emailError);
    }

    // 8. Final Response
    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully",
      data: newSubscription
    });

  } catch (error: any) {
    console.error("Subscription POST Error:", error);
    
    // Handle unique index constraint for transactionHash
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This transaction has already been processed." }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}