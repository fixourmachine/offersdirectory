# Offers Directory PWA

A fast, touch-optimized Progressive Web App (PWA) that aggregates discount offers from Vivup and Lebara. It provides a searchable, filterable, and offline-capable directory to easily find the best discounts on the go.

## Features

- **Unified Directory:** Aggregates Vivup and Lebara offers into a single interface.
- **Fuzzy Search:** Powered by Fuse.js with keyword enrichment (e.g., searching "grocery" finds Tesco, ASDA, Sainsbury's).
- **Advanced Filtering:** Filter by Source, Category, Offer Type, and Minimum Discount Percentage.
- **Sorting:** Sort by highest percentage discount, alphabetically, or by source.
- **Offline Capable:** Network-first Service Worker with stale-while-revalidate caching.
- **Installable PWA:** Can be added to the home screen on iOS and Android.
- **Pinned Offers:** Save your favorite offers for quick access.

## Project Structure

- `pwa/`: The frontend static web application (HTML, CSS, Vanilla JS).
- `scratch/`: Python scripts for data ingestion and generation.
- `tests/`: Unit tests for both Python and JavaScript logic.

## Data Pipeline

The frontend relies on an `offers.json` file.

## Development & Testing

### Python Data Pipeline
Run the Python unit tests using the standard `unittest` module:
```bash
python3 -m unittest discover -s tests -p "test_*.py"
```

### JavaScript PWA Client
The frontend logic uses Jest and JSDOM for testing. To run the tests:
```bash
npm install
npm test
```

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0). See the [LICENSE](LICENSE) file for more details.
