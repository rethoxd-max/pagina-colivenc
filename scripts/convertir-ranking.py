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

Preserva todos los datos (viento, "PC", marcas secundarias, notas, columnas
especiales de Maratón/Volta). Convierte fechas de serie Excel a DD/MM/AAAA.

Además:
- Corrige dos errores de extracción detectados en el Excel original: celdas
  de "marca" guardadas con formato de hora de Excel (aparecían como
  0.0513888...) y el bloque "VOLTA A PEU" masculino, cuyas columnas están
  desplazadas (la marca real cae en la columna que las demás pruebas usan
  para la fecha).
- NO se fía del número de "puesto" que trae el Excel (tiene huecos y puestos
  duplicados por errores de introducción manual): se recalcula ordenando por
  el valor real de cada marca, con reglas propias según el tipo de prueba
  (tiempo corto, tiempo largo, horas, distancia/altura, puntos). Los tiempos
  manuales de velocidad se dejan exactamente como están anotados: no se les
  suma la corrección de +0,24s de electrónica, eso es un ajuste que se hace
  a posteriori y no afecta al orden aquí.
- Añade un campo "sector" por prueba (velocidad, medio_fondo, ruta_marcha,
  saltos, lanzamientos, combinadas) para poder organizar el selector web.
"""
import xlrd
import json
import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(BASE, "frontend", "src", "assets", "ranking-club.json")

# Nombres deducidos para los bloques femeninos que no los traen en el Excel
# (verificado con el cliente). Clave = fila de la cabecera de ese bloque.
NOMBRES_DEDUCIDOS_FEM = {
    140: "3000 metros lisos",
    158: "5000 metros lisos",
    172: "10000 metros lisos",
}

SEPARADORES = r".,:;'’´¨\""


# ══════════════════════════════════════════════════════════════════════════
# Lectura de celdas
# ══════════════════════════════════════════════════════════════════════════

def cellv(sh, r, c, datemode=0):
    """Lee una celda como texto. Si Excel la guardó con formato de hora
    (celda tipo DATE con valor < 1 día) se interpreta como una duración
    horaria mal etiquetada -por ejemplo, una marca de maratón- y se
    convierte a "H:MM.SS" en vez de dejar la fracción de día en crudo."""
    if c >= sh.ncols:
        return ""
    cell = sh.cell(r, c)
    v = cell.value
    if cell.ctype == 3 and isinstance(v, float) and 0 < v < 1:
        try:
            dt = xlrd.xldate.xldate_as_datetime(v, datemode)
            total = dt.hour * 3600 + dt.minute * 60 + dt.second
            h, resto = divmod(total, 3600)
            m, s = divmod(resto, 60)
            return f"{h}:{m:02d}.{s:02d}" if h else f"{m}:{s:02d}"
        except Exception:
            pass
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
        if 10000 <= n <= 60000:
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
        if is_header(sh, above):
            continue
        resto = [cellv(sh, above, c) for c in range(2, min(sh.ncols, 6))]
        fila_datos = any(resto)
        cand = ""
        if c0 and not c0.isdigit() and not _es_num(c0) and c0.lower() not in ("nº", "n°"):
            cand = c0
        elif (c0 == "" or c0.lower().startswith("n")) and c1 and not _es_num(c1):
            cand = c1
        if cand and not fila_datos:
            return cand
        if fila_datos:
            break
    return ""


# ══════════════════════════════════════════════════════════════════════════
# Clasificación de pruebas: categoría de comparación + sector para la web
# ══════════════════════════════════════════════════════════════════════════

def categoria_prueba(nombre, es_maraton_tipo):
    """Determina cómo hay que comparar las marcas de esta prueba."""
    if es_maraton_tipo:
        return "maraton_tipo"
    n = nombre.lower()
    if any(p in n for p in ("decathlon", "heptath", "heptatlon", "pentatlon", "pentathlon")):
        return "combinada"
    if any(p in n for p in ("longitud", "altura", "pértiga", "pertiga", "triple", "peso", "disco", "jabalina", "martillo")):
        return "campo"
    if "marathon" in n or "maraton" in n:
        return "horas"
    if "volta" in n or "marcha" in n or "obst" in n:
        return "largo"
    m = re.match(r"\s*(\d+)", n.replace(".", "").replace(",", ""))
    distancia = int(m.group(1)) if m else None
    if distancia is not None and distancia <= 400:
        return "corto"
    return "largo"


def sector_prueba(nombre, categoria, es_maraton_tipo):
    n = nombre.lower()
    if categoria == "combinada":
        return "combinadas"
    if any(p in n for p in ("longitud", "altura", "pértiga", "pertiga", "triple")):
        return "saltos"
    if any(p in n for p in ("peso", "disco", "jabalina", "martillo")):
        return "lanzamientos"
    if es_maraton_tipo or categoria == "horas" or "volta" in n or "marcha" in n:
        return "ruta_marcha"
    if categoria == "corto":
        return "velocidad"
    return "medio_fondo"


def distancia_orden(nombre):
    """Número inicial de la prueba (para ordenar dentro de un sector); 9999 si no tiene."""
    m = re.match(r"\s*(\d+)", nombre.lower().replace(".", "").replace(",", ""))
    return int(m.group(1)) if m else 9999


# ══════════════════════════════════════════════════════════════════════════
# Parseo de marcas para poder compararlas y ordenarlas correctamente
# ══════════════════════════════════════════════════════════════════════════

def extraer_grupos_numericos(marca_raw):
    """Extrae la parte numérica inicial de una marca (ignora anotaciones
    posteriores como viento, '* PC', 'manual', etc.) y la separa en grupos
    por cualquiera de los separadores usados en el Excel."""
    if not marca_raw:
        return None
    s = marca_raw.strip()
    # normalizar separadores repetidos por error de tecleo (ej "9''31" -> "9'31")
    s = re.sub(rf"[{SEPARADORES}]{{2,}}", "'", s)
    m = re.match(rf"(\d+(?:[{SEPARADORES}]\d+)*)", s)
    if not m:
        return None
    return re.split(rf"[{SEPARADORES}]", m.group(1))


def _valor_tiempo(grupos, categoria):
    n = len(grupos)
    if n == 1:
        return float(grupos[0])
    if n == 2:
        if categoria == "corto":
            enteros = int(grupos[0])
            if enteros > 100:  # nadie corre esa prueba en >100s: en realidad es min.seg
                return enteros * 60 + int(grupos[1])
            return enteros + int(grupos[1]) / (10 ** len(grupos[1]))
        return int(grupos[0]) * 60 + int(grupos[1])  # 'largo': minutos.segundos
    # 3+ grupos: minutos . segundos . centésimas
    minutos, segundos = int(grupos[0]), int(grupos[1])
    frac = int(grupos[2]) / (10 ** len(grupos[2])) if len(grupos) > 2 else 0
    return minutos * 60 + segundos + frac


def _valor_horas(grupos):
    n = len(grupos)
    if n == 1:
        return int(grupos[0]) * 3600
    if n == 2:
        return int(grupos[0]) * 3600 + int(grupos[1]) * 60
    return int(grupos[0]) * 3600 + int(grupos[1]) * 60 + int(grupos[2])


def _valor_campo_o_combinada(grupos):
    if len(grupos) == 1:
        return float(grupos[0])
    return float(f"{grupos[0]}.{grupos[1]}")


def _valor_maraton_tipo(marca_raw):
    """Formato 'Xh MM' SS'' ' usado en Maratón/Volta con columnas de Atleta+Apellidos."""
    if not marca_raw:
        return None
    m = re.match(r"\s*(\d+)\s*h[.\s]*(\d+)['’]\s*(\d+)", marca_raw, re.IGNORECASE)
    if m:
        h, mi, s = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return h * 3600 + mi * 60 + s
    return None


def valor_comparacion(marca_raw, categoria):
    """Valor numérico para ORDENAR (siempre ascendente: menor = mejor).
    Para categorías donde mayor es mejor (campo/combinada) se devuelve
    negativo, así toda la lógica de ordenación es uniforme."""
    if categoria == "maraton_tipo":
        val = _valor_maraton_tipo(marca_raw)
        return val
    grupos = extraer_grupos_numericos(marca_raw)
    if not grupos:
        return None
    try:
        if categoria in ("campo", "combinada"):
            return -_valor_campo_o_combinada(grupos)
        if categoria == "horas":
            return _valor_horas(grupos)
        return _valor_tiempo(grupos, categoria)
    except (ValueError, IndexError):
        return None


def recalcular_puestos(entradas, categoria):
    """Reordena las entradas por marca real y recalcula el puesto (ranking
    de competición: los empates comparten puesto y el siguiente distinto
    salta el hueco, p.ej. 1,2,2,4)."""
    con_valor, sin_valor = [], []
    for e in entradas:
        val = valor_comparacion(e["marca"], categoria)
        (con_valor if val is not None else sin_valor).append((val, e))

    con_valor.sort(key=lambda t: t[0])

    resultado = []
    puesto_actual = 0
    valor_anterior = None
    for i, (val, e) in enumerate(con_valor, start=1):
        if valor_anterior is None or abs(val - valor_anterior) > 1e-6:
            puesto_actual = i
        e["puesto"] = str(puesto_actual)
        resultado.append(e)
        valor_anterior = val

    for _, e in sin_valor:
        e["puesto"] = ""
        resultado.append(e)

    return resultado


# ══════════════════════════════════════════════════════════════════════════
# Corrección específica: "VOLTA A PEU" masculino tiene columnas desplazadas
# (la cabecera dice nombre|marca|año nac.|fecha pero los datos reales son
# nombre|año edición|edición romana|marca|lugar|puesto top-10 ese año).
# Se detecta por contenido: si la col2 parece un año y la col3 NO es numérica.
# ══════════════════════════════════════════════════════════════════════════

def bloque_volta_peu_desplazado(sh, primera_fila_datos):
    c2 = cellv(sh, primera_fila_datos, 2)
    c3 = cellv(sh, primera_fila_datos, 3)
    try:
        es_anyo = 1990 <= int(c2) <= 2035
    except ValueError:
        es_anyo = False
    return es_anyo and not _es_num(c3)


# ══════════════════════════════════════════════════════════════════════════
# Parseo de cada libro
# ══════════════════════════════════════════════════════════════════════════

def parse_libro(path, deducidos=None):
    deducidos = deducidos or {}
    book = xlrd.open_workbook(path)
    sh = book.sheets()[0]
    dm = book.datemode

    headers = [r for r in range(sh.nrows) if is_header(sh, r)]
    pruebas = []
    avisos = []

    for i, hr in enumerate(headers):
        fin = headers[i + 1] if i + 1 < len(headers) else sh.nrows
        nombre = deducidos.get(hr) or nombre_encima(sh, hr)
        if not nombre:
            nombre = f"Prueba (fila {hr})"

        maraton = is_maraton_header(sh, hr)
        es_volta_peu = "volta" in nombre.lower() and "peu" in nombre.lower()
        desplazado = False
        if es_volta_peu and not maraton:
            primera = hr + 1
            while primera < fin and not cellv(sh, primera, 1):
                primera += 1
            if primera < fin:
                desplazado = bloque_volta_peu_desplazado(sh, primera)

        entradas = []
        for dr in range(hr + 1, fin):
            if is_header(sh, dr):
                continue
            c0 = cellv(sh, dr, 0)
            c1 = cellv(sh, dr, 1)
            c2 = cellv(sh, dr, 2)
            if c0 and not c0.isdigit() and not c1 and not c2:
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
                    "fecha": cellv(sh, dr, 4),
                    "lugar": cellv(sh, dr, 5),
                    "extra": " · ".join(extra_parts),
                }
            elif desplazado:
                # nombre | año edición | edición (romano) | MARCA REAL | (vacío) | puesto top-10
                edicion = cellv(sh, dr, 3)
                top10 = cellv(sh, dr, 6)
                extra_parts = []
                if edicion:
                    extra_parts.append(f"Edición {edicion}")
                if top10:
                    extra_parts.append(f"Entre los 10 primeros ese año: {top10}")
                entrada = {
                    "puesto": c0,
                    "nombre": c1,
                    "marca": cellv(sh, dr, 4, dm),
                    "anyo_nac": "",
                    "fecha": cellv(sh, dr, 2),  # año de la edición
                    "lugar": cellv(sh, dr, 5),
                    "extra": " · ".join(extra_parts),
                }
            else:
                extras = [conv_fecha(sh, dr, c, dm) for c in range(6, sh.ncols)]
                extras = [e for e in extras if e]
                entrada = {
                    "puesto": c0,
                    "nombre": c1,
                    "marca": cellv(sh, dr, 2, dm),
                    "anyo_nac": cellv(sh, dr, 3),
                    "fecha": conv_fecha(sh, dr, 4, dm),
                    "lugar": cellv(sh, dr, 5),
                    "extra": " · ".join(extras),
                }
            entradas.append(entrada)

        if entradas:
            cat = categoria_prueba(nombre, maraton)
            sector = sector_prueba(nombre, cat, maraton)
            entradas = recalcular_puestos(entradas, cat)

            # aviso de marcas que no se han podido interpretar (quedan sin puesto)
            sin_marca_real = [e for e in entradas if e["puesto"] == "" and e["marca"]]
            for e in sin_marca_real:
                avisos.append(f"  {os.path.basename(path)} / {nombre}: no se pudo interpretar la marca '{e['marca']}' de {e['nombre']}")

            pruebas.append({
                "prueba": nombre,
                "tipo": "maraton" if maraton else "estandar",
                "sector": sector,
                "orden": distancia_orden(nombre),
                "entradas": entradas,
            })

    pruebas.sort(key=lambda p: (SECTOR_ORDEN.get(p["sector"], 99), p["orden"]))
    return pruebas, avisos


SECTOR_ORDEN = {
    "velocidad": 0,
    "medio_fondo": 1,
    "ruta_marcha": 2,
    "saltos": 3,
    "lanzamientos": 4,
    "combinadas": 5,
}


def main():
    masculino, avisos_m = parse_libro(os.path.join(BASE, "Ranking web.xls"))
    femenino, avisos_f = parse_libro(os.path.join(BASE, "Ranking FEMENI.xls"), NOMBRES_DEDUCIDOS_FEM)

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

    avisos = avisos_m + avisos_f
    if avisos:
        print(f"\nAVISOS ({len(avisos)}) - marcas que no se han podido interpretar (quedan sin puesto, al final de su prueba):")
        for a in avisos:
            print(a)
    else:
        print("\nTodas las marcas se han podido interpretar y ordenar correctamente.")


if __name__ == "__main__":
    main()
