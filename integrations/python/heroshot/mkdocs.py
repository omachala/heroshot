"""
MkDocs macro for heroshot screenshots.

Provides a Jinja2 macro that generates theme-aware image markup
for MkDocs Material's dark/light mode support.

Usage in mkdocs.yml:
    plugins:
      - macros:
          modules: [heroshot]

Usage in markdown:
    {{ heroshot("dashboard", "Dashboard overview") }}

This expands to Material's #only-light/#only-dark syntax:
    ![Dashboard overview](assets/screenshots/dashboard-light.png#only-light)
    ![Dashboard overview](assets/screenshots/dashboard-dark.png#only-dark)
"""

from typing import Optional


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

        Returns:
            Markdown string with light and dark mode images

        Example:
            {{ heroshot("dashboard", "Dashboard view") }}
            {{ heroshot("hero", "Hero section", width="600") }}
            {{ heroshot("sidebar", "Sidebar", align="right", width="300") }}
        """
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
