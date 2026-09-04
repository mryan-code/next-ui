"use client";

import { createTheme } from "@mui/material/styles";

// Brand primary matches former SCSS --primary (#b82427); dark is default like Vuetify setup.
export const brandPrimary = "#b82427";

export function createAppTheme( mode: "light" | "dark" ) {
	return createTheme( {
		palette: {
			mode,
			primary: {
				main: brandPrimary,
				dark: "#650204",
				contrastText: "#ffffff",
			},
			secondary: {
				main: "#7e0d0f",
			},
			background: {
				default: mode === "dark" ? "#131313" : "#ffffff",
				paper: mode === "dark" ? "#151a1d" : "#fafafa",
			},
		},
		typography: {
			fontFamily: '"Arimo", "Helvetica", "Arial", sans-serif',
		},
		shape: {
			borderRadius: 10,
		},
	} );
}
