# Focus Arc

**Your next productive chapter.**

Focus Arc is a cozy, pixel-inspired Pomodoro study timer. Complete focused sessions, take intentional breaks, and build a small arc of progress through your day.

## Features

- Working focus, short break, and long break countdowns
- Four-session Pomodoro cycle with an automatic long break
- Start, pause, reset, and skip controls
- Custom focus and break durations
- Progress saved in the browser with localStorage
- Responsive layout and keyboard-friendly controls
- Static files that deploy directly to Vercel

## Technologies

Focus Arc uses only HTML5, CSS3, and vanilla JavaScript. It has no framework, backend, database, build tool, or external API.

## How the timer works

A focus session lasts 25 minutes by default. It is followed by a 5-minute short break. After four completed focus sessions, the next break is 15 minutes. Finishing that long break starts a new four-session cycle.

The JavaScript stores the current mode, remaining seconds, running state, interval ID, total completed sessions, and current cycle progress in a small state object. `setInterval()` calls the timer's `tick()` function once per second. A guard in `startTimer()` prevents more than one interval from running. When the count reaches zero, the app completes the focus session or switches to the next mode.

## localStorage

The app saves completed progress under `focusArcProgress` and custom durations under `focusArcSettings`. The active interval is never saved. On refresh, the app loads progress and settings, then safely starts a fresh timer for the current focus mode.

## Run locally in VS Code

1. Open the `focus-arc` folder in VS Code.
2. Open `index.html` in a browser, or use VS Code's Live Server extension if you already have it installed.
3. No installation or build command is required.

## Deploy to Vercel

1. Create a new Vercel site.
2. Import the repository containing these files, or drag the `focus-arc` folder into Vercel.
3. Use the project folder as the publish directory. There is no build command.
4. Replace `https://focus-arc-orpin.vercel.app/` in `index.html`, `robots.txt`, and `sitemap.xml` with your real production URL.

## Test checklist

- Start, pause, reset, and skip the timer.
- Click Start repeatedly and confirm the timer still decreases one second at a time.
- Pause before starting, reset while running, and skip while running.
- Temporarily use short settings such as 1 minute to test mode transitions.
- Complete four focus sessions and confirm the long break appears.
- Refresh the page and confirm progress and settings remain.
- Resize the browser to a phone width and check that controls remain usable without horizontal scrolling.
