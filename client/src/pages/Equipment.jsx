import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle } from 'lucide-react'

const EQUIPMENT_CATEGORIES = [
  'Camera',
  'Lens',
  'Audio',
  'Lighting',
  'Computer',
  'Storage',
  'Software',
  'Other'
]

export default function Equipment() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Camera',
    purchase_date: '',
    price: '',
    warranty_status: 'active'
  })

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/equipment', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setEquipment(await res.json())
      }
    } catch (err) {
      setError('Failed to load equipment')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEquipment = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          purchase_date: formData.purchase_date,
          price: parseFloat(formData.price),
          warranty_status: formData.warranty_status
        })
      })

      if (res.ok) {
        setFormData({ name: '', category: 'Camera', purchase_date: '', price: '', warranty_status: 'active' })
        setShowForm(false)
        fetchEquipment()
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-2 text-red-600" size={32} />
          <p className="text-slate-400">Loading equipment...</p>
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

  const totalValue = equipment.reduce((sum, item) => sum + (item.price || 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Equipment Inventory</h1>
          <p className="text-slate-400 mt-1">Track your production equipment and assets</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Add Equipment
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-2">Total Equipment</p>
            <p className="text-3xl font-bold text-white">{equipment.length}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium mb-2">Total Value</p>
            <p className="text-3xl font-bold text-green-400">${totalValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Add Equipment Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Equipment</h3>
          <form onSubmit={handleAddEquipment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Equipment Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g., Sony A7IV Camera"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  {EQUIPMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Purchase Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-200 mb-2">Warranty Status</label>
                <select
                  value={formData.warranty_status}
                  onChange={(e) => setFormData({ ...formData, warranty_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="no_warranty">No Warranty</option>
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
                Add Equipment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Equipment Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {equipment && equipment.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Equipment Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Purchase Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Warranty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {equipment.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-400 text-right font-medium">
                    ${item.price?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.warranty_status === 'active'
                        ? 'bg-green-900 text-green-200'
                        : item.warranty_status === 'expired'
                        ? 'bg-red-900 text-red-200'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {item.warranty_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">No equipment added yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add Equipment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
