/* FlipClock — hora certa com animação flip */
let muteFlipAudio = true;
let use24h = localStorage.getItem("clock_24h") !== "0";
let showSeconds = localStorage.getItem("clock_seconds") !== "0";

const hourCard = document.getElementById("data-hour-card");
const minuteCard = document.getElementById("data-minute-card");
const secondCard = document.getElementById("data-second-card");
const secondHolder = document.getElementById("second-holder");
const clockDate = document.getElementById("clock-date");
const clockAmpm = document.getElementById("clock-ampm");
const opt24h = document.getElementById("opt-24h");
const optSeconds = document.getElementById("opt-seconds");
const sizeSlider = document.getElementById("size_range_slider");
const clockContainer = document.querySelector(".container");
const menuToggle = document.getElementById("menu_toggle");
const menuClose = document.getElementById("menu_close");
const controls = document.getElementById("controls");
const volumeOn = document.getElementById("volume_on");
const volumeOff = document.getElementById("volume_off");

/* ---------- Sound: WebAudio synthesized flip tick ---------- */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function playTick() {
  if (muteFlipAudio) return;
  try {
    ensureAudio();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const variants = [1900, 2300, 2600, 3100, 1700];
    osc.frequency.value = variants[Math.floor(Math.random() * variants.length)];
    osc.type = "square";
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  } catch (e) { /* audio indisponível */ }
}

function syncVolumeIcon() {
  if (!volumeOn || !volumeOff) return;
  if (muteFlipAudio) {
    volumeOn.style.display = "none";
    volumeOff.style.display = "block";
  } else {
    volumeOn.style.display = "block";
    volumeOff.style.display = "none";
  }
}
if (volumeOn) volumeOn.onclick = () => { muteFlipAudio = true; syncVolumeIcon(); };
if (volumeOff) volumeOff.onclick = () => { ensureAudio(); muteFlipAudio = false; syncVolumeIcon(); };
syncVolumeIcon();

/* ---------- Flip rendering ---------- */
function flip(flipCard, newNumber) {
  const topHalf = flipCard.querySelector(".top");
  const startNumber = topHalf.textContent;
  if (newNumber === startNumber) return;
  const bottomHalf = flipCard.querySelector(".bottom");
  const topFlip = document.createElement("div");
  topFlip.classList.add("top-flip");
  const bottomFlip = document.createElement("div");
  bottomFlip.classList.add("bottom-flip");
  topHalf.textContent = startNumber;
  bottomHalf.textContent = startNumber;
  topFlip.textContent = startNumber;
  bottomFlip.textContent = newNumber;
  topFlip.addEventListener("animationstart", () => { topHalf.textContent = newNumber; });
  topFlip.addEventListener("animationend", () => { topFlip.remove(); });
  bottomFlip.addEventListener("animationend", () => {
    bottomHalf.textContent = newNumber;
    bottomFlip.remove();
  });
  flipCard.append(topFlip, bottomFlip);
}

function updateClockDisplay(hr, min, sec) {
  const beforeHr = hourCard.querySelector(".top").textContent;
  const beforeMin = minuteCard.querySelector(".top").textContent;
  const beforeSec = secondCard.querySelector(".top").textContent;
  flip(hourCard, hr);
  flip(minuteCard, min);
  flip(secondCard, sec);
  if (!muteFlipAudio && (beforeHr !== hr || beforeMin !== min || beforeSec !== sec)) playTick();
  document.title = `${hr}:${min}${showSeconds ? ":" + sec : ""} — FlipClock`;
}

/* ---------- Live clock engine ---------- */
function pad(n) {
  return String(n).padStart(2, "0");
}

function tickClock() {
  const now = new Date();
  let h = now.getHours();
  let ampm = "";
  if (!use24h) {
    ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }
  const hr = pad(h);
  const min = pad(now.getMinutes());
  const sec = pad(now.getSeconds());

  updateClockDisplay(hr, min, showSeconds ? sec : sec);

  // data em pt-BR: "dom · 13 set 2026"
  try {
    const parts = new Intl.DateTimeFormat("pt-BR", {
      weekday: "short", day: "2-digit", month: "short",
    }).format(now).replace(/\./g, "");
    if (clockDate) clockDate.textContent = parts;
  } catch (e) {
    if (clockDate) clockDate.textContent = now.toLocaleDateString("pt-BR");
  }
  if (clockAmpm) {
    if (use24h) clockAmpm.classList.add("hide");
    else {
      clockAmpm.classList.remove("hide");
      clockAmpm.textContent = ampm;
    }
  }
}

function applySecondVisibility() {
  if (secondHolder) secondHolder.style.display = showSeconds ? "" : "none";
  // com 3 cards visíveis, mantém dígitos compactos
  document.body.classList.add("with-hours");
}

/* ---------- Options (24h / segundos) ---------- */
if (opt24h) {
  opt24h.checked = use24h;
  opt24h.addEventListener("change", () => {
    use24h = opt24h.checked;
    localStorage.setItem("clock_24h", use24h ? "1" : "0");
    tickClock();
  });
}
if (optSeconds) {
  optSeconds.checked = showSeconds;
  optSeconds.addEventListener("change", () => {
    showSeconds = optSeconds.checked;
    localStorage.setItem("clock_seconds", showSeconds ? "1" : "0");
    applySecondVisibility();
    tickClock();
  });
}

/* ---------- Size slider ---------- */
function clockSize() {
  clockContainer.style.transform = "scale(" + sizeSlider.value / 100 + ")";
  localStorage.setItem("clock_scale", sizeSlider.value);
}
sizeSlider.addEventListener("input", clockSize);
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("clock_scale");
  if (saved) {
    sizeSlider.value = saved;
    clockContainer.style.transform = "scale(" + saved / 100 + ")";
  }
});

/* ---------- Menu show/hide (começa fechado) ---------- */
menuToggle.style.display = "block";
menuClose.style.display = "none";
controls.classList.add("close");
menuToggle.onclick = () => {
  menuToggle.style.display = "none";
  menuClose.style.display = "block";
  controls.classList.remove("close");
  controls.style.display = "flex";
};
menuClose.onclick = closeMenu;
function closeMenu() {
  menuToggle.style.display = "block";
  menuClose.style.display = "none";
  controls.classList.add("close");
}
// clicar fora do menu também fecha
document.addEventListener("click", (e) => {
  if (controls.classList.contains("close")) return;
  if (e.target.closest("#controls") || e.target.closest(".menu")) return;
  closeMenu();
});

/* ---------- Light / dark (automático: segue o navegador) ---------- */
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: light)");
function applyColorScheme() {
  const mode = colorSchemeQuery.matches ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", mode);
  applyCustomThemeColors();
}
function applyStoredThemeMode() {
  applyColorScheme();
}
if (typeof colorSchemeQuery.addEventListener === "function") {
  colorSchemeQuery.addEventListener("change", applyColorScheme);
} else if (typeof colorSchemeQuery.addListener === "function") {
  colorSchemeQuery.addListener(applyColorScheme);
}

/* ---------- Custom color themes ---------- */
const THEMES = {
  theme1: { dark: ["#0F140F", "#1A1F1A", "#C4EBC1"], light: ["#E8FFE8", "#D6F5D6", "#546654"] },
  theme2: { dark: ["#131315", "#1B1C20", "#C5C8F8"], light: ["#EFF2FF", "#E4E7FE", "#222843"] },
  theme3: { dark: ["#1B1616", "#271E1E", "#EF6666"], light: ["#FFF4F4", "#FFEDED", "#FF8F8F"] },
  theme4: { dark: ["#16120B", "#221E17", "#FFAC45"], light: ["#FFF7EC", "#FFEED6", "#FDC97B"] },
  theme5: { dark: ["#131519", "#1A1E23", "#CCE1FF"], light: ["#F5F9FF", "#E4EFFF", "#2C3440"] },
  theme6: { dark: ["#0D0F11", "#14161A", "#FFD458"], light: ["#FFFDF4", "#FFF8E1", "#FFDB57"] },
  theme7: { dark: ["#1A171C", "#221D23", "#E3CEEC"], light: ["#FCF5FF", "#F8E8FF", "#574260"] },
  theme8: { dark: ["#181B19", "#1E2320", "#BEEBD2"], light: ["#F5FFFA", "#E6F8EE", "#5F8873"] },
};
function applyCustomThemeColors() {
  const current = localStorage.getItem("current_theme");
  const mode = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  if (!current || !THEMES[current]) return;
  const [bg, holder, text] = THEMES[current][mode];
  document.body.style.setProperty("--background", bg);
  document.body.style.setProperty("--holder", holder);
  document.body.style.setProperty("--text", text);
}
document.querySelector(".default_theme").addEventListener("click", () => {
  localStorage.removeItem("current_theme");
  document.body.style.removeProperty("--background");
  document.body.style.removeProperty("--holder");
  document.body.style.removeProperty("--text");
});
Object.keys(THEMES).forEach((key) => {
  const el = document.querySelector("." + key);
  if (!el) return;
  el.addEventListener("click", () => {
    localStorage.setItem("current_theme", key);
    applyCustomThemeColors();
  });
});

/* ---------- Themes panel toggle ---------- */
const themesContainer = document.getElementsByClassName("themes_container")[0];
const themesToggle = document.getElementsByClassName("themes_toggle")[0];
const themesCloseToggle = document.getElementById("themes_close_toggle");
themesToggle.addEventListener("click", () => {
  themesContainer.classList.remove("close");
  themesContainer.style.display = "grid";
  themesToggle.style.display = "none";
  themesCloseToggle.style.display = "block";
});
themesCloseToggle.addEventListener("click", () => {
  themesContainer.classList.add("close");
  themesToggle.style.display = "block";
  themesCloseToggle.style.display = "none";
});

/* ---------- Fullscreen ---------- */
document.querySelector(".full").onclick = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else if (document.exitFullscreen) document.exitFullscreen();
};

/* ---------- Lo-Fi player (botão removido do menu; código mantido à prova de nulo) ---------- */
const lofiButton = document.getElementById("lofi_button");
const lofiPlayer = document.getElementById("lofi_player");
const lofiContainer = document.getElementById("lofi_container");
const lofiCloseButton = document.getElementById("lofi_close_button");
if (lofiCloseButton) lofiCloseButton.onclick = () => {
  if (lofiContainer) lofiContainer.classList.add("hide");
  if (lofiPlayer) lofiPlayer.src = "";
};
if (lofiButton) lofiButton.onclick = () => {
  if (typeof LOFI !== "undefined" && LOFI.code && lofiPlayer) {
    lofiPlayer.src = "https://www.youtube.com/embed/" + LOFI.code + "?autoplay=1";
  }
  if (lofiContainer) lofiContainer.classList.remove("hide");
};

/* ---------- Init ---------- */
applyStoredThemeMode();
applySecondVisibility();
(function init() {
  const now = new Date();
  let h = now.getHours();
  if (!use24h) h = h % 12 || 12;
  const hr = pad(h);
  const min = pad(now.getMinutes());
  const sec = pad(now.getSeconds());
  // pinta direto sem animação no primeiro frame
  hourCard.querySelector(".top").textContent = hr;
  hourCard.querySelector(".bottom").textContent = hr;
  minuteCard.querySelector(".top").textContent = min;
  minuteCard.querySelector(".bottom").textContent = min;
  secondCard.querySelector(".top").textContent = sec;
  secondCard.querySelector(".bottom").textContent = sec;
  tickClock();
  // sincroniza com a virada do segundo e depois a cada 1s
  const msToNextSecond = 1000 - now.getMilliseconds();
  setTimeout(() => {
    tickClock();
    setInterval(tickClock, 1000);
  }, msToNextSecond);
})();
