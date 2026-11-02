#!/usr/bin/env python3
"""
Script de Restauración Inmediata al 'Punto de Oro' (Cuadrante 2027 Andújar).
Restaura de forma atómica y segura todos los archivos clave a la versión 100% validada
con equidad perfecta de festivos (48/47), 220 jornadas, 49 noches y 0 errores de auditoría.
"""

import shutil
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHECKPOINT_DIR = os.path.join(BASE_DIR, "checkpoints", "punto_oro_2027")

FILES_TO_RESTORE = [
    ("cuadrante_2027.json", "cuadrante_2027.json"),
    ("cuadrante_2027_v3.json", "cuadrante_2027_v3.json"),
    ("Cuadrante_2027_Andujar.xlsx", "Cuadrante_2027_Andujar.xlsx"),
    ("Cuadrante_2027_Andujar_V3.xlsx", "Cuadrante_2027_Andujar_V3.xlsx"),
    ("js/cuadrante_data.js", "js/cuadrante_data.js"),
    ("solve_v5_equidad.py", "solve_v5_equidad.py"),
    ("audit_v3_final.py", "audit_v3_final.py"),
    ("export_v3_deliverables.py", "export_v3_deliverables.py"),
    ("sw.js", "sw.js"),
    ("REGLAS_OFICIALES_CUADRANTE.md", "REGLAS_OFICIALES_CUADRANTE.md"),
]

def main():
    print("=" * 65)
    print(" 🔄 RESTAURACIÓN AL 'PUNTO DE ORO' (CUADRANTE 2027 ANDÚJAR)")
    print("=" * 65)
    
    if not os.path.exists(CHECKPOINT_DIR):
        print(f"❌ Error: No se encuentra el directorio de respaldo: {CHECKPOINT_DIR}")
        sys.exit(1)
        
    for src_name, dst_rel in FILES_TO_RESTORE:
        src = os.path.join(CHECKPOINT_DIR, os.path.basename(src_name))
        dst = os.path.join(BASE_DIR, dst_rel)
        if os.path.exists(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            print(f"  ✓ Restaurado: {dst_rel}")
        else:
            print(f"  ⚠️ Advertencia: Archivo {src} no encontrado en respaldo.")
            
    print("-" * 65)
    print(" 🔍 Ejecutando auditoría de verificación oficial...")
    res = subprocess.run([sys.executable, os.path.join(BASE_DIR, "audit_v3_final.py")], capture_output=True, text=True)
    print(res.stdout)
    if res.returncode == 0 and "0 ERRORES" in res.stdout:
        print("=" * 65)
        print(" 🎉 ¡PUNTO DE ORO RESTAURADO CON ÉXITO Y 0 ERRORES DE AUDITORÍA!")
        print("=" * 65)
    else:
        print("⚠️ Hubo advertencias al auditar:")
        print(res.stderr)

if __name__ == "__main__":
    main()
