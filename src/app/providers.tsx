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
  return <ClientLayout session={session}>{children}</ClientLayout>;
}
