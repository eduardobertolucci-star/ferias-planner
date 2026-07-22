import { useState } from 'react'
import { CATEGORIAS, ORCAMENTO_VAZIO, totalOrcamento } from '../constants'

function SectionHeader({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{title}</div>
    </div>
  )
}

export default function NewTripModal({ trip, onSave, onClose }) {
  const orcamentoInicial = trip?.orcamento && typeof trip.orcamento === 'object'
    ? trip.orcamento
    : { ...ORCAMENTO_VAZIO }

  const [form, setForm] = useState({
    destino: trip?.destino || '',
    dataInicio: trip?.dataInicio || '',
    dataFim: trip?.dataFim || '',
    orcamento: orcamentoInicial,
    tipo: trip?.tipo || 'praia',
    participantes: trip?.participantes || [],
    atividades: trip?.atividades || [],
    status: trip?.status || 'planejando',
  })

  const total = totalOrcamento(form.orcamento)
  const canSave = form.destino.trim() && form.dataInicio && form.dataFim

  const duracao = form.dataInicio && form.dataFim && new Date(form.dataFim) > new Date(form.dataInicio)
    ? Math.ceil((new Date(form.dataFim) - new Date(form.dataInicio)) / (1000 * 60 * 60 * 24))
    : null

  const setOrcamento = (cat, val) =>
    setForm(f => ({ ...f, orcamento: { ...f.orcamento, [cat]: val } }))

  const handleSave = () => {
    if (!canSave) return
    onSave({ ...form, orcamento: form.orcamento })
  }

  const input = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 10,
    padding: '11px 14px',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  }

  const section = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '18px 20px',
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, rgba(30,58,138,0.97), rgba(23,37,84,0.99))',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 24,
        width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0,
          background: 'rgba(23,37,84,0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px 24px 0 0',
          zIndex: 10,
        }}>
          <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
            ✈️ Nova Viagem
          </h2>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, width: 32, height: 32, color: 'rgba(255,255,255,0.7)',
            fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Nome */}
          <div style={section}>
            <SectionHeader icon="📍" title="Destino" />
            <input
              type="text"
              placeholder="Para onde vai?"
              value={form.destino}
              onChange={e => setForm({ ...form, destino: e.target.value })}
              style={input}
              autoFocus
              onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.13)'}
            />
          </div>

          {/* Datas */}
          <div style={section}>
            <SectionHeader icon="📅" title="Datas" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 }}>Ida</div>
                <input type="date" value={form.dataInicio}
                  onChange={e => setForm({ ...form, dataInicio: e.target.value })}
                  style={{ ...input, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.13)'}
                />
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 }}>Volta</div>
                <input type="date" value={form.dataFim}
                  onChange={e => setForm({ ...form, dataFim: e.target.value })}
                  style={{ ...input, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.13)'}
                />
              </div>
            </div>
            {duracao && (
              <div style={{ color: '#60a5fa', fontSize: 12, fontWeight: 600, marginTop: 10 }}>
                ✓ {duracao} dias
              </div>
            )}
          </div>

          {/* Orçamento */}
          <div style={section}>
            <SectionHeader icon="💰" title="Orçamento Previsto" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CATEGORIAS.map(cat => (
                <div key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${cat.color}22`, border: `1px solid ${cat.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  }}>{cat.emoji}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, width: 96, flexShrink: 0 }}>{cat.label}</div>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{
                      position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.3)', fontSize: 12, pointerEvents: 'none',
                    }}>R$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.orcamento[cat.value]}
                      onChange={e => setOrcamento(cat.value, e.target.value)}
                      style={{ ...input, paddingLeft: 32, fontSize: 14 }}
                      onFocus={e => e.target.style.borderColor = cat.color}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.13)'}
                    />
                  </div>
                </div>
              ))}
            </div>

            {total > 0 && (
              <div style={{
                marginTop: 12,
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Total</span>
                <span style={{ color: '#60a5fa', fontSize: 17, fontWeight: 700 }}>
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={handleSave} disabled={!canSave} style={{
              flex: 2,
              background: canSave ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255,255,255,0.1)',
              color: canSave ? 'white' : 'rgba(255,255,255,0.3)',
              border: 'none', borderRadius: 12, padding: '12px',
              fontSize: 14, fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              boxShadow: canSave ? '0 4px 12px rgba(59,130,246,0.4)' : 'none',
              transition: 'all 0.2s',
            }}>✈️ Criar Viagem</button>
          </div>

        </div>
      </div>
    </div>
  )
}
