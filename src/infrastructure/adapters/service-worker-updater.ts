import type { AppUpdater } from '@/domain/ports/app-updater'

/**
 * Drops the cached build and reloads.
 *
 * Only the caches API and the service worker registration are touched. Nothing
 * here goes near IndexedDB, so the user's log survives.
 */
export class ServiceWorkerUpdater implements AppUpdater {
  async refresh(): Promise<void> {
    if ('caches' in globalThis) {
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }

    // A plain reload can still be served by the page that is already running,
    // so replace the entry instead of asking the current document to refresh.
    window.location.replace(window.location.href)
  }
}
