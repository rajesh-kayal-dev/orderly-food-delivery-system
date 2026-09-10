import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import socket from '../../socket';
import EmptyState from '../../components/common/EmptyState';
import { 
  CheckCircleFilled, 
  ClockCircleOutlined, 
  CarOutlined, 
  ShopOutlined, 
  CheckOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
  RadarChartOutlined
} from '@ant-design/icons';
import { message, Modal } from 'antd';

const ORDER_STEPS = [
  { id: 'pending', label: 'Order Placed', icon: <ClockCircleOutlined /> },
  { id: 'accepted', label: 'Accepted', icon: <ShopOutlined /> },
  { id: 'preparing', label: 'Preparing', icon: <ClockCircleOutlined /> },
  { id: 'picked_up', label: 'On the Way', icon: <CarOutlined /> },
  { id: 'delivered', label: 'Delivered', icon: <CheckOutlined /> }
];

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }

    socket.on('ORDER_STATUS_UPDATED', (data) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.orderId 
            ? { 
                ...order, 
                status: data.status,
                delivery_partner_id: data.deliveryPartner ? data.deliveryPartner.id : order.delivery_partner_id,
                DeliveryPartner: data.deliveryPartner || order.DeliveryPartner
              } 
            : order
        )
      );
      if (data.status === 'cancelled') {
        message.warning(`Order #${data.orderId.slice(0, 8)} has been cancelled.`);
      } else if (data.status === 'delivered') {
        message.success(`Order #${data.orderId.slice(0, 8)} has arrived!`);
      } else if (data.status === 'completed') {
        fetchOrders();
      } else {
        message.info(`Order status updated to ${data.status.replace('_', ' ')}`);
      }
    });

    return () => {
      socket.off('ORDER_STATUS_UPDATED');
    };
  }, [user?.id, token]);

  const fetchOrders = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get('/orders/me');
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (token) {
        message.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (orderId) => {
    try {
      await axios.put(`/orders/${orderId}/status`, { status: 'completed' });
      message.success('Order tracking completed.');
      fetchOrders();
    } catch (error) {
      message.error('Failed to close tracking');
    }
  };

  const handleCancelOrder = (orderId) => {
    Modal.confirm({
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order?',
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const response = await axios.put(`/orders/${orderId}/cancel`, {});
          if (response.data.success) {
            message.success('Order cancelled successfully');
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === orderId ? { ...order, status: 'cancelled' } : order
              )
            );
          }
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to cancel order');
        }
      }
    });
  };

  const getStepStatus = (orderStatus, stepId) => {
    if (orderStatus === 'cancelled') return 'cancelled';
    if (orderStatus === 'completed') return 'completed';
    
    const stepIndex = ORDER_STEPS.findIndex(s => s.id === stepId);
    const currentIndex = ORDER_STEPS.findIndex(s => s.id === orderStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-semibold text-sm">Loading active orders...</p>
      </div>
    );
  }

  const activeOrders = orders.filter(o => 
    o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'refunded'
  );

  return (
    <div className="pb-16 animate-fade-in -mt-16">

      {/* ── FULL-BLEED HERO BANNER (same style as Restaurants & Menu) ── */}
      <div className="relative bg-neutral-900 text-white pt-24 pb-16 border-b border-neutral-800 overflow-hidden">
        <img
          src="/food_banners/spices-banner.jpg"
          alt="Order Tracking Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              ⚡ Live Real-time Tracking
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Order Tracking</h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Stay up to date with every step of your delivery in real time.
            </p>
          </div>

          <div className="hidden lg:block text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs shadow-xl">
            <p className="text-xs font-serif italic text-amber-300 leading-snug">
              "Good food is like music you can taste, color you can smell."
            </p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
              — Gordon Ramsay
            </p>
          </div>
        </div>
      </div>

      {/* ── ORDERS CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {activeOrders.length === 0 ? (
          <div className="py-16 max-w-xl mx-auto">
            <EmptyState
              icon={<RadarChartOutlined className="text-orange-500" />}
              title="No Active Orders"
              description="You do not have any active orders currently being prepared or delivered."
            />
          </div>
        ) : (
          <div className="space-y-8">
            {activeOrders.map((order) => {
              const currentStepIdx = ORDER_STEPS.findIndex(s => s.id === order.status);
              const progressPercent = currentStepIdx >= 0 ? (currentStepIdx / (ORDER_STEPS.length - 1)) * 100 : 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-sm"
                >
                  {/* Order Header */}
                  <div className="p-6 bg-neutral-50 flex flex-wrap justify-between items-center border-b border-neutral-100 gap-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-neutral-900">{order.Restaurant?.name || 'Restaurant'}</h3>
                      <p className="text-xs font-semibold text-neutral-400">Order ID: #{order.id.slice(0, 8)}</p>
                    </div>
                    <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-orange-100 text-orange-700 uppercase tracking-wider">
                      {order.status === 'picked_up' ? 'ON THE WAY' : order.status === 'delivered' ? 'ARRIVED!' : order.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Status Progress Timeline */}
                  <div className="px-6 sm:px-12 py-8">
                    <div className="relative flex justify-between items-center">
                      {/* Track line */}
                      <div className="absolute top-5 left-0 w-full h-1 bg-neutral-100 rounded-full">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-700"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {ORDER_STEPS.map((step) => {
                        const status = getStepStatus(order.status, step.id);
                        return (
                          <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-sm font-bold
                              ${status === 'completed'
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                                : status === 'current'
                                ? 'bg-white border-orange-500 text-orange-500 scale-110 shadow-lg ring-4 ring-orange-100'
                                : 'bg-white border-neutral-200 text-neutral-400'}`}
                            >
                              {status === 'completed' ? <CheckOutlined /> : step.icon}
                            </div>
                            <span className={`mt-3 text-[10px] sm:text-xs font-bold text-center leading-tight ${
                              status === 'completed' || status === 'current' ? 'text-neutral-900' : 'text-neutral-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Details & Driver */}
                  <div className="p-6 bg-neutral-50/50 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Items breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Order Items</h4>
                      <ul className="text-xs text-neutral-700 space-y-2 border-b border-neutral-200/60 pb-3">
                        {order.OrderItems?.map((item) => (
                          <li key={item.id} className="flex justify-between font-medium">
                            <span>{item.quantity}x {item.MenuItem?.name}</span>
                            <span className="font-bold">${Number(item.subtotal || 0).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between items-center text-sm pt-1">
                        <span className="font-extrabold text-neutral-900">Total Paid</span>
                        <span className="font-black text-lg text-orange-600">
                          ${Number(order.total_amount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Driver / Actions */}
                    <div className="space-y-4">
                      {order.DeliveryPartner ? (
                        <div className="bg-orange-50/80 rounded-2xl p-4 border border-orange-100 space-y-3">
                          <h4 className="text-xs font-extrabold text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CarOutlined /> Delivery Driver
                          </h4>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center">
                              {order.DeliveryPartner?.User?.full_name?.charAt(0) || 'D'}
                            </div>
                            <div>
                              <p className="font-extrabold text-neutral-900 text-xs">
                                {order.DeliveryPartner?.User?.full_name || 'Assigned Driver'}
                              </p>
                              <p className="text-xs text-neutral-600 flex items-center gap-1 mt-0.5">
                                <PhoneOutlined /> {order.DeliveryPartner?.User?.phone_number || 'Contact via Orderly'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-neutral-100 rounded-2xl p-4 text-xs text-neutral-500 font-semibold">
                          ⏳ Finding nearby delivery partner...
                        </div>
                      )}

                      {order.status === 'delivered' && (
                        <button
                          onClick={() => {
                            Modal.confirm({
                              title: 'Confirm Delivery',
                              content: 'Have you received your food order in good condition?',
                              okText: 'Yes, Received!',
                              cancelText: 'Not yet',
                              onOk: () => handleAcknowledge(order.id)
                            });
                          }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircleFilled /> Confirm Receipt & Close
                        </button>
                      )}

                      {['pending', 'accepted'].includes(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <CloseCircleOutlined /> Cancel Order
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
