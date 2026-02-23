"use client";

import React, { useState, useEffect, use } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  DollarSign, 
  Calendar, 
  Save, 
  X, 
  Loader2,
  AlertCircle // ✅ Added for error icons
} from "lucide-react"; 
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

const initialFormData = {
  opportunityName: "",
  accountName: "",
  value: "",
  stage: "",
  closeDate: "",
  probability: 50,
  leadSource: "",
  description: "",
};

const OpportunityDetailsForm = ({ params: paramsPromise }) => {
  const params = paramsPromise ? use(paramsPromise) : null;
  const id = params?.id;
  
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({}); // ✅ Track field-level errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);

  useEffect(() => {
    const loadData = async () => {
      if (id && id !== "undefined") {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`/api/opportunity/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const opportunityData = res.data?.success ? res.data.data : res.data;
          
          if (opportunityData) {
            setFormData({
              ...initialFormData,
              ...opportunityData,
              closeDate: opportunityData.closeDate ? opportunityData.closeDate.split('T')[0] : ""
            });
          }
        } catch (err) {
          toast.error("Could not find this opportunity.");
        } finally {
          setIsLoading(false);
        }
      } else {
        const stored = sessionStorage.getItem("opportunityCopyData");
        if (stored) {
          const lead = JSON.parse(stored);
          setFormData((prev) => ({
            ...prev,
            opportunityName: `${lead.firstName} ${lead.lastName}`,
            accountName: lead.organizationName || `${lead.firstName} ${lead.lastName}`,
            value: lead.annualRevenue || "",
            leadSource: lead.source || "",
          }));
          toast.info("Imported data from Lead");
        }
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  // ✅ Form Validation Logic
  const validateForm = () => {
    let newErrors = {};

    if (!formData.opportunityName.trim()) {
      newErrors.opportunityName = "Opportunity name is required";
    }
    if (!formData.accountName.trim()) {
      newErrors.accountName = "Account/Company name is required";
    }
    if (formData.value && Number(formData.value) < 0) {
      newErrors.value = "Value cannot be negative";
    }
    if (!formData.stage) {
      newErrors.stage = "Please select a sales stage";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));

    // ✅ Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // ✅ Run Validation
    if (!validateForm()) {
      return toast.error("Please fix the errors on the form");
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const decoded = jwtDecode(token);
      const roles = decoded?.roles || [];
      const isAdmin = decoded?.type === "company" || roles.includes("Admin") || roles.includes("CRM Admin");

      if (id) {
        await axios.put(`/api/opportunity/${id}`, formData, config);
        toast.success("Opportunity updated successfully");
      } else {
        await axios.post("/api/opportunity", formData, config);
        toast.success("New opportunity created");
        sessionStorage.removeItem("opportunityCopyData");
      }

      const basePath = isAdmin ? "/admin" : "/agent-dashboard";
      router.push(`${basePath}/opportunities`);
      router.refresh();
      
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving opportunity");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
        <p className="text-slate-500 mt-4 font-medium">Loading details...</p>
      </div>
    </div>
  );

  // ✅ Helper for dynamic styles
  const getInputClass = (fieldName) => {
    const base = "w-full p-3 border rounded-xl outline-none transition-all text-slate-700 ";
    const state = errors[fieldName] 
      ? "bg-red-50 border-red-300 focus:ring-4 focus:ring-red-100" 
      : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-50";
    return base + state;
  };

  const labelStyle = "text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider ml-1";

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20 font-sans">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 mb-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-extrabold text-slate-800">
            {id ? "Update Deal" : "New Opportunity"}
          </h1>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.back()} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={24} /></button>
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {id ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Opportunity Name */}
              <div className="md:col-span-2">
                <label className={labelStyle}>Opportunity Name *</label>
                <input 
                  name="opportunityName" 
                  value={formData.opportunityName} 
                  onChange={handleChange} 
                  placeholder="e.g. Q4 Software License" 
                  className={`${getInputClass("opportunityName")} text-lg font-bold`} 
                />
                {errors.opportunityName && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 ml-1 font-medium">
                    <AlertCircle size={14} /> {errors.opportunityName}
                  </p>
                )}
              </div>

              {/* Account Name */}
              <div>
                <label className={labelStyle}>Account Name *</label>
                <div className="relative">
                  <Briefcase className={`absolute left-4 top-3.5 ${errors.accountName ? 'text-red-300' : 'text-slate-300'}`} size={18} />
                  <input 
                    name="accountName" 
                    value={formData.accountName} 
                    onChange={handleChange} 
                    className={`${getInputClass("accountName")} pl-12`} 
                  />
                </div>
                {errors.accountName && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 ml-1 font-medium">
                    <AlertCircle size={14} /> {errors.accountName}
                  </p>
                )}
              </div>

              {/* Stage */}
              <div>
                <label className={labelStyle}>Sales Stage *</label>
                <select 
                  name="stage" 
                  value={formData.stage} 
                  onChange={handleChange} 
                  className={getInputClass("stage")}
                >
                  <option value="">Select Stage</option>
                  <option value="qualification">Qualification</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
                {errors.stage && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 ml-1 font-medium">
                    <AlertCircle size={14} /> {errors.stage}
                  </p>
                )}
              </div>

              {/* Value */}
              <div>
                <label className={labelStyle}>Expected Value ($)</label>
                <div className="relative">
                  <DollarSign className={`absolute left-4 top-3.5 ${errors.value ? 'text-red-300' : 'text-slate-300'}`} size={18} />
                  <input 
                    type="number" 
                    name="value" 
                    value={formData.value} 
                    onChange={handleChange} 
                    className={`${getInputClass("value")} pl-12`} 
                  />
                </div>
                {errors.value && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 ml-1 font-medium">
                    <AlertCircle size={14} /> {errors.value}
                  </p>
                )}
              </div>

              {/* Closing Date */}
              <div>
                <label className={labelStyle}>Closing Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-slate-300" size={18} />
                  <input 
                    type="date" 
                    name="closeDate" 
                    value={formData.closeDate} 
                    onChange={handleChange} 
                    className={`${getInputClass("closeDate")} pl-12`} 
                  />
                </div>
              </div>

              {/* Probability */}
              <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between mb-3">
                  <label className={labelStyle}>Win Probability</label>
                  <span className="text-sm font-bold text-blue-600">{formData.probability}%</span>
                </div>
                <input type="range" name="probability" value={formData.probability} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className={labelStyle}>Description & Notes</label>
                <textarea 
                  name="description" 
                  rows="4" 
                  value={formData.description} 
                  onChange={handleChange} 
                  className={getInputClass("description")} 
                  placeholder="Add any background info here..." 
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpportunityDetailsForm;



// "use client";

// import React, { useState, useEffect, use } from "react";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { 
//   Briefcase, 
//   DollarSign, 
//   Calendar, 
//   Target, 
//   Save, 
//   X, 
//   Loader2,
//   AlertCircle
// } from "lucide-react"; 
// import { toast } from "react-toastify";

// const initialFormData = {
//   opportunityName: "",
//   accountName: "",
//   value: "",
//   stage: "",
//   closeDate: "",
//   probability: 50,
//   leadSource: "",
//   description: "",
// };

// const OpportunityDetailsForm = ({ params: paramsPromise }) => {
//   // ✅ Next.js 15 Fix: Unwrap params promise
//   const params = paramsPromise ? use(paramsPromise) : null;
//   const id = params?.id;
  
//   const router = useRouter();
//   const [formData, setFormData] = useState(initialFormData);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isLoading, setIsLoading] = useState(!!id);

//   useEffect(() => {
//     const loadData = async () => {
//       // SCENARIO 1: Edit Mode
//       if (id && id !== "undefined") {
//         try {
//           const token = localStorage.getItem("token");
//           const res = await axios.get(`/api/opportunity/${id}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });

//           // Check if data is nested under .data or .data.data
//           const opportunityData = res.data?.success ? res.data.data : res.data;
          
//           if (opportunityData) {
//             setFormData({
//               ...initialFormData,
//               ...opportunityData,
//               // Format date for the HTML5 input (YYYY-MM-DD)
//               closeDate: opportunityData.closeDate ? opportunityData.closeDate.split('T')[0] : ""
//             });
//           }
//         } catch (err) {
//           console.error("Fetch Error:", err);
//           toast.error("Could not find this opportunity.");
//         } finally {
//           setIsLoading(false);
//         }
//       } 
//       // SCENARIO 2: Create Mode (Check Lead Copy)
//       else {
//         const stored = sessionStorage.getItem("opportunityCopyData");
//         if (stored) {
//           const lead = JSON.parse(stored);
//           setFormData((prev) => ({
//             ...prev,
//             opportunityName: `${lead.firstName} ${lead.lastName}`,
//             accountName: lead.organizationName || `${lead.firstName} ${lead.lastName}`,
//             value: lead.annualRevenue || "",
//             leadSource: lead.source || "",
//           }));
//           toast.info("Imported data from Lead");
//         }
//         setIsLoading(false);
//       }
//     };

//     loadData();
//   }, [id]);

//   const handleChange = (e) => {
//     const { name, value, type } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "number" ? Number(value) : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.opportunityName || !formData.accountName) {
//       return toast.error("Please fill in required fields");
//     }

//     setIsSubmitting(true);
//     try {
//       const token = localStorage.getItem("token");
//       const config = { headers: { Authorization: `Bearer ${token}` } };
      
//       if (id) {
//         await axios.put(`/api/opportunity/${id}`, formData, config);
//         toast.success("Opportunity updated successfully");
//       } else {
//         await axios.post("/api/opportunity", formData, config);
//         toast.success("New opportunity created");
//         sessionStorage.removeItem("opportunityCopyData");
//       }
//       router.push("/admin/opportunity");
//       router.refresh();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Error saving opportunity");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) return (
//     <div className="flex h-screen items-center justify-center bg-white">
//       <div className="text-center">
//         <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
//         <p className="text-slate-500 mt-4 font-medium">Loading details...</p>
//       </div>
//     </div>
//   );

//   const inputStyle = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all text-slate-700";
//   const labelStyle = "text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider ml-1";

//   return (
//     <div className="bg-[#f8fafc] min-h-screen pb-20">
//       <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 mb-8">
//         <div className="max-w-4xl mx-auto flex justify-between items-center">
//           <h1 className="text-xl font-extrabold text-slate-800">
//             {id ? "Update Deal" : "New Opportunity"}
//           </h1>
//           <div className="flex gap-2">
//             <button onClick={() => router.back()} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={24} /></button>
//             <button 
//               onClick={handleSubmit} 
//               disabled={isSubmitting}
//               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
//             >
//               {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
//               {id ? "Update Deal" : "Save Deal"}
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-4xl mx-auto px-4">
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
//               <div className="md:col-span-2">
//                 <label className={labelStyle}>Opportunity Name *</label>
//                 <input name="opportunityName" value={formData.opportunityName} onChange={handleChange} placeholder="e.g. Q4 Software License" className={`${inputStyle} text-lg font-bold`} />
//               </div>

//               <div>
//                 <label className={labelStyle}>Account Name *</label>
//                 <div className="relative">
//                   <Briefcase className="absolute left-4 top-3.5 text-slate-300" size={18} />
//                   <input name="accountName" value={formData.accountName} onChange={handleChange} className={`${inputStyle} pl-12`} />
//                 </div>
//               </div>

//               <div>
//                 <label className={labelStyle}>Sales Stage</label>
//                 <select name="stage" value={formData.stage} onChange={handleChange} className={inputStyle}>
//                   <option value="">Select Stage</option>
//                   <option value="qualification">Qualification</option>
//                   <option value="proposal">Proposal</option>
//                   <option value="negotiation">Negotiation</option>
//                   <option value="closed_won">Closed Won</option>
//                   <option value="closed_lost">Closed Lost</option>
//                 </select>
//               </div>

//               <div>
//                 <label className={labelStyle}>Expected Value ($)</label>
//                 <div className="relative">
//                   <DollarSign className="absolute left-4 top-3.5 text-slate-300" size={18} />
//                   <input type="number" name="value" value={formData.value} onChange={handleChange} className={`${inputStyle} pl-12`} />
//                 </div>
//               </div>

//               <div>
//                 <label className={labelStyle}>Closing Date</label>
//                 <div className="relative">
//                   <Calendar className="absolute left-4 top-3.5 text-slate-300" size={18} />
//                   <input type="date" name="closeDate" value={formData.closeDate} onChange={handleChange} className={`${inputStyle} pl-12`} />
//                 </div>
//               </div>

//               <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
//                 <div className="flex justify-between mb-3">
//                   <label className={labelStyle}>Win Probability</label>
//                   <span className="text-sm font-bold text-blue-600">{formData.probability}%</span>
//                 </div>
//                 <input type="range" name="probability" value={formData.probability} onChange={handleChange} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
//               </div>

//               <div className="md:col-span-2">
//                 <label className={labelStyle}>Description & Notes</label>
//                 <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className={inputStyle} placeholder="Add any background info here..." />
//               </div>
//             </div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default OpportunityDetailsForm;