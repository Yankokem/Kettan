import { Box, Backdrop, styled, keyframes } from '@mui/material';

const l7 = keyframes`
  0%   { transform: translate(0,0); }
  25%  { transform: translate(100%,0); }
  50%  { transform: translate(100%,100%); }
  75%  { transform: translate(0,100%); }
  100% { transform: translate(0,0); }
`;

const LoaderContainer = styled(Box)(() => ({
  width: 120,
  height: 120,
  padding: 10,
  boxSizing: 'border-box',
  display: 'grid',
  background: '#fff',
  filter: 'blur(5px) contrast(10) hue-rotate(300deg)',
  mixBlendMode: 'darken',
  position: 'relative',
  '&::before, &::after': {
    content: '""',
    gridArea: '1/1',
    width: 50,
    height: 50,
    borderRadius: '50%',
    background: '#C9A84C', // Kettan Gold
    animation: `${l7} 2s infinite`,
  },
  '&::after': {
    background: '#6B4C2A', // Kettan Brown
    animationDelay: '-1s',
  },
}));

export const LoadingOverlay = ({ open }: { open: boolean }) => {
  return (
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.25)', // Brighter, less dim
        backdropFilter: 'blur(4px)',
      }}
      open={open}
    >
      <LoaderContainer />
    </Backdrop>
  );
};
