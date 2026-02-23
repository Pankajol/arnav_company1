"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { SiCivicrm } from "react-icons/si";
import LogoutButton from "@/components/LogoutButton";
import { 
  FiTarget, 
  FiClock, 
  FiUsers, 
  FiHome, 
  FiGrid, 
  FiSettings, 
  FiChevronDown, 
  FiChevronUp,
  FiActivity
  
} from "react-icons/fi"; // Switched to Feather Icons for better reliability
import {
  HiUsers, HiGlobeAlt, HiFlag, HiUserGroup, HiChartSquareBar, 
  HiMenu, HiX, HiViewGrid, HiHome
} from "react-icons/hi";

/* ---------- UI COMPONENTS (Defined outside to prevent re-renders) ---------- */
const Item = ({ href, icon, label, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="flex gap-3 px-4 py-2 text-[13px] text-gray-300 hover:text-white hover:bg-blue-600/20 rounded-md transition-all items-center"
  >
    <span className="text-base opacity-70">{icon}</span>
    {label}
  </Link>
);

const Section = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-600/10">
    <button
      onClick={onToggle}
      className="flex justify-between w-full px-3 py-3 hover:bg-gray-700/50 transition-colors text-left items-center"
    >
      <span className="flex gap-3 items-center font-semibold text-[12px] uppercase tracking-wider text-gray-400">
        <span className="text-lg text-blue-400">{icon}</span> {title}
      </span>
      <span className="text-xs text-gray-500">
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </span>
    </button>
    {isOpen && (
      <div className="bg-gray-800/20 pb-2 ml-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
        {children}
      </div>
    )}
  </div>
);

/* ---------- MAIN LAYOUT ---------- */
export default function RootDashboardLayout({ children }) {
  const [session, setSession] = useState(null);
  const [openSections, setOpenSections] = useState({
    system: true,
    crm: true,
    action: true
  });
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/");
    try {
      const decoded = jwtDecode(token);
      setSession(decoded);

      // SECURITY: If an Agent tries to access /admin, kick them out
      if (pathname.startsWith("/admin") && 
          decoded.roles?.includes("CRM Agent") && 
          !decoded.roles?.includes("Admin")) {
        router.push("/agent-dashboard");
      }
    } catch {
      router.push("/");
    }
  }, [router, pathname]);

  if (!session) return null;

  const roles = session.roles || [];
  const isAdmin = session.type === "company" || roles.includes("Admin") || roles.includes("CRM Admin");
  const isAgent = roles.includes("CRM Agent") || roles.includes("Agent");

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#1e293b] text-white flex flex-col shadow-2xl shrink-0">
        <div className="p-6 bg-[#0f172a] border-b border-gray-700 font-black flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FiHome className="text-white" /> 
          </div>
          <span className="tracking-tighter text-lg uppercase">
            {isAdmin ? "ERP Admin" : "Agent Hub"}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {/* COMMON HOME LINK */}
          <Item 
            href={isAdmin ? "/admin" : "/agent-dashboard"} 
            icon={<HiViewGrid/>} 
            label="Home Dashboard" 
          />

          {/* --- ADMIN ONLY SECTION --- */}
          {isAdmin && (
            <Section 
              title="System Controls" 
              icon={<FiSettings/>} 
              isOpen={openSections.system} 
              onToggle={() => toggleSection('system')}
            >
              <Item href="/admin/users" label="User Permissions" icon={<HiUserGroup/>} />
              <Item href="/admin/hr/employees" label="Employee Directory" icon={<HiUsers/>} />
            </Section>
          )}

          {/* --- SHARED CRM SECTION --- */}
          {(isAdmin || isAgent) && (
            <Section 
              title="CRM Pipeline" 
              icon={<SiCivicrm className="text-amber-500"/>} 
              isOpen={openSections.crm}
              onToggle={() => toggleSection('crm')}
            >
              <Item href="/agent-dashboard/leads-view" label="My Leads" icon={<HiUserGroup/>} />
              <Item href="/agent-dashboard/opportunities" label="Deal Pipeline" icon={<HiChartSquareBar/>} />
              
              {(isAdmin || isAgent) && (
                <Item href="/agent-dashboard/crm/campaign" label="Global Campaigns" icon={<HiGlobeAlt/>} />
              )}
            </Section>
          )}

          {/* --- AGENT ONLY TOOLS ---
          {isAgent && !isAdmin && (
            <Section 
              title="Daily Action" 
              icon={<FiActivity/>} 
              isOpen={openSections.action}
              onToggle={() => toggleSection('action')}
            >
              <Item href="/agent-dashboard/tasks" label="My Follow-ups" icon={<FiClock/>} />
              <Item href="/agent-dashboard/targets" label="My Sales Targets" icon={<FiTarget/>} />
            </Section>
          )} */}
        </nav>

        {/* Logout Area */}
        <div className="p-4 bg-[#0f172a]/50 border-t border-gray-700">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex justify-between items-center shadow-sm">
           <div>
             <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
               Enterprise Portal
             </h2>
             <h3 className="font-bold text-slate-700 capitalize -mt-1">
               {isAdmin ? "Corporate Administration" : "Agent Workspace"}
             </h3>
           </div>

           <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-slate-700 leading-none">{session.name || "User"}</p>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{session.email}</span>
             </div>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-200">
                {session.email ? session.email[0].toUpperCase() : "U"}
             </div>
           </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

// "use client"
// import { useState,useEffect } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import {jwtDecode} from "jwt-decode";
// import LogoutButton from "@/components/LogoutButton";

// export default function UserSidebar({children}) {
//   const router = useRouter();
//   const [openMenu, setOpenMenu] = useState(null);
//   const [user, setUser] = useState(null);

//   const toggleMenu = (menuName) => {
//     setOpenMenu(openMenu === menuName ? null : menuName);
//   };


//    useEffect(() => {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         router.push("/"); // Redirect to sign-in if no token
//       } else {
//         try {
//           const decodedToken = jwtDecode(token); // Decode token to get user info
//           setUser(decodedToken); // Set user data
//         } catch (error) {
//           console.error("Invalid token", error);
//           localStorage.removeItem("token");
//           router.push("/"); // Redirect if token is invalid
//         }
//       }
//     }, [router]);

//   return (
//     <div className="min-h-screen flex">
//     <aside className="w-64 bg-gray-900 text-white p-4">
//       <h2 className="text-xl font-bold">User Panel</h2>
//       <nav className="mt-4 space-y-2">
//         {/* Master Dropdown */}
//         <div className="relative">
//           <button
//             onClick={() => toggleMenu("master")}
//             className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded"
//           >
//             Master
//           </button>
//           {openMenu === "master" && (
//             <div className="ml-4 mt-2 space-y-1">
//               <Link href="/dashboard/admin/master/option1" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 1
//               </Link>
//               <Link href="/dashboard/admin/master/option2" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 2
//               </Link>
//               <Link href="/dashboard/admin/master/option3" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 3
//               </Link>
//             </div>
//           )}
//         </div>

//         {/* Transaction Dropdown */}
//         <div className="relative">
//           <button
//             onClick={() => toggleMenu("transaction")}
//             className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded"
//           >
//             Transaction
//           </button>
//           {openMenu === "transaction" && (
//             <div className="ml-4 mt-2 space-y-1">
//               <Link href="/dashboard/admin/transaction/option1" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 1
//               </Link>
//               <Link href="/dashboard/admin/transaction/option2" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 2
//               </Link>
//               <Link href="/dashboard/admin/transaction/option3" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 3
//               </Link>
//             </div>
//           )}
//         </div>
//         {/* support */}
//         <div className="relative">
//           <button
//             onClick={() => toggleMenu("helpdesk")}
//             className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded"
//           >
//             helpdesk
//           </button>
//           {openMenu === "helpdesk" && (
//             <div className="ml-4 mt-2 space-y-1">
//               <Link href="agent-dashboard/helpdesk/tickets" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Tickets
//               </Link>
//               <Link href="agent-dashboard/helpdesk/agents" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Agents
//               </Link>
//             </div>
//           )}
//         </div>

//         {/* Report Dropdown */}
//         <div className="relative">
//           <button
//             onClick={() => toggleMenu("report")}
//             className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded"
//           >
//             Report
//           </button>
//           {openMenu === "report" && (
//             <div className="ml-4 mt-2 space-y-1">
//               <Link href="/dashboard/admin/report/option1" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 1
//               </Link>
//               <Link href="/dashboard/admin/report/option2" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 2
//               </Link>
//               <Link href="/dashboard/admin/report/option3" className="block px-4 py-2 hover:bg-gray-700 rounded">
//                 Option 3
//               </Link>
//             </div>
//           )}
//         </div>
//       </nav>
//       {/* Logout Button */}
      // <div className="mt-4">
      //     <LogoutButton />
      //   </div>
//     </aside>
//      <main className="flex-1 bg-gray-100 p-8">
//      {children}
//    </main>
//    </div>

//   );
// }
