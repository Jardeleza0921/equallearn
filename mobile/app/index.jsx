import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
export default function Index(){const{firebaseUser,profile,loading}=useAuth(),{theme}=useTheme();if(loading)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:theme.bg}}><ActivityIndicator color={theme.primary}/></View>;if(!firebaseUser)return <Redirect href="/login"/>;const role=(profile?.role||'').toLowerCase();if(role==='student')return <Redirect href="/student/home"/>;if(role==='teacher')return <Redirect href="/teacher/home"/>;if(role==='admin')return <Redirect href="/admin/home"/>;return <Redirect href="/login"/>;}
