import { Link } from "@tanstack/react-router";
import { Box, Typography, Button, Paper, Container } from "@mui/material";
import CheckCircleIcon from '@/components/icons/lucide-mui/CheckCircleIcon';
import EmailIcon from '@/components/icons/lucide-mui/EmailIcon';
import ArrowForwardIcon from '@/components/icons/lucide-mui/ArrowForwardIcon';
import LocalCafeIcon from '@/components/icons/lucide-mui/LocalCafeIcon';

export function RegisterSuccessPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#FAF5EF",
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "rgba(84, 107, 63, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 48, color: "#546B3F" }} />
            </Box>
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ color: "#2C1A0E", mb: 2 }}>
            Welcome to Kettan!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Your account has been created successfully. We've sent a confirmation email to your inbox.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              bgcolor: "rgba(107, 76, 42, 0.05)",
              border: "1px solid rgba(107, 76, 42, 0.1)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
              <EmailIcon sx={{ color: "#6B4C2A" }} />
              <Typography variant="body2" sx={{ color: "#5C4A37" }}>
                Check your email to verify your account and get started
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: "#6B4C2A",
                py: 1.5,
                fontWeight: 600,
                "&:hover": { bgcolor: "#5A3D1F" },
              }}
            >
              Go to Login
            </Button>
            
            <Button
              component={Link}
              to="/"
              variant="text"
              sx={{ color: "#8C6B43" }}
            >
              Return to Home
            </Button>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 4 }}>
            <LocalCafeIcon sx={{ color: "#6B4C2A", fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary">
              Kettan · Café Chain Operations
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}


