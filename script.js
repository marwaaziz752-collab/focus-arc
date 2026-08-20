// Focus Arc keeps all timer state in one small, readable object.
const timerDurations = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15
};

const state = {
  currentMode: 'focus',
  remainingSeconds: timerDurations.focus * 60,
  isRunning: false,
  timerIntervalId: null,
  completedFocusSessions: 0,
  cycleSessions: 0,
  settings: { ...timerDurations, sound: false },
  sessionLog: [],
  dailyActivity: {}
};

const timerElement = document.querySelector('#timer-heading');
const modeLabel = document.querySelector('#mode-label');
const statusLabel = document.querySelector('#status-label');
const timerHelp = document.querySelector('#timer-help');
const companionMessage = document.querySelector('#companion-message');
const progressDots = document.querySelector('#progress-dots');
const sessionCount = document.querySelector('#session-count');
const progressNote = document.querySelector('#progress-note');
const settingsForm = document.querySelector('#settings-form');
const settingsMessage = document.querySelector('#settings-message');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const resetButton = document.querySelector('#reset-button');
const skipButton = document.querySelector('#skip-button');
const soundToggle = document.querySelector('#sound-toggle');
const appViews = document.querySelectorAll('.app-view');
const navButtons = document.querySelectorAll('.nav-button');

function getDurationInSeconds(mode) {
  return state.settings[mode] * 60;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const leftoverSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${leftoverSeconds}`;
}

function updateDisplay() {
  const modeNames = { focus: 'FOCUS SESSION', shortBreak: 'SHORT BREAK', longBreak: 'LONG BREAK' };
  const modeMessages = { focus: 'One focused chapter at a time.', shortBreak: 'Step away and reset.', longBreak: 'Arc checkpoint unlocked.' };
  const companionMessages = { focus: 'studying...', shortBreak: 'taking a break...', longBreak: 'arc complete!' };
  const bunny = document.querySelector('.pixel-bunny');

  timerElement.textContent = formatTime(state.remainingSeconds);
  modeLabel.textContent = modeNames[state.currentMode];
  timerHelp.textContent = modeMessages[state.currentMode];
  companionMessage.textContent = companionMessages[state.currentMode];
  bunny.className = `pixel-bunny ${state.currentMode === 'focus' ? 'working' : state.currentMode === 'shortBreak' ? 'break' : 'long-break'}`;
  statusLabel.textContent = state.isRunning ? 'IN PROGRESS' : 'READY';
  document.title = `${formatTime(state.remainingSeconds)} - Focus Arc`;
  updateProgress();
  updateSessionLog();
}

function updateProgress() {
  progressDots.textContent = '';
  for (let index = 0; index < 4; index += 1) {
    const dot = document.createElement('span');
    dot.className = 'progress-dot';
    dot.setAttribute('aria-hidden', 'true');
    if (index < state.cycleSessions) dot.classList.add('complete');
    progressDots.appendChild(dot);
  }

  progressDots.setAttribute('aria-label', `${state.cycleSessions} of 4 focus sessions completed in this arc`);
  sessionCount.textContent = `${state.completedFocusSessions} ${state.completedFocusSessions === 1 ? 'session' : 'sessions'}`;
  progressNote.textContent = state.cycleSessions === 4
    ? 'Long break unlocked. Nice work.'
    : 'Complete four focus sessions to unlock a long break.';
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  state.timerIntervalId = setInterval(tick, 1000);
  updateDisplay();
}

function tick() {
  if (state.remainingSeconds > 0) {
    state.remainingSeconds -= 1;
    updateDisplay();
  }
  if (state.remainingSeconds === 0) finishCurrentMode();
}

function pauseTimer() {
  if (!state.isRunning) return;
  clearInterval(state.timerIntervalId);
  state.timerIntervalId = null;
  state.isRunning = false;
  updateDisplay();
}

function resetTimer() {
  pauseTimer();
  state.remainingSeconds = getDurationInSeconds(state.currentMode);
  updateDisplay();
}

function skipTimer() {
  pauseTimer();
  switchMode();
}

function finishCurrentMode() {
  pauseTimer();
  playCompletionSound();
  logSession(state.currentMode);
  if (state.currentMode === 'focus') completeFocusSession();
  else switchMode();
  const bunny = document.querySelector('.pixel-bunny');
  bunny.classList.add('completed');
  setTimeout(() => bunny.classList.remove('completed'), 600);
}

function completeFocusSession() {
  state.completedFocusSessions += 1;
  state.cycleSessions += 1;
  saveProgress();
  saveActivity();
  switchMode();
}

function switchMode() {
  if (state.currentMode === 'focus') {
    state.currentMode = state.cycleSessions === 4 ? 'longBreak' : 'shortBreak';
  } else {
    if (state.currentMode === 'longBreak') {
      state.cycleSessions = 0;
      saveProgress();
    }
    state.currentMode = 'focus';
  }
  state.remainingSeconds = getDurationInSeconds(state.currentMode);
  updateDisplay();
}

function saveProgress() {
  localStorage.setItem('focusArcProgress', JSON.stringify({
    completedFocusSessions: state.completedFocusSessions,
    cycleSessions: state.cycleSessions
  }));
}

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function logSession(mode) {
  state.sessionLog.unshift({ mode, minutes: state.settings[mode], completedAt: new Date().toISOString() });
  state.sessionLog = state.sessionLog.slice(0, 30);
  localStorage.setItem('focusArcSessionLog', JSON.stringify(state.sessionLog));
}

function saveActivity() {
  const today = getTodayKey();
  if (!state.dailyActivity[today]) state.dailyActivity[today] = { sessions: 0, minutes: 0 };
  state.dailyActivity[today].sessions += 1;
  state.dailyActivity[today].minutes += state.settings.focus;
  localStorage.setItem('focusArcDailyActivity', JSON.stringify(state.dailyActivity));
  updateProgressViews();
}

function updateSessionLog() {
  const logElement = document.querySelector('#session-log');
  if (!logElement) return;
  logElement.textContent = '';
  if (state.sessionLog.length === 0) {
    logElement.innerHTML = '<p class="empty-log">Your completed chapters will appear here.</p>';
    return;
  }
  state.sessionLog.slice(0, 8).forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'log-row';
    const label = entry.mode === 'focus' ? 'Focus' : entry.mode === 'shortBreak' ? 'Short Break' : 'Long Break';
    const icon = entry.mode === 'focus' ? '●' : '○';
    row.innerHTML = `<span>${icon} ${label}</span><span>${entry.minutes} min</span>`;
    logElement.appendChild(row);
  });
}

function loadProgress() {
  try {
    const savedProgress = JSON.parse(localStorage.getItem('focusArcProgress'));
    const savedSettings = JSON.parse(localStorage.getItem('focusArcSettings'));
    const savedLog = JSON.parse(localStorage.getItem('focusArcSessionLog'));
    const savedActivity = JSON.parse(localStorage.getItem('focusArcDailyActivity'));
    if (savedProgress) {
      state.completedFocusSessions = Number(savedProgress.completedFocusSessions) || 0;
      state.cycleSessions = Math.min(Number(savedProgress.cycleSessions) || 0, 4);
    }
    if (savedSettings) {
      state.settings = {
        focus: Number(savedSettings.focus) || timerDurations.focus,
        shortBreak: Number(savedSettings.shortBreak) || timerDurations.shortBreak,
        longBreak: Number(savedSettings.longBreak) || timerDurations.longBreak,
        sound: Boolean(savedSettings.sound)
      };
    }
    if (Array.isArray(savedLog)) state.sessionLog = savedLog;
    if (savedActivity && typeof savedActivity === 'object') state.dailyActivity = savedActivity;
  } catch (error) {
    localStorage.removeItem('focusArcProgress');
    localStorage.removeItem('focusArcSettings');
  }

  document.querySelector('#focus-duration').value = state.settings.focus;
  document.querySelector('#short-break-duration').value = state.settings.shortBreak;
  document.querySelector('#long-break-duration').value = state.settings.longBreak;
  soundToggle.checked = state.settings.sound;
  state.remainingSeconds = getDurationInSeconds(state.currentMode);
}

function saveSettings(event) {
  event.preventDefault();
  if (!settingsForm.reportValidity()) return;

  const formData = new FormData(settingsForm);
  const newSettings = {
    focus: Number(formData.get('focusDuration')),
    shortBreak: Number(formData.get('shortBreakDuration')),
    longBreak: Number(formData.get('longBreakDuration')),
    sound: soundToggle.checked
  };

  if (newSettings.focus < 1 || newSettings.focus > 180 || newSettings.shortBreak < 1 || newSettings.shortBreak > 60 || newSettings.longBreak < 1 || newSettings.longBreak > 120) {
    settingsMessage.textContent = 'Please choose values within the listed limits.';
    return;
  }

  pauseTimer();
  state.settings = newSettings;
  state.remainingSeconds = getDurationInSeconds(state.currentMode);
  localStorage.setItem('focusArcSettings', JSON.stringify(state.settings));
  settingsMessage.textContent = 'Settings saved for your next chapter.';
  updateDisplay();
}

function updateProgressViews() {
  const today = getTodayKey();
  const todayData = state.dailyActivity[today] || { sessions: 0, minutes: 0 };
  const activityValues = Object.values(state.dailyActivity);
  const totalSessions = activityValues.reduce((sum, day) => sum + day.sessions, 0);
  const todaySessions = document.querySelector('#today-sessions');
  if (!todaySessions) return;
  todaySessions.textContent = todayData.sessions;
  document.querySelector('#today-focus-time').textContent = `${todayData.minutes}m`;
  document.querySelector('#total-sessions').textContent = totalSessions;
  document.querySelector('#day-streak').textContent = calculateStreak();
  renderActivityMap();
  renderWeeklyChart();
}

function calculateStreak() {
  let streak = 0;
  const date = new Date();
  while (state.dailyActivity[getTodayKey(date)]?.sessions > 0) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function renderActivityMap() {
  const map = document.querySelector('#activity-map');
  if (!map) return;
  map.textContent = '';
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const day = document.createElement('div');
    day.className = 'activity-day';
    const count = state.dailyActivity[getTodayKey(date)]?.sessions || 0;
    const square = document.createElement('span');
    square.className = `activity-square level-${Math.min(count, 3)}`;
    square.title = `${count} focus session${count === 1 ? '' : 's'}`;
    day.innerHTML = `<span>${date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span>`;
    day.appendChild(square);
    map.appendChild(day);
  }
}

function renderWeeklyChart() {
  const chart = document.querySelector('#weekly-chart');
  if (!chart) return;
  chart.textContent = '';
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [];
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - mondayOffset + index);
    values.push(state.dailyActivity[getTodayKey(date)]?.minutes || 0);
  }
  const max = Math.max(...values, 1);
  values.forEach((minutes, index) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `<span>${week[index]}</span><span class="bar-track"><span class="bar-fill" style="width: ${(minutes / max) * 100}%"></span></span><span class="bar-value">${minutes}m</span>`;
    chart.appendChild(row);
  });
}

function showView(viewId) {
  appViews.forEach((view) => {
    const isActive = view.id === viewId;
    view.hidden = !isActive;
    view.classList.toggle('active-view', isActive);
  });
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === viewId));
  if (viewId === 'progress-view') updateProgressViews();
}

function playCompletionSound() {
  if (!state.settings.sound || !window.AudioContext) return;
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.04, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.25);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.25);
}

startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
skipButton.addEventListener('click', skipTimer);
settingsForm.addEventListener('submit', saveSettings);
navButtons.forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelector('#year').textContent = new Date().getFullYear();

loadProgress();
updateDisplay();
updateProgressViews();
