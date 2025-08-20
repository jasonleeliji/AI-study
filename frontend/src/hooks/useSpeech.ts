
import { useCallback } from 'react';

// Minimal type declarations to fix compiler errors when DOM library is not present.
declare class SpeechSynthesisUtterance extends EventTarget {
    constructor(text?: string);
    text: string;
    lang: string;
    rate: number;
    pitch: number;
    onend: ((this: SpeechSynthesisUtterance, ev: Event) => any) | null;
}
interface SpeechSynthesis {
    cancel(): void;
    speak(utterance: SpeechSynthesisUtterance): void;
    speaking: boolean;
}

export const useSpeech = () => {
  const speak = useCallback((text: string, lang = 'zh-CN', onEnd?: () => void) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && text) {
      const synth = window.speechSynthesis as SpeechSynthesis;
      // Cancel any ongoing speech to prevent overlap
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (onEnd) {
          utterance.onend = onEnd as any;
      }
      synth.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser or text is empty.');
      if (onEnd) {
          onEnd();
      }
    }
  }, []);

  return { speak };
};
