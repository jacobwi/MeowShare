import React from "react";
import { Box, Typography, Container, Link, useTheme } from "@mui/material";
import { Favorite } from "@mui/icons-material";

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: "auto",
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(0, 0, 0, 0.2)"
            : "rgba(0, 0, 0, 0.03)",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            © {currentYear} BCat • All rights reserved
          </Typography>
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              mx: 1,
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(0,0,0,0.3)",
            }}
          >
            <Box
              component="span"
              sx={{ mx: 0.5, fontSize: "1.2rem", display: "inline-flex" }}
            >
              •
            </Box>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            Made with{" "}
            <Favorite
              sx={{
                color: theme.palette.error.main,
                mx: 0.5,
                fontSize: "0.8rem",
              }}
            />{" "}
            by
            <Link href="https://github.com/jacobwi" underline="hover" color="inherit" sx={{ ml: 0.5 }}>
              BCat
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
