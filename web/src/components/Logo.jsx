import { BookOpen, Sparkles } from 'lucide-react';

export default function Logo({ compact = false }) {
  return (
    <div className="brand" aria-label="EqualLearn">
      <span className="brand-mark">
        <BookOpen size={compact ? 18 : 22} strokeWidth={2.3} />
        <Sparkles className="brand-spark" size={10} />
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>EQUALLEARN</strong>
          <small>Learn. Understand. Create equality.</small>
        </span>
      )}
    </div>
  );
}
