'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClientLayout from "./client-layout";

export default async function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  // Patch: ensure session.user._id is a string for client serialization
  if (session && session.user && session.user._id && typeof session.user._id !== 'string') {
    if (typeof session.user._id === 'object' && 'toString' in session.user._id && typeof session.user._id.toString === 'function') {
      session.user._id = session.user._id.toString();
    } else {
      session.user._id = String(session.user._id);
    }
  }
  return <ClientLayout session={session}>{children}</ClientLayout>;
}
