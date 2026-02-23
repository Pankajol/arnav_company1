"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  HiRocketLaunch, 
  HiShieldCheck, 
  HiChartBar, 
  HiUserGroup, 
  HiOutlineCube, 
  HiArrowRight,
  HiCheckCircle
} from "react-icons/hi2";

export default function LandingPage() {
  const features = [
    { title: "Procure to Pay", desc: "Automate your supply chain and payments.", icon: <HiRocketLaunch /> },
    { title: "Inventory", desc: "Smart tracking with zero-stock alerts.", icon: <HiOutlineCube /> },
    { title: "Order to Cash", desc: "Optimize your entire sales cycle.", icon: <HiCheckCircle /> },
    { title: "Production", desc: "Lean manufacturing and workflow tracking.", icon: <HiChartBar /> },
    { title: "CRM", desc: "Deep lead insights and client retention.", icon: <HiUserGroup /> },
    { title: "Analytics", desc: "Real-time BI for strategic growth.", icon: <HiShieldCheck /> },
  ];

  const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden font-sans">
      
      {/* Decorative Gradients (Light Mode) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/50 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/50 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-200">
            <HiRocketLaunch size={20} />
          </div>
          <span className="text-lg font-black text-slate-800 tracking-tighter uppercase">AITS <span className="text-blue-600">ERP</span></span>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/signin" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Sign In</Link>
          <Link href="/signup" className="bg-slate-900 px-5 py-2 rounded-xl text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Register</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8 inline-block shadow-sm">
            Operational Excellence Standard
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.85]">
            Total Business <br />
            <span className="text-blue-600 text-sm sm:text-xl md:text-2xl font-bold tracking-tight lg:text-3xl">Transparency.</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            The all-in-one ERP & CRM solution for modern enterprises. 
            Unified data, precision tracking, and effortless scale.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signin"
              className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-blue-200"
            >
              Access Workspace <HiArrowRight />
            </Link>
            <Link
              href="/signup"
              className="px-10 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              Partner Registration
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Capabilities</h2>
          <p className="text-2xl font-bold text-slate-800 italic">Built for the future of work.</p>
        </div>

        <motion.div 
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                {f.icon}
              </div>
              <h3 className="text-slate-800 font-black uppercase text-sm tracking-wider mb-3">{f.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-slate-900 py-20">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tighter">Ready to optimize?</h2>
            <Link href="/signup" className="inline-flex items-center gap-2 bg-blue-600 px-8 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
               Establish Company Account <HiArrowRight />
            </Link>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
            <HiRocketLaunch size={20} className="text-blue-600"/>
            <span className="font-black text-slate-900 tracking-tighter uppercase">AITS ERP</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            &copy; 2026 AITS Enterprise. Secure Multi-Tenant Architecture.
          </p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-blue-600">Manuals</a>
            <a href="#" className="hover:text-blue-600">Compliance</a>
            <a href="#" className="hover:text-blue-600">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
// "use client";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { HiCheckCircle } from "react-icons/hi";

// export default function LandingPage() {
//   const features = [
//     "Procure to Pay – Streamline your procurement and payment processes.",
//     "Inventory – Real‑time inventory tracking and alerts.",
//     "Order to Cash – Manage your sales cycle from order to cash.",
//     "Production – Optimize your production processes for better efficiency.",
//     "CRM – Enhance customer relationships and support.",
//     "Reports – Insightful reports for better decision making.",
//   ];

//   /* ✨ Framer‑motion variants for staggered reveal */
//   const listVariants = {
//     hidden: { opacity: 0 },
//     show: {
//       opacity: 1,
//       transition: { staggerChildren: 0.15 },
//     },
//   };

//   const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     show: { opacity: 1, y: 0 },
//   };

//   return (
//     <main className="h-screen overflow-hidden flex flex-col justify-between items-center bg-gradient-to-br from-gray-500 via-white to-amber-400 text-gray-800 p-6">
//       {/* Header */}
//       <header className="flex flex-col items-center w-full">
//         {/* Logos — one centered, one fixed to the right edge */}
//         <div className="relative w-full h-36 mb-4">
//           {/* Center logo */}
//           <img
//             src="/aits_pig.png"
//             alt="ERP Dashboard"
//             className="absolute left-1/2 -translate-x-1/2 h-full w-auto"
//           />
          
//           {/* Right‑corner logo (flush with viewport edge) */}
//           <img
//             src="/aits_logo.png"
//             alt="AITS ERP Logo"
//             className="absolute right-0 h-72 w-auto p-6"
//           />
//         </div>

//         <motion.h1
//           initial={{ opacity: 0, y: -30 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="text-4xl md:text-5xl font-bold text-center mb-3 text-neutral-700"
//         >
//           Welcome to <span className="text-amber-500">AITS ERP</span>
//         </motion.h1>
//         <p className="text-center text-base md:text-lg max-w-2xl">
//           Manage your sales, purchases, inventory, and business operations from one centralized, modern ERP platform.
//         </p>
//       </header>

//       {/* Actions & Features */}
//       <div className="flex flex-col items-center gap-6">
//         {/* Buttons */}
//         <div className="flex gap-4">
//           <Link
//             href="/signin"
//             className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition"
//           >
//             Sign In
//           </Link>
//           <Link
//             href="/signup"
//             className="px-6 py-3 border border-amber-500 text-amber-500 rounded-xl hover:bg-indigo-50 transition"
//           >
//             Company Registration
//           </Link>
//         </div>

//         {/* Animated checklist */}
//         <h2 className="text-2xl font-bold text-neutral-700">Key Features</h2>
//         <motion.ul
//           className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-4xl"
//           variants={listVariants}
//           initial="hidden"
//           whileInView="show"
//           viewport={{ once: true }}
//         >
//           {features.map((text, idx) => (
//             <motion.li
//               key={idx}
//               className="flex items-start gap-2 text-sm md:text-base"
//               variants={itemVariants}
//             >
//               <HiCheckCircle className="text-amber-500 mt-0.5" />
//               <span>{text}</span>
//             </motion.li>
//           ))}
//         </motion.ul>
//       </div>

//       {/* Footer */}
//       <footer className="text-center text-xs md:text-sm text-gray-600">
//         &copy; 2025 AITS ERP. All rights reserved.
//       </footer>
//     </main>
//   );
// }

