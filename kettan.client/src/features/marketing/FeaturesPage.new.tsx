import { Link } from "@tanstack/react-router";
import { Box, Typography, Button, Grid, Paper, Container } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StoreIcon from "@mui/icons-material/Store";
import GroupsIcon from "@mui/icons-material/Groups";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const features = [
  {
    icon: <InventoryIcon sx={{ fontSize: 48 }} />,
    title: "Real-Time Inventory",
    desc: "Track stock levels across all branches with live updates. Know exactly what's available, what's running low, and when to reorder.",
    highlights: ["Live stock tracking", "Low stock alerts", "Batch tracking"],
  },
  {
    icon: <LocalShippingIcon sx={{ fontSize: 48 }} />,
    title: "Order Fulfillment",
    desc: "Streamline the entire order process from branch requests to HQ fulfillment and delivery tracking.",
    highlights: ["Branch requests", "Order processing", "Delivery tracking"],
  },
  {
    icon: <StoreIcon sx={{ fontSize: 48 }} />,
    title: "Multi-Branch Management",
    desc: "Manage all your locations from a single dashboard. View performance, inventory, and orders across your entire network.",
    highlights: ["Centralized dashboard", "Branch comparison", "Location analytics"],
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 48 }} />,
    title: "Staff Management",
    desc: "Manage employees, assign roles, and control access across your organization with flexible permissions.",
    highlights: ["Role-based access", "Staff directory", "Activity logs"],
  },
  {
    icon: <AssessmentIcon sx={{ fontSize: 48 }} />,
    title: "Analytics & Reporting",
    desc: "Make data-driven decisions with comprehensive reports on sales, inventory, and operations.",
    highlights: ["Custom reports", "Export to Excel", "Visual dashboards"],
  },
  {
    icon: <NotificationsActiveIcon sx={{ fontSize: 48 }} />,
    title: "Smart Notifications",
    desc: "Stay informed with alerts for low stock, pending orders, and important updates across your chain.",
    highlights: ["Real-time alerts", "Email notifications", "Custom triggers"],
  },
  {
    icon: <ReceiptLongIcon sx={{ fontSize: 48 }} />,
    title: "Invoice Management",
    desc: "Generate and track invoices for inter-branch transfers and supplier orders automatically.",
    highlights: ["Auto-generation", "Payment tracking", "Audit trail"],
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 48 }} />,
    title: "Enterprise Security",
    desc: "Bank-grade security with encrypted data, role-based access, and comprehensive audit logging.",
    highlights: ["Data encryption", "2FA support", "Audit logs"],
  },
];

export function FeaturesPage() {
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
            Powerful Features
          </Typography>
          <Typography variant="h6" sx={{ color: "#C9A87D", mb: 4 }}>
            Everything you need to run your café chain efficiently
          </Typography>
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
        </Container>
      </Box>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid size={{ xs: 12, md: 6 }} key={feature.title}>
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
                  },
                }}
              >
                <Box sx={{ color: "#6B4C2A", mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: "#2C1A0E", mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {feature.desc}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {feature.highlights.map((h) => (
                    <Typography
                      key={h}
                      variant="caption"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        bgcolor: "rgba(107,76,42,0.08)",
                        color: "#6B4C2A",
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Box sx={{ bgcolor: "#F5EDD8", py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h3" fontWeight={800} sx={{ color: "#2C1A0E", mb: 2 }}>
            Ready to Transform Your Operations?
          </Typography>
          <Typography variant="h6" sx={{ color: "#5C4A37", mb: 4 }}>
            Start your 14-day free trial. No credit card required.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "#6B4C2A",
                px: 4,
                py: 1.5,
                fontWeight: 700,
                "&:hover": { bgcolor: "#5A3D1F" },
              }}
            >
              Get Started Free
            </Button>
            <Button
              component={Link}
              to="/pricing"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "#6B4C2A",
                color: "#6B4C2A",
                px: 4,
                py: 1.5,
                "&:hover": { borderColor: "#5A3D1F", color: "#5A3D1F" },
              }}
            >
              View Pricing
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
