# Offers Directory PWA

A fast, touch-optimized Progressive Web App (PWA) that aggregates your favourite discount offers into a single, offline-capable directory. Find the best discounts on the go, without relying on clunky corporate portals!

## For End Users: Installing the App

This is a Progressive Web App (PWA), meaning you can install it directly to your phone or desktop for quick access—no app store required!

- **iOS (iPhone/iPad):** Open the site in Safari, tap the **Share** button (the square with an arrow pointing up), and select **"Add to Home Screen"**.
- **Android:** Open the site in Chrome. A banner should appear at the bottom asking you to **"Add to Home Screen"**. If not, tap the three-dot menu and select **"Install app"**.
- **Desktop (Chrome/Edge):** Click the "Install" icon in the right side of the URL bar.

### Features
- **Unified Directory:** All your offers in one place.
- **Fuzzy Search:** Smart search easily finds related items (e.g., searching "grocery" finds Tesco, ASDA, Sainsbury's).
- **Advanced Filtering:** Filter by Source, Category, Offer Type, and Minimum Discount.
- **Offline Capable:** Works without an internet connection once loaded.
- **Pinned Offers:** Save your favorite offers for quick access.

---

## For Developers: Expanding the Directory

While this project initially includes pipelines for Vivup and Lebara, it is designed to be easily extensible. 

The frontend PWA is entirely static and driven by a single `offers.json` file located at `pwa/data/offers.json`.

### Expanding via JSON Directly
You don't need to write Python to add new providers! You can simply append new offers directly to `pwa/data/offers.json`. Ensure your entries follow this schema:

```json
{
  "id": "unique-id",
  "brand": "Brand Name",
  "title": "Offer Title or Description",
  "description": "Longer details about the offer",
  "url": "https://link-to-offer.com",
  "source": "your_provider_name",
  "type": "Online / In-store / Gift Card",
  "category": "Groceries, Travel, etc.",
  "discount_pct": 10,
  "discount_display": "10%",
  "keywords": "searchable, keywords"
}
```

### Expanding via the Python Pipeline
If you are processing large CSVs or APIs from other discount providers, you can update the Python pipeline:

1. Place your new provider's data in the root directory (e.g., `new_provider.csv`).
2. Update the Python ingestion script:
   ```bash
   python3 scratch/generate_offers_json.py
   ```
3. Run unit tests to ensure everything is working:
   ```bash
   python3 -m unittest discover -s tests -p "test_*.py"
   ```

### Running Frontend Tests
The frontend logic uses Jest and JSDOM for testing. To run the tests:
```bash
npm install
npm test
```

## Hosting on GitHub Pages

This app is designed to be hosted seamlessly on GitHub Pages:
1. Push this repository to GitHub.
2. Go to your repository settings -> Pages.
3. Select the branch (e.g., `main`) and the root directory (or use a GitHub Action to deploy just the `pwa/` folder).
4. Save and your site will be live.

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0). See the [LICENSE](LICENSE) file for more details.
