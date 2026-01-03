
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob } from '@google/genai';
import { Mic, MicOff, Brain, X, MessageSquare, Terminal, Waves, Activity, RefreshCw, Zap, Volume2 } from 'lucide-react';
import { Asset } from '../types';
import toast from 'react-hot-toast';

// --- HELPERS ---
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
  userRole: 'admin' | 'user';
}

const LiveAIAssistant: React.FC<LiveAIAssistantProps> = ({ assets, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const getFleetStatusFunction: FunctionDeclaration = {
    name: 'getFleetStatus',
    parameters: {
      type: Type.OBJECT,
      description: 'Get the current status of the entire logistics fleet or a specific asset.',
      properties: {
        assetId: {
          type: Type.STRING,
          description: 'Optional ID of a specific asset (e.g., SRC-104).',
        },
      },
    },
  };

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
    setAudioLevel(0);
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
            toast.success("Vanguard AI Link Operational");

            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            // For Visualization
            const analyzer = inputAudioContextRef.current!.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple audio level calculation for UI
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
            // Audio output
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
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Transcription
            if (message.serverContent?.inputTranscription) {
                setTranscription(prev => [...prev.slice(-9), `User: ${message.serverContent!.inputTranscription!.text}`]);
            }
            if (message.serverContent?.outputTranscription) {
                setTranscription(prev => [...prev.slice(-9), `Vanguard: ${message.serverContent!.outputTranscription!.text}`]);
            }

            // Function Calling
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'getFleetStatus') {
                  const assetId = (fc.args as any).assetId;
                  let result = "";
                  if (assetId) {
                    const asset = assets.find(a => a.id === assetId);
                    result = asset 
                        ? `Asset ${assetId} (${asset.name}) is currently ${asset.status} at ${asset.locationName || 'unknown location'} with ${Math.round(asset.fuelLevel)}% fuel.`
                        : `I couldn't find an asset with ID ${assetId}.`;
                  } else {
                    const movingCount = assets.filter(a => a.status === 'MOVING').length;
                    result = `The fleet has ${assets.length} total assets. ${movingCount} are currently in transit. There are ${assets.filter(a => a.status === 'BREAKDOWN').length} breakdowns reported.`;
                  }
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result } }
                  }));
                }
              }
            }
          },
          onerror: (e) => {
            console.error("Live AI Error:", e);
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the Saric Logistics Operations Vanguard AI. You assist the ${userRole} in managing the logistics fleet in Zambia. You can access fleet data via tools. Keep responses professional, operational, and brief. Use technical terms like 'Roger', 'Copy', 'Zulu Time', and 'Operational Status'. You represent the Kivion security standard.`,
          tools: [{ functionDeclarations: [getFleetStatusFunction] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      toast.error("Handshake Failed");
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {/* Assistant HUD Panel */}
      {isOpen && (
        <div className="w-96 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 ring-1 ring-white/10">
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <Brain size={24} className={isActive ? 'animate-pulse' : ''} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Neural Link</span>
                <h4 className="text-sm font-black uppercase tracking-widest">Vanguard AI Core</h4>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors"><X size={20} /></button>
          </div>

          <div className="p-8">
            <div className="h-48 mb-6 bg-slate-950/80 rounded-3xl border border-slate-800 p-5 overflow-y-auto scrollbar-hide flex flex-col gap-3 font-mono text-[11px] leading-relaxed shadow-inner">
               {transcription.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-800 space-y-3">
                    <Terminal size={32} className="opacity-20" />
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-40">Awaiting Comms Link</p>
                      <p className="text-[8px] uppercase tracking-widest text-indigo-500/40 mt-1">Status: Standby</p>
                    </div>
                 </div>
               ) : (
                 transcription.map((line, i) => (
                   <div key={i} className={`flex gap-2 ${line.startsWith('User') ? 'text-indigo-400' : 'text-slate-400'}`}>
                     <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                     <span>{line}</span>
                   </div>
                 ))
               )}
            </div>

            <div className="flex flex-col items-center gap-6">
               <div className="relative group">
                  <div 
                    className={`absolute inset-0 bg-indigo-500 rounded-full blur-2xl transition-opacity duration-300 ${isActive ? 'opacity-30' : 'opacity-0'}`} 
                    style={{ transform: `scale(${1 + audioLevel * 8})` }}
                  ></div>
                  <button 
                    onClick={isActive ? stopSession : startSession}
                    disabled={isConnecting}
                    className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-300 ${
                        isActive 
                        ? 'bg-red-500 text-white shadow-2xl shadow-red-500/30 ring-4 ring-red-500/20' 
                        : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isConnecting ? (
                      <RefreshCw className="animate-spin" size={28} />
                    ) : isActive ? (
                      <MicOff size={28} />
                    ) : (
                      <Mic size={28} />
                    )}
                  </button>
               </div>

               <div className="w-full flex flex-col items-center gap-4">
                  <div className="flex items-center gap-1.5 h-6">
                      {[...Array(12)].map((_, i) => (
                          <div 
                              key={i} 
                              className={`w-1 rounded-full transition-all duration-100 ${isActive ? 'bg-indigo-500' : 'bg-slate-800'}`}
                              style={{ 
                                height: isActive ? `${6 + Math.random() * (audioLevel * 100)}px` : '4px',
                                opacity: isActive ? 0.3 + (Math.random() * 0.7) : 1
                              }}
                          ></div>
                      ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-950 rounded-full border border-slate-800">
                    {isActive && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>}
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        {isActive ? 'Link established' : isConnecting ? 'Establishing Tunnel' : 'System Secure'}
                    </p>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[9px] font-black text-slate-700 uppercase tracking-widest px-8">
            <div className="flex items-center gap-1.5"><Zap size={10} className="text-kvi-gold" /> Kivion Secure</div>
            <span>V2.5.0-OPS</span>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 shadow-2xl hover:scale-110 active:scale-95 transition-all group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Brain size={28} className="group-hover:animate-pulse relative z-10" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <Activity size={8} className="text-white" />
          </div>
        </button>
      )}
    </div>
  );
};

export default LiveAIAssistant;
