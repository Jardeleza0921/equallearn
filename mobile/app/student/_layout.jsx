import { Stack } from 'expo-router';
import RoleGate from '../../src/components/RoleGate';
export default function StudentLayout(){return <RoleGate role="student"><Stack screenOptions={{headerShown:false}}/></RoleGate>}
