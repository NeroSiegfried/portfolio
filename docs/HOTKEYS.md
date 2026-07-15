# Blog Admin Hotkeys

This file documents hidden blog hotkeys for the author/admin workflow.

## Default Behavior

- **Admin entry hotkey**: `Meta+Shift+L` (default) opens the hidden admin entry path.
- **Hotkey customization hotkey**: `Meta/Ctrl+Shift+H` opens the local hotkey customization dialog.

## Where It Is Implemented

- `components/admin-entry-hotkey.tsx`

## Notes

- The active hotkey is stored in browser `localStorage` under:
  - `portfolio_admin_hotkey`
- Hidden URL path is configured via environment variable:
  - `NEXT_PUBLIC_ADMIN_ENTRY_PATH`
- If `NEXT_PUBLIC_ADMIN_ENTRY_PATH` is different from `/control`, middleware rewrites it to `/control`.
