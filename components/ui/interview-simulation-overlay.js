import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '../../constants/theme';

export default function InterviewSimulationOverlay({ visible = true, phase, role = 'professional', difficulty = 'adaptive', language = 'English' }) {
  const pulse = useSharedValue(0.65);

  React.useEffect(() => {
    if (visible) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
    return () => cancelAnimation(pulse);
  }, [pulse, visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.92 + pulse.value * 0.08 }],
  }));

  const evaluating = phase === 'evaluation';
  const title = evaluating ? 'Assessing your response' : 'Preparing your interview scenario';
  const description = evaluating
    ? 'Reviewing relevance, structure, clarity, and professional communication.'
    : `Calibrating a ${difficulty} ${role} interview in ${language}.`;
  const steps = evaluating
    ? ['Analyzing response', 'Measuring competencies', 'Preparing feedback']
    : ['Configuring interviewer', 'Selecting competency', 'Preparing question'];

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={() => {}}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <View style={styles.panel} accessible accessibilityRole="progressbar" accessibilityLiveRegion="polite">
          <View style={styles.liveRow}>
            <Animated.View style={[styles.liveDot, pulseStyle]} />
            <Text style={styles.liveText}>INTERVIEW SIMULATION ACTIVE</Text>
          </View>

          <View style={styles.scanner}>
            <Animated.View style={[styles.orbit, pulseStyle]} />
            <View style={styles.scannerCore}>
              <Ionicons name={evaluating ? 'analytics-outline' : 'person-outline'} size={30} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.steps}>
            {steps.map((step, index) => (
              <Animated.View key={step} entering={FadeIn.delay(index * 120)} style={styles.stepRow}>
                <View style={styles.stepIndex}><Text style={styles.stepIndexText}>{index + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
                <Ionicons name={index < 2 ? 'checkmark-circle' : 'ellipsis-horizontal-circle'} size={18} color={index < 2 ? '#35C792' : '#A998F4'} />
              </Animated.View>
            ))}
          </View>

          <Text style={styles.note}>Please remain on this screen. Your simulated interviewer will continue automatically.</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(12, 10, 31, 0.84)' },
  panel: { width: '100%', maxWidth: 360, gap: 16, borderRadius: 28, borderCurve: 'continuous', borderWidth: 1, borderColor: 'rgba(185,170,255,0.35)', backgroundColor: '#17132D', padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.34)' },
  liveRow: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, backgroundColor: 'rgba(112,71,245,0.18)', paddingHorizontal: 12, paddingVertical: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5BE0AC' },
  liveText: { color: '#D9D1FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.15 },
  scanner: { width: 92, height: 92, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', width: 92, height: 92, borderRadius: 46, borderWidth: 1.5, borderColor: '#8266F4', backgroundColor: 'rgba(112,71,245,0.08)' },
  scannerCore: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7047F5' },
  title: { color: '#FFFFFF', fontSize: 23, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  description: { color: '#BDB7D2', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  steps: { gap: 8 },
  stepRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.055)', paddingHorizontal: 11 },
  stepIndex: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(169,152,244,0.16)' },
  stepIndexText: { color: '#D9D1FF', fontSize: 10, fontWeight: '900' },
  stepText: { flex: 1, color: '#F4F1FF', fontSize: 12, fontWeight: '700' },
  note: { color: '#8F89A5', fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
