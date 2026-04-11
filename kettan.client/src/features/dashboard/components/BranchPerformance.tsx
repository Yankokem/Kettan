import { Box, Typography, Card, LinearProgress } from '@mui/material';
import EmojiEventsRoundedIcon from '@/components/icons/lucide-mui/EmojiEventsRoundedIcon';

interface BranchScore {
  id: string;
  name: string;
  score: number;
  fulfillmentTime: string;
  accuracy: string;
}

const LEADERBOARD: BranchScore[] = [
  { id: 'b1', name: 'BGC Branch', score: 98, fulfillmentTime: '1.2 hrs', accuracy: '99%' },
  { id: 'b2', name: 'Makati HQ', score: 95, fulfillmentTime: '1.5 hrs', accuracy: '98%' },
  { id: 'b3', name: 'Ortigas Branch', score: 88, fulfillmentTime: '2.1 hrs', accuracy: '95%' },
  { id: 'b4', name: 'QC Branch', score: 76, fulfillmentTime: '3.4 hrs', accuracy: '90%' },
];

export function BranchPerformance() {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1 }}>
        <EmojiEventsRoundedIcon sx={{ color: '#D97706', fontSize: 20 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
          Branch Performance Ranking
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {LEADERBOARD.map((branch, index) => (
          <Box key={branch.id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: 'text.primary' }}>
                <Typography component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                  #{index + 1}
                </Typography>
                {branch.name}
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#6B4C2A' }}>
                {branch.score} pts
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={branch.score}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'divider',
                '& .MuiLinearProgress-bar': {
                  bgcolor: index === 0 ? '#16A34A' : branch.score < 80 ? '#DC2626' : '#6B4C2A',
                  borderRadius: 3,
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                Fulfillment: {branch.fulfillmentTime}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                Accuracy: {branch.accuracy}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
}


