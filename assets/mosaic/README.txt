Memory mosaic files (generated from memories/easymoza-mozaiek.jpg + the 548 photos in memories/Miss Megha's bday)

mosaic-data.js   The 50x50 layout: which photo sits in each tile, plus each photo's date. Loaded by index.html.
tile/            64px squares used as the mosaic tiles
mid/             560px versions shown in the hover preview and the photo slideshow
full/            1600px versions opened in the lightbox (click / tap a tile)
overlay.jpg      The main portrait (photo m505), laid faintly over the tiles so the face reads clearly
sources.json     Maps each id (m001...) back to its original file name
thumb/, layout.json   Working files from the matching step, not used by the site

To publish, upload index.html, styles.css, app.js and the assets folder.
The original photos in memories/ are not needed by the site (about 950 MB), so you can leave them out of the upload.
The overlay strength is --overlay-strength in styles.css (.mosaic-overlay); 0.42 by default.
