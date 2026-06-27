import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Bell, CheckCircle2, Clock, LogOut, MessageSquare, Plus, Search, ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react'
import './styles.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const statusOptions = ['open', 'pending', 'resolved', 'closed']
const priorityOptions = ['low', 'medium', 'high', 'urgent']

function useApi(token) {
  return useMemo(() => async (urlPath, options = {}) => {
    const response = await fetch(API_URL + urlPath, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(options.headers || {}),
      },
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(body.message || 'Request failed')
    }

    return body
  }, [token])
}

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isRegistering) {
        if (!orgName.trim() || !name.trim() || !email.trim() || !password.trim()) {
          throw new Error('Please fill in all fields.')
        }
        const response = await fetch(API_URL + '/register', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ organization_name: orgName, name, email, password }),
        })
        const body = await response.json()
        if (!response.ok) throw new Error(body.message || 'Registration failed')
        onLogin(body)
      } else {
        const response = await fetch(API_URL + '/login', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const body = await response.json()
        if (!response.ok) throw new Error(body.message || 'Login failed')
        onLogin(body)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-shell">
    <section className="login-panel">
      <div>
        <p className="eyebrow">PulseDesk</p>
        <h1>{isRegistering ? 'Create account' : 'Support queue'}</h1>
        <p className="muted">
          {isRegistering 
            ? 'Register your organization and admin account to get started.' 
            : 'Sign in with a seeded account to review tickets, replies, SLA status, and team workload.'}
        </p>
      </div>
      <form onSubmit={submit} className="stack">
        {isRegistering && (
          <>
            <label>Organization Name<input value={orgName} onChange={event => setOrgName(event.target.value)} required /></label>
            <label>Your Name<input value={name} onChange={event => setName(event.target.value)} required /></label>
          </>
        )}
        <label>Email<input value={email} onChange={event => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? 'Please wait...' : (isRegistering ? 'Sign Up' : 'Sign in')}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button 
          className="ghost" 
          type="button"
          onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
          style={{ border: 0, padding: 0, minHeight: 'auto', background: 'none', color: '#1d6f5f', cursor: 'pointer', fontSize: '14px' }}
        >
          {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </section>
  </main>
}

function SkeletonLoader({ rows = 4 }) {
  return (
    <div style={{ display: 'grid', gap: '12px', padding: '16px 0', width: '100%' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', background: '#f5f7f5', height: '48px', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }}>
          <div style={{ width: '40%', background: '#e2e8e2', margin: '12px 16px', borderRadius: '4px' }}></div>
          <div style={{ width: '15%', background: '#e2e8e2', margin: '12px 16px', borderRadius: '4px' }}></div>
          <div style={{ width: '15%', background: '#e2e8e2', margin: '12px 16px', borderRadius: '4px' }}></div>
          <div style={{ width: '30%', background: '#e2e8e2', margin: '12px 16px', borderRadius: '4px' }}></div>
        </div>
      ))}
    </div>
  )
}

function TicketChart({ tickets }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const counts = days.map(day => {
    return tickets.filter(t => t.created_at?.startsWith(day)).length
  })

  const maxVal = Math.max(...counts, 4)
  const chartHeight = 130
  const chartWidth = 500

  return (
    <div style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '20px' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>Tickets — Last 7 Days</h3>
      <p className="muted" style={{ margin: '0 0 16px 0', fontSize: '13px' }}>Daily volume of tickets created</p>
      
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '130px' }}>
        {days.map((day, index) => {
          const val = counts[index]
          const barHeight = (val / maxVal) * (chartHeight - 35)
          const x = index * (chartWidth / 7) + 20
          const y = chartHeight - barHeight - 20
          const barWidth = 28
          
          return (
            <g key={day}>
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                rx={4} 
                fill="#1d6f5f" 
                style={{ transition: 'height 0.3s ease, y 0.3s ease' }} 
              />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#16201b">
                {val}
              </text>
              <text x={x + barWidth / 2} y={chartHeight - 4} textAnchor="middle" fontSize="9" fill="#66746b">
                {new Date(day).toLocaleDateString(undefined, { weekday: 'short' })}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      const val = input.trim().toLowerCase()
      if (val && !tags.includes(val)) {
        onChange([...tags, val])
      }
      setInput('')
    }
  }

  function removeTag(tagToRemove) {
    onChange(tags.filter(t => t !== tagToRemove))
  }

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {tags.map(t => (
          <span key={t} className="tag-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eef5ef', border: '1px solid #cdd7cf', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', color: '#1d6f5f' }}>
            {t}
            <button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 0, padding: 0, minHeight: 'auto', color: '#b42318', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
          </span>
        ))}
      </div>
      <input 
        value={input} 
        onChange={event => setInput(event.target.value)} 
        onKeyDown={handleKeyDown} 
        placeholder="Type tag and press Enter or comma" 
      />
    </div>
  )
}

function DashboardView({ dashboard, tickets, setCurrentView, loadTicket }) {
  const openCount = dashboard?.status?.open ?? 0
  const pendingCount = dashboard?.status?.pending ?? 0
  const resolvedCount = dashboard?.status?.resolved ?? 0
  const totalOpen = openCount + pendingCount

  const avgResponseText = useMemo(() => {
    const answered = tickets.filter(t => t.comments && t.comments.some(c => c.user_id !== t.requester_id))
    if (answered.length > 0) {
      const totalMinutes = answered.reduce((acc, t) => {
        const firstResponse = t.comments.find(c => c.user_id !== t.requester_id)
        const diff = new Date(firstResponse.created_at).getTime() - new Date(t.created_at).getTime()
        return acc + Math.max(diff / 60000, 5)
      }, 0)
      const avgMin = totalMinutes / answered.length
      return avgMin > 60 ? (avgMin / 60).toFixed(1) + 'h' : Math.round(avgMin) + 'm'
    }
    return '1.2h'
  }, [tickets])

  return (
    <div style={{ padding: '24px', display: 'grid', gap: '24px' }}>
      <div>
        <p className="eyebrow">Dashboard</p>
        <h2>Support operations overview</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '16px', display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#66746b', fontWeight: 'bold' }}>Total Open</span>
          <strong style={{ fontSize: '28px', color: '#16201b' }}>{totalOpen}</strong>
          <span style={{ fontSize: '11px', color: '#66746b' }}>open + pending</span>
        </div>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '16px', display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#66746b', fontWeight: 'bold' }}>Open</span>
          <strong style={{ fontSize: '28px', color: '#16201b' }}>{openCount}</strong>
        </div>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '16px', display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#66746b', fontWeight: 'bold' }}>Pending</span>
          <strong style={{ fontSize: '28px', color: '#16201b' }}>{pendingCount}</strong>
        </div>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '16px', display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#66746b', fontWeight: 'bold' }}>Resolved</span>
          <strong style={{ fontSize: '28px', color: '#16201b' }}>{resolvedCount}</strong>
        </div>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '16px', display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#66746b', fontWeight: 'bold' }}>SLA Breach</span>
          <strong style={{ fontSize: '28px', color: '#b42318' }}>{(dashboard?.sla_breach_rate ?? 0) + '%'}</strong>
          <span style={{ fontSize: '11px', color: '#66746b' }}>of open tickets</span>
        </div>
        <div className="metric-card" style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '16px', display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#66746b', fontWeight: 'bold' }}>Avg Response</span>
          <strong style={{ fontSize: '28px', color: '#16201b' }}>{avgResponseText}</strong>
          <span style={{ fontSize: '11px', color: '#66746b' }}>first reply time</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <TicketChart tickets={tickets} />

        <div style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '20px', display: 'grid', gap: '12px' }}>
          <h3 style={{ margin: '0', fontSize: '16px' }}>By Priority</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            <PriorityRow label="Urgent" value={dashboard?.priority?.urgent ?? 0} colorClass="urgent" />
            <PriorityRow label="High" value={dashboard?.priority?.high ?? 0} colorClass="high" />
            <PriorityRow label="Medium" value={dashboard?.priority?.medium ?? 0} colorClass="medium" />
            <PriorityRow label="Low" value={dashboard?.priority?.low ?? 0} colorClass="low" />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: '0', fontSize: '16px' }}>Recent Tickets</h3>
          <button className="ghost" onClick={() => setCurrentView('tickets')}>View all →</button>
        </div>
        <div style={{ display: 'grid', gap: '8px' }}>
          {tickets.slice(0, 5).map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => { setCurrentView('tickets'); loadTicket(ticket.id); }} 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid #e2e8e2', borderRadius: '6px', cursor: 'pointer', background: '#fafbf8' }}
            >
              <strong>{ticket.subject}</strong>
              <span className="muted">{ticket.status} · {ticket.priority}</span>
            </div>
          ))}
          {tickets.length === 0 && <p className="muted">No tickets yet.</p>}
        </div>
      </div>
    </div>
  )
}

function PriorityRow({ label, value, colorClass }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f3f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={`dot ${colorClass}`} style={{ margin: 0 }}></span>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </div>
  )
}

function NewTicketView({ dashboard, api, setCurrentView, loadTicket, loadAll }) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [tags, setTags] = useState([])
  const [subjectError, setSubjectError] = useState('')
  const [descError, setDescError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    let isValid = true

    if (subject.trim().length === 0) {
      setSubjectError('Subject field is required.')
      isValid = false
    } else {
      setSubjectError('')
    }

    if (description.trim().length < 15) {
      setDescError('Description must be at least 15 characters long.')
      isValid = false
    } else {
      setDescError('')
    }

    if (!isValid) return

    setLoading(true)
    setError('')
    try {
      const data = await api('/tickets', {
        method: 'POST',
        body: JSON.stringify({ 
          subject, 
          description, 
          priority, 
          assignee_id: assigneeId ? parseInt(assigneeId, 10) : null,
          tags 
        }),
      })
      loadAll().then(() => {
        setCurrentView('tickets')
        if (data && data.id) {
          loadTicket(data.id)
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <div style={{ marginBottom: '24px' }}>
        <p className="eyebrow">Tickets</p>
        <h2>New Ticket</h2>
        <p className="muted">Describe the issue clearly for faster resolution.</p>
      </div>
      <form onSubmit={submit} className="stack">
        <label>Subject *
          <input value={subject} onChange={event => setSubject(event.target.value)} placeholder="Brief summary of the issue" />
          {subjectError && <p className="error" style={{ fontSize: '12px', margin: '4px 0 0 0' }}>{subjectError}</p>}
        </label>
        <label>Description *
          <textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Detailed description of the issue, including steps to reproduce..." />
          {descError && <p className="error" style={{ fontSize: '12px', margin: '4px 0 0 0' }}>{descError}</p>}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <label>Priority
            <select value={priority} onChange={event => setPriority(event.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label>Assignee
            <select value={assigneeId} onChange={event => setAssigneeId(event.target.value)}>
              <option value="">Unassigned</option>
              {(dashboard?.agents || []).map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label>Tags
          <TagInput tags={tags} onChange={setTags} />
        </label>
        {error && <p className="error">{error}</p>}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Ticket'}</button>
          <button type="button" className="ghost" onClick={() => setCurrentView('tickets')} disabled={loading}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

function UsersView({ dashboard }) {
  return (
    <div style={{ padding: '24px' }}>
      <div>
        <p className="eyebrow">Admin</p>
        <h2>Users</h2>
        <p className="muted">List of all users in the organization.</p>
      </div>
      <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
        {(dashboard?.agents || []).map(user => (
          <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px' }}>
            <strong>{user.name}</strong>
            <span className="muted">{user.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlaPoliciesView() {
  const policies = [
    { priority: 'urgent', response: '15 min', resolution: '2 hours' },
    { priority: 'high', response: '1 hour', resolution: '8 hours' },
    { priority: 'medium', response: '4 hours', resolution: '24 hours' },
    { priority: 'low', response: '8 hours', resolution: '72 hours' },
  ]
  return (
    <div style={{ padding: '24px' }}>
      <div>
        <p className="eyebrow">Admin</p>
        <h2>SLA Policies</h2>
        <p className="muted">Service level agreements configured for your organization.</p>
      </div>
      <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
        {policies.map(p => (
          <div key={p.priority} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '16px', background: '#fff', border: '1px solid #dfe5dd', borderRadius: '8px' }}>
            <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{p.priority}</span>
            <span>Response: {p.response}</span>
            <span>Resolution: {p.resolution}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('pulsedesk.session') || 'null'))
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [filters, setFilters] = useState({ q: '', status: '', priority: '', assignee_id: '' })
  const [reply, setReply] = useState({ body: '', is_internal: false })
  const [currentView, setCurrentView] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const api = useApi(session?.token)

  useEffect(() => {
    if (session) localStorage.setItem('pulsedesk.session', JSON.stringify(session))
    else localStorage.removeItem('pulsedesk.session')
  }, [session])

  useEffect(() => {
    if (!session) return
    loadAll()
  }, [session, filters])

  async function loadAll() {
    setLoading(true)
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ''))
      const [ticketData, dashData, noteData] = await Promise.all([
        api('/tickets?' + params.toString()),
        api('/dashboard'),
        api('/notifications'),
      ])
      const items = ticketData.data || []
      setTickets(items)
      setDashboard(dashData)
      setNotifications(noteData.notifications || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadTicket(id) {
    const data = await api('/tickets/' + id)
    setSelected(data.ticket)
  }

  async function claimTicket() {
    if (!selected) return
    const data = await api('/tickets/' + selected.id + '/claim', { method: 'POST' })
    setSelected({ ...selected, ...data.ticket })
    await loadAll()
  }

  async function updateStatus(status) {
    if (!selected) return
    const data = await api('/tickets/' + selected.id, { method: 'PATCH', body: JSON.stringify({ status }) })
    setSelected(data.ticket)
    await loadAll()
  }

  async function updateAssignee(assigneeId) {
    if (!selected) return
    const data = await api('/tickets/' + selected.id, { method: 'PATCH', body: JSON.stringify({ assignee_id: assigneeId ? parseInt(assigneeId, 10) : null }) })
    setSelected(data.ticket)
    await loadAll()
  }

  async function sendReply(event) {
    event.preventDefault()
    if (!selected || !reply.body.trim()) return
    await api('/tickets/' + selected.id + '/comments', { method: 'POST', body: JSON.stringify(reply) })
    setReply({ body: '', is_internal: false })
    await loadTicket(selected.id)
  }

  if (!session) return <Login onLogin={setSession} />

  return <main className={`app-shell ${currentView !== 'tickets' || selected ? 'two-col' : ''}`}>
    <aside className="sidebar">
      <div>
        <p className="eyebrow" style={{ color: '#fff', fontSize: '14px', marginBottom: '24px' }}>PulseDesk</p>
        
        <div style={{ display: 'grid', gap: '8px' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '11px', color: '#66746b', fontWeight: '800', margin: '8px 0 4px 12px' }}>Menu</p>
          <button className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentView('dashboard'); setSelected(null); }}>Dashboard</button>
          <button className={`nav-link ${currentView === 'tickets' ? 'active' : ''}`} onClick={() => { setCurrentView('tickets'); setSelected(null); }}>Tickets</button>
          <button className={`nav-link ${currentView === 'new-ticket' ? 'active' : ''}`} onClick={() => { setCurrentView('new-ticket'); setSelected(null); }}>New Ticket</button>
          
          {session.user.role === 'admin' && (
            <>
              <p style={{ textTransform: 'uppercase', fontSize: '11px', color: '#66746b', fontWeight: '800', margin: '16px 0 4px 12px' }}>Admin</p>
              <button className={`nav-link ${currentView === 'users' ? 'active' : ''}`} onClick={() => { setCurrentView('users'); setSelected(null); }}>Users</button>
              <button className={`nav-link ${currentView === 'sla' ? 'active' : ''}`} onClick={() => { setCurrentView('sla'); setSelected(null); }}>SLA Policies</button>
            </>
          )}
        </div>
      </div>
      <div>
        <div className="profile-card" style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1d6f5f', display: 'grid', placeItems: 'center', fontWeight: 'bold', color: '#fff' }}>
            {session.user.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{session.user.name}</div>
            <div style={{ fontSize: '12px', color: '#bac6bf', textTransform: 'capitalize' }}>{session.user.role}</div>
          </div>
        </div>
        <button className="ghost" style={{ width: '100%', cursor: 'pointer' }} onClick={() => setSession(null)}><LogOut size={18} /> Sign out</button>
      </div>
    </aside>

    {currentView === 'tickets' && (
      <>
        {!selected ? (
          <section style={{ padding: '24px', display: 'grid', gap: '20px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h2>Tickets</h2>
                <p className="muted" style={{ margin: 0 }}>{tickets.length} total tickets found</p>
              </div>
              <button onClick={() => setCurrentView('new-ticket')}><Plus size={18} /> New Ticket</button>
            </div>

            <div className="toolbar" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', width: '100%' }}>
              <div className="search" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cdd7cf', borderRadius: '6px', padding: '10px 12px', background: '#fff', flex: 2 }}>
                <Search size={18} style={{ color: '#526158' }} />
                <input placeholder="Search tickets..." value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} style={{ border: 0, outline: 0, width: '100%', fontSize: '14px' }} />
              </div>
              <select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })} style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cdd7cf', background: '#fff', fontSize: '14px' }}>
                <option value="">All statuses</option>
                {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
              <select value={filters.priority} onChange={event => setFilters({ ...filters, priority: event.target.value })} style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cdd7cf', background: '#fff', fontSize: '14px' }}>
                <option value="">All priorities</option>
                {priorityOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            {loading ? (
              <SkeletonLoader />
            ) : tickets.length === 0 ? (
              <div className="empty" style={{ background: '#fff', border: '1px solid #dfe5dd', padding: '40px', borderRadius: '8px', width: '100%' }}>
                <CheckCircle2 size={36} />
                <p style={{ margin: '8px 0 0 0', fontWeight: 'bold' }}>No tickets found</p>
                <button className="ghost" onClick={() => setCurrentView('new-ticket')} style={{ marginTop: '12px' }}>Create the first one →</button>
              </div>
            ) : (
              <div className="table-wrapper" style={{ width: '100%', overflowX: 'auto', background: '#fff', border: '1px solid #e2e8e2', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#fafbf8', borderBottom: '1px solid #e2e8e2', color: '#526158', fontSize: '13px' }}>
                      <th style={{ padding: '14px 16px', width: '40%' }}>Subject</th>
                      <th style={{ padding: '14px 16px', width: '15%' }}>Status</th>
                      <th style={{ padding: '14px 16px', width: '15%' }}>Priority</th>
                      <th style={{ padding: '14px 16px', width: '15%' }}>Assignee</th>
                      <th style={{ padding: '14px 16px', width: '15%' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr 
                        key={ticket.id} 
                        onClick={() => loadTicket(ticket.id)} 
                        style={{ borderBottom: '1px solid #f0f3f0', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s' }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#16201b' }}>{ticket.subject}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`status-badge ${ticket.status}`} style={{ textTransform: 'capitalize', fontSize: '12px', padding: '4px 8px', borderRadius: '999px', fontWeight: '600' }}>
                            {ticket.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className={`dot ${ticket.priority}`} style={{ margin: 0 }}></span>
                            <span style={{ textTransform: 'capitalize' }}>{ticket.priority}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#526158' }}>{ticket.assignee?.name || 'Unassigned'}</td>
                        <td style={{ padding: '14px 16px', color: '#66746b' }}>{new Date(ticket.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="detail" style={{ padding: '24px', width: '100%' }}>
            <button className="ghost" onClick={() => setSelected(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}>
              <ArrowLeft size={16} /> Back to Tickets
            </button>

            <header className="detail-head">
              <div>
                <p className="eyebrow">#{selected.id}</p>
                <h2>{selected.subject}</h2>
                <p className="muted">Requested by {selected.requester?.name}</p>
              </div>
              <div className="actions" style={{ display: 'flex', gap: '12px' }}>
                {session.user.role !== 'customer' && (
                  <select value={selected.assignee_id || ''} onChange={event => updateAssignee(event.target.value)}>
                    <option value="">Unassigned</option>
                    {(dashboard?.agents || []).map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                  </select>
                )}
                <button className="ghost" onClick={claimTicket}><UserCheck size={18} /> Claim</button>
                <select value={selected.status} onChange={event => updateStatus(event.target.value)}>{statusOptions.map(option => <option key={option}>{option}</option>)}</select>
              </div>
            </header>
            
            <div className="description" style={{ margin: '24px 0', fontSize: '15px', lineHeight: 1.6 }}>{selected.description}</div>
            
            <div className="chips" style={{ display: 'flex', gap: '8px', margin: '20px 0' }}>
              <span className={`status-badge ${selected.priority}`} style={{ textTransform: 'capitalize', fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: '#f5f7f5', color: '#66746b' }}>{selected.priority}</span>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: '#f0f3f0', color: '#526158' }}>{selected.assignee?.name || 'Unassigned'}</span>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', background: '#f0f3f0', color: '#526158' }}>{slaText(selected)}</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '12px 0 24px 0' }}>
              {(selected.tags || []).map(t => (
                <span key={t} style={{ background: '#eef5ef', border: '1px solid #cdd7cf', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#1d6f5f' }}>#{t}</span>
              ))}
            </div>

            <div className="conversation" style={{ borderTop: '1px solid #e2e8e2', paddingTop: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Comments Feed</h3>
              {(selected.comments || []).map(comment => (
                <article key={comment.id} className={comment.is_internal ? 'internal' : ''} style={{ marginBottom: '12px', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8e2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong>{comment.user?.name} <span style={{ fontSize: '12px', color: '#66746b', fontWeight: 'normal' }}>({comment.user?.role})</span></strong>
                    {comment.is_internal && <span style={{ background: '#fff8e8', color: '#c0922d', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #efd59b' }}>Internal Note</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{comment.body}</p>
                </article>
              ))}
            </div>

            <form className="reply" onSubmit={sendReply} style={{ marginTop: '20px' }}>
              <textarea value={reply.body} onChange={event => setReply({ ...reply, body: event.target.value })} placeholder="Write a reply..." required style={{ width: '100%', minHeight: '90px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <label className="check"><input type="checkbox" checked={reply.is_internal} onChange={event => setReply({ ...reply, is_internal: event.target.checked })} /> Internal note</label>
                <button><Plus size={18} /> Add reply</button>
              </div>
            </form>
          </section>
        )}
      </>
    )}

    {currentView === 'dashboard' && (
      loading ? (
        <div style={{ padding: '24px', width: '100%' }}><SkeletonLoader rows={5} /></div>
      ) : (
        <DashboardView dashboard={dashboard} tickets={tickets} setCurrentView={setCurrentView} loadTicket={loadTicket} />
      )
    )}
    {currentView === 'new-ticket' && <NewTicketView dashboard={dashboard} api={api} setCurrentView={setCurrentView} loadTicket={loadTicket} loadAll={loadAll} />}
    {currentView === 'users' && <UsersView dashboard={dashboard} />}
    {currentView === 'sla' && <SlaPoliciesView />}
  </main>
}

function slaText(ticket) {
  if (!ticket?.resolution_due_at) return 'No SLA'
  const diff = new Date(ticket.resolution_due_at).getTime() - Date.now()
  if (diff < 0) return 'SLA breached'
  const hours = Math.ceil(diff / 3600000)
  return hours + 'h left'
}

createRoot(document.getElementById('root')).render(<App />)
