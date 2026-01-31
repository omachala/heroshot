"""
MkDocs macro for heroshot screenshots.

Provides a Jinja2 macro that generates theme-aware image markup
for MkDocs Material's dark/light mode support with responsive viewports.

Usage in mkdocs.yml:
    plugins:
      - macros:
          modules: [heroshot]

Usage in markdown:
    {{ heroshot("dashboard", "Dashboard overview") }}
    {{ heroshot("hero", "Hero section", viewports=["mobile", "tablet", "desktop"]) }}

For theme support only (no viewports):
    Expands to Material's #only-light/#only-dark syntax

For viewport support:
    Expands to <picture> element with media queries
"""

from typing import List, Optional


# Viewport width mapping for media queries
VIEWPORT_WIDTHS = {
    "mobile": 430,  # iPhone 15/16 Pro Max viewport
    "tablet": 768,
    "desktop": 1280,
}


def define_env(env):
    """
    MkDocs-macros plugin hook.

    Registers the heroshot macro for use in markdown files.
    """

    @env.macro
    def heroshot(
        name: str,
        alt: str = "",
        path: str = "assets/screenshots",
        light_suffix: str = "-light",
        dark_suffix: str = "-dark",
        extension: str = "png",
        width: Optional[str] = None,
        align: Optional[str] = None,
        viewports: Optional[List[str]] = None,
    ) -> str:
        """
        Generate theme-aware screenshot markup for MkDocs Material.

        Args:
            name: Screenshot name (without suffix or extension)
            alt: Alt text for accessibility
            path: Path to screenshots folder (default: assets/screenshots)
            light_suffix: Suffix for light mode images (default: -light)
            dark_suffix: Suffix for dark mode images (default: -dark)
            extension: Image file extension (default: png)
            width: Optional width attribute (e.g., "500")
            align: Optional alignment (e.g., "right", "left")
            viewports: Optional list of viewport names (e.g., ["mobile", "tablet", "desktop"])

        Returns:
            HTML/Markdown string with light and dark mode images

        Example:
            {{ heroshot("dashboard", "Dashboard view") }}
            {{ heroshot("hero", "Hero section", width="600") }}
            {{ heroshot("sidebar", "Sidebar", align="right", width="300") }}
            {{ heroshot("hero", "Hero", viewports=["mobile", "tablet", "desktop"]) }}
        """
        # If viewports specified, use <picture> element for responsive images
        if viewports and len(viewports) > 0:
            return _generate_picture_element(
                name, alt, path, light_suffix, dark_suffix, extension, width, viewports
            )

        # Build attribute string for Material's extended markdown
        attrs = []
        if width:
            attrs.append(f'width="{width}"')
        if align:
            attrs.append(f'align="{align}"')
        attr_str = "{ " + " ".join(attrs) + " }" if attrs else ""

        light_img = f"{path}/{name}{light_suffix}.{extension}"
        dark_img = f"{path}/{name}{dark_suffix}.{extension}"

        light_line = f"![{alt}]({light_img}#only-light){attr_str}"
        dark_line = f"![{alt}]({dark_img}#only-dark){attr_str}"

        return f"{light_line}\n{dark_line}"

    @env.macro
    def heroshot_single(
        name: str,
        alt: str = "",
        path: str = "assets/screenshots",
        extension: str = "png",
        width: Optional[str] = None,
        align: Optional[str] = None,
    ) -> str:
        """
        Generate a single screenshot (no theme variants).

        Args:
            name: Screenshot filename (without extension)
            alt: Alt text for accessibility
            path: Path to screenshots folder
            extension: Image file extension
            width: Optional width attribute
            align: Optional alignment

        Returns:
            Markdown string for the image
        """
        attrs = []
        if width:
            attrs.append(f'width="{width}"')
        if align:
            attrs.append(f'align="{align}"')
        attr_str = "{ " + " ".join(attrs) + " }" if attrs else ""

        return f"![{alt}]({path}/{name}.{extension}){attr_str}"


def _generate_picture_element(
    name: str,
    alt: str,
    path: str,
    light_suffix: str,
    dark_suffix: str,
    extension: str,
    width: Optional[str],
    viewports: List[str],
) -> str:
    """
    Generate a <picture> element with responsive viewport sources.

    Uses media queries for viewport switching and prefers-color-scheme for theme.
    Browser picks FIRST matching source, so we sort smallest-to-largest with max-width.
    """
    # Sort viewports by width ascending (smallest first - browser picks FIRST matching source)
    sorted_viewports = sorted(
        viewports,
        key=lambda vp: VIEWPORT_WIDTHS.get(vp, int(vp.split("x")[0]) if "x" in vp else 1280),
    )

    sources = []

    for i, viewport in enumerate(sorted_viewports):
        vp_width = VIEWPORT_WIDTHS.get(
            viewport, int(viewport.split("x")[0]) if "x" in viewport else 1280
        )

        # Build file paths
        light_src = f"{path}/{name}-{viewport}{light_suffix}.{extension}"
        dark_src = f"{path}/{name}-{viewport}{dark_suffix}.{extension}"

        # Last (largest) viewport doesn't need max-width constraint - it's the fallback
        is_last = i == len(sorted_viewports) - 1
        viewport_media = None if is_last else f"(max-width: {vp_width}px)"

        # Dark mode source (with prefers-color-scheme)
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
    fallback_src = f"{path}/{name}-{largest_viewport}{light_suffix}.{extension}"
    width_attr = f' width="{width}"' if width else ""
    img_tag = f'  <img src="{fallback_src}" alt="{alt}" loading="lazy"{width_attr}>'

    return "<picture>\n" + "\n".join(sources) + "\n" + img_tag + "\n</picture>"
