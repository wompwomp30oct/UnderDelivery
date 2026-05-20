'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMenuItems } from '@/lib/firebase/firestore';
import { useCart } from '@/hooks/useCart';
import { CATEGORIES, formatPrice, getCafeStatus } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import './menu.css';

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(() => new Date());
  const { addItem } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    async function loadMenu() {
      try {
        const fetchedItems = await getMenuItems();
        setItems(fetchedItems);
      } catch (error) {
        console.error('Error fetching menu:', error);
        addToast('Failed to load menu items', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [addToast]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const cafeStatus = useMemo(() => getCafeStatus(now), [now]);
  const isCafeClosed = !cafeStatus.isOpen;

  const handleAddToCart = (item) => {
    addItem(item);
    addToast(`Added ${item.name} to cart`, 'success', 2000);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesQuery = !normalizedQuery
      || item.name?.toLowerCase().includes(normalizedQuery)
      || item.description?.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  if (loading) {
    return (
      <div className="page-loader">
        <Loader size="lg" />
        <p>Loading the UnderBelly menu...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 menu-container">
      <div className="menu-header text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">UnderBelly Menu</h1>
        <p className="text-secondary">Fresh food, fast delivery right to your hostel</p>
      </div>

      {isCafeClosed && (
        <div className="notice-banner">
          <span className="notice-icon">⏰</span>
          <div>
            <strong>Cafe is closed right now.</strong>
            <p className="text-secondary">
              Orders are accepted Mon–Sat {cafeStatus.opensAt}–{cafeStatus.closesAt} ({cafeStatus.timezone}).
            </p>
          </div>
        </div>
      )}

      <div className="menu-toolbar">
        <div className="menu-search">
          <input
            type="search"
            className="search-input"
            placeholder="Search burgers, shakes, wraps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search menu items"
          />
        </div>

        <div className="category-filters">
          <button
            className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            🍽️ All
          </button>
          {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
            <button
              key={key}
              className={`filter-btn ${activeCategory === key ? 'active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state text-center py-12">
          <div className="text-5xl mb-4">🍽️</div>
          <h3>No items found</h3>
          <p className="text-secondary">
            {normalizedQuery
              ? `No matches for "${searchQuery.trim()}".`
              : 'Looks like the menu is empty right now.'}
          </p>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map((item, index) => (
            <div 
              key={item.id} 
              className={`menu-card glass-card stagger-${(index % 5) + 1}`}
            >
              <div className="menu-card-img">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <div className="menu-img-placeholder">
                    {CATEGORIES[item.category]?.emoji || '🍔'}
                  </div>
                )}
                {item.isVeg !== undefined && (
                  <div className={`veg-badge ${item.isVeg ? 'veg' : 'non-veg'}`}>
                    <span className="dot"></span>
                  </div>
                )}
              </div>
              
              <div className="menu-card-content">
                <div className="menu-card-header">
                  <h3 className="menu-title">{item.name}</h3>
                  <span className="menu-price">{formatPrice(item.price)}</span>
                </div>
                
                <p className="menu-desc">{item.description}</p>
                
                <Button
                  onClick={() => handleAddToCart(item)}
                  className="btn btn-primary btn-full mt-auto"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
