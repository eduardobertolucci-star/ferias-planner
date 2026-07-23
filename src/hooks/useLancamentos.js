import { useEffect, useState } from 'react'
import {
  collection, doc, addDoc, deleteDoc, onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

function useLocalLancamentos(tripId) {
  const key = `trip_${tripId}_lancamentos`
  const [lancamentos, setLancamentos] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(lancamentos)) } catch {}
  }, [key, lancamentos])

  return {
    lancamentos,
    addLancamento: (data) => setLancamentos(l => [{ ...data, id: Date.now() }, ...l]),
    deleteLancamento: (id) => setLancamentos(l => l.filter(x => x.id !== id)),
  }
}

function useCloudLancamentos(uid, tripId) {
  const [lancamentos, setLancamentos] = useState([])

  useEffect(() => {
    if (!uid) return
    const ref = collection(db, 'users', uid, 'trips', String(tripId), 'lancamentos')
    return onSnapshot(ref, snap => {
      setLancamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [uid, tripId])

  return {
    lancamentos,
    addLancamento: (data) => addDoc(collection(db, 'users', uid, 'trips', String(tripId), 'lancamentos'), data),
    deleteLancamento: (id) => deleteDoc(doc(db, 'users', uid, 'trips', String(tripId), 'lancamentos', String(id))),
  }
}

export function useLancamentos(user, tripId) {
  const local = useLocalLancamentos(tripId)
  const cloud = useCloudLancamentos(user?.uid, tripId)
  return user ? cloud : local
}
