import { Box, Backdrop, styled, keyframes } from '@mui/material';

const orbit = keyframes`
  0%   { transform: translate(0px, 0px); }
  25%  { transform: translate(28px, -20px); }
  50%  { transform: translate(0px, -40px); }
  75%  { transform: translate(-28px, -20px); }
  100% { transform: translate(0px, 0px); }
`;

const orbitReverse = keyframes`
  0%   { transform: translate(0px, 0px); }
  25%  { transform: translate(-28px, 20px); }
  50%  { transform: translate(0px, 40px); }
  75%  { transform: translate(28px, 20px); }
  100% { transform: translate(0px, 0px); }
`;





const CreamDot = styled(Box)(() => ({
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: '#FAF5EF',
  position: 'absolute',
  animation: `${orbit} 2s cubic-bezier(0.45, 0, 0.55, 1) infinite`,
  boxShadow: '0 0 0 1.5px rgba(107,76,42,0.18), 0 2px 16px 6px rgba(107,76,42,0.1)',
}));

const BrownDot = styled(Box)(() => ({
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: '#6B4C2A',
  position: 'absolute',
  animation: `${orbitReverse} 2s cubic-bezier(0.45, 0, 0.55, 1) infinite`,
  animationDelay: '-0s',
  boxShadow: '0 0 20px 8px rgba(107,76,42,0.4)',
}));

const Stage = styled(Box)(() => ({
  position: 'relative',
  width: 100,
  height: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const LoadingOverlay = ({ open }: { open: boolean }) => {
  return (
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1000,
        backgroundColor: 'rgba(250, 245, 239, 0.12)',
        backdropFilter: 'blur(3px)',
      }}
      open={open}
    >
      <Stage>
        <CreamDot />
        <BrownDot />
      </Stage>
    </Backdrop>
  );
};