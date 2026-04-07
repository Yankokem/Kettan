import { Link } from "@tanstack/react-router";
import { Box, Typography, Button, Grid, Paper, Container } from "@mui/material";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StoreIcon from "@mui/icons-material/Store";
import GroupsIcon from "@mui/icons-material/Groups";

const features = [
  { icon: <InventoryIcon sx={{ fontSize: 40 }} />, title: "Inventory Management", desc: "Track stock levels across all branches in real-time" },
  { icon: <LocalShippingIcon sx={{ fontSize: 40 }} />, title: "Order Fulfillment", desc: "Streamline order processing from HQ to branches" },
  { icon: <StoreIcon sx={{ fontSize: 40 }} />, title: "Branch Management", desc: "Manage multiple locations from a single dashboard" },
  { icon: <AssessmentIcon sx={{ fontSize: 40 }} />, title: "Analytics & Reports", desc: "Data-driven insights to optimize operations" },
];

const benefits = [
  "Real-time inventory tracking",
  "Multi-branch support",
  "Role-based access control",
  "Automated reorder alerts",
  "Order tracking & history",
  "Comprehensive reporting",
];

export function HomePage() {
  return (
    <Box sx={{ bgcolor: "#FAF5EF" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(160deg, #2C1A0E 0%, #4A3418 50%, #3D5029 100%)",
          color: "white",
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <LocalCafeIcon sx={{ color: "#C9A84C" }} />
                <Typography variant="overline" sx={{ color: "#C9A84C", letterSpacing: 3 }}>
                  KETTAN
                </Typography>
              </Box>
              <Typography variant="h2" fontWeight={800} sx={{ mb: 3, lineHeight: 1.2 }}>
                Café Chain Operations, Simplified
              </Typography>
              <Typography variant="h6" sx={{ color: "#C9A87D", mb: 4, fontWeight: 400 }}>
                The complete platform for managing inventory, orders, and branch operations across your coffee chain.
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: "#C9A84C",
                    color: "#2C1A0E",
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#D4B85C" },
                  }}
                >
                  Start Free Trial
                </Button>
                <Button
                  component={Link}
                  to="/features"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: "#C9A87D",
                    color: "#C9A87D",
                    px: 4,
                    py: 1.5,
                    "&:hover": { borderColor: "#C9A84C", color: "#C9A84C" },
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={8}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(201,168,125,0.2)",
                }}
              >
                <Grid container spacing={2}>
                  {[
                    { value: "50+", label: "Branches" },
                    { value: "10K+", label: "Orders" },
                    { value: "99.9%", label: "Uptime" },
                    { value: "24/7", label: "Support" },
                  ].map((stat) => (
                    <Grid size={6} key={stat.label}>
                      <Box sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h3" fontWeight={800} sx={{ color: "#C9A84C" }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#8C6B43" }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography variant="h3" fontWeight={800} align="center" sx={{ color: "#2C1A0E", mb: 2 }}>
          Everything You Need
        </Typography>
        <Typography variant="h6" align="center" sx={{ color: "#5C4A37", mb: 6, maxWidth: 600, mx: "auto" }}>
          Powerful features designed for café chain operations
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={feature.title}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: "100%",
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(107,76,42,0.12)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box sx={{ color: "#6B4C2A", mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#2C1A0E", mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: "#F5EDD8", py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h3" fontWeight={800} sx={{ color: "#2C1A0E", mb: 3 }}>
                Why Choose Kettan?
              </Typography>
              <Typography variant="body1" sx={{ color: "#5C4A37", mb: 4 }}>
                Built specifically for café and restaurant chains, Kettan helps you manage your entire operation from a single platform.
              </Typography>
              <Grid container spacing={2}>
                {benefits.map((benefit) => (
                  <Grid size={6} key={benefit}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckCircleIcon sx={{ color: "#546B3F", fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {benefit}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={4}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: "white",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <GroupsIcon sx={{ color: "#6B4C2A", fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ color: "#2C1A0E" }}>
                      Trusted by 500+ Chains
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      From small cafés to nationwide chains
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ color: "#5C4A37", fontStyle: "italic" }}>
                  "Kettan transformed how we manage our 30 branches. Orders are processed faster, inventory is always up-to-date, and our team loves the intuitive interface."
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 2, color: "#2C1A0E" }}>
                  — Maria Santos, Operations Director
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}>
        <Typography variant="h3" fontWeight={800} sx={{ color: "#2C1A0E", mb: 2 }}>
          Ready to Get Started?
        </Typography>
        <Typography variant="h6" sx={{ color: "#5C4A37", mb: 4 }}>
          Join hundreds of café chains already using Kettan
        </Typography>
        <Button
          component={Link}
          to="/register"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          sx={{
            bgcolor: "#6B4C2A",
            px: 6,
            py: 2,
            fontWeight: 700,
            fontSize: "1.1rem",
            "&:hover": { bgcolor: "#5A3D1F" },
          }}
        >
          Start Your Free Trial
        </Button>
      </Container>
    </Box>
  );
}
