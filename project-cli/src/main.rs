use clap::Parser;
use colored::*;
use config::config;
use std::{
    fmt::Display,
    io::{self, Read, Write},
};
mod config;
mod project;

#[derive(Parser)]
struct Cli {
    #[arg(default_value = "menu")]
    command: String,
}

struct MenuList {
    title: String,
    items: Vec<MenuItem>,
    prompt: &'static str,
}

struct MenuItem {
    number: char,
    text: String,
}

impl Display for MenuList {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "{}\n", format!("=== {} ===", self.title).cyan().bold())?;
        for item in &self.items {
            writeln!(f, "{} {}", item.number.to_string().cyan(), item.text)?;
        }
        writeln!(f, "\n{}", self.prompt.dimmed())?;
        Ok(())
    }
}

fn main() {
    enable_raw_mode();

    let cli = Cli::parse();
    match cli.command.as_str() {
        "menu" => show_menu(),
        "1" | "2" | "3" | "4" => show_projects(cli.command.parse().unwrap_or(1)),
        _ => show_menu(),
    }

    cleanup();
    disable_raw_mode();
}
fn enable_raw_mode() {
    print!("\x1B[?1049h"); // Use alternate screen buffer
    print!("\x1B[2J"); // Clear screen
    print!("\x1B[H"); // Move cursor to home position
    io::stdout().flush().unwrap();

    let _ = std::process::Command::new("stty")
        .arg("raw")
        .arg("-echo")
        .spawn();
}

fn disable_raw_mode() {
    print!("\x1B[?1049l"); // Restore main screen buffer
    io::stdout().flush().unwrap();

    let _ = std::process::Command::new("stty")
        .arg("-raw")
        .arg("echo")
        .spawn();
}

fn clear_screen() {
    print!("\x1B[2J"); // Clear screen
    print!("\x1B[H"); // Move cursor to home position
    io::stdout().flush().unwrap();
}

fn get_single_char() -> char {
    let mut buffer = [0u8; 1];
    io::stdin().read_exact(&mut buffer).unwrap_or(());
    buffer[0] as char
}

fn cleanup() {
    print!("\x1B[?47l"); // Restore screen
    io::stdout().flush().unwrap();
}

fn quit() -> ! {
    println!("\nGoodbye!");
    std::process::exit(0);
}

fn show_menu() {
    clear_screen();

    let menu = MenuList {
        title: "Portfolio Projects".into(),
        items: vec![
            MenuItem {
                number: '➊',
                text: "Rust Projects".into(),
            },
            MenuItem {
                number: '➋',
                text: "Web Projects".into(),
            },
            MenuItem {
                number: '➌',
                text: "ML & Blockchain".into(),
            },
            MenuItem {
                number: '➍',
                text: "IoT & Systems".into(),
            },
        ],
        prompt: "Press 1-4 to view category, q to quit",
    };

    print!("{}", menu);
    io::stdout().flush().unwrap();

    let choice = get_single_char();
    match choice {
        '1'..='4' => show_projects(choice.to_digit(10).unwrap_or(1) as u8),
        'q' => quit(),
        _ => show_menu(),
    }
}

fn show_projects(category: u8) {
    clear_screen();

    let projects = match category {
        1 => &config().item1_projects,
        2 => &config().item2_projects,
        3 => &config().item3_projects,
        4 => &config().item4_projects,
        _ => &config().item1_projects,
    };

    let title = format!("Category {} Projects", category);
    let menu_items = projects
        .iter()
        .enumerate()
        .map(|(i, p)| MenuItem {
            number: char::from_digit((i + 1) as u32, 10).unwrap_or('1'),
            text: p.name.clone(),
        })
        .collect();

    let projects_menu = MenuList {
        title,
        items: menu_items,
        prompt: "Press 1-3 to view details, b for menu, q to quit",
    };

    print!("{}", projects_menu);
    io::stdout().flush().unwrap();

    let choice = get_single_char();
    match choice {
        '1'..='3' => show_project_detail(category, choice.to_digit(10).unwrap_or(1) as usize),
        'b' => show_menu(),
        'q' => quit(),
        _ => show_projects(category),
    }
}

fn show_project_detail(category: u8, project_idx: usize) {
    clear_screen();

    let projects = match category {
        1 => &config().item1_projects,
        2 => &config().item2_projects,
        3 => &config().item3_projects,
        4 => &config().item4_projects,
        _ => &config().item1_projects,
    };

    let project = &projects[project_idx.min(projects.len()) - 1];
    print!("{}", project);
    io::stdout().flush().unwrap();

    match get_single_char() {
        'b' => show_menu(),
        'q' => quit(),
        _ => show_project_detail(category, project_idx),
    }
}
