import React, { useState, useMemo } from 'react';
import { Item, ProductList, StaffUser, CurrencyConfig } from '../types';
import { 
  Package, Plus, Search, Filter, Edit2, Trash2, Download, 
  Layers, Check, AlertCircle, ArrowUpDown, Tag, DollarSign, 
  Boxes, Star, ListFilter, CheckSquare, Square, FolderPlus,
  Info
} from 'lucide-react';
import { formatCurrency } from '../services/pdfGenerator';

interface ItemManagementProps {
  items: Item[];
  productLists: ProductList[];
  currencies: CurrencyConfig[];
  currentCurrency: string;
  currentUser: StaffUser;
  activeCompanyId?: string;
  onSaveItem: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
  onSaveProductList: (list: ProductList) => void;
  onDeleteProductList: (listId: string) => void;
}

export function ItemManagement({
  items,
  productLists = [],
  currencies,
  currentCurrency,
  currentUser,
  activeCompanyId,
  onSaveItem,
  onDeleteItem,
  onSaveProductList,
  onDeleteProductList,
}: ItemManagementProps) {
  // Navigation tab: 'items' or 'lists'
  const [activeTab, setActiveTab] = useState<'items' | 'lists'>('items');

  // Items search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductListFilter, setSelectedProductListFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Item Modal state
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemFormData, setItemFormData] = useState<Partial<Item>>({
    name: '',
    description: '',
    hsnCode: '',
    unit: 'Pcs',
    unitPrice: 0,
    purchasePrice: 0,
    taxRate: 18,
    category: 'General',
    stockQuantity: 100,
    productListIds: [],
  });
  const [itemFormErrors, setItemFormErrors] = useState<Record<string, string>>({});

  // Product List Modal state
  const [isListEditorOpen, setIsListEditorOpen] = useState(false);
  const [editingList, setEditingList] = useState<ProductList | null>(null);
  const [listFormData, setListFormData] = useState<Partial<ProductList>>({
    name: '',
    description: '',
    currency: currentCurrency || 'USD',
    isDefault: false,
    itemIds: [],
  });
  const [listFormErrors, setListFormErrors] = useState<Record<string, string>>({});

  const canEdit = currentUser.role !== 'auditor';

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.hsnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;

        const matchesProductList =
          selectedProductListFilter === 'all' ||
          (item.productListIds && item.productListIds.includes(selectedProductListFilter));

        return matchesSearch && matchesCat && matchesProductList;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        if (sortBy === 'price') diff = a.unitPrice - b.unitPrice;
        if (sortBy === 'stock') diff = (a.stockQuantity || 0) - (b.stockQuantity || 0);
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [items, searchTerm, selectedCategory, selectedProductListFilter, sortBy, sortOrder]);

  // Item Modal Handlers
  const openCreateItemModal = () => {
    setEditingItem(null);
    setItemFormData({
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      hsnCode: '',
      unit: 'Pcs',
      unitPrice: 0,
      purchasePrice: 0,
      taxRate: 18,
      category: 'General',
      stockQuantity: 50,
      companyId: activeCompanyId,
      productListIds: productLists.filter(p => p.isDefault).map(p => p.id),
      createdAt: new Date().toISOString().split('T')[0],
    });
    setItemFormErrors({});
    setIsItemEditorOpen(true);
  };

  const openEditItemModal = (item: Item) => {
    setEditingItem(item);
    setItemFormData({ 
      ...item,
      productListIds: item.productListIds || [],
    });
    setItemFormErrors({});
    setIsItemEditorOpen(true);
  };

  const validateItemForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!itemFormData.name?.trim()) errors.name = 'Item name is required.';
    if (itemFormData.unitPrice === undefined || itemFormData.unitPrice < 0) {
      errors.unitPrice = 'Selling price must be 0 or greater.';
    }
    if (itemFormData.taxRate === undefined || itemFormData.taxRate < 0) {
      errors.taxRate = 'Tax rate must be positive.';
    }
    setItemFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateItemForm()) return;

    const finalItem: Item = {
      id: editingItem?.id || `item-${Date.now()}`,
      name: itemFormData.name!.trim(),
      description: itemFormData.description?.trim() || '',
      hsnCode: itemFormData.hsnCode?.trim() || '',
      unit: itemFormData.unit || 'Pcs',
      unitPrice: Number(itemFormData.unitPrice || 0),
      purchasePrice: Number(itemFormData.purchasePrice || 0),
      taxRate: Number(itemFormData.taxRate || 0),
      category: itemFormData.category?.trim() || 'General',
      stockQuantity: Number(itemFormData.stockQuantity || 0),
      companyId: activeCompanyId || editingItem?.companyId,
      productListIds: itemFormData.productListIds || [],
      createdAt: editingItem?.createdAt || new Date().toISOString().split('T')[0],
    };

    onSaveItem(finalItem);
    setIsItemEditorOpen(false);
  };

  // Product List Modal Handlers
  const openCreateListModal = () => {
    setEditingList(null);
    setListFormData({
      id: `plist-${Date.now()}`,
      name: '',
      description: '',
      currency: currentCurrency || 'USD',
      isDefault: productLists.length === 0,
      itemIds: items.slice(0, 5).map(i => i.id),
      companyId: activeCompanyId,
    });
    setListFormErrors({});
    setIsListEditorOpen(true);
  };

  const openEditListModal = (list: ProductList) => {
    setEditingList(list);
    // Find all items associated with this list
    const associatedItemIds = list.itemIds && list.itemIds.length > 0 
      ? list.itemIds 
      : items.filter(i => i.productListIds?.includes(list.id)).map(i => i.id);

    setListFormData({
      ...list,
      itemIds: associatedItemIds,
    });
    setListFormErrors({});
    setIsListEditorOpen(true);
  };

  const validateListForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!listFormData.name?.trim()) errors.name = 'Product List name is required.';
    setListFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateListForm()) return;

    const listId = editingList?.id || `plist-${Date.now()}`;
    const finalList: ProductList = {
      id: listId,
      name: listFormData.name!.trim(),
      description: listFormData.description?.trim() || '',
      currency: listFormData.currency || currentCurrency || 'USD',
      isDefault: Boolean(listFormData.isDefault),
      companyId: activeCompanyId,
      itemIds: listFormData.itemIds || [],
      createdAt: editingList?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveProductList(finalList);

    // Also synchronize item productListIds for items checked in this list
    const selectedItemIds = new Set(listFormData.itemIds || []);
    items.forEach(item => {
      const currentLists = new Set(item.productListIds || []);
      const shouldInclude = selectedItemIds.has(item.id);
      
      if (shouldInclude && !currentLists.has(listId)) {
        currentLists.add(listId);
        onSaveItem({ ...item, productListIds: Array.from(currentLists) });
      } else if (!shouldInclude && currentLists.has(listId)) {
        currentLists.delete(listId);
        onSaveItem({ ...item, productListIds: Array.from(currentLists) });
      }
    });

    setIsListEditorOpen(false);
  };

  const exportItemsCsv = () => {
    const headers = ['Name', 'HSN/SAC', 'Category', 'Unit', 'Unit Price', 'Purchase Price', 'Tax %', 'Stock', 'Product Lists', 'Description'];
    const rows = filteredItems.map((i) => {
      const listNames = (i.productListIds || [])
        .map(id => productLists.find(p => p.id === id)?.name || id)
        .join('; ');
      return [
        `"${i.name.replace(/"/g, '""')}"`,
        `"${i.hsnCode}"`,
        `"${i.category}"`,
        `"${i.unit}"`,
        i.unitPrice,
        i.purchasePrice || 0,
        i.taxRate,
        i.stockQuantity || 0,
        `"${listNames}"`,
        `"${(i.description || '').replace(/"/g, '""')}"`,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Item_Master_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-indigo-600" />
            Product Lists & Inventory Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create multiple price lists and product catalogs (Wholesale, Retail, Hardware, AMC) for instant billing and invoicing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'items' && (
            <button
              onClick={exportItemsCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          )}

          {canEdit && (
            <>
              {activeTab === 'lists' ? (
                <button
                  onClick={openCreateListModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <FolderPlus className="w-4 h-4" />
                  Create Product List
                </button>
              ) : (
                <button
                  onClick={openCreateItemModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs Switcher: All Products vs Product Lists */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'items'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>All Products & Services</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'items' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('lists')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'lists'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Product Lists & Catalogs</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'lists' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {productLists.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ALL PRODUCTS & SERVICES */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Total Items</span>
                <Package className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{items.length}</p>
              <span className="text-[11px] text-slate-400">Products & services</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Product Lists</span>
                <ListFilter className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{productLists.length}</p>
              <span className="text-[11px] text-slate-400">Active billing catalogs</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Total Stock Units</span>
                <Boxes className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {items.reduce((acc, i) => acc + (i.stockQuantity || 0), 0)}
              </p>
              <span className="text-[11px] text-slate-400">Inventory on hand</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Avg. Unit Price</span>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(
                  items.length ? items.reduce((acc, i) => acc + i.unitPrice, 0) / items.length : 0,
                  currentCurrency,
                  currencies
                )}
              </p>
              <span className="text-[11px] text-slate-400">Base catalog rate</span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, HSN, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {/* Filter by Product List */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shrink-0">
                <ListFilter className="w-3.5 h-3.5 text-indigo-500" />
                <span>Product List:</span>
                <select
                  value={selectedProductListFilter}
                  onChange={(e) => setSelectedProductListFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Product Lists ({items.length})</option>
                  {productLists.map((p) => {
                    const count = items.filter(it => it.productListIds?.includes(p.id)).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Control */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                </select>
                <button
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="px-1 text-indigo-600 font-bold hover:bg-slate-200 rounded"
                  title="Toggle Asc/Desc"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Item Name & Description</th>
                    <th className="py-3 px-3">HSN / SAC</th>
                    <th className="py-3 px-3">Product Lists</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-3 text-right">Purchase Price</th>
                    <th className="py-3 px-3 text-center">Tax Rate</th>
                    <th className="py-3 px-3 text-center">In Stock</th>
                    {canEdit && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 9 : 8} className="py-12 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-medium">No items found matching your filter.</p>
                        <p className="text-xs text-slate-400 mt-1">Try refining your search or add a new item.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const itemProductLists = (item.productListIds || [])
                        .map(id => productLists.find(p => p.id === id))
                        .filter(Boolean) as ProductList[];

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
                            {item.description && (
                              <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1 max-w-md">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-700 font-medium">
                            {item.hsnCode || '-'}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {itemProductLists.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">None</span>
                              ) : (
                                itemProductLists.map(pl => (
                                  <span
                                    key={pl.id}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  >
                                    {pl.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.unitPrice, currentCurrency, currencies)}
                            <span className="text-[10px] text-slate-400 block font-normal">per {item.unit}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-500">
                            {item.purchasePrice ? (
                              formatCurrency(item.purchasePrice, currentCurrency, currencies)
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-medium">
                            <span className="inline-block bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[11px]">
                              {item.taxRate}%
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-medium">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                (item.stockQuantity || 0) <= 10
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {item.stockQuantity || 0} {item.unit}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete item "${item.name}" from catalog?`)) {
                                      onDeleteItem(item.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT LISTS & CATALOGS MANAGEMENT */}
      {activeTab === 'lists' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productLists.map((list) => {
              const listItems = items.filter(
                (it) => it.productListIds?.includes(list.id) || list.itemIds?.includes(it.id)
              );

              return (
                <div
                  key={list.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          <ListFilter className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            {list.name}
                            {list.isDefault && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Default
                              </span>
                            )}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Currency: {list.currency}
                          </span>
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditListModal(list)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                            title="Edit Product List"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {productLists.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete product list "${list.name}"? (Items in this catalog will remain in Item Master)`)) {
                                  onDeleteProductList(list.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded"
                              title="Delete Product List"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                      {list.description || 'No description provided for this product list.'}
                    </p>

                    {/* Items Preview in this list */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                        <span>Items in this List ({listItems.length})</span>
                        <button
                          onClick={() => {
                            setSelectedProductListFilter(list.id);
                            setActiveTab('items');
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium"
                        >
                          View in Catalog →
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                        {listItems.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-2">
                            No items assigned to this list yet. Click Edit to assign items.
                          </p>
                        ) : (
                          listItems.slice(0, 4).map((it) => (
                            <div key={it.id} className="flex items-center justify-between py-1 px-2 bg-slate-50 rounded text-[11px]">
                              <span className="font-medium text-slate-800 truncate max-w-[170px]">{it.name}</span>
                              <span className="font-mono font-semibold text-slate-600">
                                {formatCurrency(it.unitPrice, list.currency, currencies)}
                              </span>
                            </div>
                          ))
                        )}
                        {listItems.length > 4 && (
                          <div className="text-[10px] text-slate-400 text-center py-0.5">
                            +{listItems.length - 4} more products...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedProductListFilter(list.id);
                        setActiveTab('items');
                      }}
                      className="w-full py-1.5 text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      Filter Table by this List
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT ITEM */}
      {isItemEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingItem ? 'Edit Product / Service Item' : 'Add New Item to Inventory'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define product details, prices, and assign to product lists.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsItemEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-4 pt-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Cloud ERP Platform"
                  value={itemFormData.name || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    itemFormErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                />
                {itemFormErrors.name && (
                  <p className="text-rose-500 text-[11px] mt-1">{itemFormErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed technical specifications or service description..."
                  value={itemFormData.description || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* HSN/SAC & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 998313, 851762"
                    value={itemFormData.hsnCode || ''}
                    onChange={(e) => setItemFormData({ ...itemFormData, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software, Hardware, Services, Logistics"
                    value={itemFormData.category || ''}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Product Lists Assignment */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Assign to Product Lists / Catalogs</span>
                  <span className="text-[10px] text-slate-500 font-normal">Choose which catalogs list this item</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {productLists.map((p) => {
                    const isChecked = (itemFormData.productListIds || []).includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-xs ${
                          isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = itemFormData.productListIds || [];
                            if (e.target.checked) {
                              setItemFormData({ ...itemFormData, productListIds: [...current, p.id] });
                            } else {
                              setItemFormData({ ...itemFormData, productListIds: current.filter(id => id !== p.id) });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{p.name}</span>
                        {p.isDefault && <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0 ml-auto" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pricing & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemFormData.unitPrice ?? 0}
                    onChange={(e) => setItemFormData({ ...itemFormData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 text-xs rounded-lg border ${
                      itemFormErrors.unitPrice ? 'border-rose-400' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  />
                  {itemFormErrors.unitPrice && (
                    <p className="text-rose-500 text-[11px] mt-1">{itemFormErrors.unitPrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost / Purchase Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemFormData.purchasePrice ?? 0}
                    onChange={(e) => setItemFormData({ ...itemFormData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={itemFormData.unit || 'Pcs'}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Units">Units</option>
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                    <option value="License">License</option>
                    <option value="Month">Month</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kg (Kilograms)</option>
                    <option value="Sets">Sets</option>
                    <option value="Shipment">Shipment</option>
                  </select>
                </div>
              </div>

              {/* Tax Rate & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax / GST Rate (%)
                  </label>
                  <select
                    value={itemFormData.taxRate ?? 18}
                    onChange={(e) => setItemFormData({ ...itemFormData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST (Standard)</option>
                    <option value={28}>28% GST (Luxury / Hardware)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.stockQuantity ?? 0}
                    onChange={(e) => setItemFormData({ ...itemFormData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {editingItem ? 'Save Item Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT PRODUCT LIST */}
      {isListEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ListFilter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingList ? 'Edit Product List / Catalog' : 'Create New Product List'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure specialized catalog pricing, currency, and included products.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsListEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleListSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product List Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wholesale Tier, Retail Price List, Hardware & Spares"
                  value={listFormData.name || ''}
                  onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    listFormErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                />
                {listFormErrors.name && (
                  <p className="text-rose-500 text-[11px] mt-1">{listFormErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Volume discount catalog for authorized B2B distributors and enterprise contracts..."
                  value={listFormData.description || ''}
                  onChange={(e) => setListFormData({ ...listFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Currency
                  </label>
                  <select
                    value={listFormData.currency || currentCurrency}
                    onChange={(e) => setListFormData({ ...listFormData, currency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(listFormData.isDefault)}
                      onChange={(e) => setListFormData({ ...listFormData, isDefault: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Set as Default Catalog</span>
                  </label>
                </div>
              </div>

              {/* Items multi-select assignment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Include Items in this Catalog ({listFormData.itemIds?.length || 0} selected)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setListFormData({ ...listFormData, itemIds: items.map(i => i.id) })}
                      className="text-indigo-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setListFormData({ ...listFormData, itemIds: [] })}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50 p-1">
                  {items.map((item) => {
                    const isSelected = (listFormData.itemIds || []).includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          const current = listFormData.itemIds || [];
                          if (isSelected) {
                            setListFormData({ ...listFormData, itemIds: current.filter(id => id !== item.id) });
                          } else {
                            setListFormData({ ...listFormData, itemIds: [...current, item.id] });
                          }
                        }}
                        className={`p-2 rounded-md flex items-center justify-between cursor-pointer text-xs transition ${
                          isSelected ? 'bg-indigo-50 text-indigo-950 font-medium' : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">({item.category})</span>
                        </div>
                        <span className="font-mono font-bold shrink-0 ml-2">
                          {formatCurrency(item.unitPrice, listFormData.currency || currentCurrency, currencies)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsListEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {editingList ? 'Save Product List' : 'Create Product List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
