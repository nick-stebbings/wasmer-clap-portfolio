# Wasmer-Hosted Rust CLI - Portfolio Website

A unique portfolio website that showcases a Rust CLI application running directly in the browser. Built using Clap, in Rust, compiled for a WASI target, and executed by the `sharrattj/bash` x-term WASI module. This project demonstrates how to bring native CLI experiences to the web.

![portfolio](https://github.com/user-attachments/assets/7a56a401-eaa9-4d5c-b729-419834977834)


## 🚀 Features
- Interactive CLI interface in the browser
- Native Rust Clap CLI compiled for browser execution
- Command-line style navigation through portfolio sections
- Modern, minimalist web integration with Preact

## 🛠️ Tech Stack

- **CLI**:
  - Rust
  - [clap](https://github.com/clap-rs/clap) for CLI argument parsing
  - WASI target compilation
  
- **Web Integration**:
  - Preact to wrap the generated Framer html
  - Wasmer SDK used as the WASM host.
  - `sharrattj/bash` x-term module which executes the CLI binary

I run format and Clippy checks before each commit using the shell script at `/project-cli/scripts/check.sh`/

Here is a diagram showing the architecture of the app:

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer"]
        subgraph UI["UI Layer"]
            P[Preact App] --"wraps"-->  F[Framer Static Site]
        end
        
        UI --"implements"--> Runtime
        Runtime --"mounts onto"--> UI
        
        subgraph Runtime["Wasmer SDK + @xterm JS"]
            subgraph Shell["Terminal Layer"]
                B["
                <code>sharrattj/bash</code> <span>WASI</span>"] --"executes"--> M[Portfolio CLI WASI Module]
            end
        end
    end

    subgraph WASM["WebAssembly Layer"]
        R["Rust Clap CLI compiled for
        <code>wasm32-wasip1</code>
        "] --> M
    end

    subgraph Data["Data Layer"]
        Y[projects.yaml] --> C[<code>ProjectConfig</code>]
        C --> R
    end

    style Frontend fill:#2a3950,stroke:#4a5d78,stroke-width:2px,color:#fff
    style UI fill:#243245,stroke:#4a5d78,stroke-width:2px,color:#fff
    style Runtime fill:#1e2835,stroke:#4a5d78,stroke-width:2px,color:#fff
    style Shell fill:#182230,stroke:#4a5d78,stroke-width:2px,color:#fff
    style WASM fill:#1a2535,stroke:#4a5d78,stroke-width:2px,color:#fff
    style Data fill:#152030,stroke:#4a5d78,stroke-width:2px,color:#fff
    style B fill:#182230,stroke:#4a5d78,stroke-width:2px,color:#88a3c7
    style R fill:#1a2535,stroke:#4a5d78,stroke-width:2px,color:#fff
```
