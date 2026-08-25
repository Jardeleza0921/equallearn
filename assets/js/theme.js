const key = "equallearn-theme";
const saved = localStorage.getItem(key);
const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
document.body.dataset.theme = saved || (preferredDark ? 'dark' : 'light');

function icon(){ return document.body.dataset.theme === 'dark' ? '☀' : '☾'; }
function toggle(){
  document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(key, document.body.dataset.theme);
  document.querySelectorAll('[data-el-theme-toggle]').forEach(b => b.textContent = icon());
}
function place(){
  if(document.querySelector('[data-el-theme-toggle]')) return;
  const b=document.createElement('button');
  b.type='button';b.className='el-theme-toggle';b.dataset.elThemeToggle='';b.textContent=icon();b.title='Switch theme';b.setAttribute('aria-label','Switch light and dark theme');b.addEventListener('click',toggle);
  const actions=document.querySelector('.el-topbar-actions');
  if(actions) actions.prepend(b); else { const wrap=document.createElement('div');wrap.className='el-theme-fab';wrap.append(b);document.body.append(wrap); }
}
place();setTimeout(place,120);setTimeout(place,500);
