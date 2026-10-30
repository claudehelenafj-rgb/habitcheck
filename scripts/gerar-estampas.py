"""Gera src/estilos/estampas.css com as estampas do Caderninho (SVG em data URI).

Rodar com:  python3 scripts/gerar-estampas.py
Tudo usa só as cores da paleta. Os sorteios usam semente fixa: o resultado é sempre igual.
"""

import math
import random
from pathlib import Path
from urllib.parse import quote

CHOC = '#422F0E'
CREME = '#FBF6EE'
LAVANDA, AZUL, PESSEGO, MANTEIGA, MENTA, MORANGO = '#F9D4F8', '#AECFD0', '#FFD094', '#F7E9B2', '#DDF2B8', '#FCC4C0'
ROSA, TOMATE, LARANJA, PISCINA, AGUA = '#EA5E86', '#EF6545', '#F49625', '#037F71', '#57B1A8'
# tema Índigo
NOITE, INDIGO, AZUL_LAVANDA, MOSTARDA, AMEIXA = '#1E2350', '#3949A3', '#D9DDF5', '#E3A73B', '#8A5A9E'


def uri(svg: str) -> str:
    return 'url("data:image/svg+xml,' + quote(svg, safe=" =:/'(),.-") + '")'


def svg(w: int, h: int, corpo: str) -> str:
    return f"<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}'>{corpo}</svg>"


def repetido(w, h, x, y, desenho, margem=22):
    """Desenha também do outro lado da borda quando a forma encosta nela, para a estampa emendar sem costura."""
    return ''.join(
        desenho(x + dx * w, y + dy * h)
        for dx in (-1, 0, 1)
        for dy in (-1, 0, 1)
        if -margem <= x + dx * w <= w + margem and -margem <= y + dy * h <= h + margem
    )


def coracoes():
    return svg(44, 44, f"<path d='M11 17s-7-4-7-9a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 5-7 9-7 9z' fill='{ROSA}'/>"
                       f"<path d='M33 39s-5-3-5-6.5a2.5 2.5 0 0 1 5-.7 2.5 2.5 0 0 1 5 .7c0 3.5-5 6.5-5 6.5z' fill='{MORANGO}'/>")


def cerejas():
    return svg(52, 52, f"<path d='M10 16c1-5 4-9 9-11M20 15c-1-4-1-7-1-10' fill='none' stroke='{CHOC}' stroke-width='1.5' stroke-linecap='round'/>"
                       f"<path d='M19 5c3-2 6-1 7 1-3 1-5 1-7-1z' fill='{MENTA}'/><circle cx='10' cy='18' r='4.5' fill='{TOMATE}'/>"
                       f"<circle cx='20' cy='17' r='4.5' fill='{TOMATE}'/><circle cx='40' cy='42' r='3' fill='{MORANGO}'/>")


def estrelas():
    return svg(48, 48, f"<path d='M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z' fill='{MANTEIGA}' stroke='{CHOC}' stroke-width='1' stroke-linejoin='round'/>"
                       f"<path d='M36 30l1.5 3.2 3.5.5-2.5 2.4.6 3.5-3.1-1.7-3.1 1.7.6-3.5-2.5-2.4 3.5-.5z' fill='{PESSEGO}'/>"
                       f"<circle cx='38' cy='10' r='1.6' fill='{LARANJA}'/><circle cx='10' cy='38' r='1.2' fill='{LARANJA}'/>")


def ondas():
    return svg(40, 20, f"<path d='M0 10c5 0 5-6 10-6s5 6 10 6 5-6 10-6 5 6 10 6' fill='none' stroke='{AZUL}' stroke-width='2.5' stroke-linecap='round'/>")


def caderno():
    return svg(28, 28, f"<path d='M0 27.5h28' stroke='{AZUL}' stroke-width='1'/>")


def flores_retro():
    """Florzinhas de cinco pétalas redondas, tamanhos variados, miolo creme."""
    w = h = 180
    rnd = random.Random(12)
    pos = [(30, 28, 15), (118, 20, 9), (82, 78, 13), (160, 92, 10), (24, 118, 9), (124, 150, 14), (58, 160, 8), (170, 165, 7)]

    def flor(cx, cy, r, giro):
        petalas = ''.join(
            f"<circle cx='{cx + r * 0.62 * math.cos(giro + k * 2 * math.pi / 5):.1f}' cy='{cy + r * 0.62 * math.sin(giro + k * 2 * math.pi / 5):.1f}' r='{r * 0.5:.1f}'/>"
            for k in range(5)
        )
        return f"<g fill='{TOMATE}'>{petalas}<circle cx='{cx}' cy='{cy}' r='{r * 0.55:.1f}'/></g><circle cx='{cx}' cy='{cy}' r='{r * 0.24:.1f}' fill='{CREME}'/>"

    corpo = ''
    for x, y, r in pos:
        giro = rnd.uniform(0, math.pi)
        corpo += repetido(w, h, x, y, lambda a, b: flor(a, b, r, giro))
    return svg(w, h, corpo)


def listras_a_mao():
    """Listras verticais tortinhas, verde-água sobre morango-claro."""
    w, h = 36, 240
    rnd = random.Random(5)
    n = 12
    esquerda = [(10 + rnd.uniform(-1.2, 1.2), i * h / n) for i in range(n)]
    direita = [(26 + rnd.uniform(-1.2, 1.2), i * h / n) for i in range(n)]
    # fecha no mesmo x do começo para emendar na vertical
    esquerda.append((esquerda[0][0], h))
    direita.append((direita[0][0], h))
    pts = esquerda + list(reversed(direita))
    d = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
    return svg(w, h, f"<rect width='{w}' height='{h}' fill='{MORANGO}'/><path d='{d}' fill='{AGUA}'/>")


def confete():
    """Serpentinas, espirais, ondinhas, tracinhos e pontinhos."""
    w = h = 200
    rnd = random.Random(21)
    cores = [ROSA, LARANJA, AGUA, TOMATE, AZUL, LAVANDA, MENTA, PESSEGO]
    cores_traco = [ROSA, LARANJA, AGUA, TOMATE, PISCINA]
    formas = {
        'mola': 'M0 6c3-8 9-8 7 0-1 5-5 2-2-3 4-6 9-5 7 2-1 5-5 2-2-3 4-6 9-5 8 3',
        'onda': 'M0 0q3 7 6 0t6 0 6 0',
        'espiral': 'M0 0a2 2 0 1 1 2 2a4.5 4.5 0 1 1 -4.5 -4.5a7 7 0 1 1 7 7',
        'cacho': 'M0 0c6-6 10 2 4 5s-2-9 5-8 6 8 0 9',
    }
    itens = [
        ('mola', 22, 24), ('espiral', 92, 26), ('onda', 150, 18), ('cacho', 40, 82), ('mola', 120, 80),
        ('onda', 178, 110), ('espiral', 26, 150), ('mola', 82, 140), ('cacho', 150, 160), ('onda', 60, 190),
    ]
    corpo = ''
    for i, (nome, x, y) in enumerate(itens):
        cor = cores_traco[i % len(cores_traco)]
        giro = rnd.randint(-60, 60)
        corpo += repetido(w, h, x, y, lambda a, b: (
            f"<path d='{formas[nome]}' transform='translate({a} {b}) rotate({giro}) scale(1.5)' fill='none' stroke='{cor}' "
            f"stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/>"))
    for _ in range(26):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        cor = rnd.choice(cores)
        if rnd.random() < 0.5:
            corpo += repetido(w, h, x, y, lambda a, b: f"<circle cx='{a:.1f}' cy='{b:.1f}' r='2.4' fill='{cor}'/>")
        else:
            g = rnd.randint(0, 180)
            corpo += repetido(w, h, x, y, lambda a, b: (
                f"<path d='M-4 0h8' transform='translate({a:.1f} {b:.1f}) rotate({g})' stroke='{cor}' stroke-width='3' stroke-linecap='round'/>"))
    return svg(w, h, corpo)


def oncinha():
    """Oncinha: fundo pêssego, rosetas em chocolate com miolo laranja."""
    w = h = 160
    rnd = random.Random(8)

    def mancha(cx, cy, r):
        pts = []
        for k in range(7):
            a = k / 7 * 2 * math.pi
            rr = r * rnd.uniform(0.7, 1.15)
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a) * 0.85))
        # curva suave passando pelos pontos médios de cada lado
        d = ''.join(
            f'Q{x1:.1f} {y1:.1f} {(x1 + x2) / 2:.1f} {(y1 + y2) / 2:.1f}'
            for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1])
        )
        primeiro = ((pts[-1][0] + pts[0][0]) / 2, (pts[-1][1] + pts[0][1]) / 2)
        return f'M{primeiro[0]:.1f} {primeiro[1]:.1f}' + d + 'Z'

    corpo = f"<rect width='{w}' height='{h}' fill='{PESSEGO}'/>"
    centros = [(20, 22), (72, 14), (128, 30), (44, 66), (100, 72), (150, 84), (18, 112), (70, 120), (124, 132), (96, 156), (36, 148), (152, 140)]
    for cx, cy in centros:
        r = rnd.uniform(8, 11)
        miolo = mancha(0, 0, r * 0.85)
        # anel quebrado: 3 ou 4 arcos grossos em volta do miolo
        pedacos = ''
        inicio = rnd.uniform(0, 2 * math.pi)
        partes = rnd.choice([3, 4])
        for k in range(partes):
            a1 = inicio + k * 2 * math.pi / partes + rnd.uniform(0, 0.25)
            a2 = a1 + 2 * math.pi / partes - rnd.uniform(0.3, 1.1)
            rr = r * rnd.uniform(0.9, 1.2)
            x1, y1 = rr * math.cos(a1), rr * math.sin(a1) * 0.85
            x2, y2 = rr * math.cos(a2), rr * math.sin(a2) * 0.85
            pedacos += (f"<path d='M{x1:.1f} {y1:.1f}A{rr:.1f} {rr * 0.85:.1f} 0 0 1 {x2:.1f} {y2:.1f}' fill='none' "
                        f"stroke='{CHOC}' stroke-width='{r * rnd.uniform(0.62, 0.85):.1f}' stroke-linecap='round'/>")
        roseta = f"<path d='{miolo}' fill='{LARANJA}'/>{pedacos}"
        corpo += repetido(w, h, cx, cy, lambda a, b: f"<g transform='translate({a} {b})'>{roseta}</g>")
    for _ in range(12):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        pinta = mancha(0, 0, rnd.uniform(3.5, 6))
        corpo += repetido(w, h, x, y, lambda a, b: f"<path d='{pinta}' transform='translate({a:.1f} {b:.1f})' fill='{CHOC}'/>")
    return svg(w, h, corpo)


def patinhas():
    """Patinhas em aquarela: almofada + 4 dedinhos, cores suaves e levemente transparentes."""
    w = h = 170
    rnd = random.Random(31)
    cores = [AMEIXA, TOMATE, MOSTARDA, PISCINA]
    pos = [(28, 30), (100, 22), (150, 70), (62, 88), (126, 130), (30, 146), (86, 160)]

    def borrao(cx, cy, rx, ry):
        pts = []
        for k in range(9):
            a = k / 9 * 2 * math.pi
            f = rnd.uniform(0.88, 1.1)
            pts.append((cx + rx * f * math.cos(a), cy + ry * f * math.sin(a)))
        d = ''.join(f'Q{x1:.1f} {y1:.1f} {(x1 + x2) / 2:.1f} {(y1 + y2) / 2:.1f}' for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]))
        ini = ((pts[-1][0] + pts[0][0]) / 2, (pts[-1][1] + pts[0][1]) / 2)
        return f'M{ini[0]:.1f} {ini[1]:.1f}{d}Z'

    corpo = ''
    for i, (x, y) in enumerate(pos):
        cor = cores[i % len(cores)]
        giro = rnd.randint(-40, 40)
        pata = borrao(0, 5, 8, 6.5) + ''.join(borrao(dx, dy, 3, 3.6) for dx, dy in [(-9, -5), (-3.5, -10), (3.5, -10), (9, -5)])
        corpo += repetido(w, h, x, y, lambda a, b: (
            f"<path d='{pata}' transform='translate({a} {b}) rotate({giro})' fill='{cor}' fill-opacity='0.55'/>"))
    return svg(w, h, corpo)


def rabiscos():
    """Rabiscos de caneta: molinhas, zigue-zagues, laços e pontinhos em índigo."""
    w = h = 180
    rnd = random.Random(44)
    formas = [
        'M0 0c4-8 10-8 8 0s4 8 8 0 10-8 8 0',
        'M0 0l5-7 5 7 5-7 5 7 5-7',
        'M0 0c8-10 18-2 10 5s-14-6-2-10 14 6 12 12',
        'M0 0q6-9 12 0t12 0',
        'M0 0a5 5 0 1 1 5 5a8 8 0 1 1 -8 -8',
        'M0 0c3 4 7 4 9 0s6-4 9 0 6 4 9 0',
    ]
    itens = [(14, 18), (84, 12), (146, 34), (40, 66), (112, 78), (168, 112), (20, 120), (80, 132), (136, 160), (52, 170)]
    corpo = ''
    for i, (x, y) in enumerate(itens):
        d = formas[i % len(formas)]
        cor = INDIGO if i % 3 else NOITE
        giro = rnd.randint(-70, 70)
        corpo += repetido(w, h, x, y, lambda a, b: (
            f"<path d='{d}' transform='translate({a} {b}) rotate({giro})' fill='none' stroke='{cor}' "
            f"stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' stroke-opacity='0.7'/>"))
    for _ in range(14):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        corpo += repetido(w, h, x, y, lambda a, b: f"<circle cx='{a:.1f}' cy='{b:.1f}' r='1.6' fill='{INDIGO}' fill-opacity='0.7'/>")
    return svg(w, h, corpo)


def xadrez_a_mao():
    """Xadrez pintado à mão: quadrados com bordas tortinhas em índigo."""
    lado, n = 24, 4
    w = h = lado * n
    rnd = random.Random(23)
    corpo = ''
    for i in range(n):
        for j in range(n):
            if (i + j) % 2:
                continue
            x, y = i * lado, j * lado
            v = lambda: rnd.uniform(-1.6, 1.6)
            d = (f'M{x + v():.1f} {y + v():.1f}L{x + lado / 2 + v():.1f} {y + v():.1f}L{x + lado + v():.1f} {y + v():.1f}'
                 f'L{x + lado + v():.1f} {y + lado / 2 + v():.1f}L{x + lado + v():.1f} {y + lado + v():.1f}'
                 f'L{x + lado / 2 + v():.1f} {y + lado + v():.1f}L{x + v():.1f} {y + lado + v():.1f}L{x + v():.1f} {y + lado / 2 + v():.1f}Z')
            corpo += f"<path d='{d}' fill='{INDIGO}' fill-opacity='{rnd.uniform(0.62, 0.8):.2f}'/>"
    return svg(w, h, corpo)


ESTAMPAS = {
    'coracoes': (coracoes(), None),
    'cerejas': (cerejas(), None),
    'estrelas': (estrelas(), None),
    'ondas': (ondas(), None),
    'caderno': (caderno(), None),
    'flores': (flores_retro(), '120px'),
    'listras': (listras_a_mao(), '24px 160px'),
    'confete': (confete(), '170px'),
    'oncinha': (oncinha(), '150px'),
    'patinhas': (patinhas(), '150px'),
    'rabiscos': (rabiscos(), '160px'),
    'xadrez-mao': (xadrez_a_mao(), '72px'),
}

CABECALHO = """/*
 * Estampas do Caderninho. ARQUIVO GERADO por scripts/gerar-estampas.py: edite o script, não este arquivo.
 *
 * Use .estampa + .estampa-<nome>, ou .estampa + .estampa-atual para a estampa escolhida nos ajustes.
 * A estampa fica numa camada atrás do conteúdo, com opacidade menor no modo escuro,
 * e some no modo calmo.
 */
.estampa {
  position: relative;
  isolation: isolate;
}
.estampa::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background-image: var(--estampa-imagem);
  background-size: var(--estampa-tamanho, auto);
  opacity: var(--estampa-opacidade, 0.9);
  pointer-events: none;
}
[data-modo='escuro'] .estampa::before {
  --estampa-opacidade: 0.45;
}
:root[data-calmo='sim'] .estampa::before {
  display: none;
}
"""

EXTRAS = """.estampa-bolinhas,
:root[data-estampa='bolinhas'] .estampa-atual {
  --estampa-imagem: radial-gradient(circle, var(--morango-claro) 3px, transparent 3.5px),
    radial-gradient(circle, var(--azul-nevoa) 3px, transparent 3.5px);
  --estampa-tamanho: 24px 24px;
}
.estampa-bolinhas::before,
:root[data-estampa='bolinhas'] .estampa-atual::before {
  background-position: 0 0, 12px 12px;
}
.estampa-xadrez,
:root[data-estampa='xadrez'] .estampa-atual {
  --estampa-imagem: repeating-linear-gradient(0deg, rgb(252 196 192 / 0.55) 0 12px, transparent 12px 24px),
    repeating-linear-gradient(90deg, rgb(252 196 192 / 0.55) 0 12px, transparent 12px 24px);
}
.estampa-caderno::before,
:root[data-estampa='caderno'] .estampa-atual::before {
  background-image: linear-gradient(90deg, transparent 2.4rem, rgb(234 94 134 / 0.5) 2.4rem 2.5rem, transparent 2.5rem),
    var(--estampa-imagem);
}
"""


def main():
    partes = [CABECALHO]
    for nome, (desenho, tamanho) in ESTAMPAS.items():
        partes.append(f".estampa-{nome},\n:root[data-estampa='{nome}'] .estampa-atual {{\n  --estampa-imagem: {uri(desenho)};\n")
        if tamanho:
            partes.append(f'  --estampa-tamanho: {tamanho};\n')
        partes.append('}\n')
    partes.append(EXTRAS)
    destino = Path(__file__).resolve().parent.parent / 'src' / 'estilos' / 'estampas.css'
    destino.write_text(''.join(partes), encoding='utf-8')
    print(f'{destino}: {destino.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
