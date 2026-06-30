import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Modal as RNModal,
  TouchableWithoutFeedback,
  TextInput,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
  useThemeColors,
} from "@/styles/tokens";
import type { ColorScheme } from "@/styles/tokens";
import type { MarketplaceListing } from "@/types";

interface BuyModalProps {
  visible: boolean;
  listing: MarketplaceListing | null;
  onClose: () => void;
  onConfirm: (quantity: number, couponCode?: string) => void;
  isProcessing?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CATEGORY_EMOJI: Record<string, string> = {
  seeds: "\uD83C\uDF31",
  fertilizers: "\uD83E\uDDEA",
  tools: "\uD83D\uDD27",
  services: "\uD83E\uDD1D",
  harvest: "\uD83C\uDF3E",
};

const CELEBRATION_EMOJIS = [
  "\uD83C\uDF89",
  "\u2728",
  "\uD83C\uDF1F",
  "\uD83D\uDCAB",
  "\u2B50",
  "\uD83C\uDF88",
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Reusable animated pressable wrapper ────────────────────────────────────

function AnimatedButton({
  onPress,
  disabled,
  style,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  disabled?: boolean;
  style?: object;
  children: React.ReactNode;
  accessibilityLabel: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
    >
      {children}
    </AnimatedPressable>
  );
}

// ─── Quantity +/- Button ────────────────────────────────────────────────────

function QuantityButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.qtyButton,
        { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
        disabled && styles.qtyButtonDisabled,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.qtyButtonText,
          { color: disabled ? colors.textMuted : colors.text },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// ─── Floating emoji particle ────────────────────────────────────────────────

function FloatingEmoji({ emoji, index }: { emoji: string; index: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const delay = index * 150;
    translateY.value = withDelay(
      delay,
      withTiming(-120 - index * 20, { duration: 1200, easing: Easing.out(Easing.ease) })
    );
    opacity.value = withDelay(
      delay,
      withTiming(0, { duration: 1200 })
    );
    translateX.value = withDelay(
      delay,
      withTiming((index % 2 === 0 ? 1 : -1) * (30 + index * 8), {
        duration: 1200,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.floatingEmoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

// ─── Celebration overlay ────────────────────────────────────────────────────

function CelebrationOverlay({ onFinish }: { onFinish: () => void }) {
  const colors = useThemeColors();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.celebrationContainer, { backgroundColor: colors.overlay }]}>
      <Animated.View style={[styles.celebrationContent, { backgroundColor: colors.surface }, animatedStyle]}>
        <Text style={styles.celebrationEmoji}>{CELEBRATION_EMOJIS[0]}</Text>
        <Text style={[styles.celebrationTitle, { color: colors.primary }]}>Purchase Complete!</Text>
        <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
          Thank you for your purchase
        </Text>
        <AnimatedButton
          onPress={onFinish}
          style={[styles.celebrationCloseBtn, { backgroundColor: colors.primary }]}
          accessibilityLabel="Done"
        >
          <Text style={[styles.celebrationCloseText, { color: colors.white }]}>Done</Text>
        </AnimatedButton>
      </Animated.View>
      {CELEBRATION_EMOJIS.slice(1).map((emoji, index) => (
        <FloatingEmoji key={index} emoji={emoji} index={index} />
      ))}
    </View>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function BuyModal({
  visible,
  listing,
  onClose,
  onConfirm,
  isProcessing = false,
}: BuyModalProps) {
  const colors = useThemeColors();
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const prevProcessing = useRef(isProcessing);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setCouponCode("");
      setShowCelebration(false);
      setHasConfirmed(false);
      translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
    }
  }, [visible, listing?.id]);

  // Detect processing completion → show celebration
  useEffect(() => {
    if (prevProcessing.current && !isProcessing && hasConfirmed) {
      setShowCelebration(true);
    }
    prevProcessing.current = isProcessing;
  }, [isProcessing, hasConfirmed]);

  const handleClose = useCallback(() => {
    if (isProcessing) return;
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
  }, [isProcessing, onClose, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const incrementQty = useCallback(() => {
    if (listing && quantity < listing.quantity) {
      setQuantity((q) => q + 1);
    }
  }, [listing, quantity]);

  const decrementQty = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const handleQtyTextChange = useCallback(
    (text: string) => {
      const num = parseInt(text, 10);
      if (!isNaN(num) && listing) {
        setQuantity(Math.max(1, Math.min(num, listing.quantity)));
      } else if (text === "") {
        setQuantity(1);
      }
    },
    [listing]
  );

  const handleConfirm = useCallback(() => {
    setHasConfirmed(true);
    onConfirm(quantity, couponCode.trim() || undefined);
  }, [quantity, couponCode, onConfirm]);

  const getCategoryEmoji = () => {
    if (!listing) return "\uD83C\uDFEA";
    return CATEGORY_EMOJI[listing.category.toLowerCase()] || "\uD83C\uDFEA";
  };

  const totalPrice = listing ? listing.price * quantity : 0;

  if (!listing) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.sheet, { backgroundColor: colors.surface }, animatedStyle]}>
              {/* Handle bar */}
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {showCelebration ? (
                <CelebrationOverlay onFinish={handleClose} />
              ) : (
                <>
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.headerTitle}>Confirm Purchase</Text>
                    <AnimatedButton
                      onPress={handleClose}
                      style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
                      disabled={isProcessing}
                      accessibilityLabel="Close"
                    >
                      <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
                    </AnimatedButton>
                  </View>

                  {/* Product Info */}
                  <View style={[styles.productInfo, { backgroundColor: colors.surfaceVariant }]}>
                    <View style={[styles.productEmojiContainer, { backgroundColor: colors.surface }]}>
                      <Text style={styles.productEmoji}>
                        {getCategoryEmoji()}
                      </Text>
                    </View>
                    <View style={styles.productDetails}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {listing.title}
                      </Text>
                      <Text style={[styles.productPrice, { color: colors.primary }]}>
                        {listing.price} {listing.currency} each
                      </Text>
                      <Text style={[styles.productSeller, { color: colors.textSecondary }]}>
                        Seller: {listing.seller.username}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Selector */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Quantity</Text>
                    <View style={styles.quantityRow}>
                      <QuantityButton
                        label="−"
                        onPress={decrementQty}
                        disabled={quantity <= 1}
                      />
                      <TextInput
                        style={[styles.quantityInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        value={String(quantity)}
                        onChangeText={handleQtyTextChange}
                        keyboardType="number-pad"
                        selectTextOnFocus
                        accessibilityLabel="Quantity input"
                      />
                      <QuantityButton
                        label="+"
                        onPress={incrementQty}
                        disabled={!!listing && quantity >= listing.quantity}
                      />
                      {listing && (
                        <Text style={[styles.maxQtyText, { color: colors.textMuted }]}>
                          of {listing.quantity}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Coupon Code */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                      Coupon Code (optional)
                    </Text>
                    <TextInput
                      style={[styles.couponInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      value={couponCode}
                      onChangeText={setCouponCode}
                      placeholder="Enter coupon code"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                      accessibilityLabel="Coupon code input"
                    />
                  </View>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Total */}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={[styles.totalPrice, { color: colors.primary }]}>
                      {totalPrice.toLocaleString()} {listing.currency}
                    </Text>
                  </View>

                  {/* Confirm Button */}
                  <AnimatedButton
                    onPress={handleConfirm}
                    disabled={isProcessing}
                    style={[
                      styles.confirmButton,
                      { backgroundColor: colors.primary },
                      isProcessing && styles.confirmButtonDisabled,
                    ]}
                    accessibilityLabel="Confirm purchase"
                  >
                    {isProcessing ? (
                      <Text style={[styles.confirmButtonText, { color: colors.white }]}>
                        Processing...
                      </Text>
                    ) : (
                      <Text style={[styles.confirmButtonText, { color: colors.white }]}>
                        Confirm Purchase
                      </Text>
                    )}
                  </AnimatedButton>
                </>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

export default BuyModal;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingS,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Product Info
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  productEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  productEmoji: {
    fontSize: 28,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  productPrice: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "600",
  },
  productSeller: {
    ...TYPOGRAPHY.caption,
  },

  // Sections
  section: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.sm,
  },

  // Quantity
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyButtonText: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  quantityInput: {
    width: 60,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 0,
  },
  maxQtyText: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.xs,
  },

  // Coupon
  couponInput: {
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },

  // Total
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  totalLabel: {
    ...TYPOGRAPHY.headingS,
  },
  totalPrice: {
    ...TYPOGRAPHY.headingM,
  },

  // Confirm Button
  confirmButton: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.button,
  },

  // Celebration
  celebrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
    minHeight: 320,
  },
  celebrationContent: {
    alignItems: "center",
    zIndex: 2,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  celebrationTitle: {
    ...TYPOGRAPHY.headingL,
    marginBottom: SPACING.xs,
  },
  celebrationSubtitle: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.lg,
  },
  celebrationCloseBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.full,
  },
  celebrationCloseText: {
    ...TYPOGRAPHY.button,
  },
  floatingEmoji: {
    position: "absolute",
    fontSize: 28,
    zIndex: 1,
  },
});
