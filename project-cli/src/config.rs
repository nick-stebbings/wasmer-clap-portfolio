// src/config.rs
use crate::project::Project;
use serde::Deserialize;

#[cfg(not(target_arch = "wasm32"))]
use std::sync::OnceLock;

#[cfg(not(target_arch = "wasm32"))]
pub fn config() -> &'static ProjectConfig {
    static INSTANCE: OnceLock<ProjectConfig> = OnceLock::new();

    INSTANCE.get_or_init(|| {
        load_config().unwrap_or_else(|ex| panic!("FATAL - WHILE LOADING CONF - Cause: {ex:?}"))
    })
}

#[cfg(target_arch = "wasm32")]
pub fn config() -> ProjectConfig {
    serde_yaml::from_str(include_str!("../projects.yaml")).unwrap()
}

#[allow(unused)]
#[derive(Deserialize, Clone)]
pub struct ProjectConfig {
    pub item1_projects: Vec<Project>,
    pub item2_projects: Vec<Project>,
    pub item3_projects: Vec<Project>,
    pub item4_projects: Vec<Project>,
}

#[cfg(not(target_arch = "wasm32"))]
fn load_config() -> Result<ProjectConfig, config::ConfigError> {
    let projects = config::Config::builder()
        .add_source(config::File::new("projects.yaml", config::FileFormat::Yaml))
        .build()?;
    projects.try_deserialize::<ProjectConfig>()
}
