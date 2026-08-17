# Plan - Add About Us and Privacy Policy Pages

Add "About Us" and "Privacy Policy" pages to improve AdSense compliance and provide user information.

## User Review Required

> [!IMPORTANT]
> The content for these pages will be in Arabic as the primary audience appears to be Arabic-speaking (based on existing site content and request).

## Proposed Changes

### Content & Localization
- Add `about_us`, `privacy_policy`, `about_content`, and `privacy_content` keys to the i18n dictionary in `src/lib/i18n.tsx`.
- Create new routes for these pages.

### New Pages
- `src/routes/about.tsx`: Page explaining the Filmak project (AI movie recommender).
- `src/routes/privacy.tsx`: Privacy policy detailing data usage (TMDB, local storage, basic analytics).

### Navigation
- Add links to these pages in the `BottomNav` or a new `Footer` section in `src/routes/__root.tsx`.
- Since the site uses a mobile-first `BottomNav` and a sticky `TopBar`, I'll add a minimal footer to the `__root.tsx` layout that is visible at the bottom of the page content.

## Technical Details

### New Routes
- `/about`: Publicly accessible.
- `/privacy`: Publicly accessible.

### Footer Implementation
- Add a `<footer>` tag at the bottom of the `RootComponent` in `src/routes/__root.tsx`, before the `BottomNav` (which is fixed).
- The footer will contain semantic links to the new pages.
