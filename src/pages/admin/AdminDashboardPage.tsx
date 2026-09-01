import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Package,
  AlertTriangle,
  Users,
  Plus,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { AdminStats, Order, OrderStatus } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminDashboardPageProps {
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  onOpenOrderDetails?: (order: Order) => void;
  onSelectOrder?: (orderId: string) => void;
  onOpenAddProduct?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  setCurrentTab,
  setActiveTab,
  onOpenOrderDetails,
  onSelectOrder,
  onOpenAddProduct = () => {},
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {}
}) => {
  const changeTab = setCurrentTab || setActiveTab || (() => {});
  const handleViewOrder = (order: Order) => {
    if (onOpenOrderDetails) {
      onOpenOrderDetails(order);
    } else if (onSelectOrder) {
      onSelectOrder(order.id);
    }
  };
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; stats: AdminStats }>('/api/admin/stats');
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, note: `Status updated via Admin Dashboard` })
      });
      if (res.success) {
        onShowToast(`Order status updated to ${newStatus}.`, 'success');
        fetchStats();
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update order status.', 'error');
    }
  };

  if (loading || !stats) {
    return (
      <div className="space-y-6 bg-[#f8f6f0] dark:bg-[#0a0a0a] p-2 sm:p-4 rounded-2xl transition-colors">
        <div className="h-8 w-48 bg-stone-200 dark:bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-white dark:bg-[#1a1a1a] animate-pulse border border-stone-200 dark:border-[#c5a059]/10 shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-1 sm:p-2">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#c5a059]/20 pb-6">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">Maison Executive</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">Admin Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white shadow-sm"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          </button>
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-colors flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Fragrance</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-2 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-xs text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
            <span>Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#9a7229] dark:text-[#c5a059] font-mono">
            Rs. {stats.totalSales.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-zinc-500 font-light">Calculated from valid non-cancelled orders</p>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-xs text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] font-mono">
            {stats.totalOrders}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-zinc-500 font-light">All historical customer checkout records</p>
        </div>

        {/* Pending Orders */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-xs text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
            <span>Pending Action</span>
            <Clock className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#9a7229] dark:text-[#c5a059] font-mono">
            {stats.pendingOrders} Orders
          </div>
          <p className="text-[11px] text-stone-500 dark:text-zinc-500 font-light">Awaiting confirmation or dispatch</p>
        </div>

        {/* Active Products */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-xs text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
            <span>Active Products</span>
            <Package className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] font-mono">
            {stats.totalProducts} Fragrances
          </div>
          <p className="text-[11px] text-stone-500 dark:text-zinc-500 font-light">Live in customer store catalog</p>
        </div>

        {/* Low Stock Warning */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-xs text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
            <span>Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-rose-600 dark:text-rose-400 font-mono">
            {stats.lowStockCount} Items
          </div>
          <p className="text-[11px] text-stone-500 dark:text-zinc-500 font-light">Stock quantity ≤ 5 units</p>
        </div>

        {/* Total Customers */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-xs text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
            <span>Customer Base</span>
            <Users className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] font-mono">
            {stats.totalCustomers} Patrons
          </div>
          <p className="text-[11px] text-stone-500 dark:text-zinc-500 font-light">Unique customer profiles</p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
          <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-[#f5f5f1]">Recent Customer Orders</h2>
          <button
            onClick={() => changeTab('admin-orders')}
            className="text-xs font-semibold uppercase tracking-wider text-[#9a7229] dark:text-[#c5a059] hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-500 dark:text-zinc-500 font-light">No customer orders placed yet.</div>
        ) : (
          <div className="space-y-3">
            {/* Mobile View: Touch Cards */}
            <div className="block md:hidden space-y-2.5">
              {stats.recentOrders.map((ord) => {
                const total = ord.totalAmount ?? (ord as any).total ?? 0;
                return (
                  <div
                    key={ord.id || ord.orderNumber}
                    onClick={() => handleViewOrder(ord)}
                    role="button"
                    tabIndex={0}
                    className="p-4 bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl hover:border-[#9a7229] dark:hover:border-[#c5a059] cursor-pointer transition-all space-y-2 shadow-xs active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#9a7229] dark:text-[#c5a059]">
                        {ord.orderNumber}
                      </span>
                      <span className="font-mono font-bold text-xs text-stone-900 dark:text-[#f5f5f1]">
                        PKR {total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-900 dark:text-zinc-100">{ord.customer?.fullName}</span>
                      <span className="text-stone-500 dark:text-zinc-400 font-mono text-[11px]">{ord.shippingAddress?.city}</span>
                    </div>

                    <div
                      className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-[#c5a059]/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={ord.orderStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(ord.id || ord.orderNumber, e.target.value as OrderStatus);
                        }}
                        className={`text-[11px] font-sans font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          ord.orderStatus === 'Pending'
                            ? 'bg-[#9a7229]/10 text-[#9a7229] dark:text-[#c5a059] border-[#9a7229]/30'
                            : ord.orderStatus === 'Confirmed'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                            : ord.orderStatus === 'Shipped'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                            : ord.orderStatus === 'Delivered'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <option value="Pending" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Pending</option>
                        <option value="Confirmed" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Confirmed</option>
                        <option value="Shipped" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Shipped</option>
                        <option value="Delivered" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Delivered</option>
                        <option value="Cancelled" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Cancelled</option>
                      </select>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#9a7229] dark:text-[#c5a059]">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-stone-600 dark:text-zinc-400 uppercase bg-stone-100 dark:bg-[#0a0a0a] border-b border-stone-200 dark:border-[#c5a059]/20">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-[#c5a059]/10 text-stone-700 dark:text-zinc-300">
                  {stats.recentOrders.map((ord) => {
                    const total = ord.totalAmount ?? (ord as any).total ?? 0;
                    return (
                      <tr
                        key={ord.id || ord.orderNumber}
                        onClick={() => handleViewOrder(ord)}
                        className="hover:bg-stone-50 dark:hover:bg-[#0a0a0a]/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 text-[#9a7229] dark:text-[#c5a059] font-bold group-hover:underline">{ord.orderNumber}</td>
                        <td className="py-3 px-4 font-sans font-medium text-stone-900 dark:text-zinc-200">{ord.customer.fullName}</td>
                        <td className="py-3 px-4">{ord.shippingAddress.city}</td>
                        <td className="py-3 px-4 font-bold text-stone-900 dark:text-[#f5f5f1]">PKR {total.toLocaleString()}</td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={ord.orderStatus}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(ord.id || ord.orderNumber, e.target.value as OrderStatus);
                            }}
                            className={`text-[11px] font-sans font-semibold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${
                              ord.orderStatus === 'Pending'
                                ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059]'
                                : ord.orderStatus === 'Confirmed'
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
                                : ord.orderStatus === 'Shipped'
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300'
                                : ord.orderStatus === 'Delivered'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            <option value="Pending" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Pending</option>
                            <option value="Confirmed" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Confirmed</option>
                            <option value="Shipped" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Shipped</option>
                            <option value="Delivered" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Delivered</option>
                            <option value="Cancelled" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(ord);
                            }}
                            className="px-2.5 py-1 rounded bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 hover:bg-[#9a7229]/10 dark:hover:bg-[#c5a059]/20 text-stone-800 dark:text-zinc-200 text-[11px] font-sans"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Warning List */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-500/20 pb-3">
            <h2 className="text-sm font-serif font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Low Stock Replenishment Required</span>
            </h2>
            <button
              onClick={() => changeTab('admin-inventory')}
              className="text-xs font-mono text-rose-600 dark:text-rose-400 hover:underline"
            >
              Inventory Control →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.lowStockProducts.map((p) => (
              <div key={p.id} className="p-3.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 flex items-center justify-between gap-3 text-xs shadow-sm">
                <div className="truncate">
                  <div className="font-semibold text-stone-900 dark:text-zinc-200 truncate">{p.name}</div>
                  <div className="text-[10px] font-mono text-stone-500 dark:text-zinc-500">SKU: {p.sku}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">{p.stock} left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
