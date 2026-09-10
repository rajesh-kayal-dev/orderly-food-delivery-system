import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { clearCartAsync, fetchCart } from '../../redux/slices/cartSlice';
import EmptyState from '../../components/common/EmptyState';
import { notification, Modal } from 'antd';
import { 
  CreditCardOutlined, 
  MoneyCollectOutlined, 
  HomeOutlined, 
  PhoneOutlined, 
  MessageOutlined,
  CheckCircleFilled,
  LockOutlined,
  ShoppingCartOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

export default function CheckoutPage() {
  const { items, total, restaurantId } = useSelector(state => state.cart);
  const { user, profile } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');

  useEffect(() => {
    const defaultAddress = profile?.Addresses?.find(addr => addr.is_default === true);
    if (defaultAddress) {
      setAddress(defaultAddress.street);
      setSelectedAddressId(defaultAddress.id);
    } else if (profile?.Addresses?.[0]) {
      setAddress(profile.Addresses[0].street || '');
      setSelectedAddressId(profile.Addresses[0].id);
    } else {
      setAddress('');
      setSelectedAddressId('');
    }
  }, [profile]);

  const [phone, setPhone] = useState(user?.phone_number || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const deliveryFee = 15000;
  const grandTotal = total + deliveryFee;

  const handlePlaceOrder = async (force = false) => {
    if (!address.trim() || !phone.trim()) {
      notification.warning({
        message: 'Incomplete Information',
        description: 'Please enter delivery address and phone number.',
        placement: 'topRight'
      });
      return;
    }

    if (!selectedAddressId) {
      notification.warning({
        message: 'Missing Delivery Address',
        description: 'Please update your default address in your Profile before placing an order.',
        placement: 'topRight'
      });
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        restaurant_id: restaurantId,
        delivery_address_id: selectedAddressId,
        notes: notes || "No notes provided",
        payment_method: paymentMethod,
        items: items.map(item => ({
          menu_item_id: item.menu_item_id || item.id,
          quantity: item.quantity
        })),
        delivery_fee: deliveryFee
      };

      let response;
      if (paymentMethod === "vnpay") {
        response = await axios.post('/payments/create-vnpay', {
          restaurantId: restaurantId,
          addressId: selectedAddressId,
          delivery_fee: 15000,
          notes: notes || "No notes provided"
        });
      } else {
        response = await axios.post('/orders', orderData);
      }

      if (response.data.success) {
        if (paymentMethod === "vnpay") {
          window.location.assign(response.data.data.paymentUrl);
        } else {
          notification.success({
            message: 'Order Placed Successfully',
            description: 'Your order has been received by the kitchen!',
            placement: 'topRight'
          });
          navigate("/customer/tracking");
        }
        dispatch(clearCartAsync());
      }
    } catch (error) {
      console.error('Checkout error:', error);
      if (error.response?.data?.type === 'AVAILABILITY_CONFLICT') {
        const unavailableItems = error.response.data.unavailableItems || [];
        Modal.confirm({
          title: 'Availability Conflict',
          content: (
            <div>
              <p>The following items are no longer available:</p>
              <ul className="list-disc ml-5 text-red-500 font-medium my-2">
                {unavailableItems.map(item => <li key={item.id}>{item.name}</li>)}
              </ul>
              <p className="mt-2 text-xs text-neutral-500">Do you want to proceed with the remaining available items?</p>
            </div>
          ),
          okText: 'Yes, Proceed',
          cancelText: 'Cancel Order',
          onOk: () => {
            dispatch(fetchCart());
            handlePlaceOrder(true);
          }
        });
      } else {
        notification.error({
          message: 'Order Error',
          description: error.response?.data?.message || 'There was an error placing your order. Please try again.',
          placement: 'topRight'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 max-w-xl mx-auto animate-fade-in">
        <EmptyState
          icon={<ShoppingCartOutlined className="text-orange-500" />}
          title="Your Cart is Empty"
          description="You cannot checkout with an empty cart. Please add items from a restaurant menu."
          actionText="Explore Restaurants"
          onAction={() => navigate('/customer/restaurants')}
        />
      </div>
    );
  }

  return (
    <div className="pb-16 animate-fade-in space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Checkout</h1>
        <p className="text-neutral-500 text-xs sm:text-sm font-semibold mt-1">
          Complete your delivery details and choose a payment method
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Delivery Info & Payment */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Delivery Information */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-lg font-extrabold text-neutral-900 border-b border-neutral-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <HomeOutlined className="text-xl" />
              </div>
              <span>Delivery Address & Contact</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Delivery Address
                </label>
                <div className="relative">
                  <HomeOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base z-10" />
                  <input
                    type="text"
                    value={address}
                    readOnly
                    placeholder="Set default delivery address in Profile"
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-800 focus:outline-none"
                  />
                </div>
                {!selectedAddressId && (
                  <p className="text-xs text-red-500 font-bold mt-1.5">
                    ⚠️ No default address selected. Please update your profile address.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <PhoneOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base z-10" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-800 focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                    Order Notes (Optional)
                  </label>
                  <div className="relative">
                    <MessageOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base z-10" />
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Extra napkins, leave at door..."
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200 rounded-2xl text-sm font-medium text-neutral-800 focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-lg font-extrabold text-neutral-900 border-b border-neutral-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <CreditCardOutlined className="text-xl" />
              </div>
              <span>Payment Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cash On Delivery */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                  paymentMethod === 'cod'
                    ? 'border-orange-500 bg-orange-50/60 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  paymentMethod === 'cod' ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <MoneyCollectOutlined />
                </div>
                <div>
                  <p className="font-extrabold text-neutral-900 text-sm">Cash on Delivery</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Pay cash when food arrives</p>
                </div>
              </div>

              {/* VNPay Online */}
              <div
                onClick={() => setPaymentMethod('vnpay')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                  paymentMethod === 'vnpay'
                    ? 'border-orange-500 bg-orange-50/60 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  paymentMethod === 'vnpay' ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  <CreditCardOutlined />
                </div>
                <div>
                  <p className="font-extrabold text-neutral-900 text-sm">VNPay Online</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Instant credit card or QR payment</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm sticky top-24 space-y-6">
            <h3 className="text-lg font-extrabold text-neutral-900 border-b border-neutral-100 pb-3">
              Order Items ({items.length})
            </h3>

            {/* Items List */}
            <div className="max-h-56 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-neutral-900 line-clamp-1">{item.name}</p>
                    <p className="text-neutral-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-extrabold text-neutral-800">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-neutral-100 pt-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Items Total</span>
                <span className="font-bold text-neutral-900">${Number(total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Fee</span>
                <span className="font-bold text-neutral-900">${Number(deliveryFee).toFixed(2)}</span>
              </div>
              
              <div className="border-t border-neutral-100 pt-3 flex justify-between items-center text-base">
                <span className="font-black text-neutral-900">Total</span>
                <span className="font-black text-xl text-orange-600">${Number(grandTotal).toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              disabled={loading || !selectedAddressId}
              onClick={() => handlePlaceOrder(false)}
              className={`w-full py-4 rounded-2xl font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
                (loading || !selectedAddressId)
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {loading ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRightOutlined />
                </>
              )}
            </button>

            <div className="text-center flex items-center justify-center gap-1.5 text-neutral-400 text-[11px]">
              <LockOutlined />
              <span>Encrypted payment processing</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
