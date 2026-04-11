import type { ComponentType } from 'react';
import { SvgIcon, type SvgIconProps } from '@mui/material';
import type { LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

type LucideComponent = ComponentType<LucideProps>;

const FALLBACK_ICON = (LucideIcons.Circle as unknown) as LucideComponent;

function resolveIcon(iconName: string): LucideComponent {
  const resolved = (LucideIcons as Record<string, unknown>)[iconName] as LucideComponent | undefined;
  return resolved ?? FALLBACK_ICON;
}

export function createLucideMuiIcon(iconName: string) {
  const ResolvedIcon = resolveIcon(iconName);

  return function LucideMuiCompatIcon(props: SvgIconProps) {
    return <SvgIcon component={ResolvedIcon} inheritViewBox {...props} />;
  };
}
