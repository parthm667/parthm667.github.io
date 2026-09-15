# parthm667.github.io

Parth Mhaske's personal site. React + Vite, hosted on GitHub Pages.

## Homepage

A fullscreen terminal and an Ubuntu Files-style browser share a
fictional home directory at `/home/parth`. The switch at the top keeps
the current folder. Terminal history stays available when switching views.

The opening text types in once. Click `skip intro` or press Escape/Enter to
skip it. Reduced-motion preferences bypass the animation.

The terminal uses xterm.js with a fixed character grid, Ubuntu Mono, a block
cursor, a near-black background, white text, muted blue folders, and scrollback. Its layout follows
[GNOME Terminal](https://help.gnome.org/gnome-terminal/introduction.html).
The intro is a `cat about.txt` and `ls` session typed into that same buffer.
Plain `ls` shows filenames in columns; `ls -l` shows Unix-style metadata.

Commands: `help`, `ls`, `cd`, `pwd`, `cat`, `open`, `xdg-open`, `tree`,
`whoami`, `clear`, and `explorer`. Paths and commands are case-sensitive.
Tab completes commands and paths; arrow keys recall commands. Shift+Tab
moves keyboard focus out of the prompt. `rm` is a harmless easter egg.
Typing a folder name, such as `writing`, enters it. `ls writing` only lists
that folder; read its essay shortcut with `cat writing/road_design.url`.

There are also a few command-line easter eggs: `sudo`, `cowsay`, `fortune`,
`sl`, `exit`, `vim`, and `neofetch`. They print into the terminal without
changing files or leaving the page.

The file browser uses an icon grid by default, Ubuntu fonts, and the official
Yaru folder/document icons. It supports breadcrumbs, back/forward/up,
folder search, list/grid views, and file previews in a dialog. Files and
folders open with a single click; Escape closes a preview.

Yaru icons are licensed under CC BY-SA 4.0; attribution and the license
are in `public/icons/yaru/`. Ubuntu fonts use the Ubuntu Font Licence,
included in `public/fonts/`.

### Editing content

Edit `src/desktop/filesystem.js`. Both views read the same data:

- Folder: `name`, `description`, `type: 'folder'`, `children`.
- Text file: `name`, `description`, `type: 'file'`, `content`.
- Link: `name`, `description`, `type: 'link'`, `href`.

Project folders contain `readme.md` and a source shortcut when available.
The résumé is `public/resume.pdf`.

### Source

- `Desktop.jsx`: view switch and shared navigation.
- `Terminal.jsx`: xterm lifecycle, startup, and command interaction.
- `terminalSession.js`: shell session, cursor redraw, and startup playback.
- `terminalInput.js`: line editing and history.
- `terminalFormat.js`: ANSI prompts and command output.
- `Explorer.jsx`: file browsing and previews.
- `FileContent.jsx`: Explorer previews and links.
- `shell.js`: command parsing; no system commands are executed.
- `filesystem.js`: content and path handling.
- `desktop.css`: styles scoped to the homepage.

## Other pages

- `/public_remediation`: street-design essay.
- `/scavenger-hunt/`: HTML/CSS scavenger hunt.
- `/goose-chase/`: encrypted puzzle sequence. See `tools/README.md`.

GitHub Pages routing uses `public/404.html` and the restore script in
`index.html`.

## Development

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
```

Browser tests cover desktop and mobile:

```sh
npx playwright install chromium --only-shell
npm run test:e2e
```

`npm run deploy` builds and publishes to the `gh-pages` branch.
