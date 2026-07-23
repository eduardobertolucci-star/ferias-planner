import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setLoading(false) })
  }, [])

  const signIn = () => signInWithPopup(auth, googleProvider)
  const signOut = () => firebaseSignOut(auth)

  return { user, loading, signIn, signOut }
}
