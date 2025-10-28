# Contributing to Currency Rates Workflow

## Adding New Currency Rate Sources

To add a new currency rate source to the workflow:

### 1. Choose a Free API

Find a free currency exchange rate API that doesn't require authentication or provides a free tier. Some examples:

- [exchangerate.host](https://exchangerate.host/) - Free, no API key required
- [frankfurter.app](https://www.frankfurter.app/) - ECB data, free
- [open.er-api.com](https://www.exchangerate-api.com/docs/free) - Free tier available
- [currencyapi.com](https://currencyapi.com/) - Free tier with API key
- [fixer.io](https://fixer.io/) - Free tier with API key

### 2. Add a New Step to the Workflow

Edit `.github/workflows/currency-rates.yml` and add a new step following this template:

```yaml
- name: Fetch rates from your-source-name
  continue-on-error: true
  run: |
    python << 'EOF'
    import requests
    import json
    from datetime import datetime
    
    try:
        # Replace with your API URL
        url = "https://api.your-source.com/latest?base=USD"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        timestamp = datetime.utcnow().isoformat()
        
        # Adapt the result structure to match your API response
        result = {
            "source": "your-source-name",
            "timestamp": timestamp,
            "base": data.get("base", "USD"),
            "date": data.get("date"),
            "rates": data.get("rates", {})
        }
        
        # Save to a unique filename
        with open("rates/your-source-name.json", "w") as f:
            json.dump(result, f, indent=2)
        
        print(f"✓ Successfully fetched rates from your-source-name")
        print(f"  Base: {result['base']}")
        print(f"  Date: {result['date']}")
        print(f"  Currencies: {len(result['rates'])}")
    except Exception as e:
        print(f"✗ Error fetching from your-source-name: {e}")
        exit(1)
    EOF
```

### 3. Update the README

Add your new source to the "Data Sources" section in `README.md`:

```markdown
## Data Sources

The workflow fetches rates from the following free APIs:

1. **exchangerate.host** - Comprehensive currency exchange rates
2. **frankfurter.app** - European Central Bank data
3. **open.er-api.com** - Open Exchange Rates API
4. **your-source-name** - Brief description
```

And add the output file to "Files Generated":

```markdown
## Files Generated

- `exchangerate-host.json` - Rates from exchangerate.host
- `frankfurter.json` - Rates from frankfurter.app
- `er-api.json` - Rates from open.er-api.com
- `your-source-name.json` - Rates from your-source-name
- `summary.json` - Summary of all sources
```

### 4. Using API Keys (Optional)

If your source requires an API key, add it as a GitHub secret:

1. Go to your repository Settings → Secrets and variables → Actions
2. Add a new repository secret (e.g., `YOUR_API_KEY`)
3. Reference it in the workflow:

```yaml
- name: Fetch rates from your-source-name
  continue-on-error: true
  env:
    API_KEY: ${{ secrets.YOUR_API_KEY }}
  run: |
    python << 'EOF'
    import requests
    import json
    import os
    from datetime import datetime
    
    api_key = os.environ.get('API_KEY')
    url = f"https://api.your-source.com/latest?apikey={api_key}&base=USD"
    # ... rest of the code
    EOF
```

### 5. Testing

1. Create a pull request with your changes
2. The workflow will run automatically on the PR
3. Check the workflow run in the Actions tab
4. Download the artifacts to verify your new source is included

## Best Practices

- Always use `continue-on-error: true` so one failed source doesn't break the entire workflow
- Set appropriate timeouts (10 seconds is usually enough)
- Include comprehensive error messages
- Normalize the output format to match existing sources
- Test with the free tier first before using paid APIs
- Document rate limits in the README if applicable

## Questions?

Open an issue in this repository for help or suggestions!
