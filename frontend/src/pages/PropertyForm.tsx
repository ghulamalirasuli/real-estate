import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import MapPicker from '../components/MapPicker';
import AddressAutocomplete from '../components/AddressAutocomplete';
import TranslatableField from '../components/TranslatableField';
import { appendTranslationsToFormData, emptyTranslations, fromTranslations, type Translations } from '../utils/translatable';

interface PropertyFormData {
  title: Translations;
  description: Translations;
  price: string;
  location: string;
  latitude: string;
  longitude: string;
  type: string;
  status: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  is_featured: boolean;
}

interface ExistingImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

export default function PropertyForm() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!id;

  const [form, setForm] = useState<PropertyFormData>({
    title: emptyTranslations(),
    description: emptyTranslations(),
    price: '',
    location: '',
    latitude: '',
    longitude: '',
    type: 'apartment',
    status: 'sale',
    bedrooms: '0',
    bathrooms: '0',
    area: '',
    is_featured: false,
  });
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing property data for edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchProperty = async () => {
      try {
        // For edit, we need to get the property from my-properties or directly
        // Since the public endpoint only shows approved properties,
        // we'll try the my-properties endpoint for the user's own properties
        const { data: myProps } = await api.get('/my-properties');
        const allProps = myProps.data || [];
        const property = allProps.find((p: any) => p.id === Number(id));

        if (!property) {
          setError(t('property.form.notFound'));
          return;
        }

        setForm({
          title: fromTranslations(property.title),
          description: fromTranslations(property.description),
          price: String(property.price),
          location: property.location || '',
          latitude: property.latitude ? String(property.latitude) : '',
          longitude: property.longitude ? String(property.longitude) : '',
          type: property.type || 'apartment',
          status: property.status || 'sale',
          bedrooms: String(property.bedrooms || 0),
          bathrooms: String(property.bathrooms || 0),
          area: property.area ? String(property.area) : '',
          is_featured: property.is_featured || false,
        });
        setExistingImages(property.images || []);
      } catch {
        setError(t('property.form.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    if (inputType === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCoordinatesChange = (lat: string, lng: string) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleAddressSelect = (address: string, lat: string, lng: string) => {
    setForm((prev) => ({ ...prev, location: address, latitude: lat, longitude: lng }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages((prev) => [...prev, ...files]);

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = async (imageId: number) => {
    // Note: Image is only removed from local UI state.
    // Backend image deletion endpoint not yet implemented.
    // Images removed here will still exist on the server until
    // a proper delete endpoint is added.
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const formData = new FormData();

      appendTranslationsToFormData(formData, 'title', form.title);
      appendTranslationsToFormData(formData, 'description', form.description);

      formData.append('price', form.price);
      formData.append('location', form.location);
      if (form.latitude) formData.append('latitude', form.latitude);
      if (form.longitude) formData.append('longitude', form.longitude);
      formData.append('type', form.type);
      formData.append('status', form.status);
      formData.append('bedrooms', form.bedrooms);
      formData.append('bathrooms', form.bathrooms);
      if (form.area) formData.append('area', form.area);
      formData.append('is_featured', form.is_featured ? '1' : '0');

      // Append new images
      newImages.forEach((image) => {
        formData.append('images[]', image);
      });

      if (isEditMode) {
        // For update, we need to use POST with _method=PUT since we're sending FormData
        formData.append('_method', 'PUT');
        await api.post(`/properties/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess(t('property.form.updatedSuccess'));
      } else {
        await api.post('/properties', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess(t('property.form.createdSuccess'));
      }

      // Navigate back after a short delay
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        const messages = Object.values(errorData.errors).flat();
        setError(messages.join('\n'));
      } else {
        setError(errorData?.message || t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? t('property.editProperty') : t('property.addProperty')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isEditMode ? t('property.form.updateDetails') : t('property.form.listNew')}
            </p>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{t('common.error')}</span>
            </div>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              {t('property.form.basicInfo')}
            </h2>
            <div className="space-y-6">
              <TranslatableField
                label={t('property.form.title')}
                value={form.title}
                onChange={(title) => setForm((prev) => ({ ...prev, title }))}
                required
              />
              <TranslatableField
                label={t('property.form.description')}
                value={form.description}
                onChange={(description) => setForm((prev) => ({ ...prev, description }))}
                multiline
                required
              />
            </div>
          </section>

          {/* Pricing & Location */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              {t('property.form.pricingLocation')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('property.price')} ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="250000"
                  />
                </div>
              </div>

              {/* Location with Autocomplete */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('property.location')} <span className="text-red-500">*</span>
                </label>
                <AddressAutocomplete
                  value={form.location}
                  onSelect={handleAddressSelect}
                  onChange={(val) => setForm((prev) => ({ ...prev, location: val }))}
                  placeholder="Search for an address..."
                  required
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Powered by OpenStreetMap — type at least 3 characters to search
                </p>
              </div>

            </div>

            {/* Map Picker */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location on Map
              </label>
              <MapPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onCoordinatesChange={handleCoordinatesChange}
                height="350px"
              />
            </div>
          </section>

          {/* Property Details */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              {t('property.form.propertyDetails')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('property.type')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="apartment">{t('property.apartment')}</option>
                  <option value="villa">{t('property.villa')}</option>
                  <option value="land">{t('property.land')}</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('property.status')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="sale">{t('property.sale')}</option>
                  <option value="rent">{t('property.rent')}</option>
                </select>
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('property.area')} ({t('property.sqm')})
                </label>
                <input
                  type="number"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="120"
                />
              </div>

              {/* Bedrooms - Hidden if land */}
              {form.type !== 'land' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('property.bedrooms')}
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={form.bedrooms}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="3"
                  />
                </div>
              )}

              {/* Bathrooms - Hidden if land */}
              {form.type !== 'land' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('property.bathrooms')}
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={form.bathrooms}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="2"
                  />
                </div>
              )}

              {/* Featured checkbox */}
              {user?.role === 'admin' && (
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={form.is_featured}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-blue-600 transition peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('property.featured')}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Images */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              {t('property.images')}
            </h2>

            {/* Existing Images (Edit Mode) */}
            {isEditMode && existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('property.form.currentImages')}:</p>
                <div className="flex flex-wrap gap-3">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={`/storage/${img.image_path}`}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&q=60';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        ×
                      </button>
                      {img.is_primary && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">
                          {t('property.form.primary')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Upload */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {isEditMode ? t('property.form.addNewImages') : t('property.form.uploadImages')}
              </p>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group cursor-pointer w-full"
              >
                <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition">
                    {t('property.form.clickToUpload')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {t('property.form.uploadHint')}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </button>
            </div>
          </section>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('common.loading')}
                </>
              ) : (
                <>{isEditMode ? t('common.save') : t('common.submit')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
