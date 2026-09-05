"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Tabs,
	Tab,
	Typography,
	Button,
	TextField,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	Tooltip,
	IconButton,
	FormControlLabel,
	Radio,
	RadioGroup,
	FormLabel,
	Box,
	CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "lucide-react";
import APIClass from "@/lib/api";
import { useAppStore } from "@/lib/store/app";
import * as types from "@/lib/types";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import Avatar from "@/components/Avatar";
import SetupDialogue from "@/components/SetupDialogue";
import RuleDialogue from "@/components/RuleDialogue";

type UserGuideline = types.KeyValue & {
	user_guideline_id?: string | number;
	guideline?: string;
};
type UserConversationContent = types.KeyValue & {
	id?: string | number;
};
type UserConversation = types.KeyValue & {
	user_conversation_subject_id?: string | number;
	subject?: string;
	UserConversationContent?: UserConversationContent[];
};

// Ported from Vue Home.vue — chat, training panels, conversation history.
export default function HomePage() {
	const API = useMemo( () => new APIClass(), [] );
	const settings = useAppStore( ( s ) => s.settings );
	const globalVars = useAppStore( ( s ) => s.globalVars );
	const rules = useAppStore( ( s ) => s.rules );
	const ruleKeyword = useAppStore( ( s ) => s.ruleKeyword );
	const thread = useAppStore( ( s ) => s.thread );
	const showLoadMore = useAppStore( ( s ) => s.showLoadMore );
	const totalAvailableThread = useAppStore( ( s ) => s.totalAvailableThread );
	const prompt = useAppStore( ( s ) => s.prompt );
	const avatarIsLoading = useAppStore( ( s ) => s.avatarIsLoading );
	const setStore = useAppStore( ( s ) => s.set );
	const getRules = useAppStore( ( s ) => s.getRules );
	const toggleRuleDialog = useAppStore( ( s ) => s.toggleRuleDialog );
	const deleteRule = useAppStore( ( s ) => s.deleteRule );
	const copyRule = useAppStore( ( s ) => s.copyRule );
	const getThread = useAppStore( ( s ) => s.getThread );
	const scrollThread = useAppStore( ( s ) => s.scrollThread );
	const toggleSetupDialogue = useAppStore( ( s ) => s.toggleSetupDialogue );

	const [userGuidelineKeyword, setUserGuidelineKeyword] = useState( "" );
	const [userConversationKeyword, setUserConversationKeyword] = useState( "" );
	const [loadMoreAmount] = useState( 20 );
	const [conversationPanel, setConversationPanel] = useState( true );
	const [userGuideline, setUserGuideline] = useState<UserGuideline[]>( [] );
	const [userConversation, setUserConversation] = useState<UserConversation[]>( [] );
	const [userRulesTab, setUserRulesTab] = useState( "guidelines" );
	const [trainTab, setTrainTab] = useState( "system" );
	const [trainingOpen, setTrainingOpen] = useState( true );
	const [promptListen, setPromptListen] = useState( false );
	const [power] = useState( false );
	const [tts, setTts] = useState( true );

	const { result, start, stop } = useSpeechRecognition( {
		lang: "en-US",
		continuous: true,
		interimResults: true,
	} );

	const getResponseRows = <T extends types.KeyValue>( response: types.KeyValue ): T[] => {
		return response.success === true && Array.isArray( response.results ) ? ( response.results as T[] ) : [];
	};
	const getOptionalString = ( value: types.KeyValue[keyof types.KeyValue] ): string | undefined => {
		return typeof value === "string" ? value : undefined;
	};

	const isTrainer = useMemo( () => {
		const role = settings.role;
		return (
			typeof role === "object" &&
			role !== null &&
			!Array.isArray( role ) &&
			"name" in role &&
			( ( role as types.KeyValue ).name === "Administrator" || ( role as types.KeyValue ).name === "Trainer" )
		);
	}, [settings.role] );

	const chatRequest = async () => {
		try {
			const llmResponse = await API.chat( prompt, power, tts );
			if ( globalVars.GLOBAL_DEBUG_LEVEL == "debug" || globalVars.DEBUG_USER == "mryan" ) {
				console.log( "chat response", JSON.parse( JSON.stringify( llmResponse ) ) );
			}
			if (
				llmResponse.success == true &&
				llmResponse.results &&
				Array.isArray( llmResponse.results ) &&
				llmResponse.results.length > 0
			) {
				if ( llmResponse.results[0].response || llmResponse.results[0].media || llmResponse.results[0].prompt_id ) {
					if ( llmResponse.results[0].tts?.base64 ) {
						setStore( { avatarTTS: JSON.parse( JSON.stringify( llmResponse.results[0].tts ) ) } );
					} else {
						setStore( { avatarTTS: null } );
					}
					setStore( {
						avatarResponse: llmResponse.results[0].response || "",
						prompt: "",
						avatarIsLoading: false,
					} );
					await fetchUserConversation();
					await fetchUserGuideline();
					if ( llmResponse.results[0].prompt_id ) {
						const nextThread = await getThread( llmResponse.results[0].prompt_id, null, true );
						setStore( { thread: [...useAppStore.getState().thread, ...( nextThread || [] )] } );
						await scrollThread();
					}
				} else {
					setStore( { avatarResponse: "", avatarTTS: null } );
				}
			}
		} catch ( error ) {
			console.error( "chatRequest failed:", error );
		}
	};

	const chatSubmit = async () => {
		setStore( { avatarIsLoading: true } );
		await chatRequest().finally( () => {
			setStore( { avatarIsLoading: false } );
		} );
	};

	const chatKeydown = async ( event: React.KeyboardEvent<HTMLDivElement> ) => {
		if ( event.key === "Enter" && !event.shiftKey ) {
			event.preventDefault();
			setStore( { avatarIsLoading: true } );
			await chatRequest().finally( () => {
				setStore( { avatarIsLoading: false } );
			} );
		}
	};

	const fetchUserGuideline = async () => {
		setUserGuideline( [] );
		const response = await API.getUserGuideline(
			userGuidelineKeyword,
			false,
			getOptionalString( settings.user_id ),
		);
		setUserGuideline( getResponseRows<UserGuideline>( response ) );
	};

	const fetchUserConversation = async () => {
		setUserConversation( [] );
		const response = await API.getUserConversation(
			userConversationKeyword,
			false,
			getOptionalString( settings.user_id ),
		);
		setUserConversation( getResponseRows<UserConversation>( response ) );
	};

	const deleteUserConversationSubject = async ( row: types.KeyValue ) => {
		const response = await API.deleteUserConversationSubject( row );
		if ( response.success === true ) {
			await fetchUserConversation();
		} else {
			console.error( "Failed to delete userConversationSubject:", response );
		}
	};

	const togglePromptListen = async () => {
		const next = !promptListen;
		setPromptListen( next );
		if ( next ) {
			await start();
		} else {
			await stop();
		}
	};

	const loadMoreThread = async () => {
		const nextThread = await getThread( null, loadMoreAmount, true );
		const merged = [...( nextThread || [] ), ...useAppStore.getState().thread];
		setStore( {
			thread: merged,
			showLoadMore: totalAvailableThread > merged.length,
		} );
		await scrollThread( true );
	};

	const loadUserRulesTab = async () => {
		if ( userRulesTab === "conversations" ) {
			await fetchUserConversation();
		} else {
			await fetchUserGuideline();
		}
	};

	useEffect( () => {
		if ( !result ) {
			return;
		}
		const lastWord = prompt.split( " " ).pop()?.trim();
		if ( lastWord !== result.trim() ) {
			setStore( { prompt: prompt + result } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [result] );

	useEffect( () => {
		void ( async () => {
			if ( trainTab === "system" ) {
				await getRules();
			} else if ( trainTab === "user" ) {
				await loadUserRulesTab();
			}
		} )();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [trainTab] );

	useEffect( () => {
		void loadUserRulesTab();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userRulesTab] );

	return (
		<>
			<div id="avatarControls">
				{isTrainer ? (
					<Accordion expanded={trainingOpen} onChange={(_, exp) => setTrainingOpen( exp )} id="trainingControls">
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<span>Training Controls</span>
						</AccordionSummary>
						<AccordionDetails>
							<Tabs value={trainTab} onChange={(_, v) => setTrainTab( v )}>
								<Tab label="System" value="system" />
								<Tab label="User" value="user" />
							</Tabs>
							{trainTab === "system" ? (
								<Box sx={{ mt: 2 }}>
									<Typography paragraph>
										There are two types of global rules: hard rules, and guidelines. The hard rules
										are strict and must be followed, while guidelines are more flexible and can be
										overridden by user guidelines.
									</Typography>
									<Button
										variant="contained"
										color="primary"
										size="small"
										onClick={() => void toggleRuleDialog( true )}
										sx={{ mb: 2 }}
									>
										Create System Rule
									</Button>
									<div className="styledFilters">
										<div className="styledFilter">
											<span className="label">Search</span>
											<input
												type="text"
												value={ruleKeyword}
												onChange={( e ) => setStore( { ruleKeyword: e.target.value } )}
												onKeyUp={() => void getRules()}
											/>
										</div>
									</div>
									<div className="styledTable">
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Summary</TableCell>
													<TableCell>Type</TableCell>
													<TableCell>Deleted</TableCell>
													<TableCell>Actions</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{rules.length > 0 ? (
													rules.map( ( rule ) => (
														<TableRow key={String( rule.id ?? rule.global_rule_id )} hover>
															<TableCell>
																<Tooltip title={String( rule.rule ?? "" )}>
																	<span>{String( rule.summary )}</span>
																</Tooltip>
															</TableCell>
															<TableCell>
																{rule.strict == 1 ? "Hard Rule" : "Guideline"}
															</TableCell>
															<TableCell>{rule.deleted == 1 ? "Yes" : "No"}</TableCell>
															<TableCell className="actions">
																<IconButton
																	size="small"
																	onClick={() => void toggleRuleDialog( true, rule )}
																>
																	<SquarePen size={16} />
																</IconButton>
																<IconButton size="small" onClick={() => void deleteRule( rule )}>
																	<Trash size={16} />
																</IconButton>
																<IconButton size="small" onClick={() => void copyRule( rule )}>
																	<Copy size={16} />
																</IconButton>
															</TableCell>
														</TableRow>
													) )
												) : (
													<TableRow>
														<TableCell colSpan={4}>No results found.</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>
								</Box>
							) : (
								<Box sx={{ mt: 2 }}>
									<Typography paragraph>
										User rules are divided into conversations and guidelines. User rules will
										automatically be created based on the user&apos;s interactions with the AI.
									</Typography>
									<Tabs value={userRulesTab} onChange={(_, v) => setUserRulesTab( v )}>
										<Tab label="Conversations" value="conversations" />
										<Tab label="Guidelines" value="guidelines" />
									</Tabs>
									{userRulesTab === "conversations" ? (
										<Box sx={{ mt: 2 }}>
											<div className="styledFilters">
												<div className="styledFilter">
													<span className="label">Search</span>
													<input
														type="text"
														value={userConversationKeyword}
														onChange={( e ) => setUserConversationKeyword( e.target.value )}
														onKeyUp={() => void fetchUserConversation()}
													/>
												</div>
											</div>
											<div className="styledTable">
												<Table size="small">
													<TableHead>
														<TableRow>
															<TableCell>Subject</TableCell>
															<TableCell>Conversations</TableCell>
															<TableCell>Actions</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{userConversation.length > 0 ? (
															userConversation.map( ( data ) => (
																<TableRow
																	key={String( data.user_conversation_subject_id )}
																	hover
																>
																	<TableCell>{data.subject}</TableCell>
																	<TableCell>
																		<ol>
																			{( data.UserConversationContent || [] ).map(
																				( conversation ) => (
																					<li key={String( conversation.id )}>
																						<pre>
																							{JSON.stringify(
																								conversation,
																								null,
																								2,
																							)}
																						</pre>
																					</li>
																				),
																			)}
																		</ol>
																	</TableCell>
																	<TableCell className="actions">
																		<IconButton
																			size="small"
																			onClick={() =>
																				void deleteUserConversationSubject( data )
																			}
																		>
																			<Trash size={16} />
																		</IconButton>
																	</TableCell>
																</TableRow>
															) )
														) : (
															<TableRow>
																<TableCell colSpan={3}>No results found.</TableCell>
															</TableRow>
														)}
													</TableBody>
												</Table>
											</div>
										</Box>
									) : (
										<Box sx={{ mt: 2 }}>
											<div className="styledFilters">
												<div className="styledFilter">
													<span className="label">Search</span>
													<input
														type="text"
														value={userGuidelineKeyword}
														onChange={( e ) => setUserGuidelineKeyword( e.target.value )}
														onKeyUp={() => void fetchUserGuideline()}
													/>
												</div>
											</div>
											<div className="styledTable">
												<Table size="small">
													<TableHead>
														<TableRow>
															<TableCell>Guideline</TableCell>
															<TableCell>Actions</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{userGuideline.length > 0 ? (
															userGuideline.map( ( data ) => (
																<TableRow key={String( data.user_guideline_id )} hover>
																	<TableCell>{data.guideline}</TableCell>
																	<TableCell className="actions" />
																</TableRow>
															) )
														) : (
															<TableRow>
																<TableCell colSpan={2}>No results found.</TableCell>
															</TableRow>
														)}
													</TableBody>
												</Table>
											</div>
										</Box>
									)}
								</Box>
							)}
						</AccordionDetails>
					</Accordion>
				) : null}

				{thread.length > 0 ? (
					<Accordion
						expanded={conversationPanel}
						onChange={(_, exp) => setConversationPanel( exp )}
						id="conversationPanel"
					>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<span>Conversation History</span>
						</AccordionSummary>
						<AccordionDetails>
							<div className="threadWrapper">
								<div className="thread">
									{showLoadMore ? (
										<button
											className="button primary loadMoreButton"
											onClick={() => void loadMoreThread()}
										>
											Load More
										</button>
									) : null}
									{thread.map( ( item ) => (
										<div className="threadItem" key={String( item.prompt_id )}>
											<div className="threadItemContentWrapper">
												<div className="threadItemPrompt">
													<span className="threadItemText">{String( item.prompt )}</span>
												</div>
												<div className="threadItemResponse">
													{item.response ? (
														<span className="threadItemText">{String( item.response )}</span>
													) : null}
													{item.file ? (
														<span
															className="threadItemText"
															dangerouslySetInnerHTML={{ __html: String( item.file ) }}
														/>
													) : null}
												</div>
											</div>
										</div>
									) )}
								</div>
							</div>
						</AccordionDetails>
					</Accordion>
				) : null}
			</div>

			<div className="styledInlineForm">
				<div className="formGroup">
					<button className="button primary icon" onClick={() => void togglePromptListen()}>
						{promptListen ? <Mic /> : <MicOff />}
					</button>
				</div>
				<div className="formGroup">
					<span className="label">Power</span>
					<div className="radioGroup">
						<FormLabel component="legend" sx={{ display: "none" }}>
							Power
						</FormLabel>
						<RadioGroup row value={power ? "1" : "0"}>
							<FormControlLabel value="1" control={<Radio disabled />} label="Yes" />
							<FormControlLabel value="0" control={<Radio disabled />} label="No" />
						</RadioGroup>
					</div>
				</div>
				<div className="formGroup">
					<span className="label">TTS</span>
					<div className="radioGroup">
						<RadioGroup
							row
							value={tts ? "1" : "0"}
							onChange={( e ) => setTts( e.target.value === "1" )}
						>
							<FormControlLabel value="1" control={<Radio />} label="Yes" />
							<FormControlLabel value="0" control={<Radio />} label="No" />
						</RadioGroup>
					</div>
				</div>
				<div className="formGroup">
					<button className="button primary icon" onClick={() => void toggleSetupDialogue( true )}>
						<Cog />
					</button>
				</div>
			</div>

			<TextField
				multiline
				minRows={3}
				fullWidth
				placeholder="Prompt..."
				value={prompt}
				onChange={( e ) => setStore( { prompt: e.target.value } )}
				onKeyDown={( e ) => void chatKeydown( e )}
				sx={{ my: 2 }}
			/>

			<div className="submitWrapper">
				<button className="button primary" onClick={() => void chatSubmit()} disabled={!prompt}>
					Query
				</button>
				{avatarIsLoading ? (
					<div className="avatarLoader">
						<Loader className="spin" />
						<CircularProgress size={24} sx={{ ml: 1 }} />
					</div>
				) : null}
			</div>

			<Avatar />
			<RuleDialogue />
			<SetupDialogue />
		</>
	);
}
