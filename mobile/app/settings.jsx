import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { ActionButton, Input, Notice, Panel, Screen, SectionTitle } from '../src/components/FunctionalUI';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { auth } from '../src/lib/firebase';
import { saveProfile } from '../src/lib/data';

export default function Settings(){
  const {theme,palettes,id,setTheme}=useTheme();
  const {firebaseUser,profile,refreshProfile}=useAuth();
  const [name,setName]=useState(profile?.fullname||'');
  const [accountMessage,setAccountMessage]=useState('');
  const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirmNext,setConfirmNext]=useState(''),[security,setSecurity]=useState('');
  if(!firebaseUser)return <Redirect href="/login"/>;
  async function save(){if(!name.trim()){setAccountMessage('Enter your full name.');return;}await saveProfile(firebaseUser.uid,{fullname:name.trim()});await refreshProfile();setAccountMessage('Account information saved.');}
  async function reset(){try{await sendPasswordResetEmail(auth,firebaseUser.email);setSecurity('Password reset email sent.');}catch(e){setSecurity(e.message);}}
  async function change(){if(!current||!next||!confirmNext){setSecurity('Complete all password fields.');return;}if(next.length<6){setSecurity('New password must contain at least 6 characters.');return;}if(next!==confirmNext){setSecurity('New passwords do not match.');return;}try{await reauthenticateWithCredential(firebaseUser,EmailAuthProvider.credential(firebaseUser.email,current));await updatePassword(firebaseUser,next);setCurrent('');setNext('');setConfirmNext('');setSecurity('Password changed successfully.');}catch(e){setSecurity(e.code==='auth/invalid-credential'?'Current password is incorrect.':e.message);}}
  return <Screen><View style={s.top}><Pressable onPress={()=>router.back()} style={[s.back,{backgroundColor:theme.surface,borderColor:theme.line}]}><ArrowLeft color={theme.text} size={19}/></Pressable><Text style={[s.title,{color:theme.text}]}>Settings</Text></View><SectionTitle title="Appearance"/><View style={s.themeGrid}>{Object.values(palettes).map(p=><Pressable key={p.id} onPress={()=>setTheme(p.id)} style={[s.theme,{backgroundColor:p.surface,borderColor:id===p.id?theme.primary:p.line,borderWidth:id===p.id?2:1}]}><View style={[s.swatch,{backgroundColor:p.primary}]}/><View><Text style={{color:p.text,fontSize:11,fontWeight:'900'}}>{p.name}</Text><Text style={{color:p.muted,fontSize:8,marginTop:2}}>Tap to apply</Text></View></Pressable>)}</View><SectionTitle title="Account information"/><Panel><Input label="Full name" value={name} onChangeText={setName}/><Input label="Email" value={firebaseUser?.email||''} editable={false}/><Input label="Role" value={profile?.role||''} editable={false}/><Notice type={accountMessage.includes('saved')?'success':'error'}>{accountMessage}</Notice><ActionButton onPress={save}>Save account</ActionButton></Panel><SectionTitle title="Security"/><Panel><Input label="Current password" value={current} onChangeText={setCurrent} secureTextEntry/><Input label="New password" value={next} onChangeText={setNext} secureTextEntry/><Input label="Confirm password" value={confirmNext} onChangeText={setConfirmNext} secureTextEntry/><Notice>{security}</Notice><ActionButton onPress={change}>Change password</ActionButton><View style={{height:8}}/><ActionButton variant="secondary" onPress={reset}>Email reset link</ActionButton></Panel></Screen>;
}
const s=StyleSheet.create({top:{flexDirection:'row',alignItems:'center',gap:12,marginTop:5,marginBottom:12},back:{width:42,height:42,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'},title:{fontSize:27,fontWeight:'900',letterSpacing:-.8},themeGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},theme:{width:'48%',borderRadius:17,padding:13,flexDirection:'row',alignItems:'center',gap:10},swatch:{width:30,height:30,borderRadius:10}});
