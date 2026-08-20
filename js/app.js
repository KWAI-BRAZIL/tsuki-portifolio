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

    index = to;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    bar.style.width = `${((index + 1) / total) * 100}%`;
    counter.textContent = pad(index + 1);
    history.replaceState(null, "", `#${ids[index]}`);
    if (to === 0) playHero();
    else if (heroVideo && !heroVideo.paused) heroVideo.pause();

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
      if (Math.abs(e.deltaY) < 24) return;
      const inner = slides[index].querySelector(".slide__inner");
      if (inner && inner.scrollHeight > inner.clientHeight + 8) {
        const atTop = inner.scrollTop <= 0;
        const atBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 2;
        if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
      }
      e.preventDefault();
      go(index + (e.deltaY > 0 ? 1 : -1));
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    const keysNext = ["ArrowDown", "ArrowRight", "PageDown", " ", "Enter"];
    const keysPrev = ["ArrowUp", "ArrowLeft", "PageUp", "Backspace"];
    if (keysNext.includes(e.key)) {
      e.preventDefault();
      go(index + 1);
    } else if (keysPrev.includes(e.key)) {
      e.preventDefault();
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
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 48) return;
      go(index + (dy > 0 ? 1 : -1));
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

  const playHero = () => {
    if (!hero) return;
    hero.classList.remove("is-playing");
    void hero.offsetWidth;
    hero.classList.add("is-playing");
    if (hero.classList.contains("has-video")) {
      heroVideo?.play().catch(() => {});
    }
  };

  if (heroVideo) {
    const onReady = () => {
      hero?.classList.add("has-video");
      if (index === 0) heroVideo.play().catch(() => {});
    };
    heroVideo.addEventListener("loadeddata", onReady);
    heroVideo.addEventListener("error", () => {
      hero?.classList.remove("has-video");
    });
    heroVideo.querySelector("source")?.addEventListener("error", () => {
      hero?.classList.remove("has-video");
    });
  }

  playHero();

  fsBtn?.addEventListener("click", toggleFs);
})();
