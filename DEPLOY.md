# Deploy on Render (free, about 5 minutes)

1. Create a GitHub repo and push this folder (`.gitignore` already excludes `node_modules` and `data.db`).
   ```bash
   git init && git add . && git commit -m "Ajaia Docs"
   git branch -M main
   git remote add origin https://github.com/<you>/ajaia-docs.git && git push -u origin main
   ```
2. On https://render.com choose **New > Web Service**, connect the repo. Render reads `render.yaml`, or set: Build `npm install`, Start `npm start`, Plan Free.
3. When the deploy finishes, open the `https://<name>.onrender.com` URL and sign in as Alice.
