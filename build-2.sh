mkdir -p dist && \
rm -rf dist/* && \

cp manifest/manifest.json dist && \

mkdir -p dist/images && \
for i in 19 38 16 48 128
do
    convert -background none -resize ${i}x-1 -unsharp 1.5x1+0.3 images/icon.svg dist/images/icon-${i}.png
done
