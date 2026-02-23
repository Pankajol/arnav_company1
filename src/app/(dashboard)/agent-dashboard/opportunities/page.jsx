"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaDollarSign,
  FaChartLine,
} from "react-icons/fa";

import ActionMenu from "@/components/ActionMenu";

export default function OpportunityListPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/opportunity?limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setOpportunities(res.data.data);
      } else {
        toast.warning("Unexpected response while fetching opportunities");
      }
    } catch (err) {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const filteredOpportunities = useMemo(() => {
    if (!search.trim()) return opportunities;
    const q = search.toLowerCase();
    return opportunities.filter((o) =>
      (o.opportunityName || "").toLowerCase().includes(q) ||
      (o.accountName || "").toLowerCase().includes(q) ||
      String(o.value || "").includes(q)
    );
  }, [search, opportunities]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`/api/opportunity/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success("Opportunity removed");
        setOpportunities((prev) => prev.filter((o) => o._id !== id));
      }
    } catch {
      toast.error("Deletion failed");
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Opportunities Pipeline
            </h1>
            <p className="text-slate-500 font-medium">Manage deals and track sales progress</p>
          </div>
          <Link href="/agent-dashboard/OpportunityDetailsForm">
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95">
              <FaPlus size={14} /> New Opportunity
            </button>
          </Link>
        </div>

        {/* Filters & Stats Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <FaSearch className="absolute top-3.5 left-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or account..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm">
              <FaChartLine /> {filteredOpportunities.length} Active Deals
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium tracking-wide">Analysing Pipeline...</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100">
              <OpportunityTable
                data={filteredOpportunities}
                onDelete={handleDelete}
              />
            </div>

            <div className="md:hidden space-y-4">
              {filteredOpportunities.map((opp, index) => (
                <OpportunityCard
                  key={opp._id}
                  data={opp}
                  idx={index}
                  onDelete={handleDelete}
                />
              ))}
              {!filteredOpportunities.length && (
                <div className="bg-white p-10 rounded-2xl text-center border-2 border-dashed border-slate-200 text-slate-400">
                   No matching opportunities found.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= Badge Component ================= */
const StageBadge = ({ stage }) => {
  const themes = {
    Qualification: "bg-blue-50 text-blue-700 border-blue-100",
    Proposal: "bg-purple-50 text-purple-700 border-purple-100",
    Negotiation: "bg-amber-50 text-amber-700 border-amber-100",
    "Closed Won": "bg-emerald-50 text-emerald-700 border-emerald-100",
    "Closed Lost": "bg-rose-50 text-rose-700 border-rose-100",
    default: "bg-slate-50 text-slate-600 border-slate-100",
  };
  const theme = themes[stage] || themes.default;
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${theme}`}>
      {stage || "New"}
    </span>
  );
};

/* ================= Progress Bar ================= */
const ProbabilityBar = ({ value }) => (
  <div className="w-24">
    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
      <span>PROBABILITY</span>
      <span>{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className="h-full bg-indigo-500 transition-all duration-500" 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

/* ================= Desktop Table ================= */
function OpportunityTable({ data, onDelete }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/50 border-b border-slate-100">
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Deal Details</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Value</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Stage</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Success Rate</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {data.map((o) => (
          <tr key={o._id} className="hover:bg-indigo-50/30 transition-colors group">
            <td className="px-6 py-4">
              <div>
                <p className="font-bold text-slate-800">{o.opportunityName}</p>
                <p className="text-xs text-slate-400 font-medium">{o.accountName || "Private Account"}</p>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center text-slate-700 font-bold">
                <FaDollarSign size={12} className="text-slate-400 mr-1" />
                {o.value?.toLocaleString() || "0.00"}
              </div>
            </td>
            <td className="px-6 py-4">
              <StageBadge stage={o.stage} />
            </td>
            <td className="px-6 py-4">
              <ProbabilityBar value={o.probability || 0} />
            </td>
            <td className="px-6 py-4 text-right">
              <OpportunityActions data={o} onDelete={onDelete} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================= Mobile Card ================= */
function OpportunityCard({ data, onDelete }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <FaDollarSign size={20} />
        </div>
        <OpportunityActions data={data} onDelete={onDelete} />
      </div>
      
      <div>
        <h3 className="font-bold text-slate-900 text-lg">{data.opportunityName}</h3>
        <p className="text-sm text-slate-500 font-medium">{data.accountName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Stage</p>
          <StageBadge stage={data.stage} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Deal Value</p>
          <p className="text-sm font-bold text-slate-800">${data.value?.toLocaleString()}</p>
        </div>
      </div>
      
      <ProbabilityBar value={data.probability || 0} />
    </div>
  );
}

/* ================= Action Menu ================= */
function OpportunityActions({ data, onDelete }) {
  const router = useRouter();
  const actions = [
    {
      icon: <FaEye />,
      label: "View Details",
      onClick: () => router.push(`/agent-dashboard/opportunities/${data._id}`),
    },
    {
      icon: <FaEdit />,
      label: "Edit Deal",
      onClick: () => router.push(`/agent-dashboard/OpportunityDetailsForm/${data._id}`),
    },
    {
      icon: <FaTrash />,
      color: "text-rose-600",
      label: "Delete",
      onClick: () => onDelete(data._id),
    },
  ];

  return <ActionMenu actions={actions} />;
}



// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";
// import axios from "axios";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { toast } from "react-toastify";

// import {
//   FaEye,
//   FaEdit,
//   FaTrash,
//   FaSearch,
// } from "react-icons/fa";

// import ActionMenu from "@/components/ActionMenu";

// export default function OpportunityListPage() {
//   const [opportunities, setOpportunities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const router = useRouter();

//   /* -----------------------------------------------------
//      FETCH OPPORTUNITIES
//   ----------------------------------------------------- */
//   const fetchOpportunities = useCallback(async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");

//       const res = await axios.get("/api/opportunity?limit=500", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.data?.success) {
//         setOpportunities(res.data.data);
//       } else {
//         toast.warning("Unexpected response while fetching opportunities");
//       }
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to load opportunities");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchOpportunities();
//   }, [fetchOpportunities]);

//   /* -----------------------------------------------------
//      SEARCH FILTER
//   ----------------------------------------------------- */
//   const filteredOpportunities = useMemo(() => {
//     if (!search.trim()) return opportunities;
//     const q = search.toLowerCase();

//     return opportunities.filter((o) =>
//       (o.opportunityName || "").toLowerCase().includes(q) ||
//       (o.accountName || "").toLowerCase().includes(q) ||
//       String(o.value || "").includes(q)
//     );
//   }, [search, opportunities]);

//   /* -----------------------------------------------------
//      DELETE OPPORTUNITY
//   ----------------------------------------------------- */
//   const handleDelete = async (id) => {
//     if (!confirm("Delete this opportunity?")) return;

//     try {
//       const token = localStorage.getItem("token");

//       const res = await axios.delete(`/api/opportunity/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.data.success) {
//         toast.success("Opportunity deleted");
//         setOpportunities((prev) => prev.filter((o) => o._id !== id));
//       } else {
//         toast.error(res.data.error || "Failed to delete");
//       }
//     } catch {
//       toast.error("Deletion failed");
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-6">

//       <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-blue-700">
//         All Opportunities
//       </h1>

//       {/* Toolbar */}
//       <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-6">

//         {/* Search Box */}
//         <div className="relative flex-1 max-w-md">
//           <FaSearch className="absolute top-3 left-3 text-gray-400" />
//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search opportunities…"
//             className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
//           />
//         </div>

//         {/* Add New Opportunity */}
//         <Link href="/admin/OpportunityDetailsForm">
//           <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 shadow">
//             <FaEdit /> New Opportunity
//           </button>
//         </Link>
//       </div>

//       {/* Table / Cards */}
//       {loading ? (
//         <p className="text-center text-gray-500">Loading…</p>
//       ) : (
//         <>
//           <div className="hidden md:block overflow-x-auto">
//             <OpportunityTable
//               data={filteredOpportunities}
//               onDelete={handleDelete}
//             />
//           </div>

//           {/* Mobile Cards */}
//           <div className="md:hidden space-y-4">
//             {filteredOpportunities.map((opp, index) => (
//               <OpportunityCard
//                 key={opp._id}
//                 data={opp}
//                 idx={index}
//                 onDelete={handleDelete}
//               />
//             ))}

//             {!filteredOpportunities.length && (
//               <p className="text-center text-gray-500">No matching opportunities</p>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// /* ==========================================================
//    DESKTOP TABLE VIEW
// ========================================================== */
// function OpportunityTable({ data, onDelete }) {
//   return (
//     <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
//       <thead className="bg-gray-100 text-sm">
//         <tr>
//           {["#", "Opportunity Name", "Account", "Value", "Stage", "Probability", ""].map(
//             (h) => (
//               <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">
//                 {h}
//               </th>
//             )
//           )}
//         </tr>
//       </thead>

//       <tbody>
//         {data.map((o, i) => (
//           <tr key={o._id} className="border-b hover:bg-gray-50">
//             <td className="px-4 py-3">{i + 1}</td>
//             <td className="px-4 py-3 font-medium">{o.opportunityName}</td>
//             <td className="px-4 py-3">{o.accountName}</td>
//             <td className="px-4 py-3">${o.value?.toLocaleString()}</td>
//             <td className="px-4 py-3 capitalize">{o.stage}</td>
//             <td className="px-4 py-3">{o.probability}%</td>
//             <td className="px-4 py-3">
//               <OpportunityActions data={o} onDelete={onDelete} />
//             </td>
//           </tr>
//         ))}

//         {!data.length && (
//           <tr>
//             <td colSpan={7} className="text-center py-6 text-gray-500">
//               No opportunities found.
//             </td>
//           </tr>
//         )}
//       </tbody>
//     </table>
//   );
// }

// /* ==========================================================
//    MOBILE CARD VIEW
// ========================================================== */
// function OpportunityCard({ data, idx, onDelete }) {
//   return (
//     <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
//       <div className="flex justify-between">
//         <div className="font-semibold text-gray-700">
//           #{idx + 1} • {data.opportunityName}
//         </div>
//         <OpportunityActions data={data} onDelete={onDelete} isMobile />
//       </div>

//       <p className="text-sm text-gray-500">Account: {data.accountName}</p>
//       <p className="text-sm text-gray-500">Value: ${data.value?.toLocaleString()}</p>
//       <p className="text-sm text-gray-500">Stage: {data.stage}</p>
//       <p className="text-sm text-gray-500">Probability: {data.probability}%</p>
//     </div>
//   );
// }

// /* ==========================================================
//    ACTION MENU (VIEW / EDIT / DELETE)
// ========================================================== */
// function OpportunityActions({ data, onDelete }) {
//   const router = useRouter();

//   const actions = [
//     {
//       icon: <FaEye />,
//       label: "View",
//       onClick: () => router.push(`/opportunity/${data._id}`),
//     },
//     {
//       icon: <FaEdit />,
//       label: "Edit",
//       onClick: () => router.push(`/opportunity/edit/${data._id}`),
//     },
//     {
//       icon: <FaTrash />,
//       label: "Delete",
//       color: "text-red-600",
//       onClick: () => onDelete(data._id),
//     },
//   ];

//   return <ActionMenu actions={actions} />;
// }
