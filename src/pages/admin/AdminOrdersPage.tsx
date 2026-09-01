import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, RefreshCw, ChevronRight, Phone, Calendar, ShoppingBag, User } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminOrdersPageProps {
  onOpenOrderDetails?: (order: Order) => void;
  onSelectOrder?: (orderId: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminOrdersPage: React.FC<AdminOrdersPageProps> = ({
  onOpenOrderDetails,
  onSelectOrder,
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {}
}) => {
  const handleViewOrder = (order: Order) => {
    if (onOpenOrderDetails) {
      onOpenOrderDetails(order);
    } else if (onSelectOrder) {
      onSelectOrder(order.id || order.orderNumber);
    }
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter && statusFilter !== 'All') queryParams.append('status', statusFilter);

      const res = await apiFetch<{ success: boolean; orders: Order[] }>(`/api/orders?${queryParams.toString()}`);
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, note: `Status updated by Admin` })
      });

      if (res.success) {
        onShowToast(`Order status updated to ${newStatus}.`, 'success');
        fetchOrders();
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update order status.', 'error');
    }
  };

  const statusOptions = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-[#9a7229]/10 dark:bg-[#c5a059]/10 border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[#9a7229] dark:text-[#c5a059]';
      case 'Confirmed':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300';
      case 'Shipped':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300';
      case 'Delivered':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
      case 'Cancelled':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300';
      default:
        return 'bg-stone-100 dark:bg-zinc-800 border-stone-300 text-stone-700 dark:text-zinc-300';
    }
  };

  return (
    <div className="space-y-6 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-2 sm:p-4 md:p-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-6">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">Maison Fulfillment</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Customer Orders {orders.length > 0 && `(${orders.length})`}
          </h1>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white shadow-sm w-fit inline-flex items-center gap-2 text-xs font-medium"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 text-[#9a7229] dark:text-[#c5a059] ${loading ? 'animate-spin' : ''}`} />
          <span className="sm:hidden">Refresh Orders</span>
        </button>
      </div>

      {/* Search & Filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, Name, Phone, or Email..."
            className="w-full bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059] pl-10 shadow-sm"
          />
          <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3.5 top-3" />
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl px-3 py-2 text-xs shadow-sm">
          <Filter className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0" />
          <span className="text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-mono text-[10px]">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent text-stone-900 dark:text-[#f5f5f1] font-medium focus:outline-none cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 sm:h-16 rounded-2xl bg-white dark:bg-[#1a1a1a] animate-pulse border border-stone-200 dark:border-[#c5a059]/10 shadow-sm" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-12 text-center space-y-2 shadow-sm">
          <h3 className="text-lg font-serif text-stone-900 dark:text-[#f5f5f1]">No Orders Match Your Search</h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono">Try adjusting or clearing your search filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile / Small-screen view: Touch-Optimized Cards (No Horizontal Scrolling Needed) */}
          <div className="block md:hidden space-y-3">
            <div className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 px-1 flex items-center justify-between">
              <span>Tap any order card to inspect details</span>
              <span>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
            </div>

            {orders.map((ord) => {
              const customerName = ord.customer?.fullName || (ord as any).customerFullName || 'Customer';
              const customerPhone = ord.customer?.phone || (ord as any).customerPhone || 'N/A';
              const total = ord.totalAmount ?? (ord as any).total ?? 0;
              const itemCount = ord.items?.length || 0;
              const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'N/A';

              return (
                <div
                  key={ord.id || ord.orderNumber}
                  onClick={() => handleViewOrder(ord)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewOrder(ord);
                    }
                  }}
                  className="group relative bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[#9a7229] dark:hover:border-[#c5a059] transition-all cursor-pointer select-none active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#9a7229]/30"
                >
                  {/* Card Header: Order #, Date & Chevron */}
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-[#c5a059]/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#9a7229] dark:text-[#c5a059] group-hover:underline">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {dateStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#9a7229] dark:text-[#c5a059] font-medium">
                      <span className="text-[11px] font-mono opacity-80 group-hover:opacity-100">View</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {/* Customer Information Area */}
                  <div className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-serif font-bold text-base text-stone-900 dark:text-[#f5f5f1] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500 shrink-0" />
                          <span>{customerName}</span>
                        </div>
                        <div className="text-xs font-mono text-stone-600 dark:text-zinc-400 flex items-center gap-1.5 pl-5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{customerPhone}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-mono text-stone-500 dark:text-zinc-500 uppercase">Total</div>
                        <div className="font-mono font-bold text-base text-stone-900 dark:text-[#f5f5f1]">
                          PKR {total.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-zinc-400 pt-1">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-[#9a7229] dark:text-[#c5a059]" />
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                      {ord.shippingAddress?.city && (
                        <span>City: <strong className="text-stone-700 dark:text-zinc-300 font-medium">{ord.shippingAddress.city}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Status Selector with Event Isolation */}
                  <div
                    className="pt-2 border-t border-stone-100 dark:border-[#c5a059]/10 flex items-center justify-between gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] font-mono uppercase text-stone-400 dark:text-zinc-500 font-semibold">
                      Order Status:
                    </span>

                    <select
                      value={ord.orderStatus}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(ord.id || ord.orderNumber, e.target.value as OrderStatus);
                      }}
                      className={`text-xs font-sans font-semibold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition-colors shadow-sm ${getStatusBadgeStyle(ord.orderStatus)}`}
                    >
                      <option value="Pending" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Pending</option>
                      <option value="Confirmed" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Confirmed</option>
                      <option value="Shipped" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Shipped</option>
                      <option value="Delivered" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Delivered</option>
                      <option value="Cancelled" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Cancelled</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-stone-600 dark:text-zinc-400 uppercase bg-stone-100 dark:bg-[#0a0a0a] border-b border-stone-200 dark:border-[#c5a059]/20">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-[#c5a059]/10 text-stone-700 dark:text-zinc-300">
                  {orders.map((ord) => {
                    const customerName = ord.customer?.fullName || (ord as any).customerFullName || 'Customer';
                    const customerPhone = ord.customer?.phone || (ord as any).customerPhone || 'N/A';
                    const total = ord.totalAmount ?? (ord as any).total ?? 0;
                    const itemCount = ord.items?.length || 0;
                    const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'N/A';

                    return (
                      <tr
                        key={ord.id || ord.orderNumber}
                        onClick={() => handleViewOrder(ord)}
                        className="hover:bg-stone-50 dark:hover:bg-[#0a0a0a]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 text-[#9a7229] dark:text-[#c5a059] font-bold group-hover:underline">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 font-sans font-medium text-stone-900 dark:text-zinc-100">
                          {customerName}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 dark:text-zinc-400">{customerPhone}</td>
                        <td className="py-3.5 px-4 text-stone-500 dark:text-zinc-400 text-[11px]">
                          {dateStr}
                        </td>
                        <td className="py-3.5 px-4">{itemCount} items</td>
                        <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-[#f5f5f1]">
                          PKR {total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={ord.orderStatus}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(ord.id || ord.orderNumber, e.target.value as OrderStatus);
                            }}
                            className={`text-[11px] font-sans font-semibold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer transition-colors shadow-sm ${getStatusBadgeStyle(ord.orderStatus)}`}
                          >
                            <option value="Pending" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Pending</option>
                            <option value="Confirmed" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Confirmed</option>
                            <option value="Shipped" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Shipped</option>
                            <option value="Delivered" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Delivered</option>
                            <option value="Cancelled" className="bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-[#f5f5f1]">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(ord);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 hover:bg-[#9a7229]/10 dark:hover:bg-[#c5a059]/20 text-stone-800 dark:text-zinc-200 text-xs font-sans inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
