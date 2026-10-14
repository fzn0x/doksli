import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/sofia-sans/wght.css'
import '@fontsource-variable/sofia-sans-extra-condensed/wght.css'
import './styles/app.css'
import './styles/cards.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
