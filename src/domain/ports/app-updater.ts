/**
 * Replaces the running code with whatever is deployed.
 *
 * A service worker keeps the app working offline, which also means an old
 * build can stay pinned in the browser after a deploy. This is the escape
 * hatch. It touches code only: logged meals and settings live in IndexedDB and
 * are never cleared by it.
 */
export interface AppUpdater {
  refresh(): Promise<void>
}
