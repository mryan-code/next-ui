"use client";

import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	IconButton,
	TextField,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	Select,
	MenuItem,
	Box,
	Typography,
	Slider,
	InputLabel,
} from "@mui/material";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store/app";
import * as types from "@/lib/types";

// Ported from Vue SetupDialogue.vue — avatar persona setup form.
export default function SetupDialogue() {
	const setupDialogue = useAppStore( ( s ) => s.setupDialogue );
	const avatarSettings = useAppStore( ( s ) => s.avatarSettings );
	const avatarVoices = useAppStore( ( s ) => s.avatarVoices );
	const avatarPersonalities = useAppStore( ( s ) => s.avatarPersonalities );
	const toggleSetupDialogue = useAppStore( ( s ) => s.toggleSetupDialogue );
	const saveUserAvatar = useAppStore( ( s ) => s.saveUserAvatar );
	const setStore = useAppStore( ( s ) => s.set );

	const patchAndSave = async ( patch: types.KeyValue ) => {
		const next = { ...avatarSettings, ...patch };
		setStore( { avatarSettings: next } );
		await saveUserAvatar( next );
	};

	return (
		<Dialog open={setupDialogue} onClose={() => void toggleSetupDialogue()} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				Setup
				<IconButton onClick={() => void toggleSetupDialogue()} aria-label="Close setup">
					<X size={18} />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<Box className="styledForm" sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
					<TextField
						label="User's Name"
						fullWidth
						value={( avatarSettings.user_name as string ) ?? ""}
						onChange={( e ) => void patchAndSave( { user_name: e.target.value } )}
					/>
					<TextField
						label="Avatar Name"
						fullWidth
						value={( avatarSettings.avatar_name as string ) ?? ""}
						onChange={( e ) => void patchAndSave( { avatar_name: e.target.value } )}
					/>
					<FormControl fullWidth>
						<InputLabel id="voice-label">Voice</InputLabel>
						<Select
							labelId="voice-label"
							label="Voice"
							value={( avatarSettings.avatar_voice as string ) ?? ""}
							onChange={( e ) => void patchAndSave( { avatar_voice: e.target.value } )}
						>
							{avatarVoices.map( ( voice ) => (
								<MenuItem key={String( voice.voice_id )} value={String( voice.option )}>
									{String( voice.label )}
								</MenuItem>
							) )}
						</Select>
					</FormControl>
					<Typography variant="subtitle2">Personality</Typography>
					{avatarPersonalities.map( ( personality ) => (
						<Box key={String( personality.key )} sx={{ px: 1 }}>
							<Box sx={{ display: "flex", justifyContent: "space-between" }}>
								<span>{String( personality.startLabel )}</span>
								<span>{String( personality.endLabel )}</span>
							</Box>
							<Slider
								min={10}
								max={100}
								step={1}
								value={Number( avatarSettings[String( personality.key )] ?? 50 )}
								onChange={(_, value ) =>
									void patchAndSave( { [String( personality.key )]: value as number } )
								}
							/>
						</Box>
					) )}
					<FormControl>
						<FormLabel>NSFW</FormLabel>
						<RadioGroup
							row
							value={String( avatarSettings.avatar_nsfw ?? 1 )}
							onChange={( e ) => void patchAndSave( { avatar_nsfw: Number( e.target.value ) } )}
						>
							<FormControlLabel value="1" control={<Radio />} label="Keep it clean" />
							<FormControlLabel value="0" control={<Radio />} label="No filters" />
						</RadioGroup>
					</FormControl>
					<FormControl>
						<FormLabel>User&apos;s Pronouns</FormLabel>
						<RadioGroup
							row
							value={( avatarSettings.user_pronouns as string ) ?? "They/Them"}
							onChange={( e ) => void patchAndSave( { user_pronouns: e.target.value } )}
						>
							<FormControlLabel value="He/Him" control={<Radio />} label="He/Him" />
							<FormControlLabel value="She/Her" control={<Radio />} label="She/Her" />
							<FormControlLabel value="They/Them" control={<Radio />} label="They/Them" />
						</RadioGroup>
					</FormControl>
				</Box>
			</DialogContent>
		</Dialog>
	);
}
