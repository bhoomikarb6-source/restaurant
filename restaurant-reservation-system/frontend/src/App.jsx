import React from 'react';
import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { Utensils, CalendarDays, Users, LogOut, LayoutDashboard, Plus, Trash2, Pencil, CheckCircle, XCircle } from 'lucide-react';
import api from './api';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rr_user')); } catch { return null; }
  });
  const navigate = useNavigate();
  function login(data) {
    localStorage.setItem('rr_token', data.token);
    localStorage.setItem('rr_user', JSON.stringify(data.user));
    setUser(data.user);
    navigate(data.user.role === 'admin' ? '/admin' : '/');
  }
  function logout() {
    localStorage.removeItem('rr_token'); localStorage.removeItem('rr_user');
    setUser(null); navigate('/');
  }
  return <div className="app-shell">
    <header className="navbar">
      <Link to="/" className="brand"><span className="brand-icon"><Utensils size={21}/></span><span>Table <i>&</i> Thyme</span></Link>
      <nav>
        <Link to="/">Home</Link>
        {user?.role === 'customer' && <><Link to="/book">Book a Table</Link><Link to="/my-reservations">My Reservations</Link></>}
        {user?.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
      </nav>
      <div className="nav-right">
        {user ? <><span className="welcome">Hi, {user.name}</span><button className="btn btn-outline btn-small" onClick={logout}><LogOut size={15}/> Logout</button></>
          : <><Link className="nav-login" to="/login">Login</Link><Link className="btn btn-primary btn-small" to="/register">Sign Up</Link></>}
      </div>
    </header>
    <main>
      <Routes>
        <Route path="/" element={<Home user={user}/>} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'}/> : <AuthPage mode="login" onAuth={login}/>} />
        <Route path="/register" element={user ? <Navigate to="/"/> : <AuthPage mode="register" onAuth={login}/>} />
        <Route path="/book" element={<Protected user={user}><BookingPage/></Protected>} />
        <Route path="/my-reservations" element={<Protected user={user}><MyReservations/></Protected>} />
        <Route path="/admin" element={<Protected user={user} admin><AdminDashboard/></Protected>} />
        <Route path="*" element={<Home user={user}/>} />
      </Routes>
    </main>
    <footer>© 2026 Table & Thyme · Fresh food, memorable moments.</footer>
  </div>;
}

function Protected({ user, admin=false, children }) {
  if (!user) return <Navigate to="/login"/>;
  if (admin && user.role !== 'admin') return <Navigate to="/"/>;
  if (!admin && user.role !== 'customer') return <Navigate to="/admin"/>;
  return children;
}

function Home({ user }) {
  return <><section className="hero">
    <div className="hero-copy"><span className="eyebrow">A TABLE IS WAITING FOR YOU</span>
      <h1>Good food.<br/><em>Great company.</em></h1>
      <p>Make time for the moments that matter. Reserve your favourite table and let us take care of the rest.</p>
      <div className="hero-actions"><Link className="btn btn-primary" to={user?.role === 'customer' ? '/book' : '/register'}>Reserve a Table <CalendarDays size={17}/></Link><a className="text-link" href="#about">Discover our story →</a></div>
    </div>
    <div className="hero-art"><div className="hero-photo"><div className="photo-label"><span>MADE WITH LOVE</span><strong>Gather around.</strong></div></div><div className="round-stamp">GOOD<br/>FOOD<br/>GOOD<br/>MOOD</div></div>
  </section>
  <section className="features" id="about">
    <div><span className="feature-number">01</span><h3>Choose your table</h3><p>Find the right spot for a cosy dinner or a family gathering.</p></div>
    <div><span className="feature-number">02</span><h3>Pick your moment</h3><p>Select the date, time and guest count that work for you.</p></div>
    <div><span className="feature-number">03</span><h3>Enjoy the evening</h3><p>Your reservation details are always available in your account.</p></div>
  </section></>;
}

function AuthPage({ mode, onAuth }) {
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      onAuth(data);
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong. Is the backend running?'); }
    finally { setBusy(false); }
  }
  return <section className="auth-wrap"><div className="auth-card">
    <span className="eyebrow">{isRegister ? 'JOIN OUR TABLE' : 'WELCOME BACK'}</span>
    <h2>{isRegister ? 'Create your account' : 'Sign in'}</h2>
    <p className="muted">{isRegister ? 'A lovely dining experience starts here.' : 'Log in to manage your restaurant reservations.'}</p>
    <form onSubmit={submit}>
      {isRegister && <Field label="Full name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></Field>}
      <Field label="Email address"><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></Field>
      <Field label="Password"><input type="password" minLength="6" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 6 characters"/></Field>
      {error && <p className="alert error">{error}</p>}
      <button className="btn btn-primary full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create Account' : 'Login'}</button>
    </form>
    <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Table & Thyme?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Create an account'}</Link></p>
    {!isRegister && <p className="demo-hint">Admin demo: admin@restaurant.com / Admin@123</p>}
  </div></section>;
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }

function BookingPage() {
  const [tables,setTables] = useState([]); const [form,setForm] = useState({table_id:'',reservation_date:'',reservation_time:'19:00',guests:2,special_request:''});
  const [message,setMessage] = useState(''); const [error,setError] = useState('');
  useEffect(()=>{ api.get('/tables').then(r=>setTables(r.data)).catch(()=>setError('Could not load tables.')); },[]);
  const selected = tables.find(t=>String(t.id)===String(form.table_id));
  async function submit(e) {
    e.preventDefault(); setMessage(''); setError('');
    try { await api.post('/reservations',form); setMessage('Your reservation request has been submitted!'); setForm({...form,table_id:'',special_request:''}); }
    catch(err) { setError(err.response?.data?.message || 'Could not create reservation.'); }
  }
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">MAKE IT A DATE</span><h2>Reserve your table</h2><p>Choose your preferred date, time and table.</p></div>
    <div className="form-card"><form onSubmit={submit}>
      <div className="form-grid">
        <Field label="Reservation date"><input type="date" min={new Date().toLocaleDateString('en-CA')} required value={form.reservation_date} onChange={e=>setForm({...form,reservation_date:e.target.value})}/></Field>
        <Field label="Reservation time"><select value={form.reservation_time} onChange={e=>setForm({...form,reservation_time:e.target.value})}>{['11:00','12:00','13:00','14:00','17:00','18:00','19:00','20:00','21:00','21:30'].map(t=><option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="Number of guests"><input type="number" min="1" max="20" required value={form.guests} onChange={e=>setForm({...form,guests:e.target.value})}/></Field>
        <Field label="Select a table"><select required value={form.table_id} onChange={e=>setForm({...form,table_id:e.target.value})}><option value="">Choose a table</option>{tables.map(t=><option key={t.id} value={t.id}>{t.table_number} · Up to {t.capacity} guests · {t.location}</option>)}</select></Field>
      </div>
      {selected && <p className="selected-note">Selected: <strong>{selected.table_number}</strong> · {selected.capacity} seats · {selected.location}. Availability is checked when you submit.</p>}
      <Field label="Special request (optional)"><textarea rows="3" maxLength="500" value={form.special_request} onChange={e=>setForm({...form,special_request:e.target.value})} placeholder="Birthday, dietary request, seating preference…"/></Field>
      {message && <p className="alert success">{message}</p>}{error && <p className="alert error">{error}</p>}
      <button className="btn btn-primary">Submit Reservation <CalendarDays size={17}/></button>
    </form></div></section>;
}

function MyReservations() {
  const [rows,setRows] = useState([]); const [error,setError] = useState(''); const [editing,setEditing] = useState(null); const [tables,setTables] = useState([]);
  async function load() { try { const [r,t] = await Promise.all([api.get('/reservations/mine'),api.get('/tables')]); setRows(r.data); setTables(t.data); } catch { setError('Could not load reservations.'); } }
  useEffect(()=>{load();},[]);
  async function cancel(id) { if(!confirm('Cancel this reservation?')) return; try { await api.patch(`/reservations/${id}/cancel`); load(); } catch(e) { setError(e.response?.data?.message || 'Could not cancel.'); } }
  async function save(e) {
    e.preventDefault();
    try { await api.put(`/reservations/${editing.id}`,editing); setEditing(null); load(); }
    catch(e) { setError(e.response?.data?.message || 'Could not update reservation.'); }
  }
  return <section className="page-wrap"><div className="page-heading"><span className="eyebrow">YOUR UPCOMING MOMENTS</span><h2>My reservations</h2><p>View and manage your table bookings.</p></div>
    {error && <p className="alert error">{error}</p>}
    {editing && <div className="form-card edit-card"><h3>Edit reservation #{editing.id}</h3><form onSubmit={save}><div className="form-grid">
      <Field label="Date"><input type="date" required value={editing.reservation_date?.slice(0,10)} onChange={e=>setEditing({...editing,reservation_date:e.target.value})}/></Field>
      <Field label="Time"><input type="time" required value={String(editing.reservation_time).slice(0,5)} onChange={e=>setEditing({...editing,reservation_time:e.target.value})}/></Field>
      <Field label="Guests"><input type="number" min="1" required value={editing.guests} onChange={e=>setEditing({...editing,guests:e.target.value})}/></Field>
      <Field label="Table"><select value={editing.table_id} onChange={e=>setEditing({...editing,table_id:e.target.value})}>{tables.map(t=><option key={t.id} value={t.id}>{t.table_number} (capacity {t.capacity})</option>)}</select></Field>
    </div><Field label="Special request"><textarea rows="2" value={editing.special_request || ''} onChange={e=>setEditing({...editing,special_request:e.target.value})}/></Field>
      <div className="inline-actions"><button className="btn btn-primary">Save changes</button><button type="button" className="btn btn-outline" onClick={()=>setEditing(null)}>Close</button></div></form></div>}
    <div className="table-card"><div className="table-scroll"><table><thead><tr><th>Booking</th><th>Date & time</th><th>Table</th><th>Guests</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id}><td>#{r.id}</td><td>{String(r.reservation_date).slice(0,10)}<small>{String(r.reservation_time).slice(0,5)}</small></td><td>{r.table_number}<small>{r.location}</small></td><td>{r.guests}</td><td><Status value={r.status}/></td><td><div className="inline-actions">{['Pending','Confirmed'].includes(r.status) && <><button className="icon-btn" title="Edit" onClick={()=>setEditing({...r,table_id:String(r.table_id)})}><Pencil size={16}/></button><button className="icon-btn danger-text" title="Cancel" onClick={()=>cancel(r.id)}><Trash2 size={16}/></button></>}</div></td></tr>)}
      {!rows.length && <tr><td colSpan="6" className="empty">No reservations yet. <Link to="/book">Book your first table.</Link></td></tr>}
    </tbody></table></div></div>
  </section>;
}

function Status({value}) { return <span className={`status ${value.toLowerCase()}`}>{value}</span>; }

function AdminDashboard() {
  const [rows,setRows]=useState([]); const [customers,setCustomers]=useState([]); const [tables,setTables]=useState([]);
  const [tab,setTab]=useState('reservations'); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const [newTable,setNewTable]=useState({table_number:'',capacity:2,location:'Main Hall'});
  async function load() {
    try { const [r,c,t]=await Promise.all([api.get('/reservations/admin/all'),api.get('/reservations/admin/customers'),api.get('/tables')]); setRows(r.data);setCustomers(c.data);setTables(t.data); }
    catch(e){setError(e.response?.data?.message || 'Could not load admin data.');}
  }
  useEffect(()=>{load();},[]);
  async function changeStatus(id,status) {
    setError('');setNotice('');
    try { await api.patch(`/reservations/${id}/status`,{status});setNotice(`Reservation ${status.toLowerCase()}.`);load(); }
    catch(e){setError(e.response?.data?.message || 'Could not update status.');}
  }
  async function addTable(e) {
    e.preventDefault();setError('');setNotice('');
    try { await api.post('/tables',newTable);setNewTable({table_number:'',capacity:2,location:'Main Hall'});setNotice('Table added.');load(); }
    catch(e){setError(e.response?.data?.message || 'Could not add table.');}
  }
  async function deleteTable(id) {
    if(!confirm('Delete this table?')) return;
    try { await api.delete(`/tables/${id}`);setNotice('Table deleted.');load(); }
    catch(e){setError(e.response?.data?.message || 'Could not delete table.');}
  }
  const pending=rows.filter(r=>r.status==='Pending').length;
  return <section className="page-wrap admin-wrap"><div className="page-heading"><span className="eyebrow">RESTAURANT CONTROL ROOM</span><h2>Admin dashboard</h2><p>Manage reservations, customers and restaurant tables.</p></div>
    <div className="stats-grid"><Stat icon={<CalendarDays/>} label="Total reservations" value={rows.length}/><Stat icon={<CheckCircle/>} label="Confirmed" value={rows.filter(r=>r.status==='Confirmed').length}/><Stat icon={<Users/>} label="Customers" value={customers.length}/><Stat icon={<LayoutDashboard/>} label="Awaiting action" value={pending}/></div>
    {notice && <p className="alert success">{notice}</p>}{error && <p className="alert error">{error}</p>}
    <div className="tabs"><button className={tab==='reservations'?'active':''} onClick={()=>setTab('reservations')}>Reservations</button><button className={tab==='tables'?'active':''} onClick={()=>setTab('tables')}>Manage Tables</button><button className={tab==='customers'?'active':''} onClick={()=>setTab('customers')}>Customers</button></div>
    {tab==='reservations' && <div className="table-card"><div className="section-title"><h3>All reservations</h3><span>{rows.length} bookings</span></div><div className="table-scroll"><table><thead><tr><th>Customer</th><th>Date & time</th><th>Table</th><th>Guests</th><th>Status</th><th>Manage</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id}><td>{r.customer_name}<small>{r.email}</small></td><td>{String(r.reservation_date).slice(0,10)}<small>{String(r.reservation_time).slice(0,5)}</small></td><td>{r.table_number}</td><td>{r.guests}</td><td><Status value={r.status}/></td><td><div className="inline-actions">{r.status==='Pending' && <><button className="icon-btn green-text" title="Confirm" onClick={()=>changeStatus(r.id,'Confirmed')}><CheckCircle size={17}/></button><button className="icon-btn danger-text" title="Reject" onClick={()=>changeStatus(r.id,'Rejected')}><XCircle size={17}/></button></>}{r.status==='Confirmed' && <button className="btn btn-outline btn-small" onClick={()=>changeStatus(r.id,'Cancelled')}>Cancel</button>}</div></td></tr>)}
      {!rows.length && <tr><td colSpan="6" className="empty">No reservations found.</td></tr>}
    </tbody></table></div></div>}
    {tab==='tables' && <><div className="form-card"><h3><Plus size={18}/> Add restaurant table</h3><form onSubmit={addTable}><div className="form-grid three">
      <Field label="Table number"><input required placeholder="e.g. T7" value={newTable.table_number} onChange={e=>setNewTable({...newTable,table_number:e.target.value})}/></Field>
      <Field label="Seating capacity"><input type="number" min="1" max="30" required value={newTable.capacity} onChange={e=>setNewTable({...newTable,capacity:Number(e.target.value)})}/></Field>
      <Field label="Location"><input value={newTable.location} onChange={e=>setNewTable({...newTable,location:e.target.value})}/></Field>
      </div><button className="btn btn-primary"><Plus size={16}/> Add table</button></form></div>
      <div className="table-card"><div className="table-scroll"><table><thead><tr><th>Table</th><th>Capacity</th><th>Location</th><th>Action</th></tr></thead><tbody>{tables.map(t=><tr key={t.id}><td>{t.table_number}</td><td>{t.capacity} guests</td><td>{t.location}</td><td><button className="icon-btn danger-text" onClick={()=>deleteTable(t.id)} title="Delete table"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div></div></>}
    {tab==='customers' && <div className="table-card"><div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Reservations</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{String(c.created_at).slice(0,10)}</td><td>{c.total_reservations}</td></tr>)}{!customers.length && <tr><td colSpan="4" className="empty">No customers registered yet.</td></tr>}</tbody></table></div></div>}
  </section>;
}
function Stat({icon,label,value}) { return <div className="stat-card"><span className="stat-icon">{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>; }

export default App;
