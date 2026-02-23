import dbConnect from "@/lib/db";
import { verifyJWT, getTokenFromHeader } from "@/lib/auth";
import Lead from "@/models/load"; 
import Opportunity from "@/models/Opportunity";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    const token = getTokenFromHeader(req);
    const decoded = verifyJWT(token);
    
    if (!decoded || !decoded.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ CRITICAL FIX: Convert string ID to MongoDB ObjectId for Aggregation
    const companyIdObj = new mongoose.Types.ObjectId(decoded.companyId);

    // 1. Fetch Stats in Parallel
    const [totalLeads, totalOppsResult, hotLeads, recentActivity] = await Promise.all([
      // Count leads (Mongoose handles string-to-id here)
      Lead.countDocuments({ companyId: decoded.companyId }),

      // Aggregate Opportunity values (Requires ObjectId for $match)
      Opportunity.aggregate([
        { 
          $match: { 
            // We check both formats to be safe
            $or: [
              { companyId: decoded.companyId },
              { companyId: companyIdObj }
            ]
          } 
        }, 
        { 
          $group: { 
            _id: null, 
            totalVal: { $sum: { $toDouble: "$value" } }, // Force 'value' to be a number
            count: { $sum: 1 } 
          } 
        }
      ]),

      Lead.find({ companyId: decoded.companyId, status: "Interested" })
        .limit(5)
        .sort({ updatedAt: -1 }),

      Opportunity.find({ companyId: decoded.companyId })
        .limit(4)
        .sort({ updatedAt: -1 })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        revenue: totalOppsResult[0]?.totalVal || 0,
        leads: totalLeads || 0,
        winRate: 65, 
        pipeline: totalOppsResult[0]?.count || 0
      },
      chartData: [
        { name: 'Mon', leads: 4, deals: 2 },
        { name: 'Tue', leads: 7, deals: 5 },
        { name: 'Wed', leads: 5, deals: 8 },
        { name: 'Thu', leads: 9, deals: 4 },
        { name: 'Fri', leads: 12, deals: 7 },
      ],
      hotLeads,
      recentActivity
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}