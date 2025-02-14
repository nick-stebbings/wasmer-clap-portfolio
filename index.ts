import "@xterm/xterm/css/xterm.css";

import { Directory, type Instance } from "@wasmer/sdk";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
//@ts-expect-error
import portfolioWasmUrl from "/project-cli/target/wasm32-wasip1/release/portfolio.wasm?url";

const TERM_SETTINGS = {
  cursorBlink: true,
  convertEol: true,
  rows: 24,
  cols: 80,
  fontFamily: 'MesloLGS NF, Menlo, Monaco, "Courier New", monospace',
  fontSize: 14,
};
const TERM_PACKAGE = "sharrattj/bash";

async function main() {
  const { Wasmer, init, initializeLogger } = await import("@wasmer/sdk");

  await init();
  // initializeLogger("debug");

  const term = new Terminal(TERM_SETTINGS);
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById("terminal")!);
  fit.fit();
  term.writeln("Loading project CLI...");

  const pkg = await Wasmer.fromRegistry(TERM_PACKAGE);
  const portfolioWasmBinary = await fetch(portfolioWasmUrl)
    .then((response) => response.arrayBuffer())
    .then((buffer) => new Uint8Array(buffer));

  term.reset();
  const home = new Directory();

  // Create a bin directory for our commands
  const bin = new Directory();

  await bin.writeFile("/show", portfolioWasmBinary);

  const instance = await pkg.entrypoint!.run({
    args: [],
    uses: [],
    mount: { "/home": home, "/usr/local/bin": bin },
    cwd: "/home",
    env: {
      TERM: "xterm-256color",
      HOME: "/home",
      PATH: "/usr/local/bin:/usr/bin:/bin",
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

// Start the application
main().catch((error) => {
  console.error("Application failed to start:", error);
});
