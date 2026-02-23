import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Database, Server, Play, Plus, Save, Trash2, RefreshCw } from 'lucide-react'

// Tauri 2 import check - uses modern import syntax

type DbType = 'mysql' | 'postgres' | 'sqlite'

interface Connection {
  id: string
  name: string
  type: DbType
  host: string
  port: number
  user: string
  database: string
}

interface QueryResult {
  columns: string[]
  rows: any[]
}

function App() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeConn, setActiveConn] = useState<Connection | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const [newConn, setNewConn] = useState<Partial<Connection>>({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    user: 'root',
  })

  const testConnection = async () => {
    if (!activeConn) return
    setConnecting(true)
    try {
      if (activeConn.type === 'mysql') {
        await invoke('connect_mysql', {
          host: activeConn.host,
          port: activeConn.port,
          user: activeConn.user,
          password: '',
          database: activeConn.database
        })
      } else if (activeConn.type === 'postgres') {
        await invoke('connect_postgres', {
          host: activeConn.host,
          port: activeConn.port,
          user: activeConn.user,
          password: '',
          database: activeConn.database
        })
      } else if (activeConn.type === 'sqlite') {
        await invoke('connect_sqlite', {
          path: activeConn.host
        })
      }
      alert('Connected!')
    } catch (e) {
      alert(`Failed: ${e}`)
    }
    setConnecting(false)
  }

  const executeQuery = async () => {
    if (!query.trim()) return
    try {
      const result = await invoke('query_mysql', { query })
      // 解析结果
      const rows = result as any[]
      if (rows.length > 0) {
        setResults({
          columns: Object.keys(rows[0]),
          rows: rows.map(r => Object.values(r))
        })
      }
    } catch (e) {
      alert(`Query failed: ${e}`)
    }
  }

  const addConnection = () => {
    const id = Date.now().toString()
    const conn: Connection = {
      id,
      name: newConn.name || `${newConn.type}://${newConn.host}`,
      type: newConn.type as DbType,
      host: newConn.host || 'localhost',
      port: newConn.port || (newConn.type === 'mysql' ? 3306 : 5432),
      user: newConn.user || 'root',
      database: newConn.database || ''
    }
    setConnections([...connections, conn])
    setShowAddModal(false)
    setNewConn({ type: 'mysql', host: 'localhost', port: 3306, user: 'root' })
  }

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Database className="text-blue-400" />
            DB Pilot
          </h1>
        </div>

        <div className="p-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            <Plus size={16} /> New Connection
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {connections.map(conn => (
            <div
              key={conn.id}
              onClick={() => setActiveConn(conn)}
              className={`p-3 rounded-lg cursor-pointer mb-1 flex items-center gap-2 ${
                activeConn?.id === conn.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Server size={16} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{conn.name}</div>
                <div className="text-xs text-gray-400">{conn.type}://{conn.host}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4">
          {activeConn && (
            <>
              <button
                onClick={testConnection}
                disabled={connecting}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                <RefreshCw size={14} className={connecting ? 'animate-spin' : ''} />
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
              <span className="text-gray-400 text-sm">
                {activeConn.type}://{activeConn.host}:{activeConn.port}
              </span>
            </>
          )}
        </div>

        {/* Query Editor */}
        <div className="h-1/3 border-b border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
            <span className="text-sm text-gray-400">SQL Query</span>
            <button
              onClick={executeQuery}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Play size={14} /> Run
            </button>
          </div>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="SELECT * FROM users WHERE..."
            className="flex-1 bg-gray-900 p-4 font-mono text-sm resize-none focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto bg-gray-900 p-4">
          {results ? (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {results.columns.map(col => (
                    <th key={col} className="border border-gray-700 px-3 py-2 bg-gray-800 text-left text-sm">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.rows.slice(0, 100).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-800">
                    {row.map((cell: any, j: number) => (
                      <td key={j} className="border border-gray-700 px-3 py-2 text-sm">
                        {cell?.toString() || 'NULL'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              Run a query to see results
            </div>
          )}
        </div>
      </div>

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">New Connection</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newConn.name || ''}
                  onChange={e => setNewConn({ ...newConn, name: e.target.value })}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                  placeholder="My Database"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newConn.type}
                  onChange={e => setNewConn({ ...newConn, type: e.target.value as DbType })}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>

              {newConn.type !== 'sqlite' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Host</label>
                    <input
                      type="text"
                      value={newConn.host}
                      onChange={e => setNewConn({ ...newConn, host: e.target.value })}
                      className="w-full bg-gray-700 rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-1">Port</label>
                      <input
                        type="number"
                        value={newConn.port}
                        onChange={e => setNewConn({ ...newConn, port: parseInt(e.target.value) })}
                        className="w-full bg-gray-700 rounded px-3 py-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-1">User</label>
                      <input
                        type="text"
                        value={newConn.user}
                        onChange={e => setNewConn({ ...newConn, user: e.target.value })}
                        className="w-full bg-gray-700 rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Database</label>
                    <input
                      type="text"
                      value={newConn.database || ''}
                      onChange={e => setNewConn({ ...newConn, database: e.target.value })}
                      className="w-full bg-gray-700 rounded px-3 py-2"
                    />
                  </div>
                </>
              )}

              {newConn.type === 'sqlite' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Database File Path</label>
                  <input
                    type="text"
                    value={newConn.host}
                    onChange={e => setNewConn({ ...newConn, host: e.target.value })}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="/path/to/database.db"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={addConnection}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App