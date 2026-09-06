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

// Ported from Vue Home.vue — chat, training panels, conversation history.
export default function HomePage() {
	const API = useMemo( () => new APIClass(), [] );
	const settings = useAppStore( ( s ) => s.settings );
	const globalVars = useAppStore( ( s ) => s.globalVars );
	return (
		<div>
			<h1>Home Page</h1>
		</div>
	);
}
