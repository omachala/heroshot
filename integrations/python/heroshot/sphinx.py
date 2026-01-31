"""
Sphinx extension for heroshot screenshots.

Provides a directive that generates theme-aware image markup
for Sphinx themes with dark/light mode support (Furo, PyData, etc.)
and responsive viewport variants.

Usage in conf.py:
    extensions = ['heroshot.sphinx']

    # Optional configuration
    heroshot_path = '_static/heroshots'      # default
    heroshot_light_suffix = '-light'         # default
    heroshot_dark_suffix = '-dark'           # default
    heroshot_format = 'png'                  # default

Usage in RST:
    .. heroshot:: dashboard
       :alt: Dashboard overview

    .. heroshot:: hero
       :alt: Hero section
       :viewports: mobile, tablet, desktop

Usage in MyST Markdown:
    ```{heroshot} dashboard
    :alt: Dashboard overview
    ```
"""

from pathlib import Path
from typing import List

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.application import Sphinx
from sphinx.util.docutils import SphinxDirective


# Viewport width mapping for media queries
VIEWPORT_WIDTHS = {
    "mobile": 430,  # iPhone 15/16 Pro Max viewport
    "tablet": 768,
    "desktop": 1280,
}

# CSS for theme-aware image visibility.
# Supports Furo, PyData, and prefers-color-scheme fallback.
HEROSHOT_CSS = """\
/* heroshot: theme-aware screenshots */
.heroshot-container .heroshot-light {
  display: block;
}
.heroshot-container .heroshot-dark {
  display: none;
}

/* Furo theme */
html[data-theme="dark"] .heroshot-container .heroshot-light {
  display: none;
}
html[data-theme="dark"] .heroshot-container .heroshot-dark {
  display: block;
}

/* PyData theme */
html[data-theme="dark"] .heroshot-container .heroshot-light,
body[data-theme="dark"] .heroshot-container .heroshot-light {
  display: none;
}
html[data-theme="dark"] .heroshot-container .heroshot-dark,
body[data-theme="dark"] .heroshot-container .heroshot-dark {
  display: block;
}

/* OS preference fallback (auto mode) */
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) .heroshot-container .heroshot-light {
    display: none;
  }
  html:not([data-theme="light"]) .heroshot-container .heroshot-dark {
    display: block;
  }
}
"""


def _parse_viewports(value: str) -> List[str]:
    """Parse comma-separated viewport list."""
    return [v.strip() for v in value.split(",") if v.strip()]


class HeroshotDirective(SphinxDirective):
    """
    Directive for theme-aware heroshot screenshots.

    .. heroshot:: screenshot-name
       :alt: Alt text
       :width: 600px
       :align: center
       :viewports: mobile, tablet, desktop
    """

    required_arguments = 1  # screenshot name
    optional_arguments = 0
    has_content = False

    option_spec = {
        "alt": directives.unchanged,
        "width": directives.unchanged,
        "align": lambda x: directives.choice(x, ("left", "center", "right")),
        "viewports": _parse_viewports,
    }

    def run(self) -> List[nodes.Node]:
        name = self.arguments[0]
        alt = self.options.get("alt", name)
        width = self.options.get("width")
        align = self.options.get("align")
        viewports = self.options.get("viewports")

        # Get config values
        config = self.env.config
        path = config.heroshot_path
        light_suffix = config.heroshot_light_suffix
        dark_suffix = config.heroshot_dark_suffix
        extension = config.heroshot_format

        if viewports:
            html = _generate_responsive_html(
                name, alt, path, light_suffix, dark_suffix, extension, width, viewports
            )
        else:
            html = _generate_themed_html(
                name, alt, path, light_suffix, dark_suffix, extension, width
            )

        # Wrap in alignment container if specified
        if align:
            html = f'<div style="text-align: {align}">\n{html}\n</div>'

        raw_node = nodes.raw("", html, format="html")
        return [raw_node]


class HeroshotSingleDirective(SphinxDirective):
    """
    Directive for a single screenshot (no theme variants).

    .. heroshot-single:: screenshot-name
       :alt: Alt text
       :width: 600px
       :align: center
    """

    required_arguments = 1  # screenshot name
    optional_arguments = 0
    has_content = False

    option_spec = {
        "alt": directives.unchanged,
        "width": directives.unchanged,
        "align": lambda x: directives.choice(x, ("left", "center", "right")),
    }

    def run(self) -> List[nodes.Node]:
        name = self.arguments[0]
        alt = self.options.get("alt", name)
        width = self.options.get("width")
        align = self.options.get("align")

        config = self.env.config
        path = config.heroshot_path
        extension = config.heroshot_format

        src = f"/{path}/{name}.{extension}"
        width_attr = f' width="{width}"' if width else ""
        html = f'<img src="{src}" alt="{alt}" loading="lazy"{width_attr}>'

        if align:
            html = f'<div style="text-align: {align}">\n  {html}\n</div>'

        raw_node = nodes.raw("", html, format="html")
        return [raw_node]


def _generate_themed_html(
    name: str,
    alt: str,
    path: str,
    light_suffix: str,
    dark_suffix: str,
    extension: str,
    width: str = None,
) -> str:
    """Generate HTML with light/dark image variants."""
    light_src = f"/{path}/{name}{light_suffix}.{extension}"
    dark_src = f"/{path}/{name}{dark_suffix}.{extension}"

    width_attr = f' width="{width}"' if width else ""

    return (
        f'<div class="heroshot-container">\n'
        f'  <img class="heroshot-light" src="{light_src}" alt="{alt}" loading="lazy"{width_attr}>\n'
        f'  <img class="heroshot-dark" src="{dark_src}" alt="{alt}" loading="lazy"{width_attr}>\n'
        f"</div>"
    )


def _generate_responsive_html(
    name: str,
    alt: str,
    path: str,
    light_suffix: str,
    dark_suffix: str,
    extension: str,
    width: str = None,
    viewports: List[str] = None,
) -> str:
    """Generate <picture> element with responsive viewport and theme sources."""
    # Sort viewports by width ascending (smallest first - browser picks first match)
    sorted_viewports = sorted(
        viewports,
        key=lambda vp: VIEWPORT_WIDTHS.get(
            vp, int(vp.split("x")[0]) if "x" in vp else 1280
        ),
    )

    sources = []

    for i, viewport in enumerate(sorted_viewports):
        vp_width = VIEWPORT_WIDTHS.get(
            viewport, int(viewport.split("x")[0]) if "x" in viewport else 1280
        )

        light_src = f"/{path}/{name}-{viewport}{light_suffix}.{extension}"
        dark_src = f"/{path}/{name}-{viewport}{dark_suffix}.{extension}"

        # Last (largest) viewport is the fallback - no max-width constraint
        is_last = i == len(sorted_viewports) - 1
        viewport_media = None if is_last else f"(max-width: {vp_width}px)"

        # Dark mode source
        if viewport_media:
            dark_media = f"{viewport_media} and (prefers-color-scheme: dark)"
        else:
            dark_media = "(prefers-color-scheme: dark)"
        sources.append(f'  <source srcset="{dark_src}" media="{dark_media}">')

        # Light mode source
        if viewport_media:
            sources.append(f'  <source srcset="{light_src}" media="{viewport_media}">')
        else:
            sources.append(f'  <source srcset="{light_src}">')

    # Fallback img (largest viewport, light mode)
    largest_viewport = sorted_viewports[-1]
    fallback_src = f"/{path}/{name}-{largest_viewport}{light_suffix}.{extension}"
    width_attr = f' width="{width}"' if width else ""
    img_tag = f'  <img src="{fallback_src}" alt="{alt}" loading="lazy"{width_attr}>'

    return "<picture>\n" + "\n".join(sources) + "\n" + img_tag + "\n</picture>"


def _write_css(app: Sphinx, exception: Exception = None) -> None:
    """Write heroshot CSS file to the build output."""
    if exception:
        return

    if app.builder.format != "html":
        return

    static_dir = Path(app.outdir) / "_static"
    static_dir.mkdir(parents=True, exist_ok=True)

    css_path = static_dir / "heroshot.css"
    css_path.write_text(HEROSHOT_CSS)


def setup(app: Sphinx) -> dict:
    """
    Sphinx extension entry point.

    Registers the heroshot directive and configuration values.
    """
    # Configuration values
    app.add_config_value("heroshot_path", "_static/heroshots", "html")
    app.add_config_value("heroshot_light_suffix", "-light", "html")
    app.add_config_value("heroshot_dark_suffix", "-dark", "html")
    app.add_config_value("heroshot_format", "png", "html")

    # Register directives
    app.add_directive("heroshot", HeroshotDirective)
    app.add_directive("heroshot-single", HeroshotSingleDirective)

    # Write CSS file to output and register it
    app.add_css_file("heroshot.css")
    app.connect("build-finished", _write_css)

    return {
        "version": "0.1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
