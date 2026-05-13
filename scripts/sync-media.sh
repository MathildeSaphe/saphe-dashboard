#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# sync-media.sh
# Kører automatisk i baggrunden (macOS LaunchAgent).
# Tjekker om der er nye medieovervågnings-filer i Dropbox,
# kopierer dem til projektet og pusher til GitHub → Vercel opdaterer.
# ─────────────────────────────────────────────────────────────────

DROPBOX_DIR="$HOME/Dropbox/Medieovervågning"
PROJECT_DIR="$HOME/Desktop/Saphe/Claude/Dashboard/saphe-dashboard"
MEDIA_DIR="$PROJECT_DIR/data/media"
LOG="$HOME/Library/Logs/saphe-media-sync.log"

# Sørg for at git bruger den rigtige PATH (nvm)
export PATH="/Users/mathilde/.nvm/versions/node/v24.15.0/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

# Find alle .md filer i Dropbox der IKKE allerede er i projektet
NYFIL=0
for fil in "$DROPBOX_DIR"/*.md; do
  [ -f "$fil" ] || continue
  filnavn=$(basename "$fil")
  mål="$MEDIA_DIR/$filnavn"

  if [ ! -f "$mål" ]; then
    cp "$fil" "$mål"
    log "Ny fil kopieret: $filnavn"
    NYFIL=1
  fi
done

# Kun push hvis der var nye filer
if [ "$NYFIL" -eq 1 ]; then
  cd "$PROJECT_DIR" || exit 1

  git add data/media/
  git commit -m "Medieovervågning: ny daglig fil $(date '+%Y-%m-%d')"
  git push origin main

  if [ $? -eq 0 ]; then
    log "Push til GitHub OK → Vercel bygger nu"
  else
    log "FEJL: Push til GitHub mislykkedes"
  fi
else
  log "Ingen nye filer"
fi
