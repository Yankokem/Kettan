import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';

import { ViewToggle } from '../../../components/UI/ViewToggle';

export type OrdersListViewMode = 'card' | 'table';

interface OrdersListViewSwitcherProps {
  value: OrdersListViewMode;
  onChange: (value: OrdersListViewMode) => void;
}

export function OrdersListViewSwitcher({ value, onChange }: OrdersListViewSwitcherProps) {
  return (
    <ViewToggle
      value={value}
      onChange={onChange}
      options={[
        { value: 'card', label: 'Card', icon: <ViewModuleRoundedIcon sx={{ fontSize: 16 }} /> },
        { value: 'table', label: 'Table', icon: <TableRowsRoundedIcon sx={{ fontSize: 16 }} /> },
      ]}
    />
  );
}
