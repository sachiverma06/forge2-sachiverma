import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Bell, CheckCircle2, Clock, LogOut, MessageSquare, Plus, Search, ShieldCheck, UserCheck } from 'lucide-react'
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
  const [email, setEmail] = useState('admin@acme.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(API_URL + '/login', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'Login failed')
      onLogin(body)
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
        <h1>Support queue</h1>
        <p className="muted">Sign in with a seeded account to review tickets, replies, SLA status, and team workload.</p>
      </div>
      <form onSubmit={submit} className="stack">
        <label>Email<input value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? 'Signing in' : 'Sign in'}</button>
      </form>
    </section>
  </main>
}

function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('pulsedesk.session') || 'null'))
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [filters, setFilters] = useState({ q: '', status: '', priority: '', assignee_id: '' })
  const [reply, setReply] = useState({ body: '', is_internal: false })
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
    if (!selected && items.length > 0) loadTicket(items[0].id)
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

  async function sendReply(event) {
    event.preventDefault()
    if (!selected || !reply.body.trim()) return
    await api('/tickets/' + selected.id + '/comments', { method: 'POST', body: JSON.stringify(reply) })
    setReply({ body: '', is_internal: false })
    await loadTicket(selected.id)
  }

  if (!session) return <Login onLogin={setSession} />

  return <main className="app-shell">
    <aside className="sidebar">
      <div>
        <p className="eyebrow">PulseDesk</p>
        <h1>Tickets</h1>
        <p className="muted">{session.user.organization?.name || 'Organization'} · {session.user.role}</p>
      </div>
      <nav className="metrics">
        <Metric icon={<MessageSquare />} label="Open" value={dashboard?.open_total ?? 0} />
        <Metric icon={<ShieldCheck />} label="SLA breach" value={(dashboard?.sla_breach_rate ?? 0) + '%'} />
        <Metric icon={<Bell />} label="Unread" value={notifications.filter(item => !item.read_at).length} />
      </nav>
      <button className="ghost" onClick={() => setSession(null)}><LogOut size={18} /> Sign out</button>
    </aside>

    <section className="ticket-list">
      <div className="toolbar">
        <div className="search"><Search size={17} /><input placeholder="Search tickets" value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} /></div>
        <select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}>
          <option value="">Status</option>
          {statusOptions.map(option => <option key={option}>{option}</option>)}
        </select>
        <select value={filters.priority} onChange={event => setFilters({ ...filters, priority: event.target.value })}>
          <option value="">Priority</option>
          {priorityOptions.map(option => <option key={option}>{option}</option>)}
        </select>
      </div>
      <div className="rows">
        {tickets.map(ticket => <button className={'ticket-row ' + (selected?.id === ticket.id ? 'active' : '')} key={ticket.id} onClick={() => loadTicket(ticket.id)}>
          <span className={'dot ' + ticket.priority}></span>
          <span>
            <strong>{ticket.subject}</strong>
            <small>{ticket.status} · {ticket.priority} · {ticket.assignee?.name || 'Unassigned'}</small>
          </span>
          {new Date(ticket.resolution_due_at) < new Date() && ticket.status !== 'closed' && <Clock className="breach" size={17} />}
        </button>)}
      </div>
    </section>

    <section className="detail">
      {selected ? <>
        <header className="detail-head">
          <div>
            <p className="eyebrow">#{selected.id}</p>
            <h2>{selected.subject}</h2>
            <p className="muted">Requested by {selected.requester?.name}</p>
          </div>
          <div className="actions">
            <button className="ghost" onClick={claimTicket}><UserCheck size={18} /> Claim</button>
            <select value={selected.status} onChange={event => updateStatus(event.target.value)}>{statusOptions.map(option => <option key={option}>{option}</option>)}</select>
          </div>
        </header>
        <div className="description">{selected.description}</div>
        <div className="chips">
          <span>{selected.priority}</span>
          <span>{selected.assignee?.name || 'Unassigned'}</span>
          <span>{slaText(selected)}</span>
        </div>
        <div className="conversation">
          {(selected.comments || []).map(comment => <article key={comment.id} className={comment.is_internal ? 'internal' : ''}>
            <strong>{comment.user?.name}</strong>
            <p>{comment.body}</p>
          </article>)}
        </div>
        <form className="reply" onSubmit={sendReply}>
          <textarea value={reply.body} onChange={event => setReply({ ...reply, body: event.target.value })} placeholder="Write a reply" />
          <label className="check"><input type="checkbox" checked={reply.is_internal} onChange={event => setReply({ ...reply, is_internal: event.target.checked })} /> Internal note</label>
          <button><Plus size={18} /> Add reply</button>
        </form>
      </> : <div className="empty"><CheckCircle2 /> Select a ticket</div>}
    </section>
  </main>
}

function Metric({ icon, label, value }) {
  return <div className="metric">{icon}<span>{label}</span><strong>{value}</strong></div>
}

function slaText(ticket) {
  if (!ticket?.resolution_due_at) return 'No SLA'
  const diff = new Date(ticket.resolution_due_at).getTime() - Date.now()
  if (diff < 0) return 'SLA breached'
  const hours = Math.ceil(diff / 3600000)
  return hours + 'h left'
}

createRoot(document.getElementById('root')).render(<App />)
