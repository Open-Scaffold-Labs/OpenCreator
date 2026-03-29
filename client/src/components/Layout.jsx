import React, { useState } from 'react'
import StandardHeader from './StandardHeader'
import {
  LayoutDashboard,
  Globe,
  FileText,
  Image,
  BookOpen,
  MessageSquareQuote,
  CalendarCheck,
  Mail,
  Kanban,
  CalendarDays,
  DollarSign,
  Building2,
  Handshake,
  Users,
  Camera,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react'

const NAVIGATION = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    group: 'Website Builder',
    items: [
      { id: 'website', label: 'My Website', icon: Globe }
    ]
  },
  {
    group: 'Content',
    items: [
      { id: 'pipeline', label: 'Pipeline', icon: Kanban },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays }
    ]
  },
  {
    group: 'Business',
    items: [
      { id: 'finances', label: 'Finances', icon: DollarSign },
      { id: 'brands', label: 'Brands', icon: Building2 },
      { id: 'deals', label: 'Deals', icon: Handshake },
      { id: 'team', label: 'Team', icon: Users }
    ]
  },
  {
    group: 'Assets',
    items: [
      { id: 'equipment', label: 'Equipment', icon: Camera }
    ]
  },
  {
    group: 'Intelligence',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3 }
    ]
  },
  {
    group: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings }
    ]
  }
]

export default function Layout({
  children,
  page,
  setPage,
  user,
  onLogout,
  navigateTo
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 bg-rose-600 rounded flex items-center justify-center font-bold text-white">
              OC
            </div>
            {!collapsed && (
              <div>
                <div className="font-bold text-white text-sm">Open Creator</div>
                <div className="text-xs text-slate-400">Website Builder</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {NAVIGATION.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                  {group.group}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = page === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPage(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-red-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.label}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
          >
            {collapsed ? (
              <ChevronRight size={20} />
            ) : (
              <>
                <ChevronLeft size={20} />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-900 hover:text-red-200 transition-colors"
          >
            <LogOut size={20} />
            {!collapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <StandardHeader user={user} />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
