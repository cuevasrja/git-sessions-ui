mod backup;
mod commands;
mod gitconfig;
mod keygen;
mod paths;
mod session;
mod sshconfig;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_sessions_cmd,
            commands::create_session,
            commands::edit_session,
            commands::delete_session,
            commands::generate_ssh_key,
            commands::list_existing_keys,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
