import { useEffect, useState } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

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

function useLocalTrips() {
  const [trips, setTrips] = useState(() => {
    try {
      const saved = localStorage.getItem('ferias_trips')
      return saved ? JSON.parse(saved) : SAMPLE_TRIPS
    } catch { return SAMPLE_TRIPS }
  })

  useEffect(() => {
    try { localStorage.setItem('ferias_trips', JSON.stringify(trips)) } catch {}
  }, [trips])

  return {
    trips,
    addTrip: (data) => setTrips(t => [...t, { ...data, id: Date.now() }]),
    updateTrip: (id, data) => setTrips(t => t.map(x => x.id === id ? { ...data, id } : x)),
    deleteTrip: (id) => setTrips(t => t.filter(x => x.id !== id)),
  }
}

function useCloudTrips(uid) {
  const [trips, setTrips] = useState([])

  useEffect(() => {
    if (!uid) return
    const ref = collection(db, 'users', uid, 'trips')
    return onSnapshot(ref, snap => {
      setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [uid])

  return {
    trips,
    addTrip: (data) => addDoc(collection(db, 'users', uid, 'trips'), data),
    updateTrip: (id, data) => updateDoc(doc(db, 'users', uid, 'trips', String(id)), data),
    deleteTrip: (id) => deleteDoc(doc(db, 'users', uid, 'trips', String(id))),
  }
}

export function useTrips(user) {
  const local = useLocalTrips()
  const cloud = useCloudTrips(user?.uid)
  return user ? cloud : local
}
