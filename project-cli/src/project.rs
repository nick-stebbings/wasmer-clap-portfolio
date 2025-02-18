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
    pub live_url: Option<String>,
    pub highlights: Vec<String>,
}

impl fmt::Display for Project {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "{}\n", format!("=== {} ===", self.name).cyan().bold())?;
        
        writeln!(f, "{}", "Description:".yellow().bold())?;
        writeln!(f, "{}\n", self.description)?;
        
        writeln!(f, "{}", "Technologies:".yellow().bold())?;
        writeln!(f, "{}\n", self.technologies.join(", ").blue())?;
        
        if let Some(url) = &self.github_url {
            writeln!(f, "{} {}", "GitHub:".yellow().bold(), url.blue().underline())?;
        }
        if let Some(url) = &self.live_url {
            writeln!(f, "{} {}", "Live URL:".yellow().bold(), url.blue().underline())?;
        }
        
        writeln!(f, "\n{}", "Highlights:".yellow().bold())?;
        for highlight in &self.highlights {
            writeln!(f, "{} {}", "➊".cyan(), highlight)?;
        }
        
        // Split prompt to highlight commands
        let prompt = "Press b for menu, q to quit"
            .replace("b", "b".white().to_string().as_str())
            .replace("q", "q".white().to_string().as_str());
            
        writeln!(f, "\n{}", prompt.dimmed())?;
        writeln!(f, "{}", "Press ENTER after each choice!".yellow().italic())?;
        Ok(())
    }
}