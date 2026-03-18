# Deploy Teams Tab App to Vercel (Production)

This guide is for deploying the React Teams Tab in this repo to Vercel and loading it in Microsoft Teams without blank-screen issues.

## 1) Prepare project config

- Ensure `vite.config.js` uses root base path:

```js
base: "/"
```

- Ensure `vercel.json` exists at project root:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This rewrite makes SPA routing stable when Teams opens the tab URL.

## 2) Build and push

- Run:

```
npm install
npm run build:frontend
```

- Push the latest code to your Git repository branch connected to Vercel.

## 3) Deploy on Vercel

- Import the repo into Vercel.
- Keep default build settings unless your Vercel project already has custom settings.
- Wait for deployment to finish and copy your production URL, for example:

```
https://your-app.vercel.app
```

## 4) Update Teams manifest

Edit `appPackage/manifest.json`:

- `contentUrl`: use root URL (not `/tabs/home`)
- `websiteUrl`: use root URL (not `/tabs/home`)
- `validDomains`: include only your Vercel domain

Example:

```json
"contentUrl": "https://your-app.vercel.app/",
"websiteUrl": "https://your-app.vercel.app/",
"validDomains": ["your-app.vercel.app"]
```

## 5) Package and upload app to Teams

- Zip only these files from `appPackage/`:
  - `manifest.json`
  - `color.png`
  - `outline.png`
- In Teams: Apps → Manage your apps (or Upload a custom app) → upload the zip.

## 6) Verify in Teams Web first

- Open the tab in Teams Web (Edge/Chrome).
- If blank screen appears, press F12 and check Console/Network.

## Troubleshooting checklist (blank screen)

- Tab URL in manifest uses `/` (not `/tabs/home`).
- `validDomains` exactly matches Vercel host.
- Vercel deploy is the latest commit.
- JS/CSS assets return `200` in Network tab.
- No Teams SDK init error shown in the page.
