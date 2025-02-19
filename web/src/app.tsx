import { useEffect, useRef, useState } from 'preact/hooks'
import './app.css'
import { mountCLI } from './wasm/mount-cli';

if (import.meta.env.PROD) console.log = console.warn = console.error = () => {};

export function App() {
  const container = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const monitorElementClass = 'framer-14kpxdk';

  useEffect(() => {
    let intervalId;
    const checkAndMountCLI = () => {
      const existingTerminal = document.querySelector(`.${monitorElementClass}`);
      if (!existingTerminal || isMounted) return;

      mountCLI(existingTerminal as HTMLElement, () => {
        window.location.hash = 'work';
      })
      .then(() => {
        const viewport = existingTerminal.querySelector('.xterm-viewport') as HTMLElement;
        if (viewport) {
          viewport.click();
          const terminalElement = existingTerminal.querySelector('.xterm-helper-textarea') as HTMLElement;
          if (terminalElement) {
            terminalElement.focus();
          }
        }
        setIsMounted(true);
      })
      .catch((error) => {
        console.error("Wasm CLI would not mount:", error);
        setIsMounted(true);
      });
    };

    intervalId = setInterval(checkAndMountCLI, 500);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [isMounted]);

  return (
    <div ref={container}>
        <div id="terminal"></div>

    </div>
  )
}
