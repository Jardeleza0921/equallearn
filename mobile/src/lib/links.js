import { Alert, Linking } from 'react-native';

const PLACEHOLDERS = new Set(['n/a', 'na', 'none', 'null', 'undefined', '-', '—', 'not available']);

export function normalizeExternalUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw || PLACEHOLDERS.has(raw.toLowerCase())) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return '';
}

export function hasExternalUrl(value) {
  return Boolean(normalizeExternalUrl(value));
}

export async function openExternalUrl(value, label = 'Resource') {
  const url = normalizeExternalUrl(value);
  if (!url) {
    Alert.alert(`${label} unavailable`, 'No valid web link has been attached yet.');
    return false;
  }
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(`${label} unavailable`, 'This link cannot be opened on this device.');
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('EqualLearn external link error:', error);
    Alert.alert(`${label} unavailable`, 'EqualLearn could not open this link. Check the URL and try again.');
    return false;
  }
}
