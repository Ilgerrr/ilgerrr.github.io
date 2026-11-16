# Nebula

Je Obsidian-vault als levend universum — en als brein. Gebouwd voor macOS.

- **Home**: begroeting, stats, gedachte vastleggen (gaat naar je daily note), recent, stelsels, activiteit.
- **Universum**: elke map is een sterrenstelsel, elke note een ster, elke `[[link]]` een lichtspoor. Klik een ster voor de preview → *Open in Obsidian*.
- **Brein**: alle deeltjes morphen naar een 3D-brein; elke map wordt een hersengebied.
- **Tijdlijn**: ▶ laat je vault groeien in de volgorde waarin je notes zijn ontstaan.
- **Opnemen**: neemt het universum op als video (komt in je Films-map). `H` = clean view.
- **Live**: wijzig iets in Obsidian en Nebula past zich direct aan.

## Installeren (één regel in Terminal)

```bash
A=$(uname -m); [ "$A" = x86_64 ] && A=x64; curl -fL -o /tmp/Nebula.zip "https://github.com/ilgerrr/ilgerrr.github.io/releases/download/nebula-latest/Nebula-$A-mac.zip" && rm -rf /Applications/Nebula.app && ditto -xk /tmp/Nebula.zip /Applications && xattr -cr /Applications/Nebula.app && open /Applications/Nebula.app
```

Dezelfde regel werkt ook om bij te werken. Of download de `.dmg` via de release *nebula-latest*.

Zelf bouwen: `cd nebula && npm install && npm start` (of `npm run install-app`).

## Claude

Nebula heeft een ingebouwde MCP-server, zodat Claude met je vault en de app kan praten:

| tool | wat |
|---|---|
| `nebula_overview` | overzicht van je vault |
| `nebula_search` / `nebula_read` | zoeken en lezen (incl. links) |
| `nebula_write` | notes maken / aanvullen |
| `nebula_capture` | gedachte in je daily note |
| `nebula_save_chat` | gesprek bewaren in *Claude Chats* |
| `nebula_show` | Nebula laten vliegen naar een note of naar het brein |

**Automatisch:**
- **Claude Desktop** wordt bij de eerste start van Nebula verbonden (backup: `claude_desktop_config.json.backup`). Herstart Claude één keer.
- **Claude Code-chats** (`~/.claude/projects`) komen vanzelf in `Claude Chats/Claude Code`, ook nieuwe.
- **claude.ai-chats**: vraag een export aan (claude.ai → Instellingen → Privacy → Exporteer data). Zodra de zip in Downloads staat, zet Nebula alle chats in `Claude Chats/claude.ai`.
- Elke chat wordt automatisch gelinkt aan de notes die erin genoemd worden.
- Claude Code verbinden: Instellingen → *Kopieer commando* → plak in Terminal.
