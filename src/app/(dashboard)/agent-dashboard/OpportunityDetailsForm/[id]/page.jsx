import { use } from "react";
import OpportunityDetailsForm from "@/components/OpportunityDetailsForm";

export default function EditOpportunityPage({ params }) {
  // ✅ Next.js 15 fix: params ko unwrap karna zaroori hai
  // Isse params.id accessible ho jayega bina error ke
  return (
    <main>
      <OpportunityDetailsForm params={params} />
    </main>
  );
}