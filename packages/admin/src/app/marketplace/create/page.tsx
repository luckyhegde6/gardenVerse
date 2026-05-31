'use client'

import { useState } from 'react'
import { Store, ImagePlus, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'

const categories = [
  { value: 'seeds', label: 'Seeds' },
  { value: 'plants', label: 'Plants' },
  { value: 'tools', label: 'Tools' },
  { value: 'items', label: 'Items' },
  { value: 'blueprints', label: 'Blueprints' },
  { value: 'land', label: 'Land' },
]

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'damaged', label: 'Damaged' },
]

export default function CreateListingPage() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const handleAddImage = () => {
    const fakeImage = `https://placehold.co/400x300/1e293b/94a3b8?text=Image+${images.length + 1}`
    setImages(prev => [...prev, fakeImage])
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const isFormValid = title && category && price && quantity && description && condition

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/marketplace"
            className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Store className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Create Listing</h1>
            <p className="text-sm text-slate-500">List a new item for sale on the marketplace</p>
          </div>
        </div>
        {submitted && (
          <Badge variant="success" dot>Listing Created</Badge>
        )}
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Form Fields */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Basic Information</h3>
                <p className="text-xs text-slate-600 mt-0.5">Provide the core details of your listing</p>
              </div>
            </div>
            <div className="space-y-5">
              <Input
                label="Title"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Golden Rose Seeds (Rare)"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Category"
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  options={categories}
                  placeholder="Select a category"
                />
                <Select
                  label="Condition"
                  id="condition"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  options={conditions}
                  placeholder="Select condition"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Price"
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. 29.99"
                />
                <Input
                  label="Quantity"
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe your item in detail — include size, color, growing conditions, or any relevant information..."
                    rows={5}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Shipping */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Pricing Details</h3>
                <p className="text-xs text-slate-600 mt-0.5">Configure pricing and shipping options</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input
                label="Listing Price (¤)"
                id="listing-price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
              />
              <Select
                label="Currency"
                id="currency"
                options={[
                  { value: 'garden-credits', label: 'Garden Credits (¤)' },
                  { value: 'usd', label: 'USD ($)' },
                  { value: 'eur', label: 'EUR (€)' },
                ]}
                defaultValue="garden-credits"
              />
              <Select
                label="Shipping"
                id="shipping"
                options={[
                  { value: 'digital', label: 'Digital Delivery' },
                  { value: 'physical', label: 'Physical Shipping' },
                  { value: 'in-person', label: 'In-Person Trade' },
                ]}
                defaultValue="digital"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Images & Submit */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Images</h3>
                <p className="text-xs text-slate-600 mt-0.5">Add up to 5 images</p>
              </div>
              <Badge variant="info">{images.length}/5</Badge>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-700">
                    <img
                      src={img}
                      alt={`Listing image ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 5 && (
              <button
                onClick={handleAddImage}
                className="w-full border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 hover:border-slate-500 hover:bg-slate-800/30 transition-all cursor-pointer"
              >
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm font-medium">Add Image</span>
                <span className="text-xs">Click to upload or drag and drop</span>
              </button>
            )}
          </div>

          {/* Submit Card */}
          <div className="card">
            <h3 className="card-title mb-3">Ready to Publish?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Review your listing details before publishing. You can edit the listing after it is live.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={!isFormValid}
              >
                <Store className="w-4 h-4" />
                Publish Listing
              </Button>
              <Link href="/marketplace">
                <Button variant="ghost" className="w-full" size="sm">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>

          {/* Listing Tips */}
          <div className="card bg-amber-500/5 border-amber-500/20">
            <h3 className="card-title text-amber-400 mb-2">Listing Tips</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Use clear, descriptive titles that buyers can search for
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Add high-quality images to increase visibility
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Set a competitive price by researching similar listings
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Listings with complete details sell 3x faster
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
