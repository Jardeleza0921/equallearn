import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveProfile } from '../lib/data';
import { uploadMobileAsset } from '../lib/appwrite';
import { ActionButton, Notice, Panel } from './FunctionalUI';

export async function pickLearningAttachment() {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'image/jpeg','image/png','image/webp','application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  return result.assets?.[0] || null;
}

export function ProfilePhotoUploader() {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const [previewUri,setPreviewUri]=useState('');
  const [selected,setSelected]=useState(null);
  const [message,setMessage]=useState('');
  const [uploading,setUploading]=useState(false);

  async function choose(){
    setMessage('');
    const result=await DocumentPicker.getDocumentAsync({type:'image/*',copyToCacheDirectory:true,multiple:false});
    if(result.canceled)return;
    const asset=result.assets?.[0];
    if(!asset)return;
    if(Number(asset.size||0)>5*1024*1024){setMessage('Profile pictures must be 5 MB or smaller.');return;}
    setSelected(asset);setPreviewUri(asset.uri);
  }

  async function upload(){
    if(!selected||!firebaseUser)return;
    setUploading(true);setMessage('');
    try{
      const file=await uploadMobileAsset(selected);
      await saveProfile(firebaseUser.uid,{
        profileImage:file.viewUrl,
        profileImageFileId:file.id,
        profileImageName:file.name,
        profileImageType:file.mimeType,
      });
      await refreshProfile();
      setSelected(null);setPreviewUri('');setMessage('Profile picture uploaded successfully.');
    }catch(e){setMessage(e?.message||'Unable to upload profile picture.');}
    finally{setUploading(false);}
  }

  return <Panel style={{marginTop:10}}>
    <View style={s.head}><View style={[s.icon,{backgroundColor:theme.soft}]}><Camera color={theme.primary} size={19}/></View><View style={{flex:1}}><Text style={[s.title,{color:theme.text}]}>Profile picture</Text><Text style={[s.text,{color:theme.muted}]}>Stored in Appwrite and shared across web and mobile.</Text></View></View>
    {(previewUri||profile?.profileImage)?<Image source={{uri:previewUri||profile.profileImage}} style={s.preview}/>:null}
    {selected?<Text style={[s.file,{color:theme.muted}]} numberOfLines={1}>{selected.name}</Text>:null}
    <View style={s.actions}><ActionButton variant="secondary" style={{flex:1}} disabled={uploading} onPress={choose}>{selected?'Change photo':'Choose photo'}</ActionButton>{selected?<ActionButton style={{flex:1}} disabled={uploading} onPress={upload}>{uploading?'Uploading…':'Upload photo'}</ActionButton>:null}</View>
    <Notice type={message.includes('successfully')?'success':'error'}>{message}</Notice>
  </Panel>;
}

const s=StyleSheet.create({head:{flexDirection:'row',gap:10,alignItems:'center'},icon:{width:38,height:38,borderRadius:12,alignItems:'center',justifyContent:'center'},title:{fontSize:13,fontWeight:'900'},text:{fontSize:9,lineHeight:14,marginTop:2},preview:{width:90,height:90,borderRadius:20,marginTop:14},file:{fontSize:9,marginTop:8},actions:{flexDirection:'row',gap:8,marginTop:12}});
