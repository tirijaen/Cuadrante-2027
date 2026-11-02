#!/usr/bin/env bash
# Restauración rápida al Punto de Oro (Cuadrante 2027 Andújar)
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
python3 "$DIR/restaurar_punto_oro.py"
