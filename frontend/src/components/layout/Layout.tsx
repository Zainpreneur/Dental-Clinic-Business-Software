import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊", exact: true },
  { to: "/patients", label: "Patients", icon: "🧑‍⚕️" },
  { to: "/appointments", label: "Appointments", icon: "📅" },
  { to: "/treatments", label: "Treatments", icon: "🦷" },
  { to: "/invoices", label: "Billing", icon: "💳" },
  { to: "/inventory", label: "Inventory", icon: "📦" },
  { to: "/staff", label: "Staff", icon: "👥", adminOnly: true },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span>🦷</span> Dental Clinic
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Business Management</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === "ADMIN")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="text-sm font-medium text-white truncate">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-slate-400">{user?.role}</div>
          <button onClick={handleLogout} className="mt-3 w-full btn-secondary bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
