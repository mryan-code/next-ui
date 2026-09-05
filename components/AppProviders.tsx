"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { createAppTheme } from "@/lib/theme";
import { useAppStore } from "@/lib/store/app";
import allPages from "@/lib/pages.json";
import * as types from "@/lib/types";

// Auth gate + MUI theme; mirrors Vue App.vue bootstrap and router beforeEach testLogin.
export default function AppProviders( { children }: { children: React.ReactNode } ) {
	const pathname = usePathname();
	const router = useRouter();
	const themeMode = useAppStore( ( s ) => s.theme ) as "light" | "dark";
	const authenticated = useAppStore( ( s ) => s.authenticated );
	const authBootstrapped = useAppStore( ( s ) => s.authBootstrapped );
	const testLogin = useAppStore( ( s ) => s.testLogin );
	const setupAppStore = useAppStore( ( s ) => s.setupAppStore );
	const checkVersion = useAppStore( ( s ) => s.checkVersion );
	const setStore = useAppStore( ( s ) => s.set );
	const theme = useMemo( () => createAppTheme( themeMode ), [themeMode] );
	const [loadPageRanForAuth, setLoadPageRanForAuth] = useState( false );

	useEffect( () => {
		document.documentElement.setAttribute( "data-theme", themeMode );
		const webApp = document.querySelector( ".webApp" );
		if ( webApp ) {
			webApp.setAttribute( "data-theme", themeMode );
		}
	}, [themeMode] );

	useEffect( () => {
		void ( async () => {
			await checkVersion();
			await testLogin();
		} )();
	}, [checkVersion, testLogin] );

	useEffect( () => {
		if ( !authBootstrapped ) {
			return;
		}
		const isLogin = pathname === "/login";
		if ( !authenticated && !isLogin ) {
			router.replace( "/login" );
			return;
		}
		if ( authenticated && isLogin ) {
			router.replace( "/" );
		}
	}, [authBootstrapped, authenticated, pathname, router] );

	useEffect( () => {
		void ( async () => {
			if ( authenticated && !loadPageRanForAuth ) {
				setLoadPageRanForAuth( true );
				setStore( {
					logoText: ( process.env.NEXT_PUBLIC_NAME || "Storm Zero" ).split( " " ),
					pages: JSON.parse( JSON.stringify( allPages ) ) as types.KeyValue[],
				} );
				await setupAppStore();
			}
			if ( !authenticated ) {
				setLoadPageRanForAuth( false );
			}
		} )();
	}, [authenticated, loadPageRanForAuth, setStore, setupAppStore] );

	return (
		<AppRouterCacheProvider>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</AppRouterCacheProvider>
	);
}
