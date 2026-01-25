# Heroshot

Screenshot automation for Python documentation tools.

## MkDocs

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

## Sphinx

```bash
pip install heroshot[sphinx]
```

Add to `conf.py`:

```python
extensions = ['heroshot.sphinx']
```

Use in RST:

```rst
.. heroshot:: dashboard
   :alt: Dashboard overview
```

## Links

- [MkDocs Documentation](https://heroshot.sh/docs/integrations/mkdocs)
- [Sphinx Documentation](https://heroshot.sh/docs/integrations/sphinx)
- [GitHub](https://github.com/omachala/heroshot)
