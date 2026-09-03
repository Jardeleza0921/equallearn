import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const defaults = {
  density: 'comfortable',
  cardStyle: 'soft',
  heroStyle: 'solid',
  contentWidth: 'balanced',
  cornerStyle: 'rounded',
  developerListStyle: 'bullets',
  workspacePages: {
    teacher: { eyebrow: 'Teacher workspace', title: 'Teacher dashboard', text: 'Manage learning content, students, quizzes, and class activity from one focused workspace.' },
    student: { eyebrow: 'Student home', title: 'Hello, Student.', text: 'Continue learning, review quizzes, and follow your progress from one clear student workspace.' },
  },
  developers: [
    'San Miguel, San Miguel',
    'Hallig, Jommel',
    'Santander, Aliyah',
    'Tapan, Ma. Dhiane',
    'Ordinario, Ira Mae',
  ],
  publicPages: {
    home: { eyebrow: 'Gender equality education, redesigned', title: 'Learn equality.\nBuild awareness.', text: 'EqualLearn is a modern learning space for Pateros Technological College—built to make gender equality education clear, engaging, and easier to continue anywhere.' },
    features: { eyebrow: 'Features', title: 'A focused learning platform.', text: 'EqualLearn separates the student learning experience from the teacher and administrator workspaces while keeping one consistent system.' },
    mobile: { eyebrow: 'EqualLearn Mobile', title: 'Learning designed for the phone.', text: 'The React Native + Expo application gives students a fast, native-feeling path through learning, quizzes, progress, and profile.' },
    about: { eyebrow: 'About EqualLearn', title: 'Education built around understanding.', text: 'EqualLearn is a mobile and web learning platform focused on Gender Equality Education and Awareness for Pateros Technological College.' },
    developers: { eyebrow: 'Developers', title: 'The EqualLearn development team.', text: 'The project is developed collaboratively by the following student developers.' },
  },
};

const DesignContext = createContext(null);

function mergeSaved(saved) {
  if (!saved) return defaults;
  return {
    ...defaults,
    ...saved,
    publicPages: { ...defaults.publicPages, ...(saved.publicPages || {}) },
    workspacePages: { ...defaults.workspacePages, ...(saved.workspacePages || {}) },
    developers: Array.isArray(saved.developers) && saved.developers.length ? saved.developers : defaults.developers,
    developerListStyle: ['bullets','numbers','plain'].includes(saved.developerListStyle) ? saved.developerListStyle : defaults.developerListStyle,
  };
}

export function DesignProvider({ children }) {
  const [design, setDesign] = useState(() => {
    try { return mergeSaved(JSON.parse(localStorage.getItem('equallearn-design-preview') || 'null')); }
    catch { return defaults; }
  });
  const [lastSavedAt,setLastSavedAt]=useState(()=>localStorage.getItem('equallearn-design-saved-at')||'');

  useEffect(() => {
    document.documentElement.dataset.density = design.density;
    document.documentElement.dataset.cardStyle = design.cardStyle;
    document.documentElement.dataset.heroStyle = design.heroStyle;
    document.documentElement.dataset.contentWidth = design.contentWidth;
    document.documentElement.dataset.cornerStyle = design.cornerStyle;
  }, [design]);

  const saveDesign = (next) => {
    const merged=mergeSaved(next);
    const stamp=new Date().toISOString();
    setDesign(merged);
    setLastSavedAt(stamp);
    localStorage.setItem('equallearn-design-preview', JSON.stringify(merged));
    localStorage.setItem('equallearn-design-saved-at', stamp);
  };
  const resetDesign = () => saveDesign(defaults);
  const value = useMemo(() => ({ design, saveDesign, resetDesign, defaults, lastSavedAt }), [design,lastSavedAt]);
  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export const useDesign = () => useContext(DesignContext);
