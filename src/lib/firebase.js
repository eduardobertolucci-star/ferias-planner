import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB18NQH-YIwJniRSFxpzwdMdcyZxlInT98',
  authDomain: 'ferias-planner.firebaseapp.com',
  projectId: 'ferias-planner',
  storageBucket: 'ferias-planner.firebasestorage.app',
  messagingSenderId: '61506396491',
  appId: '1:61506396491:web:07e97cf1b3879e8a1dc8ce',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
