import { COURSE_SUGGESTIONS, normalizeCourse, normalizeMiddleInitial } from '../lib/data';

export function NameFields({ value, onChange, required = false, idPrefix = 'name' }) {
  const parts = value || {};
  const set = (key, next) => onChange({ ...parts, [key]: next });
  return <div className="name-grid">
    <label className="field">
      <span>First name</span>
      <input id={`${idPrefix}-first`} value={parts.firstName || ''} onChange={e => set('firstName', e.target.value)}
        autoComplete="given-name" placeholder="Juan" maxLength={60} required={required}/>
    </label>
    <label className="field">
      <span>Middle initial</span>
      <input id={`${idPrefix}-middle`} value={parts.middleInitial || ''} onChange={e => set('middleInitial', normalizeMiddleInitial(e.target.value))}
        autoComplete="additional-name" placeholder="D" maxLength={1} pattern="[A-Za-z]?" title="One letter, optional"/>
    </label>
    <label className="field">
      <span>Last name</span>
      <input id={`${idPrefix}-last`} value={parts.lastName || ''} onChange={e => set('lastName', e.target.value)}
        autoComplete="family-name" placeholder="Dela Cruz" maxLength={60} required={required}/>
    </label>
  </div>;
}

export function CourseField({ value, onChange, required = false, hint, id = 'equallearn-course-options' }) {
  return <label className="field">
    <span>Course</span>
    <input list={id} value={value || ''} onChange={e => onChange(normalizeCourse(e.target.value))}
      placeholder="e.g. BSIT" autoComplete="off" maxLength={16} required={required}/>
    <datalist id={id}>{COURSE_SUGGESTIONS.map(course => <option value={course} key={course}/>)}</datalist>
    {hint && <small>{hint}</small>}
  </label>;
}
