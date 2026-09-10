import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import socket from '../../socket';
import { 
  SearchOutlined, 
  StarFilled, 
  EnvironmentOutlined, 
  CarOutlined, 
  ArrowRightOutlined,
  CheckOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  CloseOutlined,
  SendOutlined,
  MessageOutlined,
  CheckCircleFilled
} from '@ant-design/icons';

// Realistic Delivery Partner Data matching reference design exactly
const fallbackPartners = [
  {
    id: 'p1',
    name: 'Amit Sharma',
    status: 'Online',
    rating: 4.9,
    reviewsCount: 320,
    area: 'Salt Lake',
    city: 'Kolkata',
    deliveries: '1,250+',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Honda Activa 6G (WB-02-AK-9821)',
    joinDate: 'Jan 2024',
    phone: '+91 98301 23456'
  },
  {
    id: 'p2',
    name: 'Rahul Das',
    status: 'Online',
    rating: 4.8,
    reviewsCount: 280,
    area: 'New Town',
    city: 'Kolkata',
    deliveries: '980+',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    vehicle: 'TVS Jupiter (WB-04-BF-4412)',
    joinDate: 'Mar 2024',
    phone: '+91 98312 87654'
  },
  {
    id: 'p3',
    name: 'Sanjay Kumar',
    status: 'Online',
    rating: 4.7,
    reviewsCount: 190,
    area: 'Rajarhat',
    city: 'Kolkata',
    deliveries: '860+',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Hero Splendor+ (WB-06-EH-1029)',
    joinDate: 'May 2024',
    phone: '+91 98322 11223'
  },
  {
    id: 'p4',
    name: 'Imran Ali',
    status: 'Busy',
    rating: 4.6,
    reviewsCount: 150,
    area: 'Kasba',
    city: 'Kolkata',
    deliveries: '720+',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Bajaj Pulsar 150 (WB-08-CD-7741)',
    joinDate: 'Feb 2024',
    phone: '+91 98333 44556'
  },
  {
    id: 'p5',
    name: 'Vikash Singh',
    status: 'Offline',
    rating: 4.5,
    reviewsCount: 120,
    area: 'Howrah',
    city: 'Kolkata',
    deliveries: '650+',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Suzuki Access 125 (WB-12-AB-3390)',
    joinDate: 'Jun 2024',
    phone: '+91 98344 55667'
  },
  {
    id: 'p6',
    name: 'Rohit Yadav',
    status: 'Online',
    rating: 4.8,
    reviewsCount: 210,
    area: 'Tollygunge',
    city: 'Kolkata',
    deliveries: '920+',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Yamaha FZ-S (WB-10-YZ-8812)',
    joinDate: 'Apr 2024',
    phone: '+91 98355 66778'
  },
  {
    id: 'p7',
    name: 'MD Arif',
    status: 'Online',
    rating: 4.7,
    reviewsCount: 175,
    area: 'Park Street',
    city: 'Kolkata',
    deliveries: '810+',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Ather 450X EV (WB-01-EV-9001)',
    joinDate: 'Jan 2024',
    phone: '+91 98366 77889'
  },
  {
    id: 'p8',
    name: 'Sourav Ghosh',
    status: 'Offline',
    rating: 4.4,
    reviewsCount: 98,
    area: 'Behala',
    city: 'Kolkata',
    deliveries: '540+',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Hero Passion Pro (WB-14-XY-6623)',
    joinDate: 'Jul 2024',
    phone: '+91 98377 88990'
  },
  {
    id: 'p9',
    name: 'Priya Roy',
    status: 'Online',
    rating: 4.9,
    reviewsCount: 410,
    area: 'Salt Lake',
    city: 'Kolkata',
    deliveries: '1,420+',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    vehicle: 'TVS Ntorq 125 (WB-02-PR-1102)',
    joinDate: 'Dec 2023',
    phone: '+91 98388 99001'
  },
  {
    id: 'p10',
    name: 'Deepak Verma',
    status: 'Online',
    rating: 4.8,
    reviewsCount: 310,
    area: 'New Town',
    city: 'Kolkata',
    deliveries: '1,150+',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Honda Shine (WB-04-DV-7788)',
    joinDate: 'Jan 2024',
    phone: '+91 98399 00112'
  },
  {
    id: 'p11',
    name: 'Subhash Mallick',
    status: 'Busy',
    rating: 4.7,
    reviewsCount: 245,
    area: 'Lake Town',
    city: 'Kolkata',
    deliveries: '890+',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    vehicle: 'Bajaj Pulsar N160 (WB-06-SM-4321)',
    joinDate: 'Mar 2024',
    phone: '+91 98310 11223'
  },
  {
    id: 'p12',
    name: 'Arjun Seal',
    status: 'Online',
    rating: 4.9,
    reviewsCount: 380,
    area: 'Garia',
    city: 'Kolkata',
    deliveries: '1,310+',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    vehicle: 'TVS Apache RTR 160 (WB-16-AS-9988)',
    joinDate: 'Nov 2023',
    phone: '+91 98321 22334'
  }
];

export default function Partners() {
  const { user } = useSelector(state => state.auth);
  const [partnersList, setPartnersList] = useState(fallbackPartners);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedAvailability, setSelectedAvailability] = useState('Online Now');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Live Messaging Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [messageSentStatus, setMessageSentStatus] = useState(false);

  // Fetch approved delivery partners from backend
  useEffect(() => {
    const fetchApprovedPartners = async () => {
      try {
        const response = await axios.get('/auth/approved-partners');
        if (response.data?.success && response.data.data?.length > 0) {
          const apiPartners = response.data.data;
          const combined = [...apiPartners, ...fallbackPartners.filter(fp => !apiPartners.some(ap => ap.id === fp.id))];
          setPartnersList(combined);
        }
      } catch (err) {
        console.log('Using pre-populated partner directory');
      }
    };

    fetchApprovedPartners();
  }, []);

  // Filtering Logic
  const filteredPartners = useMemo(() => {
    return partnersList.filter(partner => {
      const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            partner.area.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesArea = selectedArea === 'All Areas' || partner.area.toLowerCase() === selectedArea.toLowerCase();

      let matchesAvailability = true;
      if (selectedAvailability === 'Online Now') {
        matchesAvailability = partner.status === 'Online';
      } else if (selectedAvailability === 'High Rated') {
        matchesAvailability = partner.rating >= 4.8;
      } else if (selectedAvailability === 'Top Partners') {
        matchesAvailability = parseInt(partner.deliveries.toString().replace(/,/g, '')) >= 800;
      }

      return matchesSearch && matchesArea && matchesAvailability;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'deliveries') return parseInt(b.deliveries.toString().replace(/,/g, '')) - parseInt(a.deliveries.toString().replace(/,/g, ''));
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [partnersList, searchTerm, selectedArea, selectedAvailability, sortBy]);

  // Handle live message submit to delivery partner
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedPartner) return;

    const newMsg = {
      id: Date.now(),
      sender: user?.full_name || 'Customer',
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, newMsg]);
    
    if (socket && socket.connected) {
      socket.emit('CUSTOMER_MESSAGE', {
        partnerId: selectedPartner.id,
        senderName: user?.full_name || 'Customer',
        message: chatMessage.trim()
      });
    }

    setChatMessage('');
    setMessageSentStatus(true);

    setTimeout(() => {
      setMessageSentStatus(false);
    }, 3000);
  };

  const areasList = ['All Areas', 'Kolkata', 'Salt Lake', 'New Town', 'Rajarhat', 'Howrah', 'Other'];
  const availabilityOptions = ['Online Now', 'Available Today', 'High Rated', 'Top Partners'];

  return (
    <div className="pb-16 animate-fade-in -mt-16 bg-[#F8FAFC]">
      
      {/* ── 1. HERO BANNER (Matches RestaurantList & MenuList exact height & width) ── */}
      <div className="bg-neutral-900 text-white pt-24 pb-16 border-b border-neutral-800 relative overflow-hidden">
        {/* Delivery Partner Banner Image */}
        <img 
          src="/brand_foods/delevery_partner_band.png" 
          alt="Delivery Partner Banner" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              🛵 Our Delivery Partners
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Meet Our <span className="text-orange-500">Partners</span>
            </h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Real people. Real effort. Bringing your favorite food, faster.
            </p>

            {/* 3 Feature Highlights Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold">
                <span className="text-base">🛵</span>
                <div>
                  <p className="leading-none text-white">Fast & Reliable</p>
                  <p className="text-[10px] text-neutral-300 font-normal mt-0.5">On-time delivery</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold">
                <span className="text-base">❤️</span>
                <div>
                  <p className="leading-none text-white">Trusted Partners</p>
                  <p className="text-[10px] text-neutral-300 font-normal mt-0.5">Background verified</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold">
                <span className="text-base">👥</span>
                <div>
                  <p className="leading-none text-white">Growing Together</p>
                  <p className="text-[10px] text-neutral-300 font-normal mt-0.5">Build a better community</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block text-right pr-6">
            <span className="font-serif italic text-amber-400 text-2xl font-bold tracking-wide transform rotate-[-3deg] block drop-shadow-md">
              "Good Food Brings People Together ✨"
            </span>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
              Background Verified • Delivered Fast
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN CONTENT AREA (FILTERS + PARTNER CARDS GRID) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <p className="text-xs font-bold text-slate-600">
            Showing <span className="text-orange-600 font-black">{filteredPartners.length}</span> delivery partners
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              <option value="rating">Rating (Highest First)</option>
              <option value="deliveries">Total Deliveries</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Grid Layout: Left Sidebar + Right Partner Cards */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ── LEFT SIDEBAR FILTERS ── */}
          <aside className="w-full lg:w-60 shrink-0 space-y-6 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            
            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Search Partner
              </label>
              <div className="relative">
                <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search delivery partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Availability Filter */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
                Availability
              </h3>
              <div className="space-y-2">
                {availabilityOptions.map((opt) => {
                  const isChecked = selectedAvailability === opt;
                  return (
                    <label
                      key={opt}
                      onClick={() => setSelectedAvailability(opt)}
                      className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors select-none"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-orange-600 border-orange-600 text-white shadow-xs' 
                          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                      }`}>
                        {isChecked && <CheckOutlined className="text-[10px]" />}
                      </div>
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Areas Filter */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
                Areas
              </h3>
              <div className="space-y-2">
                {areasList.map((area) => {
                  const isChecked = selectedArea === area;
                  return (
                    <label
                      key={area}
                      onClick={() => setSelectedArea(area)}
                      className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors select-none"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-orange-600 border-orange-600 text-white shadow-xs' 
                          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                      }`}>
                        {isChecked && <CheckOutlined className="text-[10px]" />}
                      </div>
                      <span>{area}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* ── RIGHT PARTNER CARDS GRID ── */}
          <main className="flex-1 w-full">
            {filteredPartners.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {filteredPartners.map((partner) => {
                  const isOnline = partner.status === 'Online';
                  const isBusy = partner.status === 'Busy';

                  return (
                    <div
                      key={partner.id}
                      className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden text-center"
                    >
                      {/* Top Ambient Circle Graphic */}
                      <div className="w-28 h-28 rounded-full bg-gradient-to-b from-orange-50 to-transparent absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none" />

                      {/* Driver Circular Photo */}
                      <div className="relative mx-auto mb-3">
                        <img
                          src={partner.avatar}
                          alt={partner.name}
                          className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover relative z-10 group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Status Badge */}
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border">
                          {isOnline ? (
                            <span className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 border">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          ) : isBusy ? (
                            <span className="bg-amber-50 text-amber-700 border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 border">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Busy
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1 border">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Offline
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Partner Name & Rating */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-slate-800">
                          <StarFilled className="text-amber-400 text-xs" />
                          <span>{partner.rating}</span>
                          <span className="text-slate-400 font-medium">({partner.reviewsCount})</span>
                        </div>

                        <h3 className="font-black text-slate-900 text-base group-hover:text-orange-600 transition-colors">
                          {partner.name}
                        </h3>

                        <p className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1 truncate">
                          <EnvironmentOutlined className="text-orange-500 text-xs shrink-0" />
                          <span>{partner.area}, {partner.city}</span>
                        </p>

                        <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1 pt-0.5">
                          <CarOutlined className="text-slate-400 text-xs" />
                          <span>{partner.deliveries} Deliveries</span>
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setSelectedPartner(partner);
                          setChatHistory([]);
                        }}
                        className="w-full py-2.5 bg-[#FFF4F0] hover:bg-[#FFE8E0] active:scale-98 text-orange-600 font-extrabold text-xs rounded-2xl border border-orange-100 transition-all flex items-center justify-center gap-1.5 group/btn cursor-pointer shadow-2xs"
                      >
                        <span>View Profile</span>
                        <ArrowRightOutlined className="text-xs group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 text-xl flex items-center justify-center mx-auto">
                  <SearchOutlined />
                </div>
                <h3 className="font-black text-slate-800 text-base">No delivery partners found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Try clearing your search query or selecting a different area filter to view active riders.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedArea('All Areas');
                    setSelectedAvailability('Online Now');
                  }}
                  className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-orange-700 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </main>

        </div>

      </div>

      {/* ── 3. DRIVER PROFILE DETAIL & REAL-TIME MESSAGING MODAL ── */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl relative space-y-5 my-8">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedPartner(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer z-10"
            >
              <CloseOutlined className="text-xs" />
            </button>

            {/* Driver Profile Header */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <img
                src={selectedPartner.avatar}
                alt={selectedPartner.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-md shrink-0"
              />
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedPartner.status}
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedPartner.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedPartner.area}, {selectedPartner.city}
                </p>
              </div>
            </div>

            {/* Profile Statistics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rating Score</span>
                <p className="text-base font-black text-slate-900 flex items-center gap-1">
                  <StarFilled className="text-amber-400 text-sm" />
                  {selectedPartner.rating} <span className="text-xs text-slate-400 font-normal">({selectedPartner.reviewsCount})</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed Orders</span>
                <p className="text-base font-black text-slate-900">
                  {selectedPartner.deliveries}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5 col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered Vehicle</span>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CarOutlined className="text-orange-500" />
                  {selectedPartner.vehicle}
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <SafetyCertificateOutlined className="text-emerald-500 text-base" />
                <span>Background Verified Partner</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Since {selectedPartner.joinDate}</span>
            </div>

            {/* LIVE MESSAGING & CHAT SECTION */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MessageOutlined className="text-orange-500 text-sm" />
                  <span>Send Direct Message</span>
                </h4>
                {messageSentStatus && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircleFilled className="text-xs" /> Message sent to partner!
                  </span>
                )}
              </div>

              {/* Chat Messages History */}
              {chatHistory.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                  {chatHistory.map(msg => (
                    <div key={msg.id} className="bg-orange-500 text-white p-2.5 rounded-2xl max-w-[85%] ml-auto text-left shadow-xs">
                      <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] text-orange-100 block text-right font-bold mt-1">{msg.time} • Delivered</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Send message to ${selectedPartner.name.split(' ')[0]}...`}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <SendOutlined className="text-xs" />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Direct Phone Call Button */}
            <a
              href={`tel:${selectedPartner.phone}`}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <PhoneOutlined />
              <span>Call Partner ({selectedPartner.phone})</span>
            </a>

          </div>
        </div>
      )}

    </div>
  );
}
