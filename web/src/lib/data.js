import { initializeApp, deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where
} from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';

export const COLLECTIONS = {
  users: 'users', modules: 'modules', lessons: 'lessons', questions: 'questions', progress: 'progress',
  classGroups: 'classGroups', assignments: 'teacherAssignments', notifications: 'notifications',
};

export const clean = value => String(value ?? '').trim();
export const lower = value => clean(value).toLowerCase();
export const YEAR_LEVELS = ['1st', '2nd', '3rd', '4th'];
export const normalizeYearLevel = value => {
  const raw = lower(value).replace(/[\s_-]+/g, '');
  if (['1','1st','1styear','1l','first','firstyear'].includes(raw)) return '1st';
  if (['2','2nd','2ndyear','2l','second','secondyear'].includes(raw)) return '2nd';
  if (['3','3rd','3rdyear','3l','third','thirdyear'].includes(raw)) return '3rd';
  if (['4','4th','4thyear','4l','fourth','fourthyear'].includes(raw)) return '4th';
  return clean(value);
};
export const normalizeSection = value => clean(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
export const studentSection = student => normalizeSection(student?.section || student?.cohort || student?.cohortId);
export const studentCourse = student => clean(student?.course).toUpperCase() || 'BSIT';
export const timestampMs = value => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};
export const formatWhen = value => {
  const ms = timestampMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

async function list(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export const getUsers = async role => {
  const rows = await list(COLLECTIONS.users);
  const filtered = role ? rows.filter(row => lower(row.role) === lower(role)) : rows;
  return filtered.sort((a,b)=>clean(a.fullname || a.email).localeCompare(clean(b.fullname || b.email)));
};
export const getModules = async () => (await list(COLLECTIONS.modules)).sort((a,b)=>Number(a.order || 999)-Number(b.order || 999));
export const getLessons = async () => (await list(COLLECTIONS.lessons)).sort((a,b)=>clean(a.moduleName).localeCompare(clean(b.moduleName)) || clean(a.title).localeCompare(clean(b.title)));
export const getQuestions = async () => list(COLLECTIONS.questions);
export const getProgress = async userId => {
  const rows = await list(COLLECTIONS.progress);
  return (userId ? rows.filter(row => row.userId === userId) : rows).sort((a,b)=>timestampMs(b.completedAt)-timestampMs(a.completedAt));
};
export const getClassGroups = async () => {
  const [students, stored] = await Promise.all([getUsers('student'), list(COLLECTIONS.classGroups)]);
  const storedById = new Map(stored.map(row => [row.id, row]));
  const groups = new Map();
  for (const student of students) {
    const section = studentSection(student);
    const course = studentCourse(student);
    const yearLevel = normalizeYearLevel(student.yearLevel);
    if (!section) continue;
    const id = `SECTION_${course}_${section}`;
    const existing = storedById.get(id) || {};
    const current = groups.get(id) || { ...existing, id, section, course, name: `Section ${section}`, studentCount: 0, yearLevels: [] };
    current.studentCount += 1;
    if (yearLevel && !current.yearLevels.includes(yearLevel)) current.yearLevels.push(yearLevel);
    groups.set(id, current);
  }
  return Array.from(groups.values()).sort((a,b)=>clean(a.section).localeCompare(clean(b.section), undefined, { numeric: true }));
};
export const getAssignments = async () => (await list(COLLECTIONS.assignments)).sort((a,b)=>clean(a.className).localeCompare(clean(b.className)) || clean(a.yearLevel).localeCompare(clean(b.yearLevel)));
export const getNotifications = async uid => {
  // Intentionally filter client-side to preserve the old branch behavior without requiring a new composite index.
  const rows = await list(COLLECTIONS.notifications);
  return rows.filter(row => row.userId === uid).sort((a,b)=>timestampMs(b.createdAt)-timestampMs(a.createdAt)).slice(0,20);
};

export const markNotificationRead = id => updateDoc(doc(db, COLLECTIONS.notifications, id), { read: true, readAt: serverTimestamp() });
export const markAllNotificationsRead = async uid => {
  const rows = await getNotifications(uid);
  await Promise.all(rows.filter(row => row.read === false).map(row => markNotificationRead(row.id)));
};

export const getStudentAssignment = async student => {
  const rows = await getAssignments();
  const section = studentSection(student);
  const course = studentCourse(student);
  const year = normalizeYearLevel(student?.yearLevel);
  return rows.find(row => {
    const rowSection = normalizeSection(row.section || row.cohort);
    return lower(row.status || 'active') === 'active' &&
      (!rowSection || rowSection === section) &&
      (!clean(row.course) || clean(row.course).toUpperCase() === course) &&
      (!normalizeYearLevel(row.yearLevel) || normalizeYearLevel(row.yearLevel) === year);
  }) || null;
};

export function progressSummary(progress, questions = []) {
  const quizLessonIds = new Set(questions.map(q=>q.lessonId).filter(Boolean));
  const relevant = progress.filter(row => !quizLessonIds.size || quizLessonIds.has(row.lessonId));
  const completedIds = new Set(relevant.filter(row=>row.completed).map(row=>row.lessonId).filter(Boolean));
  const completed = completedIds.size;
  const total = quizLessonIds.size;
  const average = relevant.length ? Math.round(relevant.reduce((sum,row)=>sum+Number(row.percentage || 0),0)/relevant.length) : 0;
  const percent = total ? Math.round(completed/total*100) : 0;
  const passed = relevant.filter(row=>lower(row.result)==='passing').length;
  return { completed, total, average, percent, passed, attempts: relevant.length };
}

export const saveProfile = (uid, patch) => updateDoc(doc(db, COLLECTIONS.users, uid), { ...patch, updatedAt: serverTimestamp() });

export const saveModule = async ({ id, uid, title, description, order, status, fileURL = '', fileName = '', filePath = '', fileId = '', fileType = '', fileSize = 0 }) => {
  const payload = { title: clean(title), description: clean(description), order: Number(order) || 1, status: status || 'active', fileURL: clean(fileURL), fileName: clean(fileName), filePath: clean(filePath), fileId: clean(fileId), fileType: clean(fileType), fileSize: Number(fileSize) || 0, updatedAt: serverTimestamp() };
  if (id) { await updateDoc(doc(db, COLLECTIONS.modules, id), payload); return id; }
  const created = await addDoc(collection(db, COLLECTIONS.modules), { ...payload, createdBy: uid, createdAt: serverTimestamp() });
  return created.id;
};
export const deleteModule = id => deleteDoc(doc(db, COLLECTIONS.modules, id));

export const saveLesson = async ({ id, uid, moduleId, moduleName, title, description, videoUrl = '', fileUrl = '', fileName = '', filePath = '', fileId = '', fileType = '', fileSize = 0 }) => {
  const payload = { moduleId, moduleName: clean(moduleName), title: clean(title), description: clean(description), videoUrl: clean(videoUrl), fileUrl: clean(fileUrl), fileName: clean(fileName), filePath: clean(filePath), fileId: clean(fileId), fileType: clean(fileType), fileSize: Number(fileSize) || 0, updatedAt: serverTimestamp() };
  if (id) { await updateDoc(doc(db, COLLECTIONS.lessons, id), payload); return id; }
  const created = await addDoc(collection(db, COLLECTIONS.lessons), { ...payload, createdBy: uid, createdAt: serverTimestamp() });
  return created.id;
};
export const deleteLesson = id => deleteDoc(doc(db, COLLECTIONS.lessons, id));

export const saveQuestion = async ({ id, uid, lessonId, question, choiceA, choiceB, choiceC, choiceD, correctAnswer }) => {
  const payload = { lessonId, question: clean(question), choiceA: clean(choiceA), choiceB: clean(choiceB), choiceC: clean(choiceC), choiceD: clean(choiceD), correctAnswer, updatedAt: serverTimestamp() };
  if (id) { await updateDoc(doc(db, COLLECTIONS.questions, id), payload); return id; }
  const created = await addDoc(collection(db, COLLECTIONS.questions), { ...payload, createdBy: uid, createdAt: serverTimestamp() });
  return created.id;
};
export const deleteQuestion = id => deleteDoc(doc(db, COLLECTIONS.questions, id));

export const saveQuizProgress = async ({ uid, lessonId, score, total }) => {
  const percentage = total ? Math.round(score / total * 100) : 0;
  const result = percentage >= 75 ? 'passing' : 'failing';
  const id = `${uid}_${lessonId}`;
  await setDoc(doc(db, COLLECTIONS.progress, id), { userId: uid, lessonId, score, total, percentage, result, completed: true, completedAt: serverTimestamp() }, { merge: true });
  return { score, total, percentage, result };
};

export const updateTeacher = (id, patch) => updateDoc(doc(db, COLLECTIONS.users, id), { ...patch, updatedAt: serverTimestamp() });
export const deleteTeacherProfile = id => deleteDoc(doc(db, COLLECTIONS.users, id));
export async function deleteStudentProfile(id) {
  const [progressSnap, notificationSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.progress), where('userId', '==', id))),
    getDocs(query(collection(db, COLLECTIONS.notifications), where('userId', '==', id))),
  ]);
  await Promise.all([
    ...progressSnap.docs.map(row => deleteDoc(row.ref)),
    ...notificationSnap.docs.map(row => deleteDoc(row.ref)),
  ]);
  await deleteDoc(doc(db, COLLECTIONS.users, id));
}


export async function createTeacherAccount({ fullname, email, password, department = '', phone = '', bio = '', status = 'active' }) {
  const normalizedEmail = lower(email);
  const users = await getUsers();
  if (users.some(u => lower(u.email) === normalizedEmail)) throw new Error('This email is already registered.');
  const secondary = initializeApp(firebaseConfig, `teacherCreator_${Date.now()}`);
  const secondaryAuth = getAuth(secondary);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, password);
    const uid = credential.user.uid;
    await setDoc(doc(db, COLLECTIONS.users, uid), {
      uid, fullname: clean(fullname), email: normalizedEmail, department: clean(department), phone: clean(phone), bio: clean(bio), role: 'teacher', status,
      course: '', yearLevel: '', studentNumber: '', profileImage: '', createdAt: serverTimestamp(), lastLogin: null,
    });
    await signOut(secondaryAuth);
    return uid;
  } finally {
    try { await deleteApp(secondary); } catch {}
  }
}

export async function generateClassGroupsFromStudents() {
  const students = await getUsers('student');
  const groups = new Map();
  for (const student of students) {
    const section = studentSection(student);
    const course = studentCourse(student);
    const yearLevel = normalizeYearLevel(student.yearLevel);
    if (!section) continue;
    const id = `SECTION_${course}_${section}`;
    const current = groups.get(id) || { id, section, course, name: `Section ${section}`, students: [], years: new Set() };
    current.students.push(student.id);
    if (yearLevel) current.years.add(yearLevel);
    groups.set(id, current);
  }
  for (const group of groups.values()) {
    await setDoc(doc(db, COLLECTIONS.classGroups, group.id), {
      name: group.name, section: group.section, course: group.course, studentCount: group.students.length,
      yearLevels: Array.from(group.years), status: 'active', updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  return Array.from(groups.values()).length;
}

export async function assignTeacher({ classGroupId, yearLevel, teacherId }) {
  const [groupSnap, teacherSnap] = await Promise.all([
    getDoc(doc(db, COLLECTIONS.classGroups, classGroupId)),
    getDoc(doc(db, COLLECTIONS.users, teacherId)),
  ]);
  if (!teacherSnap.exists()) throw new Error('Teacher not found.');
  let group = groupSnap.exists() ? { id: groupSnap.id, ...groupSnap.data() } : null;
  if (!group) {
    const groups = await getClassGroups();
    group = groups.find(row => row.id === classGroupId) || null;
    if (!group) throw new Error('Section not found.');
    await setDoc(doc(db, COLLECTIONS.classGroups, classGroupId), {
      name: group.name, section: group.section, course: group.course, studentCount: group.studentCount || 0,
      yearLevels: group.yearLevels || [], status: 'active', updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  const teacher = teacherSnap.data();
  const normalizedYear = normalizeYearLevel(yearLevel);
  const section = normalizeSection(group.section || group.cohort);
  const course = clean(group.course).toUpperCase() || 'BSIT';
  const assignmentId = `${classGroupId}_${normalizedYear}`;
  await setDoc(doc(db, COLLECTIONS.assignments, assignmentId), {
    classGroupId, className: `Section ${section}`, section, course, yearLevel: normalizedYear,
    teacherId, teacherName: teacher.fullname || teacher.email || '', status: 'active', assignedAt: serverTimestamp(),
  });
  return assignmentId;
}

export const activateAssignment = id => updateDoc(doc(db, COLLECTIONS.assignments, id), { status: 'active', activatedAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const deactivateAssignment = id => updateDoc(doc(db, COLLECTIONS.assignments, id), { status: 'inactive', deactivatedAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const deleteAssignment = async id => {
  const ref = doc(db, COLLECTIONS.assignments, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Teacher designation not found.');
  const current = lower(snap.data().status || 'active');
  await updateDoc(ref, {
    status: 'deleted',
    previousStatus: current === 'deleted' ? (snap.data().previousStatus || 'inactive') : current,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
export const retrieveAssignment = id => updateDoc(doc(db, COLLECTIONS.assignments, id), { status: 'inactive', retrievedAt: serverTimestamp(), updatedAt: serverTimestamp() });

export function reportRows(users, progress) {
  const grouped = new Map();
  for (const row of progress) {
    if (!row.userId) continue;
    if (!grouped.has(row.userId)) grouped.set(row.userId, []);
    grouped.get(row.userId).push(row);
  }
  return users.filter(u=>lower(u.role)==='student').map(user=>{
    const rows = grouped.get(user.id) || [];
    const grade = rows.length ? Math.round(rows.reduce((sum,row)=>sum+Number(row.percentage || 0),0)/rows.length) : 0;
    return { ...user, course: studentCourse(user), yearLevel: normalizeYearLevel(user.yearLevel), section: studentSection(user), grade, result: grade >= 75 ? 'passing' : 'failing', schoolStatus: user.schoolStatus || 'active', attempts: rows.length };
  });
}

export function assignedStudentsForTeacher(teacherId, users, assignments) {
  const students = users.filter(u => lower(u.role) === 'student');
  const mine = assignments.filter(a => a.teacherId === teacherId && lower(a.status || 'active') === 'active');
  // Before assignments exist, teachers can still see registered learners. Once assignments exist,
  // scope them by the student's current Section + Course + Year Level profile values.
  if (!mine.length) return students;
  return students.filter(student => {
    const section = studentSection(student);
    const course = studentCourse(student);
    const year = normalizeYearLevel(student.yearLevel);
    return mine.some(a => {
      const assignmentSection = normalizeSection(a.section || a.cohort);
      return (!assignmentSection || assignmentSection === section) &&
        (!clean(a.course) || clean(a.course).toUpperCase() === course) &&
        (!normalizeYearLevel(a.yearLevel) || normalizeYearLevel(a.yearLevel) === year);
    });
  });
}
