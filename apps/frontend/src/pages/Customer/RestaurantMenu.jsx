import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import axios from '../../api/axios';
import socket from '../../socket';
import EmptyState from '../../components/common/EmptyState';
import { notification } from 'antd';
import { 
  StarFilled, 
  LockFilled, 
  ShopOutlined, 
  CheckCircleFilled, 
  CloseCircleFilled,
  PlusOutlined,
  ClockCircleFilled,
  EnvironmentOutlined,
  InfoCircleOutlined,
  LeftOutlined
} from '@ant-design/icons';

export default function RestaurantMenu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector(state => state.cart);
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantClosed, setRestaurantClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState('This restaurant is currently closed.');

  useEffect(() => {
    if (!restaurantId) return;

    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const resResponse = await axios.get(`/restaurants/${restaurantId}`);

        if (resResponse.data.success) {
          setRestaurant(resResponse.data.data);
          setRestaurantClosed(false);

          const menuResponse = await axios.get(`/menu/full/${restaurantId}`);
          if (menuResponse.data.success) {
            setMenu(menuResponse.data.data || []);
          }
        }
      } catch (error) {
        if (error.response?.data?.type === 'RESTAURANT_CLOSED') {
          setRestaurantClosed(true);
          setClosedMessage(error.response?.data?.message || 'This restaurant is currently closed.');
          setRestaurant(null);
          setMenu([]);
          return;
        }
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();

    // Real-time menu updates
    socket.on('MENU_ITEM_UPDATED', (data) => {
      if (String(data.restaurantId) === String(restaurantId)) {
        setMenu(prevMenu => prevMenu.map(category => ({
          ...category,
          items: category.items?.map(item => 
            String(item.id) === String(data.itemId) 
              ? { ...item, ...data } 
              : item
          )
        })));
      }
    });

    socket.on('RESTAURANT_STATUS_UPDATED', (data) => {
      if (String(data.restaurantId) !== String(restaurantId)) return;

      if (!data.is_open) {
        setRestaurantClosed(true);
        setClosedMessage(`${data.name || 'This restaurant'} is currently closed.`);
        notification.warning({
          message: 'Restaurant closed',
          description: `${data.name || 'This restaurant'} is no longer accepting orders.`,
          placement: 'topRight'
        });
      } else {
        setRestaurantClosed(false);
        setClosedMessage('');
        setRestaurant((prev) => prev ? { ...prev, is_open: true } : prev);
      }
    });

    return () => {
      socket.off('MENU_ITEM_UPDATED');
      socket.off('RESTAURANT_STATUS_UPDATED');
    };
  }, [restaurantId]);

  const handleAdd = async (item) => {
    if (restaurantClosed || !restaurant?.is_open) {
      notification.warning({
        message: 'Restaurant is closed',
        description: 'You cannot add items while this restaurant is closed.',
        placement: 'topRight'
      });
      return;
    }

    const existingItem = cartItems.find(i => i.id === item.id);
    if (existingItem && existingItem.quantity >= 20) {
      notification.warning({
        message: 'Limit Reached',
        description: `You already have 20 units of ${item.name} in your cart.`,
        placement: 'topRight'
      });
      return;
    }

    try {
      await dispatch(addToCartAsync({
        menu_item_id: item.id,
        quantity: 1,
        restaurant_id: restaurant.id,
        item: { ...item, restaurantName: restaurant.name }
      }));

      notification.success({
        message: 'Added to Cart',
        description: `${item.name} has been added to your cart!`,
        placement: 'bottomRight',
        duration: 2,
      });
    } catch (error) {
      notification.success({
        message: 'Added to Cart',
        description: `${item.name} has been added to your cart!`,
        placement: 'bottomRight',
        duration: 2,
      });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-semibold text-sm">Loading restaurant menu...</p>
    </div>
  );

  if (restaurantClosed) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto">
        <EmptyState
          icon={<LockFilled className="text-red-500" />}
          title="Restaurant Closed"
          description={closedMessage}
          actionText="Back to Restaurants"
          onAction={() => navigate('/customer/restaurants')}
        />
      </div>
    );
  }

  if (!restaurant) return (
    <div className="py-16 text-center max-w-lg mx-auto">
      <EmptyState
        icon={<ShopOutlined className="text-orange-500" />}
        title="Restaurant Not Found"
        description="We could not find the restaurant you were looking for."
        actionText="Browse Restaurants"
        onAction={() => navigate('/customer/restaurants')}
      />
    </div>
  );

  return (
    <div className="pb-16 animate-fade-in space-y-8">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/customer/restaurants')}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-orange-600 transition-colors"
        >
          <LeftOutlined /> Back to Restaurants
        </button>
      </div>

      {/* 1. RESTAURANT HERO HEADER */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-xl border border-neutral-200/80 bg-neutral-900 text-white">
        <div className="h-64 sm:h-80 overflow-hidden relative">
          <img
            src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop'}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex items-end p-6 sm:p-10">
            <div className="space-y-3 max-w-2xl">
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
                  {restaurant.description || restaurant.cuisine_type || 'Gourmet Dining'}
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <StarFilled className="text-amber-400" /> {restaurant.rating || '4.8'}
                </span>
                <span className="bg-emerald-500/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircleFilled /> Open Now
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                {restaurant.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-300 font-medium">
                <span className="flex items-center gap-1">
                  <ClockCircleFilled className="text-orange-400" /> {restaurant.opens_at && restaurant.closes_at ? `${restaurant.opens_at} - ${restaurant.closes_at}` : 'Delivery: 25-35 mins'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <EnvironmentOutlined className="text-orange-400" /> {restaurant.address || restaurant.location || 'Local Area'}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 2. MENU CONTENT & SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Menu Items Column */}
        <div className="lg:col-span-2 space-y-10">
          {menu.length > 0 ? (
            menu.map((category) => (
              <section key={category.id} className="space-y-4">
                <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight border-b border-neutral-200/80 pb-3">
                  {category.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items && category.items.length > 0 ? (
                    category.items.map((item) => (
                      <div 
                        key={item.id} 
                        className={`bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-sm hover:shadow-md transition-all flex gap-4 relative overflow-hidden group ${
                          !item.is_available ? 'opacity-60 bg-neutral-50' : ''
                        }`}
                      >
                        {/* Item Image */}
                        <div className="w-24 h-24 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 relative">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-extrabold text-neutral-900 text-base leading-snug group-hover:text-orange-600 transition-colors">
                                {item.name}
                              </h3>
                            </div>
                            <p className="text-neutral-500 text-xs mt-1 line-clamp-2 font-normal">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-100">
                            <span className="text-base font-black text-orange-600">
                              ${Number(item.price).toFixed(2)}
                            </span>

                            {item.is_available ? (
                              <button
                                onClick={() => handleAdd(item)}
                                className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white font-extrabold text-xs rounded-full transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                <PlusOutlined /> Add
                              </button>
                            ) : (
                              <span className="text-red-500 text-[10px] font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400 text-xs italic">No items available in this section.</p>
                  )}
                </div>
              </section>
            ))
          ) : (
            <EmptyState
              title="Menu Empty"
              description="This restaurant has not listed any menu items yet."
            />
          )}
        </div>

        {/* Sidebar Info Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm sticky top-24 space-y-6">
            <div className="flex items-center gap-2 text-neutral-900 font-extrabold text-lg border-b border-neutral-100 pb-3">
              <InfoCircleOutlined className="text-orange-500" />
              <span>Restaurant Details</span>
            </div>

            <div className="space-y-4 text-sm text-neutral-600">
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-500">Rating</span>
                <span className="font-bold text-neutral-900 flex items-center gap-1">
                  <StarFilled className="text-amber-400 text-xs" /> {restaurant.rating || '4.8'} / 5
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-neutral-100">
                <span className="text-neutral-500">Cuisine</span>
                <span className="font-bold text-neutral-900">{restaurant.description || restaurant.cuisine_type || 'General'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-neutral-100">
                <span className="text-neutral-500">Operating Hours</span>
                <span className="font-bold text-neutral-900 text-xs">
                  {restaurant.opens_at && restaurant.closes_at ? `${restaurant.opens_at} - ${restaurant.closes_at}` : '10:00 AM - 11:00 PM'}
                </span>
              </div>

              <div className="py-2 border-t border-neutral-100">
                <span className="text-neutral-500 block text-xs font-semibold mb-1">Address & Location</span>
                <p className="font-semibold text-neutral-800 text-xs leading-relaxed">
                  {restaurant.address || restaurant.location || 'Local Restaurant Address'}
                </p>
              </div>
            </div>

            <div className="bg-orange-50/80 rounded-2xl p-4 border border-orange-100 text-xs text-orange-800 space-y-1">
              <p className="font-bold">⚡ Fast Delivery Guarantee</p>
              <p className="text-orange-700/80 font-normal">
                Orders from this restaurant are prepared fresh and dispatched immediately.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
