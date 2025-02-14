// src/main.rs
use clap::{Parser, Subcommand};
mod project;

#[derive(Parser)]
#[command(name = "portfolio")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    #[command(about = "List projects")]
    Projects,
    
    #[command(about = "Show project details")]
    Show { 
        #[arg(short, long)]
        name: String 
    },
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Projects => {
            println!("My Projects:");
            println!("1. Portfolio CLI");
            println!("2. WASM Terminal");
        }
        Commands::Show { name } => {
            println!("Project: {}", name);
            println!("Description: A CLI tool for viewing portfolio projects");
            println!("Tech: Rust, WASM, xterm.js");
        }
    }
    
    Ok(())
}
