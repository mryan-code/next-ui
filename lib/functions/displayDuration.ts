import * as types from "@/lib/types";
import moment from "moment-timezone";

function displayDuration( intSeconds: number ): string {
	const returnValue: types.KeyValue = { value: "" };
	const start = moment();
	const end = moment();
	end.add( intSeconds, "seconds" );
	const objDuration = moment.duration( end.diff( start ), "second" );
	returnValue.value = moment.utc( objDuration.asSeconds() ).format( "mm:ss" );
	return returnValue.value as string;
}

export { displayDuration };
