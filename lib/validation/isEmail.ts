function isEmail( email: any ): any {
	try {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email );
	} catch {
		return false;
	}
}

export { isEmail };
