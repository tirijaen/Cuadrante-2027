#!/bin/bash
set -e
echo "🔄 Restaurando Cuadrante 2027 al Checkpoint Relevo..."
python3 "$(dirname "$0")/restaurar_checkpoint_relevo.py"
