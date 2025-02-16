// src/config.rs
use crate::project::Project;
use serde::Deserialize;
use std::sync::OnceLock;

pub fn config() -> &'static ProjectConfig {
    static INSTANCE: OnceLock<ProjectConfig> = OnceLock::new();

    INSTANCE.get_or_init(|| {
        load_config().unwrap_or_else(|ex| panic!("FATAL - WHILE LOADING CONF - Cause: {ex:?}"))
    })
}

#[allow(unused)]
#[derive(Deserialize, Clone)]
pub struct ProjectConfig {
    pub item1_projects: Vec<Project>,
    pub item2_projects: Vec<Project>,
    pub item3_projects: Vec<Project>,
    pub item4_projects: Vec<Project>,
}

fn load_config() -> Result<ProjectConfig, config::ConfigError> {
    let projects = config::Config::builder()
        .add_source(config::File::new(
            "projects.yaml",
            config::FileFormat::Yaml,
        ))
        .build()?;
    projects.try_deserialize::<ProjectConfig>()
}
