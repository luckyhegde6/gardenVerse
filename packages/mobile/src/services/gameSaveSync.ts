import { getItem, setItem, removeItem, StorageKeys } from '../utils/storage'
import { logger } from './logger'
import api from './api'
import { Crop, Garden, QuestProgress, CollectionEntry } from '../types'

const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const LAST_SYNC_KEY = 'last_game_sync'
const PENDING_SYNC_KEY = 'pending_game_sync'
const GAME_STATE_KEY = 'game_state_local'

interface GameState {
  crops: Crop[]
  gardens: Garden[]
  questProgress: QuestProgress[]
  collections: CollectionEntry[]
  timestamp: string
}

interface SyncResult {
  success: boolean
  syncedAt: string
  conflicts: number
  message: string
}

class GameSaveSyncService {
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private isSyncing = false

  /**
   * Save game state to local storage immediately.
   * Called on every significant game action and before app goes to background.
   */
  async saveLocal(state: Partial<GameState>): Promise<void> {
    try {
      const existing = await this.loadLocal()
      const merged: GameState = {
        crops: state.crops ?? existing?.crops ?? [],
        gardens: state.gardens ?? existing?.gardens ?? [],
        questProgress: state.questProgress ?? existing?.questProgress ?? [],
        collections: state.collections ?? existing?.collections ?? [],
        timestamp: new Date().toISOString(),
      }
      await setItem(GAME_STATE_KEY, JSON.stringify(merged))
      await setItem(LAST_SYNC_KEY, merged.timestamp)
      logger.info('[GameSave] Local save complete', { source: 'gameSave' })
    } catch (error) {
      logger.error('[GameSave] Local save failed', { source: 'gameSave', context: 'error' })
    }
  }

  /**
   * Load game state from local storage.
   */
  async loadLocal(): Promise<GameState | null> {
    try {
      const raw = await getItem(GAME_STATE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as GameState
    } catch {
      return null
    }
  }

  /**
   * Sync local game state with the server.
   * Server wins on conflict.
   */
  async syncWithServer(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedAt: '', conflicts: 0, message: 'Sync already in progress' }
    }

    this.isSyncing = true
    try {
      const localState = await this.loadLocal()
      if (!localState) {
        this.isSyncing = false
        return { success: false, syncedAt: '', conflicts: 0, message: 'No local state to sync' }
      }

      // Push local changes to server
      const response = await api.post('/mobile/sync', {
        crops: localState.crops,
        gardens: localState.gardens,
        quests: localState.questProgress,
        collections: localState.collections,
        clientTimestamp: localState.timestamp,
      })

      const syncResult = response.data?.data
      const syncedAt = syncResult?.syncedAt || new Date().toISOString()

      // Pull server state to merge
      const serverResponse = await api.get('/mobile/sync', {
        params: { since: localState.timestamp },
      })

      const serverState = serverResponse.data?.data
      if (serverState) {
        // Merge: server wins on conflict
        const merged: GameState = {
          crops: serverState.crops || localState.crops,
          gardens: serverState.gardens || localState.gardens,
          questProgress: serverState.questProgress || localState.questProgress,
          collections: serverState.collections || localState.collections,
          timestamp: syncedAt,
        }
        await setItem(GAME_STATE_KEY, JSON.stringify(merged))
      }

      await setItem(LAST_SYNC_KEY, syncedAt)
      await removeItem(PENDING_SYNC_KEY)

      const conflicts = Object.values(syncResult?.results || {}).reduce(
        (sum: number, r: any) => sum + (r.conflicts || 0), 0
      )

      logger.info('[GameSave] Sync complete', { source: 'gameSave', metadata: { syncedAt, conflicts } })

      this.isSyncing = false
      return {
        success: true,
        syncedAt,
        conflicts,
        message: 'Game data synced successfully',
      }
    } catch (error: any) {
      this.isSyncing = false
      // Mark pending sync for retry
      await setItem(PENDING_SYNC_KEY, 'true')
      logger.error('[GameSave] Sync failed', { source: 'gameSave', context: 'error' })
      return {
        success: false,
        syncedAt: '',
        conflicts: 0,
        message: error.response?.data?.error || 'Sync failed — will retry',
      }
    }
  }

  /**
   * Get the last successful sync timestamp.
   */
  async getLastSyncTime(): Promise<string | null> {
    return getItem(LAST_SYNC_KEY)
  }

  /**
   * Check if there's a pending sync (failed previously).
   */
  async hasPendingSync(): Promise<boolean> {
    const pending = await getItem(PENDING_SYNC_KEY)
    return pending === 'true'
  }

  /**
   * Check if currently syncing.
   */
  getSyncing(): boolean {
    return this.isSyncing
  }

  /**
   * Start auto-sync timer (every 5 minutes while app is in foreground).
   */
  startAutoSync(): void {
    if (this.syncTimer) return
    this.syncTimer = setInterval(async () => {
      const hasPending = await this.hasPendingSync()
      if (hasPending) {
        await this.syncWithServer()
      }
    }, SYNC_INTERVAL_MS)
    logger.info('[GameSave] Auto-sync started (5min interval)', { source: 'gameSave' })
  }

  /**
   * Stop auto-sync timer.
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      logger.info('[GameSave] Auto-sync stopped', { source: 'gameSave' })
    }
  }

  /**
   * Save and sync before app goes to background / user quits.
   * Call this from AppState change handler.
   */
  async saveAndSyncOnBackground(state: Partial<GameState>): Promise<void> {
    await this.saveLocal(state)
    await this.syncWithServer()
  }

  /**
   * Full save + sync cycle for manual "Save Game" button.
   */
  async manualSaveAndSync(state: Partial<GameState>): Promise<SyncResult> {
    await this.saveLocal(state)
    return this.syncWithServer()
  }
}

export const gameSaveSync = new GameSaveSyncService()
