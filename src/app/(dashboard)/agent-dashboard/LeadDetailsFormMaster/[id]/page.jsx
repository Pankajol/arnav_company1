"use client";

import { use } from "react"; // ✅ Import use hook
import LeadDetailsForm from "@/components/LeadDetailsForm";

export default function LeadDetailsFormPage({ params }) {
  // ✅ Next.js 15: Unwrap the params promise using React.use()
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  console.log("Lead ID extracted correctly:", id);

  return (
    <div>
      {/* Pass the unwrapped id to your form */}
      <LeadDetailsForm leadId={id} />
    </div>
  );
}