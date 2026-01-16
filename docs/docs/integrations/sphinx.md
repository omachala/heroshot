# Sphinx

[Sphinx](https://www.sphinx-doc.org/) is the OG of Python documentation - it's what Python itself uses, along with most major Python projects. If you're documenting a serious Python library, you're probably using Sphinx.

Sphinx uses reStructuredText by default (`.rst` files), which has a bit of a learning curve if you're coming from Markdown. But you can also use [MyST Parser](https://myst-parser.readthedocs.io/) to write in Markdown if that's more your thing.

## The Entry Point

Navigate to your project root and run:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your Sphinx dev server (I recommend `sphinx-autobuild`), then navigate to it in the heroshot browser, click on elements you want to capture, and close when done. Heroshot saves a config and outputs screenshots wherever you specify.

## Where to Put Screenshots

Sphinx has a special `_static` folder for static assets. Put screenshots there:

```
docs/
├── source/
│   ├── conf.py
│   ├── index.rst
│   └── _static/
│       └── screenshots/    # heroshot outputs here
├── build/
└── Makefile
```

## Getting Started

Set your output directory to the static folder:

```json
{
  "outputDirectory": "docs/source/_static/screenshots",
  "screenshots": [...]
}
```

For development, I'd recommend `sphinx-autobuild` for live reload:

```bash
pip install sphinx-autobuild
sphinx-autobuild source build/html
```

Then in another terminal:

```bash
npx heroshot
```

Navigate to `http://localhost:8000`, capture what you need.

## Using Screenshots in RST

Basic image:

```rst
.. image:: /_static/screenshots/dashboard.png
   :alt: Dashboard overview
```

With sizing:

```rst
.. image:: /_static/screenshots/dashboard.png
   :width: 600px
   :align: center
```

If you want a caption, use `figure`:

```rst
.. figure:: /_static/screenshots/dashboard.png
   :width: 80%
   :align: center

   The main dashboard showing key metrics.
```

## Using Markdown (MyST)

If you prefer Markdown, install MyST:

```bash
pip install myst-parser
```

```python
# conf.py
extensions = ['myst_parser']
```

Then you can write:

```md
![Dashboard](/_static/screenshots/dashboard.png)
```

Or with more control using MyST's directive syntax:

````md
```{image} /_static/screenshots/dashboard.png
:alt: Dashboard
:width: 600px
```
````

## Themes

### Read the Docs Theme

The classic. Most Sphinx sites use it:

```python
html_theme = 'sphinx_rtd_theme'
```

It doesn't have a dark mode toggle, so just use light screenshots.

### Furo

[Furo](https://pradyunsg.me/furo/) is a more modern theme with dark mode:

```python
html_theme = 'furo'
```

For themed images with Furo, you can use the `only` directive, but honestly it's a bit fiddly. Most projects just pick screenshots that look decent in both modes.

### PyData Theme

Used by NumPy, Pandas, and the scientific Python ecosystem:

```python
html_theme = 'pydata_sphinx_theme'
```

## Viewport Variants with Tabs

If you want to show desktop/tablet/mobile variants, `sphinx-tabs` works well:

```python
# conf.py
extensions = ['sphinx_tabs.tabs']
```

```rst
.. tabs::

   .. tab:: Desktop

      .. image:: /_static/screenshots/hero-desktop.png

   .. tab:: Tablet

      .. image:: /_static/screenshots/hero-tablet.png

   .. tab:: Mobile

      .. image:: /_static/screenshots/hero-mobile.png
```

## API Docs with Screenshots

One thing Sphinx does really well is API documentation via autodoc. If you're documenting a GUI library or web framework, you can embed screenshots right in your docstrings:

```python
class Dashboard:
    """Main dashboard component.

    .. image:: /_static/screenshots/api/dashboard.png
       :width: 400px

    Example usage::

        dashboard = Dashboard()
        dashboard.render()
    """
```

## Makefile

Add a target to your docs Makefile:

```makefile
screenshots:
	sphinx-autobuild source build/html &
	sleep 5
	npx heroshot
	pkill -f sphinx-autobuild

.PHONY: screenshots
```

Then:

```bash
cd docs
make screenshots
```

## ReadTheDocs

Most Sphinx projects host on RTD. Screenshots need to be in your repo since RTD builds from source:

1. Run `npx heroshot` locally
2. Commit the screenshots
3. Push - RTD rebuilds automatically

That's the workflow. Keep it simple.
