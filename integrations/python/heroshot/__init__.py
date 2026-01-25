"""
Heroshot - Screenshot automation for documentation.

This package provides integrations for Python documentation tools:
- MkDocs macro for theme-aware screenshots
- Sphinx extension for theme-aware screenshots

To capture screenshots, use the CLI:
    npx heroshot

For more information, visit https://heroshot.sh
"""

__version__ = "0.1.0"

from heroshot.mkdocs import define_env

__all__ = ["define_env", "__version__"]
