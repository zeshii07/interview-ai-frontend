import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { interviewAPI } from '../services/api';

export const useVoiceRecognition = () => {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const timeoutRef = useRef(null);
  const stoppingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const configureAudio = async () => {
      try {
        const permission =
          await AudioModule.requestRecordingPermissionsAsync();

        if (!mounted) {
          return;
        }

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

        if (mounted) {
          setHasPermission(false);
        }
      }
    };

    configureAudio();

    return () => {
      mounted = false;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const stopListening = useCallback(
    async (currentText = '', onResult = () => {}) => {
      if (stoppingRef.current) {
        return;
      }

      if (!isListening && !recorderState.isRecording) {
        return;
      }

      stoppingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setIsListening(false);
      setIsTranscribing(true);

      try {
        await audioRecorder.stop();

        const uri = audioRecorder.uri;

        if (!uri) {
          throw new Error('The audio recorder did not return a file URI.');
        }

        const response = await interviewAPI.transcribeAudio(uri);

        if (!response?.success) {
          throw new Error(
            response?.message || 'The transcription request failed.'
          );
        }

        const transcript =
          typeof response.data === 'string'
            ? response.data
            : response.data?.text;

        if (!transcript) {
          throw new Error('The backend returned an empty transcript.');
        }

        const finalText = currentText
          ? `${currentText} ${transcript}`.trim()
          : transcript.trim();

        onResult(finalText);
      } catch (error) {
        console.error('Transcription failed:', error);

        Alert.alert(
          'Transcription failed',
          error?.message || 'Failed to process audio. Please try again.'
        );
      } finally {
        stoppingRef.current = false;
        setIsTranscribing(false);
      }
    },
    [
      audioRecorder,
      isListening,
      recorderState.isRecording,
    ]
  );

  const startListening = useCallback(
    async (currentText = '', onResult = () => {}) => {
      if (isListening || recorderState.isRecording || isTranscribing) {
        return;
      }

      try {
        let permissionGranted = hasPermission;

        if (!permissionGranted) {
          const permission =
            await AudioModule.requestRecordingPermissionsAsync();

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

        setIsListening(true);

        timeoutRef.current = setTimeout(() => {
          stopListening(currentText, onResult);
        }, 60000);
      } catch (error) {
        console.error('Failed to start recording:', error);
        setIsListening(false);

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