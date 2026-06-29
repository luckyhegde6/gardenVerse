import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { ScreenHeader } from "@components/ui/ScreenHeader";
// import { EmptyState } from "@components/ui/EmptyState";
// import { LoadingSpinner } from "@components/ui/LoadingSpinner";
import { SkeletonLoader } from "@components/ui/SkeletonLoader";
import { colors, spacing, borderRadius, typography, shadows } from "@/styles/theme";
import api from "@services/api";
import HapticFeedback from "@utils/haptics";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DailyRewardDay {
  day: number;
  rewardAmount: number;
  rewardType: "GREEN_CREDITS" | "XP" | "ECO_POINTS" | "ITEM";
  status: "claimed" | "today" | "locked";
  icon: string;
}

interface DailyRewardData {
  currentStreak: number;
  longestStreak: number;
  streakShieldCount: number;
  nextRewardIn: string | null; // ISO string for countdown
  claimedToday: boolean;
  days: DailyRewardDay[];
}

type ClaimResponse = {
  streak: number;
  rewardAmount: number;
  rewardType: string;
  shieldCount: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function defaultRewardDays(_currentStreak: number): DailyRewardDay[] {
  return [
    { day: 1, rewardAmount: 10, rewardType: "GREEN_CREDITS", status: "locked", icon: "🪙" },
    { day: 2, rewardAmount: 20, rewardType: "GREEN_CREDITS", status: "locked", icon: "🪙" },
    { day: 3, rewardAmount: 30, rewardType: "GREEN_CREDITS", status: "locked", icon: "🪙" },
    { day: 4, rewardAmount: 50, rewardType: "ECO_POINTS", status: "locked", icon: "🌿" },
    { day: 5, rewardAmount: 50, rewardType: "GREEN_CREDITS", status: "locked", icon: "🪙" },
    { day: 6, rewardAmount: 75, rewardType: "GREEN_CREDITS", status: "locked", icon: "🪙" },
    { day: 7, rewardAmount: 100, rewardType: "XP", status: "locked", icon: "⭐" },
  ];
}

function getStreakIcon(streak: number): string {
  if (streak >= 60) return "🌋";
  if (streak >= 30) return "🔥";
  if (streak >= 14) return "⭐";
  if (streak >= 7) return "💪";
  if (streak >= 3) return "👍";
  return "🌱";
}

// ─── Claim Animation Overlay ────────────────────────────────────────────────

function ClaimOverlay({
  day,
  amount,
  type,
  onComplete,
}: {
  day: number;
  amount: number;
  type: string;
  onComplete: () => void;
}) {
  return (
    <View style={styles.claimOverlay}>
      <View style={styles.claimCard}>
        <Text style={styles.claimEmoji}>
          {type === "GREEN_CREDITS" ? "🪙" : type === "XP" ? "⭐" : "🌿"}
        </Text>
        <Text style={styles.claimTitle}>Day {day} Claimed!</Text>
        <Text style={styles.claimAmount}>
          +{amount} {type === "GREEN_CREDITS" ? "Credits" : type === "XP" ? "XP" : "Eco Points"}
        </Text>
        <TouchableOpacity
          style={styles.claimButton}
          onPress={onComplete}
          accessibilityLabel="Continue"
        >
          <Text style={styles.claimButtonText}>Awesome!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export function DailyRewardScreen() {
  const router = useRouter();

  const [data, setData] = useState<DailyRewardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Celebration overlay state
  const [celebration, setCelebration] = useState<ClaimResponse | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await api.get("/gamification");
      const d = res.data;

      const streak = d.currentStreak ?? 0;
      // Calculate which day in the 7-day cycle the user is on
      const cycleDay = ((streak - 1) % 7) + 1;
      const claimedToday = streak > 0 && d.claimedToday === undefined
        // If the backend returned streak but no claimedToday flag,
        // we assume today's reward was already given if streak is current
        ? false
        : Boolean(d.claimedToday);

      const days = defaultRewardDays(streak).map((day) => {
        const _isPast = day.day < cycleDay && !claimedToday;
        const isPastOrClaimed = day.day < cycleDay || (day.day === cycleDay && claimedToday);
        let status: DailyRewardDay["status"];
        if (isPastOrClaimed) {
          status = "claimed";
        } else if (day.day === cycleDay && !claimedToday) {
          status = "today";
        } else if (day.day === cycleDay - 1 && claimedToday) {
          status = "today";
        } else {
          status = "locked";
        }
        return { ...day, status };
      });

      setData({
        currentStreak: streak,
        longestStreak: d.longestStreak ?? streak,
        streakShieldCount: d.streakShieldCount ?? 0,
        nextRewardIn: d.nextRewardIn ?? null,
        claimedToday,
        days,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load daily rewards";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaim = useCallback(async () => {
    if (claiming || !data?.days.some((d) => d.status === "today")) return;

    setClaiming(true);
    try {
      await HapticFeedback.light();

      const res = await api.post("/gamification/claim");
      const result: ClaimResponse = res.data;

      await HapticFeedback.success();
      setCelebration(result);

      // Refresh data after claim
      await fetchData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to claim reward";
      await HapticFeedback.error();
      setError(message);
    } finally {
      setClaiming(false);
    }
  }, [claiming, data, fetchData]);

  const todayDay = data?.days.find((d) => d.status === "today");

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Daily Rewards"
          showBack
          onBack={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <SkeletonLoader width={80} height={80} borderRadius={40} style={styles.skeletonMargin} />
          <SkeletonLoader width="50%" height={24} borderRadius={6} style={styles.skeletonMargin} />
          <SkeletonLoader width="35%" height={16} borderRadius={4} style={styles.skeletonMarginMd} />
          <View style={styles.skeletonRow}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width={72} height={90} borderRadius={12} style={{ marginHorizontal: 4 }} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ─── Claim Overlay ────────────────────────────────────────────────────────

  if (celebration) {
    return (
      <ClaimOverlay
        day={((data?.currentStreak ?? 0) % 7) || 7}
        amount={celebration.rewardAmount}
        type={celebration.rewardType}
        onComplete={() => setCelebration(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Daily Rewards"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Streak Banner ─────────────────────────────────────────────── */}
        <Card style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <View style={styles.streakIconContainer}>
              <Text style={styles.streakIcon}>
                {getStreakIcon(data?.currentStreak ?? 0)}
              </Text>
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakCount}>
                {data?.currentStreak ?? 0}
              </Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
              {data && data.longestStreak > 0 && (
                <Text style={styles.streakBest}>
                  Best: {data.longestStreak} days
                </Text>
              )}
            </View>
            <View style={styles.streakRight}>
              <Badge
                label={data?.claimedToday ? "Claimed" : "Go!"}
                variant={data?.claimedToday ? "success" : "warning"}
              />
              {data && data.streakShieldCount > 0 && (
                <View style={styles.shieldRow}>
                  <Text style={styles.shieldIcon}>🛡️</Text>
                  <Text style={styles.shieldCount}>
                    {data.streakShieldCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── 7-Day Calendar Grid ───────────────────────────────────────── */}
        <Card style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>7-Day Cycle</Text>
          <View style={styles.daysRow}>
            {data?.days.map((day) => (
              <DayCell key={day.day} day={day} claiming={claiming} />
            ))}
          </View>
        </Card>

        {/* ── Today's Reward / Claim Button ──────────────────────────────── */}
        {todayDay && !data?.claimedToday && (
          <View style={styles.claimSection}>
            <Text style={styles.claimLabel}>
              Day {todayDay.day} Reward
            </Text>
            <TouchableOpacity
              style={[
                styles.claimButton,
                claiming && styles.claimButtonDisabled,
              ]}
              onPress={handleClaim}
              disabled={claiming}
              activeOpacity={0.8}
              accessibilityLabel={`Claim Day ${todayDay.day} reward`}
              accessibilityRole="button"
            >
              <Text style={styles.claimButtonIcon}>{todayDay.icon}</Text>
              <Text style={styles.claimButtonTextMain}>
                {claiming ? "Claiming..." : "Claim Reward"}
              </Text>
              <Text style={styles.claimButtonSub}>
                +{todayDay.rewardAmount}{" "}
                {todayDay.rewardType === "GREEN_CREDITS"
                  ? "Credits"
                  : todayDay.rewardType === "XP"
                    ? "XP"
                    : "Eco Pts"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {data?.claimedToday && (
          <Card style={styles.claimedCard}>
            <Text style={styles.claimedTitle}>Today's reward claimed!</Text>
            <Text style={styles.claimedSub}>
              Come back tomorrow to continue your streak.{" "}
              {data.streakShieldCount > 0
                ? "Your shield will keep your streak safe if you miss a day."
                : "Earn streak shields from special events!"}
            </Text>
          </Card>
        )}

        {/* ── Info Card ──────────────────────────────────────────────────── */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <InfoRow
            emoji="📅"
            text="Log in every day to build your streak and earn increasing rewards."
          />
          <InfoRow
            emoji="🔥"
            text="Rewards grow each day of the 7-day cycle. Day 7 has the best reward!"
          />
          <InfoRow
            emoji="🛡️"
            text="Streak shields protect your streak if you miss a day. Earn them from quest rewards."
          />
          <InfoRow
            emoji="⏰"
            text="You have a 12-hour grace period after the daily reset to claim your reward."
          />
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function DayCell({
  day,
  claiming: _claiming,
}: {
  day: DailyRewardDay;
  claiming: boolean;
}) {
  const isToday = day.status === "today";
  const isClaimed = day.status === "claimed";

  return (
    <View
      style={[
        styles.dayCell,
        isToday && styles.dayCellToday,
        isClaimed && styles.dayCellClaimed,
      ]}
    >
      <Text style={[styles.dayEmoji, (isToday || isClaimed) && styles.dayEmojiActive]}>
        {isClaimed ? "✅" : day.icon}
      </Text>
      <Text
        style={[
          styles.dayNumber,
          isToday && styles.dayNumberToday,
          isClaimed && styles.dayNumberClaimed,
        ]}
      >
        Day {day.day}
      </Text>
      <Text
        style={[
          styles.dayAmount,
          isToday && styles.dayAmountToday,
          isClaimed && styles.dayAmountClaimed,
        ]}
      >
        +{day.rewardAmount}
      </Text>
      <Badge
        label={
          day.status === "claimed" ? "Claimed" : day.status === "today" ? "Today" : "Locked"
        }
        variant={
          day.status === "claimed"
            ? "neutral"
            : day.status === "today"
              ? "warning"
              : "neutral"
        }
        size="sm"
      />
    </View>
  );
}

function InfoRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  skeletonMargin: {
    marginBottom: spacing.md,
  },
  skeletonMarginMd: {
    marginBottom: spacing.lg,
  },
  skeletonRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },

  // Streak Banner
  streakCard: {
    ...shadows.lg,
    backgroundColor: colors.primary,
    borderWidth: 0,
    paddingVertical: spacing.lg,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  streakIcon: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 36,
  },
  streakLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  streakBest: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  streakRight: {
    alignItems: "flex-end",
  },
  shieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  shieldIcon: {
    fontSize: 14,
    marginRight: 2,
  },
  shieldCount: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "700",
  },

  // Error
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },

  // Calendar Grid
  calendarCard: {
    marginTop: spacing.md,
  },
  calendarTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    width: 72,
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dayCellToday: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
  },
  dayCellClaimed: {
    backgroundColor: colors.successBg,
    borderColor: "transparent",
  },
  dayEmoji: {
    fontSize: 18,
    opacity: 0.4,
  },
  dayEmojiActive: {
    opacity: 1,
  },
  dayNumber: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  dayNumberToday: {
    color: colors.warning,
  },
  dayNumberClaimed: {
    color: colors.success,
    textDecorationLine: "line-through",
  },
  dayAmount: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayAmountToday: {
    color: colors.warning,
  },
  dayAmountClaimed: {
    color: colors.success,
    textDecorationLine: "line-through",
  },

  // Claim Section
  claimSection: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  claimLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  claimButton: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    width: "100%",
    ...shadows.lg,
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonIcon: {
    fontSize: 22,
  },
  claimButtonTextMain: {
    ...typography.button,
    color: colors.white,
    marginTop: 2,
  },
  claimButtonSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },

  // Claimed Card
  claimedCard: {
    marginTop: spacing.md,
    alignItems: "center",
    backgroundColor: colors.successBg,
  },
  claimedTitle: {
    ...typography.h4,
    color: colors.primaryDark,
  },
  claimedSub: {
    ...typography.bodySmall,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  // Info Card
  infoCard: {
    marginTop: spacing.md,
  },
  infoTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  infoEmoji: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 1,
    minWidth: 20,
  },
  infoText: {
    flex: 1,
    ...typography.bodySmall,
  },

  // Claim Overlay
  claimOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  claimCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
    ...shadows.xl,
  },
  claimEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  claimTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  claimAmount: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  claimButtonText: {
    ...typography.button,
    color: colors.white,
  },

  bottomSpacer: {
    height: spacing.xxl,
  },
});

export default DailyRewardScreen;
