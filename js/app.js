(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const dots = [...document.querySelectorAll(".dots__item")];
  const bar = document.querySelector(".nav__bar");
  const counter = document.querySelector(".nav__counter em");
  const fsBtn = document.querySelector(".nav__fs");
  const total = slides.length;
  let index = 0;
  let locked = false;
  const ids = slides.map((s) => s.id);

  const pad = (n) => String(n).padStart(2, "0");
  const innerOf = (el) => el?.querySelector(".slide__inner");
  let quietUntil = 0;

  const atEdge = (inner, dir) => {
    if (!inner) return true;
    const max = inner.scrollHeight - inner.clientHeight;
    if (max <= 24) return true;
    if (dir > 0) return inner.scrollTop >= max - 8;
    return inner.scrollTop <= 8;
  };

  const go = (next) => {
    if (locked) return;
    const to = Math.max(0, Math.min(total - 1, next));
    if (to === index) return;
    locked = true;

    const fromEl = slides[index];
    const toEl = slides[to];
    fromEl.classList.add("is-leave");
    fromEl.classList.remove("is-active");
    toEl.classList.add("is-active");
    const nextInner = innerOf(toEl);
    if (nextInner) nextInner.scrollTop = 0;

    index = to;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    bar.style.width = `${((index + 1) / total) * 100}%`;
    counter.textContent = pad(index + 1);
    history.replaceState(null, "", `#${ids[index]}`);
    if (to === 0) playHero();
    else if (heroVideo && !heroVideo.paused) heroVideo.pause();
    quietUntil = performance.now() + 700;

    window.setTimeout(() => {
      fromEl.classList.remove("is-leave");
      locked = false;
    }, 650);
  };

  const fromHash = () => {
    const hash = location.hash.replace("#", "");
    const found = ids.indexOf(hash);
    if (found >= 0) {
      slides[index].classList.remove("is-active");
      index = found;
      slides[index].classList.add("is-active");
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
      bar.style.width = `${((index + 1) / total) * 100}%`;
      counter.textContent = pad(index + 1);
    }
  };

  fromHash();

  window.addEventListener("hashchange", fromHash);

  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (locked) return;
      const dy = e.deltaY;
      if (Math.abs(dy) < 1) return;
      const now = performance.now();
      const inner = innerOf(slides[index]);
      const dir = dy > 0 ? 1 : -1;

      if (inner) {
        const max = Math.max(0, inner.scrollHeight - inner.clientHeight);
        if (max > 24 && !atEdge(inner, dir)) {
          inner.scrollTop += dy;
          quietUntil = now + 480;
          return;
        }
      }

      if (now < quietUntil) return;
      go(index + dir);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    const keysNext = ["ArrowDown", "ArrowRight", "PageDown", " ", "Enter"];
    const keysPrev = ["ArrowUp", "ArrowLeft", "PageUp", "Backspace"];
    const inner = innerOf(slides[index]);
    if (keysNext.includes(e.key)) {
      e.preventDefault();
      const scrollKey = e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ";
      if (scrollKey && inner && !atEdge(inner, 1)) {
        inner.scrollBy({ top: Math.round(inner.clientHeight * 0.85), behavior: "smooth" });
        quietUntil = performance.now() + 480;
        return;
      }
      go(index + 1);
    } else if (keysPrev.includes(e.key)) {
      e.preventDefault();
      const scrollKey = e.key === "ArrowUp" || e.key === "PageUp";
      if (scrollKey && inner && !atEdge(inner, -1)) {
        inner.scrollBy({ top: -Math.round(inner.clientHeight * 0.85), behavior: "smooth" });
        quietUntil = performance.now() + 480;
        return;
      }
      go(index - 1);
    } else if (e.key === "Home") {
      go(0);
    } else if (e.key === "End") {
      go(total - 1);
    } else if (e.key.toLowerCase() === "f") {
      toggleFs();
    }
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => go(Number(dot.dataset.goto)));
  });

  let touchY = 0;
  window.addEventListener(
    "touchstart",
    (e) => {
      touchY = e.changedTouches[0].clientY;
    },
    { passive: true }
  );
  window.addEventListener(
    "touchend",
    (e) => {
      if (locked) return;
      const inner = innerOf(slides[index]);
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 48) return;
      const dir = dy > 0 ? 1 : -1;
      if (inner && !atEdge(inner, dir)) return;
      if (performance.now() < quietUntil) return;
      go(index + dir);
    },
    { passive: true }
  );

  const toggleFs = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const hero = document.querySelector(".hero");
  const heroVideo = document.querySelector(".hero__video");

  const videoSrc = () => {
    const path = window.location.pathname;
    const dir = path.endsWith("/") || path.endsWith(".html")
      ? path.replace(/[^/]+$/, "")
      : `${path}/`;
    return `${dir}assets/tsuki-capa.mp4`;
  };

  const tryPlay = () => {
    if (!heroVideo) return Promise.resolve();
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.playsInline = true;
    const play = heroVideo.play();
    return play ? play.catch(() => {}) : Promise.resolve();
  };

  const playHero = () => {
    if (index === 0) tryPlay();
  };

  if (heroVideo) {
    heroVideo.setAttribute("playsinline", "");
    heroVideo.setAttribute("webkit-playsinline", "");
    heroVideo.src = videoSrc();
    heroVideo.load();
    ["loadeddata", "canplay", "canplaythrough"].forEach((ev) => {
      heroVideo.addEventListener(ev, () => {
        if (index === 0) tryPlay();
      });
    });
    const unlock = () => tryPlay();
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("pointerdown", unlock, { passive: true });
  }

  playHero();

  fsBtn?.addEventListener("click", toggleFs);
})();
