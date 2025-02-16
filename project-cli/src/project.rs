// src/project.rs

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
        writeln!(f, "=== {} ===\n", self.name)?;
        writeln!(f, "Description:")?;
        writeln!(f, "{}\n", self.description)?;

        writeln!(f, "Technologies:")?;
        writeln!(f, "{}\n", self.technologies.join(", "))?;

        if let Some(url) = &self.github_url {
            writeln!(f, "GitHub: {}", url)?;
        }
        if let Some(url) = &self.live_url {
            writeln!(f, "Live URL: {}", url)?;
        }

        writeln!(f, "\nHighlights:")?;
        for highlight in &self.highlights {
            writeln!(f, "➊ {}", highlight)?;
        }

        writeln!(f, "\nPress b for menu, q to quit")?;
        Ok(())
    }
}
