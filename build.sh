mkdir -p dist && \
rm -rf dist/* && \

npx tsc &&
npx rollup -c && \

cp manifest/manifest.json \
   html/view.html \
   css/view.css \
   css/mfglabs_iconset.css \
   font/mfglabsiconset-webfont.woff dist && \

cat node_modules/antd/lib/style/index.css \
    node_modules/antd/lib/button/style/index.css \
    node_modules/antd/lib/cascader/style/index.css \
    node_modules/antd/lib/input/style/index.css \
    > dist/antd.css

mkdir -p dist/images && \
for i in 19 38 16 48 128
do
    convert -background none -resize ${i}x-1 -unsharp 1.5x1+0.3 images/icon.svg dist/images/icon-${i}.png
done
