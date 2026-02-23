"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  Target, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  ArrowLeft, 
  Edit3, 
  TrendingUp, 
  FileText,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode"; // ✅ Added for role checking

const OpportunityView = ({ params: paramsPromise }) => {
  const params = use(paramsPromise);
  const id = params.id;

  const router = useRouter();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // ✅ Added state for role

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // ✅ 1. Check Roles from token
        const decoded = jwtDecode(token);
        const roles = decoded?.roles || [];
        const isUserAdmin = decoded?.type === "company" || roles.includes("Admin") || roles.includes("CRM Admin");
        setIsAdmin(isUserAdmin);

        const res = await axios.get(`/api/opportunity/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data?.success) {
          setOpportunity(res.data.data);
        }
      } catch (err) {
        toast.error("Opportunity not found");
        // ✅ 2. Use role-based fallback redirect
        const decoded = jwtDecode(localStorage.getItem("token"));
        const fallbackPath = (decoded.type === "company" || decoded.roles?.includes("Admin")) ? "/admin" : "/agent-dashboard";
        router.push(`${fallbackPath}/opportunities`);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOpportunity();
  }, [id, router]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  if (!opportunity) return null;

  // ✅ 3. Determine correct base path for buttons
  const basePath = isAdmin ? "/admin" : "/agent-dashboard";

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
      {/* Header Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push(`${basePath}/opportunities`)} // ✅ Updated
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
          >
            <ArrowLeft size={20} /> Pipeline
          </button>
          <button 
            onClick={() => router.push(`${basePath}/OpportunityDetailsForm/${id}`)} // ✅ Updated
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Edit3 size={18} /> Edit Deal
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {/* Deal Title & Top Badge */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                Opportunity Profile
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {opportunity.opportunityName}
            </h1>
            <p className="text-slate-500 font-medium mt-1 flex items-center gap-2 text-lg">
              <Briefcase size={20} className="text-slate-400" /> {opportunity.accountName}
            </p>
          </div>
          
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Current Stage</p>
              <p className="font-black text-indigo-600 uppercase tracking-wide">{opportunity.stage}</p>
            </div>
            <div className="h-10 w-[1px] bg-slate-100"></div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Confidence</p>
              <p className="font-black text-slate-800">{opportunity.probability}%</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            label="Expected Value" 
            value={`$${opportunity.value?.toLocaleString()}`} 
            icon={DollarSign} 
            color="bg-emerald-50 text-emerald-600" 
          />
          <StatCard 
            label="Estimated Close" 
            value={opportunity.closeDate ? new Date(opportunity.closeDate).toLocaleDateString() : "TBD"} 
            icon={Calendar} 
            color="bg-amber-50 text-amber-600" 
          />
          <StatCard 
            label="Weighted Value" 
            value={`$${((opportunity.value || 0) * (opportunity.probability / 100)).toLocaleString()}`} 
            icon={TrendingUp} 
            color="bg-blue-50 text-blue-600" 
          />
        </div>

        {/* Detailed Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description Card */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Deal Notes & Background</h2>
              </div>
              <div className="p-8">
                <p className="text-slate-600 leading-relaxed font-medium">
                  {opportunity.description || "No specific notes provided for this deal."}
                </p>
              </div>
            </div>

            {/* Source & Tracking Card */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-indigo-600" />
                <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Acquisition Details</h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Lead Source</label>
                  <p className="text-slate-800 font-bold capitalize">{opportunity.leadSource || "Direct Entry"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Created Date</label>
                  <p className="text-slate-800 font-bold">
                    {new Date(opportunity.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Progress */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm sticky top-28 shadow-lg shadow-slate-100/50">
              <h3 className="text-slate-800 font-black text-sm uppercase tracking-widest mb-6">Pipeline Health</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Closing Confidence</span>
                    <span className="text-xs font-bold text-indigo-600">{opportunity.probability}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000" 
                      style={{ width: `${opportunity.probability}%` }}
                    />
                  </div>
                </div>

                <div className="p-5 bg-indigo-600 rounded-2xl text-white">
                  <p className="text-[10px] font-bold uppercase mb-2 opacity-80">Weighted Forecast</p>
                  <p className="text-2xl font-black">
                    ${((opportunity.value || 0) * (opportunity.probability / 100)).toLocaleString()}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-medium opacity-70">
                    <Target size={12} /> Expected yield from this deal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityView;



// "use client";

// import React, { useEffect, useState, use } from "react";
// import { useRouter } from "next/navigation";
// import axios from "axios";
// import { 
//   Target, 
//   DollarSign, 
//   Calendar, 
//   Briefcase, 
//   ArrowLeft, 
//   Edit3, 
//   TrendingUp, 
//   FileText,
//   Loader2,
//   CheckCircle2
// } from "lucide-react";
// import { toast } from "react-toastify";

// const OpportunityView = ({ params: paramsPromise }) => {
//   // ✅ Next.js 15: Unwrap params
//   const params = use(paramsPromise);
//   const id = params.id;

//   const router = useRouter();
//   const [opportunity, setOpportunity] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchOpportunity = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get(`/api/opportunity/${id}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
        
//         if (res.data?.success) {
//           setOpportunity(res.data.data);
//         }
//       } catch (err) {
//         toast.error("Opportunity not found");
//         router.push("/admin/opportunity");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) fetchOpportunity();
//   }, [id, router]);

//   if (loading) return (
//     <div className="flex h-screen items-center justify-center bg-slate-50">
//       <Loader2 className="animate-spin text-indigo-600" size={40} />
//     </div>
//   );

//   if (!opportunity) return null;

//   const StatCard = ({ label, value, icon: Icon, color }) => (
//     <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
//       <div className={`p-4 rounded-2xl ${color}`}>
//         <Icon size={24} />
//       </div>
//       <div>
//         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
//         <p className="text-xl font-black text-slate-800">{value}</p>
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-[#F8FAFC] pb-12">
//       {/* Header Navigation */}
//       <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
//           <button 
//             onClick={() => router.push("/admin/opportunity")} 
//             className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
//           >
//             <ArrowLeft size={20} /> Pipeline
//           </button>
//           <button 
//             onClick={() => router.push(`/admin/OpportunityDetailsForm/${id}`)}
//             className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
//           >
//             <Edit3 size={18} /> Edit Deal
//           </button>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-6 mt-10">
//         {/* Deal Title & Top Badge */}
//         <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
//           <div>
//             <div className="flex items-center gap-3 mb-2">
//               <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
//                 Opportunity Profile
//               </span>
//             </div>
//             <h1 className="text-4xl font-black text-slate-900 tracking-tight">
//               {opportunity.opportunityName}
//             </h1>
//             <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
//               <Briefcase size={16} /> {opportunity.accountName}
//             </p>
//           </div>
          
//           <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
//             <div className="text-right">
//               <p className="text-[10px] font-bold text-slate-400 uppercase">Current Stage</p>
//               <p className="font-black text-indigo-600 uppercase tracking-wide">{opportunity.stage}</p>
//             </div>
//             <div className="h-10 w-[1px] bg-slate-100"></div>
//             <div className="text-center">
//               <p className="text-[10px] font-bold text-slate-400 uppercase">Confidence</p>
//               <p className="font-black text-slate-800">{opportunity.probability}%</p>
//             </div>
//           </div>
//         </div>

//         {/* Quick Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
//           <StatCard 
//             label="Expected Value" 
//             value={`$${opportunity.value?.toLocaleString()}`} 
//             icon={DollarSign} 
//             color="bg-emerald-50 text-emerald-600" 
//           />
//           <StatCard 
//             label="Estimated Close" 
//             value={opportunity.closeDate ? new Date(opportunity.closeDate).toLocaleDateString() : "TBD"} 
//             icon={Calendar} 
//             color="bg-amber-50 text-amber-600" 
//           />
//           <StatCard 
//             label="Probability" 
//             value={`${opportunity.probability}%`} 
//             icon={TrendingUp} 
//             color="bg-blue-50 text-blue-600" 
//           />
//         </div>

//         {/* Detailed Information Sections */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2 space-y-6">
            
//             {/* Description Card */}
//             <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
//               <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
//                 <FileText size={18} className="text-indigo-600" />
//                 <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Deal Notes & Background</h2>
//               </div>
//               <div className="p-8">
//                 <p className="text-slate-600 leading-relaxed font-medium italic">
//                   {opportunity.description || "No specific notes provided for this deal."}
//                 </p>
//               </div>
//             </div>

//             {/* Source & Tracking Card */}
//             <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
//               <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
//                 <CheckCircle2 size={18} className="text-indigo-600" />
//                 <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Acquisition Details</h2>
//               </div>
//               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Lead Source</label>
//                   <p className="text-slate-800 font-bold capitalize">{opportunity.leadSource || "Direct Entry"}</p>
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Created Date</label>
//                   <p className="text-slate-800 font-bold">
//                     {new Date(opportunity.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Column: Visual Progress */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm sticky top-28">
//               <h3 className="text-slate-800 font-black text-sm uppercase tracking-widest mb-6">Pipeline Health</h3>
              
//               <div className="space-y-6">
//                 <div>
//                   <div className="flex justify-between mb-2">
//                     <span className="text-xs font-bold text-slate-500 uppercase">Closing Confidence</span>
//                     <span className="text-xs font-bold text-indigo-600">{opportunity.probability}%</span>
//                   </div>
//                   <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
//                     <div 
//                       className="h-full bg-indigo-500 transition-all duration-1000" 
//                       style={{ width: `${opportunity.probability}%` }}
//                     />
//                   </div>
//                 </div>

//                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
//                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Forecasted Revenue</p>
//                   <p className="text-2xl font-black text-slate-800">
//                     ${((opportunity.value || 0) * (opportunity.probability / 100)).toLocaleString()}
//                   </p>
//                   <p className="text-[10px] text-slate-400 font-medium">Weighted based on probability</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OpportunityView;