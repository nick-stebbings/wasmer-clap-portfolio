import "@xterm/xterm/css/xterm.css";
import { Directory, Instance } from "@wasmer/sdk";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

const WASM_URL = 'https://nick-stebbings-portfolio-assets.b-cdn.net/portfolio.wasm';

const TERM_SETTINGS = {
  cursorBlink: true,
  convertEol: true,
  rows: window.innerWidth < 768 ? 16 : 24,
  cols: window.innerWidth < 768 ? 40 : 80,
  fontFamily: 'MesloLGS NF, Menlo, Monaco, "Courier New", monospace',
  fontSize: window.innerWidth < 768 ? 12 : 14,
  scrollback: 1000,
};

const TERM_PACKAGE = "sharrattj/bash";

const PROJECTS_YAML = `
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

  export async function mountCLI(container: HTMLElement, onFrontendSelect?: () => void) {
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

    if (window.innerWidth < 768) {
      term.resize(TERM_SETTINGS.cols, TERM_SETTINGS.rows);
    }
    
    const pkg = await Wasmer.fromRegistry(TERM_PACKAGE);
    const portfolioWasmBinary = await fetch(WASM_URL, {
      method: 'GET',
      headers: { 
        'Accept': 'application/wasm',
        'Content-Type': 'application/wasm',
      }
    }).then(async r => new Uint8Array(await r.arrayBuffer()));

    const home = new Directory();
    const bin = new Directory();
    await Promise.all([
      home.writeFile("projects.yaml", new TextEncoder().encode(PROJECTS_YAML)),
      bin.writeFile("projects", portfolioWasmBinary)
    ]);      

    const instance = await pkg.entrypoint?.run({
      args: ["-c", "/usr/local/bin/projects"],
      uses: [],
      mount: { "/home": home, "/usr/local/bin": bin },
      cwd: "/home",
      env: {
        TERM: "xterm-256color",
        HOME: "/home",
        PATH: "/usr/local/bin:/usr/bin:/bin",
        PS1: "Guest> ",
      },
    });

    if (!instance) throw new Error("Failed to create WASM instance");
    term.onKey(({ key }) => {
      if (!!onFrontendSelect && key === '0') {
        onFrontendSelect()
        term.clear();
        term.write("\x1B[!p"); // Soft reset
        term.writeln("Welcome to my portfolio CLI!");
      }
    });

    connectStreams(instance, term);

    instance.stdout.pipeTo(new WritableStream({ 
      write: (chunk) => term.write(chunk) 
    }));
    instance.stderr.pipeTo(new WritableStream({ 
      write: (chunk) => term.write(chunk) 
    }));
  } catch (error) {
    console.error("CLI mount error:", error);
    term.writeln(`\x1b[31mError: ${(error as Error).message}\x1b[0m`);
  }
}

function connectStreams(instance: Instance, term: Terminal): void {
  const encoder = new TextEncoder();
  const stdin = instance.stdin?.getWriter();
  term.onData((data) => stdin?.write(encoder.encode(data)));
  instance.stdout.pipeTo(new WritableStream({ write: (chunk) => term.write(chunk) }));
  instance.stderr.pipeTo(new WritableStream({ write: (chunk) => term.write(chunk) }));
}