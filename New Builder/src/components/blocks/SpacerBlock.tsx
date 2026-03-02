import type { BuilderBlock, SiteTheme, BuilderBlockViewProps } from '../../types';

interface Props extends BuilderBlockViewProps {
  block: BuilderBlock;
  theme: SiteTheme;
}

export function SpacerBlock({ block }: Props) {
  const height = (block.props.height as number) ?? 48;

  return <div className="builder-block spacer-block" style={{ height: `${height}px` }} aria-hidden />;
}
