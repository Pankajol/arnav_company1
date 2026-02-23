import dbConnect from "@/lib/db";
import { verifyJWT, getTokenFromHeader } from "@/lib/auth";
import Lead from "@/models/load"; // Using your specific filename
import Opportunity from "@/models/Opportunity";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    const token = getTokenFromHeader(req);
    const decoded = verifyJWT(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = decoded.companyId;
    const agentId = decoded.id; // From the token

    // 1. Fetch Agent-Specific Stats in Parallel
    const [myTotalLeads, myOppsResult, myHotLeads] = await Promise.all([
      // Only count leads assigned to THIS agent
      Lead.countDocuments({ companyId, assignedAgent: agentId }),

      // Only aggregate opportunities assigned to THIS agent
      Opportunity.aggregate([
        { 
          $match: { 
            companyId: companyId.toString(),
            assignedAgent: agentId.toString() // 👈 Critical Filter
          } 
        },
        { 
          $group: { 
            _id: null, 
            totalVal: { $sum: { $toDouble: "$value" } }, 
            count: { $sum: 1 } 
          } 
        }
      ]),

      // Fetch the Agent's top 5 interested leads
      Lead.find({ companyId, assignedAgent: agentId, status: "Interested" })
        .limit(5)
        .sort({ updatedAt: -1 })
    ]);

    return NextResponse.json({
      success: true,
      agentName: decoded.name || "Agent",
      stats: {
        revenue: myOppsResult[0]?.totalVal || 0,
        leads: myTotalLeads || 0,
        pipeline: myOppsResult[0]?.count || 0
      },
      myLeads: myHotLeads,
      recentLogs: [
        { message: "New Lead Assigned", time: "Just now" },
        { message: "Follow-up scheduled", time: "1h ago" }
      ]
    });
  } catch (error) {
    console.error("Agent Stats Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}