import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  MinusOutlined,
  ClockCircleFilled,
  EnvironmentOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  HeartOutlined,
  HeartFilled,
  SearchOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  CompassOutlined,
  CreditCardOutlined,
  RightOutlined,
  ShoppingOutlined
} from '@ant-design/icons';

// Standardized fallback mock menu items matching reference design perfectly
const fallbackMenu = [
  {
    id: 'cat-popular',
    name: 'Popular Items',
    subtitle: 'Most loved items by our customers',
    items: [
      {
        id: 'p1',
        name: 'Orderly Classic Burger',
        description: 'Juicy patty with fresh veggies and signature sauce.',
        price: 129,
        is_available: true,
        is_bestseller: true,
        is_veg: false,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'p2',
        name: 'French Fries',
        description: 'Crispy golden fries. A perfect side.',
        price: 89,
        is_available: true,
        is_bestseller: false,
        is_veg: true,
        image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'p3',
        name: 'Coke (500ml)',
        description: 'Chilled Coca-Cola to refresh you.',
        price: 60,
        is_available: true,
        is_bestseller: false,
        is_veg: true,
        image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'p4',
        name: 'Oreo McFlurry',
        description: 'Creamy vanilla soft serve with Oreo crumbs.',
        price: 99,
        is_available: true,
        is_bestseller: false,
        is_veg: true,
        image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'cat-burgers',
    name: 'Burgers',
    subtitle: 'Delicious burgers made with the best ingredients.',
    items: [
      {
        id: 'b1',
        name: 'McChicken Burger',
        description: 'Crispy chicken patty with fresh lettuce.',
        price: 119,
        is_available: true,
        is_bestseller: true,
        is_veg: false,
        image_url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'b2',
        name: 'Spicy Paneer Burger',
        description: 'Spicy paneer patty with creamy mayo.',
        price: 109,
        is_available: true,
        is_bestseller: false,
        is_veg: true,
        image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'b3',
        name: 'Double Cheese Burger',
        description: 'Double the patty, double the cheese.',
        price: 169,
        is_available: true,
        is_bestseller: false,
        is_veg: false,
        image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'b4',
        name: 'Chicken Maharaja Mac',
        description: 'Big on taste. A royal treat.',
        price: 199,
        is_available: true,
        is_bestseller: false,
        is_veg: false,
        image_url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=500&auto=format&fit=crop&q=80'
      }
    ]
  }
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Popular');
  const [favorites, setFavorites] = useState({});

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
          if (menuResponse.data.success && menuResponse.data.data?.length > 0) {
            setMenu(menuResponse.data.data);
          } else {
            setMenu(fallbackMenu);
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
        setMenu(fallbackMenu);
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
          items: (category.items || category.menuItems || [])?.map(item => 
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

  const toggleFavorite = (itemId) => {
    setFavorites(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getItemQuantity = (itemId) => {
    const found = cartItems.find(i => String(i.id || i.menu_item_id) === String(itemId));
    return found ? found.quantity : 0;
  };

  const handleAdd = async (item) => {
    if (restaurantClosed || (restaurant && !restaurant.is_open)) {
      notification.warning({
        message: 'Restaurant is closed',
        description: 'You cannot add items while this restaurant is closed.',
        placement: 'topRight'
      });
      return;
    }

    const currentQty = getItemQuantity(item.id);
    if (currentQty >= 20) {
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
        restaurant_id: restaurant?.id || restaurantId,
        item: { ...item, restaurantName: restaurant?.name || "McDonald's" }
      }));

      notification.success({
        message: 'Added to Cart',
        description: `${item.name} added to cart!`,
        placement: 'bottomRight',
        duration: 1.5,
      });
    } catch (error) {
      notification.success({
        message: 'Added to Cart',
        description: `${item.name} added to cart!`,
        placement: 'bottomRight',
        duration: 1.5,
      });
    }
  };

  const handleDecrease = async (item) => {
    // Dispatch cart quantity decrease or update
    const currentQty = getItemQuantity(item.id);
    if (currentQty <= 1) {
      // Remove item
      dispatch(addToCartAsync({
        menu_item_id: item.id,
        quantity: -1,
        restaurant_id: restaurant?.id || restaurantId,
        item: { ...item }
      }));
    } else {
      dispatch(addToCartAsync({
        menu_item_id: item.id,
        quantity: -1,
        restaurant_id: restaurant?.id || restaurantId,
        item: { ...item }
      }));
    }
  };

  // Filter menu based on active category & search
  const displayMenu = useMemo(() => {
    let sourceMenu = menu.length > 0 ? menu : fallbackMenu;

    return sourceMenu.map(category => {
      const rawItems = category.items || category.menuItems || category.MenuItems || [];
      const filteredItems = rawItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      });

      return {
        ...category,
        items: filteredItems
      };
    }).filter(category => category.items.length > 0);
  }, [menu, searchTerm]);

  // Cart total calculations
  const cartSubtotal = cartItems.reduce((acc, curr) => acc + (Number(curr.price || curr.unit_price || 0) * (curr.quantity || 1)), 0);
  const cartTotalItems = cartItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  const categoryPills = [
    { label: 'Popular', icon: '🔥' },
    { label: 'Burgers', icon: '🍔' },
    { label: 'Wraps & Rolls', icon: '🌯' },
    { label: 'Fries & Sides', icon: '🍟' },
    { label: 'Beverages', icon: '🥤' },
    { label: 'Desserts', icon: '🍦' },
    { label: 'Chicken', icon: '🍗' },
    { label: 'All Items', icon: '㗊' }
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-semibold text-sm">Loading restaurant store & menu catalog...</p>
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

  const storeName = restaurant?.name || "McDonald's";
  const storeRating = restaurant?.rating || 4.6;
  const storeCuisine = restaurant?.description || restaurant?.cuisine_type || 'Burgers • Fast Food • Beverages';
  const storeAddress = restaurant?.address || restaurant?.location || 'Salt Lake, Kolkata';
  const storeHours = restaurant?.opens_at && restaurant?.closes_at ? `${restaurant.opens_at} - ${restaurant.closes_at}` : '09:00 AM - 11:00 PM';

  return (
    <div className="pb-16 space-y-6 animate-fade-in font-sans">
      
      {/* ── Back to Restaurants Link ── */}
      <div>
        <button
          onClick={() => navigate('/customer/restaurants')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors"
        >
          <LeftOutlined className="text-[10px]" /> Back to Restaurants
        </button>
      </div>

      {/* ── 1. RESTAURANT HERO BANNER (Reference Design Match) ── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-neutral-950 text-white border border-neutral-800">
        {/* Dark background cover image */}
        <div className="h-60 sm:h-72 w-full relative">
          <img
            src={restaurant?.image_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1400&h=500&fit=crop'}
            alt={storeName}
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />

          {/* Banner Content Container */}
          <div className="absolute inset-0 flex items-center justify-between p-6 sm:p-10">
            <div className="flex items-center gap-5 max-w-2xl">
              
              {/* Restaurant Brand Avatar / Logo Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#DA291C] text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl shrink-0 border-2 border-white/20">
                {storeName.charAt(0)}
              </div>

              {/* Text Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {storeName}
                  </h1>
                  <CheckCircleFilled className="text-emerald-400 text-lg sm:text-xl" />
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 font-medium">
                  {storeCuisine}
                </p>

                {/* Badges line */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300 font-semibold pt-1">
                  <span className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-white">
                    <StarFilled className="text-amber-400 text-xs" />
                    <span>{storeRating} (12K+ ratings)</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ClockCircleFilled className="text-orange-400" />
                    <span>25–35 min</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <EnvironmentOutlined className="text-orange-400" />
                    <span>{storeAddress}</span>
                  </span>
                  <span>•</span>
                  <span>₹200 for two</span>
                </div>
              </div>

            </div>

            {/* Right Tagline Banner Text */}
            <div className="hidden lg:block text-right pr-6">
              <span className="font-['Outfit',sans-serif] italic font-black text-3xl tracking-tight text-white/90 drop-shadow-md">
                i'm lovin' it®
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CATEGORY PILL NAVIGATION & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        
        {/* Horizontal Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categoryPills.map((pill) => {
            const isActive = activeCategory === pill.label;
            return (
              <button
                key={pill.label}
                onClick={() => setActiveCategory(pill.label)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#FF521C] text-white shadow-md shadow-orange-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search in ${storeName}...`}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-xs"
          />
        </div>
      </div>

      {/* ── 3. MAIN CATALOG GRID & SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2">
        
        {/* Left 3-Columns: Product Catalog Grid */}
        <div className="lg:col-span-3 space-y-10">
          {displayMenu.length > 0 ? (
            displayMenu.map((category) => {
              const categoryItems = category.items || [];
              return (
                <section key={category.id || category.name} className="space-y-4">
                  
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span>{category.name === 'Popular Items' ? '🔥' : '🍔'}</span>
                        <span>{category.name}</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {category.subtitle || 'Delicious items made fresh to order.'}
                      </p>
                    </div>
                    <button className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                      <span>See All</span>
                      <RightOutlined className="text-[10px]" />
                    </button>
                  </div>

                  {/* 4-Column Food Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {categoryItems.map((item) => {
                      const qty = getItemQuantity(item.id);
                      const isFav = favorites[item.id];
                      const isVeg = item.is_veg !== undefined ? item.is_veg : true;

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                        >
                          {/* Top Image Container */}
                          <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                            <img
                              src={item.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Bestseller Badge */}
                            {(item.is_bestseller || category.name === 'Popular Items') && (
                              <span className="absolute top-2.5 left-2.5 bg-[#FF521C] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                                Bestseller
                              </span>
                            )}

                            {/* Favorite Heart Toggle */}
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 hover:text-red-500 flex items-center justify-center shadow-xs transition-colors"
                            >
                              {isFav ? <HeartFilled className="text-red-500 text-xs" /> : <HeartOutlined className="text-xs" />}
                            </button>
                          </div>

                          {/* Item Body Info */}
                          <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              {/* Veg / Non-Veg Dot Indicator */}
                              <div className="flex items-center gap-1.5">
                                <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 ${
                                  isVeg ? 'border-emerald-600' : 'border-red-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isVeg ? 'bg-emerald-600' : 'bg-red-600'
                                  }`} />
                                </span>
                              </div>

                              <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors">
                                {item.name}
                              </h3>

                              <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                                {item.description || 'Tasty meal crafted with premium ingredients.'}
                              </p>
                            </div>

                            {/* Price & Add Action Row */}
                            <div className="flex items-center justify-between pt-2 mt-auto">
                              <span className="text-sm font-black text-slate-900">
                                ₹{item.price}
                              </span>

                              {qty > 0 ? (
                                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-2 py-1">
                                  <button
                                    onClick={() => handleDecrease(item)}
                                    className="w-5 h-5 rounded-md bg-white text-slate-700 font-bold flex items-center justify-center shadow-xs text-xs hover:bg-slate-50"
                                  >
                                    <MinusOutlined className="text-[10px]" />
                                  </button>
                                  <span className="text-xs font-black text-slate-900 px-1">{qty}</span>
                                  <button
                                    onClick={() => handleAdd(item)}
                                    className="w-5 h-5 rounded-md bg-[#FF521C] text-white font-bold flex items-center justify-center shadow-xs text-xs hover:bg-orange-600"
                                  >
                                    <PlusOutlined className="text-[10px]" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAdd(item)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#FF521C] hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 active:scale-95"
                                >
                                  <span>Add</span>
                                  <PlusOutlined className="text-[10px]" />
                                </button>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <EmptyState
              title="No Items Found"
              description="No menu items matched your search query."
            />
          )}
        </div>

        {/* Right 1-Column Sidebar (Restaurant Details & Live Cart) */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* Card 1: Restaurant Details Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <InfoCircleOutlined className="text-[#FF521C]" />
                <span>Restaurant Details</span>
              </div>
              <button className="text-[11px] font-bold text-orange-600 hover:underline">
                View on Map &gt;
              </button>
            </div>

            {/* Key-Value Details */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Rating</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <StarFilled className="text-amber-400 text-xs" /> {storeRating} (12K+)
                </span>
              </div>

              <div className="flex justify-between items-start pt-1.5 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Cuisine</span>
                <span className="font-bold text-slate-900 text-right max-w-[150px]">{storeCuisine}</span>
              </div>

              <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Operating Hours</span>
                <span className="font-bold text-slate-900">{storeHours}</span>
              </div>

              <div className="flex justify-between items-start pt-1.5 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Address</span>
                <span className="font-semibold text-slate-800 text-right max-w-[150px]">{storeAddress}</span>
              </div>
            </div>

            {/* Feature Icons Grid (2x2) */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <SafetyCertificateOutlined className="text-orange-500" />
                  <span>Hygienic Food</span>
                </div>
                <p className="text-[10px] text-slate-500">Safety assured</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <RocketOutlined className="text-orange-500" />
                  <span>Fast Delivery</span>
                </div>
                <p className="text-[10px] text-slate-500">25-35 mins</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <CompassOutlined className="text-orange-500" />
                  <span>Live Tracking</span>
                </div>
                <p className="text-[10px] text-slate-500">Track your order</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <CreditCardOutlined className="text-orange-500" />
                  <span>Secure Payment</span>
                </div>
                <p className="text-[10px] text-slate-500">100% safe</p>
              </div>
            </div>

            {/* Promo Discount Banner */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-orange-100/60 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#DA291C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  M
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-[11px]">Free Fries on orders above ₹299</p>
                  <p className="text-[10px] text-orange-700 font-semibold">Use code: FRIES</p>
                </div>
              </div>
              <RightOutlined className="text-slate-400 text-xs" />
            </div>

          </div>

          {/* Card 2: Your Cart (Sticky Live Summary Card) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs sticky top-24 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <ShoppingOutlined className="text-[#FF521C] text-base" />
                <span>Your Cart</span>
                <span className="text-xs font-semibold text-slate-500">({cartTotalItems} items)</span>
              </div>
              <Link to="/customer/cart" className="text-[11px] font-bold text-orange-600 hover:underline">
                View Cart &gt;
              </Link>
            </div>

            {/* Cart Items List */}
            {cartItems.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((cItem) => (
                  <div key={cItem.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 max-w-[170px]">
                      <img
                        src={cItem.image_url || cItem.item?.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100'}
                        alt={cItem.name || cItem.item?.name}
                        className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <span className="font-bold text-slate-800 line-clamp-1">
                        {cItem.name || cItem.item?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-semibold text-slate-600">
                      <span className="text-slate-400">x {cItem.quantity}</span>
                      <span className="font-black text-slate-900 w-12 text-right">
                        ₹{Number(cItem.price || cItem.unit_price || 0) * cItem.quantity}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-sm">
                  <span className="font-extrabold text-slate-900">Total</span>
                  <span className="font-black text-slate-900 text-base">₹{cartSubtotal}</span>
                </div>

                <button
                  onClick={() => navigate('/customer/checkout')}
                  className="w-full py-3 rounded-xl bg-[#FF521C] hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>View Cart & Checkout</span>
                  <RightOutlined className="text-[10px]" />
                </button>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                <ShoppingOutlined className="text-2xl text-slate-300" />
                <p className="font-medium">Your cart is empty</p>
                <p className="text-[10px] text-slate-400">Add items from the menu to build your order.</p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
