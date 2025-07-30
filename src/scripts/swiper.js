import Swiper from "swiper";
import { Autoplay, Mousewheel, Navigation } from "swiper/modules";
import "swiper/css";

function initAllSwipers() {
  document.querySelectorAll(".swiper").forEach((swiperEl) => {
    // Using the sibling selector from the parent element
    const container = swiperEl.parentNode.querySelector(
      ".swiper + .swiper-button-container",
    );

    const nextEl = container.querySelector(".swiper-button-next");
    const prevEl = container.querySelector(".swiper-button-prev");

    new Swiper(swiperEl, {
      modules: [Autoplay, Mousewheel, Navigation],
      direction: "horizontal",
      slidesPerView: "auto",
      spaceBetween: -2,
      grabCursor: true,
      mousewheel: {
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
