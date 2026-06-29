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
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from "../../styles/tokens";
import type { MarketplaceListing } from "../../types";

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
          disabled && styles.qtyButtonTextDisabled,
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
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.celebrationContainer}>
      <Animated.View style={[styles.celebrationContent, animatedStyle]}>
        <Text style={styles.celebrationEmoji}>{CELEBRATION_EMOJIS[0]}</Text>
        <Text style={styles.celebrationTitle}>Purchase Complete!</Text>
        <Text style={styles.celebrationSubtitle}>
          Thank you for your purchase
        </Text>
        <AnimatedButton
          onPress={onFinish}
          style={styles.celebrationCloseBtn}
          accessibilityLabel="Done"
        >
          <Text style={styles.celebrationCloseText}>Done</Text>
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
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.sheet, animatedStyle]}>
              {/* Handle bar */}
              <View style={styles.handle} />

              {showCelebration ? (
                <CelebrationOverlay onFinish={handleClose} />
              ) : (
                <>
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.headerTitle}>Confirm Purchase</Text>
                    <AnimatedButton
                      onPress={handleClose}
                      style={styles.closeButton}
                      disabled={isProcessing}
                      accessibilityLabel="Close"
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </AnimatedButton>
                  </View>

                  {/* Product Info */}
                  <View style={styles.productInfo}>
                    <View style={styles.productEmojiContainer}>
                      <Text style={styles.productEmoji}>
                        {getCategoryEmoji()}
                      </Text>
                    </View>
                    <View style={styles.productDetails}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {listing.title}
                      </Text>
                      <Text style={styles.productPrice}>
                        {listing.price} {listing.currency} each
                      </Text>
                      <Text style={styles.productSeller}>
                        Seller: {listing.seller.username}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Selector */}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Quantity</Text>
                    <View style={styles.quantityRow}>
                      <QuantityButton
                        label="−"
                        onPress={decrementQty}
                        disabled={quantity <= 1}
                      />
                      <TextInput
                        style={styles.quantityInput}
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
                        <Text style={styles.maxQtyText}>
                          of {listing.quantity}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Coupon Code */}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                      Coupon Code (optional)
                    </Text>
                    <TextInput
                      style={styles.couponInput}
                      value={couponCode}
                      onChangeText={setCouponCode}
                      placeholder="Enter coupon code"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="characters"
                      accessibilityLabel="Coupon code input"
                    />
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Total */}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalPrice}>
                      {totalPrice.toLocaleString()} {listing.currency}
                    </Text>
                  </View>

                  {/* Confirm Button */}
                  <AnimatedButton
                    onPress={handleConfirm}
                    disabled={isProcessing}
                    style={[
                      styles.confirmButton,
                      isProcessing && styles.confirmButtonDisabled,
                    ]}
                    accessibilityLabel="Confirm purchase"
                  >
                    {isProcessing ? (
                      <Text style={styles.confirmButtonText}>
                        Processing...
                      </Text>
                    ) : (
                      <Text style={styles.confirmButtonText}>
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
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
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
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  // Product Info
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
  },
  productEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
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
    color: COLORS.primary,
    fontWeight: "600",
  },
  productSeller: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },

  // Sections
  section: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyButtonText: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 24,
  },
  qtyButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  quantityInput: {
    width: 60,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    paddingVertical: 0,
  },
  maxQtyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },

  // Coupon
  couponInput: {
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
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
    color: COLORS.primary,
  },

  // Confirm Button
  confirmButton: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
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
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  celebrationSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  celebrationCloseBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  celebrationCloseText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  floatingEmoji: {
    position: "absolute",
    fontSize: 28,
    zIndex: 1,
  },
});
