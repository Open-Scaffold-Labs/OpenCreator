import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Loader, AlertCircle, Plus } from 'lucide-react'

export default function Dashboard({ user, navigateTo }) {
  const [stats, setStats] = useState(null)
  const [recentContent, setRecentContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('oc_token')

        // Fetch stats (you may need to adjust endpoint based on backend)
        const statsRes = await fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (statsRes.ok) {
          setStats(await statsRes.json())
        }

        // Fetch recent content
        const contentRes = await fetch('/api/content?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (contentRes.ok) {
          setRecentContent(await contentRes.json())
        }
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const StatCard = ({ label, value, trend, icon: Icon }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <Icon className="text-red-600" size={24} />
      </div>
      {trend !== undefined && (
        <div className={`mt-3 flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(trend)}% this month</span>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-2 text-red-600" size={32} />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {user?.name || 'Creator'}!
        </h1>
        <p className="text-slate-400">Here's what's happening with your channel today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Videos" value="28" trend={8} icon={() => <div className="w-6 h-6 bg-red-600 rounded" />} />
        <StatCard label="Subscribers" value="45.2K" trend={12} icon={() => <div className="w-6 h-6 bg-blue-600 rounded" />} />
        <StatCard label="Revenue (Month)" value="$3,240" trend={-3} icon={() => <div className="w-6 h-6 bg-green-600 rounded" />} />
        <StatCard label="Active Deals" value="5" trend={2} icon={() => <div className="w-6 h-6 bg-purple-600 rounded" />} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigateTo('pipeline')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-4 transition-colors text-left flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Plus className="text-white" size={24} />
            </div>
            <div>
              <div className="font-semibold text-white">New Video</div>
              <div className="text-xs text-slate-400">Add to pipeline</div>
            </div>
          </button>
          <button
            onClick={() => navigateTo('finances')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-4 transition-colors text-left flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Plus className="text-white" size={24} />
            </div>
            <div>
              <div className="font-semibold text-white">Add Revenue</div>
              <div className="text-xs text-slate-400">Log earnings</div>
            </div>
          </button>
          <button
            onClick={() => navigateTo('brands')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-4 transition-colors text-left flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Plus className="text-white" size={24} />
            </div>
            <div>
              <div className="font-semibold text-white">New Brand</div>
              <div className="text-xs text-slate-400">Add partnership</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Content</h2>
          <button
            onClick={() => navigateTo('pipeline')}
            className="text-red-600 hover:text-red-500 text-sm font-medium"
          >
            View All
          </button>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          {recentContent && recentContent.length > 0 ? (
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {recentContent.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-white">{item.title || 'Untitled'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-red-900 text-red-200 rounded-full text-xs font-medium">
                        {item.type || 'Video'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-xs font-medium">
                        {item.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400 mb-4">No content yet</p>
              <button
                onClick={() => navigateTo('pipeline')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                Create Your First Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
