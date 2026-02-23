"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { 
  User, 
  Building2, 
  MapPin, 
  PlusCircle, 
  Save, 
  X,
  ChevronUp,
  Loader2,
  AlertCircle,
  Mail,
  Phone
} from "lucide-react"; 
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

const LeadDetailsForm = ({ leadId }) => {
  const router = useRouter();
  
  const [openSections, setOpenSections] = useState({
    business: false,
    address: false,
  });

  const initialFormState = {
    firstName: "", 
    lastName: "", 
    email: "", 
    mobileNo: "",
    status: "Lead", 
    salutation: "", 
    jobTitle: "", 
    organizationName: "", 
    industry: "", 
    city: "", 
    state: ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!leadId);

  // 1. Fetch Lead Data (Edit Mode)
  useEffect(() => {
    if (leadId && leadId !== "undefined") {
      const fetchLead = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`/api/lead/${leadId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const data = res.data;
          setFormData(data);
          
          // Automatically open sections if they contain data
          setOpenSections({
            business: !!(data.organizationName || data.jobTitle || data.industry),
            address: !!(data.city || data.state)
          });
        } catch (err) {
          toast.error("Failed to load lead details");
        } finally {
          setIsLoading(false);
        }
      };
      fetchLead();
    } else {
      setIsLoading(false);
    }
  }, [leadId]);

  // 2. Validation Logic
  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = "Invalid email format.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 3. Handlers
  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return toast.error("Please fix the errors on the form.");

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
      
      const decoded = jwtDecode(token);
      const roles = decoded?.roles || [];
      const isAdmin = decoded?.type === "company" || roles.includes("Admin") || roles.includes("CRM Admin");

      if (leadId && leadId !== "undefined") {
        await axios.put(`/api/lead/${leadId}`, formData, config);
        toast.success("Lead updated successfully");
      } else {
        await axios.post("/api/lead", formData, config);
        toast.success("Lead created successfully");
      }
      
      const basePath = isAdmin ? "/admin" : "/agent-dashboard";
      router.push(`${basePath}/leads-view`); 
      router.refresh(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Dynamic Styling Helper
  const getInputStyle = (fieldName) => {
    const base = "w-full p-3 border rounded-xl outline-none transition-all text-sm font-medium ";
    const state = errors[fieldName] 
      ? "bg-red-50 border-red-300 focus:ring-red-100 text-red-900 placeholder:text-red-300" 
      : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-blue-500/20 text-slate-700";
    return base + state;
  };

  const labelStyle = "text-[10px] font-black text-gray-400 mb-1 block tracking-widest uppercase ml-1";

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#f4f7fe]">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="bg-[#f4f7fe] min-h-screen pb-20 font-sans">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 mb-6">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            {leadId ? "Edit Lead Profile" : "Initialize New Lead"}
          </h1>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.back()} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-bold shadow-lg shadow-blue-100 disabled:opacity-50 transition-all active:scale-95 text-xs uppercase"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {leadId ? "Update" : "Establish"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ESSENTIALS SECTION */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={18} /></div>
              <h2 className="font-black uppercase text-[11px] tracking-widest text-slate-400">Core Identity</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelStyle}>First Name *</label>
                <input 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  className={`${getInputStyle("firstName")} text-lg font-bold`} 
                  placeholder="e.g. John"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-[10px] mt-1.5 flex items-center gap-1 font-bold">
                    <AlertCircle size={12}/> {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className={labelStyle}>Last Name</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange} className={getInputStyle("lastName")} />
              </div>

              <div>
                <label className={labelStyle}>Lead Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={getInputStyle("status")}>
                  <option value="Lead">Lead</option>
                  <option value="Interested">Interested</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div className="relative">
                <label className={labelStyle}>Email Address</label>
                <Mail className="absolute left-3 bottom-3.5 text-slate-300" size={16} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${getInputStyle("email")} pl-10`} placeholder="john@company.com" />
                {errors.email && (
                  <p className="text-red-500 text-[10px] mt-1.5 flex items-center gap-1 font-bold">
                    <AlertCircle size={12}/> {errors.email}
                  </p>
                )}
              </div>

              <div className="relative">
                <label className={labelStyle}>Mobile Connection</label>
                <Phone className="absolute left-3 bottom-3.5 text-slate-300" size={16} />
                <input type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className={`${getInputStyle("mobileNo")} pl-10`} placeholder="+1 234..." />
              </div>
            </div>
          </div>

          {/* BUSINESS CONTEXT SECTION */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection('business')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${openSections.business ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Building2 size={20} /></div>
                <div>
                  <h3 className="font-bold text-slate-700 text-sm">Professional Context</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Company & Industry</p>
                </div>
              </div>
              <ChevronUp className={`text-slate-300 transition-transform ${!openSections.business && 'rotate-180'}`} />
            </button>
            
            {openSections.business && (
              <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                <div className="md:col-span-2">
                  <label className={labelStyle}>Organization</label>
                  <input name="organizationName" value={formData.organizationName} onChange={handleChange} className={getInputStyle("organizationName")} />
                </div>
                <div>
                  <label className={labelStyle}>Industry Verticle</label>
                  <input name="industry" value={formData.industry} onChange={handleChange} className={getInputStyle("industry")} />
                </div>
                <div>
                  <label className={labelStyle}>Official Title</label>
                  <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className={getInputStyle("jobTitle")} />
                </div>
              </div>
            )}
          </div>

          {/* GEOGRAPHIC INFO SECTION */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection('address')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${openSections.address ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><MapPin size={20} /></div>
                <div>
                  <h3 className="font-bold text-slate-700 text-sm">Geographic Info</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">City & State</p>
                </div>
              </div>
              <ChevronUp className={`text-slate-300 transition-transform ${!openSections.address && 'rotate-180'}`} />
            </button>
            
            {openSections.address && (
              <div className="px-8 pb-8 pt-2 grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <label className={labelStyle}>City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className={getInputStyle("city")} />
                </div>
                <div>
                  <label className={labelStyle}>State</label>
                  <input name="state" value={formData.state} onChange={handleChange} className={getInputStyle("state")} />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadDetailsForm;




// "use client";

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { 
//   User, 
//   Building2, 
//   MapPin, 
//   PlusCircle, 
//   Save, 
//   X,
//   ChevronUp,
//   Loader2
// } from "lucide-react"; 
// import { toast } from "react-toastify";
// import { jwtDecode } from "jwt-decode"; // ✅ Added for role checking

// const LeadDetailsForm = ({ leadId }) => {
//   const router = useRouter();
  
//   const [openSections, setOpenSections] = useState({
//     business: false,
//     address: false,
//   });

//   const initialFormState = {
//     firstName: "", lastName: "", email: "", mobileNo: "",
//     status: "Lead", salutation: "", jobTitle: "", 
//     organizationName: "", industry: "", city: "", 
//     state: "", customFields: {}
//   };

//   const [formData, setFormData] = useState(initialFormState);
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isLoading, setIsLoading] = useState(!!leadId);

//   useEffect(() => {
//     if (leadId && leadId !== "undefined") {
//       const fetchLead = async () => {
//         try {
//           const token = localStorage.getItem("token");
//           const res = await axios.get(`/api/lead/${leadId}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
          
//           const data = res.data;
//           setFormData(data);
          
//           setOpenSections({
//             business: !!(data.organizationName || data.jobTitle || data.industry),
//             address: !!(data.city || data.state)
//           });
//         } catch (err) {
//           toast.error("Failed to load lead details");
//         } finally {
//           setIsLoading(false);
//         }
//       };
//       fetchLead();
//     } else {
//       setIsLoading(false);
//     }
//   }, [leadId]);

//   const toggleSection = (section) => {
//     setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
//   };

//   const validate = () => {
//     const newErrors = {};
//     if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     if (e) e.preventDefault();
//     if (!validate()) return;

//     setIsSubmitting(true);
//     try {
//       const token = localStorage.getItem("token");
//       const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
      
//       // 1. Decode token to find destination route
//       const decoded = jwtDecode(token);
//       const roles = decoded?.roles || [];
//       const isAdmin = decoded?.type === "company" || roles.includes("Admin") || roles.includes("CRM Admin");

//       // 2. Perform API Call
//       if (leadId && leadId !== "undefined") {
//         await axios.put(`/api/lead/${leadId}`, formData, config);
//         toast.success("Lead updated successfully");
//       } else {
//         await axios.post("/api/lead", formData, config);
//         toast.success("Lead created successfully");
//       }
      
//       // 3. ✅ CORRECTED DYNAMIC ROUTE
//       const basePath = isAdmin ? "/admin" : "/agent-dashboard";
//       router.push(`${basePath}/leads-view`); // Matches your sidebar link
      
//       router.refresh(); 
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Error saving lead");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-[#f4f7fe]">
//         <Loader2 className="animate-spin text-blue-600" size={40} />
//       </div>
//     );
//   }

//   const cardStyle = "bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden transition-all";
//   const inputStyle = "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium";
//   const labelStyle = "text-[10px] font-black text-gray-400 mb-1 block tracking-widest uppercase ml-1";

//   return (
//     <div className="bg-[#f4f7fe] min-h-screen pb-20 font-sans">
//       <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 mb-6">
//         <div className="max-w-3xl mx-auto flex justify-between items-center">
//           <h1 className="text-xl font-black text-slate-800 tracking-tight">
//             {leadId ? "Edit Lead" : "Add New Lead"}
//           </h1>
//           <div className="flex gap-2">
//             <button type="button" onClick={() => router.back()} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
//               <X size={24} />
//             </button>
//             <button 
//               type="button"
//               onClick={handleSubmit}
//               disabled={isSubmitting}
//               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-bold shadow-lg shadow-blue-100 disabled:opacity-50 transition-all active:scale-95 text-xs"
//             >
//               {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
//               {leadId ? "UPDATE" : "SAVE"}
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-3xl mx-auto px-4">
//         <form onSubmit={handleSubmit} className="space-y-4">
          
//           {/* PERSONAL INFO */}
//           <div className={cardStyle}>
//             <div className="p-8">
//               <div className="flex items-center gap-2 mb-8">
//                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={18} /></div>
//                 <h2 className="font-black uppercase text-[11px] tracking-widest text-slate-400">Core Identity</h2>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="md:col-span-2">
//                   <label className={labelStyle}>First Name *</label>
//                   <input name="firstName" value={formData.firstName} onChange={handleChange} className={`${inputStyle} text-lg font-bold`} />
//                   {errors.firstName && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.firstName}</p>}
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Last Name</label>
//                   <input name="lastName" value={formData.lastName} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Relationship Status</label>
//                   <select name="status" value={formData.status} onChange={handleChange} className={inputStyle}>
//                     <option value="Lead">Lead</option>
//                     <option value="Interested">Interested</option>
//                     <option value="Converted">Converted</option>
//                     <option value="Lost">Lost</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Email Address</label>
//                   <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Mobile Connection</label>
//                   <input type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className={inputStyle} />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* BUSINESS SECTION */}
//           <div className={cardStyle}>
//             <button type="button" onClick={() => toggleSection('business')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50">
//               <div className="flex items-center gap-4">
//                 <div className={`p-2 rounded-xl ${openSections.business ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Building2 size={20} /></div>
//                 <div>
//                   <h3 className="font-bold text-slate-700 text-sm">Professional Context</h3>
//                   <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Company & Industry</p>
//                 </div>
//               </div>
//               <ChevronUp className={`text-slate-300 transition-transform ${!openSections.business && 'rotate-180'}`} />
//             </button>
            
//             {openSections.business && (
//               <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
//                 <div className="md:col-span-2">
//                   <label className={labelStyle}>Organization</label>
//                   <input name="organizationName" value={formData.organizationName} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Industry Verticle</label>
//                   <input name="industry" value={formData.industry} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Official Title</label>
//                   <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className={inputStyle} />
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* ADDRESS SECTION */}
//           <div className={cardStyle}>
//             <button type="button" onClick={() => toggleSection('address')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50">
//               <div className="flex items-center gap-4">
//                 <div className={`p-2 rounded-xl ${openSections.address ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><MapPin size={20} /></div>
//                 <div>
//                   <h3 className="font-bold text-slate-700 text-sm">Geographic Info</h3>
//                   <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">City & State</p>
//                 </div>
//               </div>
//               <ChevronUp className={`text-slate-300 transition-transform ${!openSections.address && 'rotate-180'}`} />
//             </button>
            
//             {openSections.address && (
//               <div className="px-8 pb-8 pt-2 grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
//                 <div>
//                   <label className={labelStyle}>City</label>
//                   <input name="city" value={formData.city} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>State</label>
//                   <input name="state" value={formData.state} onChange={handleChange} className={inputStyle} />
//                 </div>
//               </div>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default LeadDetailsForm;



// "use client";

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { 
//   User, 
//   Building2, 
//   MapPin, 
//   PlusCircle, 
//   Save, 
//   X,
//   ChevronUp,
//   Loader2
// } from "lucide-react"; 
// import { toast } from "react-toastify";
// import DynamicCustomFields from "@/components/DynamicCustomFields";

// const LeadDetailsForm = ({ leadId }) => {
//   const router = useRouter();
  
//   // Controls which sections are expanded
//   const [openSections, setOpenSections] = useState({
//     business: false,
//     address: false,
//   });

//   const initialFormState = {
//     firstName: "", lastName: "", email: "", mobileNo: "",
//     status: "Lead", salutation: "", jobTitle: "", 
//     organizationName: "", industry: "", city: "", 
//     state: "", customFields: {}
//   };

//   const [formData, setFormData] = useState(initialFormState);
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isLoading, setIsLoading] = useState(!!leadId); // Only load if ID exists

//   /* ----------------------------------------------------------
//       FETCH LEAD DATA (Edit Mode)
//   -----------------------------------------------------------*/
//   useEffect(() => {
//     // leadId will be a string here because we unwrapped it in the parent page
//     if (leadId && leadId !== "undefined") {
//       const fetchLead = async () => {
//         try {
//           const token = localStorage.getItem("token");
//           const res = await axios.get(`/api/lead/${leadId}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
          
//           const data = res.data;
//           setFormData(data);
          
//           // Smart UI: Open sections automatically if they contain data
//           setOpenSections({
//             business: !!(data.organizationName || data.jobTitle || data.industry),
//             address: !!(data.city || data.state)
//           });
//         } catch (err) {
//           console.error("Fetch error:", err);
//           toast.error("Failed to load lead details");
//         } finally {
//           setIsLoading(false);
//         }
//       };
//       fetchLead();
//     } else {
//       setIsLoading(false);
//     }
//   }, [leadId]);

//   const toggleSection = (section) => {
//     setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
//   };

//   const validate = () => {
//     const newErrors = {};
//     if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setIsSubmitting(true);
//     try {
//       const token = localStorage.getItem("token");
//       const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
      
//       if (leadId && leadId !== "undefined") {
//         await axios.put(`/api/lead/${leadId}`, formData, config);
//         toast.success("Lead updated successfully");
//       } else {
//         await axios.post("/api/lead", formData, config);
//         toast.success("Lead created successfully");
//       }
      
//       router.push("/admin/leads");
//       router.refresh(); // Syncs server components
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Error saving data");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-[#f4f7fe]">
//         <Loader2 className="animate-spin text-blue-600" size={40} />
//       </div>
//     );
//   }

//   const cardStyle = "bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden transition-all";
//   const inputStyle = "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";
//   const labelStyle = "text-xs font-bold text-gray-400 mb-1 block tracking-wider uppercase";

//   return (
//     <div className="bg-[#f4f7fe] min-h-screen pb-20">
//       {/* Header Navigation */}
//       <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 mb-6">
//         <div className="max-w-3xl mx-auto flex justify-between items-center">
//           <h1 className="text-xl font-bold text-gray-800">
//             {leadId ? "Edit Lead Profile" : "Quick Add Lead"}
//           </h1>
//           <div className="flex gap-2">
//             <button type="button" onClick={() => router.back()} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
//               <X size={24} />
//             </button>
//             <button 
//               onClick={handleSubmit}
//               disabled={isSubmitting}
//               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-full font-bold shadow-lg shadow-blue-100 disabled:opacity-50 transition-all active:scale-95"
//             >
//               {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
//               {isSubmitting ? "Saving..." : "Save Lead"}
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-3xl mx-auto px-4">
//         <form onSubmit={handleSubmit}>
          
//           {/* SECTION 1: ESSENTIALS */}
//           <div className={cardStyle}>
//             <div className="p-6">
//               <div className="flex items-center gap-2 mb-6 text-blue-600">
//                 <User size={20} />
//                 <h2 className="font-bold uppercase text-sm tracking-widest">Personal Info</h2>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="md:col-span-2">
//                   <label className={labelStyle}>First Name *</label>
//                   <input 
//                     name="firstName" 
//                     value={formData.firstName} 
//                     onChange={handleChange}
//                     placeholder="Enter first name"
//                     className={`${inputStyle} text-lg ${errors.firstName ? 'border-red-400 ring-1 ring-red-50' : ''}`}
//                   />
//                   {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Last Name</label>
//                   <input name="lastName" value={formData.lastName} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Current Status</label>
//                   <select name="status" value={formData.status} onChange={handleChange} className={inputStyle}>
//                     <option value="Lead">Lead</option>
//                     <option value="Open">Open</option>
//                     <option value="Interested">Interested</option>
//                     <option value="Converted">Converted</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Email Address</label>
//                   <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} placeholder="example@mail.com" />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Phone Number</label>
//                   <input type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className={inputStyle} />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* SECTION 2: BUSINESS */}
//           <div className={cardStyle}>
//             <button 
//               type="button"
//               onClick={() => toggleSection('business')}
//               className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
//             >
//               <div className="flex items-center gap-3">
//                 <div className={`p-2 rounded-lg ${openSections.business ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
//                   <Building2 size={20} />
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-gray-700">Business Details</h3>
//                   <p className="text-xs text-gray-400">Company, Industry, Job Title</p>
//                 </div>
//               </div>
//               {openSections.business ? <ChevronUp className="text-gray-400"/> : <PlusCircle className="text-blue-500"/>}
//             </button>
            
//             {openSections.business && (
//               <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
//                 <div className="md:col-span-2">
//                   <label className={labelStyle}>Organization Name</label>
//                   <input name="organizationName" value={formData.organizationName} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Industry</label>
//                   <input name="industry" value={formData.industry} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>Job Title</label>
//                   <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className={inputStyle} />
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* SECTION 3: ADDRESS */}
//           <div className={cardStyle}>
//             <button 
//               type="button"
//               onClick={() => toggleSection('address')}
//               className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
//             >
//               <div className="flex items-center gap-3">
//                 <div className={`p-2 rounded-lg ${openSections.address ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
//                   <MapPin size={20} />
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-gray-700">Location</h3>
//                   <p className="text-xs text-gray-400">City, State, Territory</p>
//                 </div>
//               </div>
//               {openSections.address ? <ChevronUp className="text-gray-400"/> : <PlusCircle className="text-blue-500"/>}
//             </button>
            
//             {openSections.address && (
//               <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
//                 <div>
//                   <label className={labelStyle}>City</label>
//                   <input name="city" value={formData.city} onChange={handleChange} className={inputStyle} />
//                 </div>
//                 <div>
//                   <label className={labelStyle}>State</label>
//                   <input name="state" value={formData.state} onChange={handleChange} className={inputStyle} />
//                 </div>
//               </div>
//             )}
//           </div>

//           <p className="text-center text-gray-400 text-[10px] mt-10 uppercase tracking-widest">
//             Only First Name is mandatory. Build your pipeline your way.
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default LeadDetailsForm;




// "use client";

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import DynamicCustomFields from "@/components/DynamicCustomFields";

// const LeadDetailsForm = ({ leadId, initialData = null }) => {
//   const router = useRouter();

//   const initialFormState = {
//     salutation: "",
//     jobTitle: "",
//     leadOwner: "",
//     firstName: "",
//     gender: "",
//     middleName: "",
//     source: "",
//     lastName: "",
//     email: "",
//     mobileNo: "",
//     phone: "",
//     website: "",
//     whatsapp: "",
//     phoneExt: "",
//     organizationName: "",
//     annualRevenue: "",
//     territory: "",
//     employees: "",
//     industry: "",
//     fax: "",
//     marketSegment: "",
//     city: "",
//     state: "",
//     county: "",
//     qualificationStatus: "",
//     qualifiedBy: "",
//     qualifiedOn: "",
//     status: "",
//     leadType: "",
//     requestType: "",
//   };

//   const [formData, setFormData] = useState(initialFormState);
//   const [errors, setErrors] = useState({});
//   const [customFieldsConfig,setCustomFieldsConfig] = useState([]);
//   const [confirmation, setConfirmation] = useState({
//     isVisible: false,
//     message: ""
//   });

//   const isEditMode = Boolean(leadId);
//   useEffect(()=>{

//  const token = localStorage.getItem("token");

//  axios.get("/api/custom-fields?module=lead",{
//    headers:{ Authorization:`Bearer ${token}` }
//  })
//  .then(res=>setCustomFieldsConfig(res.data.data));

// },[]);

//   // Prefill if editing
//   useEffect(() => {
//     if (initialData) {
//       setFormData(initialData);
//     } else if (isEditMode) {
//       const fetchLead = async () => {
//         try {
//           const token = localStorage.getItem("token");
//           const res = await axios.get(`/api/lead/${leadId}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//           setFormData(res.data);
//         } catch (err) {
//           console.error("Error fetching lead:", err);
//         }
//       };
//       fetchLead();
//     }
//   }, [leadId, initialData]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };
//   const handleCustomChange = (e,name)=>{
//  setFormData(prev=>({
//    ...prev,
//    customFields:{
//      ...prev.customFields,
//      [name]: e.target.value
//    }
//  }))
// }

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.firstName) newErrors.firstName = "First Name is required.";
//     if (!formData.email) newErrors.email = "Email is required.";
//     if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email))
//       newErrors.email = "Invalid email address.";
//     if (!formData.mobileNo) newErrors.mobileNo = "Mobile Number is required.";
//     if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo))
//       newErrors.mobileNo = "Mobile Number must be 10 digits.";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     const token = localStorage.getItem("token");
//     if (!token) {
//       alert("User is not authenticated");
//       return;
//     }

//     const config = {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     };

//     try {
//       if (isEditMode) {
//         await axios.put(`/api/lead/${leadId}`, formData, config);

//         setConfirmation({
//           isVisible: true,
//           message: "Lead updated successfully!"
//         });
//       } else {
//         await axios.post("/api/lead", formData, config);

//         setConfirmation({
//           isVisible: true,
//           message: "Lead created successfully!"
//         });
//       }

//       setTimeout(() => {
//         router.push("/leads");
//       }, 1500);

//     } catch (error) {
//       console.error("Error saving lead:", error);
//       alert("Failed to save lead. Please try again.");
//     }
//   };

//   // UI Styling classes
//   const formFieldClass =
//     "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600";

//   const requiredAsterisk = <span className="text-red-500">*</span>;

//   return (
//     <div className="bg-gray-100 min-h-screen p-4 sm:p-8 font-sans">
//       <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden">

//         {/* Header */}
//         <header className="bg-[#1e40af] p-6 sm:p-8">
//           <h1 className="text-3xl font-bold text-white">
//             {isEditMode ? "Edit Lead" : "Create New Lead"}
//           </h1>
//           <p className="text-gray-200 text-sm mt-1">
//             Enter lead details to manage your pipeline.
//           </p>
//         </header>

//         <div className="p-6 sm:p-10">

//           {/* Success Message */}
//           {confirmation.isVisible && (
//             <div className="mb-6 p-4 rounded-lg bg-[#10b981] text-white font-semibold flex items-center shadow-lg">
//               <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
//                   d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z">
//                 </path>
//               </svg>
//               <span>{confirmation.message}</span>
//             </div>
//           )}

//           {/* FORM */}
//           <form className="space-y-6" onSubmit={handleSubmit}>

//             {/* Fields in 2 columns */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//               {[
//                 { label: "Salutation", name: "salutation" },
//                 { label: "Job Title", name: "jobTitle" },
//                 { label: "Lead Owner", name: "leadOwner" },
//                 { label: "First Name", name: "firstName", required: true },
//                 { label: "Gender", name: "gender" },
//                 { label: "Middle Name", name: "middleName" },
//                 { label: "Source", name: "source" },
//                 { label: "Last Name", name: "lastName" },
//                 { label: "Email", name: "email", required: true },
//                 { label: "Mobile No", name: "mobileNo", required: true },
//                 { label: "Phone", name: "phone" },
//                 { label: "Website", name: "website" },
//                 { label: "Whatsapp", name: "whatsapp" },
//                 { label: "Phone Ext", name: "phoneExt" },
//                 { label: "Organization", name: "organizationName" },
//                 { label: "Annual Revenue", name: "annualRevenue" },
//                 { label: "Territory", name: "territory" },
//                 { label: "Employees", name: "employees" },
//                 { label: "Industry", name: "industry" },
//                 { label: "Fax", name: "fax" },
//                 { label: "Market Segment", name: "marketSegment" },
//                 { label: "City", name: "city" },
//                 { label: "State", name: "state" },
//                 { label: "County", name: "county" },
//               ].map(({ label, name, required }) => (
//                 <div key={name}>
//                   <label className="block text-sm font-medium mb-1">
//                     {label} {required && requiredAsterisk}
//                   </label>
//                   <input
//                     type="text"
//                     name={name}
//                     value={formData[name] || ""}
//                     onChange={handleChange}
//                     className={formFieldClass}
//                     required={required}
//                   />
//                   {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
//                 </div>
//               ))}

//               {/* Dropdown: Status */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Status {requiredAsterisk}
//                 </label>
//                 <select
//                   name="status"
//                   value={formData.status || ""}
//                   onChange={handleChange}
//                   required
//                   className={`${formFieldClass} appearance-none pr-8`}
//                 >
//                   <option value="">Select Status</option>
//                   <option value="Lead">Lead</option>
//                   <option value="Open">Open</option>
//                   <option value="Replied">Replied</option>
//                   <option value="Opportunity">Opportunity</option>
//                   <option value="Quotation">Quotation</option>
//                   <option value="Lost Quotation">Lost Quotation</option>
//                   <option value="Interested">Interested</option>
//                   <option value="Converted">Converted</option>
//                   <option value="Do Not Contact">Do Not Contact</option>
//                 </select>
//               </div>

//               {/* Dropdown: Lead Type */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">Lead Type</label>
//                 <select
//                   name="leadType"
//                   value={formData.leadType || ""}
//                   onChange={handleChange}
//                   className={`${formFieldClass} appearance-none pr-8`}
//                 >
//                   <option value="">Select Lead Type</option>
//                   <option value="Client">Client</option>
//                   <option value="Channel Partner">Channel Partner</option>
//                   <option value="Consultant">Consultant</option>
//                 </select>
//               </div>

//               {/* Dropdown: Request Type */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">Request Type</label>
//                 <select
//                   name="requestType"
//                   value={formData.requestType || ""}
//                   onChange={handleChange}
//                   className={`${formFieldClass} appearance-none pr-8`}
//                 >
//                   <option value="">Select Request Type</option>
//                   <option value="Product Enquiry">Product Enquiry</option>
//                   <option value="Request for Information">Request for Information</option>
//                   <option value="Suggestions">Suggestions</option>
//                   <option value="Other">Other</option>
//                 </select>
//               </div>
//               <DynamicCustomFields
//   fields={customFieldsConfig}
//   values={formData.customFields}
//   onChange={handleCustomChange}
//   formFieldClass={formFieldClass}
// />

//             </div>

//             {/* Buttons */}
//             <button
//               type="submit"
//               className="w-full bg-[#10b981] hover:bg-green-600 text-white font-bold py-3 rounded-lg"
//             >
//               {isEditMode ? "Update Lead" : "Save Lead"}
//             </button>

//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeadDetailsForm;

