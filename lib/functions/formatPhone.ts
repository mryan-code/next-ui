import * as types from "@/lib/types";

const phoneRegex =
	/(?<phone_number>(?:(?<country_code>(?=(?:\+1|1)(?:[ -]{1})?(?:[(])?[\d]{3})(?:\+1|1))?(?:[ -]{1})?(?:[(])?(?<area_code>(?:(?<=\+1[ -]\(|\+1\(|\+1[ -]|\+1|1[ -]\(|1\(|1[ -]|1)[\d]{3}|[\d]{1,3}))(?:[)]{1})?(?:[ -]{1})?)?(?:(?<prefix>[a-zA-Z\d]{1,3})(?:[ ]{1})?(?:[-]{1})?)?(?:[ ]{1})?(?<line_number>[a-zA-Z\d]{1,4})?)/;

function formatPhone( phone: string ) {
	try {
		let returnValue: string = phone;
		const returnValueArray: any[] = [];
		const result = phoneRegex.exec( phone );
		phoneRegex.lastIndex = 0;
		if ( result !== undefined && result !== null ) {
			if ( result.groups !== undefined && result.groups !== null ) {
				if ( result.groups.area_code !== undefined && result.groups.area_code !== null ) {
					returnValueArray.push( "(" + result.groups.area_code + ") " );
				}
				if ( result.groups.prefix !== undefined && result.groups.prefix !== null ) {
					returnValueArray.push( result.groups.prefix );
				}
				if ( result.groups.line_number !== undefined && result.groups.line_number !== null ) {
					returnValueArray.push( "-" + result.groups.line_number );
				}
				returnValue = returnValueArray.join( "" );
			}
		}
		return returnValue;
	} catch ( error ) {
		console.error( "formatPhone error: ", error );
		return phone;
	}
}

function formatPhoneTwilio( phone: string ) {
	try {
		let returnValue: string = phone;
		const returnValueArray: any[] = [];
		const result = phoneRegex.exec( phone );
		phoneRegex.lastIndex = 0;
		if ( result !== undefined && result !== null ) {
			if ( result.groups !== undefined && result.groups !== null ) {
				if ( result.groups.country_code !== undefined && result.groups.country_code !== null ) {
					let countryCode = result.groups.country_code;
					if ( !countryCode.startsWith( "+" ) ) {
						countryCode = "+" + countryCode;
					}
					returnValueArray.push( countryCode );
				} else {
					returnValueArray.push( "+1" );
				}
				if ( result.groups.area_code !== undefined && result.groups.area_code !== null ) {
					returnValueArray.push( result.groups.area_code );
				}
				if ( result.groups.prefix !== undefined && result.groups.prefix !== null ) {
					returnValueArray.push( result.groups.prefix );
				}
				if ( result.groups.line_number !== undefined && result.groups.line_number !== null ) {
					returnValueArray.push( result.groups.line_number );
				}
				returnValue = returnValueArray.join( "" );
			}
		}
		return returnValue;
	} catch ( error ) {
		console.error( "formatPhoneTwilio error: ", error );
		return false;
	}
}

function dbPhone( phone: string ) {
	try {
		let returnValue: boolean | types.KeyValue = false;
		const result: RegExpExecArray | null = phoneRegex.exec( phone );
		phoneRegex.lastIndex = 0;
		if ( result !== undefined && result !== null ) {
			if ( result.groups !== undefined && result.groups !== null ) {
				if ( !result.groups.country_code ) {
					result.groups.country_code = "+1";
				}
				returnValue = result.groups;
			}
		}
		return returnValue;
	} catch ( error ) {
		console.error( "dbPhone error: ", error );
		return false;
	}
}

export { formatPhone, formatPhoneTwilio, phoneRegex, dbPhone };
