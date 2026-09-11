import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import { notification, Modal } from 'antd';
import { 
  ShopOutlined, 
  EnvironmentOutlined, 
  RocketOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  CarOutlined,
  ArrowRightOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BellOutlined,
  CloseOutlined
} from '@ant-design/icons';
import socket from '../../socket';
import AppMap from '../../pages/Map/Map';

// Real-time "Accept / Reject" toast for incoming delivery offers
function DeliveryOfferToast({ offer, onAccept, onReject, onDismiss }) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) { onDismiss(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 bg-white rounded-2xl shadow-2xl border-2 border-orange-400 p-4 animate-slide-up">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-base font-bold animate-pulse">
            🛵
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 leading-tight">New Delivery Offer!</p>
            <p className="text-[10px] text-slate-500 font-medium">Expires in {countdown}s</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 text-xs">
          <CloseOutlined />
        </button>
      </div>

      <div className="bg-slate-50 rounded-xl p-2.5 mb-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <ShopOutlined className="text-orange-500 text-xs shrink-0" />
          <span className="font-bold text-slate-800">{offer.restaurant?.name || offer.Restaurant?.name || 'Restaurant'}</span>
        </div>
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-emerald-500 text-xs shrink-0" />
          <span className="text-slate-600">{offer.address?.street || offer.Address?.street || 'Customer location'}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-orange-500 text-xs shrink-0" />
          <span className="font-black text-[#FF521C]">₹{(parseFloat(offer.delivery_fee) || 150).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onReject}
          className="flex-1 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors"
        >
          ✕ Reject
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-1.5 rounded-xl bg-[#FF521C] hover:bg-[#E04310] text-white text-xs font-bold transition-colors shadow-md shadow-orange-500/20"
        >
          ✓ Accept
        </button>
      </div>

      {/* Countdown bar */}
      <div className="mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-400 rounded-full transition-all duration-1000"
          style={{ width: `${(countdown / 30) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function DeliveryOrders() {
  const { profile, token } = useSelector(state => state.auth);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOffer, setPendingOffer] = useState(null);

  const isOnline = Boolean(profile?.is_available);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const [availableRes, activeRes] = await Promise.all([
        axios.get('/orders/deliveries/available'),
        axios.get('/orders/driver/me')
      ]);
      
      if (availableRes.data.success) {
        setAvailableRequests(availableRes.data.data || []);
      }
      if (activeRes.data.success) {
        setActiveDelivery(activeRes.data.data?.[0] || null);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id && token) {
      fetchDeliveries();

      socket.connect();
      if (isOnline) socket.emit('join_deliveries');

      const handleAvailableDelivery = (data) => {
        if (!isOnline) return;
        // Show the interactive accept/reject toast
        setPendingOffer(data);
        // Also refresh the list
        fetchDeliveries();
      };

      const handleReadyForPickup = (data) => {
        if (!isOnline) return;
        setPendingOffer(data);
        fetchDeliveries();
      };

      const handleOrderAccepted = (data) => {
        // Remove the order from available list if another driver took it
        setAvailableRequests(prev => prev.filter(r => r.id !== data.orderId));
        // Also dismiss the pending offer toast if it was for this order
        setPendingOffer(prev => (prev?.id === data.orderId ? null : prev));
      };

      const handleDriverAssigned = () => {
        fetchDeliveries();
      };

      socket.on('AVAILABLE_DELIVERY', handleAvailableDelivery);
      socket.on('ORDER_READY_FOR_PICKUP', handleReadyForPickup);
      socket.on('ORDER_ACCEPTED', handleOrderAccepted);
      socket.on('DRIVER_ASSIGNED', handleDriverAssigned);

      return () => {
        socket.off('AVAILABLE_DELIVERY', handleAvailableDelivery);
        socket.off('ORDER_READY_FOR_PICKUP', handleReadyForPickup);
        socket.off('ORDER_ACCEPTED', handleOrderAccepted);
        socket.off('DRIVER_ASSIGNED', handleDriverAssigned);
      };
    } else {
      setLoading(false);
    }
  }, [profile, token, isOnline]);

  const acceptRequest = async (orderId) => {
    try {
      // No need to pass driver_id — backend reads it from the JWT token (req.user.id)
      const { data } = await axios.put(`/orders/${orderId}/accept-delivery`);
      if (data.success) {
        notification.success({ message: 'Delivery Accepted!', description: 'Drive safely to the restaurant for pickup.' });
        setPendingOffer(null);
        fetchDeliveries();
      }
    } catch (error) {
      notification.error({ message: 'Error', description: error.response?.data?.message || 'Error accepting delivery' });
      console.error('Error accepting delivery:', error);
    }
  };

  const rejectRequest = (orderId) => {
    // Locally remove from available requests; no backend call needed for rejection
    setAvailableRequests(prev => prev.filter(r => r.id !== orderId));
    setPendingOffer(null);
    notification.info({ message: 'Delivery Rejected', description: 'The offer has been passed to the next available driver.' });
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const { data } = await axios.put(`/orders/${orderId}/status`, { status: newStatus });
      if (data.success) {
        notification.success({ message: 'Status Updated!', description: `Order marked as ${newStatus}!` });
        fetchDeliveries();
      }
    } catch (error) {
      notification.error({ message: 'Update Failed', description: 'Error updating delivery status' });
      console.error('Error updating status:', error);
    }
  };

  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center">
      <ReloadOutlined spin className="text-2xl text-[#FF521C] mb-3 opacity-60" />
      <p className="text-slate-400 font-bold text-xs">Syncing delivery tasks...</p>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-4 text-slate-800">
      {/* Real-time Accept/Reject Toast */}
      {pendingOffer && (
        <DeliveryOfferToast
          offer={pendingOffer}
          onAccept={() => acceptRequest(pendingOffer.id || pendingOffer.orderId)}
          onReject={() => rejectRequest(pendingOffer.id || pendingOffer.orderId)}
          onDismiss={() => setPendingOffer(null)}
        />
      )}

      {/* Offline Warning Banner */}
      {!isOnline && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-rose-500 text-lg">🔴</span>
          <div>
            <p className="text-xs font-black text-rose-700">You are currently Offline</p>
            <p className="text-[11px] text-rose-500">Go online from the Dashboard to receive delivery offers.</p>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            Available Deliveries &amp; Tasks
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Accept orders nearby and track your ongoing delivery route
          </p>
        </div>

        <button 
          onClick={fetchDeliveries} 
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs"
        >
          <ReloadOutlined className={`text-xs ${loading ? 'animate-spin' : ''}`} /> 
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Active Delivery Highlight Banner / Map View */}
      {activeDelivery ? (
        <div className="bg-white p-5 rounded-2xl shadow-xs border-2 border-[#FF521C]/20 relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#FF521C] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                ● ACTIVE TASK
              </span>
              <h2 className="text-base font-mono font-black text-slate-900">
                Order #{activeDelivery.id.slice(0, 8).toUpperCase()}
              </h2>
            </div>
          </div>
            
          {/* Active Delivery Steps & Action Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 border-b border-slate-100 pb-4">
            <div className="lg:col-span-2 space-y-3">
              <span className="font-black text-slate-400 uppercase text-[10px] tracking-wider block">
                DELIVERY STEPS PROGRESS
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className={`p-2.5 rounded-xl border text-center transition-all ${
                  activeDelivery.status === 'assigned' ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <span className="text-xs font-black block">1. Go to restaurant</span>
                  <span className="text-[10px]">Pickup order</span>
                </div>
                <div className={`p-2.5 rounded-xl border text-center transition-all ${
                  activeDelivery.status === 'assigned' ? 'bg-white border-orange-200 text-orange-600 font-bold animate-pulse' : activeDelivery.status === 'picked_up' ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <span className="text-xs font-black block">2. Confirm pickup</span>
                  <span className="text-[10px]">Mark picked up</span>
                </div>
                <div className={`p-2.5 rounded-xl border text-center transition-all ${
                  activeDelivery.status === 'picked_up' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <span className="text-xs font-black block">3. Deliver customer</span>
                  <span className="text-[10px]">Follow live map</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-center">
                  <span className="text-xs font-black block">4. Complete</span>
                  <span className="text-[10px]">Earn money</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {activeDelivery.status === 'assigned' && (
                <button 
                  onClick={() => updateStatus(activeDelivery.id, 'picked_up')}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 active:scale-98 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingOutlined /> Confirm Pickup (Mark Out for Delivery)
                </button>
              )}

              {activeDelivery.status === 'picked_up' && (
                <button 
                  onClick={() => {
                    Modal.confirm({
                      title: 'Confirm Delivery Completion',
                      icon: <CheckCircleOutlined className="text-emerald-500" />,
                      content: 'Have you safely handed over the food order to the customer?',
                      okText: 'Yes, Mark Delivered',
                      cancelText: 'Cancel',
                      okButtonProps: { className: 'bg-emerald-500 hover:bg-emerald-600 border-none font-bold' },
                      onOk: () => updateStatus(activeDelivery.id, 'delivered')
                    });
                  }}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircleOutlined /> Finish & Complete Delivery ✓
                </button>
              )}
            </div>
          </div>

          {/* Integrated Live Delivery Route Map */}
          <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-100 shadow-2xs">
            <AppMap 
              destinationLat={activeDelivery.Address?.latitude} 
              destinationLng={activeDelivery.Address?.longitude} 
            />
          </div>
          
          {/* Pickup and Dropoff Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-orange-50/50 rounded-xl p-3.5 border border-orange-100/60">
              <span className="font-black text-orange-600 uppercase text-[10px] tracking-wider mb-1 block">
                1. PICKUP RESTAURANT
              </span>
              <p className="font-extrabold text-sm text-slate-900 mb-0.5">
                {activeDelivery.Restaurant?.name || 'Restaurant'}
              </p>
              <p className="text-xs text-slate-600">
                📍 {activeDelivery.Restaurant?.location || activeDelivery.Restaurant?.address || 'Restaurant Location'}
              </p>
            </div>

            <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/60">
              <span className="font-black text-emerald-600 uppercase text-[10px] tracking-wider mb-1 block">
                2. DROPOFF CUSTOMER
              </span>
              <p className="font-extrabold text-sm text-slate-900 mb-0.5">
                {activeDelivery.Customer?.User?.full_name || 'Customer'}
              </p>
              <p className="text-xs text-slate-600 mb-2">
                📍 {activeDelivery.Address?.street || 'Customer Address'}, {activeDelivery.Address?.city || ''}
              </p>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-white w-fit px-2.5 py-1 rounded-lg border border-emerald-200 text-xs shadow-2xs">
                <PhoneOutlined /> {activeDelivery.Customer?.User?.phone_number || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Available Orders Section */
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF521C] flex items-center justify-center text-xs font-bold">
                <RocketOutlined />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Available Nearby Requests ({availableRequests.length})
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Live updates via Socket.io
            </span>
          </div>

          {availableRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {availableRequests.map(req => (
                <div 
                  key={req.id} 
                  className="bg-slate-50/70 border border-slate-200/80 hover:border-orange-200 rounded-xl p-4 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                        #{req.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Payout</span>
                        <div className="text-base font-black text-[#FF521C]">
                          ₹{(parseFloat(req.delivery_fee) || 150).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-orange-100 text-[#FF521C] flex items-center justify-center text-xs shrink-0 mt-0.5">
                          <ShopOutlined />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup</p>
                          <p className="font-bold text-slate-900 text-xs">{req.Restaurant?.name || 'Restaurant'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          <EnvironmentOutlined />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Dropoff</p>
                          <p className="font-bold text-slate-900 text-xs">{req.Address?.street || 'Customer Address'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="flex-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1"
                    >
                      ✕ Reject
                    </button>
                    <button 
                      onClick={() => acceptRequest(req.id)}
                      className="flex-[2] bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                    >
                      <span>Accept Delivery</span>
                      <ArrowRightOutlined className="text-[10px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center text-center">
              <img
                src="/empty-clipboard.jpg"
                alt="No available orders"
                className="w-16 h-16 object-contain mb-2 filter drop-shadow-2xs"
              />
              <h4 className="text-slate-900 font-bold text-xs mb-0.5">
                No available delivery requests nearby
              </h4>
              <p className="text-slate-400 text-[11px]">
                New customer orders will automatically appear here in real time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
