import { icon } from './icons.js';
function setup(){
  document.querySelectorAll('input[type="password"]').forEach(input=>{
    if(input.dataset.passwordToggleReady) return;
    input.dataset.passwordToggleReady='1';
    const wrap=document.createElement('div'); wrap.className='el-password-wrap';
    input.parentNode.insertBefore(wrap,input); wrap.appendChild(input);
    const btn=document.createElement('button'); btn.type='button'; btn.className='el-password-toggle';
    btn.setAttribute('aria-label','Show password'); btn.title='Show password'; btn.innerHTML=icon('eye',19);
    btn.addEventListener('click',()=>{
      const show=input.type==='password'; input.type=show?'text':'password';
      btn.innerHTML=icon(show?'eyeOff':'eye',19); btn.setAttribute('aria-label',show?'Hide password':'Show password'); btn.title=show?'Hide password':'Show password';
    });
    wrap.appendChild(btn);
  });
}
setup();
