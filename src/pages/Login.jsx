import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/
const EMAIL_HOST = new URL(import.meta.env.VITE_SUPABASE_URL).hostname

function usernameToEmail(username) {
  return `${username.toLowerCase()}@${EMAIL_HOST}`
}

function friendlyError(message) {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Username atau password salah.'
  if (m.includes('already registered')) return 'Username sudah dipakai, coba yang lain.'
  return message
}

export default function Login() {
  const { session } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'daftar'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) {
    return <Navigate to="/" replace />
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'daftar' : 'login'))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!USERNAME_PATTERN.test(username)) {
      setError('Username 3-20 karakter: huruf, angka, underscore, diawali huruf.')
      return
    }

    setBusy(true)
    const email = usernameToEmail(username)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) setError(friendlyError(error.message))
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    setBusy(false)

    if (error) {
      setError(friendlyError(error.message))
      return
    }

    if (!data.session) {
      setError(
        'Akun dibuat, tapi Supabase masih meminta konfirmasi email. Matikan "Confirm email" di dashboard Supabase (Authentication → Providers → Email), lalu daftar ulang.',
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-gray-800">KampusKu</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          {mode === 'login' ? 'Masuk ke akunmu' : 'Buat akun baru'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cth: ahmadmufti"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {mode === 'daftar' && (
              <p className="mt-1 text-xs text-gray-400">
                3-20 karakter: huruf, angka, underscore. Diawali huruf.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="font-medium text-blue-600 hover:underline"
          >
            {mode === 'login' ? 'Daftar' : 'Masuk'}
          </button>
        </p>
      </div>
    </div>
  )
}
