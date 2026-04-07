import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Box, Typography, Button, Grid, Paper, Container, Switch, FormControlLabel, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StarIcon from "@mui/icons-material/Star";

const plans = [
  {
    id: "starter",
    name: "Starter",
    desc: "Perfect for small cafés",
    priceMonthly: 49,
    priceYearly: 39,
    features: ["Up to 3 branches", "Basic inventory", "Order management", "Email support", "5 staff accounts"],
    recommended: false,
  },
  {
    id: "professional",
    name: "Professional",
    desc: "For growing chains",
    priceMonthly: 99,
    priceYearly: 79,
    features: ["Up to 15 branches", "Advanced inventory", "Analytics & reports", "Priority support", "25 staff accounts", "API access"],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    desc: "For large operations",
    priceMonthly: null,
    priceYearly: null,
    features: ["Unlimited branches", "Custom features", "Dedicated support", "SLA guarantee", "Unlimited staff", "Custom integrations", "On-premise option"],
    recommended: false,
  },
];

const faqs = [
  { q: "Can I change plans later?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, bank transfers, and GCash/Maya for Philippine customers." },
  { q: "Is there a free trial?", a: "Yes! All plans come with a 14-day free trial. No credit card required to start." },
  { q: "What happens when I exceed my branch limit?", a: "We'll notify you and suggest upgrading. Your service won't be interrupted." },
  { q: "Do you offer discounts for NGOs?", a: "Yes, we offer 30% off for registered non-profit organizations. Contact us for details." },
];

export function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <Box sx={{ bgcolor: "#FAF5EF" }}>
      {/* Hero */}
      <Box
        sx={{
          background: "linear-gradient(160deg, #2C1A0E 0%, #4A3418 100%)",
          color: "white",
          py: { xs: 8, md: 10 },
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h2" fontWeight={800} sx={{ mb: 2 }}>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="h6" sx={{ color: "#C9A87D", mb: 4 }}>
            Choose the plan that fits your business
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={annual}
                onChange={(e) => setAnnual(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#C9A84C" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#C9A84C" },
                }}
              />
            }
            label={
              <Typography sx={{ color: annual ? "#C9A84C" : "#C9A87D" }}>
                Annual billing (save 20%)
              </Typography>
            }
          />
        </Container>
      </Box>

      {/* Pricing Cards */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, mt: -6 }}>
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => (
            <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
              <Paper
                elevation={plan.recommended ? 8 : 0}
                sx={{
                  p: 4,
                  height: "100%",
                  borderRadius: 4,
                  border: plan.recommended ? "2px solid #6B4C2A" : "1px solid",
                  borderColor: plan.recommended ? "#6B4C2A" : "divider",
                  position: "relative",
                  bgcolor: plan.recommended ? "#FFFDF9" : "white",
                }}
              >
                {plan.recommended && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      bgcolor: "#6B4C2A",
                      color: "white",
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <StarIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={700}>
                      MOST POPULAR
                    </Typography>
                  </Box>
                )}
                <Typography variant="h5" fontWeight={700} sx={{ color: "#2C1A0E", mb: 1 }}>
                  {plan.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {plan.desc}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {plan.priceMonthly ? (
                    <>
                      <Typography variant="h3" fontWeight={800} sx={{ color: "#2C1A0E" }}>
                        ₱{annual ? plan.priceYearly : plan.priceMonthly}
                        <Typography component="span" variant="body1" color="text.secondary">
                          /mo
                        </Typography>
                      </Typography>
                      {annual && (
                        <Typography variant="caption" color="text.secondary">
                          Billed annually (₱{plan.priceYearly! * 12}/year)
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="h4" fontWeight={800} sx={{ color: "#2C1A0E" }}>
                      Custom
                    </Typography>
                  )}
                </Box>
                <Box sx={{ mb: 3 }}>
                  {plan.features.map((feature) => (
                    <Box key={feature} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <CheckIcon sx={{ color: "#546B3F", fontSize: 18 }} />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Box>
                {plan.priceMonthly ? (
                  <Button
                    component={Link}
                    to={`/register?plan=${plan.id}` as "/register"}
                    fullWidth
                    variant={plan.recommended ? "contained" : "outlined"}
                    size="large"
                    sx={
                      plan.recommended
                        ? { bgcolor: "#6B4C2A", "&:hover": { bgcolor: "#5A3D1F" } }
                        : { borderColor: "#6B4C2A", color: "#6B4C2A" }
                    }
                  >
                    Start Free Trial
                  </Button>
                ) : (
                  <Button
                    href="mailto:sales@kettan.io"
                    fullWidth
                    variant="outlined"
                    size="large"
                    sx={{ borderColor: "#6B4C2A", color: "#6B4C2A" }}
                  >
                    Contact Sales
                  </Button>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FAQ */}
      <Box sx={{ bgcolor: "#F5EDD8", py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={800} align="center" sx={{ color: "#2C1A0E", mb: 6 }}>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, i) => (
            <Accordion
              key={i}
              elevation={0}
              sx={{
                mb: 2,
                borderRadius: 2,
                "&:before": { display: "none" },
                bgcolor: "white",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>
    </Box>
  );
}
