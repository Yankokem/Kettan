import { Box } from '@mui/material';
import type { BranchProfileTabKey } from '../../types';
import type { BranchTabDefinition } from '../../branchProfileData';

interface BranchProfileTabHeaderProps {
  tabs: BranchTabDefinition[];
  activeTab: BranchProfileTabKey;
  onTabChange: (nextTab: BranchProfileTabKey) => void;
  badgeMap?: Partial<Record<BranchProfileTabKey, string | number>>;
  loading?: boolean;
}

export function BranchProfileTabHeader({ tabs, activeTab, onTabChange, badgeMap, loading = false }: BranchProfileTabHeaderProps) {
  return (
    <Box
      sx={{
        px: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflowX: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
      {loading ? (
        <Box sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              border: '2px solid rgba(201,168,76,0.2)',
              borderTopColor: '#C9A84C',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#A8A29E', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Syncing</span>
        </Box>
      ) : null}
    </Box>
  );
}
