// app/api/opportunity/[id]/route.js
import dbConnect from "@/lib/db";
import { getTokenFromHeader, verifyJWT } from "@/lib/auth";
import Opportunity from "@/models/Opportunity";

// Helper to authenticate (Reuse your logic)
async function authenticate(req) {
  const token = getTokenFromHeader(req);
  if (!token) return null;
  const decoded = verifyJWT(token);
  if (!decoded || !decoded.companyId) return null;
  return decoded;
}

// -------------------------------
//  GET SINGLE OPPORTUNITY
// -------------------------------
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const decoded = await authenticate(req);
    if (!decoded) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
    }

    // Next.js 15: params should be awaited if used in certain contexts, 
    // but in route handlers, they are usually available.
    const { id } = await params; 

    // Find opportunity belonging to the user's company
    const opportunity = await Opportunity.findOne({ 
      _id: id, 
      companyId: decoded.companyId 
    });

    if (!opportunity) {
      return new Response(JSON.stringify({ success: false, error: "Opportunity not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, data: opportunity }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// -------------------------------
//  UPDATE OPPORTUNITY (PUT)
// -------------------------------
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const decoded = await authenticate(req);
    if (!decoded) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await Opportunity.findOneAndUpdate(
      { _id: id, companyId: decoded.companyId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return new Response(JSON.stringify({ success: false, error: "Update failed or not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, data: updated }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

// -------------------------------
//  DELETE OPPORTUNITY
// -------------------------------
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const decoded = await authenticate(req);
    if (!decoded) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
    }

    const { id } = await params;

    const deleted = await Opportunity.findOneAndDelete({ 
      _id: id, 
      companyId: decoded.companyId 
    });

    if (!deleted) {
      return new Response(JSON.stringify({ success: false, error: "Not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, message: "Deleted" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}