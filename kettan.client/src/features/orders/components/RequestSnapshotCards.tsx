import type { ReactNode } from 'react';
import { Card, Grid, Stack, Typography } from '@mui/material';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';

interface RequestSnapshotCardsProps {
  totalLines: number;
  totalUnits: number;
  riskLines: number;
  estimatedCost: number;
}

interface SnapshotCardProps {
  label: string;
  value: string;
  hint: string;
  tone: 'neutral' | 'warn';
  icon: ReactNode;
}

function SnapshotCard({ label, value, hint, tone, icon }: SnapshotCardProps) {
  const borderColor = tone === 'warn' ? 'rgba(180,83,9,0.35)' : 'divider';
  const iconBg = tone === 'warn' ? 'rgba(180,83,9,0.12)' : 'rgba(107,76,42,0.10)';
  const iconColor = tone === 'warn' ? '#B45309' : '#6B4C2A';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor,
        borderRadius: 3,
        px: 2,
        py: 1.75,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Stack
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: iconBg,
            color: iconColor,
          }}
        >
          {icon}
        </Stack>
        <Stack>
          <Typography sx={{ fontSize: 11.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{hint}</Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

export function RequestSnapshotCards({ totalLines, totalUnits, riskLines, estimatedCost }: RequestSnapshotCardsProps) {
  return (
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SnapshotCard
          label="Line Items"
          value={totalLines.toString()}
          hint="Distinct SKUs in this request"
          tone="neutral"
          icon={<LayersRoundedIcon sx={{ fontSize: 18 }} />}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SnapshotCard
          label="Requested Units"
          value={totalUnits.toString()}
          hint="Total quantity across all lines"
          tone="neutral"
          icon={<ScaleRoundedIcon sx={{ fontSize: 18 }} />}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SnapshotCard
          label="At-Risk Lines"
          value={riskLines.toString()}
          hint="Insufficient or zero HQ stock"
          tone={riskLines > 0 ? 'warn' : 'neutral'}
          icon={<WarningAmberRoundedIcon sx={{ fontSize: 18 }} />}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SnapshotCard
          label="Estimated Cost"
          value={`PHP ${estimatedCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          hint="Transfer valuation (reporting only)"
          tone="neutral"
          icon={<PaidRoundedIcon sx={{ fontSize: 18 }} />}
        />
      </Grid>
    </Grid>
  );
}
