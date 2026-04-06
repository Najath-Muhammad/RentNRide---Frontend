import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { UserVehicleApi } from '../../services/api/user/vehicle.api';
import type { Vehicle } from '../../types/vehicle.types';
import { uploadToS3 } from '../../utils/s3';
import AddressAutocomplete from '../../components/user/AddressAutocomplete';
import { reverseGeocode, type LocationSuggestion } from '../../utils/locationiq';
import { AxiosError } from 'axios';
import { Loader2, Trash2, Camera, FileText, CheckCircle2 } from 'lucide-react';
import { CategoryApi, type Category, type FuelType } from '../../services/api/admin/category.api';
import { useMemo } from 'react';

const EditVehicle: React.FC = () => {
  const { id } = useParams({ from: '/vehicles/edit/$id' });
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catResponse, fuelData] = await Promise.all([
          CategoryApi.getAllCategories({ limit: 100 }),
          CategoryApi.getAllFuelTypes()
        ]);
        setCategories(catResponse.data.filter(c => c.isActive));
        setFuelTypes(fuelData.filter(f => f.isActive));
      } catch (error) {
        console.error("Error fetching form options:", error);
      }
    };
    fetchOptions();
  }, []);

  const categoryOptions = useMemo(() =>
    categories.map(c => ({ value: c._id, label: c.name })),
    [categories]);

  const fuelTypeOptions = useMemo(() =>
    fuelTypes.map(f => ({ value: f._id, label: f.name })),
    [fuelTypes]);

  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({});

  const subCategoryOptions = useMemo(() => {
    const selectedCat = categories.find(c => c._id === formData.category);
    if (!selectedCat) return [];
    return selectedCat.subCategories
      .filter(sc => sc.isActive)
      .map(sc => ({ value: sc._id as string, label: sc.name }));
  }, [categories, formData.category]);

  // Image states
  const [vehicleImageUrls, setVehicleImageUrls] = useState<string[]>([]);
  const [rcImage, setRcImage] = useState<string>('');
  const [insuranceImage, setInsuranceImage] = useState<string>('');

  // Upload progress
  const [uploading, setUploading] = useState({
    vehicle: false,
    rc: false,
    insurance: false
  });

  // Modal state
  const [modal, setModal] = useState<{ show: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showModal = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setModal({ show: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
  };

  const fetchVehicle = useCallback(async () => {
    try {
      setLoading(true);
      const res = await UserVehicleApi.getVehicleById(id);
      const data = res.data;
      setVehicle(data);
      // Normalize data for form (extract IDs if populated)
      setFormData({
        ...data,
        category: (typeof data.category === 'object' && data.category) ? (data.category as { _id: string })._id : data.category as string,
        fuelType: (typeof data.fuelType === 'object' && data.fuelType) ? (data.fuelType as { _id: string })._id : data.fuelType as string,
      });
      setVehicleImageUrls(data.vehicleImages || []);
      setRcImage(data.rcImage || '');
      setInsuranceImage(data.insuranceImage || '');
    } catch (error) {
      console.error('Failed to load vehicle:', error);
      showModal('error', 'Load Failed', 'Failed to load vehicle details');
      navigate({ to: '/vehicles/my-vehicles' });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'vehicle' | 'rc' | 'insurance') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'vehicle' && (vehicleImageUrls.length + files.length) > 3) {
      showModal('warning', 'Upload Limit', 'Maximum 3 images allowed for vehicle');
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadToS3(file);
        urls.push(url);
      }

      if (type === 'vehicle') setVehicleImageUrls(prev => [...prev, ...urls]);
      else if (type === 'rc') setRcImage(urls[0]);
      else if (type === 'insurance') setInsuranceImage(urls[0]);
    } catch (error) {
      console.error(`Upload failed for ${type}:`, error);
      showModal('error', 'Upload Failed', 'Upload failed. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const removeImage = (index: number) => {
    setVehicleImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.brand?.trim()) newErrors.brand = 'Brand is required';
    if (!formData.modelName?.trim()) newErrors.modelName = 'Model Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.category2) newErrors.category2 = 'Type/Class is required';
    if (!formData.fuelType) newErrors.fuelType = 'Fuel Type is required';
    if (!formData.insuranceProvider?.trim()) newErrors.insuranceProvider = 'Insurance Provider is required';

    const price = Number(formData.pricePerDay);
    if (!formData.pricePerDay || isNaN(price) || !Number.isFinite(price) || price <= 0) newErrors.pricePerDay = 'Enter valid price (greater than 0)';
    else if (!Number.isInteger(price)) newErrors.pricePerDay = 'Price must be a whole number';

    if (formData.seatingCapacity) {
      const seats = Number(formData.seatingCapacity);
      if (isNaN(seats) || seats < 1 || seats > 50) newErrors.seatingCapacity = 'Enter valid seat capacity (1-50)';
    }

    if (formData.doors) {
      const doors = Number(formData.doors);
      if (isNaN(doors) || doors < 2 || doors > 6) newErrors.doors = 'Enter valid doors (2-6)';
    }

    // RC Number
    if (!formData.rcNumber?.trim()) {
      newErrors.rcNumber = 'RC number is required';
    } else if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(formData.rcNumber.replace(/\s/g, ''))) {
      newErrors.rcNumber = 'Invalid RC number format (e.g., KL01AB1234)';
    }

    // Dates
    if (!formData.rcExpiryDate) {
      newErrors.rcExpiryDate = 'RC Expiry Date is required';
    } else if (new Date(formData.rcExpiryDate) < today) {
      newErrors.rcExpiryDate = 'Date cannot be in the past';
    }

    if (!formData.insuranceExpiryDate) {
      newErrors.insuranceExpiryDate = 'Insurance Expiry Date is required';
    } else if (new Date(formData.insuranceExpiryDate) < today) {
      newErrors.insuranceExpiryDate = 'Date cannot be in the past';
    }

    // Policy Number
    if (!formData.insurancePolicyNumber?.trim()) {
      newErrors.insurancePolicyNumber = 'Policy number is required';
    } else if (formData.insurancePolicyNumber.length < 5) {
      newErrors.insurancePolicyNumber = 'Policy number must be at least 5 characters';
    }

    // Images
    if (!rcImage) newErrors.rcImage = 'RC Image is required';
    if (!insuranceImage) newErrors.insuranceImage = 'Insurance Image is required';

    // Address
    if (!formData.pickupAddress?.trim()) {
      newErrors.pickupAddress = 'Pickup Address is required';
    } else if (formData.pickupAddress.length < 10) {
      newErrors.pickupAddress = 'Address must be at least 10 characters';
    }

    // Regional Contact
    if (!formData.regionalContact?.trim()) {
      newErrors.regionalContact = 'Regional contact is required';
    } else if (!/^[0-9]{10}$/.test(formData.regionalContact)) {
      newErrors.regionalContact = 'Enter valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showModal('error', 'Validation Error', 'Please check the form for errors and try again.');
      return;
    }

    if (vehicleImageUrls.length < 1) {
      showModal('warning', 'Missing Images', 'Please upload at least one vehicle image');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        pricePerDay: Math.round(Number(formData.pricePerDay)),
        vehicleImages: vehicleImageUrls,
        rcImage,
        insuranceImage
      };

      await UserVehicleApi.updateVehicle(id, payload);
      showModal('success', 'Success!', vehicle?.isRejected ? 'Application resubmitted successfully!' : 'Vehicle updated successfully!');
      setTimeout(() => navigate({ to: '/vehicles/my-vehicles' }), 2000);
    } catch (error: unknown) {
      console.error('Update failed:', error);
      const err = error as AxiosError<{ message: string }>;
      showModal('error', 'Update Failed', err.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-white px-8 py-6 border-b">
            <h1 className="text-3xl font-bold text-gray-900">
              {vehicle.isRejected ? 'Reapply Vehicle' : 'Edit Vehicle'}
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Update your vehicle information and documents</p>
          </div>

          {vehicle.isRejected && vehicle.rejectionReason && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider mb-1">Rejection Reason</p>
                <p className="text-sm leading-relaxed">{vehicle.rejectionReason}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-10" noValidate>
            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Brand" value={formData.brand} onChange={(val: string) => setFormData({ ...formData, brand: val })} error={errors.brand} />
                <InputGroup label="Model Name" value={formData.modelName} onChange={(val: string) => setFormData({ ...formData, modelName: val })} error={errors.modelName} />
                <SelectGroup
                  label="Category"
                  value={formData.category as string}
                  options={categoryOptions}
                  onChange={(val: string) => setFormData({ ...formData, category: val, category2: '' })}
                  error={errors.category}
                />
                <SelectGroup
                  label="Type/Class"
                  placeholder="e.g. Sports, Cruiser, Economy"
                  value={formData.category2}
                  options={subCategoryOptions}
                  onChange={(val: string) => setFormData({ ...formData, category2: val })}
                  error={errors.category2}
                />
                <SelectGroup
                  label="Fuel Type"
                  value={formData.fuelType as string}
                  options={fuelTypeOptions}
                  onChange={(val: string) => setFormData({ ...formData, fuelType: val })}
                  error={errors.fuelType}
                />
                <InputGroup
                  label="Daily Rate (₹)"
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(val: string) => setFormData({ ...formData, pricePerDay: Number(val) })}
                  error={errors.pricePerDay}
                />
                <InputGroup
                  label="Seating Capacity"
                  type="number"
                  value={formData.seatingCapacity}
                  onChange={(val: string) => setFormData({ ...formData, seatingCapacity: Number(val) })}
                  error={errors.seatingCapacity}
                />
                <InputGroup
                  label="Doors"
                  type="number"
                  value={formData.doors}
                  onChange={(val: string) => setFormData({ ...formData, doors: Number(val) })}
                  error={errors.doors}
                />
              </div>
            </div>

            {/* Vehicle Images */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vehicleImageUrls.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border">
                    <img src={url} alt={`Vehicle ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {vehicleImageUrls.length < 3 && (
                  <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                    {uploading.vehicle ? <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> : <Camera className="w-8 h-8 text-gray-400" />}
                    <span className="text-xs font-bold text-gray-500 mt-2">Upload Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'vehicle')} />
                  </label>
                )}
              </div>
            </div>

            {/* Legal Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t pt-10">
              {/* RC Details */}
              <div className="space-y-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  RC Information
                </h3>
                <InputGroup label="RC Number" value={formData.rcNumber} onChange={(val: string) => setFormData({ ...formData, rcNumber: val })} error={errors.rcNumber} />
                <InputGroup label="RC Expiry Date" type="date" value={formData.rcExpiryDate ? new Date(formData.rcExpiryDate).toISOString().split('T')[0] : ''} onChange={(val: string) => setFormData({ ...formData, rcExpiryDate: val })} error={errors.rcExpiryDate} />
                <DocumentUpload
                  label="RC Image"
                  url={rcImage}
                  isUploading={uploading.rc}
                  onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e, 'rc')}
                  error={errors.rcImage}
                />
              </div>

              {/* Insurance Details */}
              <div className="space-y-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Insurance Information
                </h3>
                <InputGroup label="Provider" value={formData.insuranceProvider} onChange={(val: string) => setFormData({ ...formData, insuranceProvider: val })} error={errors.insuranceProvider} />
                <InputGroup label="Policy Number" value={formData.insurancePolicyNumber} onChange={(val: string) => setFormData({ ...formData, insurancePolicyNumber: val })} error={errors.insurancePolicyNumber} />
                <InputGroup label="Expiry Date" type="date" value={formData.insuranceExpiryDate ? new Date(formData.insuranceExpiryDate).toISOString().split('T')[0] : ''} onChange={(val: string) => setFormData({ ...formData, insuranceExpiryDate: val })} error={errors.insuranceExpiryDate} />
                <DocumentUpload
                  label="Insurance Image"
                  url={insuranceImage}
                  isUploading={uploading.insurance}
                  onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e, 'insurance')}
                  error={errors.insuranceImage}
                />
              </div>
            </div>

            {/* Pickup Location */}
            <div className="border-t pt-10">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Location & Pickup</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Pickup Address</label>
                  <AddressAutocomplete
                    value={formData.pickupAddress || ''}
                    onChange={(val: string) => setFormData({ ...formData, pickupAddress: val })}
                    onSelect={(suggestion: LocationSuggestion) => {
                      if (suggestion.lat && suggestion.lon) {
                        setFormData(prev => ({
                          ...prev,
                          location: {
                            type: 'Point',
                            coordinates: [parseFloat(suggestion.lon), parseFloat(suggestion.lat)]
                          }
                        }));
                      }
                    }}
                    onBlur={() => { }}
                    placeholder="Search for your pickup location..."
                  />
                  {errors.pickupAddress && <p className="text-red-500 text-xs mt-1 font-medium">{errors.pickupAddress}</p>}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        const { latitude, longitude } = pos.coords;
                        const data = await reverseGeocode(latitude, longitude);
                        setFormData(prev => ({
                          ...prev,
                          pickupAddress: data.display_name,
                          location: { type: 'Point', coordinates: [longitude, latitude] }
                        }));
                      });
                    }}
                    className="text-xs font-bold text-blue-600 mt-2 hover:underline"
                  >
                    📍 Use Current Location
                  </button>
                </div>
                <InputGroup label="Regional Contact Number" value={formData.regionalContact} onChange={(val: string) => setFormData({ ...formData, regionalContact: val })} error={errors.regionalContact} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate({ to: '/vehicles/my-vehicles' })}
                className="px-8 py-3.5 border border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading.vehicle || uploading.rc || uploading.insurance}
                className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition disabled:opacity-70 flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  vehicle.isRejected ? 'Reapply for Approval' : 'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Super Cool Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-300">
            <div className={`h-2 ${modal.type === 'success' ? 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-500' :
              modal.type === 'error' ? 'bg-gradient-to-r from-red-400 via-red-500 to-rose-500' :
                modal.type === 'warning' ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600' :
                  'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
              }`} />
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${modal.type === 'success' ? 'bg-green-50' :
                  modal.type === 'error' ? 'bg-red-50' :
                    modal.type === 'warning' ? 'bg-orange-50' :
                      'bg-blue-50'
                  }`}>
                  {modal.type === 'success' && (
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {modal.type === 'error' && (
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {modal.type === 'warning' && (
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {modal.type === 'info' && (
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{modal.title}</h3>
                <p className="text-gray-600 leading-relaxed">{modal.message}</p>
              </div>
              <button
                onClick={closeModal}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 ${modal.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
                  modal.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600' :
                    modal.type === 'warning' ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' :
                      'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  }`}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
interface InputGroupProps {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, type = "text", placeholder = "", required = false, error }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all font-medium ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500'}`}
    />
    {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
  </div>
);

interface SelectGroupProps {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

const SelectGroup: React.FC<SelectGroupProps> = ({ label, value, options, onChange, placeholder, error, required = false }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all font-medium bg-white ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500'}`}
    >
      <option value="">{placeholder || `Select ${label}`}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
  </div>
);

interface DocumentUploadProps {
  label: string;
  url: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  error?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ label, url, onUpload, isUploading, error }) => (
  <div className={`p-4 bg-gray-50 rounded-2xl border-2 border-dashed transition-all ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
      {label} {error && <span className="text-red-500 ml-1">*</span>}
    </label>
    {url ? (
      <div className="relative rounded-lg overflow-hidden border bg-white mb-3">
        <img src={url} alt={label} className="w-full h-32 object-contain" />
        <label className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-blue-600 text-[10px] font-bold px-2 py-1 rounded border shadow-sm cursor-pointer hover:bg-white transition-colors">
          Change
          <input type="file" className="hidden" onChange={onUpload} />
        </label>
      </div>
    ) : (
      <label className={`flex items-center gap-3 p-4 bg-white rounded-xl border cursor-pointer hover:bg-blue-50 transition-all ${error ? 'border-red-300' : 'border-gray-200 hover:border-blue-400'}`}>
        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Camera className={`w-5 h-5 ${error ? 'text-red-400' : 'text-gray-400'}`} />}
        <span className={`text-xs font-bold ${error ? 'text-red-500' : 'text-gray-600'}`}>Upload {label}</span>
        <input type="file" className="hidden" onChange={onUpload} />
      </label>
    )}
    {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
  </div>
);

export default EditVehicle;