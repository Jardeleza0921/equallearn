import { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveProfile } from '../lib/data';
import { uploadWebFile } from '../lib/appwrite';

function initialsFor(profile){
  const source=profile?.fullname || profile?.email || 'EL';
  return source.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'EL';
}

export default function ProfileAvatar({ size='md', editable=false, profileOverride=null }){
  const { profile, firebaseUser, refreshProfile }=useAuth();
  const current=profileOverride || profile;
  const photo=current?.profileImage || '';
  const initials=initialsFor(current);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');

  async function saveFile(file){
    if(!file || !firebaseUser || profileOverride) return;
    if(!file.type?.startsWith('image/')){ setError('Choose an image file.'); return; }
    if(file.size>5*1024*1024){ setError('Profile pictures must be 5 MB or smaller.'); return; }
    setUploading(true); setError('');
    try{
      const uploaded=await uploadWebFile(file);
      await saveProfile(firebaseUser.uid,{
        profileImage: uploaded.viewUrl,
        profileImageFileId: uploaded.id,
        profileImageName: uploaded.name,
        profileImageType: uploaded.mimeType,
      });
      await refreshProfile();
    }catch(e){ setError(e?.message||'Unable to upload profile picture.'); }
    finally{ setUploading(false); }
  }

  async function remove(){
    if(!firebaseUser || profileOverride) return;
    setUploading(true); setError('');
    try{
      await saveProfile(firebaseUser.uid,{profileImage:'',profileImageFileId:'',profileImageName:'',profileImageType:''});
      await refreshProfile();
    }catch(e){ setError(e?.message||'Unable to remove profile picture.'); }
    finally{ setUploading(false); }
  }

  return <div className={`profile-avatar-wrap ${editable?'editable':''}`}>
    <div className={`profile-avatar ${size}`}>
      {photo?<img src={photo} alt="Profile"/>:<span>{initials}</span>}
    </div>
    {editable&&!profileOverride&&<div className="profile-photo-actions">
      <label className={`btn ghost small ${uploading?'disabled':''}`}>
        <Camera size={15}/> {uploading?'Uploading…':'Choose photo'}
        <input type="file" accept="image/*" hidden disabled={uploading} onChange={e=>saveFile(e.target.files?.[0])}/>
      </label>
      {photo&&<button type="button" className="icon-btn danger-soft" disabled={uploading} onClick={remove} title="Remove profile photo"><Trash2 size={15}/></button>}
      {error&&<small className="upload-error">{error}</small>}
    </div>}
  </div>;
}
