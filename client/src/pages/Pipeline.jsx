import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'

const CONTENT_TYPES = {
  video: { label: 'Video', bg: 'bg-red-900', text: 'text-red-200' },
  short: { label: 'Short', bg: 'bg-blue-900', text: 'text-blue-200' },
  post: { label: 'Post', bg: 'bg-green-900', text: 'text-green-200' },
  live: { label: 'Live', bg: 'bg-purple-900', text: 'text-purple-200' }
}

export default function Pipeline({ navigateTo }) {
  const [stages, setStages] = useState([])
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newContent, setNewContent] = useState({ title: '', type: 'video', stage_id: null })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('oc_token')

      // Fetch stages
      const stagesRes = await fetch('/api/pipeline/stages', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (stagesRes.ok) {
        setStages(await stagesRes.json())
      }

      // Fetch content
      const contentRes = await fetch('/api/content', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (contentRes.ok) {
        setContent(await contentRes.json())
      }
    } catch (err) {
      setError('Failed to load pipeline')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContent = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newContent,
          stage_id: newContent.stage_id || (stages[0]?.id)
        })
      })

      if (res.ok) {
        setNewContent({ title: '', type: 'video', stage_id: null })
        setShowNewForm(false)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const moveContent = async (contentId, direction) => {
    const currentContent = content.find(c => c.id === contentId)
    if (!currentContent) return

    const currentStageIndex = stages.findIndex(s => s.id === currentContent.stage_id)
    if (currentStageIndex === -1) return

    let newStageIndex = currentStageIndex
    if (direction === 'right' && currentStageIndex < stages.length - 1) {
      newStageIndex = currentStageIndex + 1
    } else if (direction === 'left' && currentStageIndex > 0) {
      newStageIndex = currentStageIndex - 1
    } else {
      return
    }

    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage_id: stages[newStageIndex].id })
      })

      if (res.ok) {
        fetchData()
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
          <p className="text-slate-400">Loading pipeline...</p>
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

  const groupedContent = {}
  stages.forEach(stage => {
    groupedContent[stage.id] = content.filter(c => c.stage_id === stage.id)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Pipeline</h1>
          <p className="text-slate-400 mt-1">Organize and track your content production</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          New Content
        </button>
      </div>

      {/* New Content Form */}
      {showNewForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Create New Content</h3>
          <form onSubmit={handleAddContent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Title</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  placeholder="Video title"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Type</label>
                <select
                  value={newContent.type}
                  onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  {Object.entries(CONTENT_TYPES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Stage</label>
                <select
                  value={newContent.stage_id || ''}
                  onChange={(e) => setNewContent({ ...newContent, stage_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="">Select stage</option>
                  {stages.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pipeline Columns */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-96 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col"
          >
            {/* Column Header */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{stage.name}</h3>
                <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
                  {groupedContent[stage.id]?.length || 0}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {groupedContent[stage.id] && groupedContent[stage.id].length > 0 ? (
                groupedContent[stage.id].map((item) => {
                  const contentType = CONTENT_TYPES[item.content_type] || CONTENT_TYPES.video
                  return (
                    <div key={item.id} className="bg-slate-700 border border-slate-600 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-white text-sm flex-1">{item.title}</h4>
                        <span className={`${contentType.bg} ${contentType.text} text-xs px-2 py-1 rounded whitespace-nowrap`}>
                          {contentType.label}
                        </span>
                      </div>
                      {item.scheduled_date && (
                        <p className="text-xs text-slate-400">
                          {new Date(item.scheduled_date).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => moveContent(item.id, 'left')}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs rounded transition-colors"
                        >
                          <ChevronLeft size={14} />
                          Left
                        </button>
                        <button
                          onClick={() => moveContent(item.id, 'right')}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs rounded transition-colors"
                        >
                          Right
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No content</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
