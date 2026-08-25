import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js';

const fields = {
  name: document.getElementById('profileName'), email: document.getElementById('profileEmail'),
  number: document.getElementById('profileStudentNumber'), course: document.getElementById('profileCourse'),
  year: document.getElementById('profileYear'), cohort: document.getElementById('profileCohort')
};
onAuthStateChanged(auth, async user => {
  if (!user) { location.href = '../login.html'; return; }
  const snap = await getDoc(doc(db,'users',user.uid));
  if (!snap.exists()) return;
  const data = snap.data();
  if ((data.role||'').toLowerCase() !== 'student') { location.href = '../login.html'; return; }
  fields.name.value = data.fullname || '';
  fields.email.value = data.email || user.email || '';
  fields.number.value = data.studentNumber || '';
  fields.course.value = data.course || '';
  fields.year.value = data.yearLevel || '';
  fields.cohort.value = data.cohort || data.cohortId || '';
});
