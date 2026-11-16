# Nebula

Je persoonlijke Jarvis op de Mac: je Obsidian-vault als levend universum, en een assistent die echt dingen doet.

**Privé.** Deze app wordt niet gepubliceerd. Je notes, chats en geheugen blijven op je Mac.

## Installeren / bijwerken

```bash
cd ~/nebula-src && git pull && cd nebula && npm install && npm run install-app
```

## Hey Nebula

`⌥ Spatie` (overal op je Mac; is die al bezet, dan `⌥⇧ Spatie`), `/` of `⌘J` in de app, of het veld op Home. Dicteren: 2× `fn`.

Nebula draait op **Claude Code** (`claude -p`, je eigen abonnement, geen API-key) en mag alleen de Nebula-tools en websearch gebruiken:

- **Herinneringen**: "herinner me over 5 min dat Karen haar pillen moet nemen" → Apple Herinneringen, via iCloud met melding op je iPhone.
- **Agenda**: "volgende week maandag om 10u een meeting, herinner me een week ervoor" → Apple Agenda met melding vooraf. "Wat staat er morgen?" leest je agenda en open herinneringen.
- **Apps**: "open Premiere Pro".
- **Vault**: zoeken, lezen, schrijven, iets in je daily note zetten.
- **Geheugen**: vertel je iets ("ik ga volgende week skiën"), dan wordt het een feit in `Nebula/Geheugen.md` (met einddatum). Elk gesprek leest dat terug. Je kunt het bestand zelf aanpassen.

De eerste keer vraagt macOS of Nebula Herinneringen en Agenda mag bedienen. Kies **Sta toe**.

## Claude overal

De ingebouwde MCP-server (`mcp/server.js`) geeft Claude Desktop en Claude Code dezelfde tools: `nebula_overview`, `nebula_search`, `nebula_read`, `nebula_write`, `nebula_capture`, `nebula_save_chat`, `nebula_show`, `nebula_memory`, `nebula_remember`, `nebula_forget`, `nebula_reminder`, `nebula_event`, `nebula_agenda`, `nebula_open_app`.

- **Claude Desktop** wordt bij de eerste start verbonden (backup: `claude_desktop_config.json.backup`).
- **Claude Code-chats** (`~/.claude/projects`) komen automatisch in `Claude Chats/Claude Code`.
- **claude.ai- en Desktop-chats**: daar bestaat geen API voor. Alleen de handmatige export (claude.ai → Instellingen → Privacy → Exporteer data) werkt: zodra de zip in Downloads staat, importeert Nebula hem. Chats die je daar later verwijdert of archiveert, blijven in je vault staan, want Nebula kan dat niet zien.

## Universum

Elke map is een sterrenstelsel, elke note een ster, elke `[[link]]` een lichtspoor. Klik een ster voor de preview → *Open in Obsidian*. Tijdlijn ▶ laat je vault groeien. Opnemen zet een video in je Films-map, `H` = clean view. Live: wat je in Obsidian verandert, verschijnt meteen.
