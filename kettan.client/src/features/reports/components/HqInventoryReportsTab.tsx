import { useEffect, useState } from 'react';
import { Box, Card, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton } from '@mui/material';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import {
  fetchBranchValuations,
  fetchInventoryByCategory,
  type BranchInventoryValuationDto,
  type CategoryInventoryValuationDto,
} from '../reportsApi';

interface Props {
  startDate: string;
  endDate: string;
}

const COLORS = ['#6B4C2A', '#C9A84C', '#8C9BAE', '#546B3F', '#D2A18C', '#A87C52', '#8F583B'];

function toPeso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function HqInventoryReportsTab({ startDate, endDate }: Props) {
  const [categoryData, setCategoryData] = useState<CategoryInventoryValuationDto[]>([]);
  const [branchData, setBranchData] = useState<BranchInventoryValuationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchInventoryByCategory(),
      fetchBranchValuations(),
    ])
      .then(([cat, br]) => {
        setCategoryData(cat);
        setBranchData(br);
      })
      .catch((err) => {
        console.error('Error fetching inventory reports data:', err);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const pieChartData = categoryData.map(c => ({
    name: c.categoryName,
    value: Number(c.totalValuation),
    totalItems: c.totalItems,
    totalVolume: c.totalVolume
  }));

  const barChartData = branchData.map(b => ({
    name: b.branchName,
    value: Number(b.totalValuation),
    skus: b.totalSkus,
    volume: b.totalVolume
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card elevation={4} sx={{ p: 1.5, bgcolor: '#FCF9F6', border: '1px solid', borderColor: '#C9A84C', borderRadius: '8px' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B4C2A', mb: 0.5 }}>{payload[0].name}</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: 'text.primary' }}>
            {toPeso(payload[0].value)}
          </Typography>
          {payload[0].payload.skus !== undefined && (
            <Typography sx={{ fontSize: 10.5, color: 'text.secondary', mt: 0.25 }}>
              {payload[0].payload.skus} SKUs • {payload[0].payload.volume.toLocaleString()} Vol
            </Typography>
          )}
          {payload[0].payload.totalItems !== undefined && (
            <Typography sx={{ fontSize: 10.5, color: 'text.secondary', mt: 0.25 }}>
              {payload[0].payload.totalItems} Items • {payload[0].payload.totalVolume.toLocaleString()} Vol
            </Typography>
          )}
        </Card>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={0} sx={{ p: 3, borderRadius: '14px', border: '1px solid', borderColor: 'divider', height: 450 }}>
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
              <Skeleton variant="circular" width={220} height={220} />
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={0} sx={{ p: 3, borderRadius: '14px', border: '1px solid', borderColor: 'divider', height: 450 }}>
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 320, gap: 2 }}>
              <Skeleton variant="rectangular" width={50} height={120} />
              <Skeleton variant="rectangular" width={50} height={200} />
              <Skeleton variant="rectangular" width={50} height={80} />
            </Box>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {/* Category Inventory Valuation (Pie Chart & Summary Table) */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card elevation={0} sx={{ p: 3, borderRadius: '14px', border: '1px solid', borderColor: 'divider', bgcolor: '#FCF9F6', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <CategoryRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary' }}>Valuation by Category</Typography>
          </Box>

          <Grid container spacing={2} sx={{ flexGrow: 1, alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ height: 220, position: 'relative' }}>
                {pieChartData.length === 0 ? (
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: 13 }}>No Category Data</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: 'none', cursor: 'pointer' }} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Grid>

            {/* List breakdown */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TableContainer sx={{ maxHeight: 240, overflowY: 'auto' }}>
                <Table size="small">
                  <TableBody>
                    {categoryData.map((row, index) => (
                      <TableRow key={row.categoryId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ py: 0.75, px: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                            {row.categoryName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 0.75, px: 1 }}>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#6B4C2A' }}>
                            {toPeso(Number(row.totalValuation))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Card>
      </Grid>

      {/* Branch Inventory Valuation (Bar Chart & Comparison Table) */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card elevation={0} sx={{ p: 3, borderRadius: '14px', border: '1px solid', borderColor: 'divider', bgcolor: '#FCF9F6', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <InventoryRoundedIcon sx={{ color: '#6B4C2A', fontSize: 20 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.primary' }}>Valuation by Branch</Typography>
          </Box>

          <Box sx={{ height: 220, width: '100%', mb: 2 }}>
            {barChartData.length === 0 ? (
              <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: 13 }}>No Branch Valuation Data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 76, 42, 0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#6B4C2A', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'text.secondary' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  >
                    {barChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#6B4C2A"
                        style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                        onMouseEnter={(e: any) => {
                          e.target.style.fill = '#C9A84C';
                        }}
                        onMouseLeave={(e: any) => {
                          e.target.style.fill = '#6B4C2A';
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>

          <TableContainer sx={{ border: '1px solid', borderColor: 'rgba(107, 76, 42, 0.08)', borderRadius: '8px', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(107, 76, 42, 0.03)' }}>
                <TableRow>
                  <TableCell sx={{ py: 1, px: 1.5 }}><Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6B4C2A' }}>Branch</Typography></TableCell>
                  <TableCell align="right" sx={{ py: 1, px: 1.5 }}><Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6B4C2A' }}>SKUs</Typography></TableCell>
                  <TableCell align="right" sx={{ py: 1, px: 1.5 }}><Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6B4C2A' }}>Volume</Typography></TableCell>
                  <TableCell align="right" sx={{ py: 1, px: 1.5 }}><Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6B4C2A' }}>Valuation</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branchData.map((row) => (
                  <TableRow key={row.branchId} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(107, 76, 42, 0.02)' } }}>
                    <TableCell sx={{ py: 1, px: 1.5 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>{row.branchName}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1, px: 1.5 }}>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{row.totalSkus}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1, px: 1.5 }}>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{row.totalVolume.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1, px: 1.5 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B4C2A' }}>{toPeso(Number(row.totalValuation))}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
}