import dbConnect from "@/lib/db";
import CompanyUser from "@/models/CompanyUser";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET = process.env.JWT_SECRET;

// ─── Helper: Auth Verification ───
function verifyCompany(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const [, token] = authHeader.split(" ");
    if (!token) throw new Error("Unauthorized");

    const decoded = jwt.verify(token, SECRET);
    if (!decoded || decoded.type !== "company") throw new Error("Forbidden");

    return decoded;
  } catch (err) {
    throw new Error(err.message || "Unauthorized");
  }
}

// ─── PUT /api/company/users/[id] ───
export async function PUT(req, { params }) {
  try {
    const company = verifyCompany(req);
    
    // ✅ Next.js 15 Fix: params ko await karein
    const { id } = await params; 
    
    const body = await req.json();

    await dbConnect();

    // Data to be updated
    const updateData = {
      name: body.name,
      email: body.email,
      roles: Array.isArray(body.roles) ? body.roles : [],
      modules: body.modules || {},
      employeeId: body.employeeId || undefined, // Keep employee link sync
    };

    // Password update logic
    if (body.password && body.password.trim() !== "") {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const user = await CompanyUser.findOneAndUpdate(
      { _id: id, companyId: company.companyId },
      { $set: updateData }, // Use $set for safer updates
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User updated successfully", user });
  } catch (e) {
    console.error("PUT Error:", e.message);
    const status = /Unauthorized|Forbidden|Missing/.test(e.message) ? 401 : 500;
    return NextResponse.json({ success: false, message: e.message }, { status });
  }
}

// ─── DELETE /api/company/users/[id] ───
export async function DELETE(req, { params }) {
  try {
    const company = verifyCompany(req);
    
    // ✅ Next.js 15 Fix: params ko await karein
    const { id } = await params;

    await dbConnect();

    const deleted = await CompanyUser.findOneAndDelete({
      _id: id,
      companyId: company.companyId,
    });

    if (!deleted) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (e) {
    console.error("DELETE Error:", e.message);
    const status = /Unauthorized|Forbidden|Missing/.test(e.message) ? 401 : 500;
    return NextResponse.json({ success: false, message: e.message }, { status });
  }
}


// import dbConnect from "@/lib/db";
// import CompanyUser from "@/models/CompanyUser";
// import { NextResponse } from "next/server";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";

// const SECRET = process.env.JWT_SECRET;

// // ─── Helper ───
// function verifyCompany(req) {
//   try {
//     const authHeader = req.headers.get("authorization");
//     if (!authHeader) throw new Error("Missing authorization header");

//     const [, token] = authHeader.split(" ");
//     if (!token) throw new Error("Unauthorized");

//     const decoded = jwt.verify(token, SECRET);
//     if (!decoded || decoded.type !== "company") throw new Error("Forbidden");

//     return decoded;
//   } catch (err) {
//     throw new Error(err.message || "Unauthorized");
//   }
// }

// // ─── PUT /api/company/users/[id] ───
// export async function PUT(req, { params }) {
//   try {
//     const company = verifyCompany(req);
//     const { id } = params;
//     const body = await req.json();

//     await dbConnect();

//     const updateData = {
//       name: body.name,
//       email: body.email,
//       roles: Array.isArray(body.roles) ? body.roles : [],
//       modules: body.modules || {},
//     };

//     if (body.password && body.password.trim() !== "") {
//       updateData.password = await bcrypt.hash(body.password, 10);
//     }

//     const user = await CompanyUser.findOneAndUpdate(
//       { _id: id, companyId: company.companyId },
//       updateData,
//       { new: true }
//     ).select("-password");

//     if (!user) {
//       return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
//     }

//     return NextResponse.json({ success: true, message: "User updated successfully", user });
//   } catch (e) {
//     const status = /Unauthorized|Forbidden|Missing/.test(e.message) ? 401 : 500;
//     return NextResponse.json({ success: false, message: e.message }, { status });
//   }
// }

// // ─── DELETE /api/company/users/[id] ───
// export async function DELETE(req, { params }) {
//   try {
//     const company = verifyCompany(req);
//     const { id } = params;

//     await dbConnect();

//     const deleted = await CompanyUser.findOneAndDelete({
//       _id: id,
//       companyId: company.companyId,
//     });

//     if (!deleted) {
//       return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
//     }

//     return NextResponse.json({ success: true, message: "User deleted successfully" });
//   } catch (e) {
//     const status = /Unauthorized|Forbidden|Missing/.test(e.message) ? 401 : 500;
//     return NextResponse.json({ success: false, message: e.message }, { status });
//   }
// }

