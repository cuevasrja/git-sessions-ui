use std::fs;

use crate::backup;
use crate::paths;

/// A parsed `[section "subsection"]` header and the line range of its body.
#[derive(Debug, Clone)]
pub struct ConfigSection {
    pub name: String,
    pub subsection: Option<String>,
    pub header_line: usize,
    pub body_start: usize,
    pub body_end: usize,
}

pub fn parse_sections(content: &str) -> Vec<ConfigSection> {
    let lines: Vec<&str> = content.lines().collect();
    let mut sections = Vec::new();
    let mut current: Option<(String, Option<String>, usize)> = None;

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') && trimmed.len() >= 2 {
            if let Some((name, sub, start)) = current.take() {
                sections.push(ConfigSection { name, subsection: sub, header_line: start, body_start: start + 1, body_end: i });
            }
            let inner = &trimmed[1..trimmed.len() - 1];
            if let Some(space_idx) = inner.find(char::is_whitespace) {
                let name = inner[..space_idx].to_string();
                let sub = inner[space_idx..].trim().trim_matches('"').to_string();
                current = Some((name, Some(sub), i));
            } else {
                current = Some((inner.to_string(), None, i));
            }
        }
    }
    if let Some((name, sub, start)) = current {
        sections.push(ConfigSection { name, subsection: sub, header_line: start, body_start: start + 1, body_end: lines.len() });
    }
    sections
}

fn get_value(lines: &[&str], section: &ConfigSection, key: &str) -> Option<String> {
    for line in &lines[section.body_start..section.body_end.min(lines.len())] {
        let t = line.trim();
        if let Some(eq) = t.find('=') {
            let k = t[..eq].trim();
            if k.eq_ignore_ascii_case(key) {
                return Some(t[eq + 1..].trim().to_string());
            }
        }
    }
    None
}

pub struct DefaultIdentity {
    pub email: String,
    pub signing_key: String,
    pub include_path: Option<String>,
}

/// Reads the top-level `[user]` identity and unconditional `[include]` from
/// `~/.gitconfig` — this is the identity Git falls back to when no
/// `includeIf` condition matches.
pub fn read_default_identity() -> Result<DefaultIdentity, String> {
    let path = paths::gitconfig_path();
    let content = fs::read_to_string(&path).unwrap_or_default();
    let lines: Vec<&str> = content.lines().collect();
    let sections = parse_sections(&content);

    let mut email = String::new();
    let mut signing_key = String::new();
    let mut include_path = None;

    for s in &sections {
        if s.name.eq_ignore_ascii_case("user") && s.subsection.is_none() {
            email = get_value(&lines, s, "email").unwrap_or(email);
            signing_key = get_value(&lines, s, "signingKey").unwrap_or(signing_key);
        }
        if s.name.eq_ignore_ascii_case("include") && s.subsection.is_none() {
            include_path = get_value(&lines, s, "path");
        }
    }

    if email.is_empty() {
        if let Some(p) = &include_path {
            let full = paths::expand_tilde(p);
            if let Ok(inc_content) = fs::read_to_string(&full) {
                let inc_lines: Vec<&str> = inc_content.lines().collect();
                for s in &parse_sections(&inc_content) {
                    if s.name.eq_ignore_ascii_case("user") && s.subsection.is_none() {
                        email = get_value(&inc_lines, s, "email").unwrap_or(email.clone());
                        signing_key = get_value(&inc_lines, s, "signingKey").unwrap_or(signing_key.clone());
                    }
                }
            }
        }
    }

    Ok(DefaultIdentity { email, signing_key, include_path })
}

pub struct IdentityInclude {
    pub name: String,
    pub gitdir: String,
    pub config_path: String,
}

fn derive_session_name(config_path: &str, gitdir: &str) -> String {
    if let Some(idx) = config_path.rfind(".gitconfig.") {
        return config_path[idx + ".gitconfig.".len()..].to_string();
    }
    gitdir.trim_end_matches('/').rsplit('/').next().unwrap_or(gitdir).to_string()
}

/// Reads every `[includeIf "gitdir:…"]` binding in `~/.gitconfig`.
pub fn read_include_ifs() -> Result<Vec<IdentityInclude>, String> {
    let path = paths::gitconfig_path();
    let content = fs::read_to_string(&path).unwrap_or_default();
    let lines: Vec<&str> = content.lines().collect();

    let mut out = Vec::new();
    for s in &parse_sections(&content) {
        if s.name.eq_ignore_ascii_case("includeIf") {
            if let Some(sub) = &s.subsection {
                let gitdir = sub.strip_prefix("gitdir:").or_else(|| sub.strip_prefix("gitdir/i:"));
                if let Some(gitdir) = gitdir {
                    if let Some(config_path) = get_value(&lines, s, "path") {
                        let name = derive_session_name(&config_path, gitdir);
                        out.push(IdentityInclude { name, gitdir: gitdir.to_string(), config_path });
                    }
                }
            }
        }
    }
    Ok(out)
}

/// Appends a new `[includeIf "gitdir:…"]` block to `~/.gitconfig`.
pub fn append_include_if(name: &str, gitdir: &str) -> Result<(), String> {
    let path = paths::gitconfig_path();
    backup::backup_file(&path)?;
    let mut content = fs::read_to_string(&path).unwrap_or_default();
    if !content.is_empty() && !content.ends_with('\n') {
        content.push('\n');
    }
    if !content.is_empty() {
        content.push('\n');
    }
    content.push_str(&format!("[includeIf \"gitdir:{gitdir}\"]\n\tpath = ~/.gitconfig.{name}\n"));
    fs::write(&path, content).map_err(|e| e.to_string())
}

fn find_include_if<'a>(lines: &[&str], sections: &'a [ConfigSection], name: &str) -> Option<&'a ConfigSection> {
    sections.iter().find(|s| {
        s.name.eq_ignore_ascii_case("includeIf")
            && get_value(lines, s, "path")
                .map(|p| p.ends_with(&format!(".gitconfig.{name}")))
                .unwrap_or(false)
    })
}

/// Removes the `[includeIf]` block that points at `~/.gitconfig.<name>`.
pub fn remove_include_if(name: &str) -> Result<(), String> {
    let path = paths::gitconfig_path();
    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return Ok(()),
    };
    let lines: Vec<&str> = content.lines().collect();
    let sections = parse_sections(&content);
    let Some(target) = find_include_if(&lines, &sections, name) else { return Ok(()) };

    backup::backup_file(&path)?;
    let mut new_lines: Vec<&str> = Vec::new();
    new_lines.extend_from_slice(&lines[..target.header_line]);
    new_lines.extend_from_slice(&lines[target.body_end.min(lines.len())..]);
    let mut new_content = new_lines.join("\n");
    if content.ends_with('\n') {
        new_content.push('\n');
    }
    fs::write(&path, new_content).map_err(|e| e.to_string())
}

/// Updates the `gitdir:` condition of an existing `[includeIf]` block,
/// preserving everything else in `~/.gitconfig`.
pub fn update_include_if_gitdir(name: &str, new_gitdir: &str) -> Result<(), String> {
    let path = paths::gitconfig_path();
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let lines: Vec<&str> = content.lines().collect();
    let sections = parse_sections(&content);
    let Some(target) = find_include_if(&lines, &sections, name) else {
        return Err(format!("no includeIf block found for session \"{name}\""));
    };

    backup::backup_file(&path)?;
    let mut new_lines: Vec<String> = lines.iter().map(|l| l.to_string()).collect();
    new_lines[target.header_line] = format!("[includeIf \"gitdir:{new_gitdir}\"]");
    let mut new_content = new_lines.join("\n");
    if content.ends_with('\n') {
        new_content.push('\n');
    }
    fs::write(&path, new_content).map_err(|e| e.to_string())
}

pub struct IdentityFile {
    pub email: String,
    pub signing_key: String,
    pub alias: Option<String>,
    pub host: Option<String>,
}

/// Reads `~/.gitconfig.<name>` — the per-identity file referenced by an
/// `includeIf` block.
pub fn read_identity_file(name: &str) -> Option<IdentityFile> {
    let path = paths::identity_config_path(name);
    let content = fs::read_to_string(&path).ok()?;
    let lines: Vec<&str> = content.lines().collect();

    let mut email = String::new();
    let mut signing_key = String::new();
    let mut alias = None;
    let mut host = None;

    for s in &parse_sections(&content) {
        if s.name.eq_ignore_ascii_case("user") {
            email = get_value(&lines, s, "email").unwrap_or(email.clone());
            signing_key = get_value(&lines, s, "signingKey").unwrap_or(signing_key.clone());
        }
        if s.name.eq_ignore_ascii_case("url") {
            if let Some(sub) = &s.subsection {
                if let Some(a) = sub.strip_prefix("git@").and_then(|x| x.strip_suffix(':')) {
                    alias = Some(a.to_string());
                }
            }
            if let Some(instead) = get_value(&lines, s, "insteadOf") {
                if let Some(h) = instead.strip_prefix("git@").and_then(|x| x.strip_suffix(':')) {
                    host = Some(h.to_string());
                }
            }
        }
    }

    Some(IdentityFile { email, signing_key, alias, host })
}

/// Writes (overwrites) `~/.gitconfig.<name>` with the `[user]` identity and
/// the `[url] insteadOf` multi-account rewrite rule.
pub fn write_identity_file(name: &str, email: &str, signing_key: &str, alias: &str, host: &str) -> Result<(), String> {
    let path = paths::identity_config_path(name);
    backup::backup_file(&path)?;

    let mut content = String::new();
    content.push_str("[user]\n");
    content.push_str(&format!("\temail = {email}\n"));
    if !signing_key.trim().is_empty() {
        content.push_str(&format!("\tsigningKey = {signing_key}\n"));
    }
    content.push('\n');
    content.push_str(&format!("[url \"git@{alias}:\"]\n"));
    content.push_str(&format!("\tinsteadOf = git@{host}:\n"));

    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn delete_identity_file(name: &str) -> Result<(), String> {
    let path = paths::identity_config_path(name);
    if path.exists() {
        backup::backup_file(&path)?;
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
