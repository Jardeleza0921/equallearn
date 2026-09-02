import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

function Root(){const {id,theme}=useTheme();return <><StatusBar style={id==='ptc'?'light':'dark'} backgroundColor={theme.bg}/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:theme.bg},animation:'fade_from_bottom'}}/></>}
export default function Layout(){return <SafeAreaProvider><ThemeProvider><Root/></ThemeProvider></SafeAreaProvider>}
