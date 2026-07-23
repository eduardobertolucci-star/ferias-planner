import { useState, useEffect, useRef } from 'react'
import { CATEGORIAS, totalOrcamento } from '../constants'
import { useLancamentos } from '../hooks/useLancamentos'

const CAT_OUTRO = { value: 'outro', label: 'Outro', emoji: '📌', color: '#6b7280' }
const TODAS_CATS = [...CATEGORIAS, CAT_OUTRO]
function getCat(value) { return TODAS_CATS.find(c => c.value === value) || CAT_OUTRO }

// ─── Estilos de mapa ─────────────────────────────────────────────────────────
const ESTILOS_MAPA = [
  { id: 'dark',     label: 'Escuro',  emoji: '🌑', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',                   attribution: '© OpenStreetMap © CARTO' },
  { id: 'standard', label: 'Padrão',  emoji: '🗺️', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                              attribution: '© OpenStreetMap contributors' },
  { id: 'voyager',  label: 'Claro',   emoji: '☀️', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',        attribution: '© OpenStreetMap © CARTO' },
  { id: 'topo',     label: 'Relevo',  emoji: '⛰️', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',                               attribution: '© OpenTopoMap' },
]

// Posição inicial do mapa, antes do destino ser localizado
const SAO_PAULO = { lat: -23.5505, lon: -46.6333 }

// ─── Geocode via Nominatim ────────────────────────────────────────────────────
async function geocode(query) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } }
  )
  const data = await r.json()
  if (!data.length) return null
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    nome: data[0].display_name.split(',').slice(0, 2).join(','),
  }
}

// ─── Rota via OSRM ───────────────────────────────────────────────────────────
async function fetchRota(waypoints) {
  if (waypoints.length < 2) return null
  const coords = waypoints.map(w => `${w.coords.lon},${w.coords.lat}`).join(';')
  const r = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
  )
  const data = await r.json()
  if (data.code !== 'Ok') return null
  return {
    geometry: data.routes[0].geometry,
    legs: data.routes[0].legs.map(l => ({
      distancia: (l.distance / 1000).toFixed(1),
      duracao: Math.round(l.duration / 60),
    })),
    totalDist: (data.routes[0].distance / 1000).toFixed(1),
    totalDur: Math.round(data.routes[0].duration / 60),
  }
}

function formatDur(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

// ─── Mapa ─────────────────────────────────────────────────────────────────────
function TripMap({ destino, waypoints }) {
  const mapRef     = useRef(null)
  const leafletMap = useRef(null)
  const tileRef    = useRef(null)
  const markersRef = useRef([])
  const routeRef   = useRef(null)

  const [busca, setBusca]         = useState(destino)
  const [inputText, setInputText] = useState(destino)
  const [editando, setEditando]   = useState(false)
  const [coords, setCoords]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [estilo, setEstilo]       = useState('dark')
  const [zoom, setZoom]           = useState(11)
  const [showConfig, setShowConfig] = useState(false)

  // Geocode destino principal
  useEffect(() => {
    setLoading(true); setError(false)
    geocode(busca)
      .then(c => { if (c) setCoords(c); else setError(true) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [busca])

  // Init do mapa — abre sempre em São Paulo, independente do destino buscado
  useEffect(() => {
    if (leafletMap.current || !mapRef.current || !window.L) return
    const L = window.L
    const estiloObj = ESTILOS_MAPA.find(e => e.id === estilo) || ESTILOS_MAPA[0]

    leafletMap.current = L.map(mapRef.current, { zoomControl: false }).setView([SAO_PAULO.lat, SAO_PAULO.lon], zoom)
    L.control.zoom({ position: 'topright' }).addTo(leafletMap.current)
    tileRef.current = L.tileLayer(estiloObj.url, { attribution: estiloObj.attribution, maxZoom: 19 }).addTo(leafletMap.current)
  }, [])

  // Voa até o destino assim que o geocode resolve
  useEffect(() => {
    if (!coords || !leafletMap.current || !window.L) return
    const L = window.L

    // Marcador principal (só se não houver waypoints)
    if (waypoints.length === 0) {
      if (!markersRef.current[0]) {
        const icon = L.divIcon({ html: `<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">📍</div>`, className: '', iconSize: [26,26], iconAnchor: [13,26] })
        markersRef.current[0] = L.marker([coords.lat, coords.lon], { icon }).addTo(leafletMap.current)
      } else {
        markersRef.current[0].setLatLng([coords.lat, coords.lon])
      }
      leafletMap.current.flyTo([coords.lat, coords.lon], zoom)
    }
  }, [coords])

  // Atualizar tile quando estilo muda
  useEffect(() => {
    if (!leafletMap.current || !window.L) return
    const L = window.L
    const estiloObj = ESTILOS_MAPA.find(e => e.id === estilo) || ESTILOS_MAPA[0]
    if (tileRef.current) leafletMap.current.removeLayer(tileRef.current)
    tileRef.current = L.tileLayer(estiloObj.url, { attribution: estiloObj.attribution, maxZoom: 19 }).addTo(leafletMap.current)
  }, [estilo])

  // Zoom
  useEffect(() => { if (leafletMap.current) leafletMap.current.setZoom(zoom) }, [zoom])

  // Waypoints: marcadores numerados + rota
  useEffect(() => {
    if (!leafletMap.current || !window.L) return
    const L = window.L

    // Limpar marcadores anteriores
    markersRef.current.forEach(m => leafletMap.current.removeLayer(m))
    markersRef.current = []

    // Limpar rota anterior
    if (routeRef.current) { leafletMap.current.removeLayer(routeRef.current); routeRef.current = null }

    if (waypoints.length === 0) return

    // Adicionar marcadores numerados
    waypoints.forEach((wp, i) => {
      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:linear-gradient(135deg,#3b82f6,#1d4ed8);
          border:2px solid white;
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:12px;font-weight:700;
          box-shadow:0 2px 8px rgba(0,0,0,.5);
          font-family:system-ui,sans-serif;
        ">${i + 1}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      const marker = L.marker([wp.coords.lat, wp.coords.lon], { icon })
        .bindTooltip(`<b>${i + 1}. ${wp.nome}</b>`, { permanent: false, direction: 'top', className: 'leaflet-tooltip-dark' })
        .addTo(leafletMap.current)
      markersRef.current.push(marker)
    })

    // Buscar rota OSRM e desenhar
    if (waypoints.length >= 2) {
      fetchRota(waypoints).then(rota => {
        if (!rota || !leafletMap.current) return
        routeRef.current = L.geoJSON(rota.geometry, {
          style: { color: '#3b82f6', weight: 4, opacity: 0.85, dashArray: null },
        }).addTo(leafletMap.current)
      })
    }

    // Ajustar bounds
    const bounds = L.latLngBounds(waypoints.map(w => [w.coords.lat, w.coords.lon]))
    leafletMap.current.fitBounds(bounds, { padding: [40, 40] })
  }, [waypoints])

  // Destroy on unmount
  useEffect(() => () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null } }, [])

  const [mapHovered, setMapHovered] = useState(false)

  const handleConfirmar = () => { if (inputText.trim()) setBusca(inputText.trim()); setEditando(false) }
  const handleKey = e => { if (e.key === 'Enter') handleConfirmar(); if (e.key === 'Escape') { setInputText(busca); setEditando(false) } }

  return (
    <div
      className={`map-wrapper${mapHovered ? ' map-hovered' : ''}`}
      onMouseEnter={() => setMapHovered(true)}
      onMouseLeave={() => { setMapHovered(false); if (!editando) setShowConfig(false) }}
      style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}
    >
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .map-wrapper .leaflet-control-zoom {
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .map-wrapper.map-hovered .leaflet-control-zoom {
          opacity: 1;
        }
      `}</style>
      <div ref={mapRef} style={{ height: 340, width: '100%' }} />

      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(23,37,84,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
          <div style={{ fontSize: 36, animation: 'spin 1.5s linear infinite' }}>🌍</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Localizando {busca}...</div>
        </div>
      )}
      {error && !loading && (
        <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: 'rgba(23,37,84,0.88)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '7px 13px' }}>
          <span style={{ color: '#f87171', fontSize: 12 }}>Nenhum resultado para "{busca}"</span>
        </div>
      )}

      {/* Barra superior — visível só no hover (ou quando editando) */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12,
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 1000,
        opacity: mapHovered || editando ? 1 : 0,
        transition: 'opacity 0.25s ease',
        pointerEvents: mapHovered || editando ? 'all' : 'none',
      }}>
        {editando ? (
          <>
            <input autoFocus value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKey}
              placeholder="Digite cidade ou local..."
              style={{ flex: 1, background: 'rgba(23,37,84,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(59,130,246,0.6)', borderRadius: 10, padding: '9px 14px', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={handleConfirmar} style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Buscar</button>
            <button onClick={() => { setInputText(busca); setEditando(false) }} style={{ background: 'rgba(30,30,60,0.85)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '9px 12px', fontSize: 13, cursor: 'pointer' }}>✕</button>
          </>
        ) : (
          <>
            <button onClick={() => { setInputText(busca); setEditando(true) }} style={{ background: 'rgba(23,37,84,0.88)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '7px 12px', color: 'rgba(255,255,255,0.8)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ✏️ Editar localização
            </button>
            <button onClick={() => setShowConfig(v => !v)} style={{ background: showConfig ? 'rgba(59,130,246,0.35)' : 'rgba(23,37,84,0.88)', backdropFilter: 'blur(8px)', border: showConfig ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '7px 12px', color: showConfig ? '#93c5fd' : 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              ⚙️ Configurar
            </button>
          </>
        )}
      </div>

      {/* Painel de configuração */}
      {showConfig && !editando && (
        <div style={{ position: 'absolute', top: 52, left: 12, zIndex: 1000, background: 'rgba(15,25,60,0.96)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '16px', minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Estilo do mapa</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {ESTILOS_MAPA.map(e => (
              <button key={e.id} onClick={() => setEstilo(e.id)} style={{ background: estilo === e.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)', border: estilo === e.id ? '1px solid rgba(59,130,246,0.6)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: estilo === e.id ? '#93c5fd' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {e.emoji} {e.label}
              </button>
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>Zoom</span><span style={{ color: '#60a5fa' }}>{zoom}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setZoom(z => Math.max(3, z - 1))} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, width: 28, height: 28, color: 'white', fontSize: 16, cursor: 'pointer' }}>−</button>
            <input type="range" min={3} max={18} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ flex: 1, accentColor: '#3b82f6', cursor: 'pointer' }} />
            <button onClick={() => setZoom(z => Math.min(18, z + 1))} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, width: 28, height: 28, color: 'white', fontSize: 16, cursor: 'pointer' }}>+</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 4 }}>
            <span>País</span><span>Rua</span>
          </div>
        </div>
      )}

      {/* Badge localização */}
      {coords && !loading && waypoints.length === 0 && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          background: 'rgba(23,37,84,0.88)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
          padding: '7px 13px', display: 'flex', alignItems: 'center', gap: 7,
          pointerEvents: 'none',
          opacity: mapHovered ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{coords.nome}</span>
        </div>
      )}
    </div>
  )
}

function noites(chegada, partida) {
  if (!chegada || !partida) return null
  const n = Math.round((new Date(partida) - new Date(chegada)) / 86400000)
  return n > 0 ? n : null
}

// ─── Painel de Roteiro ────────────────────────────────────────────────────────
function ItineraryPanel({ waypoints, onAdd, onRemove, onUpdate }) {
  const [inputText, setInputText] = useState('')
  const [buscando, setBuscando]   = useState(false)
  const [erro, setErro]           = useState(false)
  const [rota, setRota]           = useState(null)

  useEffect(() => {
    if (waypoints.length < 2) { setRota(null); return }
    fetchRota(waypoints).then(r => setRota(r)).catch(() => setRota(null))
  }, [waypoints])

  const handleAdd = async () => {
    if (!inputText.trim()) return
    setBuscando(true); setErro(false)
    const c = await geocode(inputText.trim()).catch(() => null)
    setBuscando(false)
    if (!c) { setErro(true); return }
    onAdd({ id: Date.now(), nome: inputText.trim(), coords: c, nomeCompleto: c.nome, dataChegada: '', dataPartida: '' })
    setInputText('')
  }

  const handleKey = e => { if (e.key === 'Enter') handleAdd() }

  const totalNoites = waypoints.reduce((sum, wp) => sum + (noites(wp.dataChegada, wp.dataPartida) || 0), 0)
  const rotaInfo = rota ? `${rota.totalDist} km · ${formatDur(rota.totalDur)}` : null

  const dateInput = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '5px 10px',
    color: 'white', fontSize: 12, outline: 'none',
    fontFamily: 'inherit', colorScheme: 'dark', cursor: 'pointer',
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗺️</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Roteiro</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2, display: 'flex', gap: 10 }}>
              {rotaInfo && <span>🛣️ {rotaInfo}</span>}
              {totalNoites > 0 && <span>🌙 {totalNoites} noite{totalNoites !== 1 ? 's' : ''}</span>}
            </div>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{waypoints.length} parada{waypoints.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Buscador */}
      <div style={{ display: 'flex', gap: 8, marginBottom: erro ? 8 : 16 }}>
        <input
          value={inputText}
          onChange={e => { setInputText(e.target.value); setErro(false) }}
          onKeyDown={handleKey}
          placeholder="Adicionar parada — cidade, praia, hotel..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.07)',
            border: erro ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.13)',
            borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={handleAdd} disabled={buscando || !inputText.trim()} style={{
          background: inputText.trim() ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'rgba(255,255,255,0.08)',
          color: inputText.trim() ? 'white' : 'rgba(255,255,255,0.3)',
          border: 'none', borderRadius: 10, padding: '10px 18px',
          fontSize: 13, fontWeight: 600, cursor: inputText.trim() ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap', minWidth: 80,
        }}>
          {buscando ? '...' : '+ Adicionar'}
        </button>
      </div>
      {erro && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>Local não encontrado. Tente ser mais específico.</div>}

      {/* Lista */}
      {waypoints.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
          Adicione paradas para montar seu roteiro 🧭
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {waypoints.map((wp, i) => {
            const leg = rota?.legs?.[i - 1]
            const n = noites(wp.dataChegada, wp.dataPartida)

            return (
              <div key={wp.id}>
                {/* Conector entre paradas */}
                {i > 0 && (
                  <div style={{ paddingLeft: 13, margin: '2px 0' }}>
                    <div style={{ width: 2, height: 6, background: 'rgba(59,130,246,0.25)' }} />
                    {leg ? (
                      <div style={{ display: 'flex', gap: 8, padding: '3px 0 3px 20px' }}>
                        <span style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: '2px 9px', color: '#93c5fd', fontSize: 11, fontWeight: 600 }}>🛣️ {leg.distancia} km</span>
                        <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '2px 9px', color: '#6ee7b7', fontSize: 11, fontWeight: 600 }}>⏱️ {formatDur(leg.duracao)}</span>
                      </div>
                    ) : (
                      <div style={{ paddingLeft: 20, padding: '3px 0 3px 20px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>calculando rota...</span>
                      </div>
                    )}
                    <div style={{ width: 2, height: 6, background: 'rgba(59,130,246,0.25)' }} />
                  </div>
                )}

                {/* Card da parada */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: '14px 16px',
                }}>
                  {/* Linha topo: número + nome + remover */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wp.nome}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wp.nomeCompleto}</div>
                    </div>
                    <button onClick={() => onRemove(wp.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 16, padding: '2px 4px', borderRadius: 6, flexShrink: 0 }}
                      onMouseOver={e => e.currentTarget.style.color = '#f87171'}
                      onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                    >×</button>
                  </div>

                  {/* Datas de permanência */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Chegada</span>
                      <input
                        type="date"
                        value={wp.dataChegada}
                        onChange={e => onUpdate(wp.id, { dataChegada: e.target.value })}
                        style={dateInput}
                      />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>→</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Saída</span>
                      <input
                        type="date"
                        value={wp.dataPartida}
                        min={wp.dataChegada || undefined}
                        onChange={e => onUpdate(wp.id, { dataPartida: e.target.value })}
                        style={dateInput}
                      />
                    </div>
                    {n && (
                      <span style={{ marginLeft: 4, background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '3px 10px', color: '#c4b5fd', fontSize: 11, fontWeight: 600 }}>
                        🌙 {n} noite{n !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────
function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : defaultValue
    } catch { return defaultValue }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
  }, [key, state])
  return [state, setState]
}

export default function TripScreen({ trip, onBack, user }) {
  const key = `trip_${trip.id}`
  const { lancamentos, addLancamento, deleteLancamento } = useLancamentos(user, trip.id)
  const [waypoints, setWaypoints]     = usePersistedState(`${key}_waypoints`, [])
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm] = useState({
    descricao: '', valor: '', categoria: 'alimentacao',
    data: new Date().toISOString().split('T')[0],
  })

  const orcamentoTotal  = totalOrcamento(trip.orcamento)
  const totalGasto      = lancamentos.reduce((s, l) => s + l.valor, 0)
  const saldo           = orcamentoTotal - totalGasto
  const percentualGeral = orcamentoTotal > 0 ? Math.min((totalGasto / orcamentoTotal) * 100, 100) : 0

  const handleAdd = () => {
    if (!form.descricao.trim() || !form.valor) return
    addLancamento({ ...form, valor: Number(form.valor) })
    setForm({ descricao: '', valor: '', categoria: form.categoria, data: form.data })
    setShowForm(false)
  }

  const resumoCategoria = CATEGORIAS.map(cat => {
    const planejado = typeof trip.orcamento === 'object' ? Number(trip.orcamento[cat.value] || 0) : 0
    const gasto = lancamentos.filter(l => l.categoria === cat.value).reduce((s, l) => s + l.valor, 0)
    return { ...cat, planejado, gasto }
  }).filter(c => c.planejado > 0 || c.gasto > 0)

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.8)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>← Voltar</button>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>🌍 {trip.destino}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Modo Viagem</div>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
            + Lançamento
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>

        {/* Mapa */}
        <div style={{ marginBottom: 20 }}>
          <TripMap destino={trip.destino} waypoints={waypoints} />
        </div>

        {/* Roteiro */}
        <ItineraryPanel
          waypoints={waypoints}
          onAdd={wp => setWaypoints(wps => [...wps, wp])}
          onRemove={id => setWaypoints(wps => wps.filter(w => w.id !== id))}
          onUpdate={(id, fields) => setWaypoints(wps => wps.map(w => w.id === id ? { ...w, ...fields } : w))}
        />

        {/* Orçamento geral */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
            {[
              { label: 'Orçamento', value: orcamentoTotal, color: '#60a5fa' },
              { label: 'Gasto', value: totalGasto, color: percentualGeral > 90 ? '#f87171' : '#fb923c' },
              { label: saldo >= 0 ? 'Saldo' : 'Excedido', value: Math.abs(saldo), color: saldo >= 0 ? '#4ade80' : '#f87171' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>{item.label}</div>
                <div style={{ color: item.color, fontSize: 22, fontWeight: 700 }}>R$ {item.value.toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percentualGeral}%`, background: percentualGeral > 90 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : percentualGeral > 70 ? 'linear-gradient(90deg,#10b981,#f59e0b)' : 'linear-gradient(90deg,#3b82f6,#10b981)', borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6, textAlign: 'right' }}>{percentualGeral.toFixed(0)}% do orçamento usado</div>
        </div>

        {/* Por categoria */}
        {resumoCategoria.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px', marginBottom: 20 }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Por Categoria</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resumoCategoria.map(cat => {
                const pct = cat.planejado > 0 ? Math.min((cat.gasto / cat.planejado) * 100, 100) : 100
                const over = cat.gasto > cat.planejado && cat.planejado > 0
                return (
                  <div key={cat.value}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>{cat.label}</span>
                        {over && <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>EXCEDIDO</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: over ? '#f87171' : cat.color, fontSize: 13, fontWeight: 700 }}>R$ {cat.gasto.toLocaleString('pt-BR')}</span>
                        {cat.planejado > 0 && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}> / R$ {cat.planejado.toLocaleString('pt-BR')}</span>}
                      </div>
                    </div>
                    {cat.planejado > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 999, height: 5 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: over ? '#ef4444' : cat.color, borderRadius: 999, transition: 'width 0.4s ease' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Form lançamento */}
        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '22px', marginBottom: 20 }}>
            <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 18px' }}>Novo Lançamento</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Categoria</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TODAS_CATS.map(cat => (
                  <button key={cat.value} onClick={() => setForm({ ...form, categoria: cat.value })} style={{ background: form.categoria === cat.value ? `${cat.color}33` : 'rgba(255,255,255,0.05)', border: form.categoria === cat.value ? `2px solid ${cat.color}` : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 12px', color: form.categoria === cat.value ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Descrição</div>
                <input type="text" placeholder="Ex: Almoço no restaurante..." value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Valor (R$)</div>
                <input type="number" placeholder="0" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Data</div>
                <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleAdd} disabled={!form.descricao.trim() || !form.valor} style={{ flex: 2, background: form.descricao.trim() && form.valor ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.1)', color: form.descricao.trim() && form.valor ? 'white' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: form.descricao.trim() && form.valor ? 'pointer' : 'not-allowed' }}>✅ Adicionar</button>
            </div>
          </div>
        )}

        {/* Lista lançamentos */}
        {lancamentos.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 20, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Nenhum gasto registrado ainda</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lancamentos.map(l => {
              const cat = getCat(l.categoria)
              return (
                <div key={l.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${cat.color}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{cat.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{l.descricao}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{cat.label} · {l.data.split('-').reverse().join('/')}</div>
                  </div>
                  <div style={{ color: '#fb923c', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>R$ {l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <button onClick={() => deleteLancamento(l.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, padding: '4px', borderRadius: 6 }}
                    onMouseOver={e => e.currentTarget.style.color = '#f87171'}
                    onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                  >×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
