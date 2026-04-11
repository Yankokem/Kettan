import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { AppBar, Toolbar, Box, Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";
import MenuIcon from '@/components/icons/lucide-mui/MenuIcon';
import CloseIcon from '@/components/icons/lucide-mui/CloseIcon';
import LocalCafeIcon from '@/components/icons/lucide-mui/LocalCafeIcon';

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "Pricing", path: "/pricing" },
];

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(253, 250, 245, 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", maxWidth: 1200, mx: "auto", width: "100%", px: { xs: 2, md: 4 } }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <LocalCafeIcon sx={{ color: "#6B4C2A", fontSize: 28 }} />
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "0.1em", color: "#2C1A0E" }}>
              KETTAN
            </Typography>
          </Link>

          {/* Desktop Nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 4 }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path as "/"}
                style={{
                  textDecoration: "none",
                  color: isActive(link.path) ? "#6B4C2A" : "#5C4A37",
                  fontWeight: isActive(link.path) ? 700 : 500,
                  fontSize: "0.95rem",
                }}
              >
                {link.label}
              </Link>
            ))}
          </Box>

          {/* Desktop Auth Buttons */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            <Button
              component={Link}
              to="/login"
              sx={{ color: "#6B4C2A", fontWeight: 600, textTransform: "none" }}
            >
              Log In
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              sx={{
                bgcolor: "#6B4C2A",
                fontWeight: 600,
                textTransform: "none",
                px: 3,
                "&:hover": { bgcolor: "#5A3D1F" },
              }}
            >
              Get Started
            </Button>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" }, color: "#6B4C2A" }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: "#FAF5EF" } }}
      >
        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
          <IconButton onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.path} disablePadding>
              <ListItemButton
                component={Link}
                to={link.path as "/"}
                onClick={() => setMobileOpen(false)}
                sx={{
                  color: isActive(link.path) ? "#6B4C2A" : "#5C4A37",
                  fontWeight: isActive(link.path) ? 700 : 500,
                }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding sx={{ mt: 2 }}>
            <ListItemButton
              component={Link}
              to="/login"
              onClick={() => setMobileOpen(false)}
            >
              <ListItemText primary="Log In" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              fullWidth
              onClick={() => setMobileOpen(false)}
              sx={{
                mx: 2,
                bgcolor: "#6B4C2A",
                "&:hover": { bgcolor: "#5A3D1F" },
              }}
            >
              Get Started
            </Button>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}


