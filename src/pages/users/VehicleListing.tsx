import React, { useState, useCallback } from 'react';
import { uploadToS3 } from '../../utils/s3';
import { api } from '../../utils/axios';
import Navbar from '../../components/user/Navbar';
import {  useNavigate } from '@tanstack/react-router';

interface VehicleFormData {
  category: string;
  brand: string;
  model: string;
  category2: string;
  fuelType: string;
  seatCapacity: string;
  pricePerDay: string;
  doors: string;
  rcNumber: string;
  rcExpiryDate: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiryDate: string;
  pickupAddress: string;
  regionalContact: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

const InputField = React.memo(function InputField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          touched && error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {touched && error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
});



const AddVehicleForm: React.FC = () => {
  const navigate =  useNavigate()
  const [formData, setFormData] = useState<VehicleFormData>({
    category: '',
    brand: '',
    model: '',
    category2: '',
    fuelType: '',
    seatCapacity: '',
    pricePerDay: '',
    doors: '',
    rcNumber: '',
    rcExpiryDate: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    pickupAddress: '',
    regionalContact: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [legalAcknowledgement, setLegalAcknowledgement] = useState(false);

  // Image upload states
  const [vehicleImageUrls, setVehicleImageUrls] = useState<string[]>([]);
  const [insuranceImageUrl, setInsuranceImageUrl] = useState<string>('');
  const [rcBookImageUrl, setRcBookImageUrl] = useState<string>('');

  // Upload progress states
  const [uploadingVehicleImages, setUploadingVehicleImages] = useState(false);
  const [uploadingInsurance, setUploadingInsurance] = useState(false);
  const [uploadingRcBook, setUploadingRcBook] = useState(false);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'category':
      case 'brand':
      case 'model':
      case 'category2':
      case 'fuelType':
        return value.trim() === '' ? 'This field is required' : '';

      case 'seatCapacity':
        if (value.trim() === '') return 'Seat capacity is required';
        const seats = parseInt(value);
        if (isNaN(seats) || seats < 1 || seats > 50) return 'Enter valid seat capacity (1-50)';
        return '';

      case 'pricePerDay':
        if (value.trim() === '') return 'Price per day is required';
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) return 'Enter valid price (greater than 0)';
        return '';

      case 'doors':
        if (value.trim() === '') return 'Number of doors is required';
        const doors = parseInt(value);
        if (isNaN(doors) || doors < 2 || doors > 6) return 'Enter valid doors (2-6)';
        return '';

      case 'rcNumber':
        if (value.trim() === '') return 'RC number is required';
        if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(value.replace(/\s/g, ''))) {
          return 'Invalid RC number format (e.g., KL01AB1234)';
        }
        return '';

      case 'rcExpiryDate':
      case 'insuranceExpiryDate':
        if (value.trim() === '') return 'Date is required';
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return 'Date cannot be in the past';
        return '';

      case 'insuranceProvider':
        return value.trim() === '' ? 'Insurance provider is required' : '';

      case 'insurancePolicyNumber':
        if (value.trim() === '') return 'Policy number is required';
        if (value.length < 5) return 'Policy number must be at least 5 characters';
        return '';

      case 'pickupAddress':
        if (value.trim() === '') return 'Pickup address is required';
        if (value.length < 10) return 'Address must be at least 10 characters';
        return '';

      case 'regionalContact':
        if (value.trim() === '') return 'Regional contact is required';
        if (!/^[0-9]{10}$/.test(value)) return 'Enter valid 10-digit phone number';
        return '';

      default:
        return '';
    }
  };

  const validateFile = (
    file: File,
    allowedTypes: string[],
    maxSizeMB: number = 10
  ): { valid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }
    return { valid: true };
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const handleVehicleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - vehicleImageUrls.length;
    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s). Total limit is 3 images.`);
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const filesToUpload: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file, allowedTypes);
      if (!validation.valid) {
        alert(`${file.name}: ${validation.error}`);
        return;
      }
      filesToUpload.push(file);
    }

    setUploadingVehicleImages(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const publicUrl = await uploadToS3(file);
        uploadedUrls.push(publicUrl);
      }
      setVehicleImageUrls(prev => [...prev, ...uploadedUrls]);
      alert('Vehicle images uploaded successfully!');
    } catch (error) {
      alert('Failed to upload vehicle images. Please try again.');
      console.error(error);
    } finally {
      setUploadingVehicleImages(false);
      e.target.value = '';
    }
  };

  const handleInsuranceDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const validation = validateFile(file, allowedTypes);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploadingInsurance(true);
    try {
      const publicUrl = await uploadToS3(file);
      setInsuranceImageUrl(publicUrl);
      alert('Insurance document uploaded successfully!');
    } catch (error) {
      alert('Failed to upload insurance document. Please try again.');
      console.error(error);
    } finally {
      setUploadingInsurance(false);
      e.target.value = '';
    }
  };

  const handleRcBookUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const validation = validateFile(file, allowedTypes);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploadingRcBook(true);
    try {
      const publicUrl = await uploadToS3(file);
      setRcBookImageUrl(publicUrl);
      alert('RC book uploaded successfully!');
    } catch (error) {
      alert('Failed to upload RC book. Please try again.');
      console.error(error);
    } finally {
      setUploadingRcBook(false);
      e.target.value = '';
    }
  };

  const removeVehicleImage = (index: number) => {
    setVehicleImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeInsuranceDocument = () => setInsuranceImageUrl('');
  const removeRcBook = () => setRcBookImageUrl('');

  const handleSubmit = async () => {
    const newErrors: ValidationErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof VehicleFormData]);
      if (error) newErrors[key] = error;
    });

    if (vehicleImageUrls.length !== 3) {
      alert('Please upload exactly 3 vehicle images');
      return;
    }
    if (!insuranceImageUrl) {
      alert('Please upload insurance document');
      return;
    }
    if (!rcBookImageUrl) {
      alert('Please upload RC book document');
      return;
    }
    if (!legalAcknowledgement) {
      alert('Please accept the legal acknowledgement');
      return;
    }

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(newErrors).length === 0) {
      const payload = {
        category: formData.category,
        brand: formData.brand,
        modelName: formData.model,                    
        category2: formData.category2,
        fuelType: formData.fuelType,
        seatingCapacity: parseInt(formData.seatCapacity), 
        pricePerDay: parseFloat(formData.pricePerDay),
        doors: parseInt(formData.doors),             
        vehicleImages: vehicleImageUrls,
        rcNumber: formData.rcNumber,
        rcExpiryDate: formData.rcExpiryDate,
        rcImage: rcBookImageUrl,                     
        insuranceProvider: formData.insuranceProvider,
        insurancePolicyNumber: formData.insurancePolicyNumber,
        insuranceExpiryDate: formData.insuranceExpiryDate,
        insuranceImage: insuranceImageUrl,            
        pickupAddress: formData.pickupAddress,
        regionalContact: formData.regionalContact,
      };

      try {
        const response = await api.post('vehicles/createVehicle', payload);
        if (response.data.success) {
          navigate({to:'/'})
        }
        console.log(response.data);
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || 'Failed to submit. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All data will be lost.')) {
      setFormData({
        category: '', brand: '', model: '', category2: '', fuelType: '',
        seatCapacity: '', pricePerDay: '', doors: '',
        rcNumber: '', rcExpiryDate: '', insuranceProvider: '', insurancePolicyNumber: '',
        insuranceExpiryDate: '', pickupAddress: '', regionalContact: ''
      });
      setErrors({});
      setTouched({});
      setLegalAcknowledgement(false);
      setVehicleImageUrls([]);
      setInsuranceImageUrl('');
      setRcBookImageUrl('');
    }
  };

  const isFormValid =
    vehicleImageUrls.length === 3 &&
    insuranceImageUrl !== '' &&
    rcBookImageUrl !== '' &&
    legalAcknowledgement &&
    Object.values(formData).every(value => value.trim() !== '') &&
    Object.values(errors).every(error => error === '');

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold mb-2">Add Your Vehicle</h1>
            <p className="text-gray-600 text-sm mb-6">
              Please fill in the vehicle details below
            </p>

            <div className="border-b pb-4 mb-6">
              <h2 className="font-semibold mb-4">VEHICLE INFORMATION</h2>
              <InputField label="Category" name="category" placeholder="Category" value={formData.category} onChange={handleChange} onBlur={handleBlur} error={errors.category} touched={touched.category} />
              <InputField label="Brand" name="brand" placeholder="Brand" value={formData.brand} onChange={handleChange} onBlur={handleBlur} error={errors.brand} touched={touched.brand} />
              <InputField label="Model" name="model" placeholder="Model" value={formData.model} onChange={handleChange} onBlur={handleBlur} error={errors.model} touched={touched.model} />
              <InputField label="Category 2" name="category2" placeholder="e.g., SUV, Sedan" value={formData.category2} onChange={handleChange} onBlur={handleBlur} error={errors.category2} touched={touched.category2} />
              <InputField label="Fuel Type" name="fuelType" placeholder="Diesel / CNG / Petrol" value={formData.fuelType} onChange={handleChange} onBlur={handleBlur} error={errors.fuelType} touched={touched.fuelType} />
              <InputField label="Seating Capacity" name="seatCapacity" type="number" placeholder="E.g., 5" value={formData.seatCapacity} onChange={handleChange} onBlur={handleBlur} error={errors.seatCapacity} touched={touched.seatCapacity} />
              <InputField label="Price Per Day" name="pricePerDay" type="number" placeholder="E.g., 2000" value={formData.pricePerDay} onChange={handleChange} onBlur={handleBlur} error={errors.pricePerDay} touched={touched.pricePerDay} />
              <InputField label="Number of Doors" name="doors" type="number" placeholder="E.g., 4" value={formData.doors} onChange={handleChange} onBlur={handleBlur} error={errors.doors} touched={touched.doors} />
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="font-semibold mb-2">Upload Vehicle Images</h2>
              <p className="text-xs text-gray-500 mb-2">PNG or JPG up to 10MB. Exactly 3 images required.</p>
              <p className="text-xs font-medium text-blue-600 mb-4">{vehicleImageUrls.length} of 3 images uploaded</p>
              <input type="file" id="vehicle-images" multiple accept="image/png,image/jpeg,image/jpg" onChange={handleVehicleImagesUpload} disabled={vehicleImageUrls.length >= 3 || uploadingVehicleImages} className="hidden" />
              <label htmlFor="vehicle-images" className={`inline-block px-4 py-2 border rounded-md text-sm ${vehicleImageUrls.length >= 3 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : uploadingVehicleImages ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300 cursor-pointer hover:bg-gray-50'}`}>
                {uploadingVehicleImages ? 'Uploading...' : vehicleImageUrls.length >= 3 ? 'Maximum Reached' : 'Upload Images'}
              </label>

              {vehicleImageUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {vehicleImageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Vehicle ${index + 1}`} className="w-full h-24 object-cover rounded border" />
                      <button type="button" onClick={() => removeVehicleImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="font-semibold mb-4">Legal Details</h2>
              <InputField label="RC Number" name="rcNumber" placeholder="e.g., KL01AB1234" value={formData.rcNumber} onChange={handleChange} onBlur={handleBlur} error={errors.rcNumber} touched={touched.rcNumber} />
              <InputField label="RC Expiry Date" name="rcExpiryDate" type="date" value={formData.rcExpiryDate} onChange={handleChange} onBlur={handleBlur} error={errors.rcExpiryDate} touched={touched.rcExpiryDate} />

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Upload RC Book</h3>
                <p className="text-xs text-gray-500 mb-4">PDF or Image up to 10MB</p>
                <input type="file" id="rc-book" accept="application/pdf,image/*" onChange={handleRcBookUpload} disabled={uploadingRcBook} className="hidden" />
                <label htmlFor="rc-book" className={`inline-block px-4 py-2 border border-gray-300 rounded-md text-sm cursor-pointer ${uploadingRcBook ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                  {uploadingRcBook ? 'Uploading...' : rcBookImageUrl ? 'Change Document' : 'Upload Document'}
                </label>
                {rcBookImageUrl && (
                  <div className="mt-4 flex items-center gap-2 p-3 border rounded bg-green-50 border-green-200">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm flex-1 text-green-700">RC book uploaded successfully</span>
                    <button type="button" onClick={removeRcBook} className="text-red-500 text-sm hover:text-red-700 font-medium">Remove</button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b pb-4 mb-6">
              <h2 className="font-semibold mb-4">Insurance Documents</h2>
              <InputField label="Insurance Provider" name="insuranceProvider" placeholder="e.g., HDFC Ergo" value={formData.insuranceProvider} onChange={handleChange} onBlur={handleBlur} error={errors.insuranceProvider} touched={touched.insuranceProvider} />
              <InputField label="Insurance Policy Number" name="insurancePolicyNumber" placeholder="Policy number" value={formData.insurancePolicyNumber} onChange={handleChange} onBlur={handleBlur} error={errors.insurancePolicyNumber} touched={touched.insurancePolicyNumber} />
              <InputField label="Insurance Expiry Date" name="insuranceExpiryDate" type="date" value={formData.insuranceExpiryDate} onChange={handleChange} onBlur={handleBlur} error={errors.insuranceExpiryDate} touched={touched.insuranceExpiryDate} />

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Insurance Document</h3>
                <p className="text-xs text-gray-500 mb-4">PDF or Image up to 10MB</p>
                <input type="file" id="insurance-document" accept="application/pdf,image/*" onChange={handleInsuranceDocumentUpload} disabled={uploadingInsurance} className="hidden" />
                <label htmlFor="insurance-document" className={`inline-block px-4 py-2 border border-gray-300 rounded-md text-sm cursor-pointer ${uploadingInsurance ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                  {uploadingInsurance ? 'Uploading...' : insuranceImageUrl ? 'Change Document' : 'Upload Document'}
                </label>
                {insuranceImageUrl && (
                  <div className="mt-4 flex items-center gap-2 p-3 border rounded bg-green-50 border-green-200">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm flex-1 text-green-700">Insurance document uploaded successfully</span>
                    <button type="button" onClick={removeInsuranceDocument} className="text-red-500 text-sm hover:text-red-700 font-medium">Remove</button>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-semibold mb-4">Pickup Information</h2>
              <InputField label="Pickup Address Location" name="pickupAddress" placeholder="e.g., Kanchipuram, Tamil Nadu" value={formData.pickupAddress} onChange={handleChange} onBlur={handleBlur} error={errors.pickupAddress} touched={touched.pickupAddress} />
              <InputField label="Regional Contact" name="regionalContact" type="tel" placeholder="e.g., 9445678210" value={formData.regionalContact} onChange={handleChange} onBlur={handleBlur} error={errors.regionalContact} touched={touched.regionalContact} />
            </div>

            <div className="border-t pt-6 mb-6">
              <h2 className="font-semibold mb-4">Legal Acknowledgement</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={legalAcknowledgement}
                    onChange={(e) => setLegalAcknowledgement(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm that I am the legal owner of this vehicle. I voluntarily provide my RC, insurance details, and document images to RentNRide for vehicle verification and rental purposes. I understand that these documents will be securely stored and used only according to the Privacy Policy.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={handleCancel} className="px-6 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`px-6 py-2 rounded-md text-sm ${
                  isFormValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddVehicleForm;