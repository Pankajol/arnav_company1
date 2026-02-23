"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaPlus,
  FaCopy,
  FaFilter,
} from "react-icons/fa";
import ActionMenu from "@/components/ActionMenu";

export default function LeadsListPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleCopyToOpportunity = (lead) => {
    if (!lead) return;
    const dataToStore = { ...lead, leadId: lead._id };
    sessionStorage.setItem("opportunityCopyData", JSON.stringify(dataToStore));
    router.push("/agent-dashboard/OpportunityDetailsForm");
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized! Please log in.");
        return;
      }
      const res = await axios.get("/api/lead", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) setLeads(res.data);
    } catch (error) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const displayLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.mobileNo || "").toLowerCase().includes(q)
    );
  }, [leads, search]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/lead/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads((prev) => prev.filter((l) => l._id !== id));
      toast.success("Lead removed successfully");
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Lead Management
            </h1>
            <p className="text-slate-500">Track and manage your incoming pipeline</p>
          </div>
          <Link href="/agent-dashboard/LeadDetailsFormMaster">
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">
              <FaPlus size={14} /> New Lead
            </button>
          </Link>
        </div>

        {/* Search & Stats Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <FaSearch className="absolute top-3.5 left-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{displayLeads.length} Leads Total</span>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-500 font-medium">Loading leads...</p>
          </div>
        ) : displayLeads.length > 0 ? (
          <>
            <div className="hidden md:block overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100">
              <Table leads={displayLeads} onDelete={handleDelete} onCopy={handleCopyToOpportunity} />
            </div>
            <div className="md:hidden space-y-4">
              {displayLeads.map((lead, i) => (
                <Card key={lead._id} lead={lead} idx={i} onDelete={handleDelete} onCopy={handleCopyToOpportunity} />
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <FaSearch className="text-slate-300 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No leads found</h3>
            <p className="text-slate-400">Try adjusting your search or add a new lead.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Status Badge Logic ================= */
const StatusBadge = ({ status }) => {
  const styles = {
    Lead: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Open: "bg-blue-50 text-blue-700 border-blue-100",
    Interested: "bg-amber-50 text-amber-700 border-amber-100",
    default: "bg-slate-50 text-slate-600 border-slate-100",
  };
  const style = styles[status] || styles.default;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${style}`}>
      {status || "New"}
    </span>
  );
};

/* ================= Desktop Table ================= */
function Table({ leads, onDelete, onCopy }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/50 border-b border-slate-100">
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Contact</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {leads.map((l) => (
          <tr key={l._id} className="hover:bg-blue-50/30 transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-bold text-slate-500">
                  {l.firstName[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{l.firstName} {l.lastName}</p>
                  <p className="text-xs text-slate-400">{l.organizationName || "No Company"}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <p className="text-sm text-slate-600 font-medium">{l.email || "-"}</p>
              <p className="text-xs text-slate-400">{l.mobileNo || "-"}</p>
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={l.status} />
            </td>
            <td className="px-6 py-4 text-right">
              <RowMenu lead={l} onDelete={onDelete} onCopy={onCopy} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================= Mobile Card ================= */
function Card({ lead, onDelete, onCopy }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
            {lead.firstName[0]}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{lead.firstName} {lead.lastName}</h3>
            <p className="text-xs text-slate-500">{lead.organizationName || "Individual"}</p>
          </div>
        </div>
        <RowMenu lead={lead} onDelete={onDelete} onCopy={onCopy} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status</p>
          <StatusBadge status={lead.status} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Phone</p>
          <p className="text-sm font-medium text-slate-700">{lead.mobileNo || "N/A"}</p>
        </div>
      </div>
    </div>
  );
}

/* ================= Dropdown Menu ================= */
function RowMenu({ lead, onDelete, onCopy }) {
  const router = useRouter();
  const actions = [
    {
      icon: <FaEye />,
      label: "View Profile",
      onClick: () => router.push(`/agent-dashboard/leads-view/${lead._id}`),
    },
    {
      icon: <FaEdit />,
      label: "Edit Lead",
      onClick: () => router.push(`/agent-dashboard/LeadDetailsFormMaster/${lead._id}`),
    },
    {
      icon: <FaCopy />,
      label: "Convert to Opportunity",
      onClick: () => onCopy(lead),
    },
    {
      icon: <FaTrash />,
      color: "text-red-600",
      label: "Delete",
      onClick: () => onDelete(lead._id),
    },
  ];

  return <ActionMenu actions={actions} />;
}




// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";
// import Link from "next/link";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { toast } from "react-toastify";
// import {
//   FaEdit,
//   FaTrash,
//   FaEye,
//   FaSearch,
// } from "react-icons/fa";
// import ActionMenu from "@/components/ActionMenu";

// export default function LeadsListPage() {
//   const [leads, setLeads] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");

//   const router = useRouter();

//   // ✅ Copy Lead to Opportunity (sessionStorage)
//   const handleCopyToOpportunity = (lead) => {
//     if (!lead || typeof lead !== "object") {
//       console.error("Invalid lead:", lead);
//       return;
//     }

//     const dataToStore = {
//       ...lead,
//       leadId: lead._id,
//     };

//     sessionStorage.setItem(
//       "opportunityCopyData",
//       JSON.stringify(dataToStore)
//     );

//     // redirect to Opportunity NEW form
//     router.push("/admin/OpportunityDetailsForm");
//   };

//   // ✅ Fetch Leads
//   const fetchLeads = useCallback(async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         toast.error("Unauthorized! Please log in.");
//         return;
//       }

//       const res = await axios.get("/api/lead", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (Array.isArray(res.data)) {
//         setLeads(res.data);
//       } else {
//         toast.warning("Unexpected response while fetching leads");
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to fetch leads");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchLeads();
//   }, [fetchLeads]);

//   // ✅ Search filter
//   const displayLeads = useMemo(() => {
//     if (!search.trim()) return leads;
//     const q = search.toLowerCase();
//     return leads.filter(
//       (l) =>
//         (l.firstName + " " + l.lastName).toLowerCase().includes(q) ||
//         (l.email || "").toLowerCase().includes(q) ||
//         (l.mobileNo || "").toLowerCase().includes(q)
//     );
//   }, [leads, search]);

//   // ✅ Delete Lead
//   const handleDelete = async (id) => {
//     if (!confirm("Delete this lead?")) return;
//     try {
//       const token = localStorage.getItem("token");
//       await axios.delete(`/api/lead/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setLeads((prev) => prev.filter((l) => l._id !== id));
//       toast.success("Lead deleted successfully");
//     } catch {
//       toast.error("Failed to delete lead");
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-6">
//       <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-orange-600">
//         All Leads
//       </h1>

//       {/* Toolbar */}
//       <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-6">
//         <div className="relative flex-1 max-w-md">
//           <FaSearch className="absolute top-3 left-3 text-gray-400" />
//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search leads…"
//             className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
//           />
//         </div>

//         <Link href="/admin/LeadDetailsFormMaster" className="sm:w-auto">
//           <button className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 shadow">
//             <FaEdit /> New Lead
//           </button>
//         </Link>
//       </div>

//       {/* Table / Cards */}
//       {loading ? (
//         <p className="text-center text-gray-500">Loading…</p>
//       ) : (
//         <>
//           {/* Desktop Table */}
//           <div className="hidden md:block overflow-x-auto">
//             <Table
//               leads={displayLeads}
//               onDelete={handleDelete}
//               onCopy={handleCopyToOpportunity}
//             />
//           </div>

//           {/* Mobile Cards */}
//           <div className="md:hidden space-y-4">
//             {displayLeads.map((lead, i) => (
//               <Card
//                 key={lead._id}
//                 lead={lead}
//                 idx={i}
//                 onDelete={handleDelete}
//                 onCopy={handleCopyToOpportunity}
//               />
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// /* ================= Desktop Table ================= */
// function Table({ leads, onDelete, onCopy }) {
//   return (
//     <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
//       <thead className="bg-gray-100 text-sm">
//         <tr>
//           {["#", "Name", "Email", "Mobile No", "Status", ""].map((h) => (
//             <th
//               key={h}
//               className="px-4 py-3 text-left font-semibold text-gray-700"
//             >
//               {h}
//             </th>
//           ))}
//         </tr>
//       </thead>
//       <tbody>
//         {leads.map((l, i) => (
//           <tr key={l._id} className="border-b hover:bg-gray-50">
//             <td className="px-4 py-3">{i + 1}</td>
//             <td className="px-4 py-3">{l.firstName} {l.lastName}</td>
//             <td className="px-4 py-3">{l.email || "-"}</td>
//             <td className="px-4 py-3">{l.mobileNo || "-"}</td>
//             <td className="px-4 py-3">{l.status || "-"}</td>
//             <td className="px-4 py-3">
//               <RowMenu lead={l} onDelete={onDelete} onCopy={onCopy} />
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

// /* ================= Mobile Card ================= */
// function Card({ lead, idx, onDelete, onCopy }) {
//   return (
//     <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
//       <div className="flex justify-between">
//         <div className="font-semibold text-gray-700">
//           #{idx + 1} • {lead.firstName} {lead.lastName}
//         </div>
//         <RowMenu lead={lead} onDelete={onDelete} onCopy={onCopy} />
//       </div>
//       <p className="text-sm text-gray-500">Email: {lead.email || "-"}</p>
//       <p className="text-sm text-gray-500">Mobile: {lead.mobileNo || "-"}</p>
//       <p className="text-sm text-gray-500">Status: {lead.status || "-"}</p>
//     </div>
//   );
// }

// /* ================= Dropdown Menu ================= */
// function RowMenu({ lead, onDelete, onCopy }) {
//   const router = useRouter();

//   const actions = [
//     {
//       icon: <FaEye />,
//       label: "View",
//       onClick: () => router.push(`/admin/leads-view/${lead._id}`),
//     },
//     {
//       icon: <FaEdit />,
//       label: "Edit",
//       onClick: () => router.push(`/admin/LeadDetailsFormMaster/${lead._id}`),
//     },
//     {
//       icon: <FaEdit />,
//       label: "Copy Lead to Opportunity",
//       onClick: () => onCopy(lead),
//     },
//     {
//       icon: <FaTrash />,
//       color: "text-red-600",
//       label: "Delete",
//       onClick: () => onDelete(lead._id),
//     },
//   ];

//   return <ActionMenu actions={actions} />;
// }
