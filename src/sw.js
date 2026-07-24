import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  // Selalu tampilkan sesuatu: kalau push sampai ke sini tapi datanya kosong
  // atau bukan JSON valid, jangan diam-diam gagal (itu bikin susah didiagnosis
  // & melanggar kontrak userVisibleOnly). Fallback ke teks mentah / default.
  let payload = {}
  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      payload = { title: 'KampusKu', body: event.data.text() }
    }
  }

  const { title, ...options } = payload

  event.waitUntil(
    self.registration
      .showNotification(title || 'KampusKu', {
        body: options.body || 'Notifikasi baru',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: options.tag,
        data: { url: options.url || '/' },
      })
      .catch((err) =>
        // Kalau showNotification sendiri gagal, tampilkan notifikasi darurat
        // supaya errornya kelihatan alih-alih hilang tanpa jejak.
        self.registration.showNotification('KampusKu', {
          body: `Push diterima tapi gagal ditampilkan: ${err?.message || err}`,
        }),
      ),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
