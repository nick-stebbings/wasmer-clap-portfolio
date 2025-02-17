import "@xterm/xterm/css/xterm.css";

import { Directory, type Instance } from "@wasmer/sdk";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import portfolioWasmUrl from "../../../project-cli/target/wasm32-wasip1/release/portfolio.wasm?url";

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
  const { Wasmer, init } = await import("@wasmer/sdk");
  await init();
  
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
    
  const term = new Terminal(TERM_SETTINGS);
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(container);
  fit.fit();
  term.writeln("Loading project CLI...");

  const pkg = await Wasmer.fromRegistry(TERM_PACKAGE);
  const portfolioWasmBinary = await fetch(portfolioWasmUrl)
    .then((response) => response.arrayBuffer())
    .then((buffer) => new Uint8Array(buffer));

  term.reset();
  const home = new Directory();
  await home.writeFile("projects.yaml", new TextEncoder().encode(projectsYaml));
  
  // Create a bin directory for our commands
  const bin = new Directory();

  await bin.writeFile("/projects-cli", portfolioWasmBinary);

  const instance = await pkg.entrypoint!.run({
    args: ["-c", "/usr/local/bin/projects-cli"],
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
  connectStreams(instance, term);
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