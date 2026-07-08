# -*- coding: utf-8 -*-
"""
Convierte los rankings del club (Excel .xls) a un JSON normalizado para la web.

Uso:
    pip install xlrd
    python scripts/convertir-ranking.py

Lee:
    Ranking web.xls      (masculino)
    Ranking FEMENI.xls   (femenino)
Escribe:
    frontend/src/assets/ranking-club.json

Preserva todos los datos: viento, "PC" (pista cubierta), marcas secundarias,
notas y columnas especiales (Maratón/Volta). Convierte las fechas en formato
número de serie de Excel a DD/MM/AAAA; los años sueltos se dejan tal cual.
"""
import xlrd
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(BASE, "frontend", "src", "assets", "ranking-club.json")

# Nombres deducidos para los bloques femeninos que no los traen en el Excel
# (verificado con el cliente). Clave = fila de la cabecera de ese bloque.
NOMBRES_DEDUCIDOS_FEM = {
    140: "3000 metros lisos",
    158: "5000 metros lisos",
    172: "10000 metros lisos",
}


def cellv(sh, r, c):
    if c >= sh.ncols:
        return ""
    v = sh.cell_value(r, c)
    if isinstance(v, float):
        return str(int(v)) if v == int(v) else str(v)
    return str(v).strip()


def conv_fecha(sh, r, c, datemode):
    """Convierte número de serie de Excel a DD/MM/AAAA; deja años sueltos igual."""
    if c >= sh.ncols:
        return ""
    v = sh.cell_value(r, c)
    if isinstance(v, float):
        n = v
        if 10000 <= n <= 60000:  # rango de fechas reales (~1927-2064)
            try:
                dt = xlrd.xldate.xldate_as_datetime(n, datemode)
                return dt.strftime("%d/%m/%Y")
            except Exception:
                pass
        return str(int(n)) if n == int(n) else str(n)
    return str(v).strip()


def _es_num(s):
    try:
        float(s.replace(",", "."))
        return True
    except (ValueError, AttributeError):
        return False


def is_header(sh, r):
    """Detecta la fila de cabecera en cualquiera de sus dos formatos:
       'nº | nombre | marca | ...'  o  '(vacío) | nombre | marca | ...',
       y el formato especial de Maratón/Volta con 'ATLETA | Apellidos'."""
    c1 = cellv(sh, r, 1).lower()
    c2 = cellv(sh, r, 2).lower()
    return ("nombre" in c1 and "marca" in c2) or ("atleta" in c1) or ("apellidos" in c2)


def is_maraton_header(sh, r):
    return "atleta" in cellv(sh, r, 1).lower() and "apellidos" in cellv(sh, r, 2).lower()


def nombre_encima(sh, hr):
    """Busca el nombre de la prueba en las filas encima de la cabecera.
       El nombre puede estar en la col 0 ('100 metros lisos | ...') o en la
       col 1 con 'nº' en la col 0 ('nº | Salto de Altura | ...')."""
    for above in range(hr - 1, max(hr - 5, -1), -1):
        c0 = cellv(sh, above, 0)
        c1 = cellv(sh, above, 1)
        c2 = cellv(sh, above, 2)
        # saltar otra fila de cabecera
        if is_header(sh, above):
            continue
        # una fila de NOMBRE tiene texto solo en col0 o col1 y el resto vacío;
        # si tiene año/fecha/lugar es una fila de datos (aunque la marca esté vacía)
        resto = [cellv(sh, above, c) for c in range(2, min(sh.ncols, 6))]
        fila_datos = any(resto)
        cand = ""
        if c0 and not c0.isdigit() and not _es_num(c0) and c0.lower() not in ("nº", "n°"):
            cand = c0
        elif (c0 == "" or c0.lower().startswith("n")) and c1 and not _es_num(c1):
            cand = c1
        if cand and not fila_datos:
            return cand
        if fila_datos:  # fila de datos -> parar
            break
    return ""


def parse_libro(path, deducidos=None):
    deducidos = deducidos or {}
    book = xlrd.open_workbook(path)
    sh = book.sheets()[0]
    dm = book.datemode

    headers = [r for r in range(sh.nrows) if is_header(sh, r)]
    pruebas = []

    for i, hr in enumerate(headers):
        fin = headers[i + 1] if i + 1 < len(headers) else sh.nrows
        # los nombres deducidos (verificados con el cliente) tienen prioridad
        nombre = deducidos.get(hr) or nombre_encima(sh, hr)
        if not nombre:
            nombre = f"Prueba (fila {hr})"

        maraton = is_maraton_header(sh, hr)
        entradas = []

        for dr in range(hr + 1, fin):
            if is_header(sh, dr):
                # quitar el nombre de prueba si estaba justo encima del siguiente header
                continue
            c0 = cellv(sh, dr, 0)
            c1 = cellv(sh, dr, 1)
            c2 = cellv(sh, dr, 2)
            # saltar la fila de nombre de la siguiente prueba
            if c0 and not c0.isdigit() and not c1 and not c2:
                continue
            if not c1 and not c2 and not c0.isdigit():
                continue
            if not c1 and not c2:
                continue

            if maraton:
                # nº | ATLETA | Apellidos | MARCA | AÑO | Salida-Meta | Años Participa.
                nom = (cellv(sh, dr, 1) + " " + cellv(sh, dr, 2)).strip()
                extra_parts = []
                anyos_part = cellv(sh, dr, 6)
                if anyos_part:
                    extra_parts.append(f"Años participando: {anyos_part}")
                entrada = {
                    "puesto": c0,
                    "nombre": nom,
                    "marca": cellv(sh, dr, 3),
                    "anyo_nac": "",
                    "fecha": cellv(sh, dr, 4),   # AÑO de la edición
                    "lugar": cellv(sh, dr, 5),   # Salida-Meta
                    "extra": " · ".join(extra_parts),
                }
            else:
                # nº | nombre | marca | año nac. | fecha | lugar | [extras...]
                # (convierte también fechas de serie Excel que aparezcan en los extras)
                extras = [conv_fecha(sh, dr, c, dm) for c in range(6, sh.ncols)]
                extras = [e for e in extras if e]
                entrada = {
                    "puesto": c0,
                    "nombre": c1,
                    "marca": c2,
                    "anyo_nac": cellv(sh, dr, 3),
                    "fecha": conv_fecha(sh, dr, 4, dm),
                    "lugar": cellv(sh, dr, 5),
                    "extra": " · ".join(extras),
                }
            entradas.append(entrada)

        if entradas:
            pruebas.append({
                "prueba": nombre,
                "tipo": "maraton" if maraton else "estandar",
                "entradas": entradas,
            })

    return pruebas


def main():
    masculino = parse_libro(os.path.join(BASE, "Ranking web.xls"))
    femenino = parse_libro(os.path.join(BASE, "Ranking FEMENI.xls"), NOMBRES_DEDUCIDOS_FEM)

    data = {
        "titulo": "Ranking del Club - Pruebas de Atletismo",
        "actualizado": "Agosto 2025",
        "generos": {
            "M": masculino,
            "F": femenino,
        },
    }

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    tm = sum(len(p["entradas"]) for p in masculino)
    tf = sum(len(p["entradas"]) for p in femenino)
    print(f"Masculino: {len(masculino)} pruebas, {tm} marcas")
    print(f"Femenino:  {len(femenino)} pruebas, {tf} marcas")
    print(f"Escrito: {SALIDA}")


if __name__ == "__main__":
    main()
