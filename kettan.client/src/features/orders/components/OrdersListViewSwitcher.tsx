import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export type OrdersListViewMode = 'card' | 'table';

interface OrdersListViewSwitcherProps {
  value: OrdersListViewMode;
  onChange: (value: OrdersListViewMode) => void;
  allowCard?: boolean;
}

export function OrdersListViewSwitcher({ value, onChange, allowCard = true }: OrdersListViewSwitcherProps) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_event, nextValue: OrdersListViewMode | null) => {
        if (nextValue) {
          onChange(nextValue);
        }
      }}
      size="small"
      sx={{
        height: 40,
        borderRadius: 2,
        '& .MuiToggleButton-root': {
          px: 1.4,
          borderColor: 'rgba(107, 76, 42, 0.3)',
          color: '#6B4C2A',
          '&.Mui-selected': {
            bgcolor: 'rgba(107, 76, 42, 0.12)',
            color: '#4A3424',
          },
        },
      }}
    >
      {allowCard ? (
        <ToggleButton value="card" aria-label="Card view">
          <ViewModuleRoundedIcon sx={{ fontSize: 16 }} />
        </ToggleButton>
      ) : null}
      <ToggleButton value="table" aria-label="Table view">
        <TableRowsRoundedIcon sx={{ fontSize: 16 }} />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
