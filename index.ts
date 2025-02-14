import "@xterm/xterm/css/xterm.css";

import { Directory, type Instance } from "@wasmer/sdk";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

const encoder = new TextEncoder();
const params = new URLSearchParams(window.location.search);

const packageName = "sharrattj/bash";
const uses = ["wasmer/neatvi"];
const args = params.getAll("arg").length > 0 ? params.getAll("arg") : [];

async function main() {
  const { Wasmer, init, initializeLogger } = await import("@wasmer/sdk");

  await init();
  initializeLogger("debug");

  const term = new Terminal({ cursorBlink: true, convertEol: true });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById("terminal")!);
  fit.fit();

  term.writeln("Starting...");
  const pkg = await Wasmer.fromRegistry(packageName);
  term.reset();
  const home = new Directory();

  const instance = await pkg.entrypoint!.run({
    args,
    uses,
    mount: { "/home": home },
    cwd: "/home",
    env: {
      TERM: "xterm-256color",
      HOME: "/home",
      PATH: "/usr/local/bin:/usr/bin:/bin",
    },
  });
  connectStreams(instance, term);
}

function connectStreams(instance: Instance, term: Terminal) {
  const stdin = instance.stdin?.getWriter();
  term.onData((data) => stdin?.write(encoder.encode(data)));
  instance.stdout.pipeTo(
    new WritableStream({ write: (chunk) => term.write(chunk) })
  );
  instance.stderr.pipeTo(
    new WritableStream({ write: (chunk) => term.write(chunk) })
  );
}

main();
