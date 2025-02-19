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
      mountCLI(existingTerminal as HTMLElement, () => (window.location.hash = 'work') ).then(() => {
        // Focus after CLI is mounted
        const viewport = existingTerminal.querySelector('.xterm-viewport') as HTMLElement;
        if (viewport) {
          viewport.click();
          const terminalElement = existingTerminal.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement;
          if (terminalElement) {
            terminalElement.focus();
          }
        }
      }).catch((error) => {
        console.error("Wasm CLI would not mount:", error);
      });
    }, 3000);
  }, [])

  return (
    <div ref={container}>
        <div id="terminal"></div>

    </div>
  )
}
