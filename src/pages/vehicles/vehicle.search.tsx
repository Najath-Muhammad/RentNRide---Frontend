import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, X, Search, ChevronDown, ChevronUp, SlidersVertical, RotateCcw } from 'lucide-react';
import VehicleGrid from '../../components/home/VehicleGrid';
import { useAuthStore } from '../../stores/authStore';

import Navbar from '../../components/user/Navbar';
import { CategoryApi, type Category, type FuelType } from '../../services/api/admin/category.api';

import type { SearchFilters } from '../../types/vehicle.types';

// ── Checkbox ──────────────────────────────────────────────────────────────────
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer group p-1.5 -ml-1.5 rounded-xl hover:bg-gray-50 transition-colors">
    <div className="relative flex items-center justify-center flex-shrink-0">
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
    <span className={`text-sm font-medium transition-colors ${checked ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
      {label}
    </span>
  </label>
);

// ── Collapsible FilterSection ──────────────────────────────────────────────────
interface FilterSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, count = 0, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3.5 text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</span>
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full">
              {count}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="pb-4 space-y-1">{children}</div>}
    </div>
  );
};

// ── FilterPanel ───────────────────────────────────────────────────────────────
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

const VISIBLE_CATEGORY_LIMIT = 3;

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
}) => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const activeMoreCount = [
    filters.fuelType.length,
    filters.transmission.length,
    filters.priceRange.min || filters.priceRange.max ? 1 : 0,
    filters.sortBy ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const visibleCategories = showAllCategories ? categories : categories.slice(0, VISIBLE_CATEGORY_LIMIT);
  const hiddenCategoryCount = categories.length - VISIBLE_CATEGORY_LIMIT;

  return (
    <div className="flex flex-col gap-0">
      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Brand, model..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium bg-gray-50 focus:bg-white transition-all"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Distance Range ─────────────────────────────────────────────── */}
      <div className="py-4 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Distance</p>
        <div className="flex gap-2">
          {[10, 20, 50].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-2 text-sm rounded-lg font-bold transition-all ${range === r
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {/* ── Vehicle Type (core — always visible) ───────────────────────── */}
      {!isFiltersLoading && categories.length > 0 && (
        <FilterSection
          title="Vehicle Type"
          count={filters.vehicleType.length}
          defaultOpen={true}
        >
          {visibleCategories.map(cat => (
            <React.Fragment key={cat._id}>
              <Checkbox
                label={cat.name}
                checked={filters.vehicleType.includes(cat._id)}
                onChange={() => handleFilterChange('vehicleType', cat._id)}
              />
              {cat.subCategories && cat.subCategories.length > 0 && filters.vehicleType.includes(cat._id) && (
                <div className="ml-6 space-y-1 border-l-2 border-blue-100 pl-3">
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
          {hiddenCategoryCount > 0 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center gap-1.5 mt-1 ml-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showAllCategories
                ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                : <><ChevronDown className="w-3.5 h-3.5" /> +{hiddenCategoryCount} more types</>}
            </button>
          )}
        </FilterSection>
      )}

      {/* ── More Filters accordion ─────────────────────────────────────── */}
      <div className="mt-2">
        <button
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${showMoreFilters
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <SlidersVertical className="w-4 h-4" />
            <span>More Filters</span>
            {activeMoreCount > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold rounded-full ${showMoreFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                {activeMoreCount}
              </span>
            )}
          </div>
          {showMoreFilters
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Expandable section */}
        {showMoreFilters && (
          <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden bg-white px-4">
            {/* Fuel Type */}
            {!isFiltersLoading && fuelTypes.length > 0 && (
              <FilterSection title="Fuel Type" count={filters.fuelType.length} defaultOpen={true}>
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
            <FilterSection title="Transmission" count={filters.transmission.length} defaultOpen={true}>
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
            <FilterSection
              title="Price Range (₹/day)"
              count={filters.priceRange.min || filters.priceRange.max ? 1 : 0}
              defaultOpen={true}
            >
              <div className="flex gap-2 items-center pt-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={localPriceRange.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  onBlur={handlePriceCommit}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
                />
                <span className="text-gray-400 font-medium">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={localPriceRange.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  onBlur={handlePriceCommit}
                  onKeyDown={handlePriceKeyDown}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white"
                />
              </div>
            </FilterSection>

            {/* Sort By */}
            <FilterSection title="Sort By" count={filters.sortBy ? 1 : 0} defaultOpen={true}>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white font-medium"
              >
                <option value="">Default (Near &amp; New)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </FilterSection>
          </div>
        )}
      </div>

      {/* ── Reset ──────────────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 w-full mt-4 py-2.5 px-4 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset all filters
        </button>
      )}
    </div>
  );
});



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