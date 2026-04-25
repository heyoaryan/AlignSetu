import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let mapsPromise = null
function loadGoogleMaps() {
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps)
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places,geometry`
    script.async = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = reject
    document.head.appendChild(script)
  })
  return mapsPromise
}

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#14532d' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
]

// Category → marker color mapping
export const CATEGORY_COLORS = {
  cleanup: { fill: '#3b82f6', stroke: '#93c5fd' },
  plantation: { fill: '#22c55e', stroke: '#86efac' },
  awareness: { fill: '#eab308', stroke: '#fde047' },
  recycling: { fill: '#a855f7', stroke: '#d8b4fe' },
  water_conservation: { fill: '#06b6d4', stroke: '#67e8f9' },
  wildlife: { fill: '#f97316', stroke: '#fdba74' },
  default: { fill: '#64748b', stroke: '#94a3b8' },
}

export const CATEGORY_LABELS = {
  cleanup: 'Cleanup',
  plantation: 'Plantation',
  awareness: 'Awareness',
  recycling: 'Recycling',
  water_conservation: 'Water',
  wildlife: 'Wildlife',
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`
    )
    const data = await res.json()
    if (data.results?.[0]) {
      const components = data.results[0].address_components
      const neighbourhood = components.find(c => c.types.includes('neighborhood'))?.long_name
      const sub2 = components.find(c => c.types.includes('sublocality_level_2'))?.long_name
      const sub1 = components.find(c => c.types.includes('sublocality_level_1'))?.long_name
      const sublocality = components.find(c => c.types.includes('sublocality'))?.long_name
      const premise = components.find(c => c.types.includes('premise'))?.long_name
      return neighbourhood || sub2 || sub1 || sublocality || premise || data.results[0].formatted_address.split(',')[0]
    }
  } catch {}
  return null
}

export default function MapView({
  drives = [],
  volunteers = [],
  volunteerLocation = null,
  radiusKm = 20,
  mode = 'ngo',
  center,
  showCategoryFilter = false,
  selectedCategories = null, // Set of category strings, null = show all
}) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const circleRef = useRef(null)
  const activeInfoWindowRef = useRef(null)

  // Internal filter state (used only when showCategoryFilter=true and no external selectedCategories)
  const [activeCategories, setActiveCategories] = useState(new Set())

  const defaultCenter = volunteerLocation || center || { lat: 28.6139, lng: 77.209 }

  // Derive available categories from drives
  const availableCategories = [...new Set(drives.map(d => d.category).filter(Boolean))]

  // Use external selectedCategories if provided, else internal
  const effectiveFilter = selectedCategories !== null ? selectedCategories : activeCategories

  // Filtered drives based on active category filter
  const filteredDrives = effectiveFilter.size === 0
    ? drives
    : drives.filter(d => effectiveFilter.has(d.category))

  const toggleCategory = (cat) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Reset map instance when component unmounts so it reinits on remount
  useEffect(() => {
    return () => { mapInstance.current = null }
  }, [])

  // ── Effect 1: Init map + markers (runs when drives/location/mode/filter change) ──
  useEffect(() => {
    if (!MAPS_API_KEY) return

    loadGoogleMaps().then(async (maps) => {
      if (!mapRef.current) return
      if (!mapInstance.current) {
        mapInstance.current = new maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: mode === 'volunteer' ? 11 : 12,
          styles: DARK_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: maps.ControlPosition.RIGHT_BOTTOM },
        })
      }

      // Clear old markers
      markersRef.current.forEach(m => m.setMap(null))
      markersRef.current = []
      if (activeInfoWindowRef.current) { activeInfoWindowRef.current.close(); activeInfoWindowRef.current = null }

      // ── Volunteer marker ──
      if (volunteerLocation) {
        const locationName = await reverseGeocode(volunteerLocation.lat, volunteerLocation.lng)

        const volMarker = new maps.Marker({
          position: volunteerLocation,
          map: mapInstance.current,
          title: 'Your Location',
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#93c5fd',
            strokeWeight: 2.5,
          },
          zIndex: 999,
        })

        const volInfo = new maps.InfoWindow({
          content: `<div style="background:#1e293b;color:#93c5fd;padding:8px 12px;border-radius:8px;font-family:system-ui;font-size:12px;font-weight:600">📍 ${locationName || 'Your Location'}</div>`,
        })

        volInfo.open(mapInstance.current, volMarker)
        activeInfoWindowRef.current = volInfo
        setTimeout(() => {
          volInfo.close()
          if (activeInfoWindowRef.current === volInfo) activeInfoWindowRef.current = null
        }, 3000)

        volMarker.addListener('click', () => {
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close()
          volInfo.open(mapInstance.current, volMarker)
          activeInfoWindowRef.current = volInfo
        })

        markersRef.current.push(volMarker)
        mapInstance.current.setCenter(volunteerLocation)
        mapInstance.current.setZoom(11)
      }

      // ── Drive markers ──
      filteredDrives.forEach((drive) => {
        if (!drive.lat || !drive.lng) return

        const isNearby = volunteerLocation
          ? maps.geometry.spherical.computeDistanceBetween(
              new maps.LatLng(volunteerLocation.lat, volunteerLocation.lng),
              new maps.LatLng(drive.lat, drive.lng)
            ) <= radiusKm * 1000
          : true

        // Use category color if filter is shown, otherwise use proximity/status color
        let fillColor, strokeColor
        if (showCategoryFilter) {
          const catColors = CATEGORY_COLORS[drive.category] || CATEGORY_COLORS.default
          fillColor = catColors.fill
          strokeColor = catColors.stroke
        } else if (mode === 'admin') {
          fillColor = drive.status === 'completed' ? '#94a3b8' : '#22c55e'
          strokeColor = drive.status === 'completed' ? '#cbd5e1' : '#86efac'
        } else {
          fillColor = isNearby ? '#22c55e' : '#64748b'
          strokeColor = isNearby ? '#86efac' : '#94a3b8'
        }

        const marker = new maps.Marker({
          position: { lat: drive.lat, lng: drive.lng },
          map: mapInstance.current,
          title: drive.title,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: isNearby ? 7 : 5,
            fillColor,
            fillOpacity: isNearby ? 0.95 : 0.5,
            strokeColor,
            strokeWeight: 1.5,
          },
          zIndex: isNearby ? 10 : 1,
        })

        const catColors = CATEGORY_COLORS[drive.category] || CATEGORY_COLORS.default
        const dotStyle = `background:${catColors.fill};`

        const infoWindow = new maps.InfoWindow({
          content: `
            <div style="background:#1e293b;color:#f1f5f9;padding:12px 14px;border-radius:10px;min-width:190px;font-family:system-ui;box-shadow:0 8px 24px rgba(0,0,0,0.4)">
              <div style="font-weight:700;font-size:13px;margin-bottom:5px;color:#f8fafc">${drive.title}</div>
              <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;margin-bottom:3px">
                <span style="width:8px;height:8px;border-radius:50%;display:inline-block;${dotStyle}"></span>
                <span style="text-transform:capitalize">${(drive.category || 'general').replace('_', ' ')} • ${drive.urgency || 'normal'}</span>
              </div>
              <div style="font-size:11px;color:#4ade80;margin-bottom:3px">👥 ${drive.volunteersJoined || 0}/${drive.estimatedVolunteers || 20} volunteers</div>
              ${drive.location ? `<div style="font-size:11px;color:#94a3b8">📍 ${drive.location}</div>` : ''}
              ${drive.updates?.length ? `<div style="font-size:10px;color:#60a5fa;margin-top:5px">💬 ${drive.updates.length} update${drive.updates.length > 1 ? 's' : ''}</div>` : ''}
              ${volunteerLocation && isNearby ? `<div style="font-size:10px;color:#60a5fa;margin-top:5px;font-weight:600">✓ Within ${radiusKm}km</div>` : ''}
            </div>
          `,
        })

        marker.addListener('click', () => {
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close()
          infoWindow.open(mapInstance.current, marker)
          activeInfoWindowRef.current = infoWindow
        })

        markersRef.current.push(marker)
      })

      // ── Volunteer markers (admin mode) ──
      volunteers.forEach((vol) => {
        if (!vol.lat || !vol.lng) return

        const marker = new maps.Marker({
          position: { lat: vol.lat, lng: vol.lng },
          map: mapInstance.current,
          title: vol.displayName || vol.email,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#a855f7',
            fillOpacity: 0.9,
            strokeColor: '#d8b4fe',
            strokeWeight: 1.5,
          },
          zIndex: 5,
        })

        const infoWindow = new maps.InfoWindow({
          content: `
            <div style="background:#1e293b;color:#f1f5f9;padding:12px 14px;border-radius:10px;min-width:170px;font-family:system-ui;box-shadow:0 8px 24px rgba(0,0,0,0.4)">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#f8fafc">👤 ${vol.displayName || vol.email?.split('@')[0] || 'Volunteer'}</div>
              <div style="font-size:11px;color:#94a3b8">${vol.email || ''}</div>
              ${vol.location ? `<div style="font-size:11px;color:#c4b5fd;margin-top:4px">📍 ${vol.location}</div>` : ''}
            </div>
          `,
        })

        marker.addListener('click', () => {
          if (activeInfoWindowRef.current) activeInfoWindowRef.current.close()
          infoWindow.open(mapInstance.current, marker)
          activeInfoWindowRef.current = infoWindow
        })

        markersRef.current.push(marker)
      })
    })
  }, [filteredDrives, volunteers, volunteerLocation, mode])

  // ── Effect 2: Only update circle radius when radiusKm changes ──
  useEffect(() => {
    if (!volunteerLocation || !MAPS_API_KEY) return

    loadGoogleMaps().then((maps) => {
      if (circleRef.current) {
        circleRef.current.setRadius(radiusKm * 1000)
        return
      }
      if (mapInstance.current) {
        circleRef.current = new maps.Circle({
          map: mapInstance.current,
          center: volunteerLocation,
          radius: radiusKm * 1000,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.4,
          strokeWeight: 1.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.06,
        })
      }
    })
  }, [radiusKm, volunteerLocation])

  if (!MAPS_API_KEY) {
    return (
      <div className="w-full h-full card rounded-2xl flex flex-col items-center justify-center gap-3 p-6">
        <MapPin size={32} className="text-green-500" />
        <p className="text-sm text-secondary text-center">Add <code className="text-green-400">VITE_GOOGLE_MAPS_API_KEY</code> to enable map</p>
        <div className="flex gap-2 flex-wrap justify-center mt-2">
          {filteredDrives.map((d) => (
            <span key={d.id} className="text-xs px-2.5 py-1.5 rounded-lg text-green-500 border border-green-500/20"
              style={{ background: 'var(--bg-input)' }}>
              📍 {d.title}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      {/* Category filter overlay — only shown when showCategoryFilter=true AND no external control */}
      {showCategoryFilter && selectedCategories === null && availableCategories.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-xs">
          <button
            onClick={() => setActiveCategories(new Set())}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-all ${
              activeCategories.size === 0
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-black/50 text-gray-300 border-white/10 hover:bg-black/70'
            }`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            All
          </button>
          {availableCategories.map(cat => {
            const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default
            const isActive = activeCategories.has(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-all"
                style={{
                  backdropFilter: 'blur(8px)',
                  background: isActive ? `${colors.fill}33` : 'rgba(0,0,0,0.5)',
                  color: isActive ? colors.stroke : '#94a3b8',
                  borderColor: isActive ? `${colors.fill}66` : 'rgba(255,255,255,0.1)',
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ background: colors.fill }}
                />
                {CATEGORY_LABELS[cat] || cat}
              </button>
            )
          })}
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
