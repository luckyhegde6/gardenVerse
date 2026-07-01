import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@components/ui/ScreenHeader";
import { Avatar } from "@components/ui/Avatar";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { SkeletonLoader } from "@components/ui/SkeletonLoader";
import api from "@services/api";
import { HapticFeedback } from "@utils/haptics";
import { colors, spacing, typography, borderRadius } from "@/styles/theme";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GardenCrop {
  id: string;
  name: string;
  species?: string;
  status: string;
  growthStage: number;
  plotX?: number;
  plotY?: number;
}

interface GardenOwner {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  isOnline: boolean;
}

interface GardenInfo {
  id: string;
  name: string;
  type: string;
  gridWidth: number;
  gridHeight: number;
  soilQuality: number;
  irrigationLevel: number;
  crops: GardenCrop[];
}

interface VisitHistoryEntry {
  id: string;
  visitor: { username: string; displayName: string | null };
  visitedAt: string;
  rating: number | null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GardenVisitScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const router = useRouter();

  const [owner, setOwner] = useState<GardenOwner | null>(null);
  const [garden, setGarden] = useState<GardenInfo | null>(null);
  const [visitHistory, setVisitHistory] = useState<VisitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Gift modal
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [giftType, setGiftType] = useState("seed");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftSending, setGiftSending] = useState(false);

  // Rating modal
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!friendId) return;
    setLoading(true);
    try {
      // Fetch friend profile (includes garden)
      const profileRes = await api.get(`/friends/${friendId}`);
      const profileData = profileRes.data?.data?.friend || profileRes.data?.friend;
      if (profileData) {
        setOwner({
          id: profileData.id,
          username: profileData.username,
          displayName: profileData.displayName,
          avatarUrl: profileData.avatarUrl,
          level: profileData.level,
          isOnline: profileData.isOnline,
        });
        if (profileData.garden && profileData.garden.length > 0) {
          const g = profileData.garden[0];
          setGarden({
            id: g.id,
            name: g.name,
            type: g.type,
            gridWidth: g.gridWidth || 5,
            gridHeight: g.gridHeight || 5,
            soilQuality: g.soilQuality,
            irrigationLevel: g.irrigationLevel,
            crops: [],
          });
        }
      }

      // Fetch visit history for this garden
      if (profileData?.garden?.[0]?.id) {
        try {
          const visitRes = await api.get(`/visits?gardenId=${profileData.garden[0].id}`);
          const visitData = visitRes.data?.data || visitRes.data;
          setVisitHistory(Array.isArray(visitData) ? visitData : Array.isArray(visitData?.data) ? visitData.data : []);
        } catch {
          setVisitHistory([]);
        }
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Record the visit on mount
  useEffect(() => {
    if (garden?.id) {
      api.post("/visits", { gardenId: garden.id }).catch(() => {
        // Non-critical: visit recording failure should not block the screen
      });
    }
  }, [garden?.id]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleSendGift = async () => {
    if (!giftName.trim() || !friendId) return;
    setGiftSending(true);
    try {
      HapticFeedback.success();
      await api.post("/gifts", {
        toUserId: friendId,
        itemType: giftType,
        itemName: giftName.trim(),
        quantity: 1,
        message: giftMessage.trim() || undefined,
      });
      setGiftModalVisible(false);
      setGiftName("");
      setGiftMessage("");
      Alert.alert("Gift Sent!", `Your ${giftName.trim()} has been sent to ${owner?.displayName || owner?.username}.`);
    } catch (error: unknown) {
      HapticFeedback.error();
      const message = error instanceof Error ? error.message : "Failed to send gift";
      Alert.alert("Error", message);
    } finally {
      setGiftSending(false);
    }
  };

  const handleRateGarden = async () => {
    if (selectedRating < 1 || !garden?.id) return;
    setRatingSubmitting(true);
    try {
      HapticFeedback.success();
      await api.post("/visits", {
        gardenId: garden.id,
        rating: selectedRating,
      });
      setRatingModalVisible(false);
      setSelectedRating(0);
      Alert.alert("Thank You!", `You rated this garden ${selectedRating} star${selectedRating > 1 ? "s" : ""}.`);
    } catch (error: unknown) {
      HapticFeedback.error();
      const message = error instanceof Error ? error.message : "Failed to submit rating";
      Alert.alert("Error", message);
    } finally {
      setRatingSubmitting(false);
    }
  };

  // ─── Render Helpers ─────────────────────────────────────────────────────

  const renderCropGrid = () => {
    if (!garden) return null;
    const width = garden.gridWidth || 5;
    const height = garden.gridHeight || 5;
    const totalCells = width * height;

    // Placeholder crops for visual display
    const cropEmojis = ["🌱", "🌿", "🪴", "🌻", "🌾", "🍅", "🥕", "🌽"];

    return (
      <View style={styles.gridContainer}>
        <Text style={styles.sectionTitle}>🌿 Garden Grid</Text>
        <View style={styles.grid}>
          {Array.from({ length: totalCells }).map((_, idx) => {
            const hasCrop = idx < garden.crops.length;
            const emoji = hasCrop ? "🌱" : cropEmojis[idx % cropEmojis.length];
            const isPlanted = idx % 3 === 0; // Visual variety
            return (
              <View
                key={idx}
                style={[
                  styles.gridCell,
                  isPlanted && styles.gridCellPlanted,
                ]}
              >
                <Text style={styles.gridCellText}>
                  {isPlanted ? emoji : ""}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={interactive ? () => {
              setSelectedRating(star);
              HapticFeedback.light();
            } : undefined}
            onPressIn={interactive ? () => setHoverRating(star) : undefined}
            onPressOut={interactive ? () => setHoverRating(0) : undefined}
            disabled={!interactive}
            activeOpacity={interactive ? 0.6 : 1}
          >
            <Text style={[
              styles.star,
              (hoverRating || selectedRating) >= star && styles.starActive,
            ]}>
              {(hoverRating || selectedRating) >= star ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Garden Visit"
        onBack={() => router.back()}
        showBack={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Owner Info */}
        {loading ? (
          <Card style={styles.ownerCard}>
            <View style={styles.ownerRow}>
              <SkeletonLoader width={56} height={56} borderRadius={28} />
              <View style={styles.ownerInfoSkeleton}>
                <SkeletonLoader width="50%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                <SkeletonLoader width="35%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                <SkeletonLoader width={60} height={20} borderRadius={10} />
              </View>
            </View>
          </Card>
        ) : owner ? (
          <Card style={styles.ownerCard}>
            <View style={styles.ownerRow}>
              <Avatar
                uri={owner.avatarUrl || undefined}
                name={owner.displayName || owner.username}
                size="lg"
                showOnline
                isOnline={owner.isOnline}
              />
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>
                  {owner.displayName || owner.username}
                </Text>
                <Text style={styles.ownerUsername}>@{owner.username}</Text>
                <Badge label={`Level ${owner.level}`} variant="primary" size="sm" />
              </View>
            </View>
          </Card>
        ) : null}

        {/* Garden Info */}
        {loading ? (
          <Card style={styles.gardenCard}>
            <SkeletonLoader width="40%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
            <View style={styles.gardenStatsSkeleton}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.gardenStatItem}>
                  <SkeletonLoader width={24} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width="80%" height={12} borderRadius={4} />
                </View>
              ))}
            </View>
          </Card>
        ) : garden ? (
          <Card style={styles.gardenCard}>
            <Text style={styles.gardenName}>{garden.name}</Text>
            <View style={styles.gardenStats}>
              <View style={styles.gardenStatItem}>
                <Text style={styles.gardenStatIcon}>🏡</Text>
                <Text style={styles.gardenStatText}>{garden.type}</Text>
              </View>
              <View style={styles.gardenStatItem}>
                <Text style={styles.gardenStatIcon}>📐</Text>
                <Text style={styles.gardenStatText}>{garden.gridWidth}x{garden.gridHeight}</Text>
              </View>
              <View style={styles.gardenStatItem}>
                <Text style={styles.gardenStatIcon}>🌱</Text>
                <Text style={styles.gardenStatText}>{garden.crops.length} crops</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Crop Grid (Read-only) */}
        {loading ? (
          <Card style={styles.gridCard}>
            <SkeletonLoader width="35%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
            <View style={styles.grid}>
              {Array.from({ length: 15 }).map((_, i) => (
                <SkeletonLoader key={i} width={48} height={48} borderRadius={8} style={{ margin: 2 }} />
              ))}
            </View>
          </Card>
        ) : (
          renderCropGrid()
        )}

        {/* Action Buttons */}
        {!loading && (
          <View style={styles.actionsContainer}>
            <Button
              title="Leave a Gift"
              variant="primary"
              fullWidth
              onPress={() => { setGiftModalVisible(true); HapticFeedback.light(); }}
              icon="🎁"
            />
            <View style={styles.actionSpacer} />
            <Button
              title="Rate Garden"
              variant="outline"
              fullWidth
              onPress={() => { setRatingModalVisible(true); HapticFeedback.light(); }}
              icon="⭐"
            />
          </View>
        )}

        {/* Visit History */}
        {!loading && visitHistory.length > 0 && (
          <Card style={styles.historyCard}>
            <Text style={styles.sectionTitle}>📋 Recent Visits</Text>
            {visitHistory.slice(0, 5).map((visit) => (
              <View key={visit.id} style={styles.historyItem}>
                <Text style={styles.historyVisitor}>
                  {visit.visitor.displayName || visit.visitor.username}
                </Text>
                <View style={styles.historyMeta}>
                  {visit.rating ? renderStars(visit.rating) : null}
                  <Text style={styles.historyTime}>
                    {new Date(visit.visitedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Gift Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={giftModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGiftModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send a Gift</Text>
            <Text style={styles.modalSubtitle}>
              to {owner?.displayName || owner?.username}
            </Text>

            {/* Gift Type Selector */}
            <Text style={styles.inputLabel}>Gift Type</Text>
            <View style={styles.giftTypeRow}>
              {(["seed", "fertilizer", "tool", "water"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.giftTypeChip,
                    giftType === type && styles.giftTypeChipActive,
                  ]}
                  onPress={() => { setGiftType(type); HapticFeedback.light(); }}
                >
                  <Text style={styles.giftTypeEmoji}>
                    {type === "seed" ? "🌱" : type === "fertilizer" ? "🧪" : type === "tool" ? "🔧" : "💧"}
                  </Text>
                  <Text style={[
                    styles.giftTypeText,
                    giftType === type && styles.giftTypeTextActive,
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Gift Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Sunflower Seeds"
              placeholderTextColor={colors.textMuted}
              value={giftName}
              onChangeText={setGiftName}
            />

            <Text style={styles.inputLabel}>Message (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Add a personal note..."
              placeholderTextColor={colors.textMuted}
              value={giftMessage}
              onChangeText={setGiftMessage}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                fullWidth
                onPress={() => setGiftModalVisible(false)}
              />
              <View style={styles.modalActionSpacer} />
              <Button
                title="Send Gift"
                variant="primary"
                fullWidth
                onPress={handleSendGift}
                isLoading={giftSending}
                disabled={!giftName.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Rating Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate This Garden</Text>
            <Text style={styles.modalSubtitle}>
              How is {owner?.displayName || owner?.username}'s garden?
            </Text>

            <View style={styles.ratingStarsContainer}>
              {renderStars(selectedRating, true)}
            </View>

            <Text style={styles.ratingLabel}>
              {selectedRating === 0
                ? "Tap a star to rate"
                : `${selectedRating} star${selectedRating > 1 ? "s" : ""}`}
            </Text>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                fullWidth
                onPress={() => { setRatingModalVisible(false); setSelectedRating(0); }}
              />
              <View style={styles.modalActionSpacer} />
              <Button
                title="Submit"
                variant="primary"
                fullWidth
                onPress={handleRateGarden}
                isLoading={ratingSubmitting}
                disabled={selectedRating < 1}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  ownerCard: {
    marginBottom: spacing.sm,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ownerInfo: {
    flex: 1,
    gap: 2,
  },
  ownerName: {
    ...typography.h4,
  },
  ownerUsername: {
    ...typography.caption,
  },
  ownerInfoSkeleton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  gardenCard: {
    marginBottom: spacing.sm,
  },
  gardenName: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  gardenStats: {
    flexDirection: "row",
    gap: spacing.md,
  },
  gardenStatItem: {
    alignItems: "center",
    gap: 2,
  },
  gardenStatIcon: {
    fontSize: 18,
  },
  gardenStatText: {
    ...typography.caption,
  },
  gardenStatsSkeleton: {
    flexDirection: "row",
    gap: spacing.md,
  },
  gridCard: {
    marginBottom: spacing.sm,
  },
  gridContainer: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  gridCell: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  gridCellPlanted: {
    backgroundColor: colors.primaryBg,
  },
  gridCellText: {
    fontSize: 20,
  },
  actionsContainer: {
    marginBottom: spacing.sm,
  },
  actionSpacer: {
    height: spacing.sm,
  },
  historyCard: {
    marginBottom: spacing.sm,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyVisitor: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  historyTime: {
    ...typography.caption,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    textAlign: "center",
  },
  modalSubtitle: {
    ...typography.bodySmall,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  modalActionSpacer: {
    width: spacing.sm,
  },
  // Gift type selector
  giftTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  giftTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  giftTypeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  giftTypeEmoji: {
    fontSize: 16,
  },
  giftTypeText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  giftTypeTextActive: {
    color: colors.primary,
  },
  // Rating
  ratingStarsContainer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  starsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  star: {
    fontSize: 40,
    color: colors.textMuted,
  },
  starActive: {
    color: "#f59e0b",
  },
  ratingLabel: {
    ...typography.bodySmall,
    textAlign: "center",
    color: colors.textSecondary,
  },
});

export default GardenVisitScreen;
