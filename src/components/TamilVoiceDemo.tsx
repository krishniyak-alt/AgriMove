import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Mic, MicOff, Sparkles, Send, MapPin, Scale, HelpCircle, Truck, Volume2 } from "lucide-react";
import { CustomMap } from "./CustomMap";

interface ParsedResult {
  crop: string;
  cropTamil: string;
  source: string;
  sourceTamil: string;
  destination: string;
  destinationTamil: string;
  quantity: number;
  quantityUnit: string;
  pickupCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
  distance: number;
  estimatedPrice: number;
  parsedMethod: string;
}

export const TamilVoiceDemo: React.FC = () => {
  const [text, setText] = useState("நான் தஞ்சாவூர்ல இருந்து மார்க்கெட்டுக்கு தக்காளி அனுப்பணும் 500 கிலோ இருக்கு.");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);

  const recognitionRef = useRef<any>(null);

  const sampleTexts = [
    "நான் தஞ்சாவூர்ல இருந்து மார்க்கெட்டுக்கு தக்காளி அனுப்பணும் 500 கிலோ இருக்கு.",
    "மதுரையிலிருந்து சென்னை கோயம்பேடு மார்க்கெட்டுக்கு 100 மூட்டை வெங்காயம் அனுப்பணும்.",
    "திருச்சியிலிருந்து கோவைக்கு 2 டன் உருளைக்கிழங்கு கொண்டு போக வண்டி வேணும்."
  ];

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "ta-IN"; // Tamil Language locale code

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setText("");
      setResult(null);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        alert("Speech Recognition API is not supported or permission denied in this browser.");
      }
    }
  };

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post("/api/transport/parse-nlp", { text });
      setResult(res.data.parsed);
    } catch (err) {
      console.error("Error parsing NLP text:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Bilingual NLP Speech Sandbox</h3>
          <p className="text-zinc-500 text-xs sm:text-sm">Speak or type in Tamil to generate smart transport requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Speech input */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Select Sample (எடுத்துக்காட்டுகள்)
            </label>
            <div className="flex flex-col gap-2">
              {sampleTexts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setText(sample);
                    setResult(null);
                  }}
                  className="text-left text-xs p-2.5 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Voice or Text Input (குரல் / உரை உள்ளீடு)
            </label>
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Speak in Tamil by clicking the microphone or type here..."
                className="w-full bg-zinc-900/60 border border-zinc-850 focus:border-emerald-500/50 rounded-xl p-4 pr-14 text-sm text-white focus:outline-none placeholder:text-zinc-600 transition-colors"
              />
              
              <button
                onClick={toggleRecording}
                className={`absolute bottom-4 right-4 h-10 w-10 rounded-full flex items-center justify-center ${
                  isRecording 
                    ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse" 
                    : "bg-zinc-800 border border-zinc-700 hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-400"
                } transition-all duration-200`}
                title={isRecording ? "Stop Recording" : "Record Speech (Tamil)"}
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleParse}
            disabled={loading || !text.trim()}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 transition-all duration-250 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                Parsing Tamil text...
              </span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze / பகுப்பாய்வு செய்க
              </>
            )}
          </button>
        </div>

        {/* Right Column: Extracted results & Mini Map */}
        <div className="lg:col-span-6">
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Crop (பயிர்)</span>
                  <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                    <Truck className="h-4 w-4 text-emerald-400" />
                    {result.crop} <span className="text-xs text-emerald-500">({result.cropTamil})</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Quantity (அளவு)</span>
                  <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                    <Scale className="h-4 w-4 text-emerald-400" />
                    {result.quantity} kg
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Source (கிளம்பும் இடம்)</span>
                  <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    {result.source} <span className="text-[11px] text-zinc-400">({result.sourceTamil})</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Destination (சேரும் இடம்)</span>
                  <div className="flex items-center gap-1.5 text-white font-medium text-sm">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    {result.destination} <span className="text-[11px] text-zinc-400">({result.destinationTamil})</span>
                  </div>
                </div>
              </div>

              {/* Map & Price estimate */}
              <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-850 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-zinc-400">Total Distance:</span>
                  <span className="font-semibold text-white">{result.distance} km</span>
                </div>
                
                <div className="flex items-center justify-between text-sm sm:text-base border-t border-zinc-850 pt-2">
                  <span className="text-zinc-300 font-medium">Est. Price (மதிப்பீட்டு விலை):</span>
                  <span className="font-bold text-emerald-400 text-lg">₹{result.estimatedPrice}</span>
                </div>

                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  <span>Parsed via: <span className="text-emerald-500 uppercase font-bold">{result.parsedMethod}</span></span>
                </div>
              </div>

              {/* Render dynamic mini routing map */}
              <CustomMap
                pickupCoords={result.pickupCoords}
                destinationCoords={result.destinationCoords}
                pickupName={result.source}
                destinationName={result.destination}
              />
            </div>
          ) : (
            <div className="h-full min-h-[250px] border border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-zinc-500">
              <Volume2 className="h-8 w-8 text-zinc-700 mb-2 animate-bounce" />
              <p className="text-sm">Extracted intent details will show here.</p>
              <p className="text-xs text-zinc-650 mt-1">Speak or enter a request above and click Analyze.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TamilVoiceDemo;
