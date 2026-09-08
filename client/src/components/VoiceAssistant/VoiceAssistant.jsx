import React, { useState, useEffect, useRef } from "react";
import { showToast } from "../../toast";

const INTENT_KEYWORDS = {
  plumbing: ["plumber", "plumbing", "leak", "tap", "pipe", "sink", "water", "नल", "प्लम्बर", "पाइप", "लीकेज", "पानी"],
  electrical: ["electrician", "electric", "wiring", "fan", "switch", "short circuit", "light", "mcb", "बिजली", "इलेक्ट्रीशियन", "वायरिंग", "पंखा"],
  cleaning: ["clean", "cleaning", "maid", "deep clean", "sweeping", "sanitization", "सफाई", "क्लीनिंग", "झाड़ू", "पोछा"],
  carpentry: ["carpenter", "wood", "furniture", "door", "lock", "shelf", "बढ़ई", "कारपेंटर", "लकड़ी", "फर्नीचर", "दरवाजा"],
  cooking: ["cook", "cooking", "food", "meal", "chef", "dinner", "lunch", "खाना", "रसोई", "कुक", "भोजन"],
  driver: ["driver", "driving", "chauffeur", "car", "taxi", "गाड़ी", "ड्राइवर", "कार"],
  gardener: ["gardener", "garden", "plant", "lawn", "pruning", "माली", "पौधे", "बगीचा", "गार्डनर"],
};

export default function VoiceAssistant({ onServiceDetected, className = "" }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState("hi-IN"); // 'hi-IN' | 'en-IN'
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      setTranscript(speechResult);
      handleVoiceCommand(speechResult);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        showToast("Microphone permission denied. Please allow mic access.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [lang]);

  const speakFeedback = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (text) => {
    let matchedCategory = null;

    for (const [category, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some((kw) => text.includes(kw))) {
        matchedCategory = category;
        break;
      }
    }

    if (matchedCategory) {
      const feedback =
        lang === "hi-IN"
          ? `आपके लिए ${matchedCategory} सहकारी कारीगर खोजे गए हैं।`
          : `Showing verified ${matchedCategory} tradespeople for your request.`;
      showToast(`🎙️ "${text}" → ${matchedCategory.toUpperCase()}`);
      speakFeedback(feedback);
      onServiceDetected?.(matchedCategory, text);
    } else {
      const feedback =
        lang === "hi-IN"
          ? `माफ़ कीजिये, कृपया प्लम्बर, बिजली, बढ़ई या सफाई बोलें।`
          : `Please specify a trade like plumber, electrician, carpenter, or cleaning.`;
      showToast(`🎙️ Heard: "${text}". Try saying "Need plumber" or "बिजली मिस्त्री"`);
      speakFeedback(feedback);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start error:", err);
      }
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? "Listening... Click to stop" : "Speak to Book (Hindi/English)"}
        className={`h-11 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-none shadow-sm ${
          isListening
            ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200"
            : "bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-container hover:text-white"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {isListening ? "mic" : "mic"}
        </span>
        <span className="hidden sm:inline">
          {isListening ? "Listening..." : "Bolkar Khojein 🎙️"}
        </span>
      </button>

      {/* Language Toggle for Voice */}
      <button
        type="button"
        onClick={() => setLang(lang === "hi-IN" ? "en-IN" : "hi-IN")}
        className="px-2 py-1 bg-surface-container-low text-on-surface-variant hover:text-on-surface text-[11px] font-bold rounded-lg transition-colors border border-border-tone/30 cursor-pointer"
        title="Switch voice recognition language"
      >
        {lang === "hi-IN" ? "🇮🇳 हिन्दी" : "🇬🇧 English"}
      </button>

      {transcript && (
        <span className="text-xs text-primary font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-border-tone/40 max-w-[200px] truncate">
          "{transcript}"
        </span>
      )}
    </div>
  );
}
