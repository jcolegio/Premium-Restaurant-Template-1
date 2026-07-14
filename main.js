/* ============================================================
   ASH & AMBER — shared interactivity
   ============================================================ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Header: scroll state + mobile nav ---------- */
(function header() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!header) return;

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        document.body.style.overflow = "";
      })
    );
  }
})();

/* ---------- Ember particle canvas ---------- */
(function embers() {
  document.querySelectorAll(".ember-canvas").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    let w, h, particles;
    const density = Number(canvas.dataset.density || 45);

    function resize() {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    }

    function makeParticle() {
      return {
        x: Math.random() * w,
        y: h + Math.random() * h * 0.4,
        r: (Math.random() * 1.8 + 0.4) * devicePixelRatio,
        speed: (Math.random() * 0.5 + 0.18) * devicePixelRatio,
        drift: (Math.random() - 0.5) * 0.4 * devicePixelRatio,
        alpha: Math.random() * 0.6 + 0.2,
        flicker: Math.random() * 0.02 + 0.005,
        hue: Math.random() > 0.5 ? "193,80,46" : "168,124,79",
      };
    }

    resize();
    particles = Array.from({ length: density }, makeParticle);
    window.addEventListener("resize", resize);

    if (reducedMotion) {
      // static scatter, no animation loop
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},${p.alpha})`;
        ctx.arc(p.x, h * 0.5, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        p.alpha += (Math.random() - 0.5) * p.flicker;
        p.alpha = Math.max(0.08, Math.min(0.85, p.alpha));
        if (p.y < -10) Object.assign(p, makeParticle(), { y: h + 10 });
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();

/* ---------- Hero 3D tilt (mouse-follow plate) ---------- */
(function heroTilt() {
  const stage = document.querySelector(".hero-stage");
  const plate = document.querySelector(".plate");
  if (!stage || !plate || reducedMotion) return;

  stage.addEventListener("mousemove", (e) => {
    const rect = stage.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    plate.style.transform = `rotateX(${8 - py * 22}deg) rotateY(${-10 + px * 26}deg)`;
  });
  stage.addEventListener("mouseleave", () => {
    plate.style.transform = "rotateX(8deg) rotateY(-10deg)";
  });
})();

/* ---------- Generic tilt cards (about/gallery) ---------- */
(function tiltCards() {
  if (reducedMotion) return;
  document.querySelectorAll(".tilt-card").forEach((card) => {
    const inner = card.querySelector(".tilt-card-inner");
    if (!inner) return;
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      inner.style.transform = `rotateX(${-py * 14}deg) rotateY(${px * 14}deg) translateZ(10px)`;
    });
    card.addEventListener("mouseleave", () => {
      inner.style.transform = "rotateX(0) rotateY(0)";
    });
  });
})();

/* ---------- Flip cards (menu highlights) ---------- */
(function flipCards() {
  document.querySelectorAll(".flip-card").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-flipped"));
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("is-flipped");
      }
    });
  });
})();

/* ---------- Review 3D coverflow carousel ---------- */
(function reviewCarousel() {
  const stage = document.querySelector(".review-stage");
  if (!stage) return;
  const cards = Array.from(stage.querySelectorAll(".review-card"));
  const dotsWrap = document.querySelector(".review-nav");
  let active = 0;
  let timer;

  cards.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "review-dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", `Show review ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsWrap?.appendChild(dot);
  });
  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

  function render() {
    cards.forEach((card, i) => {
      const offset = i - active;
      const abs = Math.abs(offset);
      if (abs > 2) {
        card.style.opacity = "0";
        card.style.pointerEvents = "none";
        return;
      }
      card.style.pointerEvents = offset === 0 ? "auto" : "none";
      card.style.opacity = String(1 - abs * 0.4);
      card.style.zIndex = String(10 - abs);
      card.style.filter = offset === 0 ? "none" : "blur(1.5px)";
      card.style.transform = `translateX(calc(-50% + ${offset * 92}%)) translateZ(${-abs * 160}px) rotateY(${offset * -18}deg) scale(${1 - abs * 0.12})`;
    });
    dots.forEach((d, i) => d.classList.toggle("is-active", i === active));
  }

  function goTo(i) {
    active = (i + cards.length) % cards.length;
    render();
  }

  function autoplay() {
    if (reducedMotion) return;
    clearInterval(timer);
    timer = setInterval(() => goTo(active + 1), 5200);
  }

  stage.addEventListener("mouseenter", () => clearInterval(timer));
  stage.addEventListener("mouseleave", autoplay);

  render();
  autoplay();
})();

/* ---------- FAQ accordion ---------- */
(function faq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".faq-item").forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".faq-a").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("is-open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });
})();

/* ---------- Menu category filter ---------- */
(function menuFilter() {
  const tabs = document.querySelectorAll(".menu-tab");
  const dishes = document.querySelectorAll("[data-category]");
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const cat = tab.dataset.filter;
      dishes.forEach((dish) => {
        const show = cat === "all" || dish.dataset.category === cat;
        dish.style.display = show ? "" : "none";
      });
    });
  });
})();

/* ---------- Reveal on scroll ---------- */
(function reveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((item) => io.observe(item));
})();

/* ---------- Contact form ---------- */
(function contactForm() {
  const form = document.querySelector("#reserve-form");
  if (!form) return;
  const status = document.querySelector(".form-status");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("#name").value.trim();
    const date = form.querySelector("#date").value;
    if (!name || !date) {
      status.textContent = "Please fill in your name and preferred date.";
      status.classList.add("is-visible");
      return;
    }
    status.textContent = `Thank you, ${name.split(" ")[0]} — your table request for ${date} has been sent. We'll confirm by email shortly.`;
    status.classList.add("is-visible");
    form.reset();
  });
})();
