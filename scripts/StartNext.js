/* eslint-env node */
// Starts Next.js on NEXT_PUBLIC_FRONTEND_PORT (and HTTPS when protocol/certs allow).
const { spawn } = require( "child_process" );
const fs = require( "fs" );
const path = require( "path" );

const projectRoot = path.resolve( __dirname, ".." );
const mode = process.argv[2] === "start" ? "start" : "dev";

function loadEnvFile() {
	const envPath = path.join( projectRoot, ".env" );
	if ( !fs.existsSync( envPath ) ) {
		return;
	}
	const text = fs.readFileSync( envPath, "utf8" );
	for ( const line of text.split( "\n" ) ) {
		const trimmed = line.trim();
		if ( !trimmed || trimmed.startsWith( "#" ) || !trimmed.includes( "=" ) ) {
			continue;
		}
		const eq = trimmed.indexOf( "=" );
		const key = trimmed.slice( 0, eq ).trim();
		let value = trimmed.slice( eq + 1 ).trim();
		if (
			( value.startsWith( "'" ) && value.endsWith( "'" ) ) ||
			( value.startsWith( '"' ) && value.endsWith( '"' ) )
		) {
			value = value.slice( 1, -1 );
		}
		if ( process.env[key] === undefined ) {
			process.env[key] = value;
		}
	}
}

loadEnvFile();

const port = process.env.NEXT_PUBLIC_FRONTEND_PORT || process.env.PORT || "3000";
const protocol = ( process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL || "http" ).toLowerCase();
const envName = process.env.NEXT_PUBLIC_ENV || "local";
const hostname = "0.0.0.0";

const nextBin = path.join( projectRoot, "node_modules", ".bin", "next" );
const args = [mode, "-p", String( port ), "-H", hostname];

// Mirror former Vue HTTPS setup: enable TLS in dev when certs exist for this env.
if ( mode === "dev" && protocol === "https" ) {
	const keyPath = path.join( projectRoot, "certificates", `${envName}-key.pem` );
	const certPath = path.join( projectRoot, "certificates", `${envName}-cert.pem` );
	if ( fs.existsSync( keyPath ) && fs.existsSync( certPath ) ) {
		args.push(
			"--experimental-https",
			"--experimental-https-key",
			keyPath,
			"--experimental-https-cert",
			certPath,
		);
		console.log( `Starting Next ${mode}(${envName}) with HTTPS on ${hostname}:${port}` );
	} else {
		console.warn(
			`HTTPS requested but certs missing (${keyPath}). Falling back to HTTP on ${hostname}:${port}.`,
		);
	}
} else {
	console.log( `Starting Next ${mode}(${envName}) on ${hostname}:${port}` );
}

const child = spawn( nextBin, args, {
	cwd: projectRoot,
	stdio: "inherit",
	env: process.env,
} );

child.on( "exit", ( code, signal ) => {
	if ( signal ) {
		process.kill( process.pid, signal );
		return;
	}
	process.exit( code ?? 0 );
} );
