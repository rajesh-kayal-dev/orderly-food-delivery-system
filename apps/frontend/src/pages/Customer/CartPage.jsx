import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuantityAsync, removeItemAsync, fetchCart } from '../../redux/slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import socket from '../../socket';
import { 
  ExclamationCircleFilled, 
  ShoppingCartOutlined, 
  DeleteOutlined, 
  MinusOutlined,
  PlusOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

export default function CartPage() {
  const { items, total } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState('123 Main St, Apt 4B');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const subtotal = total || 0;
  const deliveryFee = items.length > 0 ? 2.99 : 0.00;
  const tax = subtotal * 0.08;
  const grandTotal = subtotal + deliveryFee + tax;
  const hasUnavailableItems = items.some(i => !i.isAvailable);

  useEffect(() => {
    socket.on('MENU_ITEM_UPDATED', (data) => {
      if (items.some(i => i.id === data.itemId)) {
        if (!data.isAvailable) {
          notification.warning({
            message: 'Item Unavailable',
            description: `"${data.name}" has just gone Out of Order and will be excluded.`,
            duration: 5
          });
        } else {
          notification.success({
            message: 'Item Back in Stock!',
            description: `"${data.name}" is available again.`,
            duration: 3
          });
        }
        dispatch(fetchCart());
      }
    });

    return () => {
      socket.off('MENU_ITEM_UPDATED');
    };
  }, [items, dispatch]);

  return (
    <div className="pb-16 animate-fade-in -mt-16">

      {/* ── FULL-BLEED HERO BANNER ── */}
      <div className="relative bg-neutral-900 text-white pt-24 pb-16 border-b border-neutral-800 overflow-hidden">
        <img
          src="/food_banners/cooking-banner.jpg"
          alt="Cart Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              🛒 Your Order
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Your Cart</h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Review your items, set your delivery address and proceed to checkout.
            </p>
          </div>

          <div className="hidden lg:block text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs shadow-xl">
            <p className="text-xs font-serif italic text-amber-300 leading-snug">
              "Life is uncertain. Eat dessert first!"
            </p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
              — Ernestine Ulmer
            </p>
          </div>
        </div>
      </div>

      {/* ── CART CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* LEFT COLUMN: Cart Items OR Empty State */}
          <div className="lg:col-span-2">
            {items.length === 0 ? (
              <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
                <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingCartOutlined className="text-2xl" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-base mb-1">Your cart is empty</h3>
                <p className="text-neutral-400 text-sm mb-6">Looks like you haven't added anything yet.</p>
                <button
                  onClick={() => navigate('/customer/menu')}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Cart Items ({items.length})
                  </h2>
                  <button
                    onClick={() => navigate('/customer/menu')}
                    className="text-xs font-medium text-orange-600 hover:underline"
                  >
                    + Add More Items
                  </button>
                </div>

                <div className="divide-y divide-neutral-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${!item.isAvailable ? 'opacity-60' : ''}`}
                    >
                      {/* Item Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-neutral-50 overflow-hidden border border-neutral-100 flex-shrink-0">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                            className="w-full h-full object-cover"
                            alt={item.name}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-neutral-900 text-base leading-snug">{item.name}</h4>
                          <p className="text-neutral-600 font-medium text-sm mt-0.5">${Number(item.price).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Quantity + Remove */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                        <div className="flex items-center gap-2 border border-neutral-200 rounded-lg p-1">
                          <button
                            onClick={() => dispatch(updateQuantityAsync({ itemId: item.cartItemId, quantity: item.quantity - 1 }))}
                            className="w-7 h-7 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold transition-colors"
                          >
                            <MinusOutlined />
                          </button>
                          <span className="font-semibold text-sm w-6 text-center text-neutral-800">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantityAsync({ itemId: item.cartItemId, quantity: item.quantity + 1 }))}
                            disabled={!item.isAvailable || item.quantity >= 20}
                            className="w-7 h-7 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold transition-colors"
                          >
                            <PlusOutlined />
                          </button>
                        </div>
                        <button
                          onClick={() => dispatch(removeItemAsync(item.cartItemId))}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <DeleteOutlined className="text-base" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
              <h3 className="text-lg font-semibold text-neutral-900 border-b border-neutral-100 pb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-neutral-900">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span className="font-medium text-neutral-900">${tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-neutral-200 my-2" />
                <div className="flex justify-between items-center text-base text-neutral-900 font-semibold">
                  <span>Total</span>
                  <span className="text-lg font-bold">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {hasUnavailableItems && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold flex items-center gap-2">
                  <ExclamationCircleFilled className="text-base flex-shrink-0" />
                  <span>Some items are unavailable and excluded from total.</span>
                </div>
              )}

              {/* Delivery Address */}
              <div>
                <h4 className="font-medium text-sm text-neutral-900 mb-2">Delivery Address</h4>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="123 Main St, Apt 4B"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                />
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="font-medium text-sm text-neutral-900 mb-2">Payment</h4>
                <div className="flex gap-3">
                  {['card', 'paypal'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer capitalize ${
                        paymentMethod === method
                          ? 'bg-white border border-orange-500 text-orange-600 shadow-sm'
                          : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      {method === 'card' ? 'Card' : 'PayPal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => items.length === 0 ? navigate('/customer/menu') : navigate('/customer/checkout')}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl shadow-lg shadow-orange-200 transition-colors cursor-pointer text-center text-base flex items-center justify-center gap-2 group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
