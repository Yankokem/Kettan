import { Paper, InputBase } from '@mui/material';
import type { InputBaseProps } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

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
        borderColor: 'rgba(107, 76, 42, 0.3)',
        borderRadius: '14px',
        bgcolor: 'transparent',
        boxShadow: 'none',
        flex: 1,
        ...sx,
      }}
    >
      <SearchRoundedIcon sx={{ color: '#6B4C2A', mr: 1, fontSize: 20 }} />
      <InputBase
        {...props}
        sx={{ flex: 1, fontSize: 14, fontWeight: 500 }}
      />
    </Paper>
  );
}
