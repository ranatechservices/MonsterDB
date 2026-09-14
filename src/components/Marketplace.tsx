import React, { useState } from 'react';
import { ShoppingBag, Star, Check, ShieldCheck, Heart, Search, Filter } from 'lucide-react';
import { HealthPlan } from '../types';

const PRODUCTS = [
  {
    id: 'prod_1',
    name: 'Omron Smart Bluetooth BP Monitor',
    category: 'Biometric Devices',
    price: 2499,
    originalPrice: 3200,
    rating: 4.8,
    reviews: 642,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&auto=format&fit=crop&q=80',
    description: 'Clinically validated automatic upper arm blood pressure monitor with direct Healora app synchronization.'
  },
  {
    id: 'prod_2',
    name: 'Accu-Chek Instant Glucometer Kit',
    category: 'Diagnostic Devices',
    price: 1299,
    originalPrice: 1699,
    rating: 4.9,
    reviews: 820,
    image: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=300&auto=format&fit=crop&q=80',
    description: 'Instant blood glucose meter with 50 test strips, pain-free lancing device and USB sync.'
  },
  {
    id: 'prod_3',
    name: 'Comprehensive 84-Parameter Full Body Lab Package',
    category: 'Lab Packages',
    price: 1899,
    originalPrice: 4500,
    rating: 4.95,
    reviews: 1420,
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
    description: 'Free home blood sample collection. Includes CBC, Lipid Profile, Liver Function, Kidney Function, Thyroid and HbA1c.'
  },
  {
    id: 'prod_4',
    name: 'Organic Plant-Based Omega-3 & D3 Supplements',
    category: 'Nutrition & Wellness',
    price: 899,
    originalPrice: 1200,
    rating: 4.7,
    reviews: 310,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    description: 'Pure algae-sourced EPA & DHA for cardiovascular and joint resilience. 60 vegan softgels.'
  }
];

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartCount, setCartCount] = useState(0);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const filtered = PRODUCTS.filter((p) => selectedCategory === 'All' || p.category === selectedCategory);

  const handleBuy = (id: string) => {
    setCartCount((prev) => prev + 1);
    setOrderedIds((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-500" />
            Healora Health Store & Lab Marketplace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Certified smart biometric devices, diagnostic lab packages, and verified nutritional supplements
          </p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-2xl text-xs flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          <span>Cart: {cartCount} Items</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Biometric Devices', 'Diagnostic Devices', 'Lab Packages', 'Nutrition & Wellness'].map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === c
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((item) => {
          const isOrdered = orderedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-700 h-44">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-[10px] font-extrabold uppercase text-slate-800 dark:text-white">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mb-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{item.rating}</span>
                  <span className="text-slate-400 text-[10px]">({item.reviews})</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-base font-black text-slate-900 dark:text-white">₹{item.price}</span>
                  <span className="text-xs text-slate-400 line-through ml-2">₹{item.originalPrice}</span>
                </div>
                <button
                  id={`buy-${item.id}`}
                  onClick={() => handleBuy(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isOrdered
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {isOrdered ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Added
                    </>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
