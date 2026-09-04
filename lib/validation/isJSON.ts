function isJSON( text: any ): any {
	try {
		JSON.parse( text );
		return true;
	} catch {
		return false;
	}
}

export { isJSON };
