function slugify( text: string ) {
	// Deprecated: body left commented in Vue source; keep stub for callers.
	return text;
}

async function fieldSlug( text: string ) {
	let returnValue = text;
	try {
		returnValue = returnValue.toString().toLowerCase();
		returnValue = returnValue.replace( /(?:[\w]+[.])?/, "" );
		returnValue = returnValue.replaceAll( "_", " " );
		returnValue = returnValue.replace( "id", "ID" );
		return returnValue;
	} catch ( error ) {
		console.error( "fieldSlug error: ", error );
		return text;
	}
}

async function lucideIcon( text: string ) {
	let returnValue = text;
	try {
		returnValue = returnValue.replace( /([A-Z])/g, "-$1" ).replace( /^-/, "" );
		returnValue = returnValue.toString().toLowerCase();
		return returnValue;
	} catch ( error ) {
		console.error( "lucideIcon error: ", error );
		return text;
	}
}

export { slugify, fieldSlug, lucideIcon };
