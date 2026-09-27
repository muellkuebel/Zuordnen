# Zuordnen

Kinder-PWA zum Zuordnen und Verbinden — Finger zeichnet eine sichtbare Linie — fürs iPad.

## Öffnen

**https://muellkuebel.github.io/Zuordnen/**

Auf dem iPad: Safari → Teilen → Zum Home-Bildschirm.

## Übungen

1. **Bunte Bonbons** — Bonbons mit dem Finger zum farblich passenden (gleichfarbigen) Korb verbinden (mehrere Bonbons pro Korb)
2. **Schneemänner** — Mützen mit dem Schneemann verbinden, dessen Schal dieselben Farben hat (1:1)
3. **Tiere zum Stall** — Kuh, Schwein, Huhn und Pferd zum Stall mit dem passenden Tierbild verbinden
4. **Formen zuordnen** — Kreis, Dreieck, Stern und Quadrat in den passenden Schatten legen
5. **Socken-Paare** — Socken mit gleichem Muster und Farbe zum Paar verbinden
6. **Zahlen und Mengen** — Punktmengen (2–5) mit der richtigen Zahl verbinden
7. **Kleidung zum Wetter** — Regenmantel, Sonnenhut, Schal und Badehose zum passenden Wetter verbinden
8. **Eins, zwei oder drei** — Segelschiffe (1/2/3) mit den passenden Fingern verbinden
9. **Zählen bis 3** — Gegenstände zählen und die passende Anzahl Kreise antippen (Ausfüllen)
10. **Blumenwiese** — Mit dem Finger einen Kreis um die 5 blauen Blumen zeichnen (Blau erkennen)
11. **Bunte Windräder** — Bunte Windräder mit dem farblich passenden Faltpapier verbinden (1:1)
12. **Doggys Entchen** — Bade-Entchen oben und unten nach Farbe verbinden (rosa/orange/gelb/hellblau, 1:1)
13. **Wo sind die Karotten?** — Suchbild: mit dem Finger die 5 Karotten im orangen Durcheinander einkreisen
14. **Versteckte Tiere** — Volle Tiere (Wurm, Igel, Maus, Schnecke) mit Blättern verbinden, hinter denen sie hervorlugen (1:1)
15. **Doggys Fußbälle** — Suchbild: mit dem Finger die 6 Fußbälle im Durcheinander einkreisen (Beachbälle, Orangenbälle, Schaf, Enten, Werkzeug, Mützen, Sonnenbrillen, Steine, Stöcke, Bausteine sind Ablenkung)

**Interaktion (Verbinden):** Finger vom Objekt zum Ziel ziehen; die Linie wird live mitgezeichnet.  
Während des Zeichnens ist die Linie schwarz; richtig = Linie wird grün und bleibt + kurzes weiches Bing. Falsch = Linie verschwindet, leichtes Wackeln. (Kein Haken mehr auf den Objekten — nur die Abschluss-Feier „Super gemacht!“.)

**Interaktion (Zählen bis 3):** Kreise antippen zum Ausfüllen/Toggle. Eine Reihe ist richtig, wenn die Anzahl gefüllter Kreise der Objektanzahl entspricht — Bing beim ersten Treffer einer Reihe. Alle Reihen richtig → „Super gemacht!“.

**Interaktion (Blumenwiese):** Mit dem Finger einen geschlossenen Kreis um eine Blume zeichnen (wie die Verbindungslinie, freihand). Nur wenn die Geste ungefähr eine Blume umschließt, erscheint ein sauberer Kreis. Blau = Kreis bleibt + Bing. Andere Farbe = kurzes Wackeln, kein Kreis. Alle 5 blauen eingekreist → „Super gemacht!“.

**Interaktion (Wo sind die Karotten?):** Wie Blumenwiese (circle-draw). Nur Karotten behalten den Kreis + Bing; Taschen, Flugzeuge, Kürbisse, Orangen, Socken, Würfel, Autos, Knöpfe, Pullover und Blume wackeln ohne Kreis. Alle 5 Karotten → „Super gemacht!“.

**Interaktion (Doggys Fußbälle):** Wie Blumenwiese (circle-draw). Nur die 6 schwarz-weißen Fußbälle behalten den Kreis + Bing; andere Bälle und Gegenstände wackeln ohne Kreis. Alle 6 → „Super gemacht!“.

## Portrait only

Die UI ist fest auf **Hochformat (3:4)** ausgelegt (`manifest.orientation: portrait`).  
Bei Querformat bleibt dieselbe aufrechte Portrait-UI; links/rechts erscheint schwarzes Bezel (Pillarbox). Kein Landscape-Layout.

## Technik

Statisches HTML/CSS/JS, PWA-Manifest, Service Worker (`zuordnen-v27`, Offline), eigene einfache SVG-Motive.

## Dateien

- `index.html` — Start + Übungs-Shell
- `styles.css` — Papier-Sticker Theme, große Touch-Targets, Portrait-Shell
- `app.js` — Finger-Zeichnen, Matching-Logik, Celebration
- `manifest.webmanifest` / `sw.js` / `icons/`
