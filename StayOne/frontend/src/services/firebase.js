import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  onSnapshot,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let db  = null

export function getFirebaseApp() {
  if (!app) {
    if (!firebaseConfig.projectId) {
      console.warn('[Firebase] No project ID configured.')
      return null
    }
    try {
      app = initializeApp(firebaseConfig)
    } catch (e) {
      console.error('[Firebase] App init error:', e)
      return null
    }
  }
  return app
}

export function getFirebaseDb() {
  if (!db) {
    const appInstance = getFirebaseApp()
    if (!appInstance) return null
    try {
      // Use persistent local cache — serves data from IndexedDB when
      // Firestore is unavailable or quota-limited
      db = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          tabManager: persistentSingleTabManager({ forceOwnership: true }),
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        }),
      })
      console.log('[Firebase] Firestore with persistent cache enabled.')
    } catch (e) {
      // initializeFirestore can throw if already initialised — fall back
      try {
        db = getFirestore(appInstance)
      } catch (e2) {
        console.error('[Firebase] Firestore init error:', e2)
        return null
      }
    }
  }
  return db
}

/**
 * Subscribe to the bookings collection.
 * includeMetadataChanges=true means we still get cache hits while
 * Firestore server is throttled.
 */
export function subscribeToBookings(callback) {
  const db = getFirebaseDb()
  if (!db) return () => {}

  return onSnapshot(
    collection(db, 'bookings'),
    { includeMetadataChanges: false },
    (snap) => {
      const docs = snap.docs.map((d) => {
        const data = d.data()
        return {
          ...data,
          id: d.id,
          created_at: data.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
        }
      })
      docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      callback(docs)
    }
  )
}

/**
 * Subscribe to the rooms collection.
 */
export function subscribeToRooms(callback) {
  const db = getFirebaseDb()
  if (!db) return () => {}

  return onSnapshot(
    collection(db, 'rooms'),
    { includeMetadataChanges: false },
    (snap) => {
      const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
      callback(docs)
    }
  )
}

/**
 * Subscribe to the notifications collection.
 */
export function subscribeToNotifications(callback) {
  const db = getFirebaseDb()
  if (!db) return () => {}

  return onSnapshot(
    collection(db, 'notifications'),
    { includeMetadataChanges: false },
    (snap) => {
      const docs = snap.docs.map((d) => {
        const data = d.data()
        return {
          ...data,
          id: d.id,
          created_at: data.created_at?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
        }
      })
      docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      callback(docs)
    }
  )
}
