import React, { useState } from 'react'
import { Save, AlertCircle } from 'lucide-react'

export default function Settings({ user }) {
  const [settings, setSettings] = useState({
    channel_name: user?.name || '',
    email: user?.email || '',
    notifications: true,
    theme: 'dark'
  })
  const [saved, setSaved] = useState(false)

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
