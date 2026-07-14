import React, { useState, useEffect } from 'react'
import { ArrowLeft, Loader, Save, Plus, Trash2, CheckCircle2, Circle, AlertCircle, Sparkles } from 'lucide-react'

export default function ShowDetail({ pageData, navigateTo }) {
  const [item, setItem] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [newTask, setNewTask] = useState('')
  const [brief, setBrief] = useState({ concept: '', target_viewer: '', promise: '', hook: '', outline: '' })
  const [report, setReport] = useState(null)
  const [reportErr, setReportErr] = useState(null)
  const [aiBusy, setAiBusy] = useState(null) // which kind is generating
  const [aiResult, setAiResult] = useState(null) // { kind, text }
  const [aiErr, setAiErr] = useState(null)

  const draft = async (kind) => {
    setAiBusy(kind)
    setAiErr(null)
    setAiResult(null)
    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ content_id: item.id, kind })
      })
      const d = await res.json()
      if (res.ok) setAiResult(d)
      else setAiErr(d.error || 'Draft failed')
    } catch (err) {
      setAiErr(err.message)
    } finally {
      setAiBusy(null)
    }
  }

  const applyAiResult = () => {
    if (!aiResult) return
    const t = aiResult.text
    if (aiResult.kind === 'hook') {
      setBrief(b => ({ ...b, hook: t }))
    } else if (aiResult.kind === 'outline') {
      setBrief(b => ({ ...b, outline: t.split('\n').map(s => s.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).join('\n') }))
    } else if (aiResult.kind === 'description') {
      const desc = (t.split(/TAGS:/i)[0] || '').replace(/DESCRIPTION:/i, '').trim()
      const tags = (t.split(/TAGS:/i)[1] || '').trim()
      setMeta(m => ({ ...m, description: desc || m.description, tags: tags || m.tags }))
    }
    setAiResult(null)
  }

  const useTitle = (line) => {
    setMeta(m => ({ ...m, title: line.replace(/^\d+[.)]\s*/, '').replace(/^["']|["']$/g, '').trim() }))
  }
  const [script, setScript] = useState('')
  const [meta, setMeta] = useState({ title: '', description: '', tags: '' })

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('oc_token')}`,
    'Content-Type': 'application/json'
  })

  const load = async () => {
    if (!pageData?.id) { setLoading(false); return }
    try {
      const [cRes, tRes] = await Promise.all([
        fetch(`/api/content/${pageData.id}`, { headers: authHeaders() }),
        fetch(`/api/content/${pageData.id}/tasks`, { headers: authHeaders() })
      ])
      if (cRes.ok) {
        const c = await cRes.json()
        setItem(c)
        const b = c.brief || {}
        setBrief({
          concept: b.concept || '', target_viewer: b.target_viewer || '',
          promise: b.promise || '', hook: b.hook || '',
          outline: Array.isArray(b.outline) ? b.outline.join('\n') : (b.outline || '')
        })
        setScript(c.script || '')
        setMeta({ title: c.title || '', description: c.description || '', tags: c.tags || '' })
      }
      if (tRes.ok) setTasks(await tRes.json())
    } finally {
      setLoading(false)
    }
  }

  const loadReport = async (contentId) => {
    try {
      const res = await fetch(`/api/youtube/report/${contentId}`, { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) setReport(data)
      else setReportErr(data.error)
    } catch (err) {
      setReportErr(err.message)
    }
  }

  useEffect(() => {
    if (item?.youtube_video_id) loadReport(item.id)
  }, [item?.youtube_video_id])

  useEffect(() => { load() }, [pageData?.id])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/content/${item.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          title: meta.title,
          description: meta.description,
          tags: meta.tags,
          script,
          brief: {
            concept: brief.concept,
            target_viewer: brief.target_viewer,
            promise: brief.promise,
            hook: brief.hook,
            outline: brief.outline.split('\n').map(s => s.trim()).filter(Boolean)
          }
        })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Saved' })
        setTimeout(() => setMessage(null), 2500)
      } else {
        const d = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: d.error || 'Save failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    const res = await fetch(`/api/content/${item.id}/tasks`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ title: newTask.trim() })
    })
    if (res.ok) { setNewTask(''); setTasks([...tasks, await res.json()]) }
  }

  const toggleTask = async (t) => {
    const status = t.status === 'done' ? 'pending' : 'done'
    const res = await fetch(`/api/content/tasks/${t.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ status })
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks(tasks.map(x => x.id === t.id ? updated : x))
    }
  }

  const deleteTask = async (t) => {
    const res = await fetch(`/api/content/tasks/${t.id}`, {
      method: 'DELETE', headers: authHeaders()
    })
    if (res.ok) setTasks(tasks.filter(x => x.id !== t.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-red-600" size={32} />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex gap-2 text-red-200">
        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
        <p>Show not found. <button className="underline" onClick={() => navigateTo('pipeline')}>Back to Pipeline</button></p>
      </div>
    )
  }

  const input = "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
  const label = "block text-sm font-medium text-slate-200 mb-2"
  const card = "bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4"
  const done = tasks.filter(t => t.status === 'done').length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigateTo('pipeline')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{meta.title || 'Untitled Show'}</h1>
            <p className="text-slate-400 text-sm">
              {item.stage_name || 'No stage'}
              {item.scheduled_date && ` · scheduled ${new Date(item.scheduled_date).toLocaleDateString()}`}
              {tasks.length > 0 && ` · checklist ${done}/${tasks.length}`}
            </p>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium">
          {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          Save Brief
        </button>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === 'success'
          ? 'bg-green-900 border border-green-700 text-green-200'
          : 'bg-red-900 border border-red-700 text-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Performance (only for shows on YouTube) */}
      {item.youtube_video_id && (
        <div className={card}>
          <h2 className="text-lg font-bold text-white">Performance</h2>
          {report?.metrics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Views', report.metrics.views],
                  ['Watch time (min)', report.metrics.estimatedMinutesWatched],
                  ['Avg view duration', report.metrics.averageViewDuration != null ? `${Math.round(report.metrics.averageViewDuration)}s` : '—'],
                  ['Avg % viewed', report.metrics.averageViewPercentage != null ? `${report.metrics.averageViewPercentage.toFixed(1)}%` : '—']
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="text-xl font-bold text-white">{v ?? '—'}</p>
                  </div>
                ))}
              </div>
              {report.retention && report.retention.length > 1 ? (
                <div>
                  <p className="text-sm font-medium text-slate-200 mb-2">
                    Retention curve <span className="text-slate-400">— watch the first 30 seconds</span>
                  </p>
                  <div className="flex items-end gap-px h-24 bg-slate-900 border border-slate-700 rounded-lg p-2">
                    {report.retention.map((p, i) => (
                      <div key={i}
                        className="flex-1 bg-red-600 rounded-t"
                        style={{ height: `${Math.min(100, p.watchRatio * 100)}%` }}
                        title={`${Math.round(p.position * 100)}% in: ${(p.watchRatio * 100).toFixed(0)}% watching`} />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Start</span><span>End</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Retention curve not available yet — YouTube needs more views before it reports this.</p>
              )}
            </>
          ) : reportErr ? (
            <p className="text-sm text-slate-400">No analytics yet: {reportErr}</p>
          ) : (
            <p className="text-sm text-slate-400">Loading analytics…</p>
          )}
        </div>
      )}

      {/* AI Assist */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-400" />
          <h2 className="text-lg font-bold text-white">AI Assist</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['titles', 'Suggest titles'],
            ['hook', 'Draft hook'],
            ['outline', 'Draft outline'],
            ['description', 'Write description & tags']
          ].map(([kind, labelText]) => (
            <button key={kind} onClick={() => draft(kind)} disabled={!!aiBusy}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium">
              {aiBusy === kind ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {labelText}
            </button>
          ))}
        </div>
        {aiErr && (
          <p className="text-sm text-red-300">{aiErr}{/no ai api key/i.test(aiErr) ? ' → Settings' : ''}</p>
        )}
        {aiResult && (
          <div className="bg-slate-900 border border-purple-800 rounded-lg p-4 space-y-3">
            {aiResult.kind === 'titles' ? (
              <div className="space-y-1">
                <p className="text-xs text-slate-400 mb-2">Click a title to use it:</p>
                {aiResult.text.split('\n').filter(l => l.trim()).map((line, i) => (
                  <button key={i} onClick={() => useTitle(line)}
                    className="block w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-purple-300 rounded transition-colors">
                    {line}
                  </button>
                ))}
              </div>
            ) : (
              <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans">{aiResult.text}</pre>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAiResult(null)}
                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
                Dismiss
              </button>
              {aiResult.kind !== 'titles' && (
                <button onClick={applyAiResult}
                  className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
                  Use this
                </button>
              )}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-500">Drafts use your own API key (Settings → AI Assistant). Remember to Save Brief after applying.</p>
      </div>

      {/* Concept */}
      <div className={card}>
        <h2 className="text-lg font-bold text-white">Concept</h2>
        <div>
          <label className={label}>Working title</label>
          <input className={input} value={meta.title}
            onChange={e => setMeta({ ...meta, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Who is this for?</label>
            <input className={input} value={brief.target_viewer} placeholder="The viewer you're making this for"
              onChange={e => setBrief({ ...brief, target_viewer: e.target.value })} />
          </div>
          <div>
            <label className={label}>The promise</label>
            <input className={input} value={brief.promise} placeholder="What the viewer gets by the end"
              onChange={e => setBrief({ ...brief, promise: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={label}>Concept</label>
          <textarea className={input} rows="3" value={brief.concept} placeholder="What is this show about, and why now?"
            onChange={e => setBrief({ ...brief, concept: e.target.value })} />
        </div>
      </div>

      {/* Hook & Outline */}
      <div className={card}>
        <h2 className="text-lg font-bold text-white">Hook &amp; Outline</h2>
        <div>
          <label className={label}>First 30 seconds <span className="text-slate-400">— the retention make-or-break</span></label>
          <textarea className={input} rows="3" value={brief.hook} placeholder="Open cold on... / The one line that makes them stay"
            onChange={e => setBrief({ ...brief, hook: e.target.value })} />
        </div>
        <div>
          <label className={label}>Beats <span className="text-slate-400">(one per line)</span></label>
          <textarea className={input} rows="6" value={brief.outline} placeholder={"Intro & hook\nProblem setup\nMain demonstration\nPayoff\nCTA & next video tease"}
            onChange={e => setBrief({ ...brief, outline: e.target.value })} />
        </div>
      </div>

      {/* Script */}
      <div className={card}>
        <h2 className="text-lg font-bold text-white">Script</h2>
        <textarea className={`${input} font-mono text-sm`} rows="14" value={script}
          placeholder="Write or paste the full script here…"
          onChange={e => setScript(e.target.value)} />
      </div>

      {/* Packaging */}
      <div className={card}>
        <h2 className="text-lg font-bold text-white">Packaging</h2>
        <div>
          <label className={label}>YouTube description</label>
          <textarea className={input} rows="4" value={meta.description}
            onChange={e => setMeta({ ...meta, description: e.target.value })} />
        </div>
        <div>
          <label className={label}>Tags (comma-separated)</label>
          <input className={input} value={meta.tags}
            onChange={e => setMeta({ ...meta, tags: e.target.value })} />
        </div>
      </div>

      {/* Production checklist */}
      <div className={card}>
        <h2 className="text-lg font-bold text-white">Production Checklist</h2>
        {tasks.length > 0 && (
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 group">
                <button onClick={() => toggleTask(t)} className="text-slate-400 hover:text-green-400">
                  {t.status === 'done'
                    ? <CheckCircle2 size={18} className="text-green-400" />
                    : <Circle size={18} />}
                </button>
                <span className={`flex-1 text-sm ${t.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {t.title}
                </span>
                <button onClick={() => deleteTask(t)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addTask} className="flex gap-2">
          <input className={input} value={newTask} placeholder="Add a step — shot list, b-roll, sponsor read…"
            onChange={e => setNewTask(e.target.value)} />
          <button type="submit"
            className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors whitespace-nowrap">
            <Plus size={16} /> Add
          </button>
        </form>
      </div>
    </div>
  )
}
