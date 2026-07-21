import { useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Modal from './Modal'

export default function QuickCaptureButton() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function close() {
    setOpen(false)
    setContent('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return

    setBusy(true)
    setError('')
    const { error } = await supabase.from('inbox_items').insert({ content: content.trim() })
    setBusy(false)

    if (error) {
      setError(error.message)
      return
    }
    close()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Catat cepat"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:bottom-6 md:right-6"
      >
        <Plus size={26} />
      </button>

      {open && (
        <Modal title="Catat Cepat" onClose={close}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis apa saja... (Enter untuk simpan)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy || !content.trim()}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Menyimpan...' : 'Simpan ke Inbox'}
            </button>
            <p className="text-xs text-gray-400">
              Nanti dipilah jadi tugas / event / kebiasaan di halaman Inbox.
            </p>
          </form>
        </Modal>
      )}
    </>
  )
}
