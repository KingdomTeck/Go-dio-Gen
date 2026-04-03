import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Play, Loader2, Volume2, Download, Mic2, Settings2, Music, Sparkles, ChevronDown, ChevronUp, Save, Wand2, Check, Sun, Moon, Upload } from 'lucide-react';
import * as mammoth from 'mammoth';
// @ts-ignore
import lamejs from 'lamejs';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const AGES = ['Any', 'Child', 'Young Adult', 'Middle-Aged', 'Senior'];

const GENDERS = ['Any', 'Male', 'Female'];

const getVoicesForAccent = (accent: string) => {
  switch (accent) {
    case 'Nigerian':
      return [
        { id: 'Kore', name: 'Amaka (Calm & Clear)' },
        { id: 'Charon', name: 'Tobi (Deep & Resonant)' },
        { id: 'Zephyr', name: 'Ngozi (Light & Breezy)' },
        { id: 'Fenrir', name: 'Chidi (Strong & Authoritative)' },
        { id: 'Puck', name: 'Emeka (Quirky & Energetic)' },
      ];
    case 'British':
      return [
        { id: 'Kore', name: 'Emma (Calm & Clear)' },
        { id: 'Charon', name: 'Arthur (Deep & Resonant)' },
        { id: 'Zephyr', name: 'Olivia (Light & Breezy)' },
        { id: 'Fenrir', name: 'James (Strong & Authoritative)' },
        { id: 'Puck', name: 'Oliver (Quirky & Energetic)' },
      ];
    case 'American':
      return [
        { id: 'Kore', name: 'Sarah (Calm & Clear)' },
        { id: 'Charon', name: 'Marcus (Deep & Resonant)' },
        { id: 'Zephyr', name: 'Emily (Light & Breezy)' },
        { id: 'Fenrir', name: 'David (Strong & Authoritative)' },
        { id: 'Puck', name: 'Alex (Quirky & Energetic)' },
      ];
    case 'Australian':
      return [
        { id: 'Kore', name: 'Chloe (Calm & Clear)' },
        { id: 'Charon', name: 'Jack (Deep & Resonant)' },
        { id: 'Zephyr', name: 'Mia (Light & Breezy)' },
        { id: 'Fenrir', name: 'Noah (Strong & Authoritative)' },
        { id: 'Puck', name: 'Oliver (Quirky & Energetic)' },
      ];
    case 'South African':
      return [
        { id: 'Kore', name: 'Thandi (Calm & Clear)' },
        { id: 'Charon', name: 'Sipho (Deep & Resonant)' },
        { id: 'Zephyr', name: 'Lerato (Light & Breezy)' },
        { id: 'Fenrir', name: 'Johan (Strong & Authoritative)' },
        { id: 'Puck', name: 'Pieter (Quirky & Energetic)' },
      ];
    case 'Indian':
      return [
        { id: 'Kore', name: 'Priya (Calm & Clear)' },
        { id: 'Charon', name: 'Rahul (Deep & Resonant)' },
        { id: 'Zephyr', name: 'Ananya (Light & Breezy)' },
        { id: 'Fenrir', name: 'Vikram (Strong & Authoritative)' },
        { id: 'Puck', name: 'Arjun (Quirky & Energetic)' },
      ];
    case 'Irish':
      return [
        { id: 'Kore', name: 'Aoife (Calm & Clear)' },
        { id: 'Charon', name: 'Liam (Deep & Resonant)' },
        { id: 'Zephyr', name: 'Siobhan (Light & Breezy)' },
        { id: 'Fenrir', name: 'Conor (Strong & Authoritative)' },
        { id: 'Puck', name: 'Sean (Quirky & Energetic)' },
      ];
    default:
      return [
        { id: 'Puck', name: 'Puck (Quirky & Energetic)' },
        { id: 'Charon', name: 'Charon (Deep & Resonant)' },
        { id: 'Kore', name: 'Kore (Calm & Clear)' },
        { id: 'Fenrir', name: 'Fenrir (Strong & Authoritative)' },
        { id: 'Zephyr', name: 'Zephyr (Light & Breezy)' },
      ];
  }
};

const EMOTIONS = [
  'Neutral', 'Cheerful', 'Sad', 'Angry', 'Excited', 
  'Whispering', 'Shouting', 'Professional', 'Storytelling', 'Dramatic'
];

const TONES = [
  'Neutral', 'Casual', 'Formal', 'Urgent', 'Relaxed', 
  'Authoritative', 'Friendly', 'Sarcastic', 'Empathetic'
];

const PITCHES = ['Very Low', 'Low', 'Default', 'High', 'Very High'];

const ACCENTS = [
  'Default', 'Nigerian', 'British', 'American', 
  'Australian', 'South African', 'Indian', 'Irish'
];

const PURPOSES = [
  'General', 'Motion Graphic Video', 'Advertisement', 'Video Edit', 
  'Explainer Audio', 'Tutorial', 'Custom'
];

const MODELS = [
  { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini TTS (Speech)', icon: Mic2 },
  { id: 'elevenlabs', name: 'ElevenLabs (Voice Cloning)', icon: Sparkles },
];

const FORMATS = ['WAV', 'WebM', 'MP3'];

const EMOTION_PRESETS = [
  { label: 'Laugh', tag: 'Hahaha!' },
  { label: 'Chuckling', tag: 'Hehehe.' },
  { label: 'Long Laughing', tag: 'Ahahahaha! Hahahaha!' },
  { label: 'Sigh', tag: 'Haaah...' },
  { label: 'Gasp', tag: '*gasp*' },
  { label: 'Cry', tag: '*sob*' },
  { label: 'Clear Throat', tag: 'Ahem.' },
  { label: 'Whisper', tag: '(whispering)' },
];

const VoiceBackground = ({ active }: { active: boolean }) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-30 dark:opacity-40 transition-opacity duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(217,70,239,0.05)_0%,_transparent_60%)] dark:bg-[radial-gradient(circle_at_center,_rgba(217,70,239,0.1)_0%,_transparent_60%)]"></div>
      <div className="flex items-center gap-1.5 md:gap-3 h-48 md:h-64 px-4 w-full max-w-7xl justify-center">
        {[...Array(32)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 md:w-3 bg-gradient-to-t from-blue-600 via-fuchsia-500 to-pink-400 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.4)] dark:shadow-[0_0_20px_rgba(217,70,239,0.6)]"
            style={{
              height: active ? '100%' : '15%',
              animation: `${active ? 'soundwave' : 'idlewave'} ${active ? 0.3 + (i % 5) * 0.1 : 1.5 + (i % 4) * 0.5}s ease-in-out ${i * 0.05}s infinite alternate`,
              transition: 'height 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function App() {
  // State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [text, setText] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [voice, setVoice] = useState('Kore');
  const [emotion, setEmotion] = useState('Neutral');
  const [tone, setTone] = useState('Neutral');
  const [pitch, setPitch] = useState('Default');
  const [accent, setAccent] = useState('Default');
  const [age, setAge] = useState('Any');
  const [gender, setGender] = useState('Any');
  const [purpose, setPurpose] = useState('General');
  const [customPurpose, setCustomPurpose] = useState('');
  const [format, setFormat] = useState('WAV');
  const [volume, setVolume] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  // ElevenLabs State
  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([]);
  const [isCloningModalOpen, setIsCloningModalOpen] = useState(false);
  const [cloningFile, setCloningFile] = useState<File | null>(null);
  const [cloningName, setCloningName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('tts-theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);

    const saved = localStorage.getItem('tts-settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.model) setModel(s.model);
        if (s.voice) setVoice(s.voice);
        if (s.emotion) setEmotion(s.emotion);
        if (s.tone) setTone(s.tone);
        if (s.pitch) setPitch(s.pitch);
        if (s.accent) setAccent(s.accent);
        if (s.age) setAge(s.age);
        if (s.gender) setGender(s.gender);
        if (s.purpose) setPurpose(s.purpose);
        if (s.format) setFormat(s.format);
        if (s.volume !== undefined) setVolume(s.volume);
        if (s.speed !== undefined) setSpeed(s.speed);
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }

    // Fetch ElevenLabs voices if available
    fetchElevenLabsVoices();
  }, []);

  const fetchElevenLabsVoices = async () => {
    try {
      const res = await fetch('/api/elevenlabs/voices');
      if (res.ok) {
        const data = await res.json();
        if (data.voices) {
          setElevenLabsVoices(data.voices);
        }
      }
    } catch (e) {
      console.error("Failed to fetch ElevenLabs voices", e);
    }
  };

  const handleCloneVoice = async () => {
    if (!cloningFile || !cloningName.trim()) {
      setError("Please provide a name and an audio file to clone.");
      return;
    }
    
    setIsCloning(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', cloningName);
      formData.append('file', cloningFile);
      
      const res = await fetch('/api/elevenlabs/clone', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clone voice');
      
      await fetchElevenLabsVoices();
      setVoice(data.voice_id);
      setIsCloningModalOpen(false);
      setCloningFile(null);
      setCloningName('');
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to clone voice.");
    } finally {
      setIsCloning(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('tts-theme', newTheme);
  };

  const insertEmotion = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + tag + ' ');
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = text;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    
    // Add spaces around the tag if needed
    const prefix = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const suffix = after.length > 0 && !after.startsWith(' ') ? ' ' : '';
    
    const textToInsert = prefix + tag + suffix;
    const newText = before + textToInsert + after;
    
    setText(newText);

    // Restore focus and cursor position after state update
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioUrl]);

  const handleSaveSettings = () => {
    localStorage.setItem('tts-settings', JSON.stringify({
      model, voice, emotion, tone, pitch, accent, age, gender, purpose, format, volume, speed
    }));
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleEnhancePrompt = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert audio prompt engineer. Rewrite the following text to be highly descriptive and optimized for an AI Text-to-Speech or Music generation model. Make it sound natural, add descriptive cues if it's music, or improve the flow if it's speech. Return ONLY the rewritten text, nothing else. Text: ${text}`
      });
      if (response.text) {
        setText(response.text.trim());
      }
    } catch (e: any) {
      console.error(e);
      const errorString = typeof e === 'object' ? JSON.stringify(e, Object.getOwnPropertyNames(e)) : String(e);
      if (errorString.includes('403') || errorString.includes('PERMISSION_DENIED') || errorString.includes('Requested entity was not found')) {
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setError('Permission denied. Please select a valid paid Google Cloud API key and try again.');
          return;
        }
      }
      setError(e.message || 'Failed to enhance prompt.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setText(text);
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setText(result.value);
      } else if (file.type === 'application/pdf') {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { inlineData: { data: base64, mimeType: 'application/pdf' } },
            'Extract all the text/script from this document. Return ONLY the extracted text without any extra commentary.'
          ]
        });
        if (response.text) {
          setText(response.text.trim());
        }
      } else {
        setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      }
    } catch (err: any) {
      console.error(err);
      const errorString = typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
      if (errorString.includes('403') || errorString.includes('PERMISSION_DENIED') || errorString.includes('Requested entity was not found')) {
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setError('Permission denied. Please select a valid paid Google Cloud API key and try again.');
          return;
        }
      }
      setError(err.message || 'Failed to process file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text to generate audio.');
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      let rawAudioBlob: Blob;
      const activePurpose = purpose === 'Custom' ? customPurpose.trim() : purpose;

      // Process text for pauses
      // Dash (-) -> Long pause (...)
      // Semicolon (;) -> Short pause (,)
      const processedText = text
        .replace(/-/g, ' ... ')
        .replace(/;/g, ' , ');

      if (model === 'elevenlabs') {
        const res = await fetch('/api/elevenlabs/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: processedText, voice_id: voice })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate audio with ElevenLabs');
        }
        
        rawAudioBlob = await res.blob();
      } else {
        // TTS Model
        let promptText = processedText;
        let instructions = [];
        
        if (activePurpose && activePurpose !== 'General') instructions.push(`Context: This is a voiceover for a ${activePurpose}.`);
        if (tone !== 'Neutral') instructions.push(`Tone: ${tone}.`);
        if (emotion !== 'Neutral') instructions.push(`Emotion: ${emotion}.`);
        if (pitch !== 'Default') instructions.push(`Pitch: ${pitch}.`);
        if (accent !== 'Default') {
          const currentVoices = getVoicesForAccent(accent);
          const selectedVoice = currentVoices.find(v => v.id === voice) || currentVoices[0];
          instructions.push(`Speak with a ${accent} accent, adopting the persona of ${selectedVoice.name}.`);
        }
        if (age !== 'Any') instructions.push(`Age: ${age}.`);
        if (gender !== 'Any') instructions.push(`Gender: ${gender}.`);
        
        if (instructions.length > 0) {
          promptText = `${instructions.join(' ')}\n\n${processedText}`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: promptText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data received from the model.");

        const binary = atob(base64Audio);
        const rawPcmBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) rawPcmBytes[i] = binary.charCodeAt(i);
        
        rawAudioBlob = createWavBlob(rawPcmBytes, 24000, 1);
      }

      // --- Post-Processing (Volume & Speed) ---
      const arrayBuffer = await rawAudioBlob.arrayBuffer();
      const audioBuffer = await audioCtxRef.current!.decodeAudioData(arrayBuffer);
      
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        Math.ceil(audioBuffer.length / speed),
        audioBuffer.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speed;
      // @ts-ignore
      if ('preservesPitch' in source) source.preservesPitch = true;

      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const pcm16 = audioBufferToPcm16(renderedBuffer);
      const pcm8 = new Uint8Array(pcm16.buffer);

      // --- Format Conversion ---
      let finalBlob: Blob;
      if (format === 'MP3') {
        setIsConverting(true);
        try {
          finalBlob = convertPCM16ToMP3(pcm16, renderedBuffer.sampleRate, renderedBuffer.numberOfChannels);
        } catch (e) {
          console.error("MP3 Conversion failed", e);
          setError("MP3 conversion failed. Showing original format.");
          finalBlob = createWavBlob(pcm8, renderedBuffer.sampleRate, renderedBuffer.numberOfChannels);
        }
        setIsConverting(false);
      } else {
        finalBlob = createWavBlob(pcm8, renderedBuffer.sampleRate, renderedBuffer.numberOfChannels);
        if (format === 'WebM') {
          setIsConverting(true);
          try {
            finalBlob = await convertToWebM(finalBlob, audioCtxRef.current!);
          } catch (e) {
            console.error("Conversion failed", e);
            setError("WebM conversion failed. Showing original WAV format.");
          }
          setIsConverting(false);
        }
      }

      const url = URL.createObjectURL(finalBlob);
      setAudioUrl(url);
      
    } catch (err: any) {
      console.error(err);
      const errorString = typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err);
      if (errorString.includes('403') || errorString.includes('PERMISSION_DENIED') || errorString.includes('Requested entity was not found')) {
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setError('Permission denied. Please select a valid paid Google Cloud API key with access to this model and try again.');
          return;
        }
      }
      setError(err.message || 'An error occurred while generating audio.');
    } finally {
      setIsLoading(false);
      setIsConverting(false);
    }
  };

  return (
    <div className={theme}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-blue-950 dark:via-slate-950 dark:to-black dark:text-slate-200 font-sans p-6 md:p-12 relative overflow-hidden transition-colors duration-500">
        <style>{`
          @keyframes soundwave {
            0% { height: 10%; opacity: 0.4; }
            100% { height: 100%; opacity: 1; }
          }
          @keyframes idlewave {
            0% { height: 10%; opacity: 0.1; }
            100% { height: 30%; opacity: 0.3; }
          }
          :root {
            color-scheme: ${theme};
          }
        `}</style>
        
        <VoiceBackground active={isLoading || isConverting} />

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-8 h-8" />
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Go-dio Gen</h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Generate speech with emotions, AI enhancements, and full audio tracks using Google's AI models.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </header>

          {/* Main Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Settings Panel (Collapsible) */}
            <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-xl dark:shadow-2xl h-fit overflow-hidden transition-colors duration-300">
              <div className="flex items-center justify-between p-5 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-200 dark:border-slate-800/50">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <Settings2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Settings</h3>
                  {isSettingsOpen ? <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                </button>
                <button 
                  onClick={handleSaveSettings} 
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors ml-4"
                >
                  {showSavedToast ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {showSavedToast ? 'Saved!' : 'Save'}
                </button>
              </div>
              
              {isSettingsOpen && (
                <div className="p-5 space-y-6">
                  <div className="space-y-4">
                    
                    {/* Model Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Model</label>
                      <div className="space-y-2">
                        {MODELS.map(m => (
                          <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${model === m.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-500/50 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={(e) => setModel(e.target.value)} className="hidden" />
                            <m.icon className={`w-5 h-5 ${model === m.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="text-sm font-medium">{m.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Voice Selection */}
                    <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Voice</label>
                        {model === 'elevenlabs' && (
                          <button
                            onClick={() => setIsCloningModalOpen(true)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Clone Voice
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full appearance-none bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all dark:[&>option]:bg-slate-900">
                          {model === 'elevenlabs' ? (
                            elevenLabsVoices.map(v => <option key={v.voice_id} value={v.voice_id}>{v.name}</option>)
                          ) : (
                            getVoicesForAccent(accent).map(v => <option key={v.id} value={v.id}>{v.name}</option>)
                          )}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Audio Purpose */}
                    <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Audio Purpose</label>
                      <div className="relative">
                        <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full appearance-none bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all dark:[&>option]:bg-slate-900">
                          {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      {purpose === 'Custom' && (
                        <input
                          type="text"
                          value={customPurpose}
                          onChange={(e) => setCustomPurpose(e.target.value)}
                          placeholder="e.g., Sci-Fi short film narration"
                          className="w-full mt-3 p-3 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                      )}
                    </div>

                    {/* Emotion, Tone, Pitch & Accent */}
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Emotion</label>
                          <div className="relative">
                            <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="w-full appearance-none bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm dark:[&>option]:bg-slate-900">
                              {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tone</label>
                          <div className="relative">
                            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full appearance-none bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm dark:[&>option]:bg-slate-900">
                              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Voice Pitch</label>
                          <div className="relative">
                            <select value={pitch} onChange={(e) => setPitch(e.target.value)} className="w-full appearance-none bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm dark:[&>option]:bg-slate-900">
                              {PITCHES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Accent</label>
                          <div className="relative">
                            <select value={accent} onChange={(e) => setAccent(e.target.value)} className="w-full appearance-none bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm dark:[&>option]:bg-slate-900">
                              {ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Age</label>
                          <div className="relative">
                            <select value={age} onChange={(e) => setAge(e.target.value)} className="w-full appearance-none bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm dark:[&>option]:bg-slate-900">
                              {AGES.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                          <div className="relative">
                            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full appearance-none bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm dark:[&>option]:bg-slate-900">
                              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Volume & Speed Controls */}
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Volume</label>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{Math.round(volume * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="2" step="0.1" 
                          value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 dark:accent-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Speed</label>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{speed.toFixed(1)}x</span>
                        </div>
                        <input 
                          type="range" min="0.5" max="2" step="0.1" 
                          value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 dark:accent-blue-500"
                        />
                      </div>
                    </div>

                    {/* Export Format */}
                    <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Export Format</label>
                      <div className="flex gap-2">
                        {FORMATS.map(f => (
                          <label key={f} className={`flex-1 text-center py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors ${format === f ? 'bg-blue-600 text-white border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <input type="radio" name="format" value={f} checked={format === f} onChange={(e) => setFormat(e.target.value)} className="hidden" />
                            {f}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input & Results Panel */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden transition-colors duration-300">
                <div className="p-6 md:p-8 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Text to synthesize
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          accept=".pdf,.txt,.md,.docx" 
                          className="hidden" 
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()} 
                          disabled={isUploading}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          Upload Script
                        </button>
                        <button 
                          onClick={handleEnhancePrompt} 
                          disabled={isEnhancing || !text.trim()}
                          className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
                        >
                          {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                          AI Enhance Prompt
                        </button>
                      </div>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type something here or upload a script (PDF/DOCX/TXT)..."
                      className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none text-base placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <div className="flex flex-wrap gap-2 pt-1 pb-2">
                      {EMOTION_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => insertEmotion(preset.tag)}
                          className="text-xs px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                      <span className="font-medium">Pro tip:</span> Use a dash (<code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">-</code>) for a long pause, and a semicolon (<code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">;</code>) for a short pause.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || isConverting}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] dark:shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] px-8 py-4 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-6 h-6 animate-spin" /> Generating Audio...</>
                    ) : isConverting ? (
                      <><Loader2 className="w-6 h-6 animate-spin" /> Processing & Converting...</>
                    ) : (
                      <><Sparkles className="w-6 h-6" /> Generate Audio</>
                    )}
                  </button>

                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-500/20 text-sm">
                      {error}
                    </div>
                  )}
                </div>

                {/* Result Section */}
                {audioUrl && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-6 md:p-8 border-t border-slate-200 dark:border-slate-800/50 space-y-4 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Generated Audio
                      </h3>
                      <a
                        href={audioUrl}
                        download={`audio-${Date.now()}.${format.toLowerCase()}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download {format}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        controls
                        autoPlay
                        className="flex-1 h-10"
                      />
                      <div className="flex items-center gap-2 pr-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          Speed:
                        </label>
                        <select
                          value={playbackSpeed}
                          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                          className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="0.5">0.5x</option>
                          <option value="0.75">0.75x</option>
                          <option value="1">1x</option>
                          <option value="1.25">1.25x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2x</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pb-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            built by <a href="https://x.com/BenedictOc14977" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Ben</a>
          </p>
        </div>
      </div>

      {/* Cloning Modal */}
      {isCloningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Clone a Voice
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Upload a clean audio sample (at least 1 minute) to create a custom voice clone.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Voice Name</label>
                  <input
                    type="text"
                    value={cloningName}
                    onChange={(e) => setCloningName(e.target.value)}
                    placeholder="e.g., My Custom Voice"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Audio Sample</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-slate-400 dark:text-slate-500" />
                        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">MP3, WAV, or M4A</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="audio/*"
                        onChange={(e) => setCloningFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {cloningFile && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium truncate">
                      Selected: {cloningFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsCloningModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneVoice}
                  disabled={isCloning || !cloningFile || !cloningName.trim()}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isCloning ? 'Cloning...' : 'Clone Voice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to convert AudioBuffer to PCM16 Int16Array
function audioBufferToPcm16(audioBuffer: AudioBuffer): Int16Array {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const pcm16 = new Int16Array(length * numChannels);
  
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }
  
  let offset = 0;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let s = Math.max(-1, Math.min(1, channels[channel][i]));
      pcm16[offset++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
  }
  return pcm16;
}

// Helper to convert raw PCM8/16 to WAV
function createWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);

  const pcmArray = new Uint8Array(buffer, 44);
  pcmArray.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Helper to convert PCM16 to MP3 using lamejs
function convertPCM16ToMP3(pcm16: Int16Array, sampleRate: number, numChannels: number): Blob {
  // @ts-ignore
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const mp3Data: Int8Array[] = [];
  const sampleBlockSize = 1152;
  
  if (numChannels === 2) {
    const left = new Int16Array(pcm16.length / 2);
    const right = new Int16Array(pcm16.length / 2);
    for (let i = 0; i < pcm16.length; i += 2) {
      left[i/2] = pcm16[i];
      right[i/2] = pcm16[i+1];
    }
    for (let i = 0; i < left.length; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize);
      const rightChunk = right.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }
  } else {
    for (let i = 0; i < pcm16.length; i += sampleBlockSize) {
      const sampleChunk = pcm16.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }
  }
  
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);
  
  return new Blob(mp3Data, { type: 'audio/mp3' });
}

// Helper to convert Blob to WebM
async function convertToWebM(blob: Blob, ctx: AudioContext): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(URL.createObjectURL(blob));
    const source = ctx.createMediaElementSource(audio);
    const dest = ctx.createMediaStreamDestination();
    source.connect(dest);
    
    const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'audio/webm' }));
    };
    
    recorder.start();
    audio.play().catch(reject);
    audio.onended = () => recorder.stop();
    audio.onerror = reject;
  });
}
