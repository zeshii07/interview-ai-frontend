import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { interviewAPI, makeAbortable, isAbortError } from '../services/api';
import useInterviewStore from '../store/interviewStore';

/**
 * useVoiceRecognition
 *
 * Audio recording + transcription hook for the interview session screen.
 *
 * Memory-leak fixes vs. the original:
 *   1. On unmount we now stop the recorder if it's running (previously
 *      the audio session stayed active and the file handle leaked).
 *   2. The transcription axios call now uses an AbortController so the
 *      request is cancelled if the screen unmounts mid-upload (previously
 *      the response would land on an unmounted component and trigger a
 *      "Can't perform a React state update on unmounted component" warning).
 *   3. `mounted` ref gates every setState so async callbacks can't update
 *      state after unmount.
 */
export const useVoiceRecognition = () => {
  const currentLanguage = useInterviewStore((state) => state.currentLanguage);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const timeoutRef = useRef(null);
  const stoppingRef = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    const configureAudio = async () => {
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!mountedRef.current) return;

        setHasPermission(permission.granted);

        if (!permission.granted) {
          Alert.alert(
            'Microphone permission required',
            'Hirely needs microphone permission to record your interview answer.'
          );
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch (error) {
        console.error('Audio initialization failed:', error);
        if (mountedRef.current) setHasPermission(false);
      }
    };

    configureAudio();

    return () => {
      mountedRef.current = false;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Abort any in-flight transcription request so its response doesn't
      // try to setState on an unmounted component.
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      // Stop the recorder if it's still running (audio session + file handle leak fix)
      try {
        if (recorderState.isRecording && typeof audioRecorder.stop === 'function') {
          audioRecorder.stop();
        }
      } catch {
        // ignore — already stopped or never started
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopListening = useCallback(
    async (currentText = '', onResult = () => {}) => {
      if (stoppingRef.current) return;
      if (!isListening && !recorderState.isRecording) return;

      stoppingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (mountedRef.current) {
        setIsListening(false);
        setIsTranscribing(true);
      }

      // AbortController for this transcription request
      const ctrl = makeAbortable();
      abortRef.current = ctrl;

      try {
        await audioRecorder.stop();
        if (!mountedRef.current) return;

        const uri = audioRecorder.uri;
        if (!uri) throw new Error('The audio recorder did not return a file URI.');

        const response = await interviewAPI.transcribeAudio(
          uri,
          currentLanguage,
          ctrl.signal
        );

        if (!mountedRef.current) return;

        if (!response?.success) {
          throw new Error(response?.message || 'The transcription request failed.');
        }

        const transcript =
          typeof response.data === 'string'
            ? response.data
            : response.data?.text;

        if (!transcript) throw new Error('The backend returned an empty transcript.');

        const finalText = currentText
          ? `${currentText} ${transcript}`.trim()
          : transcript.trim();

        onResult(finalText);
      } catch (error) {
        if (isAbortError(error)) return; // expected on unmount / cancel
        console.error('Transcription failed:', error);
        if (mountedRef.current) {
          Alert.alert(
            'Transcription failed',
            error?.message || 'Failed to process audio. Please try again.'
          );
        }
      } finally {
        stoppingRef.current = false;
        if (abortRef.current === ctrl) abortRef.current = null;
        if (mountedRef.current) setIsTranscribing(false);
      }
    },
    [audioRecorder, currentLanguage, isListening, recorderState.isRecording]
  );

  const startListening = useCallback(
    async (currentText = '', onResult = () => {}) => {
      if (isListening || recorderState.isRecording || isTranscribing) return;

      try {
        let permissionGranted = hasPermission;

        if (!permissionGranted) {
          const permission = await AudioModule.requestRecordingPermissionsAsync();
          if (!mountedRef.current) return;
          permissionGranted = permission.granted;
          setHasPermission(permissionGranted);
        }

        if (!permissionGranted) {
          Alert.alert(
            'Microphone permission required',
            'Enable microphone access in your phone settings and try again.'
          );
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();

        if (!mountedRef.current) {
          try { audioRecorder.stop(); } catch {}
          return;
        }

        setIsListening(true);

        timeoutRef.current = setTimeout(() => {
          stopListening(currentText, onResult);
        }, 60000);
      } catch (error) {
        console.error('Failed to start recording:', error);
        if (mountedRef.current) setIsListening(false);
        Alert.alert(
          'Recording failed',
          error?.message || 'Unable to start microphone recording.'
        );
      }
    },
    [
      audioRecorder,
      hasPermission,
      isListening,
      isTranscribing,
      recorderState.isRecording,
      stopListening,
    ]
  );

  return {
    isListening,
    isTranscribing,
    hasPermission,
    recorderState,
    startListening,
    stopListening,
  };
};
