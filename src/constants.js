export const CATEGORIAS = [
  { value: 'acomodacao', label: 'Acomodação', emoji: '🏨', color: '#8b5cf6' },
  { value: 'transporte', label: 'Transporte', emoji: '🚗', color: '#3b82f6' },
  { value: 'alimentacao', label: 'Alimentação', emoji: '🍽️', color: '#f59e0b' },
  { value: 'lazer', label: 'Lazer', emoji: '🎡', color: '#10b981' },
  { value: 'compras', label: 'Compras', emoji: '🛍️', color: '#ec4899' },
]

export const ORCAMENTO_VAZIO = {
  acomodacao: '',
  transporte: '',
  alimentacao: '',
  lazer: '',
  compras: '',
}

export function totalOrcamento(orcamento) {
  if (!orcamento || typeof orcamento === 'number') return orcamento || 0
  return Object.values(orcamento).reduce((s, v) => s + (Number(v) || 0), 0)
}
