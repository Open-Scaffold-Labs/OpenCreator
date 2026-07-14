import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

const EVENT_TYPES = [
  'upload',
  'filming',
  'livestream',
  'sponsorship_deadline',
  'meeting'
]

const EVENT_TYPE_COLORS = {
  upload: 'bg-red-900 text-red-200',
  filming: 'bg-blue-900 text-blue-200',
  livestream: 'bg-purple-900 text-purple-200',
  sponsorship_deadline: 'bg-yellow-900 text-yellow-200',
  meeting: 'bg-green-900 text-green-200'
}

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'upload',
    start_date: ''
  })
  const [cadence, setCadence] = useState(null)

  useEffect(() => {
    fetchEvents()
    fetchCadence()
  }, [])

  const fetchCadence = async () => {
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/series/meta/cadence?weeks=4', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setCadence(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/calendar', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setEvents(await res.json())
      }
    } catch (err) {
      setError('Failed to load calendar')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setFormData({ title: '', event_type: 'upload', start_date: '' })
        setShowForm(false)
        fetchEvents()
        fetchCadence()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0]
    return events.filter(e => {
      const eventDate = new Date(e.start_date).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-2 text-red-600" size={32} />
          <p className="text-slate-400">Loading calendar...</p>
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

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Calendar</h1>
          <p className="text-slate-400 mt-1">Plan and track your content schedule</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Add Event
        </button>
      </div>

      {/* Cadence status (from Series targets) */}
      {cadence && cadence.weeklyTarget > 0 && (
        <div className={`rounded-lg p-4 border ${cadence.weeks.some(w => w.gap > 0)
          ? 'bg-yellow-900 bg-opacity-30 border-yellow-700'
          : 'bg-green-900 bg-opacity-30 border-green-700'}`}>
          <p className={`font-medium mb-2 ${cadence.weeks.some(w => w.gap > 0) ? 'text-yellow-200' : 'text-green-200'}`}>
            Cadence target: {cadence.weeklyTarget}/week
            {cadence.weeks.some(w => w.gap > 0)
              ? ' — you have gaps coming up'
              : ' — next 4 weeks are on track'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {cadence.weeks.map((w, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 text-xs ${w.gap > 0
                ? 'bg-yellow-900 text-yellow-200 border border-yellow-800'
                : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                <span className="font-semibold">
                  {new Date(w.start + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </span>
                {' — '}{w.planned}/{Math.ceil(w.target)} planned
                {w.gap > 0 && <span className="font-semibold"> · {w.gap} short</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Event Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Calendar Event</h3>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-200 mb-2">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event name"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-200 mb-2">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1)}</option>
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
                Add Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <h2 className="text-xl font-bold text-white">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-slate-400 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty days */}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-900 rounded-lg p-2 min-h-24"></div>
          ))}

          {/* Days */}
          {daysArray.map((day) => {
            const dayEvents = getEventsForDate(day)
            return (
              <div key={day} className="bg-slate-900 rounded-lg p-2 min-h-24 border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="font-semibold text-white mb-2">{day}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-1 rounded truncate ${EVENT_TYPE_COLORS[event.event_type] || 'bg-slate-700 text-slate-200'}`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-slate-500 px-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Upcoming Events</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          {events && events.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {events
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                .slice(0, 10)
                .map((event) => (
                  <div key={event.id} className="p-4 hover:bg-slate-700 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${EVENT_TYPE_COLORS[event.event_type] || 'bg-slate-700 text-slate-200'}`}>
                        {event.event_type.replace('_', ' ')}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-white">{event.title}</p>
                        <p className="text-sm text-slate-400">
                          {new Date(event.start_date).toLocaleDateString('default', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400 mb-4">No events scheduled</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus size={18} />
                Add Event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
