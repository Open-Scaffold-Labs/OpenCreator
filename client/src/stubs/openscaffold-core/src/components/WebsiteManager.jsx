// Stub used when openscaffold-core is not present (standalone/cloud builds).
// The real WebsiteManager ships with the Open Scaffold ecosystem.
import React from 'react'

export default function WebsiteManager() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
      <p className="text-slate-300 font-medium">Website builder not available</p>
      <p className="text-slate-400 text-sm mt-2">
        This feature requires the Open Scaffold ecosystem (openscaffold-core),
        which isn't included in standalone or cloud deployments.
      </p>
    </div>
  )
}
