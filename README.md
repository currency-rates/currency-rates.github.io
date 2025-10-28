# currency-rates

A GitHub Actions workflow that automatically fetches currency exchange rates from multiple sources.

## Features

- **Automated Daily Updates**: Fetches currency rates daily at 00:00 UTC
- **Multiple Data Sources**: Aggregates rates from different providers for reliability
- **Manual Triggers**: Run the workflow on-demand via GitHub Actions UI
- **Artifact Storage**: Rates are stored as workflow artifacts with 30-day retention

## Data Sources

The workflow fetches rates from the following free APIs:

1. **exchangerate.host** - Comprehensive currency exchange rates
2. **frankfurter.app** - European Central Bank data
3. **open.er-api.com** - Open Exchange Rates API

All sources provide USD as the base currency with rates for 150+ currencies.

## Workflow Triggers

The currency rates workflow runs:

- **Scheduled**: Daily at 00:00 UTC (via cron schedule)
- **Manual**: On-demand via the "Actions" tab → "Fetch Currency Rates" → "Run workflow"
- **Push**: When changes are pushed to the main branch (for testing)

## Output Format

Each source generates a JSON file with the following structure:

```json
{
  "source": "source-name",
  "timestamp": "2025-10-28T12:00:00.000000",
  "base": "USD",
  "date": "2025-10-28",
  "rates": {
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 149.50,
    ...
  }
}
```

## Accessing the Data

1. Navigate to the "Actions" tab in this repository
2. Click on the latest "Fetch Currency Rates" workflow run
3. Download the "currency-rates" artifact (ZIP file)
4. Extract to find JSON files for each source plus a summary report

## Files Generated

- `exchangerate-host.json` - Rates from exchangerate.host
- `frankfurter.json` - Rates from frankfurter.app
- `er-api.json` - Rates from open.er-api.com
- `summary.json` - Summary of all sources

## Usage

To use the currency rates in your application:

1. Download the latest artifact from the workflow runs
2. Parse the JSON files to access the rates
3. Optionally compare rates across sources for validation

## Development

To test the workflow locally:

```bash
# Install Python dependencies
pip install requests

# Run the Python scripts manually (examples from workflow)
# See .github/workflows/currency-rates.yml for script details
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.