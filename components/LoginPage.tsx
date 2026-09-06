"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardHeader,
	Typography,
	TextField,
	IconButton,
	Box,
	Alert,
	List,
	ListItem,
	ListItemText,
} from "@mui/material";
import { Mail, KeySquare } from "lucide-react";
import APIClass from "@/lib/api";
import { useAppStore } from "@/lib/store/app";

// Ported from Vue Login.vue — email + one-time code auth.
export default function LoginPage() {
	const router = useRouter();
	const API = React.useMemo( () => new APIClass(), [] );
	const setStore = useAppStore( ( s ) => s.set );
	const loginTokenKey = useAppStore( ( s ) => s.loginTokenKey );
	const focusField = useAppStore( ( s ) => s.focusField );
	const delay = useAppStore( ( s ) => s.delay );

	const [email, setEmail] = useState( "" );
	const [authCode, setAuthCode] = useState( "" );
	const [verify, setVerify] = useState( false );
	const [loginMessages, setLoginMessages] = useState<string[]>( [] );
	const [verifyMessages, setVerifyMessages] = useState<string[]>( [] );

	useEffect( () => {
		setStore( { authenticated: false } );
		if ( typeof window !== "undefined" && localStorage.getItem( loginTokenKey ) ) {
			localStorage.removeItem( loginTokenKey );
		}
		void focusField( "#emailInput" );
	}, [focusField, loginTokenKey, setStore] );

	const loginRequest = async ( event?: React.FormEvent ) => {
		event?.preventDefault();
		const loginRequestRes = await API.login( email );
		if ( loginRequestRes.success === true ) {
			setLoginMessages( [] );
			setVerify( true );
			setAuthCode( loginRequestRes.auth_code ? String( loginRequestRes.auth_code ) : "" );
			await focusField( "#verifyInput" );
			await delay( 3000 );
		} else {
			if ( loginRequestRes.message && Array.isArray( loginRequestRes.message ) ) {
				setLoginMessages( loginRequestRes.message as string[] );
			}
			await focusField( "#emailInput" );
		}
	};

	const verifyRequest = async ( event?: React.FormEvent ) => {
		event?.preventDefault();
		const userAgent = navigator.userAgent;
		const IP: string | null = await API.getIP();
		const verifyRequestRes = await API.verify( email, authCode, userAgent, IP );
		if ( verifyRequestRes.authenticated === true ) {
			setAuthCode( "" );
			setEmail( "" );
			setStore( { authenticated: true, authBootstrapped: true } );
			router.replace( "/" );
		} else {
			if ( verifyRequestRes.message && Array.isArray( verifyRequestRes.message ) ) {
				setVerifyMessages( verifyRequestRes.message as string[] );
			}
			await focusField( "#verifyInput" );
		}
	};

	const loginSubmit = async ( event: React.FormEvent | React.KeyboardEvent ) => {
		event.preventDefault();
		if ( authCode.length > 0 ) {
			await verifyRequest();
		} else {
			await loginRequest();
		}
	};

	return (
		<Card className="login-card" sx={{ maxWidth: 480, mx: "auto", mt: 6 }}>
			<CardHeader
				title={
					<div className="logofull noselect no-hover">
						<div className="logo">
							<img src="/img/logo.png" alt="Storm Zero" />
						</div>
						<div className="wordmark">
							<h1>Storm</h1>
							<h1>Zero</h1>
						</div>
					</div>
				}
				subheader={<Typography variant="h5">Login</Typography>}
			/>
			<CardContent>
				<Typography sx={{ mb: 2 }}>Please enter your email and login code to continue.</Typography>
				<Typography component="div" sx={{ mb: 2 }}>
					Steps:
					<ol>
						<li>Enter your email address in the &quot;Email&quot; field</li>
						<li>Click the &quot;Get Login Code&quot; button</li>
						<li>Enter your login code in the &quot;Login Code&quot; field</li>
						<li>Click the &quot;Login&quot; button</li>
					</ol>
				</Typography>

				{( loginMessages.length > 0 || verifyMessages.length > 0 ) && (
					<Box sx={{ mb: 2 }}>
						{loginMessages.length > 0 && (
							<Alert severity="error">
								Login Messages:
								<List dense>
									{loginMessages.map( ( message ) => (
										<ListItem key={message}>
											<ListItemText primary={message} />
										</ListItem>
									) )}
								</List>
							</Alert>
						)}
						{verifyMessages.length > 0 && (
							<Alert severity="error" sx={{ mt: 1 }}>
								Verify Messages:
								<List dense>
									{verifyMessages.map( ( message ) => (
										<ListItem key={message}>
											<ListItemText primary={message} />
										</ListItem>
									) )}
								</List>
							</Alert>
						)}
					</Box>
				)}

				<Box component="form" id="loginForm" onSubmit={loginSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					<Box className="inputWrapper" sx={{ display: "flex", gap: 1 }}>
						<TextField
							id="emailInput"
							type="email"
							required
							fullWidth
							label="Email"
							value={email}
							onChange={( e ) => setEmail( e.target.value )}
							onKeyDown={async ( e ) => {
								if ( e.key === "Enter" ) {
									await loginSubmit( e );
								}
							}}
							slotProps={{ input: { readOnly: verify } }}
							error={loginMessages.length > 0}
						/>
						<IconButton
							color="primary"
							id="loginButton"
							onClick={() => void loginRequest()}
							disabled={email.length === 0 || verify}
							aria-label="Get login code"
						>
							<Mail />
						</IconButton>
					</Box>
					<Box className="inputWrapper" sx={{ display: "flex", gap: 1 }}>
						<TextField
							id="verifyInput"
							type="text"
							required
							fullWidth
							label="Login Code"
							value={authCode}
							onChange={( e ) => setAuthCode( e.target.value )}
							onKeyDown={async ( e ) => {
								if ( e.key === "Enter" ) {
									await loginSubmit( e );
								}
							}}
							disabled={!verify}
							autoComplete="off"
							error={verifyMessages.length > 0}
						/>
						<IconButton
							color="primary"
							id="verifyButton"
							onClick={() => void verifyRequest()}
							disabled={authCode.length === 0 || !verify}
							aria-label="Verify login code"
						>
							<KeySquare />
						</IconButton>
					</Box>
				</Box>
			</CardContent>
		</Card>
	);
}
