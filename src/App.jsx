import { useState } from 'react'
import './index.css'
import PlanningScreen from './screens/PlanningScreen'
import TripScreen from './screens/TripScreen'

export default function App() {
  const [screen, setScreen] = useState('planning')
  const [activeTrip, setActiveTrip] = useState(null)

  const handleStartTrip = (trip) => {
    setActiveTrip(trip)
    setScreen('trip')
  }

  const handleBackToPlanning = () => {
    setScreen('planning')
    setActiveTrip(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #1e40af 100%)' }}>
      {screen === 'planning' && (
        <PlanningScreen onStartTrip={handleStartTrip} />
      )}
      {screen === 'trip' && (
        <TripScreen trip={activeTrip} onBack={handleBackToPlanning} />
      )}
    </div>
  )
}
