"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock, FiLoader, FiShield, FiCpu, FiActivity, FiChevronRight, FiTrendingUp, FiLayers } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState('Company'); 
  const [step, setStep] = useState('login'); 
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.clear(); 
    }
  }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const checkCustomerIdentity = async (e) => {
    if (e) e.preventDefault();
    if (!form.email) return toast.error("Valid email is required");
    
    setLoading(true);
    try {
      const res = await axios.post("/api/customers/check", { email: form.email });
      if (!res.data.exists) {
        return toast.error("Account not recognized. Contact Administrator.");
      }
      setStep(res.data.hasPassword ? "login" : "setPassword");
    } catch (err) {
      toast.error(err.response?.data?.message || "Security handshake failed.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!form.email || !form.password) return toast.error("Credentials required");
    
    setLoading(true);
    try {
      const urls = {
        Company: "/api/company/login",
        User: "/api/users/login",
        Customer: "/api/customers/login"
      };

      const res = await axios.post(urls[mode], form);
      const { token } = res.data;
      const finalUser = res.data.company || res.data.user || res.data.customer;

      if (!token || !finalUser) throw new Error("Authentication Payload Incomplete");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      
      toast.success(`Access Granted: ${finalUser.name || 'Verified'}`);

      const roles = finalUser?.roles || [];
      let redirect = "/";
      
      if (mode === "Company") {
        redirect = "/admin";
      } else if (mode === "User") {
        if (roles.includes("Admin") || roles.includes("CRM Admin")) {
          redirect = "/admin";
        } else if (roles.includes("Sales Manager") || roles.includes("CRM Manager")) {
          redirect = "/admin/pipeline";
        } else if (roles.includes("CRM Agent") || roles.includes("Agent")) {
          redirect = "/agent-dashboard";
        } else {
          redirect = "/employee-dashboard";
        }
      } else if (mode === "Customer") {
        redirect = "/customer-portal";
      }

      setTimeout(() => router.replace(redirect), 1000);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Verification Failed");
    } finally {
      setLoading(false);
    }
  };

  const setCustomerPassword = async (e) => {
    if (e) e.preventDefault();
    if (form.password.length < 8) return toast.error("Password must be 8+ characters");
    
    setLoading(true);
    try {
      await axios.post("/api/customers/set-password", form);
      toast.success("Security Configured! Logging in...");
      await submit();
    } catch (err) {
      toast.error("Failed to set security credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-white font-sans overflow-hidden">
      <ToastContainer position="top-right" theme="colored" />

      {/* --- LEFT SECTION: LOGIN PORTAL (Clean & Professional) --- */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white z-10 border-r border-slate-100">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo & CRM Branding */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
                <FiShield size={28} />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-slate-900">
                CRM <span className="text-blue-600">Pro</span>
              </h1>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Admin Access</h2>
            <p className="text-slate-500 font-medium">Manage your sales, leads, and customer operations.</p>
          </header>

          {/* User Mode Toggles */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10 border border-slate-200">
            {['Company', 'User', 'Customer'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setForm({ email: '', password: '' });
                  setStep(m === "Customer" ? "email" : "login");
                }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  mode === m ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identity Email</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handle}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-800"
                  placeholder="name@organization.com"
                />
              </div>
            </div>

            {(mode !== "Customer" || step !== "email") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    {step === "setPassword" ? "Set Access Key" : "Access Password"}
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type={show ? "text" : "password"}
                    name="password"
                    required
                    value={form.password}
                    onChange={handle}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 pr-12 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold text-slate-800"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                    {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </motion.div>
            )}

            <button 
              type={mode === "Customer" && step !== "login" ? "button" : "submit"}
              onClick={mode === "Customer" && step === "email" ? checkCustomerIdentity : mode === "Customer" && step === "setPassword" ? setCustomerPassword : null}
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 group"
            >
              {loading ? <FiLoader className="animate-spin text-lg" /> : (
                <>Authorize Access <FiChevronRight className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          {mode === "Customer" && step !== "email" && (
            <button onClick={() => setStep("email")} className="w-full text-slate-400 text-[10px] font-black mt-8 uppercase tracking-[0.2em] hover:text-blue-600">
              ← Use Different Email
            </button>
          )}

          <footer className="mt-20">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-loose">
              Enterprise Neural Infrastructure <br/> Cloud-Node ID: CRM-AX-991
            </p>
          </footer>
        </motion.div>
      </section>

      {/* --- RIGHT SECTION: CRM ANALYTICS ENGINE (Animated Dashboard Concept) --- */}
      <section className="hidden lg:flex w-1/2 bg-[#0a0c10] relative items-center justify-center overflow-hidden">
        {/* Dynamic Data Grid Background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Glowing Data Streams */}
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[140px]" />
        
        {/* Central Dashboard Visualization */}
        <div className="relative z-10 flex flex-col items-center">
            {/* Animated Progress Ring */}
            <div className="relative w-80 h-80 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border border-blue-400/30 rounded-full shadow-[0_0_50px_rgba(59,130,246,0.1)]" />
                
                <div className="bg-blue-600/5 backdrop-blur-3xl rounded-full p-12 border border-white/5 flex flex-col items-center">
                    <FiTrendingUp className="text-blue-500 text-6xl mb-4 animate-pulse" />
                    <span className="text-white text-3xl font-black tracking-tighter">98.4%</span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Growth Index</span>
                </div>
            </div>

            {/* Floating "Lead" Nodes */}
            <motion.div animate={{ x: [0, 10, 0], y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-10 -right-20 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">New Lead Detected</span>
                </div>
            </motion.div>

            <motion.div animate={{ x: [0, -10, 0], y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-10 -left-20 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <FiLayers className="text-blue-400" />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Pipeline Synced</span>
                </div>
            </motion.div>

            {/* Bottom Telemetry Charts */}
            <div className="mt-16 flex gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex flex-col gap-1 items-center">
                        <motion.div 
                            animate={{ height: [10, 40, 15, 30] }} 
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} 
                            className="w-2 bg-blue-600/40 rounded-full"
                        />
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                    </div>
                ))}
            </div>
            <p className="mt-6 text-slate-500 text-[10px] font-black uppercase tracking-[0.6em]">AITS Revenue Neuralis</p>
        </div>
      </section>
    </main>
  );
}

// "use client";

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import axios from 'axios';
// import { FiEye, FiEyeOff, FiMail, FiLock, FiChevronRight, FiLoader, FiShield } from 'react-icons/fi';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// export default function LoginPage() {
//   const router = useRouter();

//   const [mode, setMode] = useState('Company'); // Company | User | Customer
//   const [step, setStep] = useState('login'); // login | email | setPassword
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [show, setShow] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   // ===============================
//   // 🔎 CUSTOMER EMAIL CHECK
//   // ===============================
//   const checkCustomer = async () => {
//     if (!form.email) return toast.error("Email is required to proceed");
//     setLoading(true);
//     try {
//       const res = await axios.post("/api/customers/check", { email: form.email });
//       if (!res.data.exists) {
//         toast.error("Account not found. Please contact support.");
//         return;
//       }
//       // Agar password pehle se hai toh login, varna set password
//       setStep(res.data.hasPassword ? "login" : "setPassword");
//     } catch {
//       toast.error("Network error. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ===============================
//   // 🔐 MAIN LOGIN SUBMIT
//   // ===============================
//   // const submit = async (e) => {
//   //   e.preventDefault();
//   //   if (!form.email || !form.password) return toast.error("All fields are mandatory");
    
//   //   setLoading(true);
//   //   try {
//   //     const urls = {
//   //       Company: "/api/company/login",
//   //       User: "/api/users/login",
//   //       Customer: "/api/customers/login"
//   //     };

//   //     const res = await axios.post(urls[mode], form);
//   //     const { token, company, user, customer } = res.data;
//   //     const finalUser = company || user || customer;

//   //     if (!token) throw new Error("Auth token missing");

//   //     // Store in storage
//   //     localStorage.setItem("token", token);
//   //     localStorage.setItem("user", JSON.stringify(finalUser));
      
//   //     toast.success("Identity Verified. Redirecting...");

//   //     let redirect = "/";
//   //     if (mode === "Company") redirect = "/admin";
//   //     if (mode === "User") {
//   //       const roles = finalUser?.roles?.map(r => r.toLowerCase()) || [];
//   //       if (roles.includes("admin")) redirect = "/admin";
//   //       else if (roles.includes("agent")) redirect = "/agent-dashboard";
//   //       else if (roles.includes("employee")) redirect = "/employee-dashboard";
//   //     }
//   //     if (mode === "Customer") redirect = "/customer-dashboard";

//   //     // let redirect = "/admin";

//   //     setTimeout(() => router.push(redirect), 800);
//   //   } catch (error) {
//   //     toast.error(error?.response?.data?.message || "Invalid Email or Password");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };




// const submit = async (e) => {
//     e.preventDefault();
//     if (!form.email || !form.password) return toast.error("Credentials required");
    
//     setLoading(true);
//     try {
//       const urls = {
//         Company: "/api/company/login",
//         User: "/api/users/login",
//         Customer: "/api/customers/login"
//       };

//       const res = await axios.post(urls[mode], form);
//       const { token, company, user, customer } = res.data;
      
//       const finalUser = company || user || customer;

//       if (!token) throw new Error("Auth Token Error");

//       // Store identity
//       localStorage.setItem("token", token);
//       localStorage.setItem("user", JSON.stringify(finalUser));
      
//       toast.success(`Access Granted: ${finalUser.name || 'User'}`);

//       // Smart Redirect
//       let redirect = "/";
//       if (mode === "Company") redirect = "/admin";
//       if (mode === "User") {
//         const roles = finalUser?.roles?.map(r => r.toLowerCase()) || [];
//         if (roles.includes("admin")) redirect = "/admin";
//         else if (roles.includes("agent")) redirect = "/agent-dashboard";
//         else redirect = "/employee-dashboard";
//       }
//       if (mode === "Customer") redirect = "/customer-dashboard";

//       setTimeout(() => router.push(redirect), 800);
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Verification Failed");
//     } finally {
//       setLoading(false);
//     }
//   };
//   // ===============================
//   // 🆕 SET CUSTOMER PASSWORD
//   // ===============================
//   const setCustomerPassword = async () => {
//     if (form.password.length < 6) return toast.error("Password must be 6+ characters");
//     setLoading(true);
//     try {
//       await axios.post("/api/customers/set-password", form);
//       toast.success("Security Configured! You can now login.");
//       setStep("login");
//     } catch {
//       toast.error("Failed to set security credentials");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-[#0a0c10] relative overflow-hidden">
      
//       {/* GLOW EFFECTS */}
//       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
//       <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />

//       <ToastContainer position="top-center" theme="dark" />

//       <div className="w-full max-w-md z-10 px-4">
//         <div className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-3xl rounded-[2rem] p-8 md:p-10 transition-all duration-500">
          
//           {/* HEADER AREA */}
//           <div className="text-center mb-8">
//             <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/20 mb-4">
//               <FiShield className="text-white text-3xl" />
//             </div>
//             <h1 className="text-white text-3xl font-black tracking-tighter uppercase">ERP  <span className="text-amber-500">Express</span></h1>
//             <p className="text-slate-400 text-sm mt-2">Enterprise Access Management System</p>
//           </div>

//           {/* MODE SELECTOR */}
//           <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 mb-8">
//             {['Company', 'User', 'Customer'].map((m) => (
//               <button
//                 key={m}
//                 type="button"
//                 onClick={() => {
//                   setMode(m);
//                   setForm({ email: '', password: '' });
//                   setStep(m === "Customer" ? "email" : "login");
//                 }}
//                 className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
//                   mode === m 
//                   ? 'bg-amber-500 text-white shadow-xl' 
//                   : 'text-slate-500 hover:text-slate-300'
//                 }`}
//               >
//                 {m}
//               </button>
//             ))}
//           </div>

//           <form onSubmit={submit} className="space-y-5">
            
//             {/* EMAIL */}
//             <div className="space-y-1.5">
//               <label className="text-slate-400 text-[11px] font-bold uppercase ml-1 tracking-wider">Work Email</label>
//               <div className="relative group">
//                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
//                   <FiMail className="text-slate-500" />
//                 </div>
//                 <input
//                   type="email"
//                   name="email"
//                   value={form.email}
//                   onChange={handle}
//                   disabled={loading && step !== "email"}
//                   className="w-full bg-black/40 border border-white/10 text-white pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all placeholder:text-slate-700 text-sm"
//                   placeholder="name@domain.com"
//                 />
//               </div>
//             </div>

//             {/* PASSWORD: Hidden only on first customer check step */}
//             {(mode !== "Customer" || step !== "email") && (
//               <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-500">
//                 <label className="text-slate-400 text-[11px] font-bold uppercase ml-1 tracking-wider">
//                   {step === "setPassword" ? "Create New Password" : "Secure Password"}
//                 </label>
//                 <div className="relative group">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-amber-500 transition-colors">
//                     <FiLock className="text-slate-500" />
//                   </div>
//                   <input
//                     type={show ? "text" : "password"}
//                     name="password"
//                     value={form.password}
//                     onChange={handle}
//                     className="w-full bg-black/40 border border-white/10 text-white pl-11 pr-12 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all placeholder:text-slate-700 text-sm"
//                     placeholder="••••••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShow(!show)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
//                   >
//                     {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* DYNAMIC ACTION BUTTON */}
//             <div className="pt-4">
//               {mode === "Customer" && step === "email" ? (
//                 <button
//                   type="button"
//                   onClick={checkCustomer}
//                   disabled={loading}
//                   className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
//                 >
//                   {loading ? <FiLoader className="animate-spin" /> : "Verify Identity"}
//                   {!loading && <FiChevronRight />}
//                 </button>
//               ) : mode === "Customer" && step === "setPassword" ? (
//                 <button
//                   type="button"
//                   onClick={setCustomerPassword}
//                   disabled={loading}
//                   className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
//                 >
//                   {loading ? <FiLoader className="animate-spin" /> : "Set Access Key"}
//                 </button>
//               ) : (
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50 active:scale-95 text-xs uppercase tracking-widest"
//                 >
//                   {loading ? <FiLoader className="animate-spin" /> : "Establish Connection"}
//                 </button>
//               )}
//             </div>
//           </form>

//           {/* BACK OPTIONS */}
//           {mode === "Customer" && step !== "email" && (
//             <button 
//               onClick={() => setStep("email")}
//               className="w-full text-slate-500 text-[10px] font-black mt-6 hover:text-slate-300 transition-colors uppercase tracking-[0.2em]"
//             >
//               ← Change Identification
//             </button>
//           )}
//         </div>
        
//         <p className="text-slate-600 text-center mt-10 text-[10px] font-bold uppercase tracking-[0.3em]">
//           {/* Protected by AES-256 Encryption */}
//         </p>
//       </div>
//     </main>
//   );
// }


// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import axios from 'axios';
// import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// export default function LoginPage() {
//   const router = useRouter();

//   const [mode, setMode] = useState('Company');
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [show, setShow] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const submit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     if (!form.email || !form.password) {
//       toast.error("Email and password are required");
//       setLoading(false);
//       return;
//     }

//     try {
//       const url =
//         mode === "Company"
//           ? "/api/company/login"
//           : "/api/users/login";

//       const res = await axios.post(url, form);

//       const token = res?.data?.token;
//       const company = res?.data?.company; // ✅ THIS IS CORRECT
//       const user = res?.data?.user; // for user login case

//       const finalUser = mode === "Company" ? company : user;

//       if (!finalUser) {
//         toast.error("Invalid login response");
//         setLoading(false);
//         return;
//       }

//       // Save into localStorage
//       localStorage.setItem("token", token);
//       localStorage.setItem("user", JSON.stringify(finalUser));

//       toast.success("Login successful 🚀");

//       // ✅ Redirect logic
//       let redirect = "/";

//       if (mode === "Company") {
//         redirect = "/admin";
//       } else {
//         const roles = Array.isArray(finalUser?.roles)
//           ? finalUser.roles.map(r => r.toLowerCase())
//           : [];

//         if (roles.includes("admin")) redirect = "/admin";
//         else if (roles.includes("agent")) redirect = "/agent-dashboard";
//         else if (roles.includes("employee")) redirect = "/employee-dashboard";
//         else redirect = "/customer-dashboard";
//       }

//       setTimeout(() => {
//         router.push(redirect);
//       }, 800);

//     } catch (error) {
//       toast.error(
//         error?.response?.data?.message ||
//         "Invalid email or password"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-500 via-white to-amber-400 text-gray-800">
//       <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8 space-y-6">

//         {/* Mode Switch */}
//         <div className="flex justify-center gap-4">
//           {['Company','User'].map(m => (
//             <button
//               key={m}
//               onClick={() => {
//                 setMode(m);
//                 setForm({ email: '', password: '' });
//               }}
//               className={`px-4 py-2 rounded-lg ${
//                 mode === m
//                   ? 'bg-amber-400 text-white'
//                   : 'bg-gray-200 text-gray-700'
//               }`}
//             >
//               {m} Login
//             </button>
//           ))}
//         </div>

//         <h2 className="text-2xl font-bold text-center">
//           {mode} Login
//         </h2>

//         <form onSubmit={submit} className="space-y-4">

//           {/* Email */}
//           <div>
//             <label className="block text-sm">Email</label>
//             <div className="relative">
//               <FiMail className="absolute left-3 top-3 text-gray-500"/>
//               <input
//                 type="email"
//                 name="email"
//                 value={form.email}
//                 onChange={handle}
//                 className="w-full pl-10 py-2 border rounded-md focus:ring-2 focus:ring-amber-400"
//                 placeholder="Enter your email"
//               />
//             </div>
//           </div>

//           {/* Password */}
//           <div>
//             <label className="block text-sm">Password</label>
//             <div className="relative">
//               <FiLock className="absolute left-3 top-3 text-gray-500"/>
//               <input
//                 type={show ? "text" : "password"}
//                 name="password"
//                 value={form.password}
//                 onChange={handle}
//                 className="w-full pl-10 py-2 border rounded-md focus:ring-2 focus:ring-amber-400"
//                 placeholder="Enter your password"
//               />

//               <button
//                 type="button"
//                 onClick={() => setShow(!show)}
//                 className="absolute right-3 top-3 text-gray-600"
//               >
//                 {show ? <FiEyeOff /> : <FiEye />}
//               </button>
//             </div>
//           </div>

//           <button
//             disabled={loading}
//             className={`w-full py-2 rounded-md text-white ${
//               loading
//                 ? 'bg-gray-400'
//                 : 'bg-amber-400 hover:bg-amber-600'
//             }`}
//           >
//             {loading ? 'Signing in…' : 'Sign In'}
//           </button>

//         </form>
//       </div>
//     </main>
//   );
// }
