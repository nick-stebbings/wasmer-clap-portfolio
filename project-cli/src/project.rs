// src/project.rs
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Project {
    name: String,
    description: String,
    technologies: Vec<String>,
    github_url: Option<String>,
    live_url: Option<String>,
    highlights: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Portfolio {
    projects: Vec<Project>,
    skills: Vec<Skill>,
}

#[derive(Serialize, Deserialize)]
pub struct Skill {
    name: String,
    level: u8,
    projects: Vec<String>,
}
