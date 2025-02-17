import "@xterm/xterm/css/xterm.css";

import { Directory, type Instance } from "@wasmer/sdk";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import portfolioWasmUrl from "/portfolio.wasm?url";

const TERM_SETTINGS = {
  cursorBlink: true,
  convertEol: true,
  rows: 24,
  cols: 80,
  fontFamily: 'MesloLGS NF, Menlo, Monaco, "Courier New", monospace',
  fontSize: 14,
};
const TERM_PACKAGE = "sharrattj/bash";

export async function mountCLI(container: HTMLElement) {
  // Write projects.yaml to home directory
  const projectsYaml = `
    item1_projects:
      - name: "Rust Game Engine"
        description: "A high-performance 2D game engine written in Rust"
        technologies: ["Rust", "OpenGL", "WGPU", "ECS"]
        github_url: "https://github.com/user/rust-engine"
        live_url: "https://rust-engine.dev"
        highlights: 
          - "60+ FPS performance"
          - "Cross-platform support"
          - "Modern shader pipeline"
    item2_projects:
      - name: "Another thing"
        description: "A high-performance 2D game engine written in Rust"
        technologies: ["Rust", "OpenGL", "WGPU", "ECS"]
        github_url: "https://github.com/user/rust-engine"
        live_url: "https://rust-engine.dev"
        highlights: 
          - "60+ FPS performance"
          - "Cross-platform support"
          - "Modern shader pipeline"
    item3_projects:
      - name: "yet Another thing"
        description: "A high-performance 2D game engine written in Rust"
        technologies: ["Rust", "OpenGL", "WGPU", "ECS"]
        github_url: "https://github.com/user/rust-engine"
        live_url: "https://rust-engine.dev"
        highlights: 
          - "60+ FPS performance"
          - "Cross-platform support"
          - "Modern shader pipeline"
    `;
    if (!container) return;
  
    const term = new Terminal(TERM_SETTINGS);
    const fit = new FitAddon();
    term.writeln("Welcome to my portfolio CLI!");
    
    try {
      const { Wasmer, init, initializeLogger } = await import("@wasmer/sdk");
      term.writeln("Loading...");
      await init().catch(e => {
        console.error("Wasmer init failed:", e);
        return;
      });
      initializeLogger('warn');
      term.loadAddon(fit);
      term.open(container);
      fit.fit();
      
      const pkg = await Wasmer.fromRegistry(TERM_PACKAGE).catch(e => {
        throw new Error(`Failed to load bash package: ${e.message}`);
      });
  
      const portfolioWasmBinary = await fetch(portfolioWasmUrl, {
        headers: { 
          'Accept': 'application/wasm',
          'Content-Type': 'application/wasm'
        }
      }).then(async r => {
        if (!r.ok) {
          console.error('WASM fetch response:', r);
          throw new Error(`Failed to fetch WASM: ${r.status}`);
        }
        return new Uint8Array(await r.arrayBuffer());
      }).catch(e => {
        console.error('WASM fetch error:', e);
        throw e;
      });
  
      const home = new Directory();
      const bin = new Directory();
      try {
        await Promise.all([
          home.writeFile("projects.yaml", new TextEncoder().encode(projectsYaml)),
          bin.writeFile("projects", portfolioWasmBinary)
        ]);      
      } catch (e) {
        console.error('Bash write error:', e);
        throw e;
      }
      const instance = await pkg.entrypoint?.run({
        args: ["-c", "/usr/local/bin/projects"],
        uses: [],
        mount: { 
          "/home": home, 
          "/usr/local/bin": bin 
        },
        cwd: "/home",
        env: {
          TERM: "xterm-256color",
          HOME: "/home",
          PATH: "/usr/local/bin:/usr/bin:/bin",
          PS1: "Guest> ",
        },
      });
  
      if (!instance) throw new Error("Failed to create WASM instance");
      connectStreams(instance, term);
  
    } catch (error) {
      console.error("CLI mount error:", error);
      //@ts-expect-error
      term.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
    }
}

/**
 * Connects terminal streams to the Wasmer instance
 */
function connectStreams(instance: Instance, term: Terminal): void {
  const encoder = new TextEncoder();
  const stdin = instance.stdin?.getWriter();

  term.onData((data) => stdin?.write(encoder.encode(data)));

  instance.stdout.pipeTo(
    new WritableStream({ write: (chunk) => term.write(chunk) })
  );

  instance.stderr.pipeTo(
    new WritableStream({ write: (chunk) => term.write(chunk) })
  );
}
