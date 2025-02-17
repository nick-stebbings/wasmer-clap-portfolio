import { useEffect, useRef } from 'preact/hooks'
// import './wasm/terminal.css'
import './app.css'
import { mountCLI } from './wasm/mount-cli';

export function App() {
  const container = useRef(null)

  const monitorElementClass = 'framer-14kpxdk';
  useEffect(() => {
    const existingTerminal = document.querySelector(`.${monitorElementClass}`);
    if (!existingTerminal) return;
    // Mount the WASM CLI app
    setTimeout(() => {
      mountCLI((existingTerminal || container.current) as HTMLElement).catch((error) => {
        console.error("Wasm CLI would not mount:", error);
      });
    }, 300);
  }, [])

  return (
    <div ref={container}>
        <div id="terminal"></div>

    </div>
  )
}
