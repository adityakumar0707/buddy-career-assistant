# Buddy

AI study abroad assistant. Static front end in `public/`, serverless functions in `api/` that call Gemini. The key stays on the server.

## Run locally
1. Copy `.env.example` to `.env` and paste your Gemini key.
2. `node server.js` then open http://localhost:3000

## Deploy on Vercel
1. Push this folder to a GitHub repo. Check first: `git status` must NOT list `.env`.
2. On vercel.com choose Add New, Project, import the repo. No build settings needed.
3. Before deploying, open Environment Variables and add `GEMINI_API_KEY` with your key.
4. Deploy. Open `https://YOUR-APP.vercel.app/api/health?check=1`. It must show `"check":"working"`.
5. Test one full run: onboarding, home rows, a college, the SOP.
6. In Vercel, Settings, Deployment Protection: set Vercel Authentication to Disabled so other people can open the link.

## If the check fails
- `check: failed` with an error message: the key or model name is wrong. Set `GEMINI_MODEL` (for example `gemini-2.5-flash`) as an environment variable and redeploy.
- Rows say "Try again": the research took longer than the function limit. Press Try again; results are cached after one success.

## Protecting the key
- Set a low spend limit on the key in Google Cloud or AI Studio.
- The server limits each visitor to 80 calls per 10 minutes and 1500 per day (`RATE_PER_IP`, `RATE_PER_DAY`).
- The key was shared in a chat. Rotate or delete it after the submission is reviewed.
