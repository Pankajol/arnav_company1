"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiPhoneCall, FiMail, FiCheckCircle, FiClock, FiStar, FiLoader } from "react-icons/fi";

export default function AgentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/agent/my-stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error("Agent fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgentData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><FiLoader className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
      {/* Header with Personal Greeting */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">
            Welcome back, {data.agentName.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Personal Sales Hub</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase">My Target</p>
            <p className="text-lg font-black text-blue-600">${data.targetValue?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ACTION PANEL: Leads to follow up */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <FiCheckCircle className="text-emerald-500" />
            <h3 className="font-black text-slate-800 text-xs tracking-widest uppercase">Immediate Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {data.myLeads.map((lead) => (
              <div key={lead._id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                    {lead.firstName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{lead.firstName} {lead.lastName}</h4>
                    <p className="text-xs text-slate-400 font-medium">{lead.organizationName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><FiPhoneCall/></button>
                   <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><FiMail/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR: Performance Summary */}
        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-6">Efficiency Score</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black">92</span>
                <span className="text-xl font-bold opacity-60 mb-1">/ 100</span>
              </div>
              <p className="text-xs font-medium opacity-80 leading-relaxed">You are converting leads 15% faster than last week. Keep it up!</p>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-6">Activity Feed</h3>
              <div className="space-y-6">
                {data.recentLogs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">{log.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}



// "use client";

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { 
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
// } from "recharts";
// import { FiActivity, FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp } from "react-icons/fi";

// export default function AgentReports() {
//   const [report, setReport] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get("/api/helpdesk/report", {
//           headers: { Authorization: `Bearer ${token}` }
//         });
        
//         // Backend now returns { success: true, data: { statusStats, priorityStats, ... } }
//         if (res.data.success) {
//           setReport(res.data.data);
//         }
//       } catch (err) {
//         console.error("Report Fetch Error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchStats();
//   }, []);

//   const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

//   if (loading) return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
//       <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
//       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Crunching Real-time Data</p>
//     </div>
//   );

//   return (
//     <div className="p-6 md:p-10 space-y-10 bg-[#fbfcfd] min-h-screen">
      
//       {/* HEADER SECTION */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
//             Intelligence <span className="text-blue-600">Report</span>
//           </h1>
//           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
//             Performance & TAT (Turnaround Time) Metrics
//           </p>
//         </div>
//         <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
//           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//           <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Live Engine Active</span>
//         </div>
//       </div>

//       {/* KPI CARDS: 100x Data Mapping */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-blue-500 transition-all">
//           <FiActivity className="text-blue-600 mb-4" size={28} />
//           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
//           <div className="flex items-end gap-2">
//             <p className="text-3xl font-black text-slate-900">{report?.efficiency || 0}%</p>
//             <FiTrendingUp className="text-green-500 mb-1" size={16} />
//           </div>
//         </div>

//         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-green-500 transition-all">
//           <FiCheckCircle className="text-green-600 mb-4" size={28} />
//           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tickets Solved</p>
//           <p className="text-3xl font-black text-slate-900">{report?.totalClosed || 0}</p>
//         </div>

//         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-amber-500 transition-all">
//           <FiClock className="text-amber-500 mb-4" size={28} />
//           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. TAT</p>
//           <p className="text-3xl font-black text-slate-900">2.4h</p> {/* Static until backend calculated */}
//         </div>

//         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-red-500 transition-all">
//           <FiAlertCircle className="text-red-500 mb-4" size={28} />
//           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Assigned</p>
//           <p className="text-3xl font-black text-slate-900">{report?.totalAssigned || 0}</p>
//         </div>
//       </div>

//       {/* VISUAL ANALYTICS GRID */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
//         {/* Status Distribution: Dynamic Bar Chart */}
//         <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-white">
//           <div className="flex justify-between items-center mb-10">
//             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Operational Status</h3>
//             <span className="text-[9px] bg-slate-100 px-3 py-1 rounded-full font-black text-slate-500 uppercase">Bar Analysis</span>
//           </div>
//           <div className="h-72">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={report?.statusStats || []}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                 <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#64748b'}} />
//                 <YAxis hide />
//                 <Tooltip 
//                   cursor={{fill: '#f8fafc'}} 
//                   contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px'}} 
//                 />
//                 <Bar dataKey="count" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={45} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Priority Allocation: Dynamic Pie Chart */}
//         <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-white">
//           <div className="flex justify-between items-center mb-10">
//             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Priority Load Factor</h3>
//             <span className="text-[9px] bg-slate-100 px-3 py-1 rounded-full font-black text-slate-500 uppercase">Pie Data</span>
//           </div>
//           <div className="h-72 flex flex-col items-center justify-center">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={report?.priorityStats || []}
//                   innerRadius={70}
//                   outerRadius={100}
//                   paddingAngle={8}
//                   dataKey="count"
//                   nameKey="_id"
//                   stroke="none"
//                 >
//                   {report?.priorityStats?.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </PieChart>
//             </ResponsiveContainer>
            
//             {/* Custom Legend for clarity */}
//             <div className="flex gap-4 mt-4 flex-wrap justify-center">
//               {report?.priorityStats?.map((p, i) => (
//                 <div key={i} className="flex items-center gap-1.5">
//                   <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
//                   <span className="text-[9px] font-black uppercase text-slate-500">{p._id}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//       </div>

//       <p className="text-center text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] pt-10">
//         End of Data Transmission
//       </p>
//     </div>
//   );
// }