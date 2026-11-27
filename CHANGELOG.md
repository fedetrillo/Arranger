# Changelog

## 1.0.2 — 2026-11-26

- **Fixed on Windows:** LUNA on Windows sizes the page to the window's outer size, title bar and frame included, so the bottom 39 px and the right 16 px were hidden. The page now leaves that space out on Windows, so everything at the bottom and right edges shows in full.
  the part you can see, so the controls at the bottom were hidden. The page now fits itself to
  the window size LUNA reports; nothing changes where the two match.
- **Report copy:** Alt-click on the version now always says in the status bar that the report was copied. Where the system clipboard is blocked (seen on some Windows set-ups) it uses a fallback, and if that fails too it shows the report selected so you can copy it by hand.

## 1.0.1 — 2026-11-25

- A short getting-started guide: the first time it opens it asks for your language, then walks
  you through the window in it. The **Guide** button brings it back.

## 1.0.0 — 2026-11-23

- First release: song sections from markers; drag to move, Alt-drag to copy, duplicate, copy
  and paste, remove, on every track at once with audio, MIDI and automation.
- Snapshots: the song is kept as a protected Original on the first change; snapshots are
  playlist versions plus markers, saved in the session, switched with one click.
- Right-click menu, keyboard shortcuts, vivid colours per section.
- Dark and grey themes, 7 languages, Alt-click the version for a support report.
