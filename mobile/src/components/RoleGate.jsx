import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function RoleGate({ role, children }) {
  const { firebaseUser, profile, loading } = useAuth();
  const { theme } = useTheme();
  if (loading) return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:theme.bg}}><ActivityIndicator color={theme.primary}/></View>;
  if (!firebaseUser) return <Redirect href="/login"/>;
  const actual = (profile?.role || '').toLowerCase();
  if (actual !== role) {
    if (actual === 'student') return <Redirect href="/student/home"/>;
    if (actual === 'teacher') return <Redirect href="/teacher/home"/>;
    if (actual === 'admin') return <Redirect href="/admin/home"/>;
    return <Redirect href="/login"/>;
  }
  return children;
}
