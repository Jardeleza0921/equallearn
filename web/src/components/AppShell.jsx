import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, BookOpen, Check, ChevronDown, ClipboardCheck, GraduationCap, Home, LogOut,
  Menu, Paintbrush, Search, Settings, UserRound, Users, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import ProfileAvatar from './ProfileAvatar';
import { useAuth } from '../context/AuthContext';
import { formatWhen, getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/data';

const navByRole = {
  student: [
    ['Home', Home, ''], ['Learning', BookOpen, 'learning'], ['Quizzes', ClipboardCheck, 'quizzes'],
    ['Progress', BarChart3, 'progress'], ['Profile', UserRound, 'profile'], ['Settings', Settings, 'settings'],
  ],
  teacher: [
    ['Dashboard', Home, ''], ['Learning Content', BookOpen, 'learning-content'], ['Students', Users, 'students'],
    ['Quiz Builder', ClipboardCheck, 'quizzes'], ['Analytics', BarChart3, 'analytics'], ['Profile', UserRound, 'profile'],
    ['Settings', Settings, 'settings'],
  ],
  admin: [
    ['Dashboard', Home, ''], ['Students', Users, 'users'], ['Teachers', GraduationCap, 'teachers'],
    ['Designations', BookOpen, 'classes'], ['Reports', BarChart3, 'reports'], ['Design', Paintbrush, 'design'],
    ['Settings', Settings, 'settings'],
  ],
};



export default function AppShell({ role, children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('equallearn-sidebar-collapsed') === '1'; } catch { return false; }
  });
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [notifications,setNotifications]=useState([]);
  const [notificationsLoading,setNotificationsLoading]=useState(false);
  const panelRef=useRef(null);
  const nav = navByRole[role];
  const root = `/${role}`;
  const navigate = useNavigate();
  const { profile, firebaseUser, logout: firebaseLogout } = useAuth();

  useEffect(()=>{
    try { localStorage.setItem('equallearn-sidebar-collapsed', collapsed ? '1' : '0'); } catch {}
  },[collapsed]);
  useEffect(()=>{
    const onDoc=e=>{if(panelRef.current&&!panelRef.current.contains(e.target)){setNotificationsOpen(false);setProfileOpen(false)}};
    document.addEventListener('mousedown',onDoc);return()=>document.removeEventListener('mousedown',onDoc);
  },[]);

  const logout = async () => {
    if (!window.confirm('Logout of EqualLearn?')) return;
    await firebaseLogout(); navigate('/login', { replace: true });
  };
  const name=profile?.fullname||profile?.email||'EqualLearn user';
  useEffect(()=>{
    let alive=true;
    if(!firebaseUser?.uid){ setNotifications([]); return ()=>{alive=false}; }
    setNotificationsLoading(true);
    getNotifications(firebaseUser.uid).then(rows=>{ if(alive) setNotifications(rows); }).catch(error=>console.warn('Notifications unavailable:',error)).finally(()=>alive&&setNotificationsLoading(false));
    return()=>{alive=false};
  },[firebaseUser?.uid]);
  const unreadCount=notifications.filter(item=>item.read===false).length;
  const openNotification=async item=>{
    if(item.read===false){
      setNotifications(list=>list.map(x=>x.id===item.id?{...x,read:true}:x));
      try{await markNotificationRead(item.id)}catch(error){console.warn('Unable to mark notification read:',error)}
    }
  };
  const clearUnread=async()=>{
    setNotifications(list=>list.map(x=>({...x,read:true})));
    try{await markAllNotificationsRead(firebaseUser.uid)}catch(error){console.warn('Unable to mark notifications read:',error)}
  };

  return <div className={`workspace ${collapsed ? 'is-collapsed' : ''}`}>
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-head">
        <button className="sidebar-logo-toggle desktop-only" type="button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={()=>setCollapsed(v=>!v)}><Logo compact={collapsed}/></button>
        <div className="sidebar-brand mobile-only"><Logo/></div>
        <button className="icon-btn mobile-only" onClick={() => setOpen(false)}><X size={19} /></button>
      </div>
      <nav className="side-nav">
        {nav.map(([label, Icon, slug]) => <NavLink end={!slug} key={label} to={slug ? `${root}/${slug}` : root} onClick={() => setOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-foot">
        <span className="role-chip">{role}</span><p>EqualLearn Workspace</p>
      </div>
    </aside>
    {open && <button className="backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <main className="workspace-main">
      <header className="topbar">
        <button className="icon-btn mobile-only" onClick={() => setOpen(true)}><Menu size={20} /></button>
        <div className="searchbox"><Search size={17} /><input placeholder="Search EqualLearn" /></div>
        <div className="topbar-actions" ref={panelRef}>
          <div className="topbar-popover-wrap">
            <button className={`icon-btn notification-button ${unreadCount?'has-unread':''}`} aria-expanded={notificationsOpen} onClick={()=>{setNotificationsOpen(v=>!v);setProfileOpen(false)}}><Bell size={18}/>{unreadCount>0&&<span className="notification-dot"/>}</button>
            {notificationsOpen&&<div className="topbar-popover notification-popover">
              <div className="popover-head"><div><span className="mini-label">NOTIFICATIONS</span><h3>Updates</h3></div>{unreadCount>0&&<button className="text-btn" onClick={clearUnread}>Mark all read</button>}</div>
              {notificationsLoading?<div className="popover-empty"><strong>Loading notifications…</strong></div>:notifications.length===0?<div className="popover-empty"><Check size={20}/><strong>You're all caught up.</strong><span>No notifications yet.</span></div>:<div className="notification-list">{notifications.map(item=><button key={item.id} className={item.read===false?'unread':''} onClick={()=>openNotification(item)}><span className="activity-dot"/><div><strong>{item.title||'Notification'}</strong><p>{item.message||item.text||''}</p><small>{formatWhen(item.createdAt)}</small></div>{item.read!==false&&<Check size={15}/>}</button>)}</div>}
            </div>}
          </div>
          <div className="topbar-popover-wrap">
            <button className="profile-trigger" aria-expanded={profileOpen} onClick={()=>{setProfileOpen(v=>!v);setNotificationsOpen(false)}}><ProfileAvatar size="sm"/><span className="profile-trigger-copy"><strong>{name}</strong><small>{role}</small></span><ChevronDown size={15}/></button>
            {profileOpen&&<div className="topbar-popover profile-popover">
              <div className="profile-popover-head"><ProfileAvatar size="lg"/><div><strong>{name}</strong><span>{profile?.email||''}</span><small>{role.toUpperCase()}</small></div></div>
              {role!=='admin'&&<button onClick={()=>{navigate(`${root}/profile`);setProfileOpen(false)}}><UserRound size={16}/> View profile</button>}
              <button className="danger-link" onClick={logout}><LogOut size={16}/> Logout</button>
            </div>}
          </div>
        </div>
      </header>
      <section className="page-wrap">{children}</section>
    </main>
  </div>;
}
