document.getElementById("year").textContent = new Date().getFullYear();

const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
  io.observe(el);
});

// Cursor-following hero spotlight (fine pointers only)
const hero = document.querySelector(".hero");
const spot = document.querySelector(".hero__spot");
if (hero && spot && matchMedia("(pointer: fine)").matches) {
  hero.addEventListener(
    "pointermove",
    (e) => {
      const r = hero.getBoundingClientRect();
      spot.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      spot.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    },
    { passive: true }
  );
}
