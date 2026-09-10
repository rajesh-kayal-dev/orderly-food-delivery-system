import React, { useState, useEffect } from 'react';
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
  ClockCircleOutlined
} from '@ant-design/icons';
import socket from '../../socket';
import AppMap from '../../pages/Map/Map';

export default function DeliveryOrders() {
  const { profile, token } = useSelector(state => state.auth);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

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
      socket.emit('join_deliveries');

      const handleAvailableDelivery = (data) => {
        notification.info({
          title: 'New Delivery Available!',
          description: `A new order from ${data.restaurantName || 'Restaurant'} is ready for pickup.`,
          placement: 'topRight'
        });
        fetchDeliveries();
      };

      const handleOrderAccepted = () => {
        fetchDeliveries();
      };

      socket.on('AVAILABLE_DELIVERY', handleAvailableDelivery);
      socket.on('ORDER_ACCEPTED', handleOrderAccepted);

      return () => {
        socket.off('AVAILABLE_DELIVERY', handleAvailableDelivery);
        socket.off('ORDER_ACCEPTED', handleOrderAccepted);
      };
    } else {
      setLoading(false);
    }
  }, [profile, token]);

  const acceptRequest = async (orderId) => {
    try {
      const { data } = await axios.put(`/orders/${orderId}/accept-delivery`, { driver_id: profile.id });
      if (data.success) {
        notification.success({ title: 'Delivery Accepted!', description: 'Drive safely to the restaurant for pickup.' });
        fetchDeliveries();
      }
    } catch (error) {
      notification.error({ title: 'Error', description: error.response?.data?.message || 'Error accepting delivery' });
      console.error('Error accepting delivery:', error);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const { data } = await axios.put(`/orders/${orderId}/status`, { status: newStatus });
      if (data.success) {
        notification.success({ title: 'Status Updated!', description: `Order marked as ${newStatus}!` });
        fetchDeliveries();
      }
    } catch (error) {
      notification.error({ title: 'Update Failed', description: 'Error updating delivery status' });
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
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            Available Deliveries & Tasks
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
            
            <button 
              onClick={() => {
                Modal.confirm({
                  title: 'Confirm Delivery',
                  icon: <CheckCircleOutlined className="text-emerald-500" />,
                  content: 'Have you safely handed over the food order to the customer?',
                  okText: 'Yes, Mark Delivered',
                  cancelText: 'Cancel',
                  okButtonProps: { className: 'bg-emerald-500 hover:bg-emerald-600 border-none font-bold' },
                  onOk: () => updateStatus(activeDelivery.id, 'delivered')
                });
              }}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all"
            >
              Finish Delivery ✓
            </button>
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
                  
                  <button 
                    onClick={() => acceptRequest(req.id)}
                    className="w-full bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 mt-1"
                  >
                    <span>Accept Delivery</span>
                    <ArrowRightOutlined className="text-[10px]" />
                  </button>
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
