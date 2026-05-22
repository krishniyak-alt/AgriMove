import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Mic, MicOff, Send, Volume2, User, Play, Pause } from "lucide-react";

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  text?: string;
  voiceUrl?: string;
  timestamp: string;
}

interface ChatProps {
  currentUserId: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
}

// Global window typing for SpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const Chat: React.FC<ChatProps> = ({
  currentUserId,
  recipientId,
  recipientName,
  recipientRole
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recognitionText, setRecognitionText] = useState("");
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history
  const fetchChatHistory = async () => {
    try {
      const res = await axios.get(`/api/chat/history/${currentUserId}/${recipientId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  useEffect(() => {
    fetchChatHistory();
    // Poll chat history every 4 seconds for pseudo-realtime chat
    const timer = setInterval(fetchChatHistory, 4000);
    return () => clearInterval(timer);
  }, [currentUserId, recipientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up Speech Recognition (Tamil ta-IN)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ta-IN"; // TAMIL LANGUAGE CONFIGURATION

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const combinedText = finalTranscript || interimTranscript;
        setRecognitionText(combinedText);
        setInputText(combinedText); // Populate input box with transcribed text
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Handle Send Message
  const handleSendMessage = async (textToSend = inputText, voiceUrlToSend = "") => {
    if (!textToSend.trim() && !voiceUrlToSend) return;

    try {
      await axios.post("/api/chat/send", {
        senderId: currentUserId,
        receiverId: recipientId,
        text: textToSend,
        voiceUrl: voiceUrlToSend
      });
      
      setInputText("");
      setRecognitionText("");
      setAudioBlob(null);
      fetchChatHistory();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecognitionText("");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start speech-to-text simultaneously
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Speech recognition already running", e);
        }
      }
    } catch (err) {
      alert("Microphone permission required for voice messages.");
      console.error("Error starting recording:", err);
    }
  };

  // Stop Voice Recording & Upload
  const stopRecordingAndSend = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    setIsRecording(false);
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recognition", e);
      }
    }

    mediaRecorderRef.current.stop();

    // Small delay to ensure chunk aggregation is complete
    setTimeout(async () => {
      if (audioChunksRef.current.length === 0) return;

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.webm");
      formData.append("transcription", recognitionText);

      try {
        // Upload audio
        const uploadRes = await axios.post("/api/chat/upload-voice", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        const voiceUrl = uploadRes.data.fileUrl;
        const transcript = uploadRes.data.transcription || recognitionText;

        // Send chat message with audio URL + transcription
        await handleSendMessage(transcript, voiceUrl);
      } catch (err) {
        console.error("Error uploading audio message:", err);
      }
    }, 300);
  };

  // Cancel Recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setAudioBlob(null);
      setRecognitionText("");
      setInputText("");
    }
  };

  // Play/Pause Voice Message
  const playAudio = (url: string) => {
    if (activeAudioUrl === url) {
      // Pause
      const audios = document.getElementsByTagName("audio");
      for (let i = 0; i < audios.length; i++) {
        audios[i].pause();
      }
      setActiveAudioUrl(null);
    } else {
      // Play
      setActiveAudioUrl(url);
    }
  };

  return (
    <div className="flex flex-col h-[500px] rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-900 bg-zinc-900/40">
        <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <User className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm sm:text-base">{recipientName}</h3>
          <p className="text-zinc-500 text-xs uppercase tracking-wider">{recipientRole}</p>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <Volume2 className="h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-zinc-500 text-sm">No messages yet. Send a message to start conversation.</p>
            <p className="text-zinc-600 text-xs mt-1">Tamil voice and text are fully supported.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === currentUserId;
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
                    isMe
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-zinc-900 border border-zinc-850 text-zinc-100 rounded-bl-none"
                  }`}
                >
                  {/* Text Message */}
                  {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}

                  {/* Voice Player */}
                  {msg.voiceUrl && (
                    <div className="mt-2 flex items-center gap-3 bg-black/20 rounded-xl p-2 border border-black/10">
                      <button
                        onClick={() => playAudio(msg.voiceUrl!)}
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isMe ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"
                        } hover:scale-105 transition-transform`}
                      >
                        {activeAudioUrl === msg.voiceUrl ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <audio
                          src={msg.voiceUrl}
                          onPlay={() => setActiveAudioUrl(msg.voiceUrl!)}
                          onPause={() => setActiveAudioUrl(null)}
                          onEnded={() => setActiveAudioUrl(null)}
                          controls={false}
                          autoPlay={activeAudioUrl === msg.voiceUrl}
                          className="hidden"
                          id={`audio-${msg._id}`}
                        />
                        <div className="h-1.5 w-32 bg-zinc-700/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isMe ? "bg-white" : "bg-emerald-500"} ${
                              activeAudioUrl === msg.voiceUrl ? "w-full transition-all duration-[6000ms] ease-linear" : "w-0"
                            }`}
                          />
                        </div>
                      </div>
                      <Volume2 className="h-4 w-4 opacity-75" />
                    </div>
                  )}

                  {/* Timestamp */}
                  <span
                    className={`text-[9px] block text-right mt-1.5 ${
                      isMe ? "text-emerald-250 opacity-70" : "text-zinc-500"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-900/20 flex items-center gap-3">
        {/* Voice recording controls overlay */}
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-emerald-950/40 border border-emerald-500/20 rounded-xl px-4 py-3 animate-pulse">
            <span className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" />
              Recording Tamil Voice / குரல் பதிவு செய்யப்படுகிறது...
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={cancelRecording}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={stopRecordingAndSend}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-600/10"
              >
                <MicOff className="h-3.5 w-3.5" /> Stop & Send
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Record button */}
            <button
              onClick={startRecording}
              className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-emerald-400 flex items-center justify-center transition-all duration-200"
              title="Hold to Record Voice (Tamil)"
            >
              <Mic className="h-5 w-5" />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message in Tamil / English..."
              className="flex-1 h-12 bg-zinc-900/60 border border-zinc-850 focus:border-emerald-500/50 rounded-xl px-4 text-sm text-white focus:outline-none placeholder:text-zinc-600 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />

            {/* Send button */}
            <button
              onClick={() => handleSendMessage()}
              className="h-12 w-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/10 hover:scale-105 transition-transform"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default Chat;
