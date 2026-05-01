import { NextResponse } from 'next/server';
import { resend } from '../../../lib/resend';
import dbConnect from '../../../lib/db';
import Subscription from '../../../models/Subscription';

export async function GET(req: Request) {
  try {
    await dbConnect();

    // 1. Setup Base URL (Fallback to localhost if ENV is missing)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const now = new Date();
    
    // 2. Find subscriptions that are 'active' but the expiryDate is now in the past
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      expiryDate: { $lte: now }
    });

    if (expiredSubscriptions.length === 0) {
      return NextResponse.json({ message: "No new expirations found." });
    }

    const processed = [];

    for (const sub of expiredSubscriptions) {
      // 3. Prepare the Renewal Link
      // We use .toString() to ensure the MongoDB ID doesn't come out as an object
      const renewalLink = `${baseUrl}/checkout/${sub.planId.toString()}`;

      try {
        // 4. TRIGGER THE EMAIL
        await resend.emails.send({
          from: 'Paynexa <onboarding@resend.dev>',
          to: sub.userEmail,
          subject: 'Action Required: Your Infrastructure Access has Expired',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
              <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Access Paused</h2>
              <p style="color: #475569; line-height: 1.6;">
                The subscription for wallet <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${sub.userAddress}</code> 
                expired on <strong>${new Date(sub.expiryDate).toLocaleDateString()}</strong>.
              </p>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
                To restore your infrastructure services and prevent data loss, please renew your plan using the button below.
              </p>
              
              <a href="${renewalLink}" 
                 style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px;">
                 Renew Subscription
              </a>
              
              <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                If you have already renewed via a different wallet, please ignore this message.
              </p>
            </div>
          `
        });

        // 5. Update the status to 'expired' so we don't email them again
        sub.status = 'expired';
        await sub.save();
        
        processed.push(sub.userAddress);
        console.log(`✅ Notified and expired: ${sub.userAddress}`);
      } catch (err) {
        console.error(`❌ Failed to notify ${sub.userAddress}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      notified: processed.length,
      accounts: processed 
    });

  } catch (error: any) {
    console.error("CRON ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}