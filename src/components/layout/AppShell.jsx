import { NavLink, useLocation } from "react-router-dom";
import {
  Package, Users, UserCheck, Palette,
  ShoppingCart, LayoutDashboard, ChevronRight
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/",        icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Orders",
    items: [
      { to: "/orders",       icon: ShoppingCart, label: "All Orders" },
    ],
  },
  {
    label: "Masters",
    items: [
      { to: "/products", icon: Package,    label: "Products" },
      { to: "/parties",  icon: Users,      label: "Parties" },
      { to: "/colors",   icon: Palette,    label: "Colors" },
    ],
  },
];

const SidebarLink = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={to === "/"}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-zinc-900 text-white font-medium"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
      }`
    }
  >
    <Icon size={16} />
    {label}
  </NavLink>
);

export default function AppShell({ children }) {
  return (
    <div className="flex h-screen bg-zinc-50 font-sans">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center">
              <Package size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-zinc-900">ShoeOrder</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100">
          <p className="text-xs text-zinc-400">v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}