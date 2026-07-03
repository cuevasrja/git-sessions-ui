use crate::{gitconfig, keygen, paths, session, sshconfig};

#[tauri::command]
pub fn list_sessions_cmd() -> Result<Vec<session::Session>, String> {
    session::list_sessions()
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSessionInput {
    pub name: String,
    pub provider: String,
    pub host: String,
    pub email: String,
    pub gitdir: String,
    pub signing_key: String,
    pub ssh_user: String,
    pub key_path: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditSessionInput {
    pub name: String,
    pub provider: String,
    pub email: String,
    pub gitdir: String,
    pub signing_key: String,
    pub ssh_user: String,
    pub key_path: String,
    pub host: String,
    pub alias: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MutationResult {
    pub session: session::Session,
    pub changed_files: Vec<String>,
}

#[tauri::command]
pub fn create_session(input: CreateSessionInput, dry_run: bool) -> Result<MutationResult, String> {
    if input.name.trim().is_empty() {
        return Err("Session name cannot be empty".into());
    }
    let host = session::provider_host(&input.provider, &input.host);
    let alias = format!("{host}-{}", input.name);
    let gitdir = if input.gitdir.trim().is_empty() { format!("~/{}/", input.name) } else { input.gitdir.clone() };

    let changed_files = vec![
        paths::collapse_home(&paths::gitconfig_path()),
        paths::collapse_home(&paths::identity_config_path(&input.name)),
        paths::collapse_home(&paths::ssh_config_path()),
    ];

    if !dry_run {
        gitconfig::append_include_if(&input.name, &gitdir)?;
        gitconfig::write_identity_file(&input.name, &input.email, &input.signing_key, &alias, &host)?;
        sshconfig::append_host_block(&alias, &host, &input.ssh_user, &input.key_path)?;
    }

    Ok(MutationResult {
        session: session::Session {
            id: input.name.clone(),
            name: input.name,
            provider: input.provider,
            read_only: false,
            health: "ok".into(),
            email: input.email,
            signing_key: input.signing_key,
            gitdir,
            host,
            alias,
            ssh_user: input.ssh_user,
            key_path: input.key_path,
            problems: vec![],
        },
        changed_files,
    })
}

#[tauri::command]
pub fn edit_session(input: EditSessionInput, dry_run: bool) -> Result<MutationResult, String> {
    let changed_files = vec![
        paths::collapse_home(&paths::gitconfig_path()),
        paths::collapse_home(&paths::identity_config_path(&input.name)),
        paths::collapse_home(&paths::ssh_config_path()),
    ];

    if !dry_run {
        gitconfig::update_include_if_gitdir(&input.name, &input.gitdir)?;
        gitconfig::write_identity_file(&input.name, &input.email, &input.signing_key, &input.alias, &input.host)?;
        sshconfig::update_host_block(&input.alias, None, Some(&input.ssh_user), Some(&input.key_path))?;
    }

    Ok(MutationResult {
        session: session::Session {
            id: input.name.clone(),
            name: input.name,
            provider: input.provider,
            read_only: false,
            health: "ok".into(),
            email: input.email,
            signing_key: input.signing_key,
            gitdir: input.gitdir,
            host: input.host,
            alias: input.alias,
            ssh_user: input.ssh_user,
            key_path: input.key_path,
            problems: vec![],
        },
        changed_files,
    })
}

#[tauri::command]
pub fn delete_session(name: String, alias: String, key_path: String, delete_key: bool, dry_run: bool) -> Result<Vec<String>, String> {
    let mut changed = vec![
        paths::collapse_home(&paths::gitconfig_path()),
        paths::collapse_home(&paths::identity_config_path(&name)),
        paths::collapse_home(&paths::ssh_config_path()),
    ];

    if !dry_run {
        gitconfig::remove_include_if(&name)?;
        gitconfig::delete_identity_file(&name)?;
        sshconfig::remove_host_block(&alias)?;
        if delete_key && !key_path.is_empty() {
            let priv_path = paths::expand_tilde(&key_path);
            let pub_path = paths::expand_tilde(&format!("{key_path}.pub"));
            if priv_path.exists() {
                std::fs::remove_file(&priv_path).map_err(|e| e.to_string())?;
            }
            if pub_path.exists() {
                std::fs::remove_file(&pub_path).map_err(|e| e.to_string())?;
            }
        }
    }
    if delete_key && !key_path.is_empty() {
        changed.push(key_path.clone());
        changed.push(format!("{key_path}.pub"));
    }

    Ok(changed)
}

#[tauri::command]
pub fn generate_ssh_key(name: String, passphrase: String, comment: String) -> Result<keygen::GeneratedKey, String> {
    keygen::generate_ed25519_key(&name, &passphrase, &comment)
}

#[tauri::command]
pub fn list_existing_keys() -> Vec<String> {
    keygen::list_existing_keys()
}
