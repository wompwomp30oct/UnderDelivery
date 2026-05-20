'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import {
  addMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  updateMenuItem,
} from '@/lib/firebase/firestore';
import { CATEGORIES, formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import './menu.css';

const initialFormState = {
  name: '',
  description: '',
  price: '',
  category: 'snacks',
  imageUrl: '',
  isVeg: true,
  isAvailable: true,
  sortOrder: 0,
};

export default function AdminMenuPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [formData, setFormData] = useState(initialFormState);
  const [initialForm, setInitialForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sortMode, setSortMode] = useState('sortOrder');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && profile?.role !== 'admin') {
      router.push('/select-role');
    }
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const loadItems = async () => {
      try {
        const data = await getAllMenuItems();
        setItems(data || []);
      } catch (error) {
        addToast('Failed to load menu items', 'error');
      } finally {
        setLoadingItems(false);
      }
    };

    loadItems();
  }, [user, profile, addToast]);

  const sortedItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const list = items.filter(item => {
      if (!normalized) return true;
      return (
        item.name?.toLowerCase().includes(normalized)
        || item.description?.toLowerCase().includes(normalized)
      );
    });
    if (sortMode === 'category') {
      return list.sort((a, b) => {
        const categoryCompare = String(a.category || '').localeCompare(String(b.category || ''));
        if (categoryCompare !== 0) return categoryCompare;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
    }
    return list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [items, sortMode, searchQuery]);

  const resetForm = () => {
    setFormData(initialFormState);
    setInitialForm(initialFormState);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    const nextForm = {
      name: item.name || '',
      description: item.description || '',
      price: item.price ?? '',
      category: item.category || 'snacks',
      imageUrl: item.imageUrl || '',
      isVeg: item.isVeg ?? true,
      isAvailable: item.isAvailable ?? true,
      sortOrder: item.sortOrder ?? 0,
    };
    setFormData(nextForm);
    setInitialForm(nextForm);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete ${item.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteMenuItem(item.id);
      setItems(prev => prev.filter(existing => existing.id !== item.id));
      addToast('Menu item deleted.', 'success');
    } catch (error) {
      addToast('Failed to delete item.', 'error');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const nextValue = !item.isAvailable;
      await updateMenuItem(item.id, { isAvailable: nextValue });
      setItems(prev => prev.map(existing => (
        existing.id === item.id ? { ...existing, isAvailable: nextValue } : existing
      )));
      addToast(`Marked ${item.name} as ${nextValue ? 'available' : 'unavailable'}.`, 'success');
    } catch (error) {
      addToast('Failed to update availability.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      addToast('Name and price are required.', 'error');
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
      sortOrder: Number(formData.sortOrder) || 0,
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateMenuItem(editingId, payload);
        setItems(prev => prev.map(item => (item.id === editingId ? { ...item, ...payload } : item)));
        addToast('Menu item updated.', 'success');
      } else {
        const docRef = await addMenuItem(payload);
        setItems(prev => [{ id: docRef.id, ...payload }, ...prev]);
        addToast('Menu item added.', 'success');
      }
      resetForm();
    } catch (error) {
      addToast('Failed to save menu item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialForm);
  }, [formData, initialForm]);

  if (loading || loadingItems) {
    return (
      <div className="page-loader">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container py-8 admin-menu-page">
      <header className="admin-menu-header">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-secondary">Add, edit, and organize UnderBelly menu items.</p>
        </div>
        <div className="admin-menu-actions">
          <Button className="btn btn-ghost" onClick={() => router.push('/admin')}>
            Back to Admin
          </Button>
          <Button className="btn btn-ghost" onClick={() => router.push('/menu')}>
            Back to Menu
          </Button>
        </div>
      </header>

      <div className="admin-menu-grid">
        <div className="glass-card admin-menu-form">
          <h2 className="section-title">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
          <form onSubmit={handleSubmit} className="menu-form">
            <div className="form-group">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-input"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Price (INR)</label>
                <input
                  type="number"
                  name="price"
                  className="form-input"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  name="category"
                  className="form-input"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {Object.entries(CATEGORIES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  name="imageUrl"
                  className="form-input"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input
                  type="number"
                  name="sortOrder"
                  className="form-input"
                  value={formData.sortOrder}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-toggle-row">
              <label className="toggle">
                <input
                  type="checkbox"
                  name="isVeg"
                  checked={formData.isVeg}
                  onChange={handleChange}
                />
                <span>Vegetarian</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                />
                <span>Available</span>
              </label>
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                className="btn btn-primary"
                isLoading={saving}
                disabled={editingId ? !isDirty : saving}
              >
                {editingId ? 'Save Changes' : 'Add Item'}
              </Button>
              <Button
                type="button"
                className="btn btn-ghost"
                onClick={resetForm}
              >
                {editingId ? 'Cancel' : 'Reset'}
              </Button>
            </div>
            {isDirty && (
              <p className="form-warning">You have unsaved changes.</p>
            )}
          </form>
        </div>

        <div className="glass-card admin-menu-list">
          <div className="admin-menu-list-header">
            <h2 className="section-title">Current Menu</h2>
            <div className="list-controls">
              <input
                type="search"
                className="list-search"
                placeholder="Search items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              )}
              <span className="list-count">{sortedItems.length} items</span>
              <div className="sort-toggle">
                <span>Sort:</span>
                <button
                  type="button"
                  className={sortMode === 'sortOrder' ? 'active' : ''}
                  onClick={() => setSortMode('sortOrder')}
                >
                  Sort Order
                </button>
                <button
                  type="button"
                  className={sortMode === 'category' ? 'active' : ''}
                  onClick={() => setSortMode('category')}
                >
                  Category
                </button>
              </div>
            </div>
          </div>
          {sortedItems.length === 0 ? (
            <div className="admin-empty">
              {searchQuery.trim() ? 'No matches found.' : 'No menu items yet.'}
            </div>
          ) : (
            <div className="menu-list">
              {sortedItems.map(item => (
                <div key={item.id} className="menu-item-card">
                  <div>
                    <h3>{item.name}</h3>
                    <p className="text-secondary">{item.description || 'No description'}</p>
                  </div>
                  <div className="menu-item-meta">
                    <span>{formatPrice(item.price)}</span>
                    <span className="menu-item-tag">{CATEGORIES[item.category]?.label || item.category}</span>
                    <span className={`menu-item-pill ${item.isVeg ? 'veg' : 'non-veg'}`}>
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                    <span className={item.isAvailable ? 'status-available' : 'status-unavailable'}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="menu-item-actions">
                    <Button className="btn btn-ghost btn-sm" onClick={() => handleEdit(item)}>
                      Edit
                    </Button>
                    <Button className="btn btn-ghost btn-sm" onClick={() => handleToggleAvailability(item)}>
                      {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                    </Button>
                    <Button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
