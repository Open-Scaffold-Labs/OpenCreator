import React, { useState, useEffect } from 'react'
import { Save, AlertCircle, Youtube, RefreshCw, Unlink, Sparkles } from 'lucide-react'

export default function Settings({ user }) {
  const [settings, setSettings] = useState({
    channel_name: user?.name || '',
    email: user?.email || '',
    notifications: true,
    theme: 'dark'
  })
  const [saved, setSaved] = useState(false)
  const [yt, setYt] = useState({ loading: true, configured: false, connected: false, channel: null, quota: null })
  const [aiSettings, setAiSettings] = useState({ loading: true, configured: false, provider: 'anthropic', model: '', defaults: {} })
  const [aiKey, setAiKey] = useState('')
  const [aiMsg, setAiMsg] = useState(null)
  const [aiSaving, setAiSaving] = useState(false)

  const loadAi = async () => {
    try {
      const res = await fetch('/api/ai/settings', { headers: authHeaders() })
      if (res.ok) {
        const d = await res.json()
        setAiSettings({ loading: false, configured: d.configured, provider: d.provider, model: d.model || '', defaults: d.defaults || {} })
      } else setAiSettings(s => ({ ...s, loading: false }))
    } catch { setAiSettings(s => ({ ...s, loading: false })) }
  }

  const saveAi = async (e) => {
    e.preventDefault()
    setAiSaving(true)
    setAiMsg(null)
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          provider: aiSettings.provider,
          model: aiSettings.model || null,
          api_key: aiKey || null
        })
      })
      const d = await res.json()
      if (res.ok) {
        setAiMsg({ type: 'success', text: 'AI settings saved' })
        setAiKey('')
        loadAi()
      } else setAiMsg({ type: 'error', text: d.error || 'Save failed' })
    } catch (err) {
      setAiMsg({ type: 'error', text: err.message })
    } finally {
      setAiSaving(false)
    }
  }
  const [ytBusy, setYtBusy] = useState(false)
  const [ytMessage, setYtMessage] = useState(null)

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('oc_token')}`,
    'Content-Type': 'application/json'
  })

  const loadYtStatus = async () => {
    try {
      const res = await fetch('/api/youtube/status', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setYt({ loading: false, ...data })
      } else {
        setYt(s => ({ ...s, loading: false }))
      }
    } catch {
      setYt(s => ({ ...s, loading: false }))
    }
  }

  useEffect(() => {
    loadYtStatus()
    loadAi()
    // Handle redirect back from Google OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('youtube') === 'connected') {
      setYtMessage({ type: 'success', text: 'YouTube channel connected! Run your first sync below.' })
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('youtube') === 'error') {
      setYtMessage({ type: 'error', text: `YouTube connection failed (${params.get('reason') || 'unknown'})` })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnect = async () => {
    setYtBusy(true)
    try {
      const res = await fetch('/api/youtube/auth-url', { headers: authHeaders() })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setYtMessage({ type: 'error', text: data.error || 'Could not start OAuth flow' })
      }
    } catch (err) {
      setYtMessage({ type: 'error', text: err.message })
    } finally {
      setYtBusy(false)
    }
  }

  const handleSync = async () => {
    setYtBusy(true)
    setYtMessage(null)
    try {
      const res = await fetch('/api/youtube/sync', { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      if (res.ok) {
        setYtMessage({ type: 'success', text: `Synced ${data.videos} videos (${data.imported} new, ${data.updated} updated) — ${data.quotaUnits} quota units used` })
        loadYtStatus()
      } else {
        setYtMessage({ type: 'error', text: data.error || 'Sync failed' })
      }
    } catch (err) {
      setYtMessage({ type: 'error', text: err.message })
    } finally {
      setYtBusy(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your YouTube channel? Imported videos stay in your pipeline.')) return
    setYtBusy(true)
    try {
      await fetch('/api/youtube/disconnect', { method: 'DELETE', headers: authHeaders() })
      setYtMessage({ type: 'success', text: 'YouTube channel disconnected' })
      loadYtStatus()
    } finally {
      setYtBusy(false)
    }
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      {saved && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-4 text-green-200">
          Settings saved successfully!
        </div>
      )}

      {/* Account Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-bold text-white">Account Settings</h2>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Channel Name</label>
          <input
            type="text"
            value={settings.channel_name}
            onChange={(e) => setSettings({ ...settings, channel_name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
          />
        </div>
      </div>

      {/* YouTube Connection */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Youtube size={24} className="text-red-500" />
          <h2 className="text-xl font-bold text-white">YouTube Connection</h2>
        </div>

        {ytMessage && (
          <div className={`rounded-lg p-3 text-sm ${ytMessage.type === 'success'
            ? 'bg-green-900 border border-green-700 text-green-200'
            : 'bg-red-900 border border-red-700 text-red-200'}`}>
            {ytMessage.text}
          </div>
        )}

        {yt.loading ? (
          <p className="text-slate-400">Checking connection…</p>
        ) : !yt.configured ? (
          <div className="flex items-start gap-3 text-slate-300">
            <AlertCircle size={20} className="text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-sm">
              Google API credentials are not configured. Copy <code className="text-yellow-300">server/.env.example</code> to{' '}
              <code className="text-yellow-300">server/.env</code> and set <code className="text-yellow-300">GOOGLE_CLIENT_ID</code> and{' '}
              <code className="text-yellow-300">GOOGLE_CLIENT_SECRET</code>, then restart the server.
            </p>
          </div>
        ) : yt.connected && yt.channel ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {yt.channel.thumbnail_url && (
                <img src={yt.channel.thumbnail_url} alt="" className="w-14 h-14 rounded-full" />
              )}
              <div>
                <p className="text-white font-semibold">{yt.channel.channel_name}</p>
                <p className="text-sm text-slate-400">
                  {Number(yt.channel.subscriber_count).toLocaleString()} subscribers ·{' '}
                  {Number(yt.channel.total_views).toLocaleString()} views ·{' '}
                  {yt.channel.video_count} videos
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {yt.channel.last_synced_at
                    ? `Last synced ${new Date(yt.channel.last_synced_at).toLocaleString()}`
                    : 'Never synced'}
                  {yt.quota && ` · API quota today: ${yt.quota.usedToday}/${yt.quota.dailyBudget}`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSync}
                disabled={ytBusy}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                <RefreshCw size={18} className={ytBusy ? 'animate-spin' : ''} />
                {ytBusy ? 'Syncing…' : 'Sync Now'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={ytBusy}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg transition-colors"
              >
                <Unlink size={18} />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              Connect your YouTube channel to import your videos into the pipeline,
              track channel stats, and enable analytics snapshots.
            </p>
            <button
              onClick={handleConnect}
              disabled={ytBusy}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              <Youtube size={18} />
              Connect YouTube Channel
            </button>
          </div>
        )}
      </div>

      {/* AI Assistant (bring your own key) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles size={24} className="text-purple-400" />
          <h2 className="text-xl font-bold text-white">AI Assistant</h2>
          {aiSettings.configured && (
            <span className="px-2 py-0.5 bg-green-900 text-green-200 text-xs rounded">key saved</span>
          )}
        </div>

        {aiMsg && (
          <div className={`rounded-lg p-3 text-sm ${aiMsg.type === 'success'
            ? 'bg-green-900 border border-green-700 text-green-200'
            : 'bg-red-900 border border-red-700 text-red-200'}`}>
            {aiMsg.text}
          </div>
        )}

        <p className="text-sm text-slate-400">
          Bring your own API key — it stays encrypted in your own database and is only used to draft
          titles, hooks, outlines, and descriptions on your shows.
        </p>

        <form onSubmit={saveAi} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Provider</label>
              <select
                value={aiSettings.provider}
                onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none">
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Model</label>
              <input
                type="text"
                value={aiSettings.model}
                placeholder={aiSettings.defaults?.[aiSettings.provider] || 'default'}
                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              API key {aiSettings.configured && <span className="text-slate-400">(leave blank to keep the saved one)</span>}
            </label>
            <input
              type="password"
              value={aiKey}
              autoComplete="off"
              placeholder={aiSettings.configured ? '••••••••••••' : 'sk-…'}
              onChange={(e) => setAiKey(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={aiSaving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium">
              <Save size={18} /> Save AI Settings
            </button>
          </div>
        </form>
      </div>

      {/* Preferences */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-bold text-white">Preferences</h2>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
              className="w-5 h-5 bg-slate-700 border border-slate-600 rounded cursor-pointer accent-red-600"
            />
            <span className="text-slate-200">Enable notifications</span>
          </label>
          <p className="text-sm text-slate-400 mt-2 ml-8">Get alerts for important events and deadlines</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
          >
            <option value="dark">Dark (Default)</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900 bg-opacity-20 border border-red-700 border-opacity-30 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-red-300">Danger Zone</h2>
        <p className="text-red-200 text-sm">These actions are irreversible. Proceed with caution.</p>

        <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">
          Reset All Data
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  )
}
