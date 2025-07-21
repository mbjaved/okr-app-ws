// src/app/api/departments/route.ts
// Best Practices: Modular, clear error handling, timeline logging
import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Default departments to seed if none exist
const DEFAULT_DEPARTMENTS = [
  "Dev - FE",
  "Dev - BE", 
  "QA",
  "HR",
  "Business",
  "Management"
];

// GET /api/departments - List all departments
export async function GET() {
  try {
    const departments = await getCollection("departments");
    
    // Seed default departments if none exist
    const count = await departments.countDocuments();
    if (count === 0) {
      const defaultDepts = DEFAULT_DEPARTMENTS.map(name => ({
        name,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await departments.insertMany(defaultDepts);
    }
    
    const result = await departments.find({}).toArray();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Failed to fetch departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments. Please try again later." }, { status: 500 });
  }
}

// POST /api/departments - Create new department (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }

    const departments = await getCollection("departments");
    
    // Check if department already exists
    const existing = await departments.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ error: "Department already exists" }, { status: 409 });
    }

    const newDepartment = {
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await departments.insertOne(newDepartment);
    const created = await departments.findOne({ _id: result.insertedId });
    
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create department:", error);
    return NextResponse.json({ error: "Failed to create department. Please try again later." }, { status: 500 });
  }
}
