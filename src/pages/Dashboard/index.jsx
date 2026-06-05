import { ShoppingCart, Package, Users, Palette } from "lucide-react";
import { useOrders, useProducts, useParties, useColors } from "../../hooks";
import { Link } from "react-router-dom";

const StatCard = ({ icon: Icon, label, value, to, color }) => (
  <Link to={to}
    className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center gap-4 hover:border-zinc-300 transition-colors">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-semibold text-zinc-900">{value ?? "—"}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  </Link>
);

export default function DashboardPage() {
  const { data: orders   = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const { data: parties  = [] } = useParties();
  const { data: colors   = [] } = useColors();

  const recentOrders = [...orders].slice(-5).reverse();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Overview of your order system</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ShoppingCart} label="Total Orders"   value={orders.length}   to="/orders"   color="bg-blue-50 text-blue-600" />
        <StatCard icon={Package}      label="Products"       value={products.length} to="/products" color="bg-purple-50 text-purple-600" />
        <StatCard icon={Users}        label="Parties"        value={parties.length}  to="/parties"  color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Palette}      label="Colors"         value={colors.length}   to="/colors"   color="bg-amber-50 text-amber-600" />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-10 text-center text-zinc-400 text-sm">No orders yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-zinc-500">Order #</th>
                <th className="px-5 py-3 text-xs font-medium text-zinc-500">Party</th>
                <th className="px-5 py-3 text-xs font-medium text-zinc-500">Date</th>
                <th className="px-5 py-3 text-xs font-medium text-zinc-500">Marka</th>
                <th className="px-5 py-3 text-xs font-medium text-zinc-500">Items</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id} className="border-t border-zinc-100">
                  <td className="px-5 py-3 font-medium text-zinc-900">#{o.id}</td>
                  <td className="px-5 py-3 text-zinc-600">{o.party_name}</td>
                  <td className="px-5 py-3 text-zinc-500">{o.date}</td>
                  <td className="px-5 py-3 text-zinc-500">{o.marka}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                      {o.product_order?.length ?? 0} items
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}