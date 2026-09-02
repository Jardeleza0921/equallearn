import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Bell, BookOpen, ClipboardCheck, GraduationCap, Home, LogOut, Menu, Search, Settings, Users, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo';
import ThemePicker from './ThemePicker';

const navByRole = {
  student: [
    ['Home', Home, ''], ['Learning', BookOpen, 'learning'], ['Quizzes', ClipboardCheck, 'quizzes'], ['Progress', BarChart3, 'progress'], ['Profile', UserRound, 'profile'],
  ],
  teacher: [
    ['Dashboard', Home, ''], ['Learning Content', BookOpen, 'learning-content'], ['Students', Users, 'students'], ['Quiz Builder', ClipboardCheck, 'quizzes'], ['Analytics', BarChart3, 'analytics'], ['Profile', UserRound, 'profile'],
  ],
  admin: [
    ['Dashboard', Home, ''], ['Users', Users, 'users'], ['Teachers', GraduationCap, 'teachers'], ['Classes', BookOpen, 'classes'], ['Reports', BarChart3, 'reports'], ['Settings', Settings, 'settings'],
  ],
};

export default function AppShell({ role, children }) {
  const [open, setOpen] = useState(false);
  const nav = navByRole[role];
  const root = `/${role}`;
  const navigate = useNavigate();

  const logout = () => {
    if (window.confirm('Leave this EqualLearn preview and return to sign in?')) navigate('/login');
  };

  return (
    <div className="workspace">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-head"><Logo /><button className="icon-btn mobile-only" onClick={() => setOpen(false)}><X size={19} /></button></div>
        <nav className="side-nav">
          {nav.map(([label, Icon, slug]) => (
            <NavLink end={!slug} key={label} to={slug ? `${root}/${slug}` : root} onClick={() => setOpen(false)}>
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {role !== 'admin' && <NavLink className="side-utility" to={`${root}/settings`}><Settings size={16}/> Settings</NavLink>}
          <button className="side-utility danger-link" onClick={logout}><LogOut size={16}/> Logout</button>
          <span className="role-chip">{role}</span><p>EqualLearn Workspace</p>
        </div>
      </aside>
      {open && <button className="backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <main className="workspace-main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="searchbox"><Search size={17} /><input placeholder="Search EqualLearn" /></div>
          <div className="topbar-actions"><ThemePicker /><button className="icon-btn"><Bell size={18} /></button><div className="avatar">EL</div></div>
        </header>
        <section className="page-wrap">{children}</section>
      </main>
    </div>
  );
}
