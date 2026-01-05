
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob } from '@google/genai';
import { Mic, MicOff, Brain, X, Terminal, Waves, Activity, RefreshCw, Zap, Volume2, ShieldAlert, WifiOff } from 'lucide-react';
import { Asset, Profile } from '../types';
import { dbService } from '../services/dbService';
import toast from 'react-hot-toast';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface LiveAIAssistantProps {
  assets: Asset[];
  profile: Profile | null;
}

const LiveAIAssistant: React.FC<LiveAIAssistantProps> = ({ assets, profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const isDriverOnDuty = profile?.role === 'DRIVER' && profile?.onDuty;
  const isNoSim = profile?.noSim;

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            toast.success(isNoSim ? "Radio Link: Zero-Signal Active" : "Radio Link: Dispatch Logged");

            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              setAudioLevel(Math.sqrt(sum/inputData.length));

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setTranscription(prev => [...prev.slice(-4), `PTT: ${text}`]);
                if (isDriverOnDuty && profile) {
                  // Fix: Map profile role to incorrectly cased MessagePayload sender_role to fix TS errors.
                  const mappedRole = profile.role === 'admin' ? 'ADMIN' : (profile.role === 'user' ? 'EMPLOYEE' : profile.role);
                  dbService.sendMessage('radio:dispatch_log', {
                    text: text,
                    type: 'radio_packet',
                    sender_id: profile.id,
                    sender_name: profile.fullName,
                    sender_role: mappedRole as any,
                    is_radio: true
                  });
                }
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the Vanguard Tactical Radio Dispatcher. Professional, concise, high-pressure logistics environment. Respond as if over a tactical radio. Use Zulu time and phonetic alphabet where appropriate. ${isNoSim ? 'Operative is currently in a DEAD ZONE. Cellular signal is lost. Strictly use the radio protocol for all command directives.' : ''}`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      toast.error("Handshake Failed");
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="fixed bottom-12 right-12 z-[100] flex flex-col items-end gap-6">
      {isOpen && (
        <div className="w-[450px] bg-slate-950 border border-slate-800 rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 ring-4 ring-blue-600/20">
          <div className={`p-10 ${isNoSim ? 'bg-amber-600' : 'bg-blue-600'} flex justify-between items-center text-white transition-colors duration-500`}>
            <div className="flex items-center gap-4">
              {isNoSim ? <WifiOff size={32} className="animate-pulse" /> : <ShieldAlert size={32} className={isActive ? 'animate-pulse' : ''} />}
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">{isNoSim ? 'Zero-Signal Protocol' : 'Tactical Comm Unit'}</span>
                <h4 className="text-xl font-black uppercase tracking-tighter">VANGUARD RADIO</h4>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-3 rounded-2xl"><X size={24} /></button>
          </div>

          <div className="p-12 space-y-10">
            {isNoSim && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3">
                <ShieldAlert className="text-amber-500" size={18} />
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Cellular Signal Lost - Enforcing Radio Link</p>
              </div>
            )}

            <div className="h-40 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 font-mono text-xs text-blue-400 overflow-y-auto scrollbar-hide">
               {transcription.length === 0 ? ">> AWAITING SIGNAL HANDSHAKE..." : transcription.map((t, i) => <p key={i} className="mb-2 tracking-tight">{t}</p>)}
            </div>

            <div className="flex flex-col items-center gap-8">
              <button 
                onMouseDown={startSession}
                onMouseUp={stopSession}
                className={`w-28 h-28 rounded-[3.5rem] flex items-center justify-center transition-all duration-300 shadow-2xl ${
                    isActive 
                    ? (isNoSim ? 'bg-amber-600 ring-amber-600/30' : 'bg-blue-600 ring-blue-600/30') + ' text-white scale-110 ring-8'
                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700 active:scale-95'
                }`}
              >
                <Mic size={40} />
              </button>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">{isActive ? 'TRANSMITTING' : 'HOLD TO TALK (PTT)'}</p>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className={`w-24 h-24 bg-slate-900 border-4 ${isNoSim ? 'border-amber-600' : 'border-slate-800'} rounded-[2.5rem] flex items-center justify-center text-blue-600 shadow-2xl hover:scale-110 active:scale-95 transition-all group relative overflow-hidden`}
        >
          <Waves size={36} className={`${isActive || isNoSim ? 'animate-pulse' : ''} ${isNoSim ? 'text-amber-500' : 'text-blue-600'}`} />
          {(isDriverOnDuty || isNoSim) && <div className={`absolute top-2 right-2 w-4 h-4 ${isNoSim ? 'bg-amber-500' : 'bg-red-600'} rounded-full animate-ping`}></div>}
        </button>
      )}
    </div>
  );
};

export default LiveAIAssistant;
