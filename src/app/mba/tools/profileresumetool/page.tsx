// src/app/mba/tools/profileresumetool/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import ProfileResumeToolClient from "./ProfileResumeToolClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfileResumeToolPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/mba/tools/profileresumetool");
  }

  return <ProfileResumeToolClient />;
}
