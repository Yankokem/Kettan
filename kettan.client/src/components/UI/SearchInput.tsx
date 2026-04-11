import { Paper, InputBase } from '@mui/material';
import type { InputBaseProps } from '@mui/material';
import SearchRoundedIcon from '@/components/icons/lucide-mui/SearchRoundedIcon';

export function SearchInput({ sx, ...props }: InputBaseProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        height: 40, // Uniform height constraint
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: 'none',
        flex: 1,
        ...sx,
      }}
    >
      <SearchRoundedIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
      <InputBase
        {...props}
        sx={{ flex: 1, fontSize: 14, fontWeight: 500 }}
      />
    </Paper>
  );
}


