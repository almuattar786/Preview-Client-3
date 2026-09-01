import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Mail, Phone, ShoppingBag, Calendar, Eye, ArrowRight, Clock } from 'lucide-react';
import { Customer, Order } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminCustomersPageProps {
  onSelectOrder?: (orderId: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminCustomersPage: React.FC<AdminCustomersPageProps> = ({
  onSelectOrder,
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {}
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; customers: Customer[] }>(`/api/customers?search=${encodeURIComponent(search)}`);
      if (res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch customer directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    try {
      const res = await apiFetch<{ success: boolean; customer: Customer; orders: Order[] }>(`/api/customers/${cust.id}`);
      if (res.success) {
        setCustomerOrders(res.orders || []);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load customer purchase history.', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderClick = (ord: Order) => {
    const targetId = ord.id || ord.orderNumber;
    if (targetId && onSelectOrder) {
      onSelectOrder(targetId);
    }
  };

  return (
    <div className="space-y-8 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen transition-colors p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">CRM & Relationships</span>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">Customer Directory</h1>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-xs font-semibold text-stone-800 dark:text-zinc-200 uppercase tracking-wider transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-[#9a7229] dark:text-[#c5a059] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Counter */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full bg-stone-50 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/20 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-[#f5f5f1] placeholder-stone-400 dark:placeholder-zinc-500 pl-10 focus:outline-none focus:border-[#9a7229] dark:focus:border-[#c5a059]"
          />
          <Search className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] absolute left-3 top-3" />
        </div>
        <div className="text-xs font-mono text-stone-600 dark:text-zinc-400">
          Total Registered Patrons: <span className="text-[#9a7229] dark:text-[#c5a059] font-bold">{customers.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-[#9a7229] dark:text-[#c5a059] animate-spin mx-auto" />
              <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono">Loading patrons...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-stone-400 dark:text-zinc-600 mx-auto" />
              <p className="text-xs text-stone-500 dark:text-zinc-400">No customers found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 dark:bg-[#0a0a0a] text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider font-mono border-b border-stone-200 dark:border-[#c5a059]/20">
                  <tr>
                    <th className="py-3.5 px-4">Patron Name</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Total Orders</th>
                    <th className="py-3.5 px-4 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-[#c5a059]/10 text-stone-700 dark:text-zinc-300">
                  {customers.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/15' : 'hover:bg-stone-50 dark:hover:bg-[#0a0a0a]/50'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-stone-900 dark:text-zinc-100">{c.fullName}</td>
                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-stone-700 dark:text-zinc-300">
                            <Mail className="w-3 h-3 text-[#9a7229] dark:text-[#c5a059]" /> {c.email}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-stone-500 dark:text-zinc-500 font-mono">
                            <Phone className="w-3 h-3 text-stone-400 dark:text-zinc-500" /> {c.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium">{c.totalOrders ?? 0} orders</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#9a7229] dark:text-[#c5a059]">
                          PKR {(c.totalSpent ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Customer Drawer */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 space-y-6 shadow-sm h-fit">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
                <span className="text-[10px] font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-widest">Patron Profile</span>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">{selectedCustomer.fullName}</h3>
                <p className="text-xs text-stone-600 dark:text-zinc-400 font-mono flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3 text-[#9a7229] dark:text-[#c5a059]" /> {selectedCustomer.email}
                </p>
                <p className="text-xs text-stone-600 dark:text-zinc-400 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-stone-400 dark:text-zinc-500" /> {selectedCustomer.phone}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 dark:bg-[#0a0a0a] p-3 rounded-xl border border-stone-200 dark:border-[#c5a059]/20">
                  <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-500 uppercase block">Total Orders</span>
                  <span className="text-base font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">{selectedCustomer.totalOrders ?? 0}</span>
                </div>
                <div className="bg-stone-50 dark:bg-[#0a0a0a] p-3 rounded-xl border border-stone-200 dark:border-[#c5a059]/20">
                  <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-500 uppercase block">Total Spent</span>
                  <span className="text-base font-serif font-bold text-[#9a7229] dark:text-[#c5a059]">
                    PKR {(selectedCustomer.totalSpent ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-serif font-semibold text-[#9a7229] dark:text-[#c5a059] flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> Purchase History
                  </h4>
                  <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400">
                    {customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="py-4 text-center">
                    <RefreshCw className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] animate-spin mx-auto" />
                    <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 block mt-1">Loading history...</span>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 text-center">
                    <p className="text-xs text-stone-500 dark:text-zinc-500 font-mono">No order records found for this patron.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {customerOrders.map((ord) => {
                      const amount = ord.totalAmount ?? (ord as any).total ?? 0;
                      const status = ord.orderStatus || (ord as any).status || 'Pending';
                      return (
                        <div
                          key={ord.id || ord.orderNumber}
                          onClick={() => handleOrderClick(ord)}
                          className="group p-3 bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 rounded-xl hover:border-[#9a7229] dark:hover:border-[#c5a059] cursor-pointer transition-all flex items-center justify-between text-xs hover:shadow-sm"
                        >
                          <div className="space-y-0.5">
                            <div className="font-mono text-[#9a7229] dark:text-[#c5a059] font-bold group-hover:underline flex items-center gap-1.5">
                              <span>{ord.orderNumber}</span>
                              <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#9a7229] dark:text-[#c5a059]" />
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-zinc-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(ord.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right space-y-0.5">
                            <div className="font-mono font-bold text-stone-800 dark:text-zinc-200">
                              PKR {amount.toLocaleString()}
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full inline-block font-semibold ${
                                status === 'Delivered'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : status === 'Cancelled'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : status === 'Shipped'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                  : status === 'Confirmed'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : 'bg-[#9a7229]/10 text-[#9a7229] dark:text-[#c5a059]'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-2 text-stone-500 dark:text-zinc-500">
              <Users className="w-8 h-8 text-stone-400 dark:text-zinc-600 mx-auto" />
              <p className="text-xs">Select a patron from the directory list to view their purchase history & details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
