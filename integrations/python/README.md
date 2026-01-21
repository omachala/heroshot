# Heroshot

Screenshot automation for Python documentation tools.

## Quick Start

```bash
pip install heroshot[mkdocs]
```

Add to `mkdocs.yml`:

```yaml
plugins:
  - macros:
      modules: [heroshot]
```

Use in markdown:

```md
{{ heroshot("dashboard", "Dashboard overview") }}
```

## Links

- [Full Documentation](https://heroshot.sh/docs/integrations/mkdocs)
- [GitHub](https://github.com/omachala/heroshot)
