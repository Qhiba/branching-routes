# Phase 00 — Setup Guide

> **Who does this:** You (the human).
> **Who does NOT do this:** The AI.
> **When you're done:** Hand off to the AI to run Phase 01.

---

## What you need before you start

- [ ] Node.js installed — version **18 or higher**
  Check: open a terminal and run `node -v`
  If you see `v18.x.x` or higher, you're good.
  If not, download from https://nodejs.org (choose the LTS version)

- [ ] A terminal you're comfortable with (PowerShell, Terminal, anything)

- [ ] The project folder already exists (it does — you're in it)

---

## Step 1 — Create the Vite project

Open your terminal. Make sure you are inside the project folder.

Run this:
```
npx create-vite@latest ./ --template react
```

It will ask you questions. Do this:
- **"Current directory is not empty. Remove existing files and continue?"** → choose **Yes**
- **"Select a framework"** → choose **React** (if it asks, the `--template react` flag should handle it)
- **"Select a variant"** → choose **JavaScript** (not TypeScript)

Wait for it to finish. You'll see "Done."

---

## Step 2 — Install dependencies

Run this:
```
npm install
```

Wait for it to finish. You'll see a line like `added 200 packages`.

Then run this:
```
npm install zustand @xyflow/react
```

Wait again. Same kind of output.

---

## Step 3 — Check it works

Run this:
```
npm run dev
```

Open your browser and go to: **http://localhost:5173**

You should see a white page with a Vite + React logo and a counter button.
That means it worked.

Press `Ctrl + C` in the terminal to stop it.

---

## Step 4 — Verify (takes 2 minutes)

Open the browser to **http://localhost:5173** again (run `npm run dev` if you stopped it).

Do these checks:

| Check | What you should see |
|---|---|
| Page loads | A page appears — doesn't matter what's on it yet |
| No red screen | No error overlay covering the page |
| Console is clean | Open DevTools (F12) → Console tab → no red errors |
| Network is quiet | DevTools → Network tab → after page loads, no ongoing requests |

If all four are green, you're done.

---

## Step 5 — Tell the AI you're done

Say: **"Phase 00 complete, run Phase 01."**

The AI will take over from here. You don't touch the terminal again until Phase 01 is done.

---

## If something went wrong

**"npx create-vite failed"**
→ Try `npm install -g create-vite` first, then run `create-vite ./ --template react`

**"npm install failed with EACCES or permission errors"**
→ Do not use `sudo npm install`. Instead, fix your npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally

**"Port 5173 is already in use"**
→ Vite will automatically try the next port (5174, 5175...). Look at the terminal output for the actual URL.

**"I see a blank white page with no Vite logo"**
→ Hard-refresh the browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
