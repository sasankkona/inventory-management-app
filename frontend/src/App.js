import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import ProductTable from './components/ProductTable';
import InventoryHistorySidebar from './components/InventoryHistorySidebar';
import {
  getProducts,
  searchProducts,
  importProducts,
  exportProducts,
  updateProduct,
} from './api';

function App() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      list = list.filter((p) => p.category === categoryFilter);
    }
    return list;
  }, [products, searchQuery, categoryFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    try {
      if (!value) {
        await loadProducts();
      } else {
        const data = await searchProducts(value);
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
      setError('Search failed');
    }
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        setLoading(true);
        setError('');
        const result = await importProducts(file);
        window.alert(
          `Import completed. Added: ${result.added}, Skipped: ${result.skipped}`
        );
        await loadProducts();
      } catch (err) {
        console.error(err);
        setError('Import failed');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const handleExportClick = async () => {
    try {
      const blob = await exportProducts();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      setError('Export failed');
    }
  };

  const handleEditRow = (product) => {
    setEditingProduct(product);
  };

  const handleEditChange = (field, value) => {
    setEditingProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      setLoading(true);
      setError('');
      const updated = await updateProduct(editingProduct.id, editingProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      setError('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-left">
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="input search-input"
          />
          <select
            className="input select-input"
            value={categoryFilter}
            onChange={handleCategoryChange}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary">
            Add New Product
          </button>
        </div>
        <div className="header-right">
          <button type="button" className="btn" onClick={handleImportClick}>
            Import
          </button>
          <button type="button" className="btn" onClick={handleExportClick}>
            Export
          </button>
        </div>
      </header>

      {loading && <p className="info-text">Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {editingProduct && (
        <div className="edit-bar">
          <span>Editing: {editingProduct.name}</span>
          <input
            className="input"
            value={editingProduct.name}
            onChange={(e) => handleEditChange('name', e.target.value)}
          />
          <input
            className="input"
            placeholder="Unit"
            value={editingProduct.unit || ''}
            onChange={(e) => handleEditChange('unit', e.target.value)}
          />
          <input
            className="input"
            placeholder="Category"
            value={editingProduct.category || ''}
            onChange={(e) => handleEditChange('category', e.target.value)}
          />
          <input
            className="input"
            placeholder="Brand"
            value={editingProduct.brand || ''}
            onChange={(e) => handleEditChange('brand', e.target.value)}
          />
          <input
            className="input"
            type="number"
            min="0"
            placeholder="Stock"
            value={editingProduct.stock}
            onChange={(e) => handleEditChange('stock', e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSaveEdit}>
            Save
          </button>
          <button className="btn" onClick={handleCancelEdit}>
            Cancel
          </button>
        </div>
      )}

      <main className="app-main">
        <ProductTable
          products={filteredProducts}
          onEditRow={handleEditRow}
          onSelectProduct={setSelectedProduct}
        />
      </main>

      <InventoryHistorySidebar
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default App;
