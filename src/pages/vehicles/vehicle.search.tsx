import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import VehicleGrid from '../../components/home/VehicleGrid';
import { useAuthStore } from '../../stores/authStore';

import Navbar from '../../components/user/Navbar';
import { CategoryApi, type Category, type FuelType } from '../../services/api/admin/category.api';

import type { SearchFilters } from '../../types/vehicle.types';

// Helper Components
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, children }) => (
  <div className="mb-6">
    <h4 className="font-bold text-gray-900 mb-4">{title}</h4>
    <div className="space-y-2.5">
      {children}
    </div>
  </div>
);

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer group p-1.5 -ml-1.5 rounded-xl hover:bg-gray-50 transition-colors">
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
      />
      <div className="absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{label}</span>
  </label>
);

interface FilterPanelProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  range: number;
  setRange: (val: number) => void;
  filters: SearchFilters;
  isFiltersLoading: boolean;
  categories: Category[];
  fuelTypes: FuelType[];
  localPriceRange: { min: string; max: string };
  handleFilterChange: (category: keyof SearchFilters, value: string | Partial<SearchFilters['priceRange']>) => void;
  handlePriceChange: (type: 'min' | 'max', value: string) => void;
  handlePriceCommit: () => void;
  handlePriceKeyDown: (e: React.KeyboardEvent) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = React.memo(({
  searchInput,
  setSearchInput,
  range,
  setRange,
  filters,
  isFiltersLoading,
  categories,
  fuelTypes,
  localPriceRange,
  handleFilterChange,
  handlePriceChange,
  handlePriceCommit,
  handlePriceKeyDown,
  resetFilters,
  hasActiveFilters
}) => (
  <div className="space-y-6">
    {/* Search Input */}
    <div>
      <h3 className="font-semibold text-gray-800 mb-3">Search Vehicles</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by brand or model..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium"
        />
      </div>
      {searchInput && searchInput !== filters.search && (
        <p className="text-xs text-gray-500 mt-1.5 ml-1">Searching...</p>
      )}
    </div>

    {/* Range Selection */}
    <div>
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>Distance Range</span>
        <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">Proximity</span>
      </h3>
      <div className="flex gap-2">
        {[10, 20, 50].map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${range === r
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {r}km
          </button>
        ))}
      </div>
    </div>

    <div className="border-t pt-6">
      {/* Vehicle Type (Dynamic Categories) */}
      {!isFiltersLoading && categories.length > 0 && (
        <FilterSection title="Vehicle Type">
          {categories.map(cat => (
            <React.Fragment key={cat._id}>
              {/* Main Category */}
              <Checkbox
                label={cat.name}
                checked={filters.vehicleType.includes(cat._id)}
                onChange={() => handleFilterChange('vehicleType', cat._id)}
              />
              {/* Sub Categories */}
              {cat.subCategories && cat.subCategories.length > 0 && (
                <div className="ml-6 space-y-2 mt-2 border-l-2 border-gray-100 pl-3">
                  {cat.subCategories.map(sub => (
                    <Checkbox
                      key={sub._id}
                      label={sub.name}
                      checked={filters.vehicleType.includes(sub._id || '')}
                      onChange={() => handleFilterChange('vehicleType', sub._id || '')}
                    />
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </FilterSection>
      )}

      {/* Fuel Type (Dynamic Fuel Types) */}
      {!isFiltersLoading && fuelTypes.length > 0 && (
        <FilterSection title="Fuel Type">
          {fuelTypes.map(fuel => (
            <Checkbox
              key={fuel._id}
              label={fuel.name}
              checked={filters.fuelType.includes(fuel._id)}
              onChange={() => handleFilterChange('fuelType', fuel._id)}
            />
          ))}
        </FilterSection>
      )}

      {/* Transmission */}
      <FilterSection title="Transmission">
        {['Manual', 'Automatic'].map(trans => (
          <Checkbox
            key={trans}
            label={trans}
            checked={filters.transmission.includes(trans as never)}
            onChange={() => handleFilterChange('transmission', trans)}
          />
        ))}
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range (₹/day)">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={localPriceRange.min}
            onChange={(e) => handlePriceChange('min', e.target.value)}
            onBlur={handlePriceCommit}
            onKeyDown={handlePriceKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <span className="text-gray-500">–</span>
          <input
            type="number"
            placeholder="Max"
            value={localPriceRange.max}
            onChange={(e) => handlePriceChange('max', e.target.value)}
            onBlur={handlePriceCommit}
            onKeyDown={handlePriceKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </FilterSection>

      {/* Sort By */}
      <FilterSection title="Sort By">
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium"
        >
          <option value="">Default (Near & New)</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </FilterSection>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="w-full mt-4 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  </div>
));

const SearchPage = () => {
  const [range, setRange] = useState(10);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { coordinates } = useAuthStore();
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    vehicleType: [],
    fuelType: [],
    transmission: [],
    priceRange: { min: '', max: '' },
    sortBy: ''
  });

  const [searchInput, setSearchInput] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);


  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // The buggy generic effect that clears the input was removed. We handle reset differently.

  React.useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setIsFiltersLoading(true);
        const [categoriesRes, fuelTypesRes] = await Promise.all([
          CategoryApi.getAllCategories({ limit: 100 }),
          CategoryApi.getAllFuelTypes()
        ]);
        const activeCategories = categoriesRes.data
          .filter(c => c.isActive)
          .map(c => ({
            ...c,
            subCategories: c.subCategories ? c.subCategories.filter(sc => sc.isActive) : []
          }));
        setCategories(activeCategories);
        setFuelTypes(fuelTypesRes.filter(f => f.isActive));
      } catch (error) {
        console.error("Failed to load filter options:", error);
      } finally {
        setIsFiltersLoading(false);
      }
    };
    fetchFilterData();
  }, []);

  const handleFilterChange = useCallback((category: keyof SearchFilters, value: string | Partial<SearchFilters['priceRange']>) => {
    setFilters(prev => {
      if (category === 'priceRange') {
        return { ...prev, priceRange: { ...prev.priceRange, ...(value as Partial<SearchFilters['priceRange']>) } };
      } else if (category === 'sortBy' || category === 'search') {
        return { ...prev, [category]: value as string };
      } else {
        const key = category as keyof Pick<SearchFilters, 'vehicleType' | 'fuelType' | 'transmission'>;
        const currentValues = prev[key];
        const val = value as string;

        let newValues: string[];

        // Special logic for vehicleType to handle Parent/Child exclusivity
        if (key === 'vehicleType' && categories.length > 0) {
          const isSelected = currentValues.includes(val);

          // Find if val is a Main Category
          const mainCat = categories.find(c => c._id === val);

          // Find if val is a Sub Category (and get its parent)
          let parentCat: Category | undefined;
          if (!mainCat) {
            parentCat = categories.find(c => c.subCategories?.some(s => s._id === val));
          }

          if (mainCat) {
            // User clicked a Main Category
            if (isSelected) {
              // Unchecking Main
              newValues = currentValues.filter(v => v !== val);
            } else {
              // Checking Main -> Remove all its subcategories from selection
              const subIds = mainCat.subCategories?.map(s => s._id) || [];
              newValues = [...currentValues.filter(v => !subIds.includes(v)), val];
            }
          } else if (parentCat) {
            // User clicked a Sub Category
            if (isSelected) {
              // Unchecking Sub
              newValues = currentValues.filter(v => v !== val);
            } else {
              // Checking Sub -> Remove Parent from selection
              newValues = [...currentValues.filter(v => v !== parentCat!._id), val];
            }
          } else {
            // Fallback or other vehicleTypes
            newValues = isSelected
              ? currentValues.filter((v) => v !== val)
              : [...currentValues, val];
          }
        } else {
          newValues = currentValues.includes(val)
            ? currentValues.filter((v) => v !== val)
            : [...currentValues, val];
        }
        return { ...prev, [category]: newValues };
      }
    });
  }, [categories]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      vehicleType: [],
      fuelType: [],
      transmission: [],
      priceRange: { min: '', max: '' },
      sortBy: ''
    });
    setSearchInput('');
  }, []);

  // Local state for price inputs to prevent fetching on every keystroke
  const [localPriceRange, setLocalPriceRange] = useState({ min: '', max: '' });

  // Sync local state when filters change externally (e.g. reset)
  React.useEffect(() => {
    setLocalPriceRange(filters.priceRange);
  }, [filters.priceRange]);

  const handlePriceChange = useCallback((type: 'min' | 'max', value: string) => {
    setLocalPriceRange(prev => ({ ...prev, [type]: value }));
  }, []);

  const handlePriceCommit = useCallback(() => {
    handleFilterChange('priceRange', localPriceRange);
  }, [localPriceRange, handleFilterChange]);

  const handlePriceKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePriceCommit();
    }
  }, [handlePriceCommit]);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.vehicleType.length > 0 ||
    filters.fuelType.length > 0 ||
    filters.transmission.length > 0 ||
    filters.priceRange.min !== '' ||
    filters.priceRange.max !== '' ||
    filters.sortBy !== '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Find Your Ride</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Exploring vehicles within {range}km of your location
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-28">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {hasActiveFilters && (
                  <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">
                    {[
                      filters.search ? 1 : 0,
                      filters.vehicleType.length,
                      filters.fuelType.length,
                      filters.transmission.length,
                      filters.priceRange.min || filters.priceRange.max ? 1 : 0,
                      filters.sortBy ? 1 : 0
                    ].reduce((a, b) => a + b, 0)} Active
                  </span>
                )}
              </div>
              <FilterPanel
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                range={range}
                setRange={setRange}
                filters={filters}
                isFiltersLoading={isFiltersLoading}
                categories={categories}
                fuelTypes={fuelTypes}
                localPriceRange={localPriceRange}
                handleFilterChange={handleFilterChange}
                handlePriceChange={handlePriceChange}
                handlePriceCommit={handlePriceCommit}
                handlePriceKeyDown={handlePriceKeyDown}
                resetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div >
          </div >

          {/* Main Content */}
          < div className="flex-1" >
            {/* Mobile Filter Button */}
            < div className="lg:hidden mb-6" >
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="w-full bg-white border border-gray-200 rounded-xl py-4 px-5 flex items-center justify-between font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-gray-900" />
                  <span>Filter & Sort</span>
                </div>
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {[
                      filters.search ? 1 : 0,
                      filters.vehicleType.length,
                      filters.fuelType.length,
                      filters.transmission.length,
                      filters.priceRange.min || filters.priceRange.max ? 1 : 0,
                      filters.sortBy ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>
            </div >

            <div className="-mt-8">
              <VehicleGrid
                range={range}
                filters={filters}
                userLocation={coordinates}
                showRangeSelector={false}
                showEmptyState={true}
                limit={50}
              />
            </div>
          </div >
        </div >
      </div >

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out">
            <div className="sticky top-0 bg-white border-b px-6 py-5 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close filters"
              >
                <X className="w-6 h-6 text-gray-900" />
              </button>
            </div>
            <div className="p-6">
              <FilterPanel
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                range={range}
                setRange={setRange}
                filters={filters}
                isFiltersLoading={isFiltersLoading}
                categories={categories}
                fuelTypes={fuelTypes}
                localPriceRange={localPriceRange}
                handleFilterChange={handleFilterChange}
                handlePriceChange={handlePriceChange}
                handlePriceCommit={handlePriceCommit}
                handlePriceKeyDown={handlePriceKeyDown}
                resetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
              <div className="sticky bottom-0 mt-8 pt-4 pb-2 bg-white border-t">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};



export default SearchPage;