# LUNGOUT – Web Arcade

Ein Breakout (Homage an Atari, 1976) für den Browser – reines HTML5/Canvas +
JavaScript, keine Frameworks, keine externen Dateien, funktioniert auch per
Doppelklick auf `index.html` (file://).

Das Steinfeld zeigt schematisch eine Lunge: **zwei Lungenflügel mit Luftröhre**,
und dein Schläger ist eine **Filterzigarette**. Jeder getroffene Stein löst sich
in Rauch auf – und der Qualm bleibt liegen.

## Starten

Einfach **`index.html` per Doppelklick** im Browser öffnen (Chrome/Edge/Firefox).
Optional mit kleinem Webserver:

```powershell
python -m http.server 8000    # dann http://localhost:8000
```

## Steuerung

| Aktion      | Tastatur                  | Touch/Maus                |
|-------------|---------------------------|---------------------------|
| Bewegen     | Pfeil ← → (oder A/D)      | Auf dem Spielfeld ziehen  |
| Abschuss    | Leertaste / Enter         | Auf dem Spielfeld tippen  |
| Start       | Leertaste                 | ANZÜNDEN-Button           |
| Pause       | P                         | –                         |
| Neustart    | R                         | –                         |
| Ton an/aus  | M                         | –                         |

## Eingebaute Mechaniken

- **Lungen-Layout aus Steinen**: Lungenflügel als Ziegelmaske, Luftröhre mit
  Knorpelringen, Carina, Y-förmige Hauptbronchien, Bronchiolen-Netz in den
  Flügeln, dazu Herzkerbe, Hilus und Lappenfurchen als Ausschnitte.
- **Filterzigarette als Schläger**: Filter mit Beschriftung, glühende Brandzone,
  herabfallende Asche, eigener Qualm. Pro verlorenem Ball brennt sie kürzer ab –
  vier Züge: 190 / 172 / 154 / 136 mm.
- **Auflösen in Rauch**: Treffer-Steine fallen unscharf auseinander und werden zu
  weichen Qualmwolken (Auftrieb, Kräuseln, Funken). Der Ball zieht ständig eine
  Rauchspur und löst sich beim Runterfallen vollständig in eine Wolke auf.
- **Smog-Ablagerung**: der Qualm lagert sich dauerhaft im Spielfeld ab und füllt
  das RAUCH-Meter im HUD.
- **Atelektase**: Räumst du einen Atemwegs-Stein (Luftröhre, Bronchien,
  Bronchiolen) aus, kollabiert das umliegende Gewebe mit – Kette mit halben
  Punkten und großen Rauchwolken.
- **Anti-Hänger**: nach rund 4,5 Sekunden ohne Treffer zieht der glühende Ball
  sanft zum nächsten verbliebenen Stein (dezent gestrichelt markiert).
- **Drei Level**: ab Level 2 verschleimte Steine mit 2 Treffern, +12 % Tempo pro
  Level, Level-Bonus, Punktwerte, Tagesbestwert im Browser-Speicher.
- Nur prozedural gezeichnet (High-DPI-Canvas, atmen-des Licht pulsierende
  Steine, gestrichelte Hilfslinien als Schema) und **Sound komplett per WebAudio
  synthetisiert** – komplett ohne externe Asset-Dateien, abschaltbar.

## Projektstruktur

```
index.html        – Spiel: Engine, Grafik, Audio und Anatomie-Maske in einer Datei
img/og-cover.png  – Social-Preview 1200x630 (og:image / twitter:image)
tools/og.html     – Cover-Seite, von der der Screenshot gemacht wird
tools/og.mjs      – baut tools/og.html aus dem Lungen-Layout von index.html
                    und rendert daraus img/og-cover.png (Headless-Chrome)
```

Cover bei Bedarf neu erzeugen:

```powershell
node tools\og.mjs
```

## Veröffentlichen

Auf den Server gehören nur **`index.html`** und **`img/og-cover.png`** – der
`tools/`-Ordner ist nur die Bauhilfe für das Vorschaubild. Die Meta-Tags zeigen
auf `https://www.lungout.de/`. Nach dem ersten Teilen in Facebook das Bild im
[Sharing Debugger](https://developers.facebook.com/tools/debug/) mit „Alles neu
abrufen" neu einlesen lassen.
