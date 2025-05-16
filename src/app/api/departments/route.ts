// src/app/api/departments/route.ts
// Best Practices: Modular, clear error handling, timeline logging
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb-utils";

// GET /api/departments - List all departments
export async function GET() {
  try {
    const departments = await getCollection("departments");
    const result = await departments.find({}).toArray();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Failed to fetch departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments. Please try again later." }, { status: 500 });
  }
}
