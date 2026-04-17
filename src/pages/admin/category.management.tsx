import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import AdminTable from '../../components/admin/AdminTable';
import AdminLayout from '../../components/admin/AdminLayout';
import { CategoryApi, type Category, type FuelType } from '../../services/api/admin/category.api';
import { AxiosError } from 'axios';

type CategoryFormState = {
  name: string;
  description: string;
  subCategories: string[];
};

const ITEMS_PER_PAGE = 5;


const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
    name: '',
    description: '',
    subCategories: ['']
  });

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [editingFuel, setEditingFuel] = useState<FuelType | null>(null);
  const [fuelForm, setFuelForm] = useState({
    name: '',
    description: ''
  });

  // Table states
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [fuelSearch, setFuelSearch] = useState('');
  const [fuelPage, setFuelPage] = useState(1);

  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const [categoryTotalItems, setCategoryTotalItems] = useState(0);
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState('');

  // Debouce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCategorySearch(categorySearch);
      setCategoryPage(1);
    }, 800);
    return () => clearTimeout(timer);
  }, [categorySearch]);


  // ===== LOAD DATA =====
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CategoryApi.getAllCategories({
        page: categoryPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedCategorySearch
      });
      setCategories(data.data);
      setCategoryTotalPages(data.totalPages);
      setCategoryTotalItems(data.total);
    } catch (err) {
      console.error('Category loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryPage, debouncedCategorySearch]);

  const loadFuels = async () => {
    try {
      const data = await CategoryApi.getAllFuelTypes();
      setFuelTypes(data || []);
    } catch (err) {
      console.error('Fuel loading error:', err);
    }
  }

  const loadData = async () => {
    await Promise.all([loadCategories(), loadFuels()]);
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadFuels();
  }, []);

  // ===== CATEGORY FUNCTIONS =====
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        subCategories: category.subCategories.length > 0
          ? category.subCategories.map(sc => sc.name || '')
          : ['']
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', subCategories: [''] });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', subCategories: [''] });
  };

  const addSubCategoryField = () => {
    setCategoryForm((prev) => ({
      ...prev,
      subCategories: [...prev.subCategories, '']
    }));
  };

  const removeSubCategoryField = (index: number) => {
    setCategoryForm((prev) => ({
      ...prev,
      subCategories: prev.subCategories.filter((_, i) => i !== index)
    }));
  };

  const updateSubCategory = (index: number, value: string) => {
    setCategoryForm((prev) => ({
      ...prev,
      subCategories: prev.subCategories.map((sc, i) => i === index ? value : sc)
    }));
  };

  const saveCategoryHandler = async () => {
    const nameStr = categoryForm.name.trim();
    if (!nameStr) return;
    if (nameStr.length > 50) {
      alert('Category name cannot exceed 50 characters');
      return;
    }
    const nameRegex = /^[A-Za-z0-9\s\-_&]+$/;
    if (!nameRegex.test(nameStr)) {
      alert('Category name contains invalid characters');
      return;
    }

    const payload = {
      name: nameStr,
      description: categoryForm.description.trim() || undefined,
      subCategories: categoryForm.subCategories
        .filter((sc: string) => sc.trim() !== '')
        .map((name: string) => ({ name: name.trim() }))
    };

    try {
      if (editingCategory) {
        await CategoryApi.updateCategory(editingCategory._id, payload);
      } else {
        await CategoryApi.createCategory(payload);
      }

      await loadData();
      closeCategoryModal();
    } catch (err) {
      console.error('Save category error:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || error.message || 'Failed to save category');
    }
  };

  const toggleCategoryStatus = async (id: string) => {
    try {
      await CategoryApi.toggleCategoryStatus(id);
      await loadData();
    } catch (err) {
      console.error('Toggle category error:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || error.message || 'Failed to update status');
    }
  };

  // ===== FUEL TYPE FUNCTIONS =====
  const openFuelModal = (fuel?: FuelType) => {
    if (fuel) {
      setEditingFuel(fuel);
      setFuelForm({
        name: fuel.name,
        description: fuel.description || ''
      });
    } else {
      setEditingFuel(null);
      setFuelForm({ name: '', description: '' });
    }
    setShowFuelModal(true);
  };

  const closeFuelModal = () => {
    setShowFuelModal(false);
    setEditingFuel(null);
    setFuelForm({ name: '', description: '' });
  };

  const saveFuelHandler = async () => {
    const nameStr = fuelForm.name.trim();
    if (!nameStr) return;
    if (nameStr.length > 50) {
      alert('Fuel name cannot exceed 50 characters');
      return;
    }
    const nameRegex = /^[A-Za-z0-9\s\-_&]+$/;
    if (!nameRegex.test(nameStr)) {
      alert('Fuel name contains invalid characters');
      return;
    }

    const payload = {
      name: nameStr,
      description: fuelForm.description.trim() || undefined
    };

    try {
      if (editingFuel) {
        await CategoryApi.updateFuelType(editingFuel._id, payload);
      } else {
        await CategoryApi.createFuelType(payload);
      }

      await loadData();
      closeFuelModal();
    } catch (err) {
      console.error('Save fuel error:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || error.message || 'Failed to save fuel type');
    }
  };

  const toggleFuelStatus = async (id: string) => {
    try {
      await CategoryApi.toggleFuelTypeStatus(id);
      await loadData();
    } catch (err) {
      console.error('Toggle fuel error:', err);
      const error = err as AxiosError<{ message: string }>;
      alert(error.response?.data?.message || error.message || 'Failed to update status');
    }
  };

  // ===== TABLE DATA PREPARATION =====
  const categoryTableData = categories.map((c: Category) => ({
    _id: c._id,
    name: c.name,
    description: c.description || '-',
    subcategories: c.subCategories.length > 0
      ? c.subCategories.map(sc => sc.name).join(', ')
      : 'No subcategories',
    status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {c.isActive ? 'Active' : 'Blocked'}
      </span>
    )
  }));

  const filteredFuels = fuelTypes.filter((f: FuelType) =>
    f.name.toLowerCase().includes(fuelSearch.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(fuelSearch.toLowerCase())
  );

  const paginatedFuels = filteredFuels.slice(
    (fuelPage - 1) * ITEMS_PER_PAGE,
    fuelPage * ITEMS_PER_PAGE
  );

  const fuelTableData = paginatedFuels.map((f: FuelType) => ({
    _id: f._id,
    name: f.name,
    description: f.description || '-',
    status: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {f.isActive ? 'Active' : 'Blocked'}
      </span>
    )
  }));

  return (
    <AdminLayout activeItem="Category Management">
      {/* ========================================== */}
      {/* SECTION 1: Vehicle Categories */}
      {/* ========================================== */}
      <div className="border-b border-gray-200 bg-white rounded-xl mb-8 overflow-hidden shadow-sm">
        <div className="px-8 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Vehicle Categories</h1>
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        <div className="pb-8">
          <AdminTable
            data={categoryTableData}
            columns={[
              { key: 'name', label: 'Category Name' },
              { key: 'description', label: 'Description' },
              { key: 'subcategories', label: 'Subcategories' },
              { key: 'status', label: 'Status' }
            ]}
            title=""
            searchValue={categorySearch}
            onSearch={setCategorySearch}
            searchPlaceholder="Search categories..."
            page={categoryPage}
            totalPages={categoryTotalPages}
            onPageChange={setCategoryPage}
            totalItems={categoryTotalItems}
            actions={(item: { _id: string }) => {
              const category = categories.find((c: Category) => c._id === item._id);
              if (!category) return [];
              return [
                {
                  label: 'Edit',
                  onClick: () => openCategoryModal(category),
                  className: 'text-blue-600'
                },
                {
                  label: category.isActive ? 'Block' : 'Unblock',
                  onClick: () => toggleCategoryStatus(item._id),
                  className: category.isActive ? 'text-red-600' : 'text-green-600'
                }
              ];
            }}
            isLoading={loading}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* SECTION 2: Fuel Types */}
      {/* ========================================== */}
      <div className="bg-white">
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Fuel Types</h1>
          <button
            onClick={() => openFuelModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={20} />
            Add Fuel Type
          </button>
        </div>

        <div className="pb-8">
          <AdminTable
            data={fuelTableData}
            columns={[
              { key: 'name', label: 'Fuel Name' },
              { key: 'description', label: 'Description' },
              { key: 'status', label: 'Status' }
            ]}
            title=""
            searchValue={fuelSearch}
            onSearch={setFuelSearch}
            searchPlaceholder="Search fuel types..."
            page={fuelPage}
            totalPages={Math.ceil(filteredFuels.length / ITEMS_PER_PAGE)}
            onPageChange={setFuelPage}
            totalItems={filteredFuels.length}
            actions={(item: { _id: string }) => {
              const fuel = fuelTypes.find((f: FuelType) => f._id === item._id);
              if (!fuel) return [];
              return [
                {
                  label: 'Edit',
                  onClick: () => openFuelModal(fuel),
                  className: 'text-blue-600'
                },
                {
                  label: fuel.isActive ? 'Block' : 'Unblock',
                  onClick: () => toggleFuelStatus(item._id),
                  className: fuel.isActive ? 'text-red-600' : 'text-green-600'
                }
              ];
            }}
            isLoading={loading}
          />
        </div>
      </div>

      {/* ========================================== */}
      {/* CATEGORY MODAL */}
      {/* ========================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={closeCategoryModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Car, Bike, Scooter"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Brief description of this category"
                />
              </div>

              {/* Subcategories */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Subcategories
                  </label>
                  <button
                    type="button"
                    onClick={addSubCategoryField}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    + Add Subcategory
                  </button>
                </div>

                <div className="space-y-2">
                  {categoryForm.subCategories.map((subCat: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={subCat}
                        onChange={e => updateSubCategory(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={`Subcategory ${index + 1}`}
                      />
                      {categoryForm.subCategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubCategoryField(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCategoryModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCategoryHandler}
                disabled={!categoryForm.name.trim() || loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* FUEL TYPE MODAL */}
      {/* ========================================== */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingFuel ? 'Edit Fuel Type' : 'Add Fuel Type'}
              </h2>
              <button
                onClick={closeFuelModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Fuel Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Name *
                </label>
                <input
                  type="text"
                  value={fuelForm.name}
                  onChange={e => setFuelForm({ ...fuelForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Petrol, Diesel, Electric"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={fuelForm.description}
                  onChange={e => setFuelForm({ ...fuelForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Brief description of this fuel type"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeFuelModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFuelHandler}
                disabled={!fuelForm.name.trim() || loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingFuel ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CategoryManagement;