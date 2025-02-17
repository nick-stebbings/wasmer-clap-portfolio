import './app.css'
import { useEffect } from 'preact/hooks'
import { mountCLI } from './wasm/mount-cli';

const MONITOR_ELEMENT_CLASS = 'framer-14kpxdk';

export function App() {
  useEffect(() => {
    const existingTerminal = document.querySelector(`.${MONITOR_ELEMENT_CLASS}`);
    if (!existingTerminal) return;
    // Mount the WASM CLI app
    setTimeout(() => {
      mountCLI((existingTerminal) as HTMLElement).catch((error) => {
        console.error("Wasm CLI would not mount:", error);
      });
    }, 300);
  }, [])

  return (
    <div id="terminal"></div>
  )
}
