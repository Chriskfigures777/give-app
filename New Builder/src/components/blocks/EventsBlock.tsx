import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

const EVENT_KEYS = [
  { title: 'event1Title', date: 'event1Date', time: 'event1Time' },
  { title: 'event2Title', date: 'event2Date', time: 'event2Time' },
  { title: 'event3Title', date: 'event3Date', time: 'event3Time' },
] as const;

const DEFAULT_EVENT = {
  title: 'Community Gathering',
  date: 'Feb 15, 2026',
  time: '6:00 PM',
};

type EventsVariant = 'default' | 'cards' | 'list' | 'minimal' | 'timeline' | 'bordered' | 'compact' | 'alternate' | 'grid' | 'featured' | 'dark' | 'centered';

export function EventsBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const title = (block.props.title as string) ?? 'Upcoming Events';
  const variant = (block.props.eventsVariant as EventsVariant) || 'default';

  const events = EVENT_KEYS.map((keys) => ({
    title: (block.props[keys.title] as string) ?? DEFAULT_EVENT.title,
    date: (block.props[keys.date] as string) ?? DEFAULT_EVENT.date,
    time: (block.props[keys.time] as string) ?? DEFAULT_EVENT.time,
  }));

  const sectionClass =
    variant === 'default' ? 'py-16 md:py-20 px-6 md:px-10 rounded-3xl border border-stone-200/60'
    : variant === 'cards' ? 'py-14 md:py-18 px-6 md:px-10 rounded-3xl shadow-lg border border-stone-100'
    : variant === 'list' ? 'py-12 md:py-16 px-6 rounded-2xl'
    : variant === 'minimal' ? 'py-10 md:py-14 px-6 rounded-xl'
    : variant === 'timeline' ? 'py-14 md:py-18 px-6 md:px-10 rounded-3xl border-l-4'
    : variant === 'bordered' ? 'py-14 md:py-18 px-8 rounded-2xl border-2'
    : variant === 'compact' ? 'py-10 md:py-12 px-6 rounded-xl'
    : variant === 'alternate' ? 'py-14 md:py-18 px-6 rounded-2xl'
    : variant === 'grid' ? 'py-14 md:py-18 px-6 rounded-3xl'
    : variant === 'featured' ? 'py-16 md:py-20 px-6 rounded-3xl shadow-xl'
    : variant === 'dark' ? 'py-16 md:py-20 px-6 md:px-10 rounded-3xl'
    : variant === 'centered' ? 'py-16 md:py-20 px-6 rounded-3xl text-center'
    : 'py-16 md:py-20 px-6 md:px-10 rounded-3xl border border-stone-200/60';

  return (
    <section
      className={`builder-block events-block ${sectionClass} transition-all duration-300 ease-out hover:shadow-lg`}
      style={{
        backgroundColor: variant === 'dark' ? c.primary : c.surface,
        color: variant === 'dark' ? '#fff' : c.text,
        borderColor: variant === 'bordered' ? c.primary : variant === 'timeline' ? c.primary : undefined,
      }}
    >
      <h2
        className={`font-bold mb-10 tracking-tight ${variant === 'compact' ? 'text-xl md:text-2xl mb-6' : 'text-2xl md:text-3xl'}`}
        style={{ fontFamily: theme.typography.headingFont, color: variant === 'dark' ? '#fff' : c.text }}
      >
        {isEdit && onUpdateProp ? (
          <EditableText
            value={title}
            onSave={(v) => onUpdateProp('title', v)}
            as="span"
            className="block"
            style={{ fontFamily: theme.typography.headingFont, color: c.text }}
          />
        ) : (
          title
        )}
      </h2>
      <div className="grid gap-5 md:grid-cols-3">
        {EVENT_KEYS.map((keys, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5 ${variant === 'compact' ? 'p-4 rounded-xl' : ''}`}
            style={{
              backgroundColor: variant === 'dark' ? 'rgba(255,255,255,0.1)' : c.background,
              borderColor: variant === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <h3
              className={`font-semibold mb-2 ${variant === 'compact' ? 'text-base' : 'text-lg'}`}
              style={{ fontFamily: theme.typography.headingFont, color: variant === 'dark' ? '#fff' : c.text }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText
                  value={events[i].title}
                  onSave={(v) => onUpdateProp(keys.title, v)}
                  as="span"
                  className="block"
                  placeholder="Event title"
                  style={{ fontFamily: theme.typography.headingFont, color: c.text }}
                />
              ) : (
                events[i].title
              )}
            </h3>
            <p
              className="text-sm md:text-base"
              style={{ color: variant === 'dark' ? 'rgba(255,255,255,0.85)' : c.textMuted, fontFamily: theme.typography.bodyFont }}
            >
              {isEdit && onUpdateProp ? (
                <>
                  <EditableText
                    value={events[i].date}
                    onSave={(v) => onUpdateProp(keys.date, v)}
                    as="span"
                    placeholder="Date"
                    style={{ color: c.textMuted }}
                  />
                  {' · '}
                  <EditableText
                    value={events[i].time}
                    onSave={(v) => onUpdateProp(keys.time, v)}
                    as="span"
                    placeholder="Time"
                    style={{ color: c.textMuted }}
                  />
                </>
              ) : (
                `${events[i].date} · ${events[i].time}`
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
