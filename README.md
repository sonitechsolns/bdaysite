# Happy 19th — Birthday Website

A responsive, lavender-themed birthday website built with plain HTML, CSS, and JavaScript. No framework or build step is required.

## Preview it

1. Unzip the project.
2. Open `index.html` in a modern browser. For the most reliable audio/video and local asset behaviour, open the folder with VS Code's **Live Server** extension instead.
3. Scroll to **Personalise this page** at the very bottom and expand it to select a portrait, a large batch of photos, songs, and a friends' video. This is a temporary local preview: selected files are kept in the browser tab and are not copied into the project automatically.

## Add the real media for a published website

Place media files into the provided `assets` folders, then update `APP_CONFIG` at the top of `app.js`.

- **Main portrait:** save it as `assets/hero.jpg` (or change `heroImage`). The same image is used as the tonal reference for the photo mosaic. To use a different reference, set `referenceImage` to its path.
- **Mosaic photos:** put 400–1,500 photos in `assets/memories/` and add their paths to `memoryPhotos`. Example:

```js
memoryPhotos: [
  "assets/memories/photo-001.jpg",
  "assets/memories/photo-002.jpg",
  "assets/memories/photo-003.jpg"
  // Continue with the rest of the images. Don't leave a comma after the last item if your environment requires strict JSON-like formatting.
],
```

The mosaic arranges the photos into a portrait-shaped silhouette, with tile shading sampled from the reference portrait. Hovering a tile opens a larger preview; clicking opens the lightbox. During the sticky scroll scene, the tiles zoom and burst outward to reveal the next section.

- **Birthday name:** edit `birthdayName` in `app.js`.
- **Downloaded songs:** put audio files in `assets/music/` and list them in `songs`:

```js
songs: [
  { title: "First song", src: "assets/music/song-01.mp3" },
  { title: "Second song", src: "assets/music/song-02.mp3" }
  // Add the rest of the 30–50 songs.
],
```

  The site tries to start the soundtrack when the music section comes into view. Some browsers block autoplay with sound; the built-in play button is the fallback. You can also set `spotifyPlaylistUrl` to a Spotify playlist link; Spotify playback itself is controlled by Spotify and may require a tap or sign-in.

- **Birthday wishes video:** put the final video in `assets/videos/` and set `videoSrc`, for example `"assets/videos/friends-wishes.mp4"`. It tries to autoplay muted when the section appears because browsers generally require autoplaying video to be muted. Viewers can unmute it with the video controls.

## Helpful notes

- Relative asset paths are case-sensitive on many hosting services.
- The upload panel is intended as a convenience for assembling a preview. For a polished public version, you can remove the `#personalise` footer from `index.html` after adding the media to `app.js`.
- A static browser page cannot automatically list every file in a folder. That's why the website uses an explicit `memoryPhotos` and `songs` list in `app.js`.
- Keep a copy of your original media; this page only displays the files you reference.
