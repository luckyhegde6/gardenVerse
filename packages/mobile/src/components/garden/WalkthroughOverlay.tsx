import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { getItem, setItem, StorageKeys } from "../../utils/storage";
import { colors, spacing, borderRadius, typography } from "../../styles/theme";
import HapticFeedback from "../../utils/haptics";

interface WalkthroughStep {
  title: string;
  description: string;
  icon: string;
  highlight: string;
}

const STEPS: WalkthroughStep[] = [
  {
    title: "Welcome to Your Garden!",
    description:
      "This is your 6\u00d76 plot grid where you'll grow plants. Each plot can hold one crop. Start by tapping an empty plot or the '+ Plant' button to choose your first plant.",
    icon: "\uD83C\uDF31",
    highlight: "Tap any empty plot to plant",
  },
  {
    title: "Choose & Plant",
    description:
      "Browse 20+ plant species including Tomato, Chilli, Mint, and Turmeric. Filter by category or search by name. Tap a plant to select it, choose an empty plot, then confirm to plant!",
    icon: "\uD83C\uDF3E",
    highlight: "Select a plant and empty plot",
  },
  {
    title: "Water Your Crops",
    description:
      "Crops need water to grow! Tap a planted crop to select it, then press the Water button (\uD83D\uDCA7) to keep it hydrated. Hydrated crops grow faster and stay healthier.",
    icon: "\uD83D\uDCA7",
    highlight: "Tap crop \u2192 Water button",
  },
  {
    title: "Fertilize for Growth",
    description:
      "Boost your crop's nutrient levels with the Fertilize button (\uD83C\uDF3F). Fertilized crops get a growth speed bonus and produce better yields at harvest.",
    icon: "\uD83C\uDF3F",
    highlight: "Tap crop \u2192 Fertilize button",
  },
  {
    title: "Harvest Your Rewards!",
    description:
      "When a crop reaches MATURE status, tap the Harvest button (\uD83E\uDDFA) to collect your yield! Virtual gardens grow at 100x speed \u2014 you'll see results in minutes, not days.",
    icon: "\uD83E\uDDFA",
    highlight: "Mature crop \u2192 Harvest button",
  },
];

interface WalkthroughOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function WalkthroughOverlay({
  visible,
  onComplete,
  onSkip,
}: WalkthroughOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const totalSteps = STEPS.length;

  const handleNext = useCallback(() => {
    HapticFeedback.light();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      HapticFeedback.success();
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handleSkip = useCallback(() => {
    HapticFeedback.light();
    onSkip();
  }, [onSkip]);

  const handleStepTap = useCallback(
    (index: number) => {
      HapticFeedback.light();
      setCurrentStep(index);
    },
    [],
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {STEPS.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleStepTap(i)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.progressDot,
                  i === currentStep
                    ? styles.progressDotActive
                    : i < currentStep
                      ? styles.progressDotDone
                      : styles.progressDotInactive,
                ]}
              >
                {i < currentStep && (
                  <Text style={styles.progressDotCheck}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step card */}
        <View style={styles.stepCard}>
          {/* Step icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
          </View>

          {/* Step title */}
          <Text style={styles.stepTitle}>{step.title}</Text>

          {/* Step description */}
          <Text style={styles.stepDescription}>{step.description}</Text>

          {/* Highlight caption */}
          <View style={styles.highlightContainer}>
            <Text style={styles.highlightLabel}>💡 </Text>
            <Text style={styles.highlightText}>{step.highlight}</Text>
          </View>

          {/* Step counter */}
          <Text style={styles.stepCounter}>
            {currentStep + 1} / {totalSteps}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip Tour</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? "✨ Got it!" : "Next →"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useWalkthrough() {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const completed = await getItem(StorageKeys.ONBOARDING_COMPLETE);
        if (!completed) {
          setShowWalkthrough(true);
        }
      } catch {
        setShowWalkthrough(true);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const completeWalkthrough = useCallback(async () => {
    try {
      await setItem(StorageKeys.ONBOARDING_COMPLETE, "true");
    } catch {
      // silent
    }
    setShowWalkthrough(false);
  }, []);

  const skipWalkthrough = useCallback(async () => {
    try {
      await setItem(StorageKeys.ONBOARDING_COMPLETE, "skipped");
    } catch {
      // silent
    }
    setShowWalkthrough(false);
  }, []);

  return {
    showWalkthrough: showWalkthrough && !checking,
    checking,
    completeWalkthrough,
    skipWalkthrough,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },

  // Progress dots
  progressContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  progressDotDone: {
    backgroundColor: colors.primaryLight,
  },
  progressDotInactive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressDotCheck: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },

  // Step card
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  stepIcon: {
    fontSize: 40,
  },
  stepTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  stepDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  highlightContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    width: "100%",
  },
  highlightLabel: {
    fontSize: 14,
  },
  highlightText: {
    ...typography.label,
    color: colors.primaryDark,
    flex: 1,
  },
  stepCounter: {
    ...typography.caption,
    color: colors.textSecondary,
    opacity: 0.6,
  },

  // Actions
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
    width: "100%",
    maxWidth: 380,
    gap: spacing.md,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  skipButtonText: {
    ...typography.button,
    color: "rgba(255,255,255,0.7)",
  },
  nextButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  nextButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
