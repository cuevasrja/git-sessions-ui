use std::collections::HashMap;
use std::fs;

use crate::backup;
use crate::paths;

#[derive(Debug, Clone)]
pub struct HostBlock {
    pub alias: String,
    pub host_name: Option<String>,
    pub user: Option<String>,
    pub identity_file: Option<String>,
    pub start_line: usize,
    pub end_line: usize,
}

/// Parses every `Host …` block in an `~/.ssh/config`-formatted string.
pub fn parse_host_blocks(content: &str) -> Vec<HostBlock> {
    let lines: Vec<&str> = content.lines().collect();
    let mut blocks = Vec::new();
    let mut current: Option<(String, usize)> = None;
    let mut props: HashMap<String, String> = HashMap::new();

    fn flush(current: &mut Option<(String, usize)>, props: &mut HashMap<String, String>, end: usize, blocks: &mut Vec<HostBlock>) {
        if let Some((alias, start)) = current.take() {
            blocks.push(HostBlock {
                alias,
                host_name: props.remove("hostname"),
                user: props.remove("user"),
                identity_file: props.remove("identityfile"),
                start_line: start,
                end_line: end,
            });
        }
        props.clear();
    }

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let mut parts = trimmed.splitn(2, char::is_whitespace);
        let key = parts.next().unwrap_or("");
        let rest = parts.next().unwrap_or("").trim();
        if key.eq_ignore_ascii_case("host") {
            flush(&mut current, &mut props, i, &mut blocks);
            current = Some((rest.to_string(), i));
        } else if current.is_some() {
            props.insert(key.to_lowercase(), rest.to_string());
        }
    }
    flush(&mut current, &mut props, lines.len(), &mut blocks);
    blocks
}

/// Appends a new `Host` block for a fresh session's SSH alias.
pub fn append_host_block(alias: &str, hostname: &str, user: &str, identity_file: &str) -> Result<(), String> {
    let path = paths::ssh_config_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    backup::backup_file(&path)?;
    let mut content = fs::read_to_string(&path).unwrap_or_default();
    if !content.is_empty() && !content.ends_with('\n') {
        content.push('\n');
    }
    if !content.is_empty() {
        content.push('\n');
    }
    content.push_str(&format!(
        "Host {alias}\n    HostName {hostname}\n    User {user}\n    IdentityFile {identity_file}\n    IdentitiesOnly yes\n"
    ));
    fs::write(&path, content).map_err(|e| e.to_string())
}

/// Removes a `Host` block entirely (used when deleting a session).
pub fn remove_host_block(alias: &str) -> Result<(), String> {
    let path = paths::ssh_config_path();
    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return Ok(()),
    };
    let lines: Vec<&str> = content.lines().collect();
    let Some(block) = parse_host_blocks(&content).into_iter().find(|b| b.alias == alias) else {
        return Ok(());
    };

    backup::backup_file(&path)?;
    let mut new_lines: Vec<&str> = Vec::new();
    new_lines.extend_from_slice(&lines[..block.start_line]);
    new_lines.extend_from_slice(&lines[block.end_line.min(lines.len())..]);
    let mut new_content = new_lines.join("\n");
    if content.ends_with('\n') {
        new_content.push('\n');
    }
    fs::write(&path, new_content).map_err(|e| e.to_string())
}

/// Updates fields of an existing `Host` block in place, preserving every
/// other line (comments, extra directives) exactly as written.
pub fn update_host_block(alias: &str, hostname: Option<&str>, user: Option<&str>, identity_file: Option<&str>) -> Result<(), String> {
    let path = paths::ssh_config_path();
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let lines: Vec<&str> = content.lines().collect();
    let Some(block) = parse_host_blocks(&content).into_iter().find(|b| b.alias == alias) else {
        return Err(format!("Host {alias} not found in ~/.ssh/config"));
    };

    backup::backup_file(&path)?;
    let mut new_lines: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
    for i in (block.start_line + 1)..block.end_line.min(lines.len()) {
        let raw = lines[i];
        let trimmed = raw.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let key = trimmed.split_whitespace().next().unwrap_or("").to_lowercase();
        let indent = &raw[..raw.len() - raw.trim_start().len()];
        match key.as_str() {
            "user" => {
                if let Some(u) = user {
                    new_lines[i] = format!("{indent}User {u}");
                }
            }
            "identityfile" => {
                if let Some(f) = identity_file {
                    new_lines[i] = format!("{indent}IdentityFile {f}");
                }
            }
            "hostname" => {
                if let Some(h) = hostname {
                    new_lines[i] = format!("{indent}HostName {h}");
                }
            }
            _ => {}
        }
    }
    let mut new_content = new_lines.join("\n");
    if content.ends_with('\n') {
        new_content.push('\n');
    }
    fs::write(&path, new_content).map_err(|e| e.to_string())
}
