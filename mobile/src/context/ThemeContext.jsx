import { createContext, useContext, useMemo, useState } from 'react';

export const palettes = {
  default: { id:'default', name:'Soft Green', bg:'#e8efe9', surface:'#f3f6f2', surface2:'#dce8df', text:'#20332a', muted:'#687970', primary:'#397b5c', accent:'#65a17f', soft:'#d6e7dc', line:'#cad8cf' },
  ptc: { id:'ptc', name:'PTC Forest', bg:'#14231c', surface:'#1b3026', surface2:'#223b2f', text:'#edf3ef', muted:'#a8b7ad', primary:'#67b58a', accent:'#8fc7a7', soft:'#284736', line:'#345744' },
  purple: { id:'purple', name:'Soft Purple', bg:'#ece8f1', surface:'#f5f2f7', surface2:'#e2dceb', text:'#332e3a', muted:'#786f80', primary:'#765a93', accent:'#9a82b0', soft:'#e1d8e9', line:'#d2c7dc' },
  pink: { id:'pink', name:'Soft Pink', bg:'#f1e8eb', surface:'#f8f2f4', surface2:'#eadbe0', text:'#45343b', muted:'#7d6d73', primary:'#aa6079', accent:'#ca8ca1', soft:'#ead8de', line:'#dac8ce' },
};
const ThemeContext=createContext(null);
export function ThemeProvider({children}){const [id,setTheme]=useState('default');const value=useMemo(()=>({theme:palettes[id],id,setTheme,palettes}),[id]);return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>}
export const useTheme=()=>useContext(ThemeContext);
