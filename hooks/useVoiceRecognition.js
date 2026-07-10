import { useState, useEffect } from 'react';
import Voice from '@react-native-voice/voice';

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [isSupported, setIsSupported] = useState(true); // NEW: Track if mic is available

  useEffect(() => {
    // SAFETY CHECK: If Voice is null (like in Expo Go), don't attach listeners
    if (!Voice) {
      setIsSupported(false);
      return; 
    }

    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = () => setIsListening(false);
    Voice.onSpeechPartialResults = (e) => {
      if (e.value) setPartialText(e.value[0]);
    };

    return () => {
      if (Voice) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, []);

  const startListening = async (currentText, onResult) => {
    // Prevent crash if testing in Expo Go
    if (!isSupported) return; 

    try {
      setPartialText('');
      await Voice.start('en-US');
      
      Voice.onSpeechResults = (e) => {
        setIsListening(false);
        if (e.value) {
          const newText = currentText + ' ' + e.value[0];
          onResult(newText.trim());
        }
      };
    } catch (e) {
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    if (!isSupported) return;
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      setIsListening(false);
    }
  };

  return {
    isListening,
    isSupported, // Expose this so we can show a warning if not supported
    partialText,
    startListening,
    stopListening,
  };
};