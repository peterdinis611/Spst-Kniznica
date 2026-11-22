#!/usr/bin/env bash
# Install daily SQLite backup at 20:00 local time.
# macOS → launchd (LaunchAgents)
# Linux → user crontab
#
# Usage:
#   ./scripts/install-daily-backup.sh           # install
#   ./scripts/install-daily-backup.sh --uninstall
#   ./scripts/install-daily-backup.sh --run-now # test once
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="$ROOT/scripts/backup-sqlite.sh"
LABEL="sk.spst.kniznica.backup"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
CRON_MARK="# spst-kniznica-daily-backup"
HOUR=20
MINUTE=0

usage() {
  cat <<EOF
Usage: $(basename "$0") [--uninstall|--run-now|--help]

  Nainštaluje denný backup o ${HOUR}:$(printf '%02d' "$MINUTE") (lokálny čas).
  Zálohy: $ROOT/.backups/   log: $ROOT/.backups/backup.log
EOF
}

run_backup() {
  mkdir -p "$ROOT/.backups"
  /bin/bash "$BACKUP_SCRIPT" >>"$ROOT/.backups/backup.log" 2>&1
}

uninstall_launchd() {
  if [[ -f "$PLIST" ]]; then
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || launchctl unload "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Odstránený launchd job: $LABEL"
  fi
}

uninstall_cron() {
  if ! command -v crontab >/dev/null 2>&1; then
    return 0
  fi
  local existing
  existing="$(crontab -l 2>/dev/null || true)"
  if echo "$existing" | grep -qF "$CRON_MARK"; then
    echo "$existing" | grep -vF "$CRON_MARK" | crontab -
    echo "Odstránený crontab riadok ($CRON_MARK)"
  fi
}

install_launchd() {
  mkdir -p "$(dirname "$PLIST")" "$ROOT/.backups"
  cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${BACKUP_SCRIPT}</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>${HOUR}</integer>
    <key>Minute</key>
    <integer>${MINUTE}</integer>
  </dict>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>StandardOutPath</key>
  <string>${ROOT}/.backups/backup.log</string>
  <key>StandardErrorPath</key>
  <string>${ROOT}/.backups/backup.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>SPST_BACKUP_KEEP_DAYS</key>
    <string>14</string>
  </dict>
</dict>
</plist>
EOF

  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$PLIST" 2>/dev/null \
    || launchctl load -w "$PLIST"
  echo "Nainštalovaný launchd: $PLIST"
  echo "Každý deň o ${HOUR}:$(printf '%02d' "$MINUTE") → $ROOT/.backups/"
}

install_cron() {
  mkdir -p "$ROOT/.backups"
  local line="${MINUTE} ${HOUR} * * * SPST_BACKUP_KEEP_DAYS=14 /bin/bash '${BACKUP_SCRIPT}' >> '${ROOT}/.backups/backup.log' 2>&1 ${CRON_MARK}"
  local existing
  existing="$(crontab -l 2>/dev/null || true)"
  {
    echo "$existing" | grep -vF "$CRON_MARK" || true
    echo "$line"
  } | crontab -
  echo "Nainštalovaný crontab: ${MINUTE} ${HOUR} * * * (denne)"
  echo "Zálohy → $ROOT/.backups/"
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  --run-now)
    echo "==> Manuálny backup teraz…"
    run_backup
    echo "Hotovo. Pozri $ROOT/.backups/backup.log"
    exit 0
    ;;
  --uninstall)
    if [[ "$(uname -s)" == "Darwin" ]]; then
      uninstall_launchd
    fi
    uninstall_cron
    exit 0
    ;;
  "")
    ;;
  *)
    echo "Neznámy argument: $1" >&2
    usage >&2
    exit 1
    ;;
esac

if [[ ! -x "$BACKUP_SCRIPT" ]]; then
  chmod +x "$BACKUP_SCRIPT"
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  uninstall_cron
  install_launchd
else
  uninstall_launchd 2>/dev/null || true
  install_cron
fi

echo
echo "Test:  ./scripts/install-daily-backup.sh --run-now"
echo "Stop:  ./scripts/install-daily-backup.sh --uninstall"
