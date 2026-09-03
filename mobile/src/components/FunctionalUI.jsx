import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Progress } from './UI';

export const pct = v => `${Math.max(0, Math.min(100, Math.round(Number(v) || 0)))}%`;
export const cap = v => String(v || '').charAt(0).toUpperCase() + String(v || '').slice(1);
export const hay = (...v) => v.filter(Boolean).join(' ').toLowerCase();

export function Screen({ children, refreshControl, contentStyle }) {
  const { theme } = useTheme();
  return <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
    <ScrollView keyboardShouldPersistTaps="handled" refreshControl={refreshControl} contentContainerStyle={[s.content, contentStyle]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
  </SafeAreaView>;
}

export function Header({ eyebrow, title, text, right }) {
  const { theme } = useTheme();
  return <View style={s.header}><View style={{ flex: 1 }}>{eyebrow ? <Text style={[s.eyebrow, { color: theme.primary }]}>{eyebrow.toUpperCase()}</Text> : null}<Text style={[s.title, { color: theme.text }]}>{title}</Text>{text ? <Text style={[s.subtitle, { color: theme.muted }]}>{text}</Text> : null}</View>{right}</View>;
}

export function SectionTitle({ label, title, right }) {
  const { theme } = useTheme();
  return <View style={s.sectionHead}><View style={{ flex: 1 }}>{label ? <Text style={[s.eyebrow, { color: theme.primary }]}>{label.toUpperCase()}</Text> : null}<Text style={[s.sectionTitle, { color: theme.text }]}>{title}</Text></View>{right}</View>;
}

export function LoadingState({ text = 'Loading EqualLearn…' }) {
  const { theme } = useTheme();
  return <SafeAreaView style={[s.center, { backgroundColor: theme.bg }]}><ActivityIndicator color={theme.primary} /><Text style={[s.centerText, { color: theme.muted }]}>{text}</Text></SafeAreaView>;
}
export function ErrorState({ message, onRetry }) {
  const { theme } = useTheme();
  return <SafeAreaView style={[s.center, { backgroundColor: theme.bg }]}><Text style={[s.errorTitle, { color: theme.text }]}>Unable to load this page</Text><Text style={[s.centerText, { color: theme.muted }]}>{message}</Text>{onRetry ? <ActionButton onPress={onRetry}>Retry</ActionButton> : null}</SafeAreaView>;
}
export function EmptyState({ title = 'Nothing here yet', text }) {
  const { theme } = useTheme();
  return <View style={s.empty}><CheckCircle2 color={theme.primary} size={25}/><Text style={[s.emptyTitle, { color: theme.text }]}>{title}</Text>{text ? <Text style={[s.emptyText, { color: theme.muted }]}>{text}</Text> : null}</View>;
}

export function Panel({ children, style }) {
  const { theme } = useTheme();
  return <View style={[s.panel, { backgroundColor: theme.surface, borderColor: theme.line }, style]}>{children}</View>;
}

export function StatCard({ label, value, detail, Icon }) {
  const { theme } = useTheme();
  return <Panel style={s.stat}><View style={[s.statIcon, { backgroundColor: theme.soft }]}>{Icon ? <Icon color={theme.primary} size={18}/> : null}</View><View style={{ flex: 1 }}><Text style={[s.statLabel, { color: theme.muted }]}>{label}</Text><Text style={[s.statValue, { color: theme.text }]}>{value}</Text>{detail ? <Text style={[s.statDetail, { color: theme.muted }]}>{detail}</Text> : null}</View></Panel>;
}

export function ActionButton({ children, onPress, variant = 'primary', disabled = false, style }) {
  const { theme } = useTheme();
  const bg = variant === 'primary' ? theme.primary : variant === 'danger' ? '#a34f64' : theme.surface2;
  const color = variant === 'primary' || variant === 'danger' ? '#fff' : theme.text;
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, { backgroundColor: bg, opacity: disabled ? .5 : pressed ? .82 : 1 }, style]}><Text style={[s.actionText, { color }]}>{children}</Text></Pressable>;
}

export function IconButton({ children, onPress, danger = false, style }) {
  const { theme } = useTheme();
  return <Pressable onPress={onPress} style={({ pressed }) => [s.iconButton, { backgroundColor: theme.surface, borderColor: theme.line, opacity: pressed ? .75 : 1 }, style]}>{children}</Pressable>;
}

export function Input({ label, value, onChangeText, placeholder, multiline = false, editable = true, keyboardType, autoCapitalize, secureTextEntry, maxLength }) {
  const { theme } = useTheme();
  return <View style={s.field}>{label ? <Text style={[s.fieldLabel, { color: theme.text }]}>{label}</Text> : null}<TextInput value={String(value ?? '')} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.muted} multiline={multiline} editable={editable} keyboardType={keyboardType} autoCapitalize={autoCapitalize} secureTextEntry={secureTextEntry} maxLength={maxLength} style={[s.input, multiline && s.textarea, !editable && { opacity: .65 }, { color: theme.text, backgroundColor: theme.bg, borderColor: theme.line }]} /></View>;
}

export function ChoiceRow({ options, value, onChange }) {
  const { theme } = useTheme();
  return <View style={s.choiceWrap}>{options.map(option => { const item = typeof option === 'string' ? { value: option, label: option } : option; const active = value === item.value; return <Pressable key={item.value} onPress={() => onChange(item.value)} style={[s.choice, { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.line }]}><Text style={{ color: active ? '#fff' : theme.text, fontSize: 10, fontWeight: '800' }}>{item.label}</Text></Pressable>; })}</View>;
}

export function SearchInput({ value, onChangeText, placeholder = 'Search…' }) {
  return <Input value={value} onChangeText={onChangeText} placeholder={placeholder} />;
}

export function Row({ title, subtitle, meta, onPress, left, right, danger = false }) {
  const { theme } = useTheme();
  const body = <View style={[s.row, { borderBottomColor: theme.line }]}>{left}<View style={{ flex: 1 }}><Text style={[s.rowTitle, { color: danger ? '#a34f64' : theme.text }]}>{title}</Text>{subtitle ? <Text style={[s.rowSub, { color: theme.muted }]}>{subtitle}</Text> : null}{meta ? <Text style={[s.rowMeta, { color: theme.muted }]}>{meta}</Text> : null}</View>{right || (onPress ? <ChevronRight color={theme.muted} size={17}/> : null)}</View>;
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export function ProgressLine({ value, label }) {
  const { theme } = useTheme();
  return <View style={{ gap: 6 }}>{label ? <View style={s.between}><Text style={[s.small, { color: theme.muted }]}>{label}</Text><Text style={[s.smallStrong, { color: theme.text }]}>{pct(value)}</Text></View> : null}<Progress value={value}/></View>;
}

export function Notice({ children, type = 'info' }) {
  const { theme } = useTheme();
  if (!children) return null;
  const color = type === 'error' ? '#a34f64' : type === 'success' ? theme.primary : theme.text;
  const bg = type === 'error' ? 'rgba(163,79,100,.10)' : theme.soft;
  return <View style={[s.notice, { backgroundColor: bg }]}><Text style={[s.noticeText, { color }]}>{children}</Text></View>;
}

export function Sheet({ visible, title, onClose, children, tall = false }) {
  const { theme } = useTheme();
  return <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}><View style={s.backdrop}><Pressable style={{ flex: 1 }} onPress={onClose}/><View style={[s.sheet, tall && s.sheetTall, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={s.sheetHead}><Text style={[s.sheetTitle, { color: theme.text }]}>{title}</Text><IconButton onPress={onClose}><X color={theme.text} size={18}/></IconButton></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>{children}</ScrollView></View></View></Modal>;
}

export function ProfileBlock({ person, role, actions }) {
  const { theme } = useTheme();
  const name = person?.fullname || person?.email || 'EqualLearn user';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'E';
  return <Panel><View style={s.profileTop}>{person?.profileImage ? <Image source={{ uri: person.profileImage }} style={s.profileImage}/> : <View style={[s.profileImage, s.profileFallback, { backgroundColor: theme.primary }]}><Text style={s.profileInitials}>{initials}</Text></View>}<View style={{ flex: 1 }}><Text style={[s.profileName, { color: theme.text }]}>{name}</Text><Text style={[s.profileMeta, { color: theme.muted }]}>{cap(role || person?.role || 'user')}</Text></View></View><View style={s.factGrid}>{([['Role', cap(role || person?.role || 'user')], ...(((role || person?.role || '').toLowerCase()==='student') ? [['Course', String(person?.course || 'BSIT').toUpperCase()], ['Year Level', person?.yearLevel || '—']] : []), ['Section', person?.section || person?.cohort || '—'], ['Email', person?.email || '—'], ['Phone', person?.phone || '—']]).map(([k,v]) => <View style={s.fact} key={k}><Text style={[s.factLabel, { color: theme.muted }]}>{k}</Text><Text style={[s.factValue, { color: theme.text }]}>{v}</Text></View>)}</View><View style={{ marginTop: 14 }}><Text style={[s.factLabel, { color: theme.muted }]}>Bio</Text><Text style={[s.bio, { color: theme.text }]}>{person?.bio || 'No bio added yet.'}</Text></View>{actions ? <View style={s.actionsRow}>{actions}</View> : null}</Panel>;
}

const s = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 18, paddingBottom: 36 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 }, centerText: { textAlign: 'center', fontSize: 11, lineHeight: 17 }, errorTitle: { fontSize: 16, fontWeight: '900' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 5, marginBottom: 22 }, eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, title: { fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: 6 }, subtitle: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 22, marginBottom: 10 }, sectionTitle: { fontSize: 19, fontWeight: '900', marginTop: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }, emptyTitle: { fontSize: 12, fontWeight: '900', marginTop: 8 }, emptyText: { fontSize: 9, marginTop: 3, textAlign: 'center' },
  panel: { borderWidth: 1, borderRadius: 20, padding: 16 }, stat: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 }, statIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, statLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .6 }, statValue: { fontSize: 22, fontWeight: '900', marginTop: 2 }, statDetail: { fontSize: 8, marginTop: 2 },
  action: { minHeight: 44, paddingHorizontal: 15, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, actionText: { fontSize: 11, fontWeight: '900' }, iconButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: 11 }, fieldLabel: { fontSize: 10, fontWeight: '800', marginBottom: 6 }, input: { minHeight: 47, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 12 }, textarea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 }, choice: { borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 100 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth }, rowTitle: { fontSize: 12, fontWeight: '900' }, rowSub: { fontSize: 9, lineHeight: 14, marginTop: 3 }, rowMeta: { fontSize: 8, marginTop: 3 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, small: { fontSize: 9 }, smallStrong: { fontSize: 9, fontWeight: '900' }, notice: { padding: 11, borderRadius: 12, marginVertical: 8 }, noticeText: { fontSize: 10, lineHeight: 15, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.42)', justifyContent: 'flex-end' }, sheet: { maxHeight: '78%', minHeight: 220, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 18 }, sheetTall: { maxHeight: '92%' }, sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, sheetTitle: { fontSize: 20, fontWeight: '900' },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 13 }, profileImage: { width: 68, height: 68, borderRadius: 21, overflow: 'hidden' }, profileFallback: { alignItems: 'center', justifyContent: 'center' }, profileInitials: { color: '#fff', fontSize: 21, fontWeight: '900' }, profileName: { fontSize: 18, fontWeight: '900' }, profileMeta: { fontSize: 9, marginTop: 3, textTransform: 'uppercase' }, factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 }, fact: { width: '48%' }, factLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: .5 }, factValue: { fontSize: 10, fontWeight: '800', marginTop: 3 }, bio: { fontSize: 10, lineHeight: 16, marginTop: 4 }, actionsRow: { flexDirection: 'row', gap: 8, marginTop: 15 },
});
