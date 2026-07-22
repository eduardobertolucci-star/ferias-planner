export default function EmptyState({ onNew }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      {/* Animated plane */}
      <div style={{
        fontSize: 80,
        marginBottom: 24,
        animation: 'float 3s ease-in-out infinite',
        display: 'inline-block',
      }}>
        ✈️
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
      `}</style>

      <h2 style={{ color: 'white', fontSize: 26, fontWeight: 700, margin: '0 0 12px' }}>
        Nenhuma viagem ainda
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, maxWidth: 320, lineHeight: 1.6, margin: '0 0 32px' }}>
        Comece a planejar sua próxima aventura e deixe o app te ajudar a organizar tudo!
      </p>

      <button
        onClick={onNew}
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          color: 'white',
          border: 'none',
          borderRadius: 16,
          padding: '16px 32px',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.5)'
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.4)'
        }}
      >
        <span style={{ fontSize: 20 }}>+</span>
        Planejar Primeira Viagem
      </button>

      {/* Decorative dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 48, opacity: 0.3 }}>
        {['🏖️', '⛰️', '🏙️', '🌿', '🚢'].map((e, i) => (
          <span key={i} style={{ fontSize: 24 }}>{e}</span>
        ))}
      </div>
    </div>
  )
}
