import { useEffect, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import GrainRoundedIcon from '@mui/icons-material/GrainRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { DataTable, type ColumnDef } from '../../../components/UI/DataTable';
import {
  fetchConsumptionAnalytics,
  type TopMenuItemDto,
  type IngredientUsageDto,
  type ShiftBreakdownDto,
} from '../reportsApi';

interface Props {
  startDate: string;
  endDate: string;
  branchId?: number;
}

// ── Shift Pie (SVG donut) ─────────────────────────────────────────────────────

function ShiftDonut({ data }: { data: ShiftBreakdownDto[] }) {
  const total = data.reduce((s, d) => s + d.totalVolume, 0);
  if (total === 0) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'text.secondary', fontSize: 13 }}>
      No shift data.
    </Box>
  );

  const COLORS = ['#6B4C2A', '#C9A84C', '#546B3F', '#8C9BAE'];
  const SIZE = 160, CX = 80, CY = 80, R = 60, r = 36;

  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const pct = d.totalVolume / total;
    const start = angle;
    angle += pct * 2 * Math.PI;
    const end = angle;
    const x1 = CX + R * Math.cos(start), y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(end), y2 = CY + R * Math.sin(end);
    const ix1 = CX + r * Math.cos(start), iy1 = CY + r * Math.sin(start);
    const ix2 = CX + r * Math.cos(end), iy2 = CY + r * Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    return {
      d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`,
      color: COLORS[i % COLORS.length],
      label: d.shift,
      pct: Math.round(pct * 100),
    };
  });

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#374151">Total</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="10" fill="#6B7280">{total.toFixed(0)}</text>
      </svg>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {slices.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{s.pct}%</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function HqConsumptionAnalyticsTab({ startDate, endDate, branchId }: Props) {
  const [topMenuItems, setTopMenuItems] = useState<TopMenuItemDto[]>([]);
  const [ingredientUsage, setIngredientUsage] = useState<IngredientUsageDto[]>([]);
  const [shiftBreakdown, setShiftBreakdown] = useState<ShiftBreakdownDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchConsumptionAnalytics(startDate, endDate, branchId)
      .then((data) => {
        setTopMenuItems(data.topMenuItems);
        setIngredientUsage(data.ingredientUsage);
        setShiftBreakdown(data.shiftBreakdown);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate, branchId]);

  const menuCols: ColumnDef<TopMenuItemDto>[] = [
    {
      key: 'rank', label: '#', width: 48,
      render: (_, i) => <Typography sx={{ fontSize: 13, fontWeight: 700, color: i! < 3 ? '#C9A84C' : 'text.secondary' }}>#{(i ?? 0) + 1}</Typography>
    },
    {
      key: 'menuItemName', label: 'Menu Item',
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.menuItemName}</Typography>
    },
    {
      key: 'totalSold', label: 'Total Sold', width: 110, sortable: true, align: 'right',
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>{row.totalSold.toLocaleString()}</Typography>
    },
    {
      key: 'logCount', label: 'Log Entries', width: 110, sortable: true, align: 'right',
      render: (row) => <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{row.logCount}</Typography>
    },
  ];

  const ingredientCols: ColumnDef<IngredientUsageDto>[] = [
    {
      key: 'itemName', label: 'Ingredient',
      render: (row) => <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{row.itemName}</Typography>
    },
    {
      key: 'totalConsumed', label: 'Total Consumed', sortable: true, align: 'right',
      render: (row) => (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>
          {row.totalConsumed.toFixed(2)} {row.unit}
        </Typography>
      )
    },
  ];

  const maxMenuSold = topMenuItems.length > 0 ? Math.max(...topMenuItems.map(m => m.totalSold)) : 1;

  return (
    <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top row: top menu items bar + shift donut */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' }, gap: 2.5 }}>
        {/* Top menu items visual */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocalCafeRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>Top Consumed Menu Items</Typography>
          </Box>
          {topMenuItems.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary', py: 3, textAlign: 'center' }}>No sales consumption data for this period.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {topMenuItems.slice(0, 8).map((item, i) => (
                <Box key={item.menuItemId}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: i < 3 ? '#C9A84C' : 'text.secondary', minWidth: 20 }}>#{i + 1}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{item.menuItemName}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B4C2A' }}>{item.totalSold.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', overflow: 'hidden' }}>
                    <Box sx={{
                      height: '100%', borderRadius: 3,
                      width: `${(item.totalSold / maxMenuSold) * 100}%`,
                      background: i === 0 ? 'linear-gradient(90deg, #C9A84C, #F0D080)' : 'linear-gradient(90deg, #6B4C2A, #C9A87D)',
                      transition: 'width 0.5s ease',
                    }} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Card>

        {/* Shift breakdown donut */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2.5, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AccessTimeRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>Shift Breakdown</Typography>
          </Box>
          <ShiftDonut data={shiftBreakdown} />
          {shiftBreakdown.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              {shiftBreakdown.map(s => (
                <Box key={s.shift} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{s.shift}</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
                    {s.logCount} logs · {s.totalVolume.toFixed(0)} units
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      </Box>

      {/* Full table: menu items */}
      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalCafeRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <span>Menu Item Sales Volume</span>
          </Box>
        }
        data={topMenuItems}
        columns={menuCols}
        keyExtractor={(row) => String(row.menuItemId)}
        defaultRowsPerPage={10}
        emptyMessage="No menu item consumption data for this period."
      />

      {/* Ingredient usage table */}
      <DataTable
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GrainRoundedIcon sx={{ fontSize: 18, color: '#6B4C2A' }} />
            <span>Ingredient Usage</span>
          </Box>
        }
        data={ingredientUsage}
        columns={ingredientCols}
        keyExtractor={(row) => String(row.itemId)}
        defaultRowsPerPage={10}
        emptyMessage="No ingredient usage data for this period."
      />
    </Box>
  );
}