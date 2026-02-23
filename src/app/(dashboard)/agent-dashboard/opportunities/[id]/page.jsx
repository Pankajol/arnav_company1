"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OpportunityView from "@/components/OpportunityView";

export default function Page({ params }) {
  // Pass the params promise to the client component
  return <OpportunityView params={params} />;
}