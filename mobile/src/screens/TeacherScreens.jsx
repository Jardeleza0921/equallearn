import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Activity, BarChart3, BookOpen, ClipboardCheck, FileText, Pencil, Plus, Trash2, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import RoleTopBar from '../components/RoleTopBar';
import { ActionButton, ChoiceRow, EmptyState, ErrorState, Header, Input, LoadingState, Notice, Panel, pct, ProfileBlock, ProgressLine, Row, Screen, SearchInput, SectionTitle, Sheet, StatCard } from '../components/FunctionalUI';
import { pickLearningAttachment, ProfilePhotoUploader } from '../components/AppwriteUploaders';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLoad } from '../hooks/useLoad';
import { assignedStudentsForTeacher, deleteLesson, deleteModule, deleteQuestion, deleteStudentProfile, formatWhen, getAssignments, getLessons, getModules, getProgress, getQuestions, getUsers, lessonQuizIsPublished, lower, normalizeYearLevel, saveLesson, saveModule, saveProfile, saveQuestion, setLessonQuizPublished, studentCourse, studentSection, timestampMs, YEAR_LEVELS } from '../lib/data';
import { hasExternalUrl, openExternalUrl } from '../lib/links';
import { uploadMobileAsset } from '../lib/appwrite';

async function teacherBundle(uid) {
  const [modulesAll, lessonsAll, questionsAll, users, assignments, progressAll] = await Promise.all([getModules(), getLessons(), getQuestions(), getUsers(), getAssignments(), getProgress()]);
  const modules = modulesAll.filter(x => !x.createdBy || x.createdBy === uid);
  const lessons = lessonsAll.filter(x => !x.createdBy || x.createdBy === uid);
  const lessonIds = new Set(lessons.map(x => x.id));
  const questions = questionsAll.filter(x => !x.createdBy || x.createdBy === uid || lessonIds.has(x.lessonId));
  const students = assignedStudentsForTeacher(uid, users, assignments);
  const studentIds = new Set(students.map(x => x.id));
  const progress = progressAll.filter(x => studentIds.has(x.userId) && (!lessonIds.size || lessonIds.has(x.lessonId)));
  return { modules, lessons, questions, students, assignments, progress };
}

export function TeacherHome() {
  const { firebaseUser, profile } = useAuth();
  const load = useLoad(() => teacherBundle(firebaseUser.uid), [firebaseUser.uid]);
  if (load.loading) return <LoadingState/>;
  if (load.error) return <ErrorState message={load.error} onRetry={load.refresh}/>;
  const { modules, lessons, questions, students, progress } = load.data;
  const expected = Math.max(students.length * Math.max(lessons.length, 1), 1);
  const uniqueCompleted = new Set(progress.filter(p => p.completed).map(p => `${p.userId}:${p.lessonId}`));
  const participants = new Set(progress.map(p => p.userId));
  const activeWeek = new Set(progress.filter(p => timestampMs(p.completedAt) > Date.now() - 7 * 86400000).map(p => p.userId));
  const average = progress.length ? Math.round(progress.reduce((sum,p)=>sum+Number(p.percentage||0),0)/progress.length) : 0;
  const completion = students.length && lessons.length ? Math.round(uniqueCompleted.size / expected * 100) : 0;
  const participation = students.length ? Math.round(participants.size / students.length * 100) : 0;
  const weekly = students.length ? Math.round(activeWeek.size / students.length * 100) : 0;
  const first = (profile?.fullname || 'Teacher').trim().split(/\s+/)[0];
  return <Screen><RoleTopBar profilePath="/teacher/profile"/><Header eyebrow="Teacher workspace" title={`Welcome, ${first}.`} text="Manage real content, learners, quizzes, and class activity."/><StatCard label="Students" value={students.length} detail="Assigned / visible learners" Icon={Users}/><StatCard label="Modules" value={modules.length} detail={`${lessons.length} lessons`} Icon={BookOpen}/><StatCard label="Quiz questions" value={questions.length} detail={`${new Set(questions.map(q=>q.lessonId)).size} quiz lessons`} Icon={ClipboardCheck}/><StatCard label="Average score" value={pct(average)} detail={`${progress.length} saved results`} Icon={BarChart3}/>
    <SectionTitle label="Class engagement" title="Live learning activity"/><Panel><Metric label="Lesson completion" value={completion}/><Metric label="Quiz participation" value={participation}/><Metric label="Average quiz score" value={average}/><Metric label="Active this week" value={weekly}/></Panel>
    <SectionTitle title="Latest student activity"/><Panel>{progress.slice(0,6).map(p => {const student=students.find(x=>x.id===p.userId); const lesson=lessons.find(x=>x.id===p.lessonId); return <Row key={p.id} title={student?.fullname || 'Student'} subtitle={`${lesson?.title || 'Lesson'} · ${pct(p.percentage)}`} meta={formatWhen(p.completedAt)}/>;})}{!progress.length ? <EmptyState title="No class activity yet"/> : null}</Panel>
  </Screen>;
}

export function TeacherContent() {
  const { firebaseUser } = useAuth();
  const load = useLoad(() => teacherBundle(firebaseUser.uid), [firebaseUser.uid]);
  const [mode, setMode] = useState('modules');
  const [moduleEdit, setModuleEdit] = useState(null);
  const [lessonEdit, setLessonEdit] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading,setUploading]=useState(false);
  if (load.loading) return <LoadingState/>;
  const { modules, lessons } = load.data || {modules:[],lessons:[]};
  function openModule(m) { setModuleEdit({ id:m?.id||'', title:m?.title||'', description:m?.description||'', order:String(m?.order||modules.length+1), status:m?.status||'active', fileURL:m?.fileURL||'', fileName:m?.fileName||'', fileId:m?.fileId||'', fileType:m?.fileType||'', fileSize:m?.fileSize||0, pendingFile:null }); setMessage(''); }
  function openLesson(l) { setLessonEdit({ id:l?.id||'', moduleId:l?.moduleId||modules[0]?.id||'', title:l?.title||'', description:l?.description||'', videoUrl:l?.videoUrl||'', fileUrl:l?.fileUrl||'', fileName:l?.fileName||'', fileId:l?.fileId||'', fileType:l?.fileType||'', fileSize:l?.fileSize||0, pendingFile:null }); setMessage(''); }
  async function chooseModuleFile(){try{const f=await pickLearningAttachment();if(f)setModuleEdit(x=>({...x,pendingFile:f,fileName:f.name}));}catch(e){setMessage(e.message);}}
  async function chooseLessonFile(){try{const f=await pickLearningAttachment();if(f)setLessonEdit(x=>({...x,pendingFile:f,fileName:f.name}));}catch(e){setMessage(e.message);}}
  async function saveM() { try { if(!moduleEdit.title.trim()) throw new Error('Enter a module title.'); setUploading(true); let payload={...moduleEdit}; if(moduleEdit.pendingFile){const up=await uploadMobileAsset(moduleEdit.pendingFile);payload={...payload,fileURL:up.viewUrl,fileName:up.name,fileId:up.id,fileType:up.mimeType,fileSize:up.size,filePath:`appwrite:${up.id}`};} delete payload.pendingFile; await saveModule({...payload,uid:firebaseUser.uid}); setModuleEdit(null); setMessage('Module saved.'); load.refresh(); } catch(e){setMessage(e.message);} finally{setUploading(false);} }
  async function saveL() { try { const mod=modules.find(x=>x.id===lessonEdit.moduleId); if(!mod||!lessonEdit.title.trim()) throw new Error('Choose a module and enter a lesson title.'); setUploading(true); let payload={...lessonEdit}; if(lessonEdit.pendingFile){const up=await uploadMobileAsset(lessonEdit.pendingFile);payload={...payload,fileUrl:up.viewUrl,fileName:up.name,fileId:up.id,fileType:up.mimeType,fileSize:up.size,filePath:`appwrite:${up.id}`};} delete payload.pendingFile; await saveLesson({...payload,uid:firebaseUser.uid,moduleName:mod.title}); setLessonEdit(null); setMessage('Lesson saved.'); load.refresh(); } catch(e){setMessage(e.message);} finally{setUploading(false);} }
  function removeModule(id){Alert.alert('Delete module','Delete this module record? Existing lesson records are not automatically deleted.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{await deleteModule(id);load.refresh();}}]);}
  function removeLesson(id){Alert.alert('Delete lesson','Delete this lesson?', [{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{await deleteLesson(id);load.refresh();}}]);}
  return <Screen><Header eyebrow="Learning Content" title="Modules and lessons" text="Create content and upload real learning attachments to Appwrite Storage." right={<Pressable onPress={()=>mode==='modules'?openModule():openLesson()}><Plus size={24}/></Pressable>}/><ChoiceRow value={mode} onChange={setMode} options={[{value:'modules',label:`Modules (${modules.length})`},{value:'lessons',label:`Lessons (${lessons.length})`}]}/>
    <Notice type={message.includes('saved')?'success':'error'}>{message}</Notice>
    <Panel>{mode==='modules' ? modules.map(m=><Row key={m.id} title={m.title} subtitle={`${lessons.filter(x=>x.moduleId===m.id).length} lessons · ${m.status||'active'}`} meta={`${m.description||''}${m.fileId?' · Appwrite file':''}`} right={<View style={s.rowActions}>{hasExternalUrl(m.fileURL)?<Pressable onPress={()=>openExternalUrl(m.fileURL,'Module resource')}><FileText size={18}/></Pressable>:null}<Pressable onPress={()=>openModule(m)}><Pencil size={18}/></Pressable><Pressable onPress={()=>removeModule(m.id)}><Trash2 color="#a34f64" size={18}/></Pressable></View>}/>) : lessons.map(l=><Row key={l.id} title={l.title} subtitle={modules.find(m=>m.id===l.moduleId)?.title || l.moduleName || 'Module'} meta={`${l.description||''}${l.fileId?' · Appwrite file':''}`} right={<View style={s.rowActions}>{hasExternalUrl(l.fileUrl)?<Pressable onPress={()=>openExternalUrl(l.fileUrl, 'Lesson resource')}><FileText size={18}/></Pressable>:null}<Pressable onPress={()=>openLesson(l)}><Pencil size={18}/></Pressable><Pressable onPress={()=>removeLesson(l.id)}><Trash2 color="#a34f64" size={18}/></Pressable></View>}/>) }{(mode==='modules'?!modules.length:!lessons.length)?<EmptyState title={`No ${mode} yet`}/>:null}</Panel>
    <Sheet visible={!!moduleEdit} title={`${moduleEdit?.id?'Edit':'Add'} module`} onClose={()=>!uploading&&setModuleEdit(null)} tall><Input label="Title" value={moduleEdit?.title||''} onChangeText={v=>setModuleEdit(x=>({...x,title:v}))}/><Input label="Description" value={moduleEdit?.description||''} onChangeText={v=>setModuleEdit(x=>({...x,description:v}))} multiline/><Input label="Order" value={moduleEdit?.order||''} onChangeText={v=>setModuleEdit(x=>({...x,order:v}))} keyboardType="number-pad"/><Label>Status</Label><ChoiceRow value={moduleEdit?.status||'active'} onChange={v=>setModuleEdit(x=>({...x,status:v}))} options={['active','draft','inactive']}/><ActionButton variant="secondary" disabled={uploading} onPress={chooseModuleFile}>{moduleEdit?.pendingFile?'Change attachment':'Choose Appwrite attachment'}</ActionButton>{moduleEdit?.pendingFile?<Notice>{`Ready: ${moduleEdit.pendingFile.name}`}</Notice>:null}<Input label="External Resource URL (optional)" value={moduleEdit?.fileURL||''} onChangeText={v=>setModuleEdit(x=>({...x,fileURL:v,pendingFile:null}))} autoCapitalize="none"/><Input label="Resource name" value={moduleEdit?.fileName||''} onChangeText={v=>setModuleEdit(x=>({...x,fileName:v}))}/><ActionButton disabled={uploading} onPress={saveM}>{uploading?'Uploading…':'Save module'}</ActionButton></Sheet>
    <Sheet visible={!!lessonEdit} title={`${lessonEdit?.id?'Edit':'Add'} lesson`} onClose={()=>!uploading&&setLessonEdit(null)} tall><Label>Module</Label><Selection rows={modules} selected={lessonEdit?.moduleId} label={x=>x.title} onChange={id=>setLessonEdit(x=>({...x,moduleId:id}))}/><Input label="Title" value={lessonEdit?.title||''} onChangeText={v=>setLessonEdit(x=>({...x,title:v}))}/><Input label="Description" value={lessonEdit?.description||''} onChangeText={v=>setLessonEdit(x=>({...x,description:v}))} multiline/><Input label="Video URL" value={lessonEdit?.videoUrl||''} onChangeText={v=>setLessonEdit(x=>({...x,videoUrl:v}))} autoCapitalize="none"/><ActionButton variant="secondary" disabled={uploading} onPress={chooseLessonFile}>{lessonEdit?.pendingFile?'Change attachment':'Choose Appwrite attachment'}</ActionButton>{lessonEdit?.pendingFile?<Notice>{`Ready: ${lessonEdit.pendingFile.name}`}</Notice>:null}<Input label="External Resource URL (optional)" value={lessonEdit?.fileUrl||''} onChangeText={v=>setLessonEdit(x=>({...x,fileUrl:v,pendingFile:null}))} autoCapitalize="none"/><Input label="Resource name" value={lessonEdit?.fileName||''} onChangeText={v=>setLessonEdit(x=>({...x,fileName:v}))}/><ActionButton disabled={uploading} onPress={saveL}>{uploading?'Uploading…':'Save lesson'}</ActionButton></Sheet>
  </Screen>;
}
export function TeacherStudents() {
  const { firebaseUser } = useAuth();
  const load = useLoad(() => teacherBundle(firebaseUser.uid), [firebaseUser.uid]);
  const [search,setSearch] = useState('');
  const [year,setYear] = useState('all');
  const [selected,setSelected] = useState(null);
  const [message,setMessage] = useState('');
  if(load.loading)return <LoadingState/>;
  const {students,progress,lessons}=load.data || {students:[],progress:[],lessons:[]};
  let rows=students.filter(x=>!search||`${x.fullname} ${x.studentNumber} ${x.email} ${studentSection(x)}`.toLowerCase().includes(search.toLowerCase()));
  if(year!=='all') rows=rows.filter(x=>normalizeYearLevel(x.yearLevel)===year);
  const stats=student=>{const p=progress.filter(x=>x.userId===student.id);const avg=p.length?Math.round(p.reduce((a,x)=>a+Number(x.percentage||0),0)/p.length):0;return{p,avg,passed:p.filter(x=>x.result==='passing').length}};
  async function remove(student){Alert.alert('Delete student',`Delete ${student.fullname||student.email} from EqualLearn? This removes the Firestore profile and saved learning records. The Firebase Authentication credential remains until server-side deletion is configured.`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{await deleteStudentProfile(student.id);setSelected(null);setMessage('Student profile deleted.');load.refresh();}catch(e){setMessage(e.message);}}}]);}
  return <Screen><Header eyebrow="Students" title="Student profiles" text="Review assigned learners and their real assessment history."/><SearchInput value={search} onChangeText={setSearch} placeholder="Search name, ID, email, section…"/><ChoiceRow value={year} onChange={setYear} options={[{value:'all',label:'All years'},...YEAR_LEVELS.map(x=>({value:x,label:x}))]}/><Notice>{message}</Notice><Panel>{rows.map(student=>{const x=stats(student);return <Row key={student.id} title={student.fullname||student.email} subtitle={`${studentCourse(student)} · ${normalizeYearLevel(student.yearLevel)||'—'} · Section ${studentSection(student)||'—'}`} meta={`${x.p.length} attempts · ${pct(x.avg)} average`} onPress={()=>setSelected(student)}/>;})}{!rows.length?<EmptyState title="No students match this view"/>:null}</Panel>
    <Sheet visible={!!selected} title="Student profile" onClose={()=>setSelected(null)} tall>{selected? <><ProfileBlock person={selected} role="student"/><SectionTitle title="Quiz activity"/>{stats(selected).p.map(p=><Row key={p.id} title={lessons.find(l=>l.id===p.lessonId)?.title||'Lesson'} subtitle={`${p.score}/${p.total} · ${pct(p.percentage)} · ${p.result}`} meta={formatWhen(p.completedAt)}/>)}{!stats(selected).p.length?<EmptyState title="No quiz history"/>:null}<ActionButton variant="danger" onPress={()=>remove(selected)}>Delete student profile</ActionButton></>:null}</Sheet>
  </Screen>;
}

export function TeacherQuizzes() {
  const { firebaseUser } = useAuth();
  const load = useLoad(() => teacherBundle(firebaseUser.uid), [firebaseUser.uid]);
  const [search,setSearch]=useState('');
  const [lessonId,setLessonId]=useState('');
  const [edit,setEdit]=useState(null);
  const [message,setMessage]=useState('');
  if(load.loading)return <LoadingState/>;
  if(load.error)return <ErrorState message={load.error} onRetry={load.refresh}/>;
  const {modules,lessons,questions}=load.data || {modules:[],lessons:[],questions:[]};
  const activeLessonId = lessons.some(x=>x.id===lessonId) ? lessonId : (lessons[0]?.id || '');
  const activeLesson = lessons.find(x=>x.id===activeLessonId);
  const activeModule = modules.find(x=>x.id===activeLesson?.moduleId);
  const lessonQuestions = questions.filter(q=>q.lessonId===activeLessonId);
  let rows=questions.filter(q=>(!activeLessonId||q.lessonId===activeLessonId) && (!search||`${q.question} ${q.choiceA} ${q.choiceB} ${q.choiceC} ${q.choiceD}`.toLowerCase().includes(search.toLowerCase())));
  const open=q=>setEdit({id:q?.id||'',lessonId:q?.lessonId||activeLessonId||lessons[0]?.id||'',question:q?.question||'',choiceA:q?.choiceA||'',choiceB:q?.choiceB||'',choiceC:q?.choiceC||'',choiceD:q?.choiceD||'',correctAnswer:q?.correctAnswer||'A'});
  async function save(){try{if(!edit.lessonId||!edit.question.trim()||!edit.choiceA.trim()||!edit.choiceB.trim()||!edit.choiceC.trim()||!edit.choiceD.trim())throw new Error('Complete the lesson, question, and all four choices.');await saveQuestion({...edit,uid:firebaseUser.uid});setLessonId(edit.lessonId);setEdit(null);setMessage('Question saved. Publish the lesson quiz when it is ready for students.');load.refresh();}catch(e){setMessage(e.message);}}
  function remove(id){Alert.alert('Delete question','Delete this quiz question?',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{await deleteQuestion(id);load.refresh();}}]);}
  async function deploy(published){
    if(!activeLesson)return;
    const count=questions.filter(q=>q.lessonId===activeLesson.id).length;
    if(published && !count){setMessage('Add at least one question before publishing this quiz.');return;}
    try{
      await setLessonQuizPublished(activeLesson.id,published,firebaseUser.uid);
      setMessage(published?'Quiz published. Students can now access it.':'Quiz unpublished. It is hidden from students.');
      load.refresh();
    }catch(e){setMessage(e.message);}
  }
  return <Screen><Header eyebrow="Quiz Builder" title="Lesson assessments" text="Choose a lesson, review its material, build questions, then publish the quiz to students." right={activeLesson?<Pressable onPress={()=>open()}><Plus size={24}/></Pressable>:null}/>
    <SectionTitle label="1. Lesson material" title="Choose assessment source"/>
    <Panel>{lessons.length?<Selection rows={lessons} selected={activeLessonId} label={x=>`${modules.find(m=>m.id===x.moduleId)?.title||x.moduleName||'Module'} · ${x.title}`} onChange={id=>{setLessonId(id);setMessage('');}}/>:<EmptyState title="Create a lesson in Learning Content first"/>}</Panel>
    {activeLesson?<><Panel style={{marginTop:10}}><Row title={activeLesson.title} subtitle={activeModule?.title||activeLesson.moduleName||'Module'} meta={activeLesson.description||'No lesson description.'}/><View style={s.materialActions}>{hasExternalUrl(activeLesson.fileUrl)?<ActionButton variant="secondary" style={{flex:1}} onPress={()=>openExternalUrl(activeLesson.fileUrl,'Lesson resource')}>Open resource</ActionButton>:null}{hasExternalUrl(activeLesson.videoUrl)?<ActionButton variant="secondary" style={{flex:1}} onPress={()=>openExternalUrl(activeLesson.videoUrl,'Lesson video')}>Open video</ActionButton>:null}</View>{!hasExternalUrl(activeLesson.fileUrl)&&!hasExternalUrl(activeLesson.videoUrl)?<Notice>No external file/video is attached. The lesson title and description can still be used for its assessment.</Notice>:null}</Panel>
      <SectionTitle label="2. Questions" title={`${lessonQuestions.length} question${lessonQuestions.length===1?'':'s'} for this lesson`}/><SearchInput value={search} onChangeText={setSearch} placeholder="Search this lesson's questions…"/><Panel>{rows.map((q,i)=><Row key={q.id} title={`${i+1}. ${q.question}`} subtitle={`Correct ${q.correctAnswer}`} meta={`A ${q.choiceA} · B ${q.choiceB} · C ${q.choiceC} · D ${q.choiceD}`} right={<View style={s.rowActions}><Pressable onPress={()=>open(q)}><Pencil size={18}/></Pressable><Pressable onPress={()=>remove(q.id)}><Trash2 color="#a34f64" size={18}/></Pressable></View>}/>)}{!rows.length?<EmptyState title="No questions for this lesson yet"/>:null}<ActionButton style={{marginTop:12}} onPress={()=>open()}>Add question to this lesson</ActionButton></Panel>
      <SectionTitle label="3. Student availability" title={lessonQuizIsPublished(activeLesson)?'Published to students':'Not published'}/><Panel><BodyText>{lessonQuizIsPublished(activeLesson)?'Students can see and take this lesson quiz now.':'Students will not see this lesson quiz until you publish it.'}</BodyText><View style={{height:12}}/>{lessonQuizIsPublished(activeLesson)?<ActionButton variant="secondary" onPress={()=>deploy(false)}>Unpublish quiz</ActionButton>:<ActionButton onPress={()=>deploy(true)}>Publish quiz to students</ActionButton>}</Panel></>:null}
    <Notice type={message.includes('published.')||message.includes('saved.')||message.includes('hidden')?'success':'error'}>{message}</Notice>
    <Sheet visible={!!edit} title={`${edit?.id?'Edit':'Add'} question`} onClose={()=>setEdit(null)} tall><Label>Lesson</Label><Selection rows={lessons} selected={edit?.lessonId} label={x=>`${modules.find(m=>m.id===x.moduleId)?.title||x.moduleName||'Module'} · ${x.title}`} onChange={id=>setEdit(x=>({...x,lessonId:id}))}/><Input label="Question" value={edit?.question||''} onChangeText={v=>setEdit(x=>({...x,question:v}))} multiline/>{['A','B','C','D'].map(k=><Input key={k} label={`Choice ${k}`} value={edit?.[`choice${k}`]||''} onChangeText={v=>setEdit(x=>({...x,[`choice${k}`]:v}))}/>)}<Label>Correct answer</Label><ChoiceRow value={edit?.correctAnswer||'A'} onChange={v=>setEdit(x=>({...x,correctAnswer:v}))} options={['A','B','C','D']}/><ActionButton onPress={save}>Save question</ActionButton></Sheet>
  </Screen>;
}

export function TeacherAnalytics() {
  const { firebaseUser } = useAuth();
  const load = useLoad(() => teacherBundle(firebaseUser.uid), [firebaseUser.uid]);
  if(load.loading)return <LoadingState/>;
  const {students,progress,questions}=load.data || {students:[],progress:[],questions:[]};
  const avg=progress.length?Math.round(progress.reduce((s,p)=>s+Number(p.percentage||0),0)/progress.length):0;
  const active=new Set(progress.filter(p=>timestampMs(p.completedAt)>Date.now()-7*86400000).map(p=>p.userId)).size;
  const rows=students.map(student=>{const p=progress.filter(x=>x.userId===student.id);const average=p.length?Math.round(p.reduce((z,x)=>z+Number(x.percentage||0),0)/p.length):0;return{...student,attempts:p.length,average,passed:p.filter(x=>x.result==='passing').length}}).sort((a,b)=>b.average-a.average);
  return <Screen><Header eyebrow="Analytics" title="Class engagement" text="Live assessment figures calculated from assigned students."/><StatCard label="Assigned students" value={students.length} Icon={Users}/><StatCard label="Active this week" value={active} Icon={Activity}/><StatCard label="Attempts" value={progress.length} Icon={ClipboardCheck}/><StatCard label="Average" value={pct(avg)} Icon={BarChart3}/><SectionTitle title="Student performance"/><Panel>{rows.map(x=><Row key={x.id} title={x.fullname||x.email} subtitle={`${studentCourse(x)} · ${normalizeYearLevel(x.yearLevel)||'—'} · Section ${studentSection(x)||'—'}`} meta={`${x.attempts} attempts · ${x.passed} passed · ${pct(x.average)}`}/>)}{!rows.length?<EmptyState title="No assigned student activity yet"/>:null}</Panel><SectionTitle title="Assessment coverage"/><Panel><BodyText>{questions.length} questions across {new Set(questions.map(q=>q.lessonId)).size} lessons.</BodyText></Panel></Screen>;
}

export function TeacherProfile() {
  const {firebaseUser,profile,refreshProfile,logout}=useAuth();
  const [form,setForm]=useState({fullname:profile?.fullname||'',department:profile?.department||'',title:profile?.title||'',phone:profile?.phone||'',bio:profile?.bio||''});
  const [message,setMessage]=useState('');
  const preview=useMemo(()=>({...profile,...form}),[profile,form]);
  const set=(k,v)=>setForm(x=>({...x,[k]:v}));
  async function save(){if(!form.fullname.trim()){setMessage('Enter your full name.');return;}await saveProfile(firebaseUser.uid,{...form,fullname:form.fullname.trim(),phone:form.phone.trim(),bio:form.bio.trim()});await refreshProfile();setMessage('Profile updated successfully.');}
  const leave=()=>Alert.alert('Logout','Are you sure you want to logout?',[{text:'Cancel',style:'cancel'},{text:'Logout',style:'destructive',onPress:async()=>{await logout();router.replace('/login');}}]);
  return <Screen><Header eyebrow="Profile" title="Teacher profile" text="Manage the information shown across EqualLearn."/><ProfileBlock person={preview} role="teacher"/><ProfilePhotoUploader/><SectionTitle title="Edit profile"/><Panel><Input label="Full name" value={form.fullname} onChangeText={v=>set('fullname',v)}/><Input label="Email" value={profile?.email||''} editable={false}/><Input label="Department" value={form.department} onChangeText={v=>set('department',v)}/><Input label="Title" value={form.title} onChangeText={v=>set('title',v)}/><Input label="Phone" value={form.phone} onChangeText={v=>set('phone',v)} keyboardType="phone-pad"/><Input label="Bio" value={form.bio} onChangeText={v=>set('bio',v)} multiline/><Notice type={message.includes('success')?'success':'error'}>{message}</Notice><ActionButton onPress={save}>Save profile</ActionButton></Panel><View style={{height:10}}/><ActionButton variant="secondary" onPress={()=>router.push('/settings')}>Settings</ActionButton><View style={{height:8}}/><ActionButton variant="secondary" onPress={()=>router.push('/about')}>About EqualLearn</ActionButton><View style={{height:8}}/><ActionButton variant="danger" onPress={leave}>Logout</ActionButton></Screen>;
}

function Label({children}){const{theme}=useTheme();return <Text style={[s.label,{color:theme.text}]}>{children}</Text>}
function BodyText({children}){const{theme}=useTheme();return <Text style={[s.body,{color:theme.text}]}>{children}</Text>}
function Metric({label,value}){return <View style={{marginBottom:14}}><ProgressLine value={value} label={label}/></View>;}
function Selection({rows,selected,label,onChange}){const {theme}=useTheme();return <View style={s.selection}>{rows.map(row=><Pressable key={row.id} onPress={()=>onChange(row.id)} style={[s.selectItem,{borderColor:selected===row.id?theme.primary:theme.line,backgroundColor:selected===row.id?theme.soft:theme.surface}]}><Text style={{color:theme.text,fontSize:10,fontWeight:'800'}} numberOfLines={1}>{label(row)}</Text></Pressable>)}</View>;}
const s=StyleSheet.create({rowActions:{flexDirection:'row',gap:14,alignItems:'center'},materialActions:{flexDirection:'row',gap:8,marginTop:12},label:{fontSize:10,fontWeight:'800',marginBottom:7},selection:{gap:7,marginBottom:12},selectItem:{borderWidth:1,borderRadius:12,padding:11},body:{fontSize:11,lineHeight:18}});
