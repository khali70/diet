import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncData<T> {
  readonly data: T | null
  readonly reload: () => Promise<void>
}

/**
 * Loads data from a use case and keeps it in view state.
 *
 * This is the single place in the presentation layer that starts an async load
 * from an effect. State is set only after the promise resolves, and only while
 * the component is still mounted, which is the subscribe-and-update shape that
 * effects exist for. The lint suppressions are scoped to this one hook so no
 * screen has to carry its own.
 */
export const useAsyncData = <T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncData<T> => {
  const [data, setData] = useState<T | null>(null)
  const loadRef = useRef(load)

  useEffect(() => {
    loadRef.current = load
  })

  const reload = useCallback(async () => {
    setData(await loadRef.current())
  }, [])

  useEffect(
    () => {
      let cancelled = false

      void loadRef.current().then((value) => {
        if (!cancelled) setData(value)
      })

      return () => {
        cancelled = true
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  )

  return { data, reload }
}
