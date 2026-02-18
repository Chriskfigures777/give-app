import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';
import { EditableText } from '../EditableText';

type ContactFormVariant = 'default' | 'simple' | 'minimal' | 'card' | 'bordered' | 'dark' | 'inline' | 'compact' | 'centered' | 'floating' | 'split' | 'fullWidth';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

export function ContactFormBlock({ block, theme, isEdit, onUpdateProp }: Props) {
  const c = theme.colors;
  const title = (block.props.title as string) ?? 'Get in Touch';
  const subtitle =
    (block.props.subtitle as string) ?? 'We’d love to hear from you. Send us a message.';
  const nameLabel = (block.props.nameLabel as string) ?? 'Name';
  const emailLabel = (block.props.emailLabel as string) ?? 'Email';
  const messageLabel = (block.props.messageLabel as string) ?? 'Message';
  const buttonText = (block.props.buttonText as string) ?? 'Send Message';
  const variant = (block.props.contactFormVariant as ContactFormVariant) || 'default';
  const isDark = variant === 'dark';
  const isBordered = variant === 'bordered';
  const isCompact = variant === 'compact';
  const isCentered = variant === 'centered';
  const isFullWidth = variant === 'fullWidth';
  const isFloating = variant === 'floating';
  const sectionClass =
    variant === 'default' ? 'py-16 md:py-20 px-6 md:px-10 rounded-3xl shadow-lg border border-stone-200/50'
    : variant === 'simple' ? 'py-12 md:py-16 px-6 md:px-10 rounded-2xl border border-stone-200'
    : variant === 'minimal' ? 'py-10 md:py-14 px-6 rounded-xl'
    : variant === 'card' ? 'py-14 md:py-18 px-8 md:px-12 rounded-3xl shadow-xl border border-stone-100'
    : isBordered ? 'py-14 md:py-18 px-8 rounded-2xl border-2'
    : isDark ? 'py-16 md:py-20 px-6 md:px-10 rounded-3xl'
    : variant === 'inline' ? 'py-8 px-6 rounded-xl'
    : isCompact ? 'py-8 md:py-10 px-6 rounded-xl'
    : isCentered ? 'py-16 md:py-20 px-6 md:px-10 rounded-3xl shadow-lg'
    : isFloating ? 'py-14 md:py-18 px-8 rounded-3xl shadow-2xl border border-stone-200 mx-4'
    : isFullWidth ? 'py-16 md:py-20 px-6 md:px-12 rounded-none'
    : 'py-16 md:py-20 px-6 md:px-10 rounded-3xl shadow-lg border border-stone-200/50';

  return (
    <section
      className={`builder-block contact-form-block ${sectionClass} transition-all duration-300 ease-out hover:shadow-xl`}
      style={{
        backgroundColor: isDark ? c.primary : c.surface,
        color: isDark ? '#fff' : c.text,
        borderColor: isBordered ? c.primary : undefined,
      }}
    >
      <div className={`max-w-lg mx-auto ${isFullWidth ? 'max-w-none' : ''} ${isCentered ? 'text-center' : ''}`}>
        <h2
          className={`font-bold mb-4 tracking-tight ${isCompact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl lg:text-4xl'}`}
          style={{ fontFamily: theme.typography.headingFont, color: isDark ? '#fff' : c.text }}
        >
          {isEdit && onUpdateProp ? (
            <EditableText
              value={title}
              onSave={(v) => onUpdateProp('title', v)}
              as="span"
              className="block"
              placeholder="Title"
              style={{ fontFamily: theme.typography.headingFont, color: c.text }}
            />
          ) : (
            title
          )}
        </h2>
        <p
          className={`text-base md:text-lg mb-8 ${isCompact ? 'mb-6' : ''}`}
          style={{ color: isDark ? 'rgba(255,255,255,0.9)' : c.textMuted, fontFamily: theme.typography.bodyFont }}
        >
          {isEdit && onUpdateProp ? (
            <EditableText
              value={subtitle}
              onSave={(v) => onUpdateProp('subtitle', v)}
              as="span"
              placeholder="Subtitle"
              style={{ color: c.textMuted }}
            />
          ) : (
            subtitle
          )}
        </p>
        <form
          className="space-y-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label
              className="block text-sm font-semibold mb-2 tracking-tight"
              style={{ color: c.text }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText
                  value={nameLabel}
                  onSave={(v) => onUpdateProp('nameLabel', v)}
                  as="span"
                  placeholder="Name label"
                  style={{ color: c.text }}
                />
              ) : (
                nameLabel
              )}
            </label>
            <input
              type="text"
              placeholder={nameLabel}
              className="w-full px-4 py-3.5 rounded-xl border-2 text-base focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
              style={{
                borderColor: 'rgba(0,0,0,0.1)',
                backgroundColor: c.background,
                color: c.text,
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-2 tracking-tight"
              style={{ color: c.text }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText
                  value={emailLabel}
                  onSave={(v) => onUpdateProp('emailLabel', v)}
                  as="span"
                  placeholder="Email label"
                  style={{ color: c.text }}
                />
              ) : (
                emailLabel
              )}
            </label>
            <input
              type="email"
              placeholder={emailLabel}
              className="w-full px-4 py-3.5 rounded-xl border-2 text-base focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
              style={{
                borderColor: 'rgba(0,0,0,0.1)',
                backgroundColor: c.background,
                color: c.text,
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-2 tracking-tight"
              style={{ color: c.text }}
            >
              {isEdit && onUpdateProp ? (
                <EditableText
                  value={messageLabel}
                  onSave={(v) => onUpdateProp('messageLabel', v)}
                  as="span"
                  placeholder="Message label"
                  style={{ color: c.text }}
                />
              ) : (
                messageLabel
              )}
            </label>
            <textarea
              rows={4}
              placeholder={messageLabel}
              className="w-full px-4 py-3.5 rounded-xl border-2 text-base resize-y focus:outline-none focus:ring-2 focus:ring-offset-0 transition"
              style={{
                borderColor: 'rgba(0,0,0,0.1)',
                backgroundColor: c.background,
                color: c.text,
              }}
            />
          </div>
          <button
            type="submit"
            className={`font-semibold text-base text-white shadow-lg transition-all duration-200 hover:opacity-95 hover:shadow-xl ${isCompact ? 'w-full md:w-auto px-6 py-3 rounded-xl' : 'w-full md:w-auto px-8 py-4 rounded-2xl'} ${variant === 'inline' ? 'w-full' : ''}`}
            style={{ backgroundColor: isDark ? '#fff' : c.primary, color: isDark ? c.primary : '#fff' }}
          >
            {isEdit && onUpdateProp ? (
              <EditableText
                value={buttonText}
                onSave={(v) => onUpdateProp('buttonText', v)}
                as="span"
                className="text-white"
                placeholder="Button text"
              />
            ) : (
              buttonText
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
