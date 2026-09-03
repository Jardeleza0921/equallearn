import { Stack } from 'expo-router';
import RoleGate from '../../src/components/RoleGate';
export default function TeacherLayout(){return <RoleGate role="teacher"><Stack screenOptions={{headerShown:false}}/></RoleGate>}
