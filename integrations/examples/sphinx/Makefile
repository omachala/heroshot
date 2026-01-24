SPHINXBUILD = sphinx-build
SOURCEDIR = docs
BUILDDIR = docs/_build

html:
	$(SPHINXBUILD) -b html $(SOURCEDIR) $(BUILDDIR)/html

clean:
	rm -rf $(BUILDDIR)

screenshots:
	npx heroshot sync

.PHONY: html clean screenshots
