import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getCollection } from "@/lib/mongodb-utils";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const users = await getCollection("users");
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    const hashed = await hash(password, 10);
    const user = {
      name,
      email,
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await users.insertOne(user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
