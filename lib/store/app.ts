// Ported from Vue Pinia src/store/app.ts to Zustand for Next.js.
import { create } from "zustand";
import APIClass, { registerStoreGetter } from "@/lib/api";
import * as types from "@/lib/types";
import * as validation from "@/lib/validation";
import moment from "moment-timezone";
import { buildBackendURL, getPublicEnv } from "@/lib/env";

const controller = new AbortController();
const apiSingleton = new APIClass();

export interface AppState {
	settings: types.KeyValue;
	globalVars: types.KeyValue;
	authenticated: boolean;
	wss: WebSocket | null;
	wssReadyState: number;
	wssDialogue: boolean;
	wssDialogueMessage: string;
	wssError: string;
	wssMessage: any;
	wssConnectionAttempt: number;
	wssConnectionAttemptMax: number;
	wssConnectionDelay: number;
	timezone: string;
	perPageDefault: number;
	perPageOptions: number[];
	controller: AbortController;
	signal: AbortSignal;
	collapsed: boolean;
	notificationCount: number;
	notifications: types.KeyValue[];
	notificationsSearch: string;
	userRole: string;
	userAuth: number | null;
	userName: string;
	userInitials: string;
	headerMenuOpen: boolean;
	headerMenuType: string;
	theme: string;
	loginTokenKey: string;
	versionKey: string;
	API: APIClass;
	timezoneOptions: string[];
	setupComplete: boolean;
	selectedGuideRuleOptions: types.KeyValue[] | null;
	selectedHardRuleOptions: types.KeyValue[] | null;
	guideRuleOptions: types.KeyValue[];
	hardRuleOptions: types.KeyValue[];
	selectedCustomModelOption: types.KeyValue | null;
	customModelOptions: types.KeyValue[];
	avatarAudioLevel: number;
	avatarResponse: string;
	avatarIsLoading: boolean;
	prompt: string;
	avatarTTS: types.KeyValue | null;
	setupDialogue: boolean;
	avatarSettings: types.KeyValue;
	avatarVoices: types.KeyValue[];
	avatarPersonalities: types.KeyValue[];
	rules: types.KeyValue[];
	ruleKeyword: string;
	ruleDialogue: boolean;
	rule: types.KeyValue | null;
	threadKeyword: string;
	thread: types.KeyValue[];
	showLoadMore: boolean;
	totalAvailableThread: number;
	debugTimer: moment.Moment;
	dateFormat: string;
	devDateFormat: string;
	longDateFormat: string;
	timeFormat: string;
	militaryTimeFormat: string;
	backendURL: string;
	startVars: types.KeyValue | null;
	pages: types.KeyValue[];
	logoText: string[];
	authBootstrapped: boolean;

	set: ( partial: Partial<AppState> ) => void;
	checkVersion: () => Promise<void>;
	getUsers: (
		company_id?: string | null,
		department_id?: string | null,
		user_id?: string | null,
		search?: string | null,
	) => Promise<types.KeyValue[]>;
	sort: ( array: types.KeyValue[], key?: string, type?: string ) => Promise<types.KeyValue[]>;
	setupAppStore: () => Promise<boolean>;
	testLogin: () => Promise<void>;
	setSubMenuHeights: ( element?: HTMLElement | null ) => Promise<void>;
	toggleTheme: () => Promise<void>;
	focusField: ( selector: string ) => Promise<boolean>;
	toggleWidth: () => Promise<void>;
	logout: () => Promise<void>;
	parseSettings: ( settingsTemp: types.KeyValue ) => Promise<types.KeyValue>;
	toggleSetupDialogue: ( open?: boolean ) => Promise<void>;
	completeSetup: () => Promise<void>;
	getThread: (
		promptID?: number | null,
		limit?: number | null,
		more?: boolean,
	) => Promise<types.KeyValue[] | undefined>;
	scrollThread: ( upwards?: boolean ) => Promise<void>;
	getAvatarVoices: () => Promise<void>;
	getUserAvatar: () => Promise<void>;
	updateUserAvatarPersona: ( tempAvatarSettings: types.KeyValue ) => Promise<void>;
	saveUserAvatar: ( tempAvatarSettings: types.KeyValue ) => Promise<void>;
	getRules: () => Promise<void>;
	toggleRuleDialog: ( toggle: boolean, tempRule?: types.KeyValue | null ) => Promise<void>;
	addRule: ( tempRule: types.KeyValue ) => Promise<void>;
	saveRule: ( tempRule: types.KeyValue ) => Promise<void>;
	deleteRule: ( tempRule: types.KeyValue ) => Promise<void>;
	copyRule: ( tempRule: types.KeyValue ) => Promise<void>;
	toggleHeaderMenu: ( target: string ) => Promise<void>;
	closeHeaderMenu: () => Promise<void>;
	openWSS: ( user_id: number ) => Promise<void>;
	closeWSSDialogue: () => Promise<void>;
	closeWSS: () => Promise<void>;
	delay: ( ms?: number ) => Promise<void>;
	parseError: ( error: any ) => Promise<types.KeyValue>;
	logError: ( error: any ) => Promise<void>;
	timer: ( startTimer: moment.Moment ) => number;
}

export const useAppStore = create<AppState>( ( set, get ) => ( {
	settings: {},
	globalVars: {},
	startVars: null,
	authenticated: false,
	wss: null,
	wssReadyState: 0,
	wssDialogue: true,
	wssDialogueMessage: "Connecting to WSS...",
	wssError: "",
	wssMessage: null,
	wssConnectionAttempt: 0,
	wssConnectionAttemptMax: parseInt( getPublicEnv( "NEXT_PUBLIC_WSS_CONNECTION_ATTEMPT_MAX", "100" ), 10 ),
	wssConnectionDelay: parseInt( getPublicEnv( "NEXT_PUBLIC_WSS_CONNECTION_DELAY", "5000" ), 10 ),
	timezone: "",
	perPageOptions: [10, 25, 100, 500, 1000],
	perPageDefault: 100,
	controller,
	signal: controller.signal,
	collapsed: false,
	notificationCount: 0,
	notifications: [],
	notificationsSearch: "",
	userRole: "",
	userAuth: null,
	userName: "",
	userInitials: "",
	headerMenuOpen: false,
	headerMenuType: "",
	theme: "dark",
	loginTokenKey: getPublicEnv( "NEXT_PUBLIC_ENV", "development" ) + "_sz_login_token",
	versionKey: getPublicEnv( "NEXT_PUBLIC_ENV", "development" ) + "_sz_version",
	API: apiSingleton,
	timezoneOptions: [],
	setupComplete: false,
	selectedGuideRuleOptions: null,
	guideRuleOptions: [],
	selectedHardRuleOptions: null,
	hardRuleOptions: [],
	selectedCustomModelOption: null,
	customModelOptions: [],
	avatarTTS: null,
	setupDialogue: false,
	avatarSettings: {},
	avatarVoices: [],
	avatarPersonalities: [],
	rules: [],
	ruleKeyword: "",
	ruleDialogue: false,
	rule: null,
	avatarAudioLevel: 0,
	avatarResponse: "",
	avatarIsLoading: false,
	prompt: "",
	debugTimer: moment(),
	threadKeyword: "",
	thread: [],
	showLoadMore: true,
	totalAvailableThread: 0,
	dateFormat: "MM/DD/YYYY",
	devDateFormat: "YYYY-MM-DD",
	longDateFormat: "MMMM Do, YYYY",
	timeFormat: "h:mm A",
	militaryTimeFormat: "HH:mm",
	backendURL: buildBackendURL(),
	pages: [],
	logoText: getPublicEnv( "NEXT_PUBLIC_NAME", "Storm Zero" ).split( " " ),
	authBootstrapped: false,

	set: ( partial ) => set( partial ),

	checkVersion: async () => {
		const version = getPublicEnv( "NEXT_PUBLIC_VERSION", "1.0.1" );
		const localStorageVersion = localStorage.getItem( get().versionKey );
		if ( !localStorageVersion ) {
			localStorage.setItem( get().versionKey, version.toString() );
		}
		if ( localStorageVersion != version.toString() ) {
			localStorage.setItem( get().versionKey, version.toString() );
			window.location.reload();
		}
	},

	getUsers: async ( company_id = null, department_id = null, user_id = null, search = null ) => {
		const usersRes = ( await get().API.getUsers( company_id, department_id, user_id, search ) ) as types.KeyValue;
		if ( usersRes.success == true ) {
			return usersRes.results as types.KeyValue[];
		}
		return [] as types.KeyValue[];
	},

	sort: async ( array, key = "name", type = "string" ) => {
		return array.sort( ( a, b ): number => {
			if ( type == "string" ) {
				if ( a[key] && b[key] && a[key]! > b[key]! ) {
					return 1;
				} else if ( a[key] && b[key] && a[key]! < b[key]! ) {
					return -1;
				}
				return 0;
			} else {
				if ( a[key] && b[key] ) {
					return Number( b[key] ) - Number( a[key] );
				}
				return 0;
			}
		} );
	},

	setupAppStore: async () => {
		if ( !get().setupComplete ) {
			if ( localStorage.getItem( get().loginTokenKey ) ) {
				let user_id = null;
				let localStorageToken: any = localStorage.getItem( get().loginTokenKey );
				if ( validation.isJSON( localStorageToken ) ) {
					localStorageToken = JSON.parse( localStorageToken );
					if ( localStorageToken.user_id ) {
						user_id = localStorageToken.user_id;
					}
				}
				if ( user_id ) {
					const startAppRes = await get().API.startApp( user_id as string );
					if ( startAppRes.success == true ) {
						const startVars = ( startAppRes.results as types.KeyValue[] )[0] as types.KeyValue | null;
						set( { startVars } );
						if ( startVars ) {
							const globalVars = { ...get().globalVars };
							if ( startVars.env ) {
								for ( const [key, value] of Object.entries( startVars.env as types.KeyValue ) ) {
									globalVars[key] = value;
								}
							}
							set( { globalVars } );
							if ( startVars.settings ) {
								const settings = await get().parseSettings( startVars.settings as types.KeyValue );
								set( { settings } );
							}
							await get().getRules();
							await get().getAvatarVoices();
							await get().getUserAvatar();
							await get().getThread( null, 20, false );
							await get().scrollThread();
							if ( get().settings && get().settings.setup_complete == 0 ) {
								set( { setupDialogue: true } );
							}
						}
					}
				}
			}
			set( { setupComplete: true } );
		}
		return get().setupComplete;
	},

	testLogin: async () => {
		const testAuthRes: any = await get().API.testAuth();
		if ( testAuthRes && testAuthRes.success ) {
			if ( Object.hasOwn( testAuthRes, "authenticated" ) && testAuthRes.authenticated == true ) {
				set( { authenticated: testAuthRes.authenticated } );
			}
		}
		set( { authBootstrapped: true } );
	},

	setSubMenuHeights: async ( element = null ) => {
		await get().delay( 300 );
		let subMenus: HTMLElement[] | NodeListOf<HTMLElement> = [];
		if ( element ) {
			subMenus = [element];
		} else {
			subMenus = document.querySelectorAll( `.subMenuChildren` ) as NodeListOf<HTMLElement>;
		}
		for ( const subMenu of Array.from( subMenus ) ) {
			const newHeight: string = subMenu.scrollHeight + "px";
			subMenu.setAttribute( "style", `max-height: ${newHeight} !important` );
		}
	},

	toggleTheme: async () => {
		set( { theme: get().theme == "light" ? "dark" : "light" } );
	},

	focusField: async ( selector: string ) => {
		const element: HTMLElement | null = document.querySelector( selector );
		if ( !element ) {
			return false;
		}
		await get().delay( 50 );
		let focusTarget: HTMLElement | null = null;
		if ( typeof element.focus === "function" ) {
			focusTarget = element;
		} else {
			focusTarget = element.querySelector( "input,textarea,[contenteditable='true'],[tabindex]" ) as HTMLElement;
		}
		if ( !focusTarget || typeof focusTarget.focus !== "function" ) {
			return false;
		}
		focusTarget.focus();
		return true;
	},

	toggleWidth: async () => {
		// Simplified from Vue DOM-heavy toggleWidth: CSS variables handle layout via .collapsed class.
		set( { collapsed: !get().collapsed } );
	},

	logout: async () => {
		if ( get().authenticated ) {
			const logoutRes: types.KeyValue = await get().API.logout();
			if ( logoutRes.success ) {
				set( {
					authenticated: false,
					headerMenuOpen: false,
					headerMenuType: "",
					setupComplete: false,
				} );
				if ( typeof window !== "undefined" ) {
					window.location.href = "/login";
				}
			}
		}
	},

	parseSettings: async ( settingsTemp ) => {
		const settings = { ...settingsTemp };
		const firstName = settings.first_name ? ( settings.first_name as string ) : "";
		let userName = "";
		let userInitials = "";
		if ( firstName ) {
			userName += firstName;
			userInitials += firstName[0];
		}
		const lastName = settings.last_name ? ( settings.last_name as string ) : "";
		if ( firstName && lastName ) {
			userName += " ";
			userInitials += " ";
		}
		if ( lastName ) {
			userName += lastName;
			userInitials += lastName[0];
		}

		const momentTimeZone = moment.tz.guess( true );
		const timezoneOptions = [...get().timezoneOptions];
		if ( !timezoneOptions.includes( momentTimeZone ) ) {
			timezoneOptions.push( momentTimeZone );
		}
		if ( settings.timezone && settings.timezone !== momentTimeZone ) {
			settings.timezone = momentTimeZone;
		}

		let userRole = "";
		let userAuth: number | null = null;
		if ( settings.Role ) {
			if ( Array.isArray( settings.Role ) && settings.Role.length > 0 ) {
				settings.role = JSON.parse( JSON.stringify( ( settings.Role as types.KeyValue[] )[0] ) );
				userRole = ( settings.Role as types.KeyValue[] )[0].name as string;
				userAuth = ( settings.Role as types.KeyValue[] )[0].auth_level as number;
				delete settings.Role;
			}
		}

		set( { userName, userInitials, timezone: momentTimeZone, timezoneOptions, userRole, userAuth } );
		return settings;
	},

	toggleSetupDialogue: async ( open = false ) => {
		if ( open == true ) {
			set( { setupDialogue: true } );
		} else {
			await get().completeSetup();
			set( { setupDialogue: false } );
		}
	},

	completeSetup: async () => {
		const response = await get().API.updateUser( {
			user_id: get().settings.user_id as number,
			setup_complete: 1,
		} );
		if ( response.success === false ) {
			console.error( "Failed to complete setup:", response );
		}
	},

	getThread: async ( promptID = null, limit = null, more = false ) => {
		if ( more == false ) {
			set( { thread: [] } );
		}
		const response = await get().API.getThread(
			get().threadKeyword,
			promptID,
			false,
			get().settings.user_id?.toString() ?? "",
			limit,
		);
		if ( response.success === true && Array.isArray( response.results ) ) {
			const newThread: types.KeyValue[] = [];
			for ( const result of response.results ) {
				const item = JSON.parse( JSON.stringify( result ) );
				item.time = moment( item.created ).format( get().timeFormat );
				item.date = moment( item.created ).format( get().longDateFormat );
				if ( item.mime_type ) {
					switch ( item.mime_type ) {
						case "image/png":
						case "image/jpeg":
							item.file = '<img src="data:' + item.mime_type + ";base64," + item.base64 + '">';
							break;
					}
				}
				newThread.push( item );
			}
			set( { totalAvailableThread: response.total_rows as number } );
			if ( more == false ) {
				set( { thread: newThread } );
			}
			return newThread;
		}
	},

	scrollThread: async ( upwards = false ) => {
		const communicationThreadWrapper: any = document.querySelector( ".threadWrapper" );
		if ( communicationThreadWrapper ) {
			const communicationThread: any = communicationThreadWrapper.querySelector( ".thread" );
			if ( communicationThread ) {
				let scrollTop = 0;
				if ( communicationThread.clientHeight > communicationThreadWrapper.clientHeight ) {
					if ( upwards ) {
						scrollTop = 0;
					} else {
						scrollTop = communicationThread.clientHeight;
					}
				}
				communicationThreadWrapper.scrollTo( {
					top: scrollTop,
					behavior: "smooth",
				} );
			}
		}
	},

	getAvatarVoices: async () => {
		set( { avatarVoices: [] } );
		const response = await get().API.getAvatarVoices();
		if ( response.success === true && Array.isArray( response.results ) ) {
			set( { avatarVoices: response.results as types.KeyValue[] } );
		}
	},

	getUserAvatar: async () => {
		set( { avatarSettings: {}, avatarPersonalities: [] } );
		const response = await get().API.getUserAvatar( get().settings.user_id?.toString() ?? "" );
		if ( response.success == true && Array.isArray( response.results ) ) {
			const avatarRows = response.results as types.KeyValue[];
			if ( avatarRows.length > 0 ) {
				await get().updateUserAvatarPersona( avatarRows[0] as types.KeyValue );
			}
		}
	},

	updateUserAvatarPersona: async ( tempAvatarSettings ) => {
		const avatarPersonalities: types.KeyValue[] = [];
		const avatarSettings: types.KeyValue = {};
		for ( const [key, value] of Object.entries( tempAvatarSettings ) ) {
			if ( key.startsWith( "persona_" ) ) {
				const personalityOption = key.replace( "persona_", "" ).toLowerCase().split( "_" );
				avatarPersonalities.push( {
					key: key,
					startLabel: personalityOption[0] ?? "",
					endLabel: personalityOption[1] ?? "",
					value: value as types.KeyValue[string],
				} );
			}
			avatarSettings[key] = value as types.KeyValue[string];
		}
		set( { avatarPersonalities, avatarSettings } );
	},

	saveUserAvatar: async ( tempAvatarSettings ) => {
		await get().updateUserAvatarPersona( tempAvatarSettings );
		const response = await get().API.saveUserAvatar( tempAvatarSettings );
		if ( response.success === true ) {
			await get().completeSetup();
		}
	},

	getRules: async () => {
		set( { rules: [] } );
		const response = await get().API.getRules( get().ruleKeyword );
		set( { rules: ( response.results as types.KeyValue[] ) || [] } );
	},

	toggleRuleDialog: async ( toggle, tempRule = null ) => {
		if ( toggle ) {
			if ( tempRule !== null ) {
				set( { rule: { ...tempRule } } );
			} else {
				set( {
					rule: {
						global_rule_id: null,
						summary: "",
						rule: "",
						strict: 1,
						deleted: 0,
					},
				} );
			}
		} else {
			set( { rule: null } );
		}
		set( { ruleDialogue: toggle } );
	},

	addRule: async ( tempRule ) => {
		const response = await get().API.addRule( tempRule );
		if ( response.success === true ) {
			if ( get().ruleDialogue === true ) {
				await get().toggleRuleDialog( false );
			}
			await get().getRules();
		} else {
			console.error( "Failed to add rule:", response );
		}
	},

	saveRule: async ( tempRule ) => {
		const response = await get().API.saveRule( tempRule );
		if ( response.success === true ) {
			await get().getRules();
			if ( get().ruleDialogue === true ) {
				await get().toggleRuleDialog( false );
			}
		} else {
			console.error( "Failed to save rule:", response );
		}
	},

	deleteRule: async ( tempRule ) => {
		const response = await get().API.deleteRule( tempRule );
		if ( response.success === true ) {
			await get().getRules();
			if ( get().ruleDialogue === true ) {
				await get().toggleRuleDialog( false );
			}
		} else {
			console.error( "Failed to delete rule:", response );
		}
	},

	copyRule: async ( tempRule ) => {
		await get().addRule( tempRule );
	},

	toggleHeaderMenu: async ( target ) => {
		if ( target ) {
			set( { headerMenuType: target } );
		}
		set( { headerMenuOpen: !get().headerMenuOpen } );
	},

	closeHeaderMenu: async () => {
		set( { headerMenuOpen: false, headerMenuType: "" } );
	},

	openWSS: async ( user_id ) => {
		try {
			if ( get().authenticated ) {
				if ( get().wssReadyState === 1 && get().wss ) {
					await get().closeWSS();
				}

				let wssURL = "";
				wssURL += get().globalVars.WSS_PROTOCOL;
				wssURL += "://" + get().globalVars.WSS_HOST;
				wssURL += ":" + get().globalVars.WSS_PORT;
				wssURL += "?userID=" + user_id.toString();
				wssURL += "&userTimezone=" + get().timezone;
				if ( localStorage.getItem( get().loginTokenKey ) ) {
					let localStorageToken: any = localStorage.getItem( get().loginTokenKey );
					if ( validation.isJSON( localStorageToken ) ) {
						localStorageToken = JSON.parse( localStorageToken );
						if ( localStorageToken.login_token ) {
							wssURL += "&loginToken=" + localStorageToken.login_token;
						}
					}
				}

				const wss = new WebSocket( wssURL );
				set( { wss } );
				wss.onopen = async ( event: Event ) => {
					if ( get().wss !== wss ) {
						return;
					}
					if ( event.type == "open" && wss.readyState === WebSocket.OPEN ) {
						// High-risk operation: sends data over websocket; requires human review.
						wss.send(
							JSON.stringify( {
								type: "init",
								user_id: get().settings.user_id,
								user_timezone: get().timezone,
							} ),
						);
						set( { wssReadyState: 1, wssDialogue: false, wssConnectionAttempt: 0 } );
					}
				};
				wss.onmessage = async ( event ) => {
					if ( get().wss !== wss ) {
						return;
					}
					if ( validation.isJSON( event.data ) ) {
						const wssMessage = JSON.parse( event.data );
						switch ( wssMessage.type ) {
							case "ping":
								if ( wss.readyState === WebSocket.OPEN ) {
									// High-risk operation: sends data over websocket; requires human review.
									wss.send(
										JSON.stringify( {
											type: "pong",
											user_id: get().settings.user_id,
											user_timezone: get().timezone,
										} ),
									);
								}
								break;
							case "offline":
								await get().closeWSS();
								break;
							default:
								set( { wssMessage } );
								break;
						}
					}
				};
				wss.onerror = async ( event: Event ) => {
					if ( get().wss !== wss ) {
						return;
					}
					set( {
						wssError: ( event as ErrorEvent ).message as string,
						wssReadyState: 2,
						wssDialogue: true,
					} );
				};
				wss.onclose = async () => {
					if ( get().wss !== wss ) {
						return;
					}
					set( { wssReadyState: 0, wssDialogue: true } );
				};
			}
		} catch ( error: any ) {
			await get().logError( error );
		}
	},

	closeWSSDialogue: async () => {
		set( { wssDialogue: false } );
	},

	closeWSS: async () => {
		if ( get().authenticated && get().wss ) {
			get().wss!.close();
		}
	},

	delay: async ( ms = 3000 ) => {
		return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
	},

	parseError: async ( error: any ) => {
		const IP: string | null = await get().API.getIP();
		const currentUrl: string | null = window.location.href;
		const message: string | null = error.message;
		let userAgent: string | null = null;
		if ( navigator.userAgent ) {
			userAgent = navigator.userAgent;
			userAgent = userAgent.split( ") " ).join( "</li><li>" );
			userAgent = "<ul><li>" + userAgent + "</li></ul>";
		}
		let stack: string | null = null;
		let lineNumber: number | null = null;
		let fileName: string | null = null;
		if ( error.lineNumber ) {
			lineNumber = error.lineNumber;
			fileName = error.fileName;
		} else if ( error.stack ) {
			const stackLines = error.stack.split( "\n" );
			if ( stackLines.length > 1 ) {
				const firstStackLine = stackLines[1];
				const match = firstStackLine.match( /([a-zA-Z0-9._]+):(\d+):(\d+)/ );
				if ( match ) {
					lineNumber = match[2];
					fileName = match[1];
				}
			}
		}
		if ( error.stack ) {
			stack = error.stack;
			if ( stack !== null ) {
				stack = stack.replace( /\n/g, "</li><li>" );
				stack = "<ul><li>" + stack + "</li></ul>";
			}
		}
		const errorTemp: types.KeyValue = {};
		if ( message ) {
			errorTemp.message = message.toString();
		}
		if ( lineNumber ) {
			errorTemp.line = lineNumber;
		}
		if ( fileName ) {
			errorTemp.file = fileName;
		}
		if ( userAgent ) {
			errorTemp.user_agent = userAgent;
		}
		if ( IP ) {
			errorTemp.user_ip = IP;
		}
		if ( currentUrl ) {
			errorTemp.url = currentUrl;
		}
		if ( stack && stack !== null ) {
			errorTemp.stack = stack;
		}
		return errorTemp;
	},

	logError: async ( error: any ) => {
		const errorTemp: types.KeyValue = await get().parseError( error );
		await get().API.addError( errorTemp );
	},

	timer: ( startTimer ) => {
		const endTimer = moment();
		return endTimer.diff( startTimer, "milliseconds" );
	},
} ) );

registerStoreGetter( () => useAppStore.getState() );

