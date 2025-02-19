// src/project.rs

use colored::*;
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Serialize, Deserialize, Clone)]
pub struct Project {
    pub name: String,
    pub description: String,
    pub technologies: Vec<String>,
    pub github_url: Option<String>,
    pub clients: Vec<String>,
}

impl fmt::Display for Project {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "{}\n", format!("=== {} ===", self.name).cyan().bold())?;

        writeln!(f, "{}", "Description:".white().bold())?;
        writeln!(f, "{}\n", self.description)?;

        writeln!(f, "{}", "Technologies:".white().bold())?;
        writeln!(f, "{}\n", self.technologies.join(", ").blue())?;

        if let Some(url) = &self.github_url {
            writeln!(f, "{} {}", "GitHub:".white().bold(), url.blue().underline())?;
        }

        writeln!(f, "\n{}", "Working for:".white().bold())?;
        for highlight in &self.clients {
            writeln!(f, "{} {}", "➊".cyan(), highlight)?;
        }

        // Split prompt to highlight commands
        let prompt = format!(
            "Press {} for menu, {} to quit",
            "b".white().bold(),
            "q".white().bold(),
        );

        writeln!(f, "\n{}", prompt.bright_black())?;
        writeln!(f, "{}", "Press ENTER after each choice!".yellow().italic())?;
        Ok(())
    }
}
