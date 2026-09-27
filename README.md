# Zuordnen

Kinder-PWA zum Zuordnen und Verbinden — Finger zeichnet eine sichtbare Linie — fürs iPad.

## Öffnen

**https://muellkuebel.github.io/Zuordnen/**

Auf dem iPad: Safari → Teilen → Zum Home-Bildschirm.

## Übungen

1. **Bunte Bonbons** — Bonbons mit dem Finger zum farblich passenden Korb verbinden (mehrere Bonbons pro Korb)
2. **Schneemänner** — Mützen mit dem Schneemann verbinden, dessen Schal dieselben Farben hat (1:1)

**Interaktion:** Finger vom Objekt zum Ziel ziehen; die Linie wird live mitgezeichnet.  
Richtig = grüne Linie bleibt + grüner Haken. Falsch = Linie verschwindet, leichtes Wackeln.

## Portrait only

Die UI ist fest auf **Hochformat (3:4)** ausgelegt (`manifest.orientation: portrait`).  
Bei Querformat bleibt dieselbe aufrechte Portrait-UI; links/rechts erscheint schwarzes Bezel (Pillarbox). Kein Landscape-Layout.

## Technik

Statisches HTML/CSS/JS, PWA-Manifest, Service Worker (`zuordnen-v3`, Offline), eigene einfache SVG-Motive.

## Dateien

- `index.html` — Start + Übungs-Shell
- `styles.css` — schwarzes Bezel, große Touch-Targets, Portrait-Shell
- `app.js` — Finger-Zeichnen, Matching-Logik, Celebration
- `manifest.webmanifest` / `sw.js` / `icons/`
