// src/app/mba/tools/bschool-match/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import BschoolMatchClient from "./BschoolMatchClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BschoolMatchPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/mba/tools/bschool-match");
  }

  return <BschoolMatchClient />;
}
