export function resolutionStyle(resolution: string) {
  const normalized = resolution.toLowerCase();

  if (normalized === 'pending' || normalized === 'underreview') {
    return { color: '#B45309', bg: 'rgba(180,83,9,0.12)' };
  }

  if (normalized === 'credited') {
    return { color: '#2563EB', bg: 'rgba(37,99,235,0.12)' };
  }

  if (normalized === 'replaced') {
    return { color: '#047857', bg: 'rgba(4,120,87,0.12)' };
  }

  if (normalized === 'rejected') {
    return { color: '#B91C1C', bg: 'rgba(185,28,28,0.12)' };
  }

  return { color: '#6B7280', bg: 'rgba(107,114,128,0.12)' };
}
