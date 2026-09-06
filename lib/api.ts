// Ported from Vue src/classes/API.ts — Axios client for the Storm Zero backend.
import * as types from "@/lib/types";
import moment from "moment-timezone";
import axios from "axios";
import * as validation from "@/lib/validation";
import { buildBackendURL, buildFrontendURL, getPublicEnv } from "@/lib/env";

const backendURL = buildBackendURL();
const frontendURL = buildFrontendURL();

type StoreGetter = () => types.KeyValue;
let storeGetter: StoreGetter | null = null;

export function registerStoreGetter( getter: StoreGetter ) {
	storeGetter = getter;
}

class API {
	returnResponse: any;
	frontendURL: string;

	constructor() {
		this.returnResponse = false;
		this.frontendURL = frontendURL;
	}

	get appStore() {
		if ( storeGetter ) {
			return storeGetter();
		}
		return {
			loginTokenKey: getPublicEnv( "NEXT_PUBLIC_ENV", "development" ) + "_sz_login_token",
			globalVars: {},
			settings: {},
		};
	}

	apiRequest = async (
		method: string,
		path: string,
		parameters: types.KeyValue | FormData = {},
		timeout: number = 180000,
		signal: AbortSignal | undefined = undefined,
	): Promise<any> => {
		const api = axios.create( {
			baseURL: backendURL,
			timeout: timeout,
		} );

		if ( api !== undefined ) {
			const axiosConfig: types.KeyValue = {};
			if ( signal ) {
				( axiosConfig as any ).signal = signal as AbortSignal;
			}
			const headers: types.KeyValue = {};
			if ( typeof window !== "undefined" && localStorage.getItem( this.appStore.loginTokenKey ) ) {
				const loginTokenKey = this.appStore.loginTokenKey;
				const localStorageToken = localStorage.getItem( loginTokenKey ) || null;
				if ( localStorageToken && validation.isJSON( localStorageToken ) ) {
					const localStorageTokenObject = JSON.parse( localStorageToken );
					if ( localStorageTokenObject && localStorageTokenObject.user_jwt ) {
						headers["Authorization"] = "Bearer " + localStorageTokenObject.user_jwt;
					}
				}
				if ( parameters instanceof FormData ) {
					headers["Content-Type"] = "multipart/form-data";
				} else {
					headers["Content-Type"] = "application/json";
				}
			}

			axiosConfig.headers = headers;
			axiosConfig.method = method.toUpperCase();
			axiosConfig.url = path;
			if ( method.toUpperCase() !== "GET" ) {
				if ( parameters instanceof FormData ) {
					axiosConfig.data = Object.fromEntries( parameters ) as types.KeyValue;
				} else {
					axiosConfig.data = parameters as types.KeyValue;
				}
			}
			const response = await api( axiosConfig as any )
				.then( async ( response ) => {
					let responseData = response.data;
					if ( typeof responseData === "string" && validation.isJSON( responseData ) ) {
						responseData = JSON.parse( responseData );
					}
					return responseData;
				} )
				.catch( async ( error: any ): Promise<any> => {
					if (
						this.appStore.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
						this.appStore.globalVars.DEBUG_USER == "foobar"
					) {
						console.log( "API error", JSON.parse( JSON.stringify( error ) ) );
					}

					const errorMessage = [];
					if ( error.message ) {
						errorMessage.push( error.message );
					}
					if ( error.response ) {
						if ( error.response.data ) {
							if ( error.response.data.message ) {
								if (
									this.appStore.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
									this.appStore.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
									this.appStore.globalVars.GLOBAL_DEBUG_LEVEL == "info"
								) {
									console.log( "API response data", JSON.parse( JSON.stringify( error.response.data ) ) );
								}
								for ( const message of error.response.data.message ) {
									errorMessage.push( message );
								}
							}
						}
					}
					return { success: false, message: errorMessage };
				} );
			return response;
		} else {
			return { success: false };
		}
	};

	startApp = async ( user_id: string ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		requestParams.user_id = user_id;
		this.returnResponse = await this.apiRequest( "POST", "/start-app", requestParams );
		return this.returnResponse;
	};

	login = async ( email: string ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		requestParams.email = email;
		this.returnResponse = await this.apiRequest( "POST", "/login-auth", requestParams );
		return this.returnResponse;
	};

	verify = async (
		email: string,
		auth_code: string,
		user_agent: string | null = null,
		IP: string | null = null,
		latitude: number | null = null,
		longitude: number | null = null,
	): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		requestParams.email = email;
		requestParams.auth_code = auth_code;
		if ( user_agent ) {
			requestParams.user_agent = user_agent;
		}
		if ( IP ) {
			requestParams.ip_address = IP;
		}
		if ( latitude && longitude ) {
			requestParams.latitude = latitude;
			requestParams.longitude = longitude;
		}
		requestParams.user_date = moment().format( "YYYY-MM-DD" );
		this.returnResponse = await this.apiRequest( "POST", "/verify-auth", requestParams );
		if ( this.returnResponse.authenticated === true ) {
			if ( localStorage.getItem( this.appStore.loginTokenKey ) ) {
				localStorage.removeItem( this.appStore.loginTokenKey );
			}
			localStorage.setItem( this.appStore.loginTokenKey, this.returnResponse.token );
		}
		return this.returnResponse;
	};

	logout = async (): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		if ( localStorage.getItem( this.appStore.loginTokenKey ) ) {
			let localStorageToken: any = localStorage.getItem( this.appStore.loginTokenKey );
			if ( validation.isJSON( localStorageToken ) ) {
				localStorageToken = JSON.parse( localStorageToken );
				if ( localStorageToken.user_id ) {
					requestParams.user_id = localStorageToken.user_id;
				}
			}
		}
		requestParams.user_date = moment().format( "YYYY-MM-DD" );
		this.returnResponse = await this.apiRequest( "POST", "/logout-auth", requestParams );

		if ( this.returnResponse.success === true ) {
			localStorage.removeItem( this.appStore.loginTokenKey );
		}
		return this.returnResponse;
	};

	testAuth = async (): Promise<any> => {
		if ( typeof window === "undefined" ) {
			return false;
		}
		if ( localStorage.getItem( this.appStore.loginTokenKey ) ) {
			let localStorageToken: any = localStorage.getItem( this.appStore.loginTokenKey );
			if ( validation.isJSON( localStorageToken ) ) {
				localStorageToken = JSON.parse( localStorageToken );

				const requestParams: types.KeyValue = {};
				requestParams.user_id = localStorageToken.user_id;
				requestParams.user_jwt = localStorageToken.user_jwt;
				this.returnResponse = await this.apiRequest( "POST", "/test-auth", requestParams );
				if ( this.returnResponse.authenticated === false ) {
					localStorage.removeItem( this.appStore.loginTokenKey );
				}
				return this.returnResponse;
			}
			localStorage.removeItem( this.appStore.loginTokenKey );
			return false;
		} else {
			return false;
		}
	};

	updateUser = async ( userTemp: types.KeyValue = {} ): Promise<any> => {
		const requestParams: types.KeyValue = {};
		for ( const [key, value] of Object.entries( userTemp ) ) {
			requestParams[key] = value;
		}
		if ( requestParams.user_id ) {
			requestParams.id = requestParams.user_id;
		}
		this.returnResponse = await this.apiRequest( "POST", "/save-user", requestParams );
		return this.returnResponse;
	};

	addUser = async ( userTemp: types.KeyValue = {} ): Promise<any> => {
		const requestParams: types.KeyValue = {};
		for ( const [key, value] of Object.entries( userTemp ) ) {
			requestParams[key] = value;
		}
		this.returnResponse = await this.apiRequest( "POST", "/add-user", requestParams );
		return this.returnResponse;
	};

	deleteUser = async ( user_id: string ): Promise<types.KeyValue> => {
		this.returnResponse = await this.apiRequest( "DELETE", "/delete-user?id=" + user_id );
		return this.returnResponse;
	};

	getPages = async (
		page_id: number | null = null,
		order: string[][] = [["order", "ASC"]],
	): Promise<types.KeyValue> => {
		let url = "/get-page?";
		if ( page_id ) {
			url += "id=" + page_id + "&";
		}
		if ( order.length > 0 ) {
			url += "order=" + JSON.stringify( order ) + "&";
		}
		this.returnResponse = await this.apiRequest( "GET", url );
		return this.returnResponse;
	};

	getUsers = async (
		company_id: string | null = null,
		department_id: string | null = null,
		user_id: string | null = null,
		search: string | null = null,
	): Promise<types.KeyValue> => {
		const order = JSON.stringify( [
			["last_name", "ASC"],
			["first_name", "ASC"],
		] );
		this.returnResponse = await this.apiRequest(
			"GET",
			"/get-user?show_deleted=false&order=" +
				order +
				( company_id ? "&company_id=" + company_id : "" ) +
				( department_id ? "&department_id=" + department_id : "" ) +
				( user_id ? "&user_id=" + user_id : "" ) +
				( search ? "&keyword=" + search : "" ),
		);
		return this.returnResponse;
	};

	getErrors = async (
		start = "",
		end = "",
		resolved: number[] = [0, 1],
		search = "",
		perPage: number | null = 100,
		currentPage: number | null = 1,
		timezone: string | null = null,
		order: string[][] = [["created", "DESC"]],
	): Promise<types.KeyValue> => {
		let url = "/get-errorlog?";
		if ( start ) {
			url += "start=" + start + "&";
		}
		if ( end ) {
			url += "end=" + end + "&";
		}
		if ( timezone ) {
			url += "timezone=" + timezone + "&";
		}
		if ( resolved.length > 0 ) {
			url += "resolved=" + JSON.stringify( resolved ) + "&";
		}
		if ( search ) {
			url += "keyword=" + search + "&";
		}
		if ( perPage !== null ) {
			url += "per_page=" + perPage + "&";
		}
		if ( currentPage !== null ) {
			url += "current_page=" + currentPage + "&";
		}
		if ( order.length > 0 ) {
			url += "order=" + JSON.stringify( order ) + "&";
		}
		this.returnResponse = await this.apiRequest( "GET", url );
		return this.returnResponse;
	};

	getRequests = async (
		start = "",
		end = "",
		search = "",
		perPage: number | null = 100,
		currentPage: number | null = 1,
		timezone: string | null = null,
		order: string[][] = [["created", "DESC"]],
	): Promise<types.KeyValue> => {
		let url = "/get-requestlog?";
		if ( start ) {
			url += "start=" + start + "&";
		}
		if ( end ) {
			url += "end=" + end + "&";
		}
		if ( timezone ) {
			url += "timezone=" + timezone + "&";
		}
		if ( search ) {
			url += "keyword=" + search + "&";
		}
		if ( perPage !== null ) {
			url += "per_page=" + perPage + "&";
		}
		if ( currentPage !== null ) {
			url += "current_page=" + currentPage + "&";
		}
		if ( order.length > 0 ) {
			url += "order=" + JSON.stringify( order ) + "&";
		}
		this.returnResponse = await this.apiRequest( "GET", url );
		return this.returnResponse;
	};

	resolveError = async ( error: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		for ( const [key, value] of Object.entries( error ) ) {
			requestParams[key] = value;
		}
		this.returnResponse = await this.apiRequest( "PUT", "/save-errorlog", requestParams );
		return this.returnResponse;
	};

	addError = async ( error: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		for ( const [key, value] of Object.entries( error ) ) {
			requestParams[key] = value;
		}
		this.returnResponse = await this.apiRequest( "POST", "/add-errorlog", requestParams );
		return this.returnResponse;
	};

	getIP = async (): Promise<any> => {
		let returnValue: any = null;
		try {
			await fetch( "https://api.ipify.org?format=json" )
				.then( ( response ) => {
					return response.json();
				} )
				.then( ( data ) => {
					returnValue = data.ip;
				} )
				.catch( () => {
					returnValue = null;
				} );
		} catch ( error: any ) {
			if (
				this.appStore.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				this.appStore.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				this.appStore.globalVars.GLOBAL_DEBUG_LEVEL == "info"
			) {
				console.error( "API.getIP error: ", error );
			}
			returnValue = null;
		}
		return returnValue;
	};

	health = async (): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		this.returnResponse = await this.apiRequest( "GET", "/health", requestParams );
		return this.returnResponse;
	};

	chat = async (
		prompt: string,
		power: boolean = false,
		tts: boolean = true,
		enable_thinking: boolean = false,
	): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		requestParams.prompt = prompt;
		requestParams.user_id = this.appStore.settings.user_id;
		requestParams.tts = tts;
		requestParams.power = power;
		requestParams.enable_thinking = enable_thinking;
		this.returnResponse = await this.apiRequest( "POST", "/chat", requestParams, 0 );
		return this.returnResponse;
	};

	customModel = async ( prompt: string, model: string, tts: boolean = true ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		requestParams.prompt = prompt;
		requestParams.model = model;
		requestParams.user_id = this.appStore.settings.user_id;
		requestParams.tts = tts;
		this.returnResponse = await this.apiRequest( "POST", "/custom-model", requestParams );
		return this.returnResponse;
	};

	systemModel = async ( prompt: string, model = "base.gguf", tts: boolean = true ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		requestParams.prompt = prompt;
		requestParams.model = model;
		requestParams.user_id = this.appStore.settings.user_id;
		requestParams.tts = tts;
		this.returnResponse = await this.apiRequest( "POST", "/system-model", requestParams );
		return this.returnResponse;
	};

	getSystemModels = async (): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		const url = "/get-model-type?";
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};

	deleteSystemModel = async (): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		this.returnResponse = await this.apiRequest( "DELETE", "/delete-model-type", requestParams );
		return this.returnResponse;
	};

	addSystemModel = async (): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		this.returnResponse = await this.apiRequest( "PUT", "/add-model-type", requestParams );
		return this.returnResponse;
	};

	saveSystemModel = async (): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		this.returnResponse = await this.apiRequest( "POST", "/save-model-type", requestParams );
		return this.returnResponse;
	};

	getRules = async ( keyword = "", showDeleted: boolean = false ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		let url = "/get-global-rule?";
		if ( keyword ) {
			url += "keyword=" + keyword + "&";
		}
		url += "show_deleted=" + showDeleted + "&";
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};

	deleteRule = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "DELETE", "/delete-global-rule", requestParams );
		return this.returnResponse;
	};

	addRule = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "PUT", "/add-global-rule", requestParams );
		return this.returnResponse;
	};

	saveRule = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "POST", "/save-global-rule", requestParams );
		return this.returnResponse;
	};

	getUserP2 = async ( userId: string = String( this.appStore.settings.user_id ?? "" ) ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		let url = "/get-user-p2?";
		if ( userId ) {
			url += "user_id=" + userId + "&";
		}
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};

	deleteUserP2 = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "DELETE", "/delete-user-p2", requestParams );
		return this.returnResponse;
	};

	addUserP2 = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "PUT", "/add-user-p2", requestParams );
		return this.returnResponse;
	};

	saveUserP2 = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "POST", "/save-user-p2", requestParams );
		return this.returnResponse;
	};

	getUserAvatar = async ( userId: string = String( this.appStore.settings.user_id ?? "" ) ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		let url = "/get-user-avatar?";
		if ( userId ) {
			url += "user_id=" + userId + "&";
		}
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};

	deleteUserAvatar = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "DELETE", "/delete-user-avatar", requestParams );
		return this.returnResponse;
	};

	addUserAvatar = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "PUT", "/add-user-avatar", requestParams );
		return this.returnResponse;
	};

	saveUserAvatar = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "POST", "/save-user-avatar", requestParams );
		return this.returnResponse;
	};

	getUserConversationSubject = async (
		keyword = "",
		showDeleted: boolean = false,
		userId: string = String( this.appStore.settings.user_id ?? "" ),
	): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		let url = "/get-user-conversation-subject?";
		if ( keyword ) {
			url += "keyword=" + keyword + "&";
		}
		if ( userId ) {
			url += "user_id=" + userId + "&";
		}
		url += "show_deleted=" + showDeleted + "&";
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};

	deleteUserConversationSubject = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "DELETE", "/delete-user-conversation-subject", requestParams );
		return this.returnResponse;
	};

	addUserConversationSubject = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "PUT", "/add-user-conversation-subject", requestParams );
		return this.returnResponse;
	};

	saveUserConversationSubject = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "POST", "/save-user-conversation-subject", requestParams );
		return this.returnResponse;
	};

	getUserConversationContent = async (
		keyword = "",
		showDeleted: boolean = false,
		userId: string = String( this.appStore.settings.user_id ?? "" ),
	): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		let url = "/get-user-conversation-content?";
		if ( keyword ) {
			url += "keyword=" + keyword + "&";
		}
		if ( userId ) {
			url += "user_id=" + userId + "&";
		}
		url += "show_deleted=" + showDeleted + "&";
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};

	getUserConversation = async (
		keyword = "",
		showDeleted: boolean = false,
		userId: string = String( this.appStore.settings.user_id ?? "" ),
	): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		let url = "/get-user-conversation?";
		if ( keyword ) {
			url += "keyword=" + keyword + "&";
		}
		if ( userId ) {
			url += "user_id=" + userId + "&";
		}
		url += "show_deleted=" + showDeleted + "&";
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};

	deleteUserConversationContent = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "DELETE", "/delete-user-conversation-content", requestParams );
		return this.returnResponse;
	};

	addUserConversationContent = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "PUT", "/add-user-conversation-content", requestParams );
		return this.returnResponse;
	};

	saveUserConversationContent = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "POST", "/save-user-conversation-content", requestParams );
		return this.returnResponse;
	};

	getUserGuideline = async (
		keyword = "",
		showDeleted: boolean = false,
		userId: string = String( this.appStore.settings.user_id ?? "" ),
	): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		let url = "/get-user-guideline?";
		if ( keyword ) {
			url += "keyword=" + keyword + "&";
		}
		if ( userId ) {
			url += "user_id=" + userId + "&";
		}
		url += "show_deleted=" + showDeleted + "&";
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};

	deleteUserGuideline = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "DELETE", "/delete-user-guideline", requestParams );
		return this.returnResponse;
	};

	addUserGuideline = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "PUT", "/add-user-guideline", requestParams );
		return this.returnResponse;
	};

	saveUserGuideline = async ( rule: types.KeyValue ): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = { ...rule };
		this.returnResponse = await this.apiRequest( "POST", "/save-user-guideline", requestParams );
		return this.returnResponse;
	};

	getAvatarVoices = async (): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		this.returnResponse = await this.apiRequest( "GET", "/get-avatar-voice", requestParams );
		return this.returnResponse;
	};

	getThread = async (
		keyword = "",
		promptID: number | null = null,
		showDeleted: boolean = false,
		userId: string = String( this.appStore.settings.user_id ?? "" ),
		limit: number | null = null,
	): Promise<types.KeyValue> => {
		const requestParams: types.KeyValue = {};
		let url = "/get-user-chat?";
		if ( keyword ) {
			url += "keyword=" + keyword + "&";
		}
		if ( promptID !== null ) {
			url += "prompt_id=" + promptID + "&";
		}
		if ( userId ) {
			url += "user_id=" + userId + "&";
		}
		url += "show_deleted=" + showDeleted + "&";
		if ( limit !== null ) {
			url += "limit=" + limit + "&";
		}
		this.returnResponse = await this.apiRequest( "GET", url, requestParams );
		return this.returnResponse;
	};
}

export default API;
