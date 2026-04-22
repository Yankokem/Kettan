import { Box, Typography, Card, Accordion, AccordionSummary, AccordionDetails, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';

import { Button } from '../../components/UI/Button';
import { Dropdown } from '../../components/UI/Dropdown';
import { useState } from 'react';

const FAQS = [
  { question: 'How do I submit a new supply request?', answer: 'Navigate to "Supply Requests" in the sidebar and use the Create form. Enter your requested items or use the quick Select Item popup.' },
  { question: 'What happens if my order gets rejected?', answer: 'If rejected, check the remarks on the Order Detail timeline. You will need to create a new request with the required corrections.' },
  { question: 'How do I confirm delivery of supplies?', answer: 'Once HQ marks the order as "Dispatched", open the request details and click "Confirm Delivery". This officially adds the items to your branch inventory.' },
  { question: 'Who can I contact for billing issues?', answer: 'Billing issues can be reported using the contact form on this page. Select "Billing" as the issue type.' },
];

export function HelpPage() {
  const [issueType, setIssueType] = useState('technical');

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(107,76,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SupportAgentRoundedIcon sx={{ color: '#6B4C2A', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Help & Support
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            Find answers to common questions or submit a support ticket.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        
        {/* ── FAQs ── */}
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}>Frequently Asked Questions</Typography>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {FAQS.map((faq, idx) => (
              <Accordion key={idx} elevation={0} disableGutters sx={{ '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' }, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} sx={{ bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' } }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2.5, bgcolor: '#fff' }}>
                  <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.6 }}>{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>

        {/* ── Contact Form ── */}
        <Box sx={{ width: { xs: '100%', md: 400 }, flexShrink: 0 }}>
          <Card elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>Contact Support</Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
              Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Dropdown
                label="Issue Type"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as string)}
                options={[
                  { value: 'technical', label: 'Technical Issue' },
                  { value: 'billing', label: 'Billing & Payment' },
                  { value: 'operation', label: 'Operations & Process' },
                  { value: 'other', label: 'Other/General' },
                ]}
              />
              <TextField label="Subject" variant="outlined" size="small" fullWidth />
              <TextField label="Description" variant="outlined" size="small" fullWidth multiline rows={4} />
              <Button fullWidth sx={{ mt: 1 }}>Submit Ticket</Button>
            </Box>
          </Card>
        </Box>

      </Box>
    </Box>
  );
}
