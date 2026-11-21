import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Gradients, Spacing, FontSizes, Radius } from '../../constants/theme';
import { setOnboardingSeen } from '../../utils/storage';

const slides = [
  {
    id: 1,
    emoji: '🎯',
    title: 'AI-Powered Coaching',
    description: 'Practice with AI that generates real interview questions tailored to your specific role.',
    bgColor: Colors.primary + '15',
  },
  {
    id: 2,
    emoji: '📝',
    title: 'Instant Feedback',
    description: 'Get detailed scores on structure, content, and communication. Know exactly how to improve.',
    bgColor: Colors.accent + '15',
  },
  {
    id: 3,
    emoji: '📄',
    title: 'Resume Analyzer',
    description: 'Paste your resume and job description to get an ATS compatibility score and rewrite suggestions.',
    bgColor: Colors.success + '15',
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const insets = useSafeAreaInsets();

  const handleNext = async () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const handleFinish = async () => {
    await setOnboardingSeen();
    // Don't navigate manually: the root layout (app/_layout.js) decides what
    // renders after onboarding — the login screen when signed out, or the
    // main app when a session already exists. Calling router.replace here
    // used to fire "action not handled by any navigator" errors because the
    // navigator isn't mounted while onboarding is showing.
    onComplete?.();
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Slide Content */}
      <View style={[styles.slideContainer, { backgroundColor: slides[currentSlide].bgColor }]}>
        {currentSlide > 0 && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Previous slide"
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
          {slides[currentSlide].emoji}
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          {slides[currentSlide].title}
        </Text>
        <Text style={styles.description}>{slides[currentSlide].description}</Text>
      </View>

      {/* Dots Indicator */}
      <View style={styles.dotsContainer} accessibilityRole="adjustable" accessibilityLabel={`Slide ${currentSlide + 1} of ${slides.length}`}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentSlide && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {!isLastSlide ? (
          <TouchableOpacity
            onPress={handleFinish}
            style={styles.skipButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}

        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButton}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Get started' : 'Next slide'}
        >
          <Text style={styles.nextText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Gradients.screen,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: Spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.textPrimary,
    fontSize: 22,
    lineHeight: 22,
    marginTop: -2,
  },
  emojiWrap: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.10)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xxxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: '90%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  dotActive: {
    backgroundColor: Colors.gradientStart,
    experimental_backgroundImage: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
    width: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: Colors.gradientStart,
    experimental_backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    minWidth: 120,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});

export default OnboardingScreen;
