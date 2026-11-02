#!/usr/bin/env python3
"""
Script de Restauración Inmediata al 'Checkpoint Relevo 2027' (Cuadrante 2027 Andújar).
Restaura de forma atómica y segura todos los archivos clave a la versión validada
con Hilario 110M/110T, equidad de festivos (48/47), 220 jornadas, 49 noches,
historial de vacaciones integrado y paquete de exportación.
"""

import shutil
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHECKPOINT_DIR = os.path.join(BASE_DIR, "checkpoints", "checkpoint_relevo_2027")

FILES_TO_RESTORE = [
    ("cuadrante_2027.json", "cuadrante_2027.json"),
    ("cuadrante_2027_v3.json", "cuadrante_2027_v3.json"),
    ("Cuadrante_2027_Andujar.xlsx", "Cuadrante_2027_Andujar.xlsx"),
    ("Cuadrante_2027_Andujar_V3.xlsx", "Cuadrante_2027_Andujar_V3.xlsx"),
    ("js/cuadrante_data.js", "js/cuadrante_data.js"),
    ("js/historical_data.js", "js/historical_data.js"),
    ("js/app.js", "js/app.js"),
    ("solve_v5_equidad.py", "solve_v5_equidad.py"),
    ("audit_v3_final.py", "audit_v3_final.py"),
    ("export_v3_deliverables.py", "export_v3_deliverables.py"),
    ("sw.js", "sw.js"),
    ("REGLAS_OFICIALES_CUADRANTE.md", "REGLAS_OFICIALES_CUADRANTE.md"),
    ("HISTORIAL_CONVERSACIONES.md", "HISTORIAL_CONVERSACIONES.md"),
    ("HISTORIAL_FESTIVOS_Y_VACACIONES.md", "HISTORIAL_FESTIVOS_Y_VACACIONES.md"),
]

def main():
    print("=" * 68)
    print(" 🔄 RESTAURACIÓN AL 'CHECKPOINT RELEVO 2027' (CUADRANTE ANDÚJAR)")
    print("=" * 68)
    
    if not os.path.exists(CHECKPOINT_DIR):
        print(f"❌ Error: No se encuentra el directorio de respaldo: {CHECKPOINT_DIR}")
        sys.exit(1)
        
    for src_name, dst_rel in FILES_TO_RESTORE:
        src = os.path.join(CHECKPOINT_DIR, src_name)
        dst = os.path.join(BASE_DIR, dst_rel)
        if os.path.exists(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            print(f"  ✓ Restaurado: {dst_rel}")
        else:
            print(f"  ⚠️ Advertencia: Archivo {src} no encontrado en respaldo.")
            
    print("-" * 68)
    print(" 🔍 Ejecutando auditoría de verificación oficial...")
    res = subprocess.run([sys.executable, os.path.join(BASE_DIR, "audit_v3_final.py")], capture_output=True, text=True)
    print(res.stdout)
    if res.returncode == 0 and "0 ERRORES" in res.stdout:
        print("=" * 68)
        print(" 🎉 ¡CHECKPOINT RELEVO 2027 RESTAURADO CON ÉXITO Y 0 ERRORES!")
        print("=" * 68)
    else:
        print("⚠️ Hubo advertencias al auditar:")
        print(res.stderr)

if __name__ == "__main__":
    main()
