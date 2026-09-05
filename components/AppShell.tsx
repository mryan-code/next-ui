"use client";

import React from "react";
import Link from "next/link";
import { Box, IconButton, Menu, MenuItem } from "@mui/material";
import { LogOut, Menu as MenuIcon, Home } from "lucide-react";
import { useAppStore } from "@/lib/store/app";
import * as types from "@/lib/types";

// Shell header from Vue App.vue (sidebar MainMenu stays unused like the Vue build).
export default function AppShell( { children }: { children: React.ReactNode } ) {
	const authenticated = useAppStore( ( s ) => s.authenticated );
	const theme = useAppStore( ( s ) => s.theme );
	const pages = useAppStore( ( s ) => s.pages );
	const settings = useAppStore( ( s ) => s.settings );
	const logout = useAppStore( ( s ) => s.logout );
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>( null );

	const visiblePages = pages.filter( ( page ) => {
		const meta = page.meta as types.KeyValue;
		if ( !meta ) {
			return false;
		}
		const authOk =
			( authenticated == true && meta.auth_required == 1 ) ||
			( authenticated == false && meta.auth_required == 2 ) ||
			meta.auth_required == 3;
		const role = settings.role as types.KeyValue | undefined;
		const roleOk = role && typeof role.auth_level === "number" && role.auth_level <= ( meta.auth_level as number );
		return authOk && meta.location == 1 && roleOk;
	} );

	return (
		<div className="webApp" data-theme={theme} id="home">
			{authenticated ? (
				<div id="header">
					<div className="headerContent">
						<Link href="/" className="logofull noselect">
							<div className="logo">
								<img src="/img/logo.png" alt="Storm Zero" />
							</div>
							<div className="wordmark">
								<h1>Storm</h1>
								<h1>Zero</h1>
							</div>
						</Link>
						<div id="headerNavRight">
							<div className="headerNavRightItem noselect">
								<div className="headerNavItemHeader">
									<a
										className="headerNavItemHeaderLink"
										href="#"
										onClick={async ( e ) => {
											e.preventDefault();
											await logout();
										}}
									>
										<div className="headerNavItemHeaderIcon">
											<LogOut />
										</div>
									</a>
								</div>
							</div>
							<div className="headerNavRightItem noselect">
								<div className="headerNavItemHeader">
									<IconButton
										id="menu"
										color="inherit"
										onClick={( e ) => setAnchorEl( e.currentTarget )}
										aria-label="Open menu"
									>
										<MenuIcon />
									</IconButton>
									<Menu
										anchorEl={anchorEl}
										open={Boolean( anchorEl )}
										onClose={() => setAnchorEl( null )}
									>
										{visiblePages.map( ( page ) => (
											<MenuItem
												key={String( page.path )}
												component={Link}
												href={String( page.path )}
												onClick={() => setAnchorEl( null )}
											>
												<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
													{page.meta && ( page.meta as types.KeyValue ).icon ? (
														<Home size={16} />
													) : null}
													{String( page.name )}
												</Box>
											</MenuItem>
										) )}
									</Menu>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}

			<div id="main">
				<div id="mainContent">
					<div id="viewContent">{children}</div>
				</div>
			</div>
		</div>
	);
}
