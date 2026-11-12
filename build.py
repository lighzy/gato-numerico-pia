import json
from pathlib import Path
from metodos import CATALOGO, generar

out = Path(__file__).parent / "public" / "retos.json"
banco = {}
for area, nombres in CATALOGO.items():
    for nombre in nombres:
        niveles = []
        for nivel in range(3):
            distintos = {}
            while len(distintos) < 150:
                reto = generar(nombre, nivel)
                distintos[reto.texto] = vars(reto)
            niveles.append(list(distintos.values()))
        banco[nombre] = {"area": area, "niveles": niveles}
out.write_text(json.dumps(banco, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
