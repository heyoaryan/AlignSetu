const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

async function callGemini(prompt, maxTokens = 1024) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
    }),
  })
  if (!response.ok) throw new Error('Gemini API error')
  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  // Strip markdown code fences if present
  return text.replace(/```json\n?|\n?```/g, '').trim()
}

export async function analyzeDrive(driveDescription) {
  const prompt = `
You are an AI assistant for AlignSetu, an environmental volunteer coordination platform.
Analyze the following NGO drive description and return a JSON object with these fields:
- category: one of ["cleanup", "plantation", "awareness", "recycling", "water_conservation", "wildlife"]
- urgency: one of ["low", "medium", "high", "critical"]
- requiredSkills: array of strings (max 5 skills needed)
- estimatedVolunteers: number
- duration: string (e.g. "2 hours", "1 day")
- impactScore: number from 1-10
- summary: 2-sentence summary of the drive
- actionItems: array of 3-5 specific action items for volunteers

Drive Description: "${driveDescription}"

Respond ONLY with valid JSON, no markdown, no explanation.
`
  return JSON.parse(await callGemini(prompt))
}

export async function matchVolunteers(driveData, volunteers) {
  const prompt = `
Given this environmental drive and list of volunteers, rank the top 5 most suitable volunteers.
Drive: ${JSON.stringify(driveData)}
Volunteers: ${JSON.stringify(volunteers)}

Return JSON array of volunteer IDs ranked by suitability with a matchScore (0-100) and reason.
Format: [{"id": "...", "matchScore": 85, "reason": "..."}]
Respond ONLY with valid JSON.
`
  return JSON.parse(await callGemini(prompt, 512))
}

/**
 * Recommends best-fit drives for a volunteer based on their profile.
 * @param {Object} volunteerProfile - { skills, volunteerType, availability, location, joinedDrives }
 * @param {Array} drives - All available drives
 * @returns {Array} Top drives with matchScore and reason
 */
export async function recommendDrivesForVolunteer(volunteerProfile, drives) {
  if (!drives || drives.length === 0) return []

  const prompt = `
You are AlignSetu AI. Match the best environmental drives for this volunteer.

Volunteer Profile:
- Skills: ${JSON.stringify(volunteerProfile.skills || [])}
- Type: ${volunteerProfile.volunteerType || 'not specified'}
- Availability: ${JSON.stringify(volunteerProfile.availability || [])}
- Location: ${volunteerProfile.location || 'not specified'}
- Already joined: ${JSON.stringify(volunteerProfile.joinedDrives || [])}

Available Drives:
${JSON.stringify(drives.map(d => ({
    id: d.id,
    title: d.title,
    category: d.category,
    urgency: d.urgency,
    location: d.location,
    requiredSkills: d.requiredSkills,
    duration: d.duration,
  })))}

Return a JSON array of the top 3 best-fit drives (exclude already joined ones).
Each item: { id: string, matchScore: number (0-100), reason: string (max 12 words), tag: string (e.g. "Perfect skill match", "Near you", "Urgent need") }
Respond ONLY with valid JSON array.
`
  try {
    const result = JSON.parse(await callGemini(prompt, 600))
    return Array.isArray(result) ? result : []
  } catch {
    // Fallback: simple skill-based matching
    return drives
      .filter(d => !volunteerProfile.joinedDrives?.includes(d.id))
      .slice(0, 3)
      .map(d => ({
        id: d.id,
        matchScore: 75,
        reason: 'Matches your profile',
        tag: 'Recommended',
      }))
  }
}

/**
 * Generates a personalized AI nudge/tip for a volunteer based on their activity.
 * @param {Object} stats - { joinedCount, xp, streak, skills, badges }
 * @returns {Object} { message, cta, type }
 */
export async function getVolunteerNudge(stats) {
  const prompt = `
You are AlignSetu AI assistant. Generate a short, motivating personalized message for an environmental volunteer.

Volunteer Stats:
- Drives joined: ${stats.joinedCount}
- XP earned: ${stats.xp}
- Current streak: ${stats.streak} days
- Skills listed: ${stats.skills?.length || 0}
- Badges earned: ${stats.badgesEarned || 0}

Return a JSON object:
- message: one encouraging sentence (max 15 words, specific to their stats)
- cta: short call-to-action text (max 5 words)
- type: one of ["streak", "xp", "skills", "milestone", "welcome"]

Respond ONLY with valid JSON.
`
  try {
    return JSON.parse(await callGemini(prompt, 256))
  } catch {
    if (stats.joinedCount === 0) return { message: 'Join your first drive and start making an impact!', cta: 'Browse drives', type: 'welcome' }
    if (stats.streak >= 3) return { message: `You're on a ${stats.streak}-day streak — keep the momentum going!`, cta: 'Join a drive', type: 'streak' }
    return { message: `You've earned ${stats.xp} XP — you're making a real difference!`, cta: 'View badges', type: 'xp' }
  }
}

/**
 * Generates a personalized thank-you message after a volunteer check-in.
 * @param {Object} data - { driveName, category, photosCount, note, rating }
 * @returns {Object} { headline, message, impactLine }
 */
export async function generateCheckInThankYou(data) {
  const prompt = `
You are AlignSetu AI. Generate a warm, personalized thank-you message for a volunteer who just checked in to an environmental drive.

Drive: "${data.driveName}" (${data.category})
Photos submitted: ${data.photosCount}
Volunteer note: "${data.note || 'none'}"
Rating given: ${data.rating || 'not rated'}/5

Return a JSON object:
- headline: short celebratory headline (max 8 words, include an emoji)
- message: 1-2 warm sentences thanking them specifically
- impactLine: one sentence about the environmental impact they contributed to

Respond ONLY with valid JSON.
`
  try {
    return JSON.parse(await callGemini(prompt, 300))
  } catch {
    return {
      headline: '🌿 Check-in submitted!',
      message: `Thank you for showing up and making a difference at ${data.driveName}.`,
      impactLine: 'Your contribution helps restore our environment one drive at a time.',
    }
  }
}

/**
 * Generates AI platform health insight for admin overview.
 * @param {Object} stats - { totalDrives, activeDrives, totalUsers, pendingNgos, completedDrives }
 * @returns {Object} { insight, alert, recommendation }
 */
export async function getAdminPlatformInsight(stats) {
  const prompt = `
You are AlignSetu AI platform analyst. Analyze these platform stats and provide a brief insight.

Stats:
- Total drives: ${stats.totalDrives}
- Active drives: ${stats.activeDrives}
- Completed drives: ${stats.completedDrives}
- Total users: ${stats.totalUsers}
- Pending NGO verifications: ${stats.pendingNgos}
- Verified NGOs: ${stats.verifiedNgos}

Return a JSON object:
- insight: one sentence about the platform's current health (positive framing)
- alert: one sentence about the most important thing needing attention (or null if nothing urgent)
- recommendation: one specific actionable recommendation for the admin

Respond ONLY with valid JSON.
`
  try {
    return JSON.parse(await callGemini(prompt, 300))
  } catch {
    return {
      insight: `Platform has ${stats.totalDrives} drives with ${stats.totalUsers} users engaged.`,
      alert: stats.pendingNgos > 0 ? `${stats.pendingNgos} NGO${stats.pendingNgos > 1 ? 's' : ''} awaiting verification.` : null,
      recommendation: 'Review pending NGO verifications to maintain platform trust.',
    }
  }
}

/**
 * Generates a community needs report from all active drives.
 * This is the core "scattered data → centralized insight" feature.
 * @param {Array} drives - All active drives on the platform
 * @returns {Object} { headline, topNeeds, urgentAreas, insight, recommendedAction }
 */
export async function generateCommunityReport(drives) {
  if (!drives || drives.length === 0) {
    return {
      headline: 'No active drives to analyze',
      topNeeds: [],
      urgentAreas: [],
      insight: 'Create your first drive to start seeing community insights.',
      recommendedAction: 'Encourage NGOs to post drives in your area.',
    }
  }

  const prompt = `
You are an AI analyst for AlignSetu, an environmental volunteer coordination platform in India.
Analyze these active community drives and identify the most urgent local needs.

Drives data: ${JSON.stringify(drives.map(d => ({
    title: d.title,
    category: d.category,
    urgency: d.urgency,
    location: d.location,
    volunteersNeeded: d.estimatedVolunteers,
    volunteersJoined: d.volunteersJoined || 0,
    description: d.description?.slice(0, 100),
  })))}

Return a JSON object with:
- headline: one punchy sentence summarizing the biggest community need right now
- topNeeds: array of 3 objects, each with { need: string, count: number, urgencyLevel: "high"|"medium"|"low", icon: one of ["🌊","🌳","♻️","🧹","🦁","📢"] }
- urgentAreas: array of up to 3 location strings that need the most help
- insight: 2-sentence AI insight about patterns in the data
- recommendedAction: one specific actionable recommendation for volunteers

Respond ONLY with valid JSON.
`
  try {
    return JSON.parse(await callGemini(prompt, 800))
  } catch {
    // Fallback if AI fails
    const categories = drives.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1
      return acc
    }, {})
    const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]
    return {
      headline: `${topCat?.[0]?.replace('_', ' ')} drives need the most volunteers right now`,
      topNeeds: Object.entries(categories).slice(0, 3).map(([cat, count]) => ({
        need: cat.replace('_', ' '),
        count,
        urgencyLevel: count > 2 ? 'high' : 'medium',
        icon: { cleanup: '🧹', plantation: '🌳', water_conservation: '🌊', recycling: '♻️', wildlife: '🦁', awareness: '📢' }[cat] || '🌿',
      })),
      urgentAreas: [...new Set(drives.map(d => d.location).filter(Boolean))].slice(0, 3),
      insight: `There are ${drives.length} active drives across ${Object.keys(categories).length} categories. Volunteer demand is highest for ${topCat?.[0]?.replace('_', ' ')} activities.`,
      recommendedAction: `Join a ${topCat?.[0]?.replace('_', ' ')} drive near you to make the most impact today.`,
    }
  }
}

/**
 * Analyzes a public need submission and matches it against NGO's existing drives.
 * Called automatically when someone submits via QR form.
 * @param {Object} need - { category, description, location, urgency }
 * @param {Array} ngoDrives - NGO's current active drives
 * @returns {Object} { confirmedCategory, confirmedUrgency, summary, matchedDriveId, matchReason, suggestedDriveTitle, suggestedDriveDesc, actionable }
 */
export async function analyzePublicNeed(need, ngoDrives) {
  const prompt = `
You are AlignSetu AI. A member of the public has submitted a community need via QR code scan.
Your job is to:
1. Confirm/correct the category and urgency based on the description
2. Match it against the NGO's existing drives (if any match)
3. If no match, suggest a new drive the NGO should create

Public Need:
- Category selected: ${need.category}
- Urgency selected: ${need.urgency}
- Description: "${need.description}"
- Location: "${need.location}"

NGO's Active Drives:
${ngoDrives.length > 0
  ? JSON.stringify(ngoDrives.map(d => ({ id: d.id, title: d.title, category: d.category, location: d.location, description: d.description?.slice(0, 80) })))
  : 'No active drives yet'}

Return a JSON object:
- confirmedCategory: corrected category (one of: cleanup, plantation, water, recycling, health, other)
- confirmedUrgency: corrected urgency (one of: low, medium, high)
- summary: one sentence summarizing this need in simple Hindi-English (e.g. "Yamuna ke paas safai ki zarurat hai")
- matchedDriveId: id of the best matching existing drive, or null if none
- matchReason: why it matches (max 10 words), or null
- matchScore: 0-100 how well it matches the existing drive, or 0
- suggestedDriveTitle: if no match, suggest a drive title (max 8 words)
- suggestedDriveDesc: if no match, 1-sentence drive description
- actionable: one short instruction for the NGO (max 12 words, in Hinglish)

Respond ONLY with valid JSON.
`
  try {
    return JSON.parse(await callGemini(prompt, 500))
  } catch {
    return {
      confirmedCategory: need.category,
      confirmedUrgency: need.urgency,
      summary: need.description?.slice(0, 60) + '…',
      matchedDriveId: null,
      matchReason: null,
      matchScore: 0,
      suggestedDriveTitle: `${need.category} drive in ${need.location}`,
      suggestedDriveDesc: `Address the reported ${need.category} issue in ${need.location}.`,
      actionable: 'Review this need and take action',
    }
  }
}

/**
 * Analyzes a photo submitted with a public need using Gemini Vision.
 * Returns urgency assessment, what's visible, and confidence.
 * @param {string} base64Image - base64 encoded image (without data: prefix)
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @param {string} userDescription - what the user wrote/said
 * @returns {Object} { urgency, confidence, whatISee, urgencyReason, isLegitimate }
 */
export async function analyzeNeedPhoto(base64Image, mimeType, userDescription) {
  const prompt = `
You are AlignSetu AI analyzing a photo submitted by a community member reporting an environmental or social need.

User's description: "${userDescription || 'No description provided'}"

Look at this photo carefully and assess:
1. What environmental/social problem is visible?
2. How urgent is this situation?
3. Is this a legitimate need (not spam/irrelevant)?

Return a JSON object:
- urgency: one of "low", "medium", "high" — based on what you actually see in the photo
- confidence: 0-100 how confident you are in the urgency assessment
- whatISee: one sentence describing what's visible in the photo (in simple English)
- urgencyReason: one short sentence (max 12 words) explaining why this urgency level — in Hinglish
- isLegitimate: true/false — is this a real environmental/community need?
- category: best matching category from ["cleanup","plantation","water","recycling","health","other"]

Be strict: if photo shows garbage/flooding/pollution → high urgency. If minor issue → low/medium.
Respond ONLY with valid JSON.
`

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            }
          }
        ]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
    }),
  })

  if (!response.ok) throw new Error('Gemini Vision API error')
  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}
