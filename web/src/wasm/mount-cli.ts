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
      github_url: "https://github.com/nick-stebbings/zkp"
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
  if(!container) return;

  const term = new Terminal(TERM_SETTINGS);
  const fit = new FitAddon();
  term.writeln("Welcome to my portfolio CLI!");
  term.attachCustomWheelEventHandler((_ev: WheelEvent) => false);
  try {
    const { Wasmer, init, initializeLogger } = await import("@wasmer/sdk");
    term.writeln("Loading...");
    await init().catch((e) => {
      console.error("Wasmer init failed:", e);
      return;
    });
    initializeLogger("warn");
    term.loadAddon(fit);
    term.open(container);
    fit.fit();

    const pkg = await Wasmer.fromRegistry(TERM_PACKAGE).catch((e) => {
      throw new Error(`Failed to load bash package: ${e.message}`);
    });

    const portfolioWasmBinary = await fetch(portfolioWasmUrl, {
      headers: {
        Accept: "application/wasm",
        "Content-Type": "application/wasm",
      },
    })
      .then(async (r) => {
        if (!r.ok) {
          console.error("WASM fetch response:", r);
          throw new Error(`Failed to fetch WASM: ${r.status}`);
        }
        return new Uint8Array(await r.arrayBuffer());
      })
      .catch((e) => {
        console.error("WASM fetch error:", e);
        throw e;
      });

    const home = new Directory();
    const bin = new Directory();
    try {
      await Promise.all([
        home.writeFile("projects.yaml", new TextEncoder().encode(projectsYaml)),
        bin.writeFile("projects", portfolioWasmBinary),
      ]);
    } catch (e) {
      console.error("Bash write error:", e);
      throw e;
    }
    const instance = await pkg.entrypoint?.run({
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

    if (!instance) throw new Error("Failed to create WASM instance");
    connectStreams(instance, term);
  } catch (error) {
    console.error("CLI mount error:", error);
    //@ts-expect-error
    term.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
  }

  /**
   * Connects terminal streams to the Wasmer instance
   */
  function connectStreams(instance: Instance, term: Terminal): void {
    const encoder = new TextEncoder();
    const stdin = instance.stdin?.getWriter();

    term.onData((data) => stdin?.write(encoder.encode(data)));

    const decoder = new TextDecoder();

    instance.stdout.pipeTo(
      new WritableStream({
        write(chunk) {
          const text = decoder.decode(chunk);
          // Check for our special escape sequence
          if (text.includes("\x1B]1337;Custom=1\x07")) {
            scrollToFrontend();
            return;
          }

          term.write(chunk);
        },
      })
    );

    instance.stderr.pipeTo(
      new WritableStream({ write: (chunk) => term.write(chunk) })
    );
  }
}
