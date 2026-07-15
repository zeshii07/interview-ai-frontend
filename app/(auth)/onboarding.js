// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
// import { router } from 'expo-router';
// import { Colors, Spacing, FontSizes, Radius } from '../../constants/theme';
// import { setOnboardingSeen } from '../../utils/storage';

// const { width } = Dimensions.get('window');

// const slides = [
//   {
//     id: 1,
//     emoji: '🎯',
//     title: 'AI-Powered Coaching',
//     description: 'Practice with AI that generates real interview questions tailored to your specific role.',
//     bgColor: Colors.primary + '15',
//   },
//   {
//     id: 2,
//     emoji: '📝',
//     title: 'Instant Feedback',
//     description: 'Get detailed scores on structure, content, and communication. Know exactly how to improve.',
//     bgColor: Colors.secondary + '15',
//   },
//   {
//     id: 3,
//     emoji: '📄',
//     title: 'Resume Analyzer',
//     description: 'Paste your resume and job description to get an ATS compatibility score and rewrite suggestions.',
//     bgColor: Colors.success + '15',
//   },
// ];

// const OnboardingScreen = () => {
//   const [currentSlide, setCurrentSlide] = useState(0);

//   const handleNext = async () => {
//     if (currentSlide < slides.length - 1) {
//       setCurrentSlide(currentSlide + 1);
//     } else {
//       await handleFinish();
//     }
//   };

//   const handleFinish = async () => {
//     await setOnboardingSeen();
//     router.replace('/(tabs)'); // Go to home and remove onboarding from history
//   };

//   return (
//     <View style={styles.container}>
//       {/* Slide Content */}
//       <View style={[styles.slideContainer, { backgroundColor: slides[currentSlide].bgColor }]}>
//         <Text style={styles.emoji}>{slides[currentSlide].emoji}</Text>
//         <Text style={styles.title}>{slides[currentSlide].title}</Text>
//         <Text style={styles.description}>{slides[currentSlide].description}</Text>
//       </View>

//       {/* Dots Indicator */}
//       <View style={styles.dotsContainer}>
//         {slides.map((_, index) => (
//           <View
//             key={index}
//             style={[
//               styles.dot,
//               index === currentSlide && styles.dotActive,
//             ]}
//           />
//         ))}
//       </View>

//       {/* Buttons */}
//       <View style={styles.footer}>
//         {currentSlide < slides.length - 1 ? (
//           <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
//             <Text style={styles.skipText}>Skip</Text>
//           </TouchableOpacity>
//         ) : (
//           <View style={{ width: 50 }} />
//         )}

//         <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
//           <Text style={styles.nextText}>
//             {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//   },
//   slideContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: Spacing.xl,
//     borderBottomLeftRadius: 40,
//     borderBottomRightRadius: 40,
//     marginBottom: Spacing.xl,
//   },
//   emoji: {
//     fontSize: 80,
//     marginBottom: Spacing.xl,
//   },
//   title: {
//     color: Colors.text,
//     fontSize: FontSizes.xxxl,
//     fontWeight: '800',
//     textAlign: 'center',
//     marginBottom: Spacing.md,
//   },
//   description: {
//     color: Colors.textSecondary,
//     fontSize: FontSizes.md,
//     textAlign: 'center',
//     lineHeight: 26,
//     maxWidth: '90%',
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginBottom: Spacing.xl,
//   },
//   dot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: Colors.border,
//     marginHorizontal: Spacing.xs,
//   },
//   dotActive: {
//     backgroundColor: Colors.primary,
//     width: 30,
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: Spacing.xl,
//     paddingBottom: Spacing.xxl,
//   },
//   skipButton: {
//     padding: Spacing.sm,
//   },
//   skipText: {
//     color: Colors.textMuted,
//     fontSize: FontSizes.md,
//     fontWeight: '500',
//   },
//   nextButton: {
//     backgroundColor: Colors.primary,
//     paddingHorizontal: Spacing.xl,
//     paddingVertical: Spacing.md,
//     borderRadius: Radius.full,
//   },
//   nextText: {
//     color: Colors.text,
//     fontSize: FontSizes.md,
//     fontWeight: '700',
//   },
// });

// export default OnboardingScreen;


import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
    bgColor: Colors.secondary + '15',
  },
  {
    id: 3,
    emoji: '📄',
    title: 'Resume Analyzer',
    description: 'Paste your resume and job description to get an ATS compatibility score and rewrite suggestions.',
    bgColor: Colors.success + '15',
  },
];

const OnboardingScreen = () => {
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
    router.replace('/(tabs)'); // Go to home and remove onboarding from history
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
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.xl,
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
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.primary,
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
