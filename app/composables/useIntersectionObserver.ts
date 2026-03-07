import { onMounted, onUnmounted } from 'vue';

export const useIntersectionObserver = () => {
  let observer: IntersectionObserver | null = null;
  
  onMounted(() => {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-on-scroll--visible');
          observer?.unobserve(entry.target); // Play once
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.15 // Trigger when 15% visible
    });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer?.observe(el));
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });
};
