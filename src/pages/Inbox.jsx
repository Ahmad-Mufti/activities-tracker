import InboxList from '../components/InboxList'

export default function Inbox() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Inbox</h1>
      <p className="mt-1 text-sm text-gray-500">
        Catatan cepat yang belum dipilah. Pilah tiap item jadi tugas, event, atau kebiasaan — atau hapus.
      </p>

      <div className="mt-4">
        <InboxList />
      </div>
    </div>
  )
}
