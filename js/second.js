// Инициализация слайдеров для портальных секций
document.addEventListener('DOMContentLoaded', function() {
  const sliders = document.querySelectorAll('.portal-slider');

  sliders.forEach(slider => {
    const container = slider.querySelector('.portal-slider__container');
    const cards = container.querySelectorAll('.portal-card');
    const prevBtn = slider.querySelector('.portal-slider__btn--prev');
    const nextBtn = slider.querySelector('.portal-slider__btn--next');

    if (!container || !cards.length) return;

    let currentIndex = 0;
    const cardsPerView = getCardsPerView();

    function getCardsPerView() {
      const width = window.innerWidth;
      if (width <= 768) return 1;
      if (width <= 1200) return 2;
      return 3;
    }

    function updateSlider() {
      if (cards.length === 0) return;
      
      // Используем реальную ширину первой карточки + gap
      const firstCard = cards[0];
      if (!firstCard) return;
      
      const cardRect = firstCard.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const gap = 30;
      const cardWidth = cardRect.width;
      const translateX = -currentIndex * (cardWidth + gap);
      
      container.style.transform = `translateX(${translateX}px)`;
      
      // Проверяем, что последняя карточка полностью видна
      const cardsPerView = getCardsPerView();
      if (currentIndex + cardsPerView >= cards.length) {
        const lastCard = cards[cards.length - 1];
        if (lastCard) {
          const lastCardRect = lastCard.getBoundingClientRect();
          const trackRect = slider.querySelector('.portal-slider__track').getBoundingClientRect();
          // Если последняя карточка обрезана, корректируем позицию
          if (lastCardRect.right > trackRect.right) {
            const overflow = lastCardRect.right - trackRect.right;
            container.style.transform = `translateX(${translateX - overflow}px)`;
          }
        }
      }
    }

    function updateButtons() {
      const cardsPerView = getCardsPerView();
      const maxIndex = Math.max(0, cards.length - cardsPerView);
      
      if (prevBtn) {
        prevBtn.style.opacity = currentIndex > 0 ? '1' : '0.5';
        prevBtn.style.pointerEvents = currentIndex > 0 ? 'auto' : 'none';
      }
      
      // Разрешаем прокрутку до последней карточки включительно
      if (nextBtn) {
        nextBtn.style.opacity = currentIndex <= maxIndex ? '1' : '0.5';
        nextBtn.style.pointerEvents = currentIndex <= maxIndex ? 'auto' : 'none';
      }
    }

    function goToPrev() {
      if (currentIndex > 0) {
        currentIndex--;
        updateSlider();
        updateButtons();
      }
    }

    function goToNext() {
      const cardsPerView = getCardsPerView();
      // Увеличиваем maxIndex на 1, чтобы можно было прокрутить до последней карточки
      const maxIndex = Math.max(0, cards.length - cardsPerView);
      if (currentIndex <= maxIndex) {
        currentIndex++;
        updateSlider();
        updateButtons();
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', goToPrev);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', goToNext);
    }

    // Обработка свайпов на мобильных устройствах
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
    }

    // Обновление при изменении размера окна
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const cardsPerView = getCardsPerView();
        const maxIndex = Math.max(0, cards.length - cardsPerView);
        if (currentIndex > maxIndex) {
          currentIndex = maxIndex;
        }
        updateSlider();
        updateButtons();
      }, 250);
    });

    // Инициализация
    setTimeout(() => {
      updateSlider();
      updateButtons();
    }, 100);

    // Анимация появления карточек
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 50);
        }
      });
    }, observerOptions);

    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      cardObserver.observe(card);
    });
  });
});
