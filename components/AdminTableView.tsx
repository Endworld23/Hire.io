'use client';

import { useState } from 'react';

type TableName = 'employers' | 'candidates' | 'jobs' | 'matches' | 'feedback';

interface AdminTableViewProps {
  data: Record<TableName, any[]>;
}

export default function AdminTableView({ data }: AdminTableViewProps) {
  const [activeTable, setActiveTable] = useState<TableName>('employers');

  const tables: { name: TableName; label: string; icon: string }[] = [
    { name: 'employers', label: 'Employers', icon: '🏢' },
    { name: 'candidates', label: 'Candidates', icon: '👤' },
    { name: 'jobs', label: 'Jobs', icon: '💼' },
    { name: 'matches', label: 'Matches', icon: '🤝' },
    { name: 'feedback', label: 'Feedback', icon: '💬' },
  ];

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ') || '[]';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 50) return value.substring(0, 47) + '...';
    return String(value);
  };

  const currentData = data[activeTable] || [];
  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Total Records: {currentData.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 p-1">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => setActiveTable(table.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTable === table.name
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{table.icon}</span>
                <span>{table.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTable === table.name
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}>
                  {data[table.name]?.length || 0}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {currentData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">{tables.find(t => t.name === activeTable)?.icon}</div>
              <h3 className="text-lg font-medium text-gray-900">No {activeTable} found</h3>
              <p className="text-sm text-gray-500 mt-1">
                Data will appear here once records are created
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                        >
                          {formatValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start space-x-3">
          <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin View</p>
            <p className="text-xs text-gray-600 mt-1">
              This view shows all data in the system for administrative purposes. In production, access should be restricted to authorized users only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
