import { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  placeholder?: string;
  multiline?: boolean;
}

/** Double-click to edit text inline on the canvas. */
export function EditableText({
  value,
  onSave,
  className = '',
  style,
  as: Tag = 'span',
  placeholder = 'Double-click to edit',
  multiline = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = local.trim();
    if (trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    const inputProps = {
      ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      value: local,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLocal(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          commit();
        }
        if (e.key === 'Escape') {
          setLocal(value);
          setEditing(false);
          inputRef.current?.blur();
        }
      },
      className: `w-full min-w-[2ch] bg-white/90 border border-indigo-300 rounded px-1.5 py-0.5 text-inherit outline-none ring-2 ring-indigo-200 ${className}`,
      style: { ...style },
    };

    if (multiline) {
      return (
        <textarea
          {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
            if (e.key === 'Escape') {
              setLocal(value);
              setEditing(false);
              inputRef.current?.blur();
            }
          }}
        />
      );
    }

    return <input type="text" {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)} />;
  }

  return (
    <Tag
      className={`cursor-text rounded px-0.5 -mx-0.5 hover:bg-white/30 transition-colors ${className}`}
      style={style}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Double-click to edit"
    >
      {value || <span className="opacity-50">{placeholder}</span>}
    </Tag>
  );
}
