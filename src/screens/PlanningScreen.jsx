import { useState, useEffect } from 'react'
import TripCard from '../components/TripCard'
import NewTripModal from '../components/NewTripModal'
import EmptyState from '../components/EmptyState'

const EMOJI_BY_TYPE = {
  praia: '🏖️',
  montanha: '⛰️',
  cidade: '🏙️',
  campo: '🌿',
  internacional: '✈️',
  cruzeiro: '🚢',
}

const SAMPLE_TRIPS = [
  {
    id: 1,
    destino: 'Florianópolis',
    tipo: 'praia',
    dataInicio: '2026-01-10',
    dataFim: '2026-01-20',
    orcamento: {
      acomodacao: 1800,
      transporte: 600,
      alimentacao: 900,
      lazer: 700,
      compras: 500,
    },
    participantes: ['Roque', 'Josbi'],
    atividades: ['Praia da Joaquina', 'Lagoa da Conceição', 'Centro Histórico'],
    status: 'planejando',
  },
]

export default function PlanningScreen({ onStartTrip }) {
  const [trips, setTrips] = useState(() => {
    try {
      const saved = localStorage.getItem('ferias_trips')
      return saved ? JSON.parse(saved) : SAMPLE_TRIPS
    } catch { return SAMPLE_TRIPS }
  })
  const [showModal, setShowModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)

  useEffect(() => {
    try { localStorage.setItem('ferias_trips', JSON.stringify(trips)) } catch {}
  }, [trips])

  const handleSaveTrip = (tripData) => {
    if (editingTrip) {
      setTrips(trips.map(t => t.id === editingTrip.id ? { ...tripData, id: editingTrip.id } : t))
    } else {
      setTrips([...trips, { ...tripData, id: Date.now() }])
    }
    setShowModal(false)
    setEditingTrip(null)
  }

  const handleEdit = (trip) => {
    setEditingTrip(trip)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    setTrips(trips.filter(t => t.id !== id))
  }

  const handleNewTrip = () => {
    setEditingTrip(null)
    setShowModal(true)
  }

  const tripsPlanejando = trips.filter(t => t.status === 'planejando')
  const tripsEmViagem = trips.filter(t => t.status === 'em_viagem')
  const tripsFinalizadas = trips.filter(t => t.status === 'finalizada')

  return (
    <div style={{ minHeight: '100vh', padding: '0' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              ✈️
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>Férias Planner</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Planeje sua próxima aventura</div>
            </div>
          </div>
          <button
            onClick={handleNewTrip}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: 18 }}>+</span>
            Nova Viagem
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats Bar */}
        {trips.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}>
            {[
              { label: 'Planejando', value: tripsPlanejando.length, icon: '📋', color: '#3b82f6' },
              { label: 'Em Viagem', value: tripsEmViagem.length, icon: '🌍', color: '#10b981' },
              { label: 'Finalizadas', value: tripsFinalizadas.length, icon: '✅', color: '#8b5cf6' },
              {
                label: 'Orçamento Total',
                value: `R$ ${trips.reduce((sum, t) => sum + (t.orcamento || 0), 0).toLocaleString('pt-BR')}`,
                icon: '💰',
                color: '#f59e0b'
              },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '16px 20px',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ color: stat.color, fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Trips Grid */}
        {trips.length === 0 ? (
          <EmptyState onNew={handleNewTrip} />
        ) : (
          <>
            {tripsPlanejando.length > 0 && (
              <Section title="✏️ Planejando" trips={tripsPlanejando} onEdit={handleEdit} onDelete={handleDelete} onStartTrip={onStartTrip} />
            )}
            {tripsEmViagem.length > 0 && (
              <Section title="🌍 Em Viagem" trips={tripsEmViagem} onEdit={handleEdit} onDelete={handleDelete} onStartTrip={onStartTrip} />
            )}
            {tripsFinalizadas.length > 0 && (
              <Section title="✅ Finalizadas" trips={tripsFinalizadas} onEdit={handleEdit} onDelete={handleDelete} onStartTrip={onStartTrip} />
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewTripModal
          trip={editingTrip}
          onSave={handleSaveTrip}
          onClose={() => { setShowModal(false); setEditingTrip(null) }}
        />
      )}
    </div>
  )
}

function Section({ title, trips, onEdit, onDelete, onStartTrip }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
        <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{trips.length}</span>
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
      }}>
        {trips.map(trip => (
          <TripCard
            key={trip.id}
            trip={trip}
            onEdit={onEdit}
            onDelete={onDelete}
            onStartTrip={onStartTrip}
          />
        ))}
      </div>
    </div>
  )
}
