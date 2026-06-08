# Offers Directory PWA

A fast, touch-optimized Progressive Web App (PWA) that aggregates discount offers from **4 providers** into a single, offline-capable directory. Find the best NHS & healthcare staff discounts on the go, without relying on clunky corporate portals!

> **3,007 offers** from Vivup, Blue Light Card, Lebara, and Health Service Discounts — updated June 2026.

## For End Users: Installing the App

This is a Progressive Web App (PWA), meaning you can install it directly to your phone or desktop for quick access—no app store required!

- **iOS (iPhone/iPad):** Open the site in Safari, tap the **Share** button (the square with an arrow pointing up), and select **"Add to Home Screen"**.
- **Android:** Open the site in Chrome. A banner should appear at the bottom asking you to **"Add to Home Screen"**. If not, tap the three-dot menu and select **"Install app"**.
- **Desktop (Chrome/Edge):** Click the "Install" icon in the right side of the URL bar.

### Features
- **Unified Directory:** 3,007 offers from 4 providers in one place.
- **Fuzzy Search:** Smart search easily finds related items (e.g., searching "grocery" finds Tesco, ASDA, Sainsbury's).
- **Advanced Filtering:** Filter by Source, Category, Offer Type, and Minimum Discount.
- **Offline Capable:** Works without an internet connection once loaded.
- **Pinned Offers:** Save your favorite offers for quick access.

### Offer Sources

| Provider | Offers | Covers |
|---|---|---|
| **Health Service Discounts** | 1,891 | Shopping, Travel, Motoring, Mobiles, Insurance, Money, Broadband |
| **Vivup** | 698 | Lifestyle savings & gift cards |
| **Blue Light Card** | 370 | Retail, restaurants & services |
| **Lebara** | 48 | Mobile & SIM-only plans |

---

## For Developers: Expanding the Directory

The frontend PWA is entirely static and driven by a single `data/offers.json` file. The Python pipeline lives in the `scratch/` directory of the source repo (not included here — see the data pipeline instructions below).

### Data Schema

Each entry in `data/offers.json` follows this schema:

```json
{
  "id": "unique-id",
  "source": "Provider Name",
  "brand": "Brand Name",
  "title": "Offer Title or Description",
  "description": "Longer details about the offer",
  "url": "https://link-to-offer.com",
  "type": "Online / In-store / Gift Card / Cashback",
  "category": "Travel & Transport / Fashion & Retail / etc.",
  "discount_pct": 10,
  "discount_display": "10%",
  "keywords": "searchable keywords"
}
```

### Updating the Offer Database

The offer data is maintained via a versioned Python pipeline in the source repository. Each run automatically archives the previous `offers.json` before writing the new one.

**To refresh all offers:**
```bash
# 1. Re-scrape Health Service Discounts (requires login)
python3 scratch/hsd_scraper.py

# 2. Rebuild offers.json (auto-archives previous version)
python3 scratch/generate_offers_json.py

# 3. Roll back if needed
python3 scratch/generate_offers_json.py --rollback 1
```

**Version history** is tracked in `data/db_manifest.json`.

### Running Frontend Tests
```bash
npm install
npm test
```

---

## Hosting on GitHub Pages

This app is designed to be hosted seamlessly on GitHub Pages:
1. Push this repository to GitHub.
2. Go to your repository settings → Pages.
3. Select the branch (e.g., `main`) and the root directory.
4. Save and your site will be live.

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0). See the [LICENSE](LICENSE) file for more details.
