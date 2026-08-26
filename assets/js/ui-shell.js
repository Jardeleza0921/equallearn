import { auth } from "./firebase-config.js";
import { icon, hydrateIcons } from "./icons.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

const path = location.pathname.toLowerCase();
const role = path.includes('/admin/') ? 'admin' : path.includes('/teacher/') ? 'teacher' : path.includes('/student/') ? 'student' : null;

const labels = {
  admin: { title: 'Administrator', nav: [
    ['dashboard.html','home','Dashboard'],['students.html','users','Students'],['manage-teachers.html','teacher','Teachers'],['register-teacher.html','userPlus','Register Teacher'],['class-assignments.html','classes','Class Assignments'],['reports.html','chart','Reports'],['settings.html','settings','Settings']
  ]},
  teacher: { title: 'Teacher', nav: [
    ['dashboard.html','home','Dashboard'],['modules.html','bookOpen','Learning Content'],['students.html','users','Students'],['quiz_builder.html','quiz','Quiz Builder'],['profile.html','profile','Profile']
  ]},
  student: { title: 'Student', nav: [
    ['dashboard.html','home','Dashboard'],['modules.html','bookOpen','Learning'],['quizzes.html','quiz','Quizzes'],['progress.html','progress','Progress'],['profile.html','profile','Profile']
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
    const activeFile = role === 'teacher' && current === 'lessons.html' ? 'modules.html' : current;
    aside.innerHTML = `
      <a class="el-sidebar-brand" href="dashboard.html" aria-label="EqualLearn dashboard"><img class="el-wordmark-image" src="../assets/icons/equallearn-wordmark-light.svg" alt="EqualLearn"></a>
      <div class="el-role-chip">${labels[role].title} workspace</div>
      <nav class="el-nav">${labels[role].nav.map(([href,iconName,name]) => `<a href="${href}" class="${activeFile===href?'active':''}"><span class="el-nav-icon">${icon(iconName,19)}</span><span>${name}</span></a>`).join('')}</nav>
      <div class="el-sidebar-bottom el-nav"><a href="../login.html" data-el-logout><span class="el-nav-icon">${icon('logout',19)}</span><span>Logout</span></a></div>`;
    const main = document.createElement('main'); main.className = 'el-app-main';
    const top = document.createElement('div'); top.className = 'el-topbar';
    const title = document.title.replace(' - EqualLearn','').replace('EqualLearn - ','');
    top.innerHTML = `<div class="el-topbar-title"><button class="el-menu-toggle" aria-label="Open menu">${icon('menu',20)}</button><div><div class="el-page-kicker">EqualLearn</div><div class="el-page-title">${title}</div></div></div><div class="el-topbar-actions"><div class="el-user-pill"><span class="el-avatar">${labels[role].title[0]}</span><div><small>${labels[role].title}</small><strong data-el-user-name>${labels[role].title}</strong></div></div></div>`;
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

const sourceName = document.querySelector('#adminName, #teacherName, #studentName, #profileName, #teacherProfileName');
const shellName = document.querySelector('[data-el-user-name]');
if (sourceName && shellName) {
  const syncName = () => { const value = sourceName.value || sourceName.textContent || ''; const clean=value.trim(); if (clean && !clean.toLowerCase().includes('loading')) shellName.textContent = clean; };
  syncName();
  new MutationObserver(syncName).observe(sourceName, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['value'] });
  sourceName.addEventListener?.('input', syncName);
}

hydrateIcons();
const routeProgress = document.createElement('div');
routeProgress.className = 'el-route-progress';
routeProgress.setAttribute('aria-hidden', 'true');
document.body.appendChild(routeProgress);
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || link.hasAttribute('download') || link.target === '_blank' || link.dataset.elLogout !== undefined) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  try {
    const target = new URL(link.href, location.href);
    if (target.origin === location.origin && target.href !== location.href) document.body.classList.add('el-route-loading');
  } catch (_) {}
});
window.addEventListener('pageshow', () => document.body.classList.remove('el-route-loading'));
