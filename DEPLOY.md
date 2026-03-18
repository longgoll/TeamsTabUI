# Guide to Deploy Teams UI App to Vercel/Netlify

## 1. Build the Frontend

- Open terminal in your project folder.
- Run:

```
npm install
npm run build
```
- After building, the `dist` folder will be created.

## 2. Deploy to Vercel or Netlify

### Vercel
- Sign up at https://vercel.com
- Create a new project, select your repo or upload the `dist` folder.
- After deployment, you will get a public link like: `https://your-app.vercel.app`

### Netlify
- Sign up at https://netlify.com
- Create a new site, upload the `dist` folder.
- After deployment, you will get a public link like: `https://your-app.netlify.app`

## 3. Update manifest.json

- Open `appPackage/manifest.json`.
- Replace variables:
  - `${{TAB_ENDPOINT}}` → your public link (e.g. `https://your-app.vercel.app`)
  - `${{TAB_DOMAIN}}` → domain (e.g. `your-app.vercel.app`)
- Example:
```json
"contentUrl": "https://your-app.vercel.app/tabs/home",
"websiteUrl": "https://your-app.vercel.app/tabs/home",
"validDomains": ["your-app.vercel.app"]
```

## 4. Package the App

- Zip manifest.json and icons into a .zip file.
- Make sure the .zip only contains manifest.json and icons.

## 5. Import to Teams

- Go to Teams → Apps → Upload a custom app → Select the .zip file you just created.

---

If you see a blank screen, check that the links in manifest.json match your public link.

Good luck!
