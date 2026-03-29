import React, { useState, useEffect } from 'react'
import { Plus, Loader, AlertCircle } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  'Equipment',
  'Software',
  'Freelancer',
  'Studio',
  'Travel',
  'Marketing',
  'Other'
]

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Equipment',
    description: ''
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setExpenses(await res.json())
      }
    } catch (err) {
      setError('Failed to load expenses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('oc_token')
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description
        })
      })

      if (res.ok) {
        setFormData({ amount: '', category: 'Equipment', description: '' })
        setShowForm(false)
        fetchExpenses()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-2 text-red-600" size={32} />
          <p className="text-slate-400">Loading expenses...</p>
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
          <h1 className="text-3xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 mt-1">Track your spending and business costs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <p className="text-slate-400 text-sm font-medium mb-2">Total Expenses</p>
        <p className="text-4xl font-bold text-red-400">${totalExpenses.toFixed(2)}</p>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Expense</h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-red-600 focus:outline-none"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-600 focus:outline-none"
                />
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
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {expenses && expenses.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Description</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-200">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {expenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-200">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{item.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-red-400 text-right font-medium">
                    ${item.amount?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">No expenses recorded yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
