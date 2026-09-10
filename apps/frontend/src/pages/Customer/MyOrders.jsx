import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import socket from '../../socket';
import EmptyState from '../../components/common/EmptyState';
import { notification } from 'antd';
import {
  HistoryOutlined,
  CalendarOutlined,
  RightOutlined,
  LeftOutlined,
} from '@ant-design/icons';

export default function MyOrders() {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (date = dateFilter, page = currentPage) => {
    try {
      setLoading(true);
      const offset = (page - 1) * ordersPerPage;
      let query = `?limit=${ordersPerPage}&offset=${offset}`;
      if (date) query += `&date=${date}`;
      const response = await axios.get(`/orders/me${query}`);
      if (response.data.success) {
        setOrders(response.data.data || []);
        setTotalOrders(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchOrders();
      const handleUpdate = (data) => {
        notification.info({
          message: 'Order Status Update',
          description: `Order #${data.orderId.slice(0, 8)} is now ${data.status.replace(/_/g, ' ')}`,
        });
        fetchOrders();
      };
      socket.on('ORDER_STATUS_UPDATED', handleUpdate);
      return () => socket.off('ORDER_STATUS_UPDATED', handleUpdate);
    }
  }, [user, dateFilter, currentPage]);

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  const statusColor = (status) => {
    if (status === 'completed' || status === 'delivered') return 'bg-emerald-100 text-emerald-700';
    if (status === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-orange-100 text-orange-700';
  };

  return (
    <div className="pb-16 animate-fade-in -mt-16">

      {/* ── FULL-BLEED HERO BANNER ── */}
      <div className="relative bg-neutral-900 text-white pt-24 pb-16 border-b border-neutral-800 overflow-hidden">
        <img
          src="/food_banners/breakfast-banner.jpg"
          alt="My Orders Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              📋 Order History
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">My Orders</h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Browse all your past and present food delivery orders.
            </p>
          </div>

          <div className="hidden lg:block text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs shadow-xl">
            <p className="text-xs font-serif italic text-amber-300 leading-snug">
              "One cannot think well, love well, sleep well, if one has not dined well."
            </p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
              — Virginia Woolf
            </p>
          </div>
        </div>
      </div>

      {/* ── ORDERS CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* Toolbar: stats + date filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <HistoryOutlined className="text-xl" />
            </div>
            <div>
              <p className="text-base font-extrabold text-neutral-900">
                {totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'} Total
              </p>
              <p className="text-xs text-neutral-400 font-medium">Your past food delivery receipts</p>
            </div>
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-sm">
            <CalendarOutlined className="text-neutral-400 text-sm" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs font-bold text-neutral-700 focus:outline-none bg-transparent"
            />
            {dateFilter && (
              <button
                onClick={() => { setDateFilter(''); setCurrentPage(1); }}
                className="ml-1 text-xs text-orange-500 font-bold hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-neutral-100 rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white hover:bg-neutral-50 border border-neutral-200/70 hover:border-orange-300 rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                {/* Left info */}
                <div className="flex items-center gap-4">
                  {/* Restaurant initial avatar */}
                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 font-black text-lg flex items-center justify-center flex-shrink-0 border border-orange-100">
                    {(order.Restaurant?.name || 'O').charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-neutral-900 text-base leading-tight">
                      {order.Restaurant?.name || 'Orderly Partner'}
                    </h4>
                    <p className="text-xs text-neutral-500 font-medium">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      &nbsp;·&nbsp;
                      {order.OrderItems?.length || 0} item{(order.OrderItems?.length || 0) !== 1 ? 's' : ''}
                      &nbsp;·&nbsp;
                      <span className="font-mono text-neutral-400">#{order.id.slice(0, 8)}</span>
                    </p>
                  </div>
                </div>

                {/* Right: status + total */}
                <div className="flex items-center justify-between sm:justify-end gap-5 sm:flex-shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${statusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-black text-base text-neutral-900 whitespace-nowrap">
                    ${Number(order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-4 flex justify-center items-center gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-orange-500 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <LeftOutlined />
                </button>
                <span className="text-xs font-bold text-neutral-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2.5 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-orange-500 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <RightOutlined />
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No Orders Found"
            description={dateFilter ? 'No orders match the selected date. Try clearing the filter.' : "You haven't placed any orders yet."}
          />
        )}

      </div>
    </div>
  );
}
