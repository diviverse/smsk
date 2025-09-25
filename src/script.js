function crash(msg = "The website is under construction.") {
  document.body.innerHTML = `<p class="error mt-5">\
      Sorry for the inconvenience.<br />${msg}\
    </p>\
    <div class="logo">S</div>`;
  document.body.classList.add("error");
}

(async () => {
  try {
    const jsonURL = ".json";
    const posts = await fetch(jsonURL)
      .then((r) => {
        if (!r.ok) throw new Error("Oops! Something went wrong.");
        return r.json();
      })
      .catch((err) => {
        crash(err.message);
      });

    const visiblePosts = posts
      .filter((p) => p.vis === 1)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (visiblePosts.length === 0) {
      crash("No posts to show.");
    } else {
      buildSlider(visiblePosts.slice(0, 5));
      buildPosts(visiblePosts);
    }
  } catch (err) {
    console.error("Oops! Something went wrong.");
    console.error(err);
    crash(err.message);
  } finally {
    document.getElementById("loading")?.remove();
  }
})();

function buildSlider(images) {
  const imgcount = images.length;
  const slider = document.getElementById("slider");
  const dots = document.getElementById("dots");

  const track = document.createElement("div");
  track.className = "slider-track  justify-content-center";
  slider.insertBefore(track, dots);

  const arrowLeft = document.getElementById("arrow-left");
  const arrowRight = document.getElementById("arrow-right");

  const offsetX = imgcount / 2 - 0.5;

  let currentSlide = 0;

  images.forEach((obj, i) => {
    const img = document.createElement("img");
    img.className = "slide";
    img.src = obj.img;
    img.alt = obj.title || "Post image";
    img.draggable = false;
    if (imgcount > 1) img.classList.add("grab");
    track.appendChild(img);

    const dot = document.createElement("button");
    dot.className = "dot";
    dot.dataset.index = i;
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${i + 1} of ${imgcount}`);
    dot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goTo(i);
      }
    });
    dot.setAttribute("aria-current", i === 0 ? "true" : "false");
    dot.addEventListener("click", (e) => {
      goTo(+e.currentTarget.dataset.index);
    });
    dots.appendChild(dot);
  });

  let slideWidth = track.firstElementChild.getBoundingClientRect().width;

  const updateSlideWidth = () => {
    slideWidth = track.firstElementChild.getBoundingClientRect().width;
    updatePosition(true);
  };
  if (document.readyState !== "loading") updateSlideWidth();
  else document.addEventListener("DOMContentLoaded", updateSlideWidth);
  window.addEventListener("load", updateSlideWidth);
  new ResizeObserver(updateSlideWidth).observe(track.firstElementChild);

  let timer = null;

  function startAutoplay() {
    if (imgcount <= 1) return;
    clearInterval(timer);
    timer = setInterval(() => changeBy(1), 4000);
  }
  function pauseAutoplay() {
    clearInterval(timer);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAutoplay();
    } else {
      updatePosition(true);
      startAutoplay();
    }
  });

  function updateDots() {
    dots.querySelectorAll(".dot").forEach((d, i) => {
      d.classList.toggle("active", i === currentSlide);
      d.setAttribute("aria-current", i === currentSlide ? "true" : "false");
    });
  }

  function updatePosition(instant = false) {
    track.style.transition = instant ? "none" : "transform 0.6s ease";
    track.style.transform = `translateX(${
      (offsetX - currentSlide) * slideWidth
    }px)`;

    updateDots();
  }

  function simulateArrowClick(target = 0, inf = false) {
    const targetArrow = target === 1 ? arrowRight : arrowLeft;
    targetArrow.classList.add("clicked");
    if (!inf) {
      setTimeout(() => {
        targetArrow.classList.remove("clicked");
      }, 500);
    }
  }

  function goTo(n) {
    currentSlide = n;
    updatePosition();
  }
  function changeBy(x = 1, target = 0) {
    currentSlide = (currentSlide + x + imgcount) % imgcount;
    if (target !== 0) simulateArrowClick(target);
    updatePosition();
  }

  if (imgcount > 1) {
    let isHolding = false;

    startAutoplay();

    const pauseAreas = [arrowLeft, arrowRight, dots];
    pauseAreas.forEach((el) => {
      el.addEventListener("mouseenter", pauseAutoplay);
      el.addEventListener("mouseleave", startAutoplay);
    });

    let isDragging = false;
    let startX = 0;

    function onMove(e) {
      if (!isDragging) return;
      const currentX = e.type.includes("touch")
        ? e.touches[0].clientX
        : e.clientX;
      const delta = currentX - startX;
      track.style.transform = `translateX(${
        (offsetX - currentSlide) * slideWidth + delta * 1.3
      }px)`;
    }

    function onEnd(e) {
      if (!isDragging) return;
      isDragging = false;

      const endX = e.type.includes("touch")
        ? e.changedTouches[0].clientX
        : e.clientX;
      const delta = endX - startX;

      if (Math.abs(delta) > slideWidth / 10)
        delta < 0 ? changeBy(1) : changeBy(-1);
      else updatePosition();

      startAutoplay();

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    }

    slider.addEventListener("mousedown", (e) => {
      pauseAutoplay();
      isDragging = true;
      startX = e.clientX;

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onEnd);
    });

    slider.addEventListener("touchstart", (e) => {
      pauseAutoplay();
      isDragging = true;
      startX = e.touches[0].clientX;

      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("touchend", onEnd);
    });

    arrowLeft.addEventListener("click", () => changeBy(-1, -1));
    arrowRight.addEventListener("click", () => changeBy(1, 1));

    document.addEventListener("mousedown", () => {
      isHolding = true;
      pauseAutoplay();
    });
    document.addEventListener("mouseup", () => {
      if (isHolding) {
        isHolding = false;
        startAutoplay();
      }
    });
    document.addEventListener("touchstart", () => {
      isHolding = true;
      pauseAutoplay();
    });
    document.addEventListener("touchend", () => {
      if (isHolding) {
        isHolding = false;
        startAutoplay();
      }
    });
  } else {
    simulateArrowClick(0, true);
    simulateArrowClick(1, true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateSlideWidth();
  });
}

let currentPage = 1;
const postsPerPage = 6;
let totalPages = 1;
let visiblePosts = [];

function buildPosts(allPosts) {
  visiblePosts = allPosts;
  totalPages = Math.ceil(visiblePosts.length / postsPerPage);
  showPage(currentPage);
  createPagination();
}

function showPage(page) {
  const ctr = document.getElementById("posts");
  ctr.innerHTML = "";
  const start = (page - 1) * postsPerPage;
  const end = start + postsPerPage;
  const postsToShow = visiblePosts.slice(start, end);
  postsToShow.forEach((p) => {
    const article = document.createElement("article");
    article.className = "post";
    const img = document.createElement("img");
    img.src = p.img;
    img.alt = p.title || "Post image";
    img.loading = "lazy";
    img.draggable = false;
    const text = document.createElement("div");
    text.className = "text";
    const title = document.createElement("h2");
    title.textContent = p.title;
    const time = document.createElement("time");
    time.textContent = p.date;
    const desc = document.createElement("p");
    desc.textContent = p.body;
    text.append(title, time, desc);
    article.appendChild(img);
    article.appendChild(text);
    ctr.appendChild(article);
  });
}

function newEllipsis() {
  const li = document.createElement("li");
  li.className = "page-item disabled d-flex align-items-center px-2";

  const elps = document.createElement("span");
  elps.textContent = "...";

  li.appendChild(elps);
  return li;
}

function createPagination() {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + 4);

  start = Math.max(1, end - 4);

  for (let i = start; i <= end; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;

    const a = document.createElement("a");
    a.className = "page-link bg-body text-body";
    a.href = "#";

    if (i === start && start > 1) {
      a.textContent = 1;
      a.pageType = 1;
    } else if (i === end && end < totalPages) {
      a.textContent = totalPages;
      a.pageType = -1;
    } else {
      a.textContent = i;
      a.pageType = 0;
    }

    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (a.pageType === 1) currentPage = 1;
      else if (a.pageType === -1) currentPage = totalPages;
      else currentPage = i;

      showPage(currentPage);
      createPagination();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    if (a.pageType === -1) container.appendChild(newEllipsis());

    li.appendChild(a);
    container.appendChild(li);

    if (a.pageType === 1) container.appendChild(newEllipsis());
  }
}
