import { Link } from "@tanstack/react-router";
import { Box, Typography, Container, Grid } from "@mui/material";
import LocalCafeIcon from '@/components/icons/lucide-mui/LocalCafeIcon';

const footerLinks = {
  Product: [
    { label: "Features", path: "/features" },
    { label: "Pricing", path: "/pricing" },
  ],
  Company: [
    { label: "About", path: "/" },
    { label: "Contact", path: "/" },
  ],
  Legal: [
    { label: "Privacy", path: "/" },
    { label: "Terms", path: "/" },
  ],
};

export function MarketingFooter() {
  return (
    <Box sx={{ bgcolor: "#2C1A0E", color: "white", py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <LocalCafeIcon sx={{ color: "#C9A84C" }} />
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "0.1em" }}>
                KETTAN
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "#8C6B43", maxWidth: 280 }}>
              The complete platform for café chain operations. Manage inventory, orders, and branches with ease.
            </Typography>
          </Grid>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <Grid size={{ xs: 6, md: 2 }} key={title}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "#C9A84C" }}>
                {title}
              </Typography>
              {links.map((link) => (
                <Link
                  key={link.label}
                  to={link.path as "/"}
                  style={{
                    display: "block",
                    color: "#A39C93",
                    textDecoration: "none",
                    marginBottom: 8,
                    fontSize: "0.875rem",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Grid>
          ))}
        </Grid>

        <Box sx={{ borderTop: "1px solid rgba(201,168,125,0.2)", mt: 4, pt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#8C6B43" }}>
            © {new Date().getFullYear()} Kettan. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}


