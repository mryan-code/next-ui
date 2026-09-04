// Central env accessors for Next.js (former VUE_APP_* → NEXT_PUBLIC_*).
export function getPublicEnv( key: string, fallback = "" ): string {
	const value = process.env[key];
	return value !== undefined && value !== null ? String( value ) : fallback;
}

export function buildBackendURL(): string {
	let url = "";
	const protocol = getPublicEnv( "NEXT_PUBLIC_BACKEND_PROTOCOL" );
	const host = getPublicEnv( "NEXT_PUBLIC_BACKEND_HOST" );
	const port = getPublicEnv( "NEXT_PUBLIC_BACKEND_PORT" );
	if ( protocol ) {
		url = protocol + "://";
	}
	if ( host ) {
		url += host;
	}
	if ( port ) {
		url += ":" + port;
	}
	return url;
}

export function buildFrontendURL(): string {
	let url = "";
	const protocol = getPublicEnv( "NEXT_PUBLIC_FRONTEND_PROTOCOL" );
	const host = getPublicEnv( "NEXT_PUBLIC_FRONTEND_HOST" );
	const port = getPublicEnv( "NEXT_PUBLIC_FRONTEND_PORT" );
	if ( protocol ) {
		url = protocol + "://";
	}
	if ( host ) {
		url += host;
	}
	if ( port ) {
		url += ":" + port;
	}
	return url;
}
