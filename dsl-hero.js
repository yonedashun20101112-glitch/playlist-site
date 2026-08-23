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
    intro: 1500,
    finalHold: 420
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

  function activateNode(history, index) {
    [...el.nodes.children].forEach((node, i) => {
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

    root.classList.remove("is-waiting", "is-final", "is-dismissed");
    el.event.setAttribute("aria-hidden", "true");
    el.date.setAttribute("aria-hidden", "true");
    el.final.setAttribute("aria-hidden", "true");
    el.final.classList.remove("is-visible");
    root.classList.add("is-intro");
    await wait(timings.intro);
    dismiss();
    sessionStorage.setItem("dslHeroPlayed", "1");
  }

  window.DSL_HERO_UPDATE = () => play();
  window.DSL_HERO_FINAL = dismiss;
  window.addEventListener("dsl:skip", dismiss);
  el.skip?.addEventListener("click", dismiss);
  root.addEventListener("click", dismiss);
  root.addEventListener("touchstart", dismiss, { passive: true });

  root.classList.add("is-waiting");
  window.setTimeout(() => {
    if (!played) dismiss();
  }, 2200);
})();
