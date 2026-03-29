import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle } from 'lucide-react'

const TEAM_ROLES = ['Editor', 'Thumbnail Designer', 'Researcher', 'Community Manager', 'VA', 'Other']
const TEAM_STATUS = ['active', 'inactive']

export default function Team() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: 'Editor',
    email: '',
    rate: '',
    status: 'active'
  })

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setTeam(await res.json())
      }
    } catch (err) {
      setError('Failed to load team')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeamMember = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          email: formData.email,
          rate: parseFloat(formData.rate),
          status: formData.status
        })
      })

      if (res.ok) {
        setFormData({ name: '', role: 'Editor', email: '', rate: '', status: 'active' })
        setShowForm(false)
        fetchTeam()
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
          <p className="text-slate-400">Loading team...</p>
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
          <h1 className="text-3xl font-bold text-white">Team Management</h1>
          <p className="text-slate-400 mt-1">Manage your crew and collaborators</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Add Team Member
        </button>
      </div>

      {/* Add Team Member Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Team Member</h3>
          <form onSubmit={handleAddTeamMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  {TEAM_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Rate per Hour ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
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
                  {TEAM_STATUS.map(status => (
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
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {team && team.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Email</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Rate/Hour</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{member.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-200">{member.role}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{member.email}</td>
                  <td className="px-6 py-4 text-sm text-green-400 text-right font-medium">
                    ${member.rate?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.status === 'active'
                        ? 'bg-green-900 text-green-200'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">No team members yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add Your First Team Member
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
