import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

const path = location.pathname.toLowerCase();
const role = path.includes('/admin/') ? 'admin' : path.includes('/teacher/') ? 'teacher' : path.includes('/student/') ? 'student' : null;

const labels = {
  admin: { title: 'Administrator', nav: [
    ['dashboard.html','⌂','Dashboard'],['students.html','◎','Students'],['manage-teachers.html','♙','Teachers'],['register-teacher.html','＋','Register Teacher'],['class-assignments.html','▦','Class Assignments'],['reports.html','↗','Reports'],['settings.html','⚙','Settings']
  ]},
  teacher: { title: 'Teacher', nav: [
    ['dashboard.html','⌂','Dashboard'],['modules.html','▤','Modules'],['lessons.html','▧','Lessons'],['students.html','◎','Students'],['quiz_builder.html','✓','Quiz Builder']
  ]},
  student: { title: 'Student', nav: [
    ['dashboard.html','⌂','Dashboard'],['modules.html','▤','Modules'],['progress.html','↗','Progress'],['profile.html','○','Profile']
  ]}
};

if (role) {
  const bodyChildren = [...document.body.children];
  const contentNodes = bodyChildren.filter(el => el.tagName !== 'SCRIPT' && !el.classList.contains('el-sidebar') && !el.classList.contains('el-app-shell'));
  const content = contentNodes[0];
  if (content) {
    const shell = document.createElement('div'); shell.className = 'el-app-shell';
    const aside = document.createElement('aside'); aside.className = 'el-sidebar';
    const current = path.split('/').pop() || 'dashboard.html';
    aside.innerHTML = `
      <div class="el-sidebar-brand"><img class="el-brand-logo" src="../assets/icons/logo.png" alt="EqualLearn logo"><span>EqualLearn</span></div>
      <div class="el-role-chip">${labels[role].title} workspace</div>
      <nav class="el-nav">${labels[role].nav.map(([href,icon,name]) => `<a href="${href}" class="${current===href?'active':''}"><span class="el-nav-icon">${icon}</span><span>${name}</span></a>`).join('')}</nav>
      <div class="el-sidebar-bottom el-nav"><a href="../login.html" data-el-logout><span class="el-nav-icon">↪</span><span>Logout</span></a></div>`;
    const main = document.createElement('main'); main.className = 'el-app-main';
    const top = document.createElement('div'); top.className = 'el-topbar';
    const title = document.title.replace(' - EqualLearn','').replace('EqualLearn - ','');
    top.innerHTML = `<div class="el-topbar-title"><button class="el-menu-toggle" aria-label="Open menu">☰</button><div><div class="el-page-kicker">EqualLearn</div><div class="el-page-title">${title}</div></div></div><div class="el-topbar-actions"><div class="el-user-pill"><span class="el-avatar">${labels[role].title[0]}</span><div><small>${labels[role].title}</small><strong data-el-user-name>${labels[role].title}</strong></div></div></div>`;
    const wrapper = document.createElement('div'); wrapper.className = 'el-page-content';
    content.parentNode.insertBefore(shell, content); shell.append(aside, main); main.append(top, wrapper); contentNodes.forEach(node => wrapper.append(node));
    document.querySelector('.el-menu-toggle')?.addEventListener('click',()=>document.body.classList.toggle('el-nav-open'));
    document.addEventListener('click',e=>{ if(innerWidth<=900 && document.body.classList.contains('el-nav-open') && !aside.contains(e.target) && !e.target.closest('.el-menu-toggle')) document.body.classList.remove('el-nav-open'); });
  }
}


const logoutLink = document.querySelector('[data-el-logout]');
if (logoutLink) {
  logoutLink.addEventListener('click', async (event) => {
    event.preventDefault();
    try { await signOut(auth); } catch (error) { console.warn('Logout warning:', error); }
    window.location.href = '../login.html';
  });
}

const sourceName = document.querySelector('#adminName, #teacherName, #studentName');
const shellName = document.querySelector('[data-el-user-name]');
if (sourceName && shellName) {
  const syncName = () => { const value = sourceName.textContent.trim(); if (value && !value.toLowerCase().includes('loading')) shellName.textContent = value; };
  syncName();
  new MutationObserver(syncName).observe(sourceName, { childList:true, subtree:true, characterData:true });
}
