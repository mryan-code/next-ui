"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store/app";

// Ported from Vue Avatar.vue — WebGL audio-reactive ring + TTS playback.
export default function Avatar() {
	const avatarResponse = useAppStore( ( s ) => s.avatarResponse );
	const avatarTTS = useAppStore( ( s ) => s.avatarTTS );
	const avatarAudioLevel = useAppStore( ( s ) => s.avatarAudioLevel );
	const setStore = useAppStore( ( s ) => s.set );

	const canvasRef = useRef<HTMLCanvasElement | null>( null );
	const audioPlayerRef = useRef<HTMLAudioElement | null>( null );
	const [audioUrl, setAudioUrl] = useState<string | null>( null );

	const animationFrame = useRef( 0 );
	const audioContext = useRef<AudioContext | null>( null );
	const analyser = useRef<AnalyserNode | null>( null );
	const mediaElementSource = useRef<MediaElementAudioSourceNode | null>( null );
	const frequencyData = useRef<Uint8Array | null>( null );
	const lastFrame = useRef( 0 );
	const manualAudioLevel = useRef<number | null>( null );
	const manualAudioLevelUpdated = useRef( 0 );
	const speechAudioPulseFrame = useRef( 0 );
	const levelRef = useRef( avatarAudioLevel );
	levelRef.current = avatarAudioLevel;

	const createShader = ( gl: WebGLRenderingContext, type: number, source: string ): WebGLShader | null => {
		const shader = gl.createShader( type );
		if ( shader === null ) {
			return null;
		}
		gl.shaderSource( shader, source );
		gl.compileShader( shader );
		if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
			gl.deleteShader( shader );
			return null;
		}
		return shader;
	};

	const createProgram = ( gl: WebGLRenderingContext ): WebGLProgram | null => {
		const vertexShader = createShader(
			gl,
			gl.VERTEX_SHADER,
			`
			attribute vec2 position;
			void main() {
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`,
		);
		const fragmentShader = createShader(
			gl,
			gl.FRAGMENT_SHADER,
			`
			precision mediump float;
			uniform vec2 resolution;
			uniform float time;
			uniform float audio;
			uniform vec3 primaryColor;

			float ring(vec2 uv, float radius, float thickness) {
				return smoothstep(thickness, 0.0, abs(length(uv) - radius));
			}

			float spokes(vec2 uv, float count, float speed) {
				float angle = atan(uv.y, uv.x) + time * speed;
				return smoothstep(0.965, 1.0, abs(sin(angle * count)));
			}

			float grid(vec2 uv) {
				vec2 g = abs(fract((uv + time * 0.02) * 9.0) - 0.5);
				return smoothstep(0.492, 0.5, max(g.x, g.y));
			}

			void main() {
				vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
				float pulse = 0.08 + audio * 0.2;
				float core = ring(uv, 0.22 + pulse, 0.03 + audio * 0.02);
				float inner = ring(uv, 0.42 + sin(time * 1.7) * 0.025, 0.013);
				float outer = ring(uv, 0.72 + audio * 0.08, 0.018);
				float halo = smoothstep(0.95 + audio * 0.15, 0.18, length(uv));
				float radial = spokes(uv, 18.0, 0.38) * outer;
				float fine = spokes(uv, 54.0, -0.22) * ring(uv, 0.58, 0.02);
				float circuit = grid(uv) * smoothstep(0.9, 0.18, length(uv)) * 0.18;
				float sparks = smoothstep(0.986, 1.0, sin((uv.x * 37.0 + uv.y * 61.0) + time * 8.0));
				float glow = core * 1.5 + inner + outer * 1.4 + radial + fine * 0.7 + circuit + sparks * audio;
				vec3 base = clamp(primaryColor, 0.0, 1.0);
				vec3 darkTone = base * (0.18 + audio * 0.08);
				vec3 brightTone = min(base * (1.35 + audio * 0.35), vec3(1.0));
				vec3 coreTone = min(base * 1.6, vec3(1.0));
				vec3 color = darkTone * halo + brightTone * glow + coreTone * core;
				float alpha = smoothstep(1.05, 0.2, length(uv));
				gl_FragColor = vec4(color, alpha);
			}
		`,
		);

		if ( vertexShader === null || fragmentShader === null ) {
			return null;
		}

		const program = gl.createProgram();
		if ( program === null ) {
			return null;
		}

		gl.attachShader( program, vertexShader );
		gl.attachShader( program, fragmentShader );
		gl.linkProgram( program );

		if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
			gl.deleteProgram( program );
			return null;
		}

		return program;
	};

	const getPrimaryColor = (): [number, number, number] => {
		const fallback: [number, number, number] = [0.84, 0.12, 0.1];
		const style = getComputedStyle( document.documentElement );
		const rawValue = style.getPropertyValue( "--primary" ).trim();
		if ( !rawValue ) {
			return fallback;
		}
		const hexMatch = rawValue.match( /^#([\da-fA-F]{3}|[\da-fA-F]{6})$/ );
		if ( hexMatch ) {
			const compact = hexMatch[1];
			const normalizedHex =
				compact.length === 3
					? compact
							.split( "" )
							.map( ( value ) => `${value}${value}` )
							.join( "" )
					: compact;
			return [
				Number.parseInt( normalizedHex.slice( 0, 2 ), 16 ) / 255,
				Number.parseInt( normalizedHex.slice( 2, 4 ), 16 ) / 255,
				Number.parseInt( normalizedHex.slice( 4, 6 ), 16 ) / 255,
			];
		}
		return fallback;
	};

	const setAudioLevel = ( level: number ) => {
		manualAudioLevel.current = Math.max( 0, Math.min( level, 1 ) );
		manualAudioLevelUpdated.current = performance.now();
	};

	const emitAvatarAudioLevel = ( level: number ) => {
		window.dispatchEvent(
			new CustomEvent( "avatar-audio-level", {
				detail: { level: Math.max( 0, Math.min( level, 1 ) ) },
			} ),
		);
	};

	const stopSpeechAudioPulse = () => {
		if ( speechAudioPulseFrame.current !== 0 ) {
			window.cancelAnimationFrame( speechAudioPulseFrame.current );
			speechAudioPulseFrame.current = 0;
		}
	};

	const startSpeechAudioPulse = () => {
		stopSpeechAudioPulse();
		const pulse = ( now: number ) => {
			const level = 0.38 + Math.sin( now / 95 ) * 0.12 + Math.sin( now / 41 ) * 0.06;
			emitAvatarAudioLevel( level );
			speechAudioPulseFrame.current = window.requestAnimationFrame( pulse );
		};
		speechAudioPulseFrame.current = window.requestAnimationFrame( pulse );
	};

	useEffect( () => {
		const targetCanvas = canvasRef.current;
		if ( !targetCanvas ) {
			return;
		}

		const gl = targetCanvas.getContext( "webgl", { alpha: true, antialias: true } );
		if ( !gl ) {
			return;
		}
		const program = createProgram( gl );
		if ( !program ) {
			return;
		}

		const buffer = gl.createBuffer();
		const position = gl.getAttribLocation( program, "position" );
		const resolution = gl.getUniformLocation( program, "resolution" );
		const time = gl.getUniformLocation( program, "time" );
		const audio = gl.getUniformLocation( program, "audio" );
		const primaryColor = gl.getUniformLocation( program, "primaryColor" );
		if ( !buffer || position === -1 || !resolution || !time || !audio || !primaryColor ) {
			return;
		}

		gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] ), gl.STATIC_DRAW );
		gl.useProgram( program );
		gl.enableVertexAttribArray( position );
		gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0, 0 );

		const resizeCanvas = () => {
			const pixelRatio = window.devicePixelRatio || 1;
			const width = Math.max( Math.floor( targetCanvas.clientWidth * pixelRatio ), 1 );
			const height = Math.max( Math.floor( targetCanvas.clientHeight * pixelRatio ), 1 );
			if ( targetCanvas.width !== width || targetCanvas.height !== height ) {
				targetCanvas.width = width;
				targetCanvas.height = height;
			}
		};

		const updateAudioLevel = () => {
			if ( manualAudioLevel.current !== null && performance.now() - manualAudioLevelUpdated.current < 500 ) {
				const next = levelRef.current * 0.78 + manualAudioLevel.current * 0.22;
				levelRef.current = next;
				setStore( { avatarAudioLevel: next } );
				return;
			}
			if ( analyser.current === null || frequencyData.current === null ) {
				const fallback = 0.12 + Math.sin( performance.now() / 520 ) * 0.04;
				const next = levelRef.current * 0.94 + fallback * 0.06;
				levelRef.current = next;
				setStore( { avatarAudioLevel: next } );
				return;
			}
			analyser.current.getByteFrequencyData( frequencyData.current as Uint8Array<ArrayBuffer> );
			const sum = frequencyData.current.reduce( ( total, value ) => total + value, 0 );
			const nextLevel = Math.min( sum / frequencyData.current.length / 155, 1 );
			const next = levelRef.current * 0.82 + nextLevel * 0.18;
			levelRef.current = next;
			setStore( { avatarAudioLevel: next } );
		};

		const render = ( now: number ) => {
			lastFrame.current = lastFrame.current || now;
			const elapsed = ( now - lastFrame.current ) / 1000;
			lastFrame.current = now;
			updateAudioLevel();
			resizeCanvas();
			gl.viewport( 0, 0, targetCanvas.width, targetCanvas.height );
			gl.clearColor( 0, 0, 0, 0 );
			gl.clear( gl.COLOR_BUFFER_BIT );
			gl.uniform2f( resolution, targetCanvas.width, targetCanvas.height );
			gl.uniform1f( time, now / 1000 );
			gl.uniform1f( audio, Math.min( levelRef.current + elapsed * 0.1, 1 ) );
			const [r, g, b] = getPrimaryColor();
			gl.uniform3f( primaryColor, r, g, b );
			gl.drawArrays( gl.TRIANGLES, 0, 6 );
			animationFrame.current = window.requestAnimationFrame( render );
		};

		resizeCanvas();
		render( 0 );
		const resizeObserver = new ResizeObserver( resizeCanvas );
		resizeObserver.observe( targetCanvas );

		const onAvatarAudioLevel = ( event: Event ) => {
			const audioEvent = event as CustomEvent<{ level: number }>;
			if ( typeof audioEvent.detail?.level !== "number" ) {
				return;
			}
			setAudioLevel( audioEvent.detail.level );
		};
		window.addEventListener( "avatar-audio-level", onAvatarAudioLevel );

		return () => {
			window.cancelAnimationFrame( animationFrame.current );
			window.removeEventListener( "avatar-audio-level", onAvatarAudioLevel );
			stopSpeechAudioPulse();
			resizeObserver.disconnect();
			mediaElementSource.current?.disconnect();
			analyser.current?.disconnect();
			audioContext.current?.close();
		};
	}, [setStore] );

	useEffect( () => {
		void ( async () => {
			stopSpeechAudioPulse();
			if ( avatarTTS?.base64 ) {
				const audioBlob = await fetch(
					`data:${avatarTTS.mime_type || "audio/wav"};base64,${avatarTTS.base64}`,
				).then( ( res ) => res.blob() );
				if ( audioUrl ) {
					URL.revokeObjectURL( audioUrl );
				}
				const url = URL.createObjectURL( audioBlob );
				setAudioUrl( url );
				emitAvatarAudioLevel( 0.56 );
			}
		} )();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [avatarResponse, avatarTTS] );

	useEffect( () => {
		if ( audioUrl && audioPlayerRef.current ) {
			audioPlayerRef.current.play().catch( ( error ) => {
				console.error( "Playback failed:", error );
			} );
		}
	}, [audioUrl] );

	return (
		<>
			{avatarTTS?.base64 && audioUrl ? (
				<div className="audioPlayerWrapper">
					<audio
						ref={audioPlayerRef}
						src={audioUrl}
						onPlay={startSpeechAudioPulse}
						onPause={stopSpeechAudioPulse}
						onEnded={stopSpeechAudioPulse}
						controls
					/>
				</div>
			) : null}
			<div id="avatarWrapper">
				<div className="avatarVisual" aria-label="Audio reactive avatar">
					<canvas ref={canvasRef} className="avatarVisualCanvas" />
				</div>
			</div>
		</>
	);
}
