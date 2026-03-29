import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle } from 'lucide-react'

export default function Analytics() {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subscribers: '',
    total_views: '',
    watch_hours: '',
    estimated_revenue: ''
  })

  useEffect(() => {
    fetchSnapshots()
  }, [])

  const fetchSnapshots = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setSnapshots(await res.json())
      }
    } catch (err) {
      setError('Failed to load analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSnapshot = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscribers: parseInt(formData.subscribers),
          total_views: parseInt(formData.total_views),
          watch_hours: parseFloat(formData.watch_hours),
          estimated_revenue: parseFloat(formData.estimated_revenue)
        })
      })

      if (res.ok) {
        setFormData({ subscribers: '', total_views: '', watch_hours: '', estimated_revenue: '' })
        setShowForm(false)
        fetchSnapshots()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getLatestStats = () => {
    if (!snapshots || snapshots.length === 0) {
      return { subscribers: 0, total_views: 0, watch_hours: 0, estimated_revenue: 0 }
    }
    return snapshots[0]
  }

  const stats = getLatestStats()

  const StatBox = ({ label, value }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <p className="text-slate-400 text-sm font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-2 text-red-600" size={32} />
          <p className="text-slate-400">Loading analytics...</p>
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
          <h1 className="text-3xl font-bold text-white">Channel Analytics</h1>
          <p className="text-slate-400 mt-1">Track your channel's performance over time</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Add Snapshot
        </button>
      </div>

      {/* Add Snapshot Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Analytics Snapshot</h3>
          <form onSubmit={handleAddSnapshot} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Subscribers</label>
                <input
                  type="number"
                  value={formData.subscribers}
                  onChange={(e) => setFormData({ ...formData, subscribers: e.target.value })}
                  placeholder="45200"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Total Views</label>
                <input
                  type="number"
                  value={formData.total_views}
                  onChange={(e) => setFormData({ ...formData, total_views: e.target.value })}
                  placeholder="1250000"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Watch Hours</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.watch_hours}
                  onChange={(e) => setFormData({ ...formData, watch_hours: e.target.value })}
                  placeholder="18500"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Estimated Revenue ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimated_revenue}
                  onChange={(e) => setFormData({ ...formData, estimated_revenue: e.target.value })}
                  placeholder="3240.50"
                  required
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
                Add Snapshot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Subscribers" value={stats.subscribers?.toLocaleString() || '0'} />
        <StatBox label="Total Views" value={stats.total_views?.toLocaleString() || '0'} />
        <StatBox label="Watch Hours" value={stats.watch_hours?.toLocaleString() || '0'} />
        <StatBox label="Est. Revenue" value={`$${stats.estimated_revenue?.toFixed(2) || '0.00'}`} />
      </div>

      {/* Snapshots Table */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Historical Snapshots</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          {snapshots && snapshots.length > 0 ? (
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Subscribers</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Views</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Watch Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {snapshots.map((snapshot) => (
                  <tr key={snapshot.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      {new Date(snapshot.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-200">
                      {snapshot.subscribers?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-200">
                      {snapshot.total_views?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-200">
                      {snapshot.watch_hours?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-400 font-medium">
                      ${snapshot.estimated_revenue?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400 mb-4">No snapshots yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                Add First Snapshot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
