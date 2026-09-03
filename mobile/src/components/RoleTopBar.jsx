import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Brand } from './UI';
import { IconButton, Row, Sheet } from './FunctionalUI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLoad } from '../hooks/useLoad';
import { formatWhen, getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/data';

export default function RoleTopBar({ profilePath }) {
  const { firebaseUser, profile } = useAuth();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const load = useLoad(() => firebaseUser ? getNotifications(firebaseUser.uid) : [], [firebaseUser?.uid]);
  const notices = load.data || [];
  const unread = notices.filter(x => x.read === false).length;
  const name = profile?.fullname || profile?.email || 'EqualLearn';
  const initials = useMemo(() => name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'E', [name]);
  async function markOne(id) { await markNotificationRead(id); load.refresh(); }
  async function markAll() { if (firebaseUser) await markAllNotificationsRead(firebaseUser.uid); load.refresh(); }
  return <>
    <View style={s.top}><Brand/><View style={s.actions}>
      <Pressable onPress={() => setOpen(true)} style={[s.bell, { backgroundColor: theme.surface, borderColor: theme.line }]}><Bell color={theme.text} size={18}/>{unread > 0 ? <View style={[s.dot, { backgroundColor: theme.primary, borderColor: theme.surface }]} /> : null}</Pressable>
      <Pressable onPress={() => router.push(profilePath)} style={[s.avatar, { backgroundColor: theme.primary }]}><Text style={s.avatarText}>{initials}</Text></Pressable>
    </View></View>
    <Sheet visible={open} title="Notifications" onClose={() => setOpen(false)}>
      {notices.length ? <><View style={s.markRow}><Pressable onPress={markAll} style={s.markAll}><Check color={theme.primary} size={15}/><Text style={{ color: theme.primary, fontWeight: '900', fontSize: 10 }}>Mark all read</Text></Pressable></View>{notices.map(n => <Row key={n.id} title={n.title || n.message || 'EqualLearn update'} subtitle={n.text || n.body || n.message || ''} meta={formatWhen(n.createdAt)} onPress={() => markOne(n.id)} left={<View style={[s.noticeDot, { backgroundColor: n.read === false ? theme.primary : theme.line }]} />} />)}</> : <View style={s.empty}><Check color={theme.primary} size={24}/><Text style={{ color: theme.text, fontWeight: '900' }}>You're all caught up.</Text><Text style={{ color: theme.muted, fontSize: 9, marginTop: 4 }}>No notifications yet.</Text></View>}
    </Sheet>
  </>;
}
const s = StyleSheet.create({top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:28},actions:{flexDirection:'row',gap:8,alignItems:'center'},bell:{width:42,height:42,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center',position:'relative'},dot:{position:'absolute',right:7,top:6,width:8,height:8,borderRadius:99,borderWidth:2},avatar:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontSize:11,fontWeight:'900'},markRow:{alignItems:'flex-end',marginBottom:6},markAll:{flexDirection:'row',alignItems:'center',gap:5,padding:7},noticeDot:{width:8,height:8,borderRadius:99},empty:{alignItems:'center',paddingVertical:35}});
