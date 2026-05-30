import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db';
import Subscription from '../../models/Subscription';
import Plan from '../../models/Plans';
import { resend } from '../../lib/resend';

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Parse Request Body (Including 'mode' to distinguish test vs live)
    const { userAddress, userEmail, planId, transactionHash, currency, mode } = await req.json();

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
      expiryDate.setMinutes(expiryDate.getMinutes() + 1); // 1-minute test expiry
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
      mode: mode || plan.mode || 'production' 
    });

    // 6. TRIGGER THE WEBHOOK
    const saasWebhookUrl = plan.webhookUrl || process.env.NEXT_PUBLIC_DEFAULT_SAAS_WEBHOOK;
    
    if (saasWebhookUrl) {
      try {
        // Fire-and-forget payload structure
        fetch(saasWebhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Paynexa-Event': 'subscription.activated'
          },
          body: JSON.stringify({
            event: 'subscription.activated',
            mode: mode || plan.mode || 'production', // Critical parameter for merchants
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

    // 7. TRIGGER THE CONFIRMATION EMAIL (Resend Engine with Custom Branding)
    try {
      const environmentTag = (mode || plan.mode) === 'test' ? '[TEST MODE] ' : '';
      const currentMode = mode || plan.mode || 'production';

      await resend.emails.send({
        from: 'Paynexa <onboarding@resend.dev>', // Replace with your custom domain once verified on Resend
        to: userEmail.toLowerCase(),
        subject: `${environmentTag}Payment Confirmed - Your Subscription is Active!`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="background: ${currentMode === 'test' ? '#fef3c7' : '#dbeafe'}; color: ${currentMode === 'test' ? '#92400e' : '#1e40af'}; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; tracking-wider: 0.5px;">
                ${currentMode} Mode
              </span>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="vertical-align: middle;">
                  ${plan.logoUrl ? `
                    <img src="${plan.logoUrl}" alt="${plan.title} Logo" style="max-height: 48px; max-width: 160px; object-fit: contain; border-radius: 8px;" />
                  ` : `
                    <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">${plan.title}</h2>
                  `}
                </td>
                <td style="text-align: right; vertical-align: middle;">
                  <div style="display: inline-flex; align-items: center; gap: 4px; background: #f8fafc; padding: 6px 12px; border-radius: 8px; border: 1px solid #f1f5f9;">
                    <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Receipt via</span>
                    <span style="font-size: 11px; font-weight: 900; color: #1e40af; letter-spacing: -0.3px;">PAYNEXA</span>
                  </div>
                </td>
              </tr>
            </table>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />

            <h2 style="color: #2563eb; margin-top: 0; font-size: 22px; font-weight: 800;">Payment Successful!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your transaction was securely processed over the blockchain. Your account subscription access is now fully active.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #f1f5f9;">
              <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Product / Plan:</strong> <span style="color: #0f172a;">${plan.title}</span></p>
              <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Amount Settled:</strong> <span style="color: #2563eb; font-weight: bold;">${plan.price} ${currency || 'USDT'}</span></p>
              <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Expiration Date:</strong> <span style="color: #0f172a;">${expiryDate.toLocaleString()}</span></p>
            </div>

            <p style="font-size: 12px; color: #64748b; background: #fafafa; padding: 14px; border-radius: 10px; border: 1px solid #f1f5f9; line-height: 1.4;">
              <strong style="color: #475569; font-size: 11px; text-transform: uppercase; tracking-wide: 0.5px;">On-Chain Tx Hash</strong><br />
              <code style="word-break: break-all; color: #0f172a; font-size: 12px; font-family: monospace;">${transactionHash}</code>
            </p>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; letter-spacing: 0.3px;">
              This invoice is automated. Secured by Paynexa Cryptographic Payment Routing Infrastructure.
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
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This transaction has already been processed." }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}