"""Tests for the heroshot Sphinx extension."""

import pytest

from heroshot.sphinx import (
    HEROSHOT_CSS,
    _generate_themed_html,
    _generate_responsive_html,
    _parse_viewports,
    setup,
)


class TestParseViewports:
    def test_basic(self):
        assert _parse_viewports("mobile, tablet, desktop") == [
            "mobile",
            "tablet",
            "desktop",
        ]

    def test_no_spaces(self):
        assert _parse_viewports("mobile,tablet,desktop") == [
            "mobile",
            "tablet",
            "desktop",
        ]

    def test_extra_spaces(self):
        assert _parse_viewports("  mobile ,  tablet  ") == ["mobile", "tablet"]

    def test_empty_entries_filtered(self):
        assert _parse_viewports("mobile,,desktop") == ["mobile", "desktop"]

    def test_single(self):
        assert _parse_viewports("desktop") == ["desktop"]


class TestGenerateThemedHtml:
    def test_basic(self):
        html = _generate_themed_html(
            name="dashboard",
            alt="Dashboard",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
        )
        assert 'class="heroshot-container"' in html
        assert 'class="heroshot-light"' in html
        assert 'class="heroshot-dark"' in html
        assert 'src="/_static/heroshots/dashboard-light.png"' in html
        assert 'src="/_static/heroshots/dashboard-dark.png"' in html
        assert 'alt="Dashboard"' in html
        assert 'loading="lazy"' in html

    def test_with_width(self):
        html = _generate_themed_html(
            name="sidebar",
            alt="Sidebar",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
            width="400px",
        )
        assert 'width="400px"' in html

    def test_without_width(self):
        html = _generate_themed_html(
            name="sidebar",
            alt="Sidebar",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
        )
        assert "width=" not in html

    def test_jpeg_format(self):
        html = _generate_themed_html(
            name="photo",
            alt="Photo",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="jpeg",
        )
        assert "photo-light.jpeg" in html
        assert "photo-dark.jpeg" in html

    def test_custom_suffixes(self):
        html = _generate_themed_html(
            name="hero",
            alt="Hero",
            path="images",
            light_suffix="_day",
            dark_suffix="_night",
            extension="png",
        )
        assert "hero_day.png" in html
        assert "hero_night.png" in html

    def test_custom_path(self):
        html = _generate_themed_html(
            name="test",
            alt="Test",
            path="custom/path/screenshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
        )
        assert "/custom/path/screenshots/test-light.png" in html


class TestGenerateResponsiveHtml:
    def test_basic_viewports(self):
        html = _generate_responsive_html(
            name="hero",
            alt="Hero",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
            viewports=["mobile", "desktop"],
        )
        assert "<picture>" in html
        assert "</picture>" in html
        assert "<source" in html
        assert "<img" in html

    def test_sorts_viewports_by_width(self):
        html = _generate_responsive_html(
            name="hero",
            alt="Hero",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
            viewports=["desktop", "mobile", "tablet"],
        )
        # Mobile (375px) should come before tablet (768px) in sources
        mobile_pos = html.find("hero-mobile")
        tablet_pos = html.find("hero-tablet")
        desktop_pos = html.find("hero-desktop")
        assert mobile_pos < tablet_pos < desktop_pos

    def test_smallest_viewports_have_max_width(self):
        html = _generate_responsive_html(
            name="hero",
            alt="Hero",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
            viewports=["mobile", "desktop"],
        )
        # Mobile gets max-width constraint
        assert "(max-width: 375px)" in html
        # Desktop (largest) should NOT have max-width - it's the fallback
        lines = html.split("\n")
        desktop_sources = [l for l in lines if "desktop" in l and "source" in l.lower()]
        for source in desktop_sources:
            assert "max-width" not in source or "prefers-color-scheme" in source

    def test_dark_mode_media_queries(self):
        html = _generate_responsive_html(
            name="hero",
            alt="Hero",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
            viewports=["mobile", "desktop"],
        )
        assert "prefers-color-scheme: dark" in html

    def test_fallback_img_uses_largest_viewport_light(self):
        html = _generate_responsive_html(
            name="hero",
            alt="Hero",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
            viewports=["mobile", "desktop"],
        )
        assert '<img src="/_static/heroshots/hero-desktop-light.png"' in html

    def test_with_width(self):
        html = _generate_responsive_html(
            name="hero",
            alt="Hero",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
            width="600px",
            viewports=["mobile", "desktop"],
        )
        assert 'width="600px"' in html

    def test_all_viewports_have_light_and_dark(self):
        html = _generate_responsive_html(
            name="hero",
            alt="Hero",
            path="_static/heroshots",
            light_suffix="-light",
            dark_suffix="-dark",
            extension="png",
            viewports=["mobile", "tablet", "desktop"],
        )
        assert "hero-mobile-light.png" in html
        assert "hero-mobile-dark.png" in html
        assert "hero-tablet-light.png" in html
        assert "hero-tablet-dark.png" in html
        assert "hero-desktop-light.png" in html
        assert "hero-desktop-dark.png" in html


class TestCss:
    def test_contains_heroshot_container(self):
        assert ".heroshot-container" in HEROSHOT_CSS

    def test_contains_furo_support(self):
        assert 'html[data-theme="dark"]' in HEROSHOT_CSS

    def test_contains_pydata_support(self):
        assert 'body[data-theme="dark"]' in HEROSHOT_CSS

    def test_contains_prefers_color_scheme(self):
        assert "prefers-color-scheme: dark" in HEROSHOT_CSS

    def test_light_visible_by_default(self):
        assert ".heroshot-light" in HEROSHOT_CSS
        assert ".heroshot-dark" in HEROSHOT_CSS


class TestSetup:
    def test_returns_metadata(self):
        """Test that setup() returns proper extension metadata."""

        class FakeApp:
            def __init__(self):
                self.config_values = []
                self.directives = []
                self.css_files = []
                self.connections = []

            def add_config_value(self, name, default, rebuild):
                self.config_values.append((name, default, rebuild))

            def add_directive(self, name, cls):
                self.directives.append((name, cls))

            def add_css_file(self, filename, **kwargs):
                self.css_files.append(filename)

            def connect(self, event, handler):
                self.connections.append((event, handler))

        app = FakeApp()
        result = setup(app)

        assert result["version"] == "0.1.0"
        assert result["parallel_read_safe"] is True
        assert result["parallel_write_safe"] is True

    def test_registers_directives(self):
        class FakeApp:
            def __init__(self):
                self.directives = []

            def add_config_value(self, *args):
                pass  # Stub - not needed for this test

            def add_directive(self, name, cls):
                self.directives.append(name)

            def add_css_file(self, *args, **kwargs):
                pass  # Stub - not needed for this test

            def connect(self, *args):
                pass  # Stub - not needed for this test

        app = FakeApp()
        setup(app)

        assert "heroshot" in app.directives
        assert "heroshot-single" in app.directives

    def test_registers_config_values(self):
        class FakeApp:
            def __init__(self):
                self.config_values = {}

            def add_config_value(self, name, default, rebuild):
                self.config_values[name] = default

            def add_directive(self, *args):
                pass  # Stub - not needed for this test

            def add_css_file(self, *args, **kwargs):
                pass  # Stub - not needed for this test

            def connect(self, *args):
                pass  # Stub - not needed for this test

        app = FakeApp()
        setup(app)

        assert app.config_values["heroshot_path"] == "_static/heroshots"
        assert app.config_values["heroshot_light_suffix"] == "-light"
        assert app.config_values["heroshot_dark_suffix"] == "-dark"
        assert app.config_values["heroshot_format"] == "png"

    def test_registers_css_file(self):
        class FakeApp:
            def __init__(self):
                self.css_files = []

            def add_config_value(self, *args):
                pass  # Stub - not needed for this test

            def add_directive(self, *args):
                pass  # Stub - not needed for this test

            def add_css_file(self, filename, **kwargs):
                self.css_files.append(filename)

            def connect(self, *args):
                pass  # Stub - not needed for this test

        app = FakeApp()
        setup(app)

        assert "heroshot.css" in app.css_files

    def test_connects_build_finished(self):
        class FakeApp:
            def __init__(self):
                self.connections = []

            def add_config_value(self, *args):
                pass  # Stub - not needed for this test

            def add_directive(self, *args):
                pass  # Stub - not needed for this test

            def add_css_file(self, *args, **kwargs):
                pass  # Stub - not needed for this test

            def connect(self, event, handler):
                self.connections.append(event)

        app = FakeApp()
        setup(app)

        assert "build-finished" in app.connections
