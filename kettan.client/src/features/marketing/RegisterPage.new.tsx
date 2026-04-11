import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Box, TextField, Button, Typography, Paper, Alert, CircularProgress, InputAdornment, IconButton, MenuItem } from "@mui/material";
import VisibilityIcon from '@/components/icons/lucide-mui/VisibilityIcon';
import VisibilityOffIcon from '@/components/icons/lucide-mui/VisibilityOffIcon';
import ArrowBackIcon from '@/components/icons/lucide-mui/ArrowBackIcon';
import LocalCafeIcon from '@/components/icons/lucide-mui/LocalCafeIcon';

export function RegisterPage() {
  const navigate = useNavigate();
  // Get plan from URL if available
  const search = useSearch({ strict: false }) as { plan?: string };
  const selectedPlan = search?.plan || "starter";
  
  const [formData, setFormData] = useState({
    companyName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    plan: selectedPlan,
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1500));
      navigate({ to: "/" });
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 500,
          width: "100%",
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <LocalCafeIcon sx={{ color: "#6B4C2A", fontSize: 28 }} />
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "0.1em", color: "#2C1A0E" }}>
            KETTAN
          </Typography>
        </Box>

        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3, color: "#8C6B43", textTransform: "none" }}
        >
          Back to home
        </Button>

        <Typography variant="h4" fontWeight={800} sx={{ color: "#2C1A0E", mb: 1 }}>
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#6B4C2A", fontWeight: 600, textDecoration: "none" }}>
            Sign in →
          </Link>
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Company Name"
            value={formData.companyName}
            onChange={handleChange("companyName")}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Your Full Name"
            value={formData.fullName}
            onChange={handleChange("fullName")}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPw ? "text" : "password"}
            value={formData.password}
            onChange={handleChange("password")}
            required
            sx={{ mb: 2 }}
            helperText="Minimum 8 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(!showPw)} edge="end">
                    {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type={showPw ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            select
            label="Plan"
            value={formData.plan}
            onChange={handleChange("plan")}
            sx={{ mb: 3 }}
          >
            <MenuItem value="starter">Starter - ₱49/mo</MenuItem>
            <MenuItem value="professional">Professional - ₱99/mo</MenuItem>
            <MenuItem value="enterprise">Enterprise - Contact us</MenuItem>
          </TextField>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: "#6B4C2A",
              "&:hover": { bgcolor: "#5A3D1F" },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Paper>
    </Box>
  );
}


