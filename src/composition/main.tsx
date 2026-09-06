import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { createContainer } from './container'
import { App } from '../presentation/app'
import { UseCasesProvider } from '../presentation/hooks/use-cases'
import { applyDocumentLocale, initI18n } from '../presentation/i18n'
import '../styles.css'

/**
 * Entry point. Hash routing is used deliberately: GitHub Pages serves static
 * files only, and a hash route can never 404 on a deep link or a reload.
 */
const start = async () => {
  const root = document.getElementById('root')
  if (root === null) throw new Error('root element is missing')

  const container = await createContainer()
  const settings = await container.settings.get()

  initI18n(settings.locale)
  applyDocumentLocale(settings.locale)

  createRoot(root).render(
    <StrictMode>
      <UseCasesProvider value={container}>
        <HashRouter>
          <App />
        </HashRouter>
      </UseCasesProvider>
    </StrictMode>,
  )
}

void start()
