import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle } from 'lucide-react'

const BRAND_STATUS = ['prospect', 'contacted', 'negotiating', 'active', 'completed', 'declined']

export default function Brands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    status: 'prospect',
    industry: ''
  })

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/brands', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setBrands(await res.json())
      }
    } catch (err) {
      setError('Failed to load brands')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBrand = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setFormData({ name: '', contact: '', status: 'prospect', industry: '' })
        setShowForm(false)
        fetchBrands()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      prospect: 'bg-slate-700 text-slate-200',
      contacted: 'bg-blue-900 text-blue-200',
      negotiating: 'bg-yellow-900 text-yellow-200',
      active: 'bg-green-900 text-green-200',
      completed: 'bg-purple-900 text-purple-200',
      declined: 'bg-red-900 text-red-200'
    }
    return colors[status] || colors.prospect
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-2 text-red-600" size={32} />
          <p className="text-slate-400">Loading brands...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex gap-2 text-red-200">
        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Brand Partnerships</h1>
          <p className="text-slate-400 mt-1">Manage sponsorship opportunities and brand relationships</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Add Brand
        </button>
      </div>

      {/* Add Brand Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add New Brand</h3>
          <form onSubmit={handleAddBrand} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Brand Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Company name"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="contact@brand.com"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="E.g., Technology, Fashion"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  {BRAND_STATUS.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Add Brand
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brands Grid */}
      {brands && brands.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div key={brand.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{brand.name}</h3>
                  {brand.industry && (
                    <p className="text-sm text-slate-400 mt-1">{brand.industry}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getStatusColor(brand.status)}`}>
                  {brand.status}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Contact</p>
                <a
                  href={`mailto:${brand.contact}`}
                  className="text-red-500 hover:text-red-400 text-sm break-all transition-colors"
                >
                  {brand.contact}
                </a>
              </div>

              {brand.created_at && (
                <div className="pt-4 border-t border-slate-700 mt-4">
                  <p className="text-xs text-slate-500">
                    Added {new Date(brand.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-slate-400 mb-4">No brands added yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Your First Brand
          </button>
        </div>
      )}
    </div>
  )
}
