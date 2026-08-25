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
    covers: document.getElementById("dslActiveCovers"),
    skip: document.getElementById("dslMovieSkip")
  };

  const timings = {
    intro: 1500,
    finalHold: 420
  };

  let stopped = false;
  let timers = [];
  let played = false;

  function isMobile() {
    return window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;
  }

  const wait = (ms) => new Promise((resolve) => {
    const timer = window.setTimeout(resolve, ms);
    timers.push(timer);
  });

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers = [];
  }

  function buildNodes(history = []) {
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

  function mobileHistory() {
    return [
      { type: "add" },
      { type: "month" },
      { type: "add" },
      { type: "remove" },
      { type: "month" },
      { type: "add" }
    ];
  }

  function activateNode(history, index) {
    Array.prototype.slice.call(el.nodes.children).forEach((node, i) => {
      node.classList.toggle("is-active", i <= index);
    });
    const percent = history.length <= 1 ? 100 : (index / (history.length - 1)) * 100;
    el.progress.style.width = `${percent}%`;
  }

  function showFinal() {
    stopped = true;
    clearTimers();
    dismiss();
  }

  function dismiss() {
    root.classList.add("is-dismissed");
  }

  function renderActiveCovers(covers = []) {
    if (!el.covers) return;
    el.covers.innerHTML = "";
    if (isMobile()) return;
    covers
      .filter((item) => item && item.img)
      .slice(0, 8)
      .forEach((item) => {
        const image = document.createElement("img");
        image.className = "dsl-active-cover";
        image.src = item.img;
        image.alt = "";
        el.covers.appendChild(image);
      });
  }

  async function play() {
    if (played) return;
    played = true;
    stopped = false;
    clearTimers();
    buildNodes([]);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      dismiss();
      return;
    }

    const mobile = isMobile();
    root.classList.toggle("is-mobile", mobile);
    root.classList.remove("is-waiting", "is-final", "is-dismissed");
    el.event.setAttribute("aria-hidden", "true");
    el.date.setAttribute("aria-hidden", "true");
    el.final.setAttribute("aria-hidden", "true");
    el.final.classList.remove("is-visible");

    if (mobile) {
      const history = mobileHistory();
      buildNodes(history);
      el.final.setAttribute("aria-hidden", "false");
      el.final.classList.add("is-visible");
      root.classList.add("is-final");
      for (let i = 0; i < history.length; i += 1) {
        if (stopped) return;
        activateNode(history, i);
        await wait(230);
      }
      await wait(1300);
      dismiss();
      sessionStorage.setItem("dslHeroPlayed", "1");
      return;
    }

    root.classList.add("is-intro");
    await wait(timings.intro);
    dismiss();
    sessionStorage.setItem("dslHeroPlayed", "1");
  }

  window.DSL_HERO_UPDATE = () => {
    renderActiveCovers(window.DSL_ACTIVE_COVERS || []);
    play();
  };
  window.DSL_HERO_FINAL = dismiss;
  window.addEventListener("dsl:skip", dismiss);
  if (el.skip) el.skip.addEventListener("click", dismiss);
  root.addEventListener("click", dismiss);
  root.addEventListener("touchstart", dismiss, { passive: true });

  try {
    const savedTracks = JSON.parse(localStorage.getItem("tracks") || "[]");
    renderActiveCovers(savedTracks
      .filter((track) => track && track.removedDate === "Active" && track.img && track.img !== "0")
      .sort((a, b) => (b.days || 0) - (a.days || 0))
      .slice(0, 8));
  } catch (error) {
    renderActiveCovers([]);
  }

  root.classList.add("is-waiting");
  window.setTimeout(() => {
    if (!played) dismiss();
  }, 2200);
})();
