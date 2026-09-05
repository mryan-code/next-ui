"use client";

import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	TextField,
	Button,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	Box,
} from "@mui/material";
import { useAppStore } from "@/lib/store/app";
import * as types from "@/lib/types";

// Ported from Vue RuleDialogue.vue — MUI Dialog for global rule CRUD.
export default function RuleDialogue() {
	const ruleDialogue = useAppStore( ( s ) => s.ruleDialogue );
	const rule = useAppStore( ( s ) => s.rule );
	const toggleRuleDialog = useAppStore( ( s ) => s.toggleRuleDialog );
	const addRule = useAppStore( ( s ) => s.addRule );
	const saveRule = useAppStore( ( s ) => s.saveRule );
	const setStore = useAppStore( ( s ) => s.set );

	const updateRule = ( patch: Partial<types.KeyValue> ) => {
		if ( !rule ) {
			return;
		}
		setStore( { rule: { ...rule, ...patch } } );
	};

	const isEdit = rule && rule.global_rule_id !== null;

	return (
		<Dialog open={ruleDialogue} onClose={() => void toggleRuleDialog( false )} maxWidth="sm" fullWidth>
			<DialogTitle>{isEdit ? "Edit" : "Add"} Rule</DialogTitle>
			<DialogContent>
				<Box className="styledForm" sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
					<TextField
						label="Summary"
						fullWidth
						value={( rule?.summary as string ) ?? ""}
						onChange={( e ) => updateRule( { summary: e.target.value } )}
					/>
					<TextField
						label="Rule"
						fullWidth
						multiline
						minRows={4}
						value={( rule?.rule as string ) ?? ""}
						onChange={( e ) => updateRule( { rule: e.target.value } )}
					/>
					<FormControl>
						<FormLabel>Type</FormLabel>
						<RadioGroup
							row
							value={String( ( rule?.strict as number ) ?? 1 )}
							onChange={( e ) => updateRule( { strict: Number( e.target.value ) } )}
						>
							<FormControlLabel value="1" control={<Radio />} label="Hard Rule" />
							<FormControlLabel value="0" control={<Radio />} label="Guideline" />
						</RadioGroup>
					</FormControl>
					<FormControl>
						<FormLabel>Deleted</FormLabel>
						<RadioGroup
							row
							value={String( ( rule?.deleted as number ) ?? 0 )}
							onChange={( e ) => updateRule( { deleted: Number( e.target.value ) } )}
						>
							<FormControlLabel value="1" control={<Radio />} label="Yes" />
							<FormControlLabel value="0" control={<Radio />} label="No" />
						</RadioGroup>
					</FormControl>
					<Button
						variant="contained"
						color="primary"
						disabled={!( rule?.summary as string ) || !( rule?.rule as string )}
						onClick={async () => {
							if ( !rule ) {
								return;
							}
							if ( rule.global_rule_id === null ) {
								await addRule( rule );
							} else {
								await saveRule( rule );
							}
						}}
					>
						{isEdit ? "Update" : "Add"} Rule
					</Button>
				</Box>
			</DialogContent>
		</Dialog>
	);
}
