all: $(addprefix .build-tag/,manifest _locales icons)

clear:
	rm -r dist .build-tag

dist: | .build-tag
	mkdir -p dist

.build-tag:
	mkdir -p .build-tag

.build-tag/manifest: manifest/manifest.json | dist
	cp $^ dist
	touch $@

.build-tag/_locales: _locales/*/messages.json | dist
	cp -r _locales dist
	touch $@

.build-tag/icons: images/icon.svg | dist
	mkdir -p dist/images
	for i in 16 24 32 48 96 128; \
	do \
		convert -background none -resize $${i}x-1 -unsharp 1.5x1+0.2 $^ dist/images/icon-$${i}.png; \
	done
	touch $@
