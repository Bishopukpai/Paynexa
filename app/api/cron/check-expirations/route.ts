import { NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import { resend } from '../../../lib/resend';
import dbConnect from '../../../lib/db';
import Subscription from '../../../models/Subscription';

export async function GET(req: Request) {
  try {
    // =========================================================================
    // 🧪 SENTRY SERVER-SIDE SIMULATION TRIGGER
    // Comment out or completely remove this line once your dashboard test registers!
    // =========================================================================
    throw new Error("MongoDB Connection Timeout during daily subscription scan");

    await dbConnect();

    // 🔒 1. SECURITY FIX: Validate Secret CRON Authorization Token
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get('secret') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (cronSecret !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ success: false, message: "Unauthorized handshake access denied." }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const now = new Date();

    // Setup a 3-day target timestamp window for proactive warning notifications
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // ==========================================
    // ACTION A: WARN CUSTOMERS EXPIRING IN 3 DAYS
    // ==========================================
    const expiringSoon = await Subscription.find({
      status: 'active',
      expiryDate: { 
        $gte: new Date(threeDaysFromNow.setHours(0,0,0,0)), 
        $lte: new Date(threeDaysFromNow.setHours(23,59,59,999)) 
      },
      reminderSent: { $ne: true } // Avoid double warning triggers
    });

    for (const sub of expiringSoon) {
      const planIdStr = sub.planId._id ? sub.planId._id.toString() : sub.planId.toString();
      const renewalLink = `${baseUrl}/checkout/${planIdStr}`;

      try {
        await resend.emails.send({
          from: 'Paynexa <onboarding@resend.dev>',
          to: sub.userEmail,
          subject: 'Notice: Your Paynexa Subscription Expires in 3 Days',
          html: generateEmailTemplate("Subscription Expiring Soon", `Your subscription will expire on <strong>${new Date(sub.expiryDate).toLocaleDateString()}</strong>. Renew now to avoid any disruptions.`, renewalLink, sub.userAddress)
        });
        
        sub.reminderSent = true;
        await sub.save();
      } catch (err: any) {
        console.error(`❌ Failed pre-warning execution for ${sub.userAddress}:`, err.message);
        
        // 🛡️ Log email loop failures inside Sentry without breaking the remaining cron execution
        Sentry.captureException(err, {
          tags: { cron_sub_action: "warning_email_failed" },
          extra: { wallet: sub.userAddress, email: sub.userEmail }
        });
      }
    }

    // ==========================================
    // ACTION B: PROCESS COMPLETED EXPIRED SUBS
    // ==========================================
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      expiryDate: { $lte: now }
    });

    const processed = [];

    for (const sub of expiredSubscriptions) {
      const planIdStr = sub.planId._id ? sub.planId._id.toString() : sub.planId.toString();
      const renewalLink = `${baseUrl}/checkout/${planIdStr}`;

      try {
        await resend.emails.send({
          from: 'Paynexa <onboarding@resend.dev>',
          to: sub.userEmail,
          subject: 'Action Required: Your Infrastructure Access has Expired',
          html: generateEmailTemplate("Access Paused", `The subscription for wallet expired on <strong>${new Date(sub.expiryDate).toLocaleDateString()}</strong>. Please renew your plan using the button below to prevent data loss.`, renewalLink, sub.userAddress)
        });

        sub.status = 'expired';
        await sub.save();
        
        processed.push(sub.userAddress);
      } catch (err: any) {
        console.error(`❌ Failed processing final expiration for ${sub.userAddress}:`, err.message);
        
        // 🛡️ Track database flip or email failures for explicit accounts
        Sentry.captureException(err, {
          tags: { cron_sub_action: "final_expiration_failed" },
          extra: { wallet: sub.userAddress, subscriptionId: sub._id }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      warningsSent: expiringSoon.length,
      finalExpirationsProcessed: processed.length,
      accountsEnded: processed 
    });

  } catch (error: any) {
    console.error("CRON ERROR ENGINE:", error.message);
    
    // 🛡️ Captures global route level crashes (e.g. initial DB connect failure, faulty authentication checks)
    Sentry.captureException(error, {
      tags: { cron_action: "check-expirations" }
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Reusable clean HTML card layout function helper
function generateEmailTemplate(headerTitle: string, messageBody: string, link: string, wallet: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 16px;">${headerTitle}</h2>
      <p style="color: #475569; line-height: 1.6;">
        Account Wallet: <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${wallet}</code>
      </p>
      <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">${messageBody}</p>
      <a href="${link}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px;">
         Renew Subscription Structure
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        If you have already renewed via a different signature sequence transaction link, please ignore this notice safely.
      </p>
    </div>
  `;
}