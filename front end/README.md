# Acromind Initiative

Static, zero-build website for Acromind Initiative.

## Deploy

Use `front end` as the publish directory. No dependency installation or build command is required.

- GitHub Pages: publish the `front end` directory from the repository settings.
- Netlify: set the publish directory to `front end` and leave the build command empty.
- Vercel: import the repository. The root `vercel.json` sets the framework to Other, disables the build command, and publishes `front end`.
- Any web server: copy the contents of `front end` to the public web root.

The root `index.html`, `404.html`, `robots.txt`, and `.nojekyll` files are included for static hosting compatibility.

## Local preview

From the repository root, run a static server and open the URL it prints:

```powershell
npx serve "front end"
```

Opening `front end/index.html` directly also works, but a local server better matches production URL behavior.

## Custom domain

In Vercel, open the project settings, add `acromind.org` under **Domains**, and apply the DNS records Vercel displays at your domain registrar. Wait for Vercel to verify the domain and issue its TLS certificate. The site includes canonical URLs and a sitemap for `https://acromind.org`.

## Structure

- `index.html`: deployment entry point, redirecting to the home page
- `home/`: home page, shared CSS, JavaScript, and favicon
- `other pages/`: secondary pages
- `patner images/`: supplied partner artwork
