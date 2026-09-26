# Acromind Initiative

Static, zero-build website for Acromind Initiative.

## Deploy

Use `front end` as the publish directory. No dependency installation or build command is required.

- GitHub Pages: publish the `front end` directory from the repository settings.
- Netlify: set the publish directory to `front end` and leave the build command empty.
- Vercel: import the project, choose Other, leave the build command empty, and set the output directory to `front end`.
- Any web server: copy the contents of `front end` to the public web root.

The root `index.html`, `404.html`, `robots.txt`, and `.nojekyll` files are included for static hosting compatibility.

## Local preview

From the repository root, run a static server and open the URL it prints:

```powershell
npx serve "front end"
```

Opening `front end/index.html` directly also works, but a local server better matches production URL behavior.

## Structure

- `index.html`: deployment entry point, redirecting to the home page
- `home/`: home page, shared CSS, JavaScript, and favicon
- `other pages/`: secondary pages
- `patner images/`: supplied partner artwork
