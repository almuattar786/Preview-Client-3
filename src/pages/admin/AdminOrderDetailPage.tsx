import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  User,
  CreditCard,
  Package,
  FileText,
  Truck,
  XCircle,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Send,
  Calendar,
  Check
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminOrderDetailPageProps {
  order?: Order;
  orderId?: string;
  backLabel?: string;
  onBack: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
  onNavigateToCustomer?: (customerEmailOrId: string) => void;
}

interface ProcessedAuditMilestone {
  id: string;
  status: OrderStatus;
  rawTimestamp: string;
  dateObj: Date;
  dateString: string;
  timeString: string;
  relativeTime: string;
  note?: string;
  actor: string;
  isInitialPlacement: boolean;
  isCurrentStage: boolean;
  previousStatus?: OrderStatus;
}

/**
 * Format timestamp safely into date, time, and relative human string
 */
function parseSafeTimestamp(isoString?: string): {
  dateObj: Date;
  dateString: string;
  timeString: string;
  relativeTime: string;
} {
  let dateObj = new Date();
  if (isoString) {
    const parsed = new Date(isoString);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  const dateString = dateObj.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const timeString = dateObj.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relativeTime = 'Just now';
  if (diffMinutes < 1) {
    relativeTime = 'Just now';
  } else if (diffMinutes < 60) {
    relativeTime = `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    relativeTime = 'Yesterday';
  } else if (diffDays < 7) {
    relativeTime = `${diffDays} days ago`;
  } else {
    relativeTime = dateString;
  }

  return { dateObj, dateString, timeString, relativeTime };
}

/**
 * Get status visual configuration (color, badge, icon)
 */
function getStatusTheme(status: OrderStatus) {
  switch (status) {
    case 'Pending':
      return {
        bgLight: 'bg-amber-500/10 dark:bg-amber-500/15',
        border: 'border-amber-500/30 dark:border-amber-500/40',
        text: 'text-amber-700 dark:text-amber-300',
        dotBg: 'bg-amber-500',
        icon: Clock,
        label: 'Pending Ingestion'
      };
    case 'Confirmed':
      return {
        bgLight: 'bg-blue-500/10 dark:bg-blue-500/15',
        border: 'border-blue-500/30 dark:border-blue-500/40',
        text: 'text-blue-700 dark:text-blue-300',
        dotBg: 'bg-blue-500',
        icon: ShieldCheck,
        label: 'Order Confirmed'
      };
    case 'Shipped':
      return {
        bgLight: 'bg-purple-500/10 dark:bg-purple-500/15',
        border: 'border-purple-500/30 dark:border-purple-500/40',
        text: 'text-purple-700 dark:text-purple-300',
        dotBg: 'bg-purple-500',
        icon: Truck,
        label: 'Shipped / In Transit'
      };
    case 'Delivered':
      return {
        bgLight: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        border: 'border-emerald-500/30 dark:border-emerald-500/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        dotBg: 'bg-emerald-500',
        icon: CheckCircle2,
        label: 'Delivered & Settled'
      };
    case 'Cancelled':
      return {
        bgLight: 'bg-rose-500/10 dark:bg-rose-500/15',
        border: 'border-rose-500/30 dark:border-rose-500/40',
        text: 'text-rose-700 dark:text-rose-300',
        dotBg: 'bg-rose-500',
        icon: XCircle,
        label: 'Order Cancelled'
      };
    default:
      return {
        bgLight: 'bg-stone-500/10 dark:bg-stone-500/15',
        border: 'border-stone-500/30 dark:border-stone-500/40',
        text: 'text-stone-700 dark:text-stone-300',
        dotBg: 'bg-[#9a7229]',
        icon: Clock,
        label: status
      };
  }
}

export const AdminOrderDetailPage: React.FC<AdminOrderDetailPageProps> = ({
  order,
  orderId,
  backLabel,
  onBack,
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {},
  onUpdateOrder = (_updatedOrder?: Order) => {},
  onNavigateToCustomer
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order || null);
  const [loading, setLoading] = useState<boolean>(!order);
  const [timelineRefreshing, setTimelineRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeStatusSelection, setActiveStatusSelection] = useState<OrderStatus | null>(null);

  // Active target identifier
  const activeIdentifier = orderId || order?.id || order?.orderNumber;

  const fetchOrderDetails = useCallback(async (idToFetch: string, isSilentRefresh = false) => {
    if (!idToFetch) {
      setError('No order identifier was provided.');
      setLoading(false);
      return;
    }

    if (isSilentRefresh) {
      setTimelineRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await apiFetch<{ success: boolean; order?: Order; message?: string }>(
        `/api/orders/${encodeURIComponent(idToFetch)}`
      );
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setError(null);
      } else {
        setError(res.message || 'Order was not found in the database.');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to load order details from server.';
      setError(errMsg);
      onShowToast(errMsg, 'error');
    } finally {
      setLoading(false);
      setTimelineRefreshing(false);
    }
  }, [onShowToast]);

  // Load fresh order on mount or whenever identifier changes
  useEffect(() => {
    if (activeIdentifier) {
      fetchOrderDetails(activeIdentifier);
    } else if (order) {
      setCurrentOrder(order);
      setLoading(false);
      setError(null);
    } else {
      setLoading(false);
      setError('No order identifier was provided.');
    }
  }, [activeIdentifier, fetchOrderDetails, order]);

  // Handle Lifecycle Status & Fulfillment Audit Note Submission
  const handleStatusUpdate = async (targetStatus: OrderStatus, customNote?: string) => {
    if (!currentOrder) return;
    const orderRefId = currentOrder.id || currentOrder.orderNumber;
    setUpdating(true);

    const noteToSubmit = customNote !== undefined 
      ? customNote.trim() 
      : statusNote.trim();

    try {
      const res = await apiFetch<{ success: boolean; order: Order; message?: string }>(
        `/api/orders/${encodeURIComponent(orderRefId)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: targetStatus,
            note: noteToSubmit || `Status updated to ${targetStatus} by Admin.`
          })
        }
      );

      if (res.success && res.order) {
        setCurrentOrder(res.order);
        onUpdateOrder(res.order);
        onShowToast(
          noteToSubmit 
            ? `Order updated to ${targetStatus} and audit note logged.` 
            : `Order status successfully updated to ${targetStatus}.`,
          'success'
        );
        setStatusNote('');
        setActiveStatusSelection(null);
      } else {
        throw new Error(res.message || 'Status update failed.');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onShowToast(`${label} copied to clipboard.`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick Preset Audit Notes for Admins
  const quickNotesPresets = [
    '📞 Phone confirmed with customer for dispatch.',
    '📦 Inspected & securely packed at Lahore facility.',
    '🚚 Handed over to Trax Courier for delivery.',
    '🚚 Handed over to TCS Express (Tracking updated).',
    '💵 Payment received via Cash on Delivery.'
  ];

  // Process and sort the Fulfillment Audit Timeline with complete data integrity
  const timelineMilestones = useMemo<ProcessedAuditMilestone[]>(() => {
    if (!currentOrder) return [];

    const rawHistory = Array.isArray(currentOrder.statusHistory) 
      ? [...currentOrder.statusHistory] 
      : [];

    const orderCreationTime = currentOrder.createdAt || new Date().toISOString();
    const orderCurrentStatus = currentOrder.orderStatus || 'Pending';

    // Verify if initial order placement is recorded
    const hasCreationRecord = rawHistory.some(
      (h) =>
        h.status === 'Pending' ||
        (h.note && h.note.toLowerCase().includes('placed'))
    );

    const fullHistory = [...rawHistory];

    if (!hasCreationRecord) {
      // Backfill initial order creation event at order creation timestamp
      fullHistory.unshift({
        status: 'Pending',
        timestamp: orderCreationTime,
        note: 'Order placed by customer via Cash on Delivery.'
      });
    }

    // Sort chronologically ascending (earliest to latest)
    const sorted = fullHistory.sort((a, b) => {
      const timeA = new Date(a.timestamp || orderCreationTime).getTime();
      const timeB = new Date(b.timestamp || orderCreationTime).getTime();
      return timeA - timeB;
    });

    // Deduplicate consecutive identical entries within 3 seconds
    const deduplicated: typeof sorted = [];
    for (const item of sorted) {
      const prev = deduplicated[deduplicated.length - 1];
      if (
        prev &&
        prev.status === item.status &&
        prev.note === item.note &&
        Math.abs(new Date(prev.timestamp).getTime() - new Date(item.timestamp).getTime()) < 3000
      ) {
        continue;
      }
      deduplicated.push(item);
    }

    // Map into processed milestones
    return deduplicated.map((hist, idx) => {
      const parsed = parseSafeTimestamp(hist.timestamp || orderCreationTime);
      const isInitialPlacement = idx === 0;
      const isCurrentStage = idx === deduplicated.length - 1;
      const prevItem = idx > 0 ? deduplicated[idx - 1] : undefined;

      let actor = 'Admin Fulfillment Operator';
      if (isInitialPlacement || (hist.note && hist.note.toLowerCase().includes('order placed'))) {
        actor = 'Automated Order Ingestion';
      }

      return {
        id: `milestone-${idx}-${hist.timestamp || Date.now()}`,
        status: (hist.status as OrderStatus) || orderCurrentStatus,
        rawTimestamp: hist.timestamp || orderCreationTime,
        dateObj: parsed.dateObj,
        dateString: parsed.dateString,
        timeString: parsed.timeString,
        relativeTime: parsed.relativeTime,
        note: hist.note,
        actor,
        isInitialPlacement,
        isCurrentStage,
        previousStatus: prevItem ? (prevItem.status as OrderStatus) : undefined
      };
    });
  }, [currentOrder]);

  // Loading State Skeleton
  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 bg-[#f8f6f0] dark:bg-[#0a0a0a] min-h-[600px] text-stone-900 dark:text-[#f5f5f1]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 hover:text-[#9a7229] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel || 'Back to Overview'}
        </button>
        <div className="h-28 bg-white dark:bg-[#1a1a1a] rounded-3xl animate-pulse border border-stone-200 dark:border-[#c5a059]/20" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white dark:bg-[#1a1a1a] rounded-3xl animate-pulse border border-stone-200 dark:border-[#c5a059]/20" />
          <div className="h-64 bg-white dark:bg-[#1a1a1a] rounded-3xl animate-pulse border border-stone-200 dark:border-[#c5a059]/20" />
        </div>
        <div className="h-72 bg-white dark:bg-[#1a1a1a] rounded-3xl animate-pulse border border-stone-200 dark:border-[#c5a059]/20" />
      </div>
    );
  }

  // Error or Not Found State
  if (error || !currentOrder) {
    return (
      <div className="max-w-xl mx-auto p-8 my-12 bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/30 rounded-3xl text-center space-y-6 shadow-md">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">
            Order Details Unavailable
          </h2>
          <p className="text-xs text-stone-600 dark:text-zinc-400 max-w-md mx-auto">
            {error || 'The requested order record could not be retrieved from the database.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-200 font-semibold text-xs uppercase tracking-wider hover:bg-stone-200 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel || 'Return to Directory'}</span>
          </button>
          {activeIdentifier && (
            <button
              onClick={() => fetchOrderDetails(activeIdentifier)}
              className="px-5 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Load</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Safe data properties extraction
  const orderNumber = currentOrder.orderNumber || currentOrder.id || 'N/A';
  const orderStatus = currentOrder.orderStatus || 'Pending';
  const orderDate = currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleString() : 'N/A';
  const customer = currentOrder.customer || { fullName: 'Unknown Customer', email: 'N/A', phone: 'N/A' };
  const shippingAddress = currentOrder.shippingAddress || {
    fullName: customer.fullName || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: 'N/A',
    city: 'N/A',
    postalCode: ''
  };
  const items = currentOrder.items || [];
  const subtotal = currentOrder.subtotal ?? items.reduce((acc, it) => acc + (it.subtotal || it.price * it.quantity), 0);
  const shippingFee = currentOrder.shippingFee ?? 0;
  const totalAmount = currentOrder.totalAmount ?? (subtotal + shippingFee);
  const paymentMethod = currentOrder.paymentMethod || 'Cash on Delivery';
  const paymentStatus = currentOrder.paymentStatus || 'Pending';

  const statusList: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  const currentStatusTheme = getStatusTheme(orderStatus);

  return (
    <div className="space-y-8 max-w-5xl mx-auto bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] transition-colors p-4 sm:p-6 md:p-8">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-zinc-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel || 'Back to Overview'}</span>
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-800 dark:text-zinc-200 hover:text-stone-900 dark:hover:text-white text-xs font-medium inline-flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
            <span>Print Invoice / Receipt</span>
          </button>
          {activeIdentifier && (
            <button
              onClick={() => fetchOrderDetails(activeIdentifier, true)}
              disabled={timelineRefreshing}
              className="p-2 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white shadow-sm transition-colors"
              title="Refresh order details and timeline"
            >
              <RefreshCw className={`w-4 h-4 text-[#9a7229] dark:text-[#c5a059] ${timelineRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Order Header & Lifecycle Control Banner */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1] tracking-wide">
                {orderNumber}
              </h1>
              <button
                onClick={() => copyToClipboard(orderNumber, 'Order Number')}
                className="p-1 text-stone-400 hover:text-[#9a7229] dark:hover:text-[#c5a059] transition-colors"
                title="Copy Order Number"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <span
                className={`text-xs font-semibold font-mono px-3.5 py-1 rounded-full border ${currentStatusTheme.bgLight} ${currentStatusTheme.border} ${currentStatusTheme.text} flex items-center gap-1.5`}
              >
                <span className={`w-2 h-2 rounded-full ${currentStatusTheme.dotBg}`} />
                <span>{orderStatus}</span>
              </span>
            </div>
            <div className="text-xs text-stone-500 dark:text-zinc-400 font-mono flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Placed on {orderDate}</span>
            </div>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-stone-200 dark:border-[#c5a059]/20">
            <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-500 uppercase tracking-widest block">
              Total Order Value
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#9a7229] dark:text-[#c5a059] font-mono">
              PKR {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Lifecycle Status Transition Bar */}
        <div className="bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#9a7229] dark:text-[#c5a059]" />
              <span>Update Fulfillment Lifecycle Status</span>
            </span>
            <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400">
              Active State: <strong className="text-[#9a7229] dark:text-[#c5a059]">{orderStatus}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {statusList.map((st) => {
              const isCurrent = orderStatus === st;
              const isSelected = activeStatusSelection === st;
              const theme = getStatusTheme(st);
              const IconComp = theme.icon;

              return (
                <button
                  key={st}
                  onClick={() => {
                    setActiveStatusSelection(st);
                    handleStatusUpdate(st);
                  }}
                  disabled={updating}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold font-mono transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] shadow-sm ring-2 ring-[#9a7229]/40'
                      : isSelected
                      ? 'bg-stone-200 dark:bg-zinc-700 text-stone-900 dark:text-white'
                      : 'bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 text-stone-700 dark:text-zinc-300 hover:border-[#9a7229] dark:hover:border-[#c5a059] hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span>{st}</span>
                  {isCurrent && <Check className="w-3 h-3 shrink-0 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Patron Information & Financial Settlement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patron & Delivery Address Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-3">
            <h3 className="text-sm font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] flex items-center gap-2">
              <User className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
              <span>Patron & Shipping Destination</span>
            </h3>
            {onNavigateToCustomer && (
              <button
                onClick={() => onNavigateToCustomer(customer.email || customer.fullName)}
                className="text-[11px] font-mono text-[#9a7229] dark:text-[#c5a059] hover:underline inline-flex items-center gap-1"
              >
                <span>Directory</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-3.5 text-xs text-stone-700 dark:text-zinc-300">
            <div>
              <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500 uppercase block">Patron Full Name</span>
              <strong className="text-sm font-serif font-bold text-stone-900 dark:text-[#f5f5f1] block">
                {customer.fullName}
              </strong>
            </div>

            <div className="flex items-start gap-2.5 bg-stone-50 dark:bg-[#0a0a0a] p-3 rounded-xl border border-stone-200 dark:border-[#c5a059]/10">
              <MapPin className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059] shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500 uppercase block">Delivery Address</span>
                <span className="font-medium text-stone-900 dark:text-zinc-100 block">{shippingAddress.address}</span>
                <span className="text-stone-600 dark:text-zinc-400 block font-mono">
                  {shippingAddress.city}
                  {shippingAddress.postalCode ? `, Postal Code: ${shippingAddress.postalCode}` : ''}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(`${shippingAddress.address}, ${shippingAddress.city}`, 'Address')}
                className="p-1 text-stone-400 hover:text-[#9a7229]"
                title="Copy Address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-stone-50 dark:bg-[#0a0a0a] p-3 rounded-xl border border-stone-200 dark:border-[#c5a059]/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500 uppercase block">Phone</span>
                  <a href={`tel:${customer.phone}`} className="font-mono text-stone-900 dark:text-zinc-200 hover:underline">
                    {customer.phone}
                  </a>
                </div>
                <button
                  onClick={() => copyToClipboard(customer.phone, 'Phone number')}
                  className="p-1 text-stone-400 hover:text-[#9a7229]"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-stone-50 dark:bg-[#0a0a0a] p-3 rounded-xl border border-stone-200 dark:border-[#c5a059]/10 flex items-center justify-between">
                <div className="space-y-0.5 truncate">
                  <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500 uppercase block">Email</span>
                  <a href={`mailto:${customer.email}`} className="text-stone-900 dark:text-zinc-200 hover:underline truncate block">
                    {customer.email}
                  </a>
                </div>
                <button
                  onClick={() => copyToClipboard(customer.email, 'Email address')}
                  className="p-1 text-stone-400 hover:text-[#9a7229]"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {shippingAddress.orderNotes && (
              <div className="p-3.5 rounded-xl bg-[#9a7229]/5 dark:bg-[#c5a059]/5 border border-[#9a7229]/20 dark:border-[#c5a059]/20 space-y-1">
                <span className="text-[10px] text-[#9a7229] dark:text-[#c5a059] uppercase font-mono font-bold block">
                  Patron Order Note:
                </span>
                <p className="text-stone-700 dark:text-zinc-300 italic">{shippingAddress.orderNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment & Financial Ledger Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
          <h3 className="text-sm font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            <span>Financials & Settlement</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between text-stone-600 dark:text-zinc-400">
              <span>Ordered Items Subtotal</span>
              <span className="text-stone-900 dark:text-zinc-200 font-medium">PKR {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-stone-600 dark:text-zinc-400">
              <span>Nationwide Courier Shipping</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {shippingFee === 0 ? 'FREE (Complimentary)' : `PKR ${shippingFee.toLocaleString()}`}
              </span>
            </div>

            <div className="border-t border-stone-200 dark:border-[#c5a059]/20 pt-3 flex justify-between text-base font-bold text-stone-900 dark:text-[#f5f5f1]">
              <span>Final Total Amount</span>
              <span className="text-xl font-serif text-[#9a7229] dark:text-[#c5a059]">
                PKR {totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/10 space-y-2 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-stone-500 dark:text-zinc-400 font-semibold">Payment Method</span>
                <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">{paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-stone-500 dark:text-zinc-400 font-semibold">Payment Status</span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Products Catalog Table */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h3 className="text-sm font-serif font-semibold text-stone-900 dark:text-[#f5f5f1] border-b border-stone-200 dark:border-[#c5a059]/20 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#9a7229] dark:text-[#c5a059]" />
            <span>Fragrance Order Items ({items.length})</span>
          </div>
        </h3>

        {items.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono py-4 text-center">
            No item records listed in this order.
          </p>
        ) : (
          <div className="divide-y divide-stone-200 dark:divide-[#c5a059]/10">
            {items.map((item, idx) => {
              const isBundle = item.isBundle || (item.selectedProducts && item.selectedProducts.length > 0);

              return (
                <div key={idx} className="py-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300'}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover bg-stone-100 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 shrink-0 shadow-sm"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-semibold text-sm text-stone-900 dark:text-[#f5f5f1]">{item.productName}</h4>
                          {isBundle && (
                            <span className="bg-[#9a7229]/15 dark:bg-[#c5a059]/20 text-[#9a7229] dark:text-[#c5a059] border border-[#9a7229]/30 dark:border-[#c5a059]/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                              Bundle Item
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                          Size: <span className="text-stone-700 dark:text-zinc-300 font-medium">{item.size}</span> • Quantity: <span className="text-stone-700 dark:text-zinc-300 font-medium">{item.quantity}</span> @ PKR {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-[#9a7229] dark:text-[#c5a059] text-sm sm:text-base">
                      PKR {(item.subtotal || item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>

                  {isBundle && item.selectedProducts && item.selectedProducts.length > 0 && (
                    <div className="pl-16 pt-1">
                      <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#141414] border border-stone-200 dark:border-[#c5a059]/20 space-y-1.5">
                        <div className="text-[10.5px] font-mono text-[#9a7229] dark:text-[#c5a059] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          <span>Custom Selected Fragrances ({item.selectedProducts.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {item.selectedProducts.map((frag, fIdx) => (
                            <div
                              key={`${frag.id}-${fIdx}`}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/15"
                            >
                              <img
                                src={frag.image || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=150'}
                                alt={frag.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-md object-cover bg-stone-100 dark:bg-[#0a0a0a]"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-serif font-medium text-stone-900 dark:text-[#f5f5f1] truncate">{frag.name}</p>
                                <p className="text-[9px] font-mono text-stone-500 dark:text-zinc-400">{frag.size || frag.category || '50ml'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
