import { Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  return (
    <label className="theme-picker" title="Theme">
      <Palette size={17} />
      <select value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Theme">
        {themes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
  );
}
