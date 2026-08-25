import { db } from './firebase-config.js';
import { requireRole } from './session.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js';
requireRole('teacher', async()=>{
 const box=document.getElementById('teacherStudentCards');
 try{
  const snap=await getDocs(query(collection(db,'users'),where('role','==','student')));
  if(snap.empty){box.innerHTML='<div class="empty">No students registered yet.</div>';return;}
  box.innerHTML='';
  snap.forEach(d=>{const u=d.data();const card=document.createElement('article');card.className='el-card';card.innerHTML=`<div class="el-stat-icon">◎</div><h3 style="margin:0 0 6px">${u.fullname||'Student'}</h3><p style="margin:0;color:var(--el-muted);font-size:12px">${u.email||''}</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><span class="badge badge-active">${u.course||'Course'}</span><span class="badge">${u.yearLevel||'Year'}</span><span class="badge">${u.studentNumber||'No ID'}</span></div>`;box.append(card);});
 }catch(e){console.error(e);box.innerHTML='<div class="empty">Unable to load students.</div>';}
});
