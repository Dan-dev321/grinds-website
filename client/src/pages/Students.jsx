import { useState } from 'react'
import StudentsOverview from './StudentsOverview'
import StudentsList     from './StudentsList'

const Students = () => {
  const [pageTab, setPageTab] = useState('overview')

  return (
    <div className="bg-gray-50">
      {/* Page Tabs */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur border-b border-gray-100 py-3 px-4">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm max-w-sm mx-auto">
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'students', label: '🎓 Students' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPageTab(key)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                pageTab === key ? 'bg-brand-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {pageTab === 'overview' ? <StudentsOverview /> : <StudentsList />}
    </div>
  )
}

export default Students