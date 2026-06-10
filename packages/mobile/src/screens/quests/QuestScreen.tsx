import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ViewStyle,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { EmptyState } from "../../components/ui/EmptyState";
// import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { colors, spacing, borderRadius, typography, shadows } from "../../styles/theme";
import api from "../../services/api";
import HapticFeedback from "../../utils/haptics";
import { plantIdQuest } from "../../services/plantIdentificationQuest";
import type { QuestProgress, IdentifiedPlantPhoto } from "../../types";

// ─── Types ──────────────────────────────────────────────────────────────────

type QuestCategory = "DAILY" | "WEEKLY" | "SEASONAL";

interface QuestUserProgress {
  questId: string;
  progress: number;
  isCompleted: boolean;
  completedAt: string | null;
  claimedAt: string | null;
}

interface Quest {
  id: string;
  key: string;
  title: string;
  description: string;
  category: QuestCategory;
  type: string;
  targetCount: number;
  xpReward: number;
  creditReward: number;
  itemReward: string | null;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  season: { id: string; name: string } | null;
  userProgress: QuestUserProgress | null;
}

interface QuestsGrouped {
  DAILY: Quest[];
  WEEKLY: Quest[];
  SEASONAL: Quest[];
}

interface QuestsSummary {
  total: number;
  completed: number;
  claimed: number;
  pendingClaim: number;
}

interface QuestsData {
  grouped: QuestsGrouped;
  summary: QuestsSummary;
}

const CATEGORY_CONFIG: Record<
  QuestCategory,
  { label: string; emoji: string; color: string }
> = {
  DAILY: { label: "Daily", emoji: "☀️", color: "#f59e0b" },
  WEEKLY: { label: "Weekly", emoji: "📅", color: "#3b82f6" },
  SEASONAL: { label: "Seasonal", emoji: "🌸", color: "#a855f7" },
};

const TABS: QuestCategory[] = ["DAILY", "WEEKLY", "SEASONAL"];

// ─── Plant-ID Quest keys (used to identify our quests) ─────────────────────
// const PLANT_ID_QUEST_KEYS = [
//   "identify_3_species",
//   "identify_5_species",
//   "identify_10_species",
//   "identify_25_species",
//   "capture_5_photos",
//   "capture_10_photos",
//   "capture_25_photos",
//   "capture_50_photos",
// ];

// ─── Quest Progress Update ──────────────────────────────────────────────────

function questTypeDescription(type: string): string {
  switch (type.toUpperCase()) {
    case "PLANT":
      return "Plant crops";
    case "HARVEST":
      return "Harvest crops";
    case "WATER":
      return "Water crops";
    case "FERTILIZE":
      return "Fertilize crops";
    case "DISCOVER":
      return "Discover species";
    case "VISIT":
      return "Visit gardens";
    case "LIST":
      return "Create listings";
    case "SCAN":
      return "Scan plants";
    case "SOCIAL":
      return "Social actions";
    case "TRADE":
      return "Marketplace trades";
    default:
      return type;
  }
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export function QuestScreen() {
  const router = useRouter();

  const [tab, setTab] = useState<QuestCategory>("DAILY");
  const [data, setData] = useState<QuestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // ─── Plant-ID Quest state ──────────────────────────────────────────────
  const [plantIdProgress, setPlantIdProgress] = useState<QuestProgress[]>([]);
  const [plantPhotos, setPlantPhotos] = useState<IdentifiedPlantPhoto[]>([]);
  const [speciesIdentified, setSpeciesIdentified] = useState(0);
  const [plantIdXp, setPlantIdXp] = useState(0);
  const [celebratingQuest, setCelebratingQuest] = useState<QuestProgress | null>(null);
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.8)).current;

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await api.get("/quests/user-progress");
      const d = res.data;

      // Normalize — backend might return the raw quest list (without groups)
      // or the grouped format from the user-progress endpoint.
      let grouped: QuestsGrouped;
      let summary: QuestsSummary;

      if (d.grouped) {
        grouped = d.grouped;
        summary = d.summary;
      } else if (Array.isArray(d)) {
        // Raw list fallback (older endpoint shape)
        const quests: Quest[] = d;
        grouped = { DAILY: [], WEEKLY: [], SEASONAL: [] };
        for (const q of quests) {
          const cat = q.category;
          if (grouped[cat]) {
            grouped[cat].push(q);
          } else {
            grouped.DAILY.push(q);
          }
        }
        summary = {
          total: quests.length,
          completed: quests.filter(
            (q) => q.userProgress?.isCompleted
          ).length,
          claimed: quests.filter(
            (q) => q.userProgress?.claimedAt
          ).length,
          pendingClaim: quests.filter(
            (q) =>
              q.userProgress?.isCompleted && !q.userProgress?.claimedAt
          ).length,
        };
      } else {
        grouped = { DAILY: [], WEEKLY: [], SEASONAL: [] };
        summary = { total: 0, completed: 0, claimed: 0, pendingClaim: 0 };
      }

      setData({ grouped, summary });

      // Load plant-ID quest data in parallel
      try {
        const [progress, photos, speciesCount, xp] = await Promise.all([
          plantIdQuest.getUserQuestProgress(),
          plantIdQuest.getPlantPhotoCollection(),
          plantIdQuest.getSpeciesIdentifiedCount(),
          plantIdQuest.getTotalPhotoXp(),
        ]);
        setPlantIdProgress(progress);
        setPlantPhotos(photos);
        setSpeciesIdentified(speciesCount);
        setPlantIdXp(xp);
      } catch {
        // Silent fail — plant-ID quests are non-critical
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load quests";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaim = useCallback(
    async (questId: string) => {
      if (claimingId) return;
      setClaimingId(questId);
      try {
        await HapticFeedback.light();

        const res = await api.post(`/quests/user-progress?claim=true`, {
          questId,
        });
        const result = res.data;

        await HapticFeedback.success();

        // Show success banner for 3 s
        setClaimSuccess(
          `+${result.xpAwarded ?? 0} XP, +${result.creditsAwarded ?? 0} Credits`
        );
        setTimeout(() => setClaimSuccess(null), 3000);

        await fetchData();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unable to claim reward";
        await HapticFeedback.error();
        setError(message);
      } finally {
        setClaimingId(null);
      }
    },
    [claimingId, fetchData]
  );

  // ─── Plant-ID quest claim ──────────────────────────────────────────────

  const handleClaimPlantIdQuest = useCallback(
    async (questId: string) => {
      try {
        await HapticFeedback.light();
        const result = await plantIdQuest.claimQuest(questId);
        await HapticFeedback.success();
        setClaimSuccess(
          result.success
            ? `+${result.xpAwarded} XP, +${result.creditsAwarded} Credits`
            : "Reward claimed locally",
        );
        setTimeout(() => setClaimSuccess(null), 3000);
        // Refresh plant-ID data
        const progress = await plantIdQuest.getUserQuestProgress();
        setPlantIdProgress(progress);
      } catch {
        await HapticFeedback.error();
      }
    },
    [],
  );

  // ─── Celebration animation ─────────────────────────────────────────────

  const triggerCelebration = useCallback(
    (quest: QuestProgress) => {
      setCelebratingQuest(quest);
      celebrationOpacity.setValue(0);
      celebrationScale.setValue(0.8);
      Animated.parallel([
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(celebrationScale, {
          toValue: 1,
          damping: 10,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        Animated.timing(celebrationOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setCelebratingQuest(null));
      }, 2500);
    },
    [celebrationOpacity, celebrationScale],
  );

  // Check for newly completed plant-ID quests
  const prevPlantIdRef = useRef<QuestProgress[]>([]);
  useEffect(() => {
    if (prevPlantIdRef.current.length === 0) {
      prevPlantIdRef.current = plantIdProgress;
      return;
    }
    const prev = prevPlantIdRef.current;
    const newlyCompleted = plantIdProgress.find(
      (q) =>
        q.isCompleted &&
        !q.claimed &&
        !prev.find((p) => p.questId === q.questId)?.isCompleted,
    );
    if (newlyCompleted) {
      triggerCelebration(newlyCompleted);
    }
    prevPlantIdRef.current = plantIdProgress;
  }, [plantIdProgress, triggerCelebration]);

  // ─── Tab content ─────────────────────────────────────────────────────────

  const questsForTab = data?.grouped[tab] ?? [];
  const pendingClaimCount = data?.summary.pendingClaim ?? 0;

  // ─── Plant-ID quest helpers ────────────────────────────────────────────

  const identificationQuests = plantIdProgress.filter((q) =>
    q.questKey.startsWith("identify_"),
  );
  const photoQuests = plantIdProgress.filter((q) =>
    q.questKey.startsWith("capture_"),
  );
  const recentPhotos = plantPhotos.slice(0, 10);

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Quests" showBack onBack={() => router.back()} />
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <View key={t} style={styles.tabSkeleton}>
              <SkeletonLoader width={80} height={36} borderRadius={18} />
            </View>
          ))}
        </View>
        <View style={styles.loadingContainer}>
          {[0, 1, 2].map((i) => (
            <Card key={i} style={styles.questCardSkeleton}>
              <View style={styles.questSkeletonRow}>
                <SkeletonLoader width={40} height={40} borderRadius={20} />
                <View style={styles.questSkeletonText}>
                  <SkeletonLoader
                    width="70%"
                    height={16}
                    borderRadius={4}
                    style={{ marginBottom: 6 }}
                  />
                  <SkeletonLoader
                    width="50%"
                    height={12}
                    borderRadius={4}
                  />
                </View>
              </View>
              <SkeletonLoader
                width="100%"
                height={8}
                borderRadius={4}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Quests"
        showBack
        onBack={() => router.back()}
        rightAction={
          pendingClaimCount > 0 ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{pendingClaimCount}</Text>
            </View>
          ) : undefined
        }
      />

      {/* ── Summary Banner ──────────────────────────────────────────────── */}
      {data && (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <SummaryItem
              label="Total"
              value={data.summary.total}
              color={colors.text}
            />
            <SummaryItem
              label="Completed"
              value={data.summary.completed}
              color={colors.success}
            />
            <SummaryItem
              label="Pending"
              value={data.summary.pendingClaim}
              color={colors.warning}
            />
            <SummaryItem
              label="Claimed"
              value={data.summary.claimed}
              color={colors.textMuted}
            />
          </View>
        </Card>
      )}

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const config = CATEGORY_CONFIG[t];
          const isActive = tab === t;
          const count = data?.grouped[t]?.length ?? 0;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
              accessibilityLabel={`${config.label} quests`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={styles.tabEmoji}>{config.emoji}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {config.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    { backgroundColor: isActive ? config.color : colors.surfaceSecondary },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      { color: isActive ? colors.white : colors.textMuted },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Plant-ID Quest Section ──────────────────────────────────────── */}
      {!loading && (
        <View style={styles.plantIdSection}>
          <View style={styles.plantIdHeader}>
            <Text style={styles.plantIdTitle}>🌿 Plant Identification Quests</Text>
            <View style={styles.plantIdStats}>
              <Text style={styles.plantIdStatText}>
                {speciesIdentified} species · {plantPhotos.length} photos · {plantIdXp} XP
              </Text>
            </View>
          </View>

          {/* Identification quests */}
          {identificationQuests.length > 0 && (
            <View style={styles.plantIdQuestGroup}>
              <Text style={styles.plantIdGroupLabel}>Identify Species</Text>
              {identificationQuests.map((q) => (
                <PlantIdQuestCard
                  key={q.questId}
                  quest={q}
                  onClaim={() => handleClaimPlantIdQuest(q.questId)}
                />
              ))}
            </View>
          )}

          {/* Photo quests */}
          {photoQuests.length > 0 && (
            <View style={styles.plantIdQuestGroup}>
              <Text style={styles.plantIdGroupLabel}>Capture Photos</Text>
              {photoQuests.map((q) => (
                <PlantIdQuestCard
                  key={q.questId}
                  quest={q}
                  onClaim={() => handleClaimPlantIdQuest(q.questId)}
                />
              ))}
            </View>
          )}

          {/* Recent photos gallery */}
          {recentPhotos.length > 0 && (
            <View style={styles.plantIdQuestGroup}>
              <View style={styles.plantIdGalleryHeader}>
                <Text style={styles.plantIdGroupLabel}>Recent Identifications</Text>
                <TouchableOpacity
                  onPress={() => router.push("/photo-collection" as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewCollectionText}>View All →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoGallery}
              >
                {recentPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoThumb}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: photo.imageUrl }}
                      style={styles.photoThumbImage}
                      resizeMode="cover"
                    />
                    <View style={styles.photoThumbOverlay}>
                      <Text style={styles.photoThumbName} numberOfLines={1}>
                        {photo.speciesName}
                      </Text>
                      <Text style={styles.photoThumbXp}>+{photo.xpAwarded} XP</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* ── Celebration Overlay ──────────────────────────────────────────── */}
      {celebratingQuest && (
        <Animated.View
          style={[
            styles.celebrationOverlay,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationTitle}>Quest Complete!</Text>
          <Text style={styles.celebrationSubtitle}>{celebratingQuest.questKey.replace(/_/g, " ")}</Text>
        </Animated.View>
      )}

      {/* ── Success Banner ──────────────────────────────────────────────── */}
      {claimSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{claimSuccess}</Text>
        </View>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchData()} activeOpacity={0.7}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

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
        {questsForTab.length === 0 ? (
          <EmptyState
            icon={CATEGORY_CONFIG[tab].emoji}
            title={`No ${CATEGORY_CONFIG[tab].label.toLowerCase()} quests`}
            description="Check back later for new challenges!"
          />
        ) : (
          questsForTab
            .slice()
            .sort((a, b) => {
              // Pending first, then in-progress, then completed-claimed
              const score = (q: Quest): number => {
                const up = q.userProgress;
                if (up?.isCompleted && !up?.claimedAt) return 0;
                if (!up?.isCompleted) return 1;
                return 2;
              };
              return score(a) - score(b);
            })
            .map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                claiming={claimingId === quest.id}
                onClaim={() => handleClaim(quest.id)}
              />
            ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function QuestCard({
  quest,
  claiming,
  onClaim,
}: {
  quest: Quest;
  claiming: boolean;
  onClaim: () => void;
}) {
  const up = quest.userProgress;
  const progress = up?.progress ?? 0;
  const isCompleted = up?.isCompleted ?? false;
  const isClaimed = up?.claimedAt != null && up.claimedAt !== "";
  const isPendingClaim = isCompleted && !isClaimed;

  const _progressPct = quest.targetCount > 0
    ? Math.min((progress / quest.targetCount) * 100, 100)
    : 0;

  const typeLabel = questTypeDescription(quest.type);

  return (
    <Card
      style={[
        styles.questCard,
        isClaimed && styles.questCardClaimed,
        isPendingClaim && styles.questCardPending,
      ].filter(Boolean) as ViewStyle[]}
    >
      <View style={styles.questHeader}>
        {/* Icon */}
        <View
          style={[
            styles.questIcon,
            isClaimed && styles.questIconClaimed,
            isPendingClaim && styles.questIconPending,
          ]}
        >
          <Text style={styles.questIconText}>
            {isClaimed ? "✅" : quest.icon}
          </Text>
        </View>

        {/* Title / Description */}
        <View style={styles.questContent}>
          <Text style={styles.questTitle} numberOfLines={1}>
            {quest.title}
          </Text>
          <Text style={styles.questDescription} numberOfLines={2}>
            {quest.description || typeLabel}
          </Text>

          {/* Category + Type badges */}
          <View style={styles.questBadges}>
            <Badge label={typeLabel} variant="info" size="sm" />
            {quest.season && (
              <Badge label={quest.season.name} variant="secondary" size="sm" />
            )}
          </View>
        </View>

        {/* Claim / Check */}
        <View style={styles.questAction}>
          {isPendingClaim ? (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={onClaim}
              disabled={claiming}
              activeOpacity={0.8}
              accessibilityLabel="Claim reward"
              accessibilityRole="button"
            >
              {claiming ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={styles.claimButtonLabel}>Claim</Text>
                  <Text style={styles.claimButtonEmoji}>🎁</Text>
                </>
              )}
            </TouchableOpacity>
          ) : isClaimed ? (
            <View style={styles.claimedMark}>
              <Text style={styles.claimedMarkText}>✓</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Progress */}
      {!isClaimed && (
        <View style={styles.questProgressSection}>
          <ProgressBar
            value={progress}
            maxValue={quest.targetCount}
            height={6}
            showLabel
            labelPosition="right"
          />
          <View style={styles.questRewardRow}>
            <Text style={styles.questProgressText}>
              {progress}/{quest.targetCount} {typeLabel.toLowerCase()}
            </Text>
            <View style={styles.questRewards}>
              <RewardTag emoji="⭐" value={quest.xpReward} />
              <RewardTag emoji="🪙" value={quest.creditReward} />
              {quest.itemReward && (
                <RewardTag emoji="🎁" value={quest.itemReward} />
              )}
            </View>
          </View>
        </View>
      )}

      {/* Completed bar */}
      {isClaimed && up?.claimedAt && (
        <Text style={styles.claimedText}>
          Claimed on {new Date(up.claimedAt).toLocaleDateString()}
        </Text>
      )}
    </Card>
  );
}

function RewardTag({
  emoji,
  value,
}: {
  emoji: string;
  value: number | string;
}) {
  return (
    <View style={styles.rewardTag}>
      <Text style={styles.rewardTagEmoji}>{emoji}</Text>
      <Text style={styles.rewardTagText}>{value}</Text>
    </View>
  );
}

function PlantIdQuestCard({
  quest,
  onClaim,
}: {
  quest: QuestProgress;
  onClaim: () => void;
}) {
  const isCompleted = quest.isCompleted;
  const isClaimed = quest.claimed;
  const isPendingClaim = isCompleted && !isClaimed;
  const _progressPct =
    quest.targetCount > 0
      ? Math.min((quest.progress / quest.targetCount) * 100, 100)
      : 0;

  const questLabel = quest.questKey
    .replace(/_/g, " ")
    .replace("identify", "Identify")
    .replace("capture", "Capture")
    .replace("species", "different species")
    .replace("photos", "plant photos");

  return (
    <Card
      style={[
        styles.plantIdQuestCard,
        isClaimed && styles.plantIdQuestCardClaimed,
        isPendingClaim && styles.plantIdQuestCardPending,
      ].filter(Boolean) as ViewStyle[]}
    >
      <View style={styles.plantIdQuestRow}>
        <View style={styles.questContent}>
          <Text style={styles.plantIdQuestLabel} numberOfLines={1}>
            {questLabel}
          </Text>
          <Text style={styles.plantIdQuestProgress}>
            {quest.progress}/{quest.targetCount}
          </Text>
        </View>
        {isPendingClaim ? (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={onClaim}
            activeOpacity={0.8}
          >
            <Text style={styles.claimButtonLabel}>Claim</Text>
            <Text style={styles.claimButtonEmoji}>🎁</Text>
          </TouchableOpacity>
        ) : isClaimed ? (
          <View style={styles.claimedMark}>
            <Text style={styles.claimedMarkText}>✓</Text>
          </View>
        ) : null}
      </View>
      {!isClaimed && (
        <ProgressBar
          value={quest.progress}
          maxValue={quest.targetCount}
          height={6}
          showLabel
          labelPosition="right"
        />
      )}
    </Card>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header badge
  headerBadge: {
    backgroundColor: colors.warning,
    borderRadius: borderRadius.full,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },

  // Summary
  summaryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  summaryLabel: {
    ...typography.caption,
    marginTop: 2,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    gap: 4,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabEmoji: {
    fontSize: 14,
  },
  tabLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tabSkeleton: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },

  // Banners
  successBanner: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  successBannerText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  retryText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },

  // Quest cards
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  questCard: {
    marginBottom: spacing.sm,
  },
  questCardPending: {
    borderWidth: 1.5,
    borderColor: colors.warning,
    backgroundColor: colors.warningBg,
  },
  questCardClaimed: {
    opacity: 0.55,
    backgroundColor: colors.surfaceSecondary,
  },
  questCardSkeleton: {
    marginBottom: spacing.sm,
  },
  questSkeletonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  questSkeletonText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  questHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  questIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  questIconClaimed: {
    backgroundColor: colors.successBg,
  },
  questIconPending: {
    backgroundColor: colors.warningBg,
  },
  questIconText: {
    fontSize: 20,
  },
  questContent: {
    flex: 1,
  },
  questTitle: {
    ...typography.label,
  },
  questDescription: {
    ...typography.caption,
    marginTop: 2,
    marginBottom: 4,
  },
  questBadges: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  questAction: {
    marginLeft: spacing.sm,
    alignItems: "center",
  },
  claimButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    minWidth: 72,
    height: 36,
  },
  claimButtonLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  claimButtonEmoji: {
    fontSize: 14,
  },
  claimedMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  claimedMarkText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  questProgressSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  questProgressText: {
    ...typography.caption,
    marginRight: spacing.sm,
  },
  questRewardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  questRewards: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  rewardTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  rewardTagEmoji: {
    fontSize: 10,
  },
  rewardTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  claimedText: {
    ...typography.caption,
    color: colors.success,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },

  // ─── Plant-ID Quest Section ─────────────────────────────────────────────
  plantIdSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  plantIdHeader: {
    marginBottom: spacing.sm,
  },
  plantIdTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  plantIdStats: {
    marginTop: 2,
  },
  plantIdStatText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  plantIdQuestGroup: {
    marginBottom: spacing.sm,
  },
  plantIdGroupLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  plantIdQuestCard: {
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  plantIdQuestCardClaimed: {
    opacity: 0.55,
    backgroundColor: colors.surfaceSecondary,
  },
  plantIdQuestCardPending: {
    borderWidth: 1.5,
    borderColor: colors.warning,
    backgroundColor: colors.warningBg,
  },
  plantIdQuestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  plantIdQuestLabel: {
    ...typography.label,
    flex: 1,
    marginRight: spacing.sm,
  },
  plantIdQuestProgress: {
    ...typography.caption,
    color: colors.textMuted,
  },
  plantIdGalleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  viewCollectionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  photoGallery: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
  },
  photoThumbImage: {
    width: "100%",
    height: "100%",
  },
  photoThumbOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  photoThumbName: {
    fontSize: 9,
    color: colors.white,
    fontWeight: "600",
  },
  photoThumbXp: {
    fontSize: 8,
    color: "#fbbf24",
    fontWeight: "700",
  },

  // ─── Celebration Overlay ────────────────────────────────────────────────
  celebrationOverlay: {
    position: "absolute",
    top: "30%",
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 40, 24, 0.92)",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
    zIndex: 100,
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  celebrationSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textTransform: "capitalize",
  },
});

export default QuestScreen;
