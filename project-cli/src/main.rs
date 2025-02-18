use colored::*;
use config::config;
use std::io::{self, Read, Write};
mod config;
mod project;

pub struct MenuList {
    pub title: String,
    pub items: Vec<MenuItem>,
}

pub struct MenuItem {
    pub number: char,
    pub text: String,
}

impl std::fmt::Display for MenuList {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "{}\n", format!("=== {} ===", self.title).cyan().bold())?;
        
        for item in &self.items {
            writeln!(f, "{} {}", item.number.to_string().cyan(), item.text)?;
        }
        
        // Use explicit white() for commands
        let prompt = format!("Press {} to view category, {} to quit", 
            "1-4".white().bold(), 
            "q".white().bold()
        );
        
        writeln!(f, "\n{}", prompt.bright_black())?;
        writeln!(f, "{}", "Press ENTER after each choice!".yellow().italic())?;
        Ok(())
    }
}

fn main() {
    enable_raw_mode();
    show_menu();
    cleanup();
    disable_raw_mode();
}

fn enable_raw_mode() {
    print!("\x1B[?1049h\x1B[2J\x1B[H");
    io::stdout().flush().unwrap();
}

fn disable_raw_mode() {
    print!("\x1B[?1049l");
    io::stdout().flush().unwrap();
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
    let menu = MenuList {
        title: "Portfolio Projects".into(),
        items: vec![
            MenuItem {
                number: '1',
                text: "Front End Projects".into(),
            },
            MenuItem {
                number: '2',
                text: "Back End Projects".into(),
            },
        ],
    };

    print!("{}", menu);
    io::stdout().flush().unwrap();

    let choice = get_single_char();
    match choice {
        '1' => {
            // Send custom escape sequence to be handled by front-end
            print!("\x1B]1337;Custom=1\x07");
            io::stdout().flush().unwrap();
            show_menu();
        }
        '2'..='4' => show_projects(choice.to_digit(10).unwrap_or(1) as u8),
        'q' => quit(),
        _ => show_menu(),
    }
}

fn show_projects(category: u8) {
    clear_screen();

    let projects = match category {
        1 => &config().item1_projects,
        2 => &config().item2_projects,
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
