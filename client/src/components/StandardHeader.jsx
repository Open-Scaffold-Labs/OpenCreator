import React, { useState } from 'react'
import { Bell, ChevronDown } from 'lucide-react'

const APP_REGISTRY = [
  { name: 'Open Firehouse', port: 5173, bgColor: 'bg-red-600', badge: 'OF' },
  { name: 'OpenScaffold', port: 5174, bgColor: 'bg-indigo-600', badge: 'OS' },
  { name: 'Open Firehouse Field', port: 5175, bgColor: 'bg-orange-600', badge: 'FF' },
  { name: 'Open Interior Designer', port: 5176, bgColor: 'bg-indigo-500', badge: 'ID' },
  { name: 'Open Landscaping', port: 5177, bgColor: 'bg-green-600', badge: 'OL' },
  { name: 'Open Landscape Architect', port: 5178, bgColor: 'bg-emerald-600', badge: 'LA' },
  { name: 'Open Restaurant', port: 5179, bgColor: 'bg-amber-600', badge: 'OR' },
  { name: 'Open Creator', port: 5180, bgColor: 'bg-rose-600', badge: 'OC', isCurrent: true },
  { name: 'Open Property Manager', port: 5181, bgColor: 'bg-violet-600', badge: 'PM' },
  { name: 'Open Developer', port: 5182, bgColor: 'bg-sky-500', badge: 'OD' },
  { name: 'Open Shop', port: 5183, bgColor: 'bg-pink-600', badge: 'SH' },
]

export default function StandardHeader({ user }) {
  const [appMenuOpen, setAppMenuOpen] = useState(false)

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleAppSwitch = (port) => {
    if (port !== 5180) {
      window.location.href = `http://localhost:${port}`
    }
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      {/* Left: App Switcher */}
      <div className="relative">
        <button
          onClick={() => setAppMenuOpen(!appMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          <div className="w-6 h-6 bg-rose-600 rounded flex items-center justify-center text-white text-xs font-bold">
            OC
          </div>
          <span>Open Creator</span>
          <ChevronDown size={16} />
        </button>

        {appMenuOpen && (
          <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg min-w-max z-50 max-h-96 overflow-y-auto">
            {APP_REGISTRY.map((app) => (
              <button
                key={app.port}
                onClick={() => {
                  handleAppSwitch(app.port)
                  setAppMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-slate-700 transition-colors ${
                  app.isCurrent ? 'bg-slate-700' : ''
                }`}
              >
                <div className={`w-5 h-5 ${app.bgColor} rounded flex items-center justify-center text-white text-xs font-bold`}>
                  {app.badge}
                </div>
                <div className="text-sm">
                  <div className="font-medium">{app.name}</div>
                  <div className="text-xs text-slate-500">:{app.port}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Notifications & User */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200">
          <Bell size={20} />
        </button>
        <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center font-bold text-white">
          {getInitials(user?.name || user?.username || 'U')}
        </div>
      </div>
    </header>
  )
}
