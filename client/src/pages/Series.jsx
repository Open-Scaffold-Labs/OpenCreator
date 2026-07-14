import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle, Clapperboard, CalendarPlus, Pencil, Trash2 } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const EMPTY = {
  name: '', description: '', content_type: 'video', cadence_per_week: 1,
  day_of_week: '', title_template: '', description_template: '', tags_template: ''
}

export default function Series() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [message, setMessage] = useState(null)

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('oc_token')}`,
    'Content-Type': 'application/json'
  })

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/series', { headers: authHeaders() })
      if (res.ok) setSeries(await res.json())
      else setError('Failed to load series')
    } catch (err) {
      setError('Failed to load series')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      cadence_per_week: parseFloat(form.cadence_per_week) || 1,
      day_of_week: form.day_of_week === '' ? null : parseInt(form.day_of_week, 10)
    }
    const url = editingId ? `/api/series/${editingId}` : '/api/series'
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      setForm(EMPTY); setShowForm(false); setEditingId(null); load()
    } else {
      const d = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: d.error || 'Save failed' })
    }
  }

  const planNext = async (s) => {
    const res = await fetch(`/api/series/${s.id}/next-episode`, {
      method: 'POST', headers: authHeaders()
    })
    if (res.ok) {
      const ep = await res.json()
      setMessage({ type: 'success', text: `Planned "${ep.title}" for ${new Date(ep.scheduled_date).toLocaleDateString()} — see Pipeline & Calendar` })
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: d.error || 'Could not plan episode' })
    }
  }

  const remove = async (s) => {
    if (!confirm(`Archive series "${s.name}"? Existing episodes are kept.`)) return
    await fetch(`/api/series/${s.id}`, { method: 'DELETE', headers: authHeaders() })
    load()
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setForm({
      name: s.name, description: s.description || '', content_type: s.content_type,
      cadence_per_week: s.cadence_per_week, day_of_week: s.day_of_week ?? '',
      title_template: s.title_template || '', description_template: s.description_template || '',
      tags_template: s.tags_template || ''
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-red-600" size={32} />
      </div>
    )
  }

  const input = "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
  const label = "block text-sm font-medium text-slate-200 mb-2"

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Series</h1>
          <p className="text-slate-400 mt-1">Recurring show formats that drive your publishing cadence</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setEditingId(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">
          <Plus size={20} /> New Series
        </button>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === 'success'
          ? 'bg-green-900 border border-green-700 text-green-200'
          : 'bg-red-900 border border-red-700 text-red-200'}`}>
          {message.text}
        </div>
      )}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex gap-2 text-red-200">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" /><p>{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Series' : 'New Series'}</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Name *</label>
                <input className={input} required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Weekly Tutorial" />
              </div>
              <div>
                <label className={label}>Format</label>
                <select className={input} value={form.content_type}
                  onChange={e => setForm({ ...form, content_type: e.target.value })}>
                  <option value="video">Long-form video</option>
                  <option value="short">Short</option>
                  <option value="live">Livestream</option>
                </select>
              </div>
              <div>
                <label className={label}>Episodes per week</label>
                <input className={input} type="number" min="0.25" step="0.25" value={form.cadence_per_week}
                  onChange={e => setForm({ ...form, cadence_per_week: e.target.value })} />
              </div>
              <div>
                <label className={label}>Preferred publish day</label>
                <select className={input} value={form.day_of_week}
                  onChange={e => setForm({ ...form, day_of_week: e.target.value })}>
                  <option value="">No preference</option>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Title template <span className="text-slate-400">({'{n}'} = episode number)</span></label>
              <input className={input} value={form.title_template}
                onChange={e => setForm({ ...form, title_template: e.target.value })} placeholder="Tutorial Tuesday #{n}" />
            </div>
            <div>
              <label className={label}>Default description</label>
              <textarea className={input} rows="2" value={form.description_template}
                onChange={e => setForm({ ...form, description_template: e.target.value })} />
            </div>
            <div>
              <label className={label}>Default tags (comma-separated)</label>
              <input className={input} value={form.tags_template}
                onChange={e => setForm({ ...form, tags_template: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">Cancel</button>
              <button type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">
                {editingId ? 'Save Changes' : 'Create Series'}
              </button>
            </div>
          </form>
        </div>
      )}

      {series.length === 0 && !showForm ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <Clapperboard size={40} className="mx-auto text-slate-500 mb-3" />
          <p className="text-slate-300 font-medium">No series yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Create a recurring show format — the calendar uses it to plan episodes and flag cadence gaps.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {series.map(s => (
            <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold">{s.name}</h3>
                  <p className="text-sm text-slate-400">
                    {s.content_type === 'short' ? 'Shorts' : s.content_type === 'live' ? 'Livestream' : 'Long-form'}
                    {' · '}{parseFloat(s.cadence_per_week)}×/week
                    {s.day_of_week !== null && ` · ${DAYS[s.day_of_week]}s`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} className="text-slate-400 hover:text-white" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => remove(s)} className="text-slate-400 hover:text-red-400" title="Archive">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {s.description && <p className="text-sm text-slate-300">{s.description}</p>}
              <p className="text-xs text-slate-500">
                {s.episode_count} episodes planned · {s.published_count} published · next is #{s.next_episode_number}
              </p>
              <button onClick={() => planNext(s)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                <CalendarPlus size={16} /> Plan next episode
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
