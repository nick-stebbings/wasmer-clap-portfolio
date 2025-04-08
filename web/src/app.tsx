import { useEffect, useRef } from 'preact/hooks'
import './app.css'
import { mountCLI } from './wasm/mount-cli';

if (import.meta.env.PROD) console.log = console.warn = console.error = () => {};

export function App() {
  const container = useRef(null);
  const monitorElementClass = 'framer-14kpxdk';
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = false;

    const checkAndMountCLI = async () => {
      const existingTerminal = document.querySelector(`.${monitorElementClass}`);
      if (!existingTerminal || mounted) return;

      try {
        mounted = true;
        await mountCLI(existingTerminal as HTMLElement, () => {
          window.location.hash = 'work';
        });
      } catch (error) {
        console.error("Wasm CLI mount error:", error);
        mounted = false;
      }
    };

    const intervalId = setInterval(checkAndMountCLI, 500);

    return () => {
      clearInterval(intervalId);
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
          cleanupRef.current = null;
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
    };
  }, []);

  return (
    <div ref={container}>
        <div id="terminal"></div>

    </div>
  )
}
