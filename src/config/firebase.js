// Firebase config — mocked for frontend-only mode
// Replace with real config when backend integration is needed

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mock',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mock',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mock',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'mock',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'mock',
}

// ── Mock Firestore ──────────────────────────────────────────
// In-memory store so all dashboard features work without Firebase

const store = {
  drives: {},
  users: {},
  publicNeeds: {},
  ngoProfiles: {},
}

let idCounter = 1000

function makeId() {
  return `mock_${++idCounter}_${Date.now()}`
}

const listeners = {}

function notify(col) {
  const docs = Object.entries(store[col] || {}).map(([id, data]) => ({ id, ...data }))
  ;(listeners[col] || []).forEach(cb => cb(docs))
}

export const db = {
  _col: (col) => col,
}

// Firestore-compatible helpers
export function collection(_, col) { return col }

export function doc(_, col, id) { return { col, id } }

export function query(col, ...constraints) {
  return { col, constraints }
}

export function where(field, op, value) {
  return { type: 'where', field, op, value }
}

export function serverTimestamp() {
  return new Date().toISOString()
}

export function increment(n) {
  return { __increment: n }
}

export async function addDoc(col, data) {
  const id = makeId()
  store[col] = store[col] || {}
  store[col][id] = { ...data, createdAt: new Date().toISOString() }
  notify(col)
  return { id }
}

export async function setDoc({ col, id }, data) {
  store[col] = store[col] || {}
  store[col][id] = { ...store[col][id], ...data }
  notify(col)
}

export async function getDoc({ col, id }) {
  const data = store[col]?.[id]
  return {
    exists: () => !!data,
    data: () => data,
    id,
  }
}

export async function updateDoc({ col, id }, updates) {
  store[col] = store[col] || {}
  const current = store[col][id] || {}
  const merged = { ...current }
  for (const [k, v] of Object.entries(updates)) {
    if (v && typeof v === 'object' && '__increment' in v) {
      merged[k] = (current[k] || 0) + v.__increment
    } else {
      merged[k] = v
    }
  }
  store[col][id] = merged
  notify(col)
}

export function onSnapshot(queryOrCol, callback) {
  const col = typeof queryOrCol === 'string' ? queryOrCol : queryOrCol.col
  const constraints = queryOrCol.constraints || []

  store[col] = store[col] || {}

  // Seed some mock drives on first call
  if (col === 'drives' && Object.keys(store.drives).length === 0) {
    seedDrives()
  }

  listeners[col] = listeners[col] || []

  const handler = (docs) => {
    let filtered = docs
    for (const c of constraints) {
      if (c.type === 'where') {
        filtered = filtered.filter(d => {
          if (c.op === '==') return d[c.field] === c.value
          return true
        })
      }
    }
    const snap = {
      docs: filtered.map(d => ({
        id: d.id,
        data: () => {
          const { id: _id, ...rest } = d
          return rest
        },
      })),
    }
    callback(snap)
  }

  listeners[col].push(handler)

  // Fire immediately
  const docs = Object.entries(store[col]).map(([id, data]) => ({ id, ...data }))
  handler(docs)

  // Return unsubscribe
  return () => {
    listeners[col] = listeners[col].filter(h => h !== handler)
  }
}

// ── Seed mock data ──────────────────────────────────────────
function seedDrives() {
  const mockDrives = [
    {
      title: 'Yamuna River Cleanup',
      description: 'Cleaning plastic waste from Yamuna riverbank near ITO bridge.',
      category: 'cleanup',
      urgency: 'high',
      location: 'ITO Bridge, Delhi',
      duration: '4 hours',
      volunteersJoined: 18,
      estimatedVolunteers: 30,
      requiredSkills: ['Waste Management', 'First Aid'],
      status: 'active',
      impactScore: 8,
      ngoId: 'seed_ngo_1',
      lat: 28.6271,
      lng: 77.2411,
    },
    {
      title: 'Lodhi Garden Plantation Drive',
      description: 'Planting 500 native saplings across Lodhi Garden with local volunteers.',
      category: 'plantation',
      urgency: 'medium',
      location: 'Lodhi Garden, Delhi',
      duration: '3 hours',
      volunteersJoined: 24,
      estimatedVolunteers: 40,
      requiredSkills: ['Gardening', 'Photography'],
      status: 'active',
      impactScore: 9,
      ngoId: 'seed_ngo_1',
      lat: 28.5931,
      lng: 77.2197,
    },
    {
      title: 'Plastic-Free Connaught Place',
      description: 'Awareness campaign and waste collection drive at CP market.',
      category: 'awareness',
      urgency: 'low',
      location: 'Connaught Place, Delhi',
      duration: '2 hours',
      volunteersJoined: 9,
      estimatedVolunteers: 20,
      requiredSkills: ['Social Media', 'Teaching'],
      status: 'active',
      impactScore: 7,
      ngoId: 'seed_ngo_2',
      lat: 28.6315,
      lng: 77.2167,
    },
    {
      title: 'Hauz Khas Lake Restoration',
      description: 'Water quality testing and debris removal from Hauz Khas lake.',
      category: 'water_conservation',
      urgency: 'critical',
      location: 'Hauz Khas, Delhi',
      duration: '6 hours',
      volunteersJoined: 5,
      estimatedVolunteers: 25,
      requiredSkills: ['First Aid', 'Driving', 'Data Entry'],
      status: 'active',
      impactScore: 9,
      ngoId: 'seed_ngo_2',
      lat: 28.5494,
      lng: 77.2001,
    },
    {
      title: 'E-Waste Collection Camp',
      description: 'Collecting old electronics for responsible recycling at RK Puram.',
      category: 'recycling',
      urgency: 'medium',
      location: 'RK Puram, Delhi',
      duration: '5 hours',
      volunteersJoined: 12,
      estimatedVolunteers: 15,
      requiredSkills: ['Driving', 'Data Entry'],
      status: 'active',
      impactScore: 7,
      ngoId: 'seed_ngo_1',
      lat: 28.5672,
      lng: 77.1731,
    },
  ]

  mockDrives.forEach((d, i) => {
    const id = makeId()
    // Add dates: drives start 2, 5, 10, 15, 30 days from now
    const daysFromNow = [2, 5, 10, 15, 30][i] || 7
    const driveDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString()
    store.drives[id] = { ...d, date: driveDate, createdAt: new Date().toISOString() }
  })
}

// Legacy export for any direct firebase imports
export const auth = {}
export default { auth, db }
