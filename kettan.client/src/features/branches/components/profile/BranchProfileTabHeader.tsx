import { Box } from '@mui/material';
import type { BranchProfileTabKey } from '../../types';
import type { BranchTabDefinition } from '../../branchProfileData';

interface BranchProfileTabHeaderProps {
  tabs: BranchTabDefinition[];
  activeTab: BranchProfileTabKey;
  onTabChange: (nextTab: BranchProfileTabKey) => void;
  badgeMap?: Partial<Record<BranchProfileTabKey, string | number>>;
}

export function BranchProfileTabHeader({ tabs, activeTab, onTabChange, badgeMap }: BranchProfileTabHeaderProps) {
  return (
    <Box
      sx={{
        px: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        const Icon = tab.icon;
        const badge = badgeMap?.[tab.key];

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: active ? '#6B4C2A' : '#78716C',
              fontWeight: active ? 700 : 600,
              fontSize: 13,
              whiteSpace: 'nowrap',
              padding: '14px 16px',
            }}
          >
            <Icon sx={{ fontSize: 15 }} />
            {tab.label}
            {typeof badge !== 'undefined' ? ` (${badge})` : ''}

            {active ? (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2.5,
                  borderTopLeftRadius: 999,
                  borderTopRightRadius: 999,
                  backgroundColor: '#C9A84C',
                  display: 'block',
                }}
              />
            ) : null}
          </button>
        );
      })}
    </Box>
  );
}
