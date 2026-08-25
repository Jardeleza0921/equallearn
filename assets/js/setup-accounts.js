import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js';

const button=document.getElementById('createDemoAccounts');
const log=document.getElementById('setupLog');
const password=document.getElementById('sharedPassword');
const accounts=[
 {email:'admin@equallearn.com', profile:{fullname:'EqualLearn Administrator',role:'admin',status:'active',department:'Administration',course:'',yearLevel:'',studentNumber:'',profileImage:''}},
 {email:'teacher@equallearn.com', profile:{fullname:'EqualLearn Teacher',role:'teacher',status:'active',department:'General Education',course:'',yearLevel:'',studentNumber:'',profileImage:''}},
 {email:'student@equallearn.com', profile:{fullname:'EqualLearn Student',role:'student',status:'active',department:'',course:'BSIT',yearLevel:'1st Year',studentNumber:'26BSIT-0001',cohort:'26',classGroupId:'26_BSIT_A',profileImage:''}}
];
const out=(m)=>{log.textContent += `\n${m}`;log.scrollTop=log.scrollHeight;};
async function loginOrCreate(email,pw){
 try{return await createUserWithEmailAndPassword(auth,email,pw);}catch(e){
   if(e.code==='auth/email-already-in-use') return await signInWithEmailAndPassword(auth,email,pw);
   throw e;
 }
}
button.addEventListener('click',async()=>{
 const pw=password.value;
 if(pw.length<6){log.textContent='Password must be at least 6 characters.';return;}
 button.disabled=true;log.textContent='Starting EqualLearn account setup...';
 try{
   for(const item of accounts){
     out(`Creating ${item.profile.role}: ${item.email}`);
     const cred=await loginOrCreate(item.email,pw);
     if(item.profile.role==='student') await setDoc(doc(db,'classGroups','26_BSIT_A'),{cohort:'26',course:'BSIT',section:'A',name:'26BSIT-A',status:'active',createdAt:serverTimestamp()},{merge:true});
     await setDoc(doc(db,'users',cred.user.uid),{uid:cred.user.uid,email:item.email,...item.profile,createdAt:serverTimestamp(),lastLogin:null},{merge:true});
     out(`✓ ${item.profile.role} ready`);
     await signOut(auth);
   }
   out('\nDONE. All three accounts are ready. Delete setup-accounts.html and assets/js/setup-accounts.js from the public repository after testing.');
 }catch(e){out(`\nERROR: ${e.code || ''} ${e.message}`);}finally{button.disabled=false;}
});
