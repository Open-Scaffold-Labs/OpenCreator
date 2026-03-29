import React, { useState, useEffect, Suspense } from 'react'
import Layout from './components/Layout'
import LoginScreen from './components/LoginScreen'
import Dashboard from './pages/Dashboard'
import Website from './pages/Website'
import Pipeline from './pages/Pipeline'
import Analytics from './pages/Analytics'
import Finances from './pages/Finances'
import Brands from './pages/Brands'
import Deals from './pages/Deals'
import Team from './pages/Team'
import Equipment from './pages/Equipment'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import Revenue from './pages/Revenue'
import Expenses from './pages/Expenses'

const TOKEN_KEY = 'oc_token'

const PAGE_REGISTRY = {
  dashboard: Dashboard,
  website: Website,
  pipeline: Pipeline,
  analytics: Analytics,
  finances: Finances,
  brands: Brands,
  deals: Deals,
  team: Team,
  equipment: Equipment,
  calendar: Calendar,
  settings: Settings,
  revenue: Revenue,
  expenses: Expenses,
}

// API wrapper — attaches auth token to all requests
const api = async (path, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  const res = await fetch(path, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('oc_user')
    window.location.reload()
  }
  return res
}

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [pageData, setPageData] = useState({})
  const [loading, setLoading] = useState(true)

  // Auth check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (!token) {
          setLoading(false)
          return
        }

        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
          localStorage.setItem('oc_user', JSON.stringify(userData))
        } else {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem('oc_user')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('oc_user')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = (userData, token) => {
    setUser(userData)
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem('oc_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('oc_user')
    setPage('dashboard')
  }

  const navigateTo = (pageId, data = {}) => {
    setPage(pageId)
    setPageData(data)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-400">Loading Open Creator...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />
  }

  const CurrentPage = PAGE_REGISTRY[page] || Dashboard

  return (
    <Layout
      page={page}
      setPage={setPage}
      user={user}
      pageData={pageData}
      onLogout={handleLogout}
      navigateTo={navigateTo}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      }>
        <CurrentPage
          pageData={pageData}
          user={user}
          api={api}
          navigateTo={navigateTo}
        />
      </Suspense>
    </Layout>
  )
}
