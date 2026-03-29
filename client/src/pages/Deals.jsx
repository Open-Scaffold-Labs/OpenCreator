import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle } from 'lucide-react'

const DEAL_STATUS = ['pending', 'accepted', 'rejected', 'completed']

export default function Deals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    brand: '',
    amount: '',
    status: 'pending',
    description: ''
  })

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/deals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setDeals(await res.json())
      }
    } catch (err) {
      setError('Failed to load deals')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDeal = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brand: formData.brand,
          amount: parseFloat(formData.amount),
          status: formData.status,
          description: formData.description
        })
      })

      if (res.ok) {
        setFormData({ brand: '', amount: '', status: 'pending', description: '' })
        setShowForm(false)
        fetchDeals()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-900 text-yellow-200',
      accepted: 'bg-green-900 text-green-200',
      rejected: 'bg-red-900 text-red-200',
      completed: 'bg-blue-900 text-blue-200'
    }
    return colors[status] || colors.pending
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-2 text-red-600" size={32} />
          <p className="text-slate-400">Loading deals...</p>
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
          <h1 className="text-3xl font-bold text-white">Brand Deals</h1>
          <p className="text-slate-400 mt-1">Track sponsorship and partnership agreements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          New Deal
        </button>
      </div>

      {/* Add Deal Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Create New Deal</h3>
          <form onSubmit={handleAddDeal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Brand Name</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Brand name"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Deal Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
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
                  {DEAL_STATUS.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deal details"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
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
                Create Deal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deals Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {deals && deals.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Brand</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Description</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{deal.brand}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{deal.description || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(deal.status)}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-green-400 font-medium text-right">
                    ${deal.amount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">No deals yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Create First Deal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
