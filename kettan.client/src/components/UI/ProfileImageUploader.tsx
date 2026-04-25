import { useEffect, useRef, useState } from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Button } from './Button';

interface ProfileImageUploaderProps {
  /** Existing saved image URL (from backend / Cloudinary) */
  imageUrl?: string | null;
  /** Locally selected File (not yet uploaded) */
  imageFile?: File | null;
  /** Placeholder label shown in empty state */
  label?: string;
  /** Placeholder sub-label */
  subLabel?: string;
  /** Shape of the preview box */
  shape?: 'square' | 'circle';
  /** Called when user selects a new file */
  onFileChange: (file: File | null) => void;
}

/**
 * Shared profile image uploader used across Staff, Branch, and Company Profile.
 * Handles preview from either a saved URL or a local File selection.
 * Shows Replace + Remove buttons when an image is present.
 */
export function ProfileImageUploader({
  imageUrl,
  imageFile,
  label = 'Upload Photo',
  subLabel = 'PNG or JPG up to 5MB',
  shape = 'square',
  onFileChange,
}: ProfileImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Sync imageFile to a local preview URL
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setLocalPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setLocalPreviewUrl(null);
    }
  }, [imageFile]);

  // Build preview source: prefer local file over saved URL
  const previewSrc = localPreviewUrl || imageUrl;

  const hasImage = Boolean(previewSrc);
  const borderRadius = shape === 'circle' ? '50%' : 3;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileChange(file);
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onFileChange(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      {/* Preview / Drop Zone */}
      <Box
        onClick={() => fileInputRef.current?.click()}
        sx={{
          width: '100%',
          maxWidth: 240,
          mx: 'auto',
          aspectRatio: '1 / 1',
          border: '2px dashed',
          borderColor: hasImage ? 'rgba(107,76,42,0.22)' : 'divider',
          borderRadius,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: hasImage ? '#FAF5EF' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#C9A84C',
            bgcolor: 'action.hover',
          },
        }}
      >
        {hasImage ? (
          <Box
            component="img"
            src={previewSrc!}
            alt="Profile preview"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', px: 2 }}>
            <Avatar
              sx={{
                width: 62,
                height: 62,
                mx: 'auto',
                mb: 1.4,
                bgcolor: 'rgba(107,76,42,0.14)',
                color: '#6B4C2A',
              }}
            >
              <CameraAltRoundedIcon sx={{ fontSize: 26 }} />
            </Avatar>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.35 }}>
              {subLabel}
            </Typography>
          </Box>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        hidden
        onChange={handleFileChange}
      />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<CloudUploadRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => fileInputRef.current?.click()}
        >
          {hasImage ? 'Replace' : 'Upload'}
        </Button>

        {hasImage && (
          <Button
            variant="outlined"
            startIcon={<CloseRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={handleRemove}
            sx={{
              color: '#B91C1C',
              borderColor: 'rgba(185,28,28,0.35)',
              '&:hover': {
                borderColor: '#B91C1C',
                bgcolor: 'rgba(185,28,28,0.06)',
              },
            }}
          >
            Remove
          </Button>
        )}
      </Box>
    </Box>
  );
}
