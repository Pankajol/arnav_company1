"use client";

import React, { useEffect, useState, useMemo } from "react";
import { FiPlus, FiTrash2, FiEdit, FiShield } from "react-icons/fi";
import axios from "axios";
import EmployeeSearchSelect from "@/components/hr/EmployeeSearchSelect";
import { toast } from "react-toastify";

const ROLE_OPTIONS = {
  // ✅ NEW CRM ROLES
  "CRM Admin": ["Lead Management", "Opportunity", "Customer Masters", "CRM Reports", "Campaigns"],
  "CRM Agent": ["Lead Generation", "Opportunity", "Follow-ups", "Customer View"],
  
  // EXISTING ROLES
  Admin: [],
  "Sales Manager": ["Sales Order", "Sales Invoice", "Delivery", "Sales Quotation", "Credit Memo", "Sales Report"],
  "Purchase Manager": ["Purchase Order", "Purchase Invoice", "GRN", "Purchase Quotation", "Debit Note", "Purchase Report"],
  "Inventory Manager": ["Inventory View", "Inventory Entry", "Stock Adjustment", "Stock Transfer", "Stock Report"],
  "Accounts Manager": ["Payment Entry", "Ledger", "Journal Entry", "Payment Form"],
  "HR Manager": ["Masters", "Masters View", "Employee", "Attendance", "Payroll"],
  "Agent": ["Tickets", "Responses", "Lead Generation", "Opportunity"],
  "Production Head": ["BOM", "Work Order", "Production Report", "Production Order", "Job Card"],
  "Project Manager": ["Project", "Tasks", "Timesheet", "Task Board"],
  Employee: ["Profile"],
};

const PERMISSIONS = [
  "create", "view", "edit", "delete", "approve", "reject",
  "copy", "print", "export", "import", "upload", "download",
  "email", "whatsapp",
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    roles: [],
    modules: {},
  });

  const [err, setErr] = useState("");
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/company/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetchUsers:", e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      employeeId: "",
      name: "",
      email: "",
      password: "",
      roles: [],
      modules: {},
    });
    setEditingUser(null);
    setErr("");
  };

  const modulesList = useMemo(() => {
    const seen = new Set();
    const list = [];

    (form.roles || []).forEach((role) => {
      (ROLE_OPTIONS[role] || []).forEach((m) => {
        if (!seen.has(m)) {
          seen.add(m);
          list.push(m);
        }
      });
    });

    Object.keys(form.modules || {}).forEach((m) => {
      if (!seen.has(m)) {
        seen.add(m);
        list.push(m);
      }
    });

    return list;
  }, [form.roles, form.modules]);

  const toggleRole = (role) => {
    setForm((prev) => {
      const has = prev.roles.includes(role);
      const roles = has
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];

      const modules = { ...prev.modules };

      if (!has) {
        (ROLE_OPTIONS[role] || []).forEach((mod) => {
          if (!modules[mod]) {
            modules[mod] = {
              selected: true, // Defaulting to true for better UX
              permissions: PERMISSIONS.reduce(
                (a, p) => ({ ...a, [p]: false }),
                {}
              ),
            };
          }
        });
      }

      return { ...prev, roles, modules };
    });
  };

  const toggleModule = (module) => {
    setForm((prev) => {
      const modules = { ...prev.modules };
      modules[module] = {
        ...modules[module],
        selected: !modules[module]?.selected,
      };
      return { ...prev, modules };
    });
  };

  const togglePermission = (module, perm) => {
    setForm((prev) => {
      const modules = { ...prev.modules };
      if (!modules[module]) {
        modules[module] = {
          selected: true,
          permissions: PERMISSIONS.reduce(
            (a, p) => ({ ...a, [p]: false }),
            {}
          ),
        };
      }
      modules[module] = {
        ...modules[module],
        permissions: {
          ...modules[module].permissions,
          [perm]: !modules[module].permissions?.[perm],
        },
      };
      return { ...prev, modules };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.roles.length) {
      return setErr("At least one role is required.");
    }

    try {
      if (editingUser) {
        await axios.put(`/api/company/users/${editingUser._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("User updated successfully");
      } else {
        await axios.post("/api/company/users", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("User created successfully");
      }

      resetForm();
      setOpenModal(false);
      fetchUsers();
    } catch (e) {
      setErr(e.response?.data?.message || "Error occurred");
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setForm({
      employeeId: user?.employeeId?._id || "",
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      roles: user?.roles || [],
      modules: user?.modules || {},
    });
    setOpenModal(true);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            <FiShield className="text-blue-600" /> User Access Control
          </h1>
          <p className="text-slate-500 font-medium">Manage organization roles and granular module permissions</p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
          onClick={() => { resetForm(); setOpenModal(true); }}
        >
          <FiPlus /> Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-center col-span-full py-10 text-slate-400">Loading user directory...</p>
        ) : users.map((u) => (
          <div key={u._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-500 text-xl uppercase">
                  {u.name[0]}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><FiEdit /></button>
                <button onClick={() => {/* Delete Logic */}} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><FiTrash2 /></button>
              </div>
            </div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{u.name}</h2>
            <p className="text-sm text-slate-500 mb-4">{u.email}</p>
            <div className="flex flex-wrap gap-1">
              {u.roles?.map(r => (
                <span key={r} className="text-[10px] font-black uppercase tracking-tighter bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-100">
                  {r}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {editingUser ? "Modify Access" : "Configure New User"}
            </h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">Define roles and individual module permissions.</p>
            
            {err && <p className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-4 border border-red-100">{err}</p>}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Link Employee Profile</label>
                  <EmployeeSearchSelect
                    token={token}
                    onSelect={(emp) => setForm((prev) => ({
                      ...prev,
                      employeeId: emp._id,
                      name: prev.name || emp.fullName,
                      email: prev.email || emp.email,
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Login Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>

                <input type="password" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder={editingUser ? "Leave blank to keep current password" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>

              {/* Functional Roles */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Functional Roles</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.keys(ROLE_OPTIONS).map((role) => (
                    <label key={role} className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${form.roles.includes(role) ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}>
                      <span className="text-[11px] font-bold">{role}</span>
                      <input type="checkbox" className="hidden" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                    </label>
                  ))}
                </div>
              </div>

              {/* Module Permissions */}
              {modulesList.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Module Permissions</h3>
                  {modulesList.map((mod) => (
                    <div key={mod} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50">
                        <span className="font-bold text-slate-800 text-sm">{mod}</span>
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" checked={!!form.modules?.[mod]?.selected} onChange={() => toggleModule(mod)} />
                      </div>

                      {form.modules?.[mod]?.selected && (
                        <div className="flex flex-wrap gap-3">
                          {PERMISSIONS.map((p) => (
                            <label key={p} className="flex items-center gap-2 cursor-pointer group">
                              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={!!form.modules?.[mod]?.permissions?.[p]} onChange={() => togglePermission(mod, p)} />
                              <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600 capitalize transition-colors">{p}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-slate-100 sticky bottom-0 bg-white">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all active:scale-95">
                  {editingUser ? "UPDATE ACCESS" : "GRANT ACCESS"}
                </button>
                <button type="button" className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all" onClick={() => { setOpenModal(false); resetForm(); }}>
                  DISCARD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import { FiPlus, FiTrash2, FiEdit } from "react-icons/fi";
// import axios from "axios";
// import EmployeeSearchSelect from "@/components/hr/EmployeeSearchSelect";

// const ROLE_OPTIONS = {
//   Admin: [],
//   "Sales Manager": [
//     "Sales Order",
//     "Sales Invoice",
//     "Delivery",
//     "Sales Quotation",
//     "Credit Memo",
//     "Sales Report",
//   ],
//   "Purchase Manager": [
//     "Purchase Order",
//     "Purchase Invoice",
//     "GRN",
//     "Purchase Quotation",
//     "Debit Note",
//     "Purchase Report",
//   ],
//   "Inventory Manager": [
//     "Inventory View",
//     "Inventory Entry",
//     "Stock Adjustment",
//     "Stock Transfer",
//     "Stock Report",
//   ],
//   "Accounts Manager": ["Payment Entry", "Ledger", "Journal Entry", "Payment Form"],
//   "HR Manager": ["Masters", "Masters View", "Employee", "Attendance", "Payroll"],
//   "Agent": ["Tickets", "Responses", "Lead Generation", "Opportunity"],
//   "Production Head": ["BOM", "Work Order", "Production Report", "Production Order", "Job Card"],
//   "Project Manager": ["Project", "Tasks", "Timesheet", "Task Board"],
//   Employee: ["Profile"],
// };

// const PERMISSIONS = [
//   "create","view","edit","delete","approve","reject",
//   "copy","print","export","import","upload","download",
//   "email","whatsapp",
// ];

// export default function UsersPage() {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [openModal, setOpenModal] = useState(false);
//   const [editingUser, setEditingUser] = useState(null);

//   const [form, setForm] = useState({
//     employeeId: "",   // ✅ added
//     name: "",
//     email: "",
//     password: "",
//     roles: [],
//     modules: {},
//   });

//   const [err, setErr] = useState("");
//   const [token, setToken] = useState(null);

//   /* ---------- init token ---------- */
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       setToken(localStorage.getItem("token"));
//     }
//   }, []);

//   /* ---------- fetch users ---------- */
//   useEffect(() => {
//     if (token) fetchUsers();
//   }, [token]);

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const { data } = await axios.get("/api/company/users", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setUsers(Array.isArray(data) ? data : []);
//     } catch (e) {
//       console.error("fetchUsers:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setForm({
//       employeeId: "",
//       name: "",
//       email: "",
//       password: "",
//       roles: [],
//       modules: {},
//     });
//     setEditingUser(null);
//     setErr("");
//   };

//   /* ---------- module list ---------- */
//   const modulesList = useMemo(() => {
//     const seen = new Set();
//     const list = [];

//     (form.roles || []).forEach((role) => {
//       (ROLE_OPTIONS[role] || []).forEach((m) => {
//         if (!seen.has(m)) {
//           seen.add(m);
//           list.push(m);
//         }
//       });
//     });

//     Object.keys(form.modules || {}).forEach((m) => {
//       if (!seen.has(m)) {
//         seen.add(m);
//         list.push(m);
//       }
//     });

//     return list;
//   }, [form.roles, form.modules]);

//   /* ---------- toggles ---------- */
//   const toggleRole = (role) => {
//     setForm((prev) => {
//       const has = prev.roles.includes(role);
//       const roles = has
//         ? prev.roles.filter((r) => r !== role)
//         : [...prev.roles, role];

//       const modules = { ...prev.modules };

//       if (!has) {
//         (ROLE_OPTIONS[role] || []).forEach((mod) => {
//           if (!modules[mod]) {
//             modules[mod] = {
//               selected: false,
//               permissions: PERMISSIONS.reduce(
//                 (a, p) => ({ ...a, [p]: false }),
//                 {}
//               ),
//             };
//           }
//         });
//       }

//       return { ...prev, roles, modules };
//     });
//   };

//   const toggleModule = (module) => {
//     setForm((prev) => {
//       const modules = { ...prev.modules };
//       modules[module] = {
//         ...modules[module],
//         selected: !modules[module]?.selected,
//       };
//       return { ...prev, modules };
//     });
//   };

//   const togglePermission = (module, perm) => {
//     setForm((prev) => {
//       const modules = { ...prev.modules };
//       if (!modules[module]) {
//         modules[module] = {
//           selected: true,
//           permissions: PERMISSIONS.reduce(
//             (a, p) => ({ ...a, [p]: false }),
//             {}
//           ),
//         };
//       }
//       modules[module] = {
//         ...modules[module],
//         permissions: {
//           ...modules[module].permissions,
//           [perm]: !modules[module].permissions?.[perm],
//         },
//       };
//       return { ...prev, modules };
//     });
//   };

//   /* ---------- submit ---------- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErr("");

//     if (!form.roles.length) {
//       return setErr("At least one role is required.");
//     }

//     try {
//       if (editingUser) {
//         await axios.put(`/api/company/users/${editingUser._id}`, form, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         await axios.post("/api/company/users", form, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       resetForm();
//       setOpenModal(false);
//       fetchUsers();
//     } catch (e) {
//       setErr(e.response?.data?.message || "Error occurred");
//     }
//   };

//   /* ---------- edit ---------- */
//   const startEdit = (user) => {
//     const roles = user?.roles || [];
//     const savedModules = user?.modules || {};
//     const restoredModules = {};

//     Object.entries(savedModules).forEach(([mod, data]) => {
//       restoredModules[mod] = {
//         selected: !!data?.selected,
//         permissions: {
//           ...PERMISSIONS.reduce(
//             (a, p) => ({ ...a, [p]: false }),
//             {}
//           ),
//           ...(data?.permissions || {}),
//         },
//       };
//     });

//     roles.forEach((role) => {
//       (ROLE_OPTIONS[role] || []).forEach((mod) => {
//         if (!restoredModules[mod]) {
//           restoredModules[mod] = {
//             selected: false,
//             permissions: PERMISSIONS.reduce(
//               (a, p) => ({ ...a, [p]: false }),
//               {}
//             ),
//           };
//         }
//       });
//     });

//     setEditingUser(user);
//     setForm({
//       employeeId: user?.employeeId?._id || "",
//       name: user?.name || "",
//       email: user?.email || "",
//       password: "",
//       roles,
//       modules: restoredModules,
//     });

//     setOpenModal(true);
//   };

//   const deleteUser = async (id) => {
//     if (!confirm("Delete user?")) return;
//     await axios.delete(`/api/company/users/${id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setUsers((prev) => prev.filter((u) => u._id !== id));
//   };

//   /* ---------- UI ---------- */
//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Company Users</h1>
//         <button
//           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//           onClick={() => {
//             resetForm();
//             setOpenModal(true);
//           }}
//         >
//           <FiPlus /> Add User
//         </button>
//       </div>

//       {/* Users grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         {loading ? (
//           <p className="text-center col-span-3">Loading...</p>
//         ) : users.length ? (
//           users.map((u) => (
//             <div
//               key={u._id}
//               className="bg-white rounded shadow p-4 flex flex-col justify-between hover:shadow-lg transition"
//             >
//               <div>
//                 <h2 className="text-lg font-semibold">{u.name}</h2>
//                 <p className="text-sm text-gray-600">{u.email}</p>
//                 <p className="mt-2 text-sm">
//                   <strong>Roles:</strong> {(u.roles || []).join(", ")}
//                 </p>
//               </div>

//               <div className="flex gap-2 mt-4 justify-end text-lg">
//                 <button onClick={() => startEdit(u)} className="text-blue-600">
//                   <FiEdit />
//                 </button>
//                 <button onClick={() => deleteUser(u._id)} className="text-red-600">
//                   <FiTrash2 />
//                 </button>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p className="text-center col-span-3">No users found</p>
//         )}
//       </div>

//       {/* Modal */}
//       {openModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
//             <h2 className="text-xl font-semibold mb-4">
//               {editingUser ? "Edit User" : "New User"}
//             </h2>
//             {err && <p className="text-red-600 mb-2">{err}</p>}

//             <form className="space-y-4" onSubmit={handleSubmit}>
//               {/* ✅ Employee Search (ONLY ADDITION) */}
//               <EmployeeSearchSelect
//                 token={token}
//                 onSelect={(emp) => {
//                   setForm((prev) => ({
//                     ...prev,
//                     employeeId: emp._id,
//                     name: prev.name || emp.fullName,
//                     email: prev.email || emp.email,
//                   }));
//                 }}
//               />

//               <input
//                 className="w-full border p-2 rounded"
//                 placeholder="Name"
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//               />

//               <input
//                 className="w-full border p-2 rounded"
//                 placeholder="Email"
//                 value={form.email}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//               />

//               <input
//                 type="password"
//                 className="w-full border p-2 rounded"
//                 placeholder={editingUser ? "Leave blank to keep unchanged" : "Password"}
//                 value={form.password}
//                 onChange={(e) => setForm({ ...form, password: e.target.value })}
//               />

//               {/* Roles */}
//               <div className="border rounded p-4 space-y-2">
//                 <h3 className="font-semibold mb-2">Roles</h3>
//                 {Object.keys(ROLE_OPTIONS).map((role) => (
//                   <label
//                     key={role}
//                     className="flex items-center justify-between cursor-pointer border rounded p-2"
//                   >
//                     <span>{role}</span>
//                     <input
//                       type="checkbox"
//                       checked={form.roles.includes(role)}
//                       onChange={() => toggleRole(role)}
//                     />
//                   </label>
//                 ))}
//               </div>

//               {/* Modules & permissions */}
//               {modulesList.length > 0 && (
//                 <div className="border rounded p-4 space-y-2">
//                   <h3 className="font-semibold mb-2">Modules & Permissions</h3>

//                   {modulesList.map((mod) => (
//                     <div key={mod} className="border rounded p-2">
//                       <label className="flex items-center justify-between">
//                         <span>{mod}</span>
//                         <input
//                           type="checkbox"
//                           checked={!!form.modules?.[mod]?.selected}
//                           onChange={() => toggleModule(mod)}
//                         />
//                       </label>

//                       {form.modules?.[mod]?.selected && (
//                         <div className="pl-4 pt-2 flex flex-wrap gap-2">
//                           {PERMISSIONS.map((p) => (
//                             <label key={p} className="flex items-center gap-1 text-sm">
//                               <input
//                                 type="checkbox"
//                                 checked={!!form.modules?.[mod]?.permissions?.[p]}
//                                 onChange={() => togglePermission(mod, p)}
//                               />
//                               {p}
//                             </label>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}

//               <div className="flex gap-2 pt-2">
//                 <button
//                   type="submit"
//                   className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
//                 >
//                   {editingUser ? "Update" : "Save"}
//                 </button>
//                 <button
//                   type="button"
//                   className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded"
//                   onClick={() => {
//                     setOpenModal(false);
//                     resetForm();
//                   }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

