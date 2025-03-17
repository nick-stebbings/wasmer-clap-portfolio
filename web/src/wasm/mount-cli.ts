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

let wasmerInitialized = false;

class TerminalSingleton {
  terminal?: typeof Terminal.prototype | null;
  static instance: TerminalSingleton;

  constructor() {
      if (!TerminalSingleton.instance) {
          this.terminal = null;
          TerminalSingleton.instance = this;
      }
      return TerminalSingleton.instance;
  }

  getInstance() {
      if (!this.terminal) {
          this.terminal = new Terminal(); // Replace with your terminal initialization
      }
      return this.terminal;
  }

  open(containerId: string) {
      if (this.terminal) {
          this.terminal.open(document.getElementById(containerId) as HTMLElement);
      }
  }
}

const instance = new TerminalSingleton();
Object.freeze(instance);

export async function mountCLI(
  container: HTMLElement,
  scrollToFrontend: () => void
) {
  // Write projects.yaml to home directory (needed for local)
  const projectsYaml = `
  item2_projects:
    - name: "FrontEnd stub"
      description: "FrontEnd stub"
      technologies: ["FrontEnd stub"]
      github_url: "https://github.com/user/FrontEnd"
      highlights: 
        - "Stub Client"
  
  item1_projects:
    - name: "Node APIs"
      description: "I've contributed multiple times to RESTful APIs using JS / TypeScript that were deployed to production applications."
      technologies: ["Express.js", "Node.js", "Bun", "Caprover", "Docker"]
      highlights: 
        - "Inkibra Ltd. (Freelance)"
        - "Whites Powersports AU/NZ (at Y5 Labs)"
  
    - name: "Rust peer-to-peer APIs"
      description: "Writing and unit testing Holochain dApp endpoints"
      technologies: ["Rust", "Holochain", "Tryorama (testing)"]
      github_url: "https://github.com/HabFract/planitt/tree/main/tests"
      highlights: 
        - "Neighbourhoods"
        - "zkCATS"
        - "Planitt (Side Project)"
  
    - name: "Ruby APIs"
      description: "Writing a RESTful API for personal habit data"
      technologies: ["Sinatra", "dry-rb", "Rack frameworks"]
      github_url: "https://github.com/nick-stebbings/fractal-habit-pyramid-sinatraAPI"
      highlights: 
        - "Habit/Fract v1 (Side Project)"
  
    - name: "Zero Knowledge Proofs"
      description: "Studying Rust implementations of ZKPs"
      technologies: ["ZKP", "artworks-rs", "Elliptic curve cryptography", "Blockchain L2 Rollups"]
      github_url: "https://github.com/nick-stebbings/zkCATS"
      highlights: 
        - "None.. yet ;)"
  
  item3_projects:
    - name: "FrontEnd stub"
      description: "FrontEnd stub"
      technologies: ["FrontEnd stub"]
      github_url: "https://github.com/user/FrontEnd"
      highlights: 
        - "Stub Client"
  
  item4_projects:
    - name: "FrontEnd stub"
      description: "FrontEnd stub"
      technologies: ["FrontEnd stub"]
      github_url: "https://github.com/user/FrontEnd"
      highlights: 
        - "Stub Client"
  `;
  if (!container) return;

  const term = new Terminal(TERM_SETTINGS);
  const fit = new FitAddon();
  term.writeln("Welcome to my portfolio command line!");
  term.attachCustomWheelEventHandler((_ev: WheelEvent) => false);

  // Initialize terminal first
  term.loadAddon(fit);
  term.open(container);
  fit.fit();

  let cleanup: (() => void) | null = null;
  let wasmerInstance: Instance | undefined;

  if (!wasmerInitialized) {
    try {
      const { init } = await import("@wasmer/sdk");
      await init();
      wasmerInitialized = true;
    } catch (e) {
      console.error("Wasmer init failed:", e);
      term.writeln(`\x1b[31mFailed to initialize Wasmer: ${e.message}\x1b[0m`);
      return;
    }
  }
  try {
    term.writeln("Loading...");
    const { Wasmer } = await import("@wasmer/sdk");
    const pkg = await Wasmer.fromRegistry(TERM_PACKAGE);
    if (!pkg) throw new Error("Failed to load bash package");

    const portfolioWasmBinary = await fetch(portfolioWasmUrl, {
      headers: {
        Accept: "application/wasm",
        "Content-Type": "application/wasm",
      },
    }).then(r => {
      if (!r.ok) throw new Error(`Failed to fetch WASM: ${r.status}`);
      return r.arrayBuffer();
    }).then(buffer => new Uint8Array(buffer));

    const home = new Directory();
    const bin = new Directory();
    
    await Promise.all([
      home.writeFile("projects.yaml", new TextEncoder().encode(projectsYaml)),
      bin.writeFile("projects", portfolioWasmBinary),
    ]);

    wasmerInstance = await pkg.entrypoint?.run({
      args: ["-c", "/usr/local/bin/projects"],
      uses: [],
      mount: {
        "/home": home,
        "/usr/local/bin": bin,
      },
      cwd: "/home",
      env: {
        TERM: "xterm-256color",
        HOME: "/home",
        PATH: "/usr/local/bin:/usr/bin:/bin",
        PS1: "Guest> ",
      },
    });

    if (!wasmerInstance) throw new Error("Failed to create WASM instance");

    cleanup = connectStreams(wasmerInstance, term);

    return () => {
      try {
        if (cleanup) {
          cleanup();
          cleanup = null;
        }
        if (wasmerInstance) {
          wasmerInstance = undefined;
        }
        term.dispose();
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    };
  } catch (error) {
    console.error("CLI mount error:", error);
    //@ts-expect-error
    term.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
  }

  /**
   * Connects terminal streams to the Wasmer instance
   */
  function connectStreams(instance: Instance, term: Terminal) : () => void {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Create a single writer and keep it alive
    const stdinWriter = instance.stdin?.getWriter();
    let isDisposed = false;
  
    const dataDisposable = term.onData((data: string) => {
      if (!isDisposed && stdinWriter) {
        try {
          stdinWriter.write(encoder.encode(data));
        } catch (e) {
          console.error('Write error:', e);
        }
      }
    });
  
    // Create persistent stream handlers
    let stdoutController: AbortController | null = new AbortController();
    let stderrController: AbortController | null = new AbortController();
  
    // Handle stdout with abort signal
    (async () => {
      try {
        while (!isDisposed) {
          const reader = instance.stdout.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done || isDisposed) break;
              
              const text = decoder.decode(value);
              if (text.includes("\x1B]1337;Custom=1\x07")) {
                scrollToFrontend();
                continue;
              }
              term.write(value);
            }
          } finally {
            reader.releaseLock();
          }
        }
      } catch (e) {
        console.error('Stdout error:', e);
      }
    })();
  
    // Handle stderr with abort signal
    (async () => {
      try {
        while (!isDisposed) {
          const reader = instance.stderr.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done || isDisposed) break;
              term.write(value);
            }
          } finally {
            reader.releaseLock();
          }
        }
      } catch (e) {
        console.error('Stderr error:', e);
      }
    })();
  
    return () => {
      isDisposed = true;
      dataDisposable.dispose();
      
      if (stdinWriter) {
        try {
          stdinWriter.releaseLock();
        } catch (e) {
          console.error('Stdin cleanup error:', e);
        }
      }
  
      if (stdoutController) {
        stdoutController.abort();
        stdoutController = null;
      }
  
      if (stderrController) {
        stderrController.abort();
        stderrController = null;
      }
    };
  }
}
