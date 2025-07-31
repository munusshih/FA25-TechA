import Swiper from "swiper";
import { Autoplay, Mousewheel, Navigation } from "swiper/modules";
import "swiper/css";

function initAllSwipers() {
  document.querySelectorAll(".swiper").forEach((swiperEl) => {
    const container = swiperEl.parentNode.querySelector(
      ".swiper + .swiper-button-container",
    );

    const nextEl = container?.querySelector(".swiper-button-next");
    const prevEl = container?.querySelector(".swiper-button-prev");

    const isMobile = window.innerWidth < 768;

    new Swiper(swiperEl, {
      modules: [Autoplay, Mousewheel, Navigation],
      direction: "horizontal",
      slidesPerView: "auto",
      spaceBetween: -5,
      grabCursor: !isMobile,
      allowTouchMove: !isMobile,
      mousewheel: isMobile
        ? false
        : {
            forceToAxis: true,
            sensitivity: 1,
          },
      navigation: {
        nextEl,
        prevEl,
      },
    });
  });
}

// Run on page load and Astro navigation
initAllSwipers();
document.addEventListener("astro:page-load", () => {
  initAllSwipers();
});
