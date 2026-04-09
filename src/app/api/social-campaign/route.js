export const runtime = "nodejs";

import dbConnect from "@/lib/db";
import { getTokenFromHeader, verifyJWT } from "@/lib/auth";
import SocialCampaign from "@/models/SocialCampaign";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json" },
  });
}

function authCheck(req) {
  const token = getTokenFromHeader(req);
  if (!token) return { error: json({ success: false, error: "Unauthorized" }, 401) };
  try {
    const decoded = verifyJWT(token);
    if (!decoded?.companyId) return { error: json({ success: false, error: "No company in token" }, 403) };
    return { decoded };
  } catch {
    return { error: json({ success: false, error: "Invalid token" }, 401) };
  }
}

// ── WhatsApp send ─────────────────────────────────────
async function sendWhatsApp(numbers, message) {
  const results = [];
  for (const num of numbers) {
    try {
      const clean = num.toString().replace(/\D/g, "");
      const to = clean.startsWith("91") ? clean : "91" + clean;
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.META_WABA_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          }),
        }
      );
      results.push({ to, ok: res.ok });
    } catch (e) {
      results.push({ to: num, ok: false, error: e.message });
    }
  }
  return results;
}

// ── Email send ────────────────────────────────────────
async function sendEmails(recipients, subject, htmlBody) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const results = [];
  for (const to of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to, subject,
        html: htmlBody,
        text: htmlBody.replace(/<[^>]+>/g, ""),
      });
      results.push({ to, ok: true });
    } catch (e) {
      results.push({ to, ok: false, error: e.message });
    }
  }
  return results;
}

// ══════════════════════════════════════════════
// POST — Create Social Campaign
// ══════════════════════════════════════════════
export async function POST(req) {
  try {
    await dbConnect();
    const { decoded, error } = authCheck(req);
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (!body) return json({ success: false, error: "Missing body" }, 400);

    const {
      campaignName, platforms, contentType, sendModes,
      topic, industry, caption, hashtags,
      mediaUrls, scheduledTime,
      emailRecipients, whatsappNumbers,
      videoScript, imagePrompt,
    } = body;

    // Validations
    if (!campaignName) return json({ success: false, error: "Campaign name required" }, 400);
    if (!platforms?.length) return json({ success: false, error: "Select at least one platform" }, 400);
    if (!caption) return json({ success: false, error: "Caption required" }, 400);

    // Build full post content with hashtags
    const fullCaption = `${caption}\n\n${(hashtags || []).join(" ")}`.trim();

    // Save to DB
    const campaign = await SocialCampaign.create({
      companyId:      decoded.companyId,
      createdBy:      decoded.id || null,
      campaignName,
      platforms,
      contentType,
      sendModes:      sendModes || ["schedule"],
      topic,
      industry,
      caption,
      hashtags:       hashtags || [],
      mediaUrls:      mediaUrls || [],
      scheduledTime:  scheduledTime ? new Date(scheduledTime) : null,
      emailRecipients: emailRecipients || [],
      whatsappNumbers: whatsappNumbers || [],
      videoScript:    videoScript || null,
      imagePrompt:    imagePrompt || null,
      status:         sendModes?.includes("instant") ? "Sending" : "Scheduled",
    });

    const results = {};

    // ── Instant send ──────────────────────────────────
    if (sendModes?.includes("instant") || sendModes?.includes("email")) {
      if (emailRecipients?.length) {
        const emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1e293b;">${campaignName}</h2>
            <p style="color:#475569;line-height:1.7;">${caption}</p>
            ${hashtags?.length ? `<p style="color:#7c3aed;font-size:13px;">${hashtags.join(" ")}</p>` : ""}
            ${mediaUrls?.[0] ? `<img src="${mediaUrls[0]}" style="max-width:100%;border-radius:12px;margin-top:16px;" />` : ""}
            <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;" />
            <p style="color:#94a3b8;font-size:12px;">You received this because you are a subscriber. <a href="#">Unsubscribe</a></p>
          </div>`;
        results.email = await sendEmails(emailRecipients, campaignName, emailHtml);
      }
    }

    if (sendModes?.includes("instant") || sendModes?.includes("whatsapp")) {
      if (whatsappNumbers?.length) {
        results.whatsapp = await sendWhatsApp(whatsappNumbers, fullCaption);
      }
    }

    // Update campaign status
    if (sendModes?.includes("instant")) {
      campaign.status = "Sent";
      campaign.sentAt = new Date();
      await campaign.save();
    }

    return json({ success: true, data: campaign, results }, 201);

  } catch (err) {
    console.error("SOCIAL CAMPAIGN ERROR:", err?.message);
    return json({ success: false, error: err?.message }, 500);
  }
}

// ══════════════════════════════════════════════
// GET — List all social campaigns
// ══════════════════════════════════════════════
export async function GET(req) {
  try {
    await dbConnect();
    const { decoded, error } = authCheck(req);
    if (error) return error;

    const campaigns = await SocialCampaign.find({ companyId: decoded.companyId })
      .sort({ createdAt: -1 })
      .lean();

    return json({ success: true, data: campaigns });
  } catch (err) {
    return json({ success: false, error: err?.message }, 500);
  }
}