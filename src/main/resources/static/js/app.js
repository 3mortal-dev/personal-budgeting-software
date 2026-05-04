document.addEventListener("DOMContentLoaded", () => {

  console.log("JS Loaded ✅");

  const imageWrap = document.getElementById("imageWrap");
  const message = document.getElementById("scrollMessage");

  if (!imageWrap || !message) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        message.classList.add("is-visible");
      } else {
        message.classList.remove("is-visible");
      }
    });
  }, { threshold: 0.4 });

  observer.observe(imageWrap);

});