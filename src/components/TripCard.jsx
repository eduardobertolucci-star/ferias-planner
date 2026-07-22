import { useState } from 'react'
import { CATEGORIAS, totalOrcamento } from '../constants'

const TIPO_EMOJI = {
  praia: '🏖️', montanha: '⛰️', cidade: '🏙️',
  campo: '🌿', internacional: '✈️', cruzeiro: '🚢',
}

const STATUS_CONFIG = {
  planejando: { label: 'Planejando', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  em_viagem: { label: 'Em Viagem', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  finalizada: { label: 'Finalizada', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
}

function diasAte(dataInicio) {
  const hoje = new Date()
  const inicio = new Date(dataInicio)
  const diff = Math.ceil((inicio - hoje) / (1000 * 60 * 60 * 24))
  if (diff < 0) return null
  if (diff === 0) return 'Hoje!'
  if (diff === 1) return 'Amanhã!'
  return `em ${diff} dias`
}

function duracaoViagem(inicio, fim) {
  return Math.ceil((new Date(fim) - new Date(inicio)) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const CARD_GRADIENTS = {
  praia: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
  montanha: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  cidade: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  campo: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  internacional: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  cruzeiro: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
}

export default function TripCard({ trip, onEdit, onDelete, onStartTrip }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [hovered, setHovered] = useState(false)

  const emoji = TIPO_EMOJI[trip.tipo] || '🌍'
  const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planejando
  const dias = diasAte(trip.dataInicio)
  const duracao = duracaoViagem(trip.dataInicio, trip.dataFim)
  const cardGradient = CARD_GRADIENTS[trip.tipo] || CARD_GRADIENTS.cidade
  const total = totalOrcamento(trip.orcamento)

  // Categorias com valor definido
  const categoriasComValor = typeof trip.orcamento === 'object' && trip.orcamento
    ? CATEGORIAS.filter(c => Number(trip.orcamento[c.value]) > 0)
    : []

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
        boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      {/* Header colorido */}
      <div style={{ background: cardGradient, padding: '24px 24px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', right: 20, bottom: -30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</div>
            <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {trip.destino}
            </h3>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>
              {formatDate(trip.dataInicio)} → {formatDate(trip.dataFim)} · {duracao} dias
            </div>
          </div>
          <div style={{
            background: status.bg,
            border: `1px solid ${status.color}`,
            color: status.color,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 11, fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}>
            {status.label}
          </div>
        </div>

        {dias && trip.status === 'planejando' && (
          <div style={{
            marginTop: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
            borderRadius: 8, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'white', fontSize: 12, fontWeight: 600,
          }}>
            ⏰ {dias}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>

        {/* Orçamento por categoria */}
        {total > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                Orçamento
              </div>
              <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 700 }}>
                R$ {total.toLocaleString('pt-BR')}
              </div>
            </div>

            {categoriasComValor.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {categoriasComValor.map((cat, i) => {
                  const valor = Number(trip.orcamento[cat.value])
                  const pct = total > 0 ? (valor / total) * 100 : 0
                  return (
                    <div key={cat.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{cat.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{cat.label}</span>
                          <span style={{ color: cat.color, fontSize: 11, fontWeight: 600 }}>
                            R$ {valor.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 999, height: 3 }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: cat.color, borderRadius: 999,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Participantes */}
        {trip.participantes?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Quem vai
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {trip.participantes.map(p => (
                <div key={p} style={{
                  background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 20, padding: '4px 10px', color: '#93c5fd', fontSize: 12, fontWeight: 500,
                }}>👤 {p}</div>
              ))}
            </div>
          </div>
        )}

        {/* Atividades */}
        {trip.atividades?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Atividades ({trip.atividades.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {trip.atividades.slice(0, 3).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{a}</span>
                </div>
              ))}
              {trip.atividades.length > 3 && (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, paddingLeft: 14 }}>
                  +{trip.atividades.length - 3} mais...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {!showConfirmDelete ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {trip.status === 'planejando' && (
              <button onClick={() => onStartTrip(trip)} style={{
                flex: 1,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                🌍 Iniciar Viagem
              </button>
            )}
            <button onClick={() => onEdit(trip)} style={{
              flex: trip.status === 'planejando' ? 0 : 1,
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              padding: '10px 14px', fontSize: 13, cursor: 'pointer',
            }}>✏️</button>
            <button onClick={() => setShowConfirmDelete(true)} style={{
              background: 'rgba(239,68,68,0.1)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
              padding: '10px 14px', fontSize: 13, cursor: 'pointer',
            }}>🗑️</button>
          </div>
        ) : (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12, padding: '12px 16px', textAlign: 'center',
          }}>
            <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>Excluir esta viagem?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onDelete(trip.id)} style={{
                flex: 1, background: '#dc2626', color: 'white', border: 'none',
                borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Excluir</button>
              <button onClick={() => setShowConfirmDelete(false)} style={{
                flex: 1, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px', fontSize: 12, cursor: 'pointer',
              }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
