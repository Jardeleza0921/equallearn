import { Check, Moon, Palette, Sparkles, SunMedium } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const icons = { default: SunMedium, ptc: Moon, purple: Sparkles, pink: Palette };
const colorMap = {
  default: ['#397b5c','#dce8df'],
  ptc: ['#67b58a','#223b2f'],
  purple: ['#765a93','#e2dceb'],
  pink: ['#aa6079','#eadbe0'],
};

export default function ThemePicker({ compact=false }) {
  const { theme, setTheme, themes } = useTheme();
  return <div className={`theme-options ${compact?'compact':''}`} aria-label="Choose theme">
    {themes.map(item=>{
      const Icon=icons[item.id]||Palette;
      const [main,soft]=colorMap[item.id];
      return <button key={item.id} type="button" title={item.label} aria-pressed={theme===item.id} className={`theme-option ${theme===item.id?'active':''}`} onClick={()=>setTheme(item.id)}>
        <span className="theme-swatch" style={{background:`linear-gradient(135deg,${main} 0 50%,${soft} 50% 100%)`}}><Icon size={compact?12:16}/></span>
        {!compact&&<span className="theme-copy"><strong>{item.label}</strong><small>{item.id==='ptc'?'Dark forest':item.id==='default'?'Soft sage':item.id==='purple'?'Lavender': 'Rose'}</small></span>}
        {!compact&&theme===item.id&&<Check className="theme-check" size={16}/>} 
      </button>
    })}
  </div>;
}
