(() => {
  "use strict";

  const root = document.getElementById("dslMovie");
  if (!root) return;

  const el = {
    date: document.getElementById("dslMovieDate"),
    event: document.getElementById("dslMovieEvent"),
    mark: document.getElementById("dslMovieMark"),
    type: document.getElementById("dslMovieType"),
    song: document.getElementById("dslMovieSong"),
    artist: document.getElementById("dslMovieArtist"),
    progress: document.getElementById("dslTimelineProgress"),
    nodes: document.getElementById("dslTimelineNodes"),
    counter: document.getElementById("dslMovieCounter"),
    final: document.getElementById("dslMovieFinal"),
    skip: document.getElementById("dslMovieSkip")
  };

  const timings = {
    intro: 760,
    eventVisible: 680,
    eventGap: 100,
    finalDelay: 140,
    finalHold: 720
  };

  let stopped = false;
  let timers = [];
  let played = false;

  const wait = (ms) => new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    timers.push(timer);
  });

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers = [];
  }

  function compactHistory(history) {
    const rows = Array.isArray(history) ? history.filter(Boolean) : [];
    return rows;
  }

  function buildNodes(history) {
    el.nodes.innerHTML = "";
    const count = Math.max(history.length, 1);
    history.forEach((item, index) => {
      const node = document.createElement("span");
      node.className = `dsl-timeline__node is-${item.type}`;
      node.style.left = `${(index / Math.max(count - 1, 1)) * 100}%`;
      node.dataset.index = String(index);
      el.nodes.appendChild(node);
    });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function pickLine(item, key, label) {
    const row = item[key];
    const empty = key === "add" ? "追加なし" : "抹消なし";
    if (!row) {
      return `<span class="dsl-movie__pick is-empty"><b>${label}</b><span>${empty}</span></span>`;
    }
    return `<span class="dsl-movie__pick is-${key}"><b>${label}</b><span>${escapeHtml(row.title)}</span></span>`;
  }

  function activateNode(history, index) {
    [...el.nodes.children].forEach((node, i) => {
      node.classList.toggle("is-active", i <= index);
    });
    const percent = history.length <= 1 ? 100 : (index / (history.length - 1)) * 100;
    el.progress.style.width = `${percent}%`;
  }

  function renderEvent(history, item, index) {
    el.date.textContent = item.date;
    el.mark.textContent = "+/-";
    el.type.textContent = "MONTHLY PICKS";
    el.song.innerHTML = pickLine(item, "add", "+") + pickLine(item, "remove", "-");
    const addArtist = item.add?.artist || "";
    const removeArtist = item.remove?.artist || "";
    el.artist.textContent = [addArtist && `+ ${addArtist}`, removeArtist && `- ${removeArtist}`].filter(Boolean).join(" / ");
    el.event.classList.toggle("is-remove", false);
    el.counter.textContent =
      `${String(index + 1).padStart(2, "0")} / ${String(history.length).padStart(2, "0")}`;
    activateNode(history, index);
  }

  async function showEvent(history, item, index) {
    if (stopped) return;
    renderEvent(history, item, index);
    root.classList.remove("is-event-out");
    root.classList.add("is-event");
    await wait(timings.eventVisible);
    if (stopped) return;
    root.classList.remove("is-event");
    root.classList.add("is-event-out");
    await wait(timings.eventGap);
  }

  function showFinal() {
    stopped = true;
    clearTimers();
    root.classList.remove("is-intro", "is-event", "is-event-out", "is-waiting");
    root.classList.add("is-final");
    el.event.setAttribute("aria-hidden", "true");
    el.date.setAttribute("aria-hidden", "true");
    el.final.setAttribute("aria-hidden", "false");
    el.final.classList.add("is-visible");
    el.progress.style.width = "100%";
    el.counter.textContent = "DSL / 75 MIN";
    window.setTimeout(dismiss, timings.finalHold);
  }

  function dismiss() {
    root.classList.add("is-dismissed");
  }

  async function play(history) {
    if (played) return;
    played = true;
    stopped = false;
    clearTimers();
    history = compactHistory(history);
    buildNodes(history);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || history.length === 0) {
      showFinal();
      return;
    }

    root.classList.remove("is-waiting", "is-final", "is-dismissed");
    el.event.setAttribute("aria-hidden", "false");
    el.date.setAttribute("aria-hidden", "false");
    el.final.setAttribute("aria-hidden", "true");
    el.final.classList.remove("is-visible");
    root.classList.add("is-intro");
    await wait(timings.intro);

    for (let index = 0; index < history.length; index += 1) {
      if (stopped) return;
      await showEvent(history, history[index], index);
    }

    await wait(timings.finalDelay);
    showFinal();
    sessionStorage.setItem("dslHeroPlayed", "1");
  }

  window.DSL_HERO_UPDATE = (history) => play(history);
  window.DSL_HERO_FINAL = showFinal;
  window.addEventListener("dsl:skip", showFinal);
  el.skip?.addEventListener("click", showFinal);
  root.addEventListener("click", showFinal);
  root.addEventListener("touchstart", showFinal, { passive: true });

  root.classList.add("is-waiting");
  window.setTimeout(() => {
    if (!played) showFinal();
  }, 2200);
})();
