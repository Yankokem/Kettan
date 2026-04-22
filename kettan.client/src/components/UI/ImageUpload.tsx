import { Box, Typography, Button } from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import { useRef, useState } from 'react';

interface ImageUploadProps {
  onUpload?: (file: File) => void;
  label?: string;
  helperText?: string;
}

export function ImageUpload({ 
  onUpload, 
  label = "Upload Image", 
  helperText = "Select a PNG or JPG up to 5MB" 
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload?.(e.target.files[0]);
    }
  };

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          onUpload?.(e.dataTransfer.files[0]);
        }
      }}
      sx={{
        border: '2px dashed',
        borderColor: dragActive ? 'primary.main' : 'divider',
        bgcolor: dragActive ? 'primary.50' : 'background.paper',
        borderRadius: 3,
        py: 3,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        aspectRatio: '1/1',
        width: '100%',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
          '& .icon': { color: 'primary.main' }
        }
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        hidden
        ref={inputRef}
        onChange={handleFileChange}
      />
      <Box sx={{ mb: 2, p: 2, borderRadius: '50%', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
        <CloudUploadRoundedIcon className="icon" color="action" sx={{ fontSize: 36, transition: 'color 0.2s ease' }} />
      </Box>
      <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        {helperText}
      </Typography>
      <Button 
        variant="text" 
        size="small" 
        sx={{ mt: 3, fontWeight: 700, pointerEvents: 'none', textTransform: 'none' }}
      >
        Browse Files
      </Button>
    </Box>
  );
}
