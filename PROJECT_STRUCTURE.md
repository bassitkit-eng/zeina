# Project Structure

## Core folders

- `app/`: App Router pages and routes.
- `components/shared/`: Reusable UI blocks used across multiple pages.
- `features/home/`: Home-page specific constants and feature-level config.
- `lib/`: Shared data models and utilities.
- `public/images/`: Static images served directly by Next.js.
- `scripts/`: Project automation and quality checks.

## Current shared components

- `components/shared/AppHeader.tsx`: Unified top navigation and favorites icon badge.
- `components/shared/FavoriteIconButton.tsx`: Favorite toggle icon used inside product cards.
- `components/shared/ProductGridCard.tsx`: Reusable product card UI for lists/grids.

## Notes

- Category/product data is centralized in `lib/catalog.ts`.
- Home-specific visual content is centralized in `features/home/constants.ts`.
- Encoding safety is enforced by `scripts/check-mojibake.mjs` via `predev` and `prebuild` scripts.
