import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
let teacherUid = '';
let assignedStudentIds = new Set();
let lessonIds = new Set();
let studentTotal = 0;
let unsubscribeProgress = null;

onAuthStateChanged(auth, async user => {
  if (!user) { location.href='../login.html'; return; }
  teacherUid = user.uid;
  try {
    const profileSnap = await getDoc(doc(db,'users',user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};
    if ((profile.role||'teacher').toLowerCase() !== 'teacher') { location.href='../login.html'; return; }
    $('teacherName').textContent = profile.fullname || user.email || 'Teacher';
    await loadDashboard(user.uid);
    watchEngagement();
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    $('engagementUpdated').textContent='Unable to load live data';
  }
});

async function loadDashboard(uid){
  const [modulesSnap, lessonsSnap, questionsSnap, usersSnap, assignmentsSnap] = await Promise.all([
    getDocs(collection(db,'modules')),getDocs(collection(db,'lessons')),getDocs(collection(db,'questions')),getDocs(collection(db,'users')),getDocs(collection(db,'teacherAssignments'))
  ]);
  const modules = modulesSnap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>!x.createdBy || x.createdBy===uid);
  const lessons = lessonsSnap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>!x.createdBy || x.createdBy===uid);
  const questions = questionsSnap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>!x.createdBy || x.createdBy===uid || lessons.some(l=>l.id===x.lessonId));
  lessonIds = new Set(lessons.map(x=>x.id));

  const students = usersSnap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x.role||'').toLowerCase()==='student');
  const assignments = assignmentsSnap.docs.map(d=>d.data()).filter(x=>x.teacherId===uid && (x.status||'active')!=='inactive');
  assignedStudentIds = new Set();
  if(assignments.length){
    for(const student of students){
      const cohort=String(student.cohort||student.cohortId||''); const course=String(student.course||''); const year=String(student.yearLevel||'');
      if(assignments.some(a => (!a.cohort || String(a.cohort)===cohort) && (!a.course || String(a.course)===course) && (!a.yearLevel || String(a.yearLevel)===year))) assignedStudentIds.add(student.id);
    }
  } else students.forEach(s=>assignedStudentIds.add(s.id));
  studentTotal = assignedStudentIds.size;
  $('moduleCount').textContent=modules.length; $('lessonCount').textContent=lessons.length; $('quizCount').textContent=questions.length; $('studentCount').textContent=studentTotal;
  $('studentCountMeta').textContent = assignments.length ? 'Assigned learners' : 'Registered learners';
}

function watchEngagement(){
  unsubscribeProgress?.();
  unsubscribeProgress = onSnapshot(collection(db,'progress'), snap => {
    const records=snap.docs.map(d=>d.data()).filter(p=>assignedStudentIds.has(p.userId) && (!lessonIds.size || lessonIds.has(p.lessonId)));
    renderEngagement(records);
  }, error => { console.error('Engagement listener:',error); $('engagementUpdated').textContent='Live data unavailable'; });
}

function renderEngagement(records){
  const expected=Math.max(studentTotal * Math.max(lessonIds.size,1),1);
  const uniqueCompleted=new Set(records.filter(r=>r.completed).map(r=>`${r.userId}:${r.lessonId}`));
  const participants=new Set(records.map(r=>r.userId));
  const scored=records.filter(r=>Number.isFinite(Number(r.percentage)));
  const now=Date.now(); const weekAgo=now-7*24*60*60*1000;
  const activeWeek=new Set(records.filter(r=>toMillis(r.completedAt)>=weekAgo).map(r=>r.userId));
  const completion=studentTotal && lessonIds.size ? Math.round(uniqueCompleted.size/expected*100) : 0;
  const participation=studentTotal ? Math.round(participants.size/studentTotal*100) : 0;
  const average=scored.length ? Math.round(scored.reduce((a,r)=>a+Number(r.percentage||0),0)/scored.length) : 0;
  const weekly=studentTotal ? Math.round(activeWeek.size/studentTotal*100) : 0;
  setMetric('completion',completion); setMetric('participation',participation); setMetric('score',average); setMetric('activity',weekly);
  $('engagementSummary').textContent = records.length ? `${participants.size} of ${studentTotal} students have recorded activity across ${lessonIds.size || 0} lesson${lessonIds.size===1?'':'s'}.` : 'No quiz or lesson completion has been recorded yet.';
  $('engagementUpdated').textContent=`Updated ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
}
function setMetric(type,value){ const v=Math.max(0,Math.min(100,value||0)); const map={completion:['completionBar','completionRate'],participation:['participationBar','participationRate'],score:['scoreBar','averageScore'],activity:['activityBar','weeklyActivity']}; const [bar,label]=map[type]; $(bar).style.width=`${v}%`; $(label).textContent=`${v}%`; }
function toMillis(ts){ if(!ts) return 0; if(typeof ts.toMillis==='function') return ts.toMillis(); if(ts.seconds) return ts.seconds*1000; const v=new Date(ts).getTime(); return Number.isFinite(v)?v:0; }
window.addEventListener('beforeunload',()=>unsubscribeProgress?.());
