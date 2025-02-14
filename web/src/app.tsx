import { useEffect, useRef } from 'preact/hooks'
import './app.css'
import { mountCLI } from './wasm/mount-cli';

export function App() {
  const container = useRef(null)

  useEffect(() => {
    if (container.current == null) return;
    // Mount the WASM CLI app
    mountCLI(container.current).catch((error) => {
      console.error("Wasm CLI would not mount:", error);
    });
  }, [])

  return (
    <div ref={container}>

      <div id="terminal"></div>
    </div>
  )
}
