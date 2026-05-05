import { Box, Typography, IconButton, Dialog, DialogContent } from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import { useRef, useState } from 'react';

interface ReturnMediaUploaderProps {
  files: File[];
  onChange: (newFiles: File[]) => void;
  onRemoveExisting?: (url: string) => void;
  existingUrls?: string[];
}

export function ReturnMediaUploader({ files, onChange, existingUrls = [], onRemoveExisting }: ReturnMediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelection = (newFiles: FileList) => {
    const fileArray = Array.from(newFiles).filter(file => {
        if (!file.type.startsWith('image/')) {
            alert(`File ${file.name} is not an image.`);
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert(`File ${file.name} exceeds the 10MB limit.`);
            return false;
        }
        return true;
    });
    if (fileArray.length > 0) {
        onChange([...files, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    const next = [...files];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1.5, 
          overflowX: 'auto', 
          pb: 1,
          px: 0.5,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 3 }
        }}
      >
        {/* Existing Cloudinary Images (if any) */}
        {existingUrls.map((url, idx) => (
          <Box key={`existing-${idx}`} sx={{ flexShrink: 0, width: 100 }}>
             <MediaItem 
              url={url} 
              onPreview={() => setPreviewUrl(url)} 
              onRemove={() => onRemoveExisting?.(url)} 
            />
          </Box>
        ))}

        {/* Local Draft Files */}
        {files.map((file, idx) => {
          const localUrl = URL.createObjectURL(file);
          return (
            <Box key={`draft-${idx}`} sx={{ flexShrink: 0, width: 100 }}>
              <MediaItem 
                url={localUrl} 
                onPreview={() => setPreviewUrl(localUrl)} 
                onRemove={() => removeFile(idx)} 
              />
            </Box>
          );
        })}

        {/* Add Image Button */}
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            flexShrink: 0,
            width: 100,
            aspectRatio: '1/1',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#6B4C2A',
              bgcolor: 'rgba(107,76,42,0.04)',
              '& .upload-icon': { color: '#6B4C2A', transform: 'translateY(-2px)' }
            },
          }}
        >
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            hidden 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && handleFileSelection(e.target.files)} 
          />
          <CloudUploadRoundedIcon className="upload-icon" sx={{ fontSize: 24, color: 'text.secondary', mb: 0.5, transition: 'all 0.2s ease' }} />
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
            + Image
          </Typography>
        </Box>
      </Box>

      {/* Lightbox / Preview Dialog */}
      <Dialog 
        open={Boolean(previewUrl)} 
        onClose={() => setPreviewUrl(null)}
        maxWidth="lg"
        PaperProps={{
          sx: { 
            bgcolor: 'transparent', 
            boxShadow: 'none', 
            overflow: 'visible',
            m: 2
          }
        }}
      >
        <IconButton
          onClick={() => setPreviewUrl(null)}
          sx={{
            position: 'absolute',
            right: -12,
            top: -12,
            bgcolor: '#FFFFFF',
            boxShadow: 3,
            '&:hover': { bgcolor: '#F5F5F5' },
            zIndex: 1
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {previewUrl && (
            <Box 
              component="img" 
              src={previewUrl} 
              sx={{ 
                maxWidth: '100%', 
                maxHeight: '90vh', 
                borderRadius: 2, 
                boxShadow: 24,
                objectFit: 'contain'
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

interface MediaItemProps {
  url: string;
  onPreview: () => void;
  onRemove: () => void;
}

function MediaItem({ url, onPreview, onRemove }: MediaItemProps) {
  return (
    <Box 
      sx={{ 
        position: 'relative', 
        aspectRatio: '1/1', 
        borderRadius: 2.5, 
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        '&:hover .overlay': { opacity: 1 }
      }}
    >
      <Box 
        component="img" 
        src={url} 
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
      
      {/* Hover Overlay */}
      <Box 
        className="overlay"
        sx={{ 
          position: 'absolute', 
          inset: 0, 
          bgcolor: 'rgba(0,0,0,0.4)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        <IconButton 
          size="small" 
          onClick={onPreview}
          sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <FullscreenRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={onRemove}
          sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(185,28,28,0.8)' } }}
        >
          <DeleteRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
