function randomID( length = 6 ) {
	let returnValue = "";
	try {
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const charactersLength = characters.length;
		for ( let i = 0; i < length; i++ ) {
			returnValue += characters.charAt( Math.floor( Math.random() * charactersLength ) );
		}
		return returnValue;
	} catch ( error ) {
		console.error( "randomID error: ", error );
		return returnValue;
	}
}

export { randomID };
