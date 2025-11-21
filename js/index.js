// Анимация появления элементов при скролле
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -20px 0px",
};

// Определяем тип устройства
const isMobile = window.innerWidth <= 768;

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const item = entry.target;

      // На мобильных устройствах показываем сразу без анимации
      if (isMobile) {
        item.style.transform = "none";
        item.style.opacity = "1";
      } else {
        // Только на десктопе добавляем анимацию
        item.style.animationDelay = item.dataset.delay + "s";
        item.classList.add("animate-item");
      }

      observer.unobserve(item);
    }
  });
}, observerOptions);

// Функция для получения информации о лицензии (глобальная, доступна везде)
function getLicenseInfo(planOrCard) {
  let licenseCard;
  let plan;
  
  // Если передан элемент (карточка), используем его, иначе ищем по плану
  if (planOrCard instanceof Element) {
    licenseCard = planOrCard;
    plan = licenseCard.getAttribute("data-plan");
  } else {
    plan = planOrCard;
    // Находим карточку лицензии по плану (обычные лицензии или маркетплейс)
    licenseCard = document.querySelector(`.license-card[data-plan="${plan}"]`);
    
    if (!licenseCard) {
      licenseCard = document.querySelector(`.marketplace-card[data-plan="${plan}"]`);
    }

    // Если не найдена обычная карточка, ищем в маркетплейсе по кнопке
    if (!licenseCard) {
      licenseCard = document.querySelector(`.marketplace-card .marketplace-card__buy-btn[data-plan="${plan}"]`)?.closest('.marketplace-card');
    }
  }
  
  if (!licenseCard) return null;

  // Получаем название лицензии
  const titleElement = licenseCard.querySelector(".license-card__title, .marketplace-card__title");
  const licenseName = titleElement ? titleElement.textContent.trim() : "";

  // Получаем количество пользователей
  let userCount = "";
  const marketplaceUsersAttr = licenseCard.getAttribute("data-marketplace-users");

  if (plan === "enterprise" || plan === "marketplace-portal") {
    // Для энтерпрайз и маркетплейс портала берем значение из селекта
    const userSelect = licenseCard.querySelector(".user-count-select, .marketplace-user-count-select");
    userCount = userSelect
      ? userSelect.value
      : plan === "marketplace-portal"
      ? "50"
      : "250";
  } else if (plan === "onprem-portal") {
    // Для корпоративного портала берем из текста в конкретной карточке
    const userCountElement = licenseCard.querySelector(".license-card__subheader-title");
    userCount = userCountElement ? userCountElement.textContent.trim() : "50";
  } else if (marketplaceUsersAttr) {
    userCount = marketplaceUsersAttr;
  } else {
    // Для остальных планов берем из заголовка
    // Проверяем сначала marketplace-card, потом license-card
    const userCountElement = licenseCard.querySelector(
      ".marketplace-card__subheader-title, .license-card__subheader-title, .marketplace-card__users"
    );
    userCount = userCountElement ? userCountElement.textContent.trim() : "";
  }

  // Получаем период оплаты
  let periodText = "";
  if (plan && plan.startsWith('marketplace-')) {
    // Для маркетплейса всегда 12 месяцев
    periodText = "12 мес";
  } else if (!plan || licenseCard.classList.contains('marketplace-card')) {
    // Если это карточка маркетплейса (даже без плана)
    // Проверяем subprice для определения периода
    const subpriceElement = licenseCard.querySelector(".marketplace-card__subheader-subprice");
    if (subpriceElement && subpriceElement.textContent.includes('мес')) {
      periodText = "мес";
    } else {
      periodText = "12 мес";
    }
  } else {
    const licGroup = licenseCard.getAttribute("data-lic-group");
    if (licGroup === "cloud") {
      periodText = "месяц";
    } else {
      // Для коробочных лицензий период всегда 12 месяцев
      periodText = "12 мес";
    }
  }

  // Получаем цену
  let price = "";
  if (plan && plan.startsWith('marketplace-')) {
    // Для маркетплейса берем текущую цену из subheader-price
    const priceElement = licenseCard.querySelector(".marketplace-card__price-current, .marketplace-card__subheader-price");
    price = priceElement ? priceElement.textContent.trim() : "";
  } else if (!plan || licenseCard.classList.contains('marketplace-card')) {
    // Если это карточка маркетплейса (даже без плана) или план не указан
    const priceElement = licenseCard.querySelector(".marketplace-card__price-current, .marketplace-card__subheader-price");
    price = priceElement ? priceElement.textContent.trim() : "";
  } else {
    const licGroup = licenseCard.getAttribute("data-lic-group");
    if (licGroup === "cloud") {
      // Для облачных лицензий используем старую логику
      const priceElement = licenseCard.querySelector(".price-current");
      price = priceElement ? priceElement.textContent.trim() : "";
    } else {
      // Для коробочных лицензий цена в другом элементе
      const priceElement = licenseCard.querySelector(
        ".license-card__subheader-price"
      );
      price = priceElement ? priceElement.textContent.trim() : "";
    }
  }

  return {
    licenseName,
    userCount,
    price,
    periodText
  }
}

// Наблюдаем за всеми элементами услуг
document.addEventListener("DOMContentLoaded", () => {
  const serviceCards = document.querySelectorAll(".service-card");
  serviceCards.forEach((card) => {
    // На мобильных устройствах показываем карточки сразу
    if (isMobile) {
      card.style.transform = "none";
      card.style.opacity = "1";
    } else {
      card.classList.remove("animate-item");
      observer.observe(card);
    }
  });
});

// Простой обработчик изменения размера окна
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const newIsMobile = window.innerWidth <= 768;
    if (newIsMobile !== isMobile) {
      location.reload();
    }
  }, 250);
});

// Функциональность разворачивания карточек тарифов
document.addEventListener("DOMContentLoaded", () => {
  const toggleButtons = document.querySelectorAll(".pricing-card__toggle");

  toggleButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();

      const target = button.getAttribute("data-target");
      const features = document.getElementById(`features-${target}`);
      const toggleText = button.querySelector(".toggle-text");

      // Переключаем состояние
      if (features.classList.contains("active")) {
        // Сворачиваем
        features.classList.remove("active");
        button.classList.remove("active");
        toggleText.textContent = "Развернуть";

        // Сбрасываем max-height для корректного сворачивания
        setTimeout(() => {
          features.style.maxHeight = "0";

          // После завершения анимации сворачивания сбрасываем стили
          setTimeout(() => {
            if (!features.classList.contains("active")) {
              features.style.maxHeight = "";
            }
          }, 300);
        }, 10);
      } else {
        // Разворачиваем
        features.classList.add("active");
        button.classList.add("active");
        toggleText.textContent = "Свернуть";

        // Добавляем небольшую задержку для плавной анимации
        setTimeout(() => {
          features.style.maxHeight = features.scrollHeight + "px";
        }, 10);
      }
    });
  });

  // (Убрано) Тоггл внутренних фич лицензий — оставляем только переключение групп

  // Переключение групп лицензий (Облако/Коробка)
  const licTabs = document.querySelectorAll(".licenses__tab");
  const licGroups = document.querySelectorAll(".licenses__group");
  const billTabs = document.querySelectorAll(".licenses__bill");
  const licenseCards = document.querySelectorAll(
    '.license-card[data-lic-group="cloud"]'
  );
  if (licTabs.length && licGroups.length) {
    licTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const group = tab.getAttribute("data-lic-group");
        // Активный таб
        licTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        // Видимость групп
        licGroups.forEach((g) => {
          if (g.getAttribute("data-lic-group") === group) {
            g.classList.add("active");
          } else {
            g.classList.remove("active");
          }
        });

        // Управление кнопками биллинга
        if (group === "onprem") {
          // Для коробки: дизейблим месяц, активируем год
          billTabs.forEach((billTab) => {
            const billType = billTab.getAttribute("data-bill");
            if (billType === "month") {
              billTab.classList.remove("active");
              billTab.disabled = true;
              billTab.style.opacity = "0.5";
              billTab.style.cursor = "not-allowed";
            } else if (billType === "year") {
              billTab.classList.add("active");
              billTab.disabled = false;
              billTab.style.opacity = "1";
              billTab.style.cursor = "pointer";
            }
          });
          // Обновляем цены для годового биллинга
          updatePrices("year");
        } else if (group === "cloud") {
          // Для облака: активируем обе кнопки
          billTabs.forEach((billTab) => {
            billTab.disabled = false;
            billTab.style.opacity = "1";
            billTab.style.cursor = "pointer";
          });
          // Восстанавливаем активную кнопку месяца
          const monthTab = document.querySelector(
            '.licenses__bill[data-bill="month"]'
          );
          const yearTab = document.querySelector(
            '.licenses__bill[data-bill="year"]'
          );
          if (monthTab && yearTab) {
            yearTab.classList.remove("active");
            monthTab.classList.add("active");
            updatePrices("month");
          }
        }
      });
    });
  }

  // Переключение биллинга (месяц/год) — только для облачных карточек
  function updatePrices(billing) {
    licenseCards.forEach((card) => {
      const month = card.getAttribute("data-month-price");
      const year = card.getAttribute("data-year-price");
      const priceOld = card.querySelector(".price-old");
      const priceCurrent = card.querySelector(".price-current");
      const priceSuffix = card.querySelector(".price-suffix");
      if (!priceCurrent || !priceSuffix) return;

      if (billing === "year") {
        // Показать старую цену (месячную) зачёркнутой, отобразить годовую как текущую
        if (priceOld) {
          priceOld.style.display = "inline";
          priceOld.textContent = `${Number(month).toLocaleString("ru-RU")} ₽`;
        }
        priceCurrent.textContent = `${Number(year).toLocaleString("ru-RU")}`;
        priceSuffix.textContent = "₽/месяц";
      } else {
        // Вернуть месяц — скрыть старую
        if (priceOld) {
          priceOld.style.display = "none";
          priceOld.textContent = "";
        }
        priceCurrent.textContent = `${Number(month).toLocaleString("ru-RU")}`;
        priceSuffix.textContent = "₽/месяц";
      }
    });
  }

  if (billTabs.length) {
    billTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Проверяем, не дизейблена ли кнопка
        if (tab.disabled) {
          return;
        }

        billTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const billing = tab.getAttribute("data-bill");
        updatePrices(billing);
      });
    });
  }

  // Обработчик для селекта количества пользователей в лицензии Энтерпрайз
  const userCountSelect = document.querySelector(
    '.user-count-select[data-plan="enterprise"]'
  );
  if (userCountSelect) {
    // Актуальные цены для лицензии Энтерпрайз (месячные)
    const enterprisePricesMonth = {
      250: 33990,
      500: 59990,
      1000: 99990,
      2000: 199990,
      3000: 299990,
      4000: 399990,
      5000: 499990,
      6000: 599990,
      7000: 699990,
      8000: 799990,
      9000: 899990,
      10000: 999990,
    };

    // Актуальные цены для лицензии Энтерпрайз (годовые)
    const enterprisePricesYear = {
      250: 27190,
      500: 47990,
      1000: 79990,
      2000: 159990,
      3000: 239990,
      4000: 319990,
      5000: 399990,
      6000: 479990,
      7000: 559990,
      8000: 639990,
      9000: 719990,
      10000: 799990,
    };

    function updateEnterprisePrice() {
      const selectedValue = userCountSelect.value;
      const priceCurrent = document.querySelector(
        '.license-card[data-plan="enterprise"] .price-current'
      );
      const priceOld = document.querySelector(
        '.license-card[data-plan="enterprise"] .price-old'
      );
      const activeBillTab = document.querySelector(".licenses__bill.active");
      const billing = activeBillTab
        ? activeBillTab.getAttribute("data-bill")
        : "month";

      if (billing === "year") {
        // Показываем годовую цену как текущую, месячную как перечеркнутую
        const yearPrice = enterprisePricesYear[selectedValue] || 27190;
        const monthPrice = enterprisePricesMonth[selectedValue] || 33990;

        if (priceCurrent) {
          priceCurrent.textContent = yearPrice.toLocaleString("ru-RU");
        }
        if (priceOld) {
          priceOld.style.display = "inline";
          priceOld.textContent = `${monthPrice.toLocaleString("ru-RU")} ₽`;
        }
      } else {
        // Показываем месячную цену как текущую, скрываем перечеркнутую
        const monthPrice = enterprisePricesMonth[selectedValue] || 33990;

        if (priceCurrent) {
          priceCurrent.textContent = monthPrice.toLocaleString("ru-RU");
        }
        if (priceOld) {
          priceOld.style.display = "none";
          priceOld.textContent = "";
        }
      }
    }

    userCountSelect.addEventListener("change", updateEnterprisePrice);

    // Обновляем цену при переключении биллинга
    const billTabs = document.querySelectorAll(".licenses__bill");
    billTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setTimeout(updateEnterprisePrice, 100); // Небольшая задержка для обновления активного таба
      });
    });
  }

  // Обработчик для кнопок "Купить" в лицензиях
  const buyButtons = document.querySelectorAll(".license-card__buy-btn");
  const buyModal = document.getElementById("buyModal");
  const closeBuyModal = document.getElementById("closeBuyModal");

  if (buyButtons.length && buyModal) {
    buyButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const plan = button.getAttribute("data-plan");
        // Находим родительскую карточку лицензии
        const licenseCard = button.closest(".license-card");
        buyModal.classList.add("active");
        document.body.style.overflow = "hidden";
        waitForB24Form().then((form) => {
          if (form) {
            const labels = ['Имя', 'Телефон', 'Email', 'Цена',  'Лицензия'];
            const allInputs = form.querySelectorAll('input');
            const price = allInputs[3];
            const licenseName = allInputs[4];
            price.disabled = true;
            licenseName.disabled = true;

            const b24FormFields = form.querySelectorAll('.b24-form-field');
            b24FormFields.forEach((div, index) => {
                // Проверяем, есть ли уже лейбл в этом поле
                const existingLabel = div.querySelector('.buy-modal-label');
                if (!existingLabel && index < labels.length) {
                    let label = document.createElement('label');
                    label.innerHTML = labels[index];
                    label.classList.add('buy-modal-label');
                    div.prepend(label);
                }
            })

            // Получаем информацию о выбранной лицензии
            // Передаем карточку, если она найдена, иначе план
            const licenseInfo = licenseCard ? getLicenseInfo(licenseCard) : getLicenseInfo(plan);
            if (price && licenseName && licenseInfo) {
              price.value = licenseInfo.price + ' ' + licenseInfo.periodText;
              licenseName.value = licenseInfo.licenseName + ' ' + licenseInfo.userCount + ' пользователей';
            }
          }
        });
      });
    });

    // Закрытие модального окна по кнопке
    if (closeBuyModal) {
      closeBuyModal.addEventListener("click", () => {
        buyModal.classList.remove("active");
        document.body.style.overflow = "";
      });
    }

    // Закрытие модального окна по клику вне формы
    buyModal.addEventListener("click", (e) => {
      if (e.target === buyModal) {
        buyModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });

    // Закрытие модального окна по Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && buyModal.classList.contains("active")) {
        buyModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }

  // Обработчик для кнопки "Оставить отзыв" внутри карусели
  const feedbackBtnCarousel = document.getElementById("feedbackBtnCarousel");
  const feedbackModal = document.getElementById("feedbackModal");
  const closeFeedbackModal = document.getElementById("closeFeedbackModal");

  if (feedbackBtnCarousel && feedbackModal) {
    // Открытие модального окна
    feedbackBtnCarousel.addEventListener("click", () => {
      console.log("Открываем модальное окно отзыва");
      feedbackModal.classList.add("active");
      document.body.style.overflow = "hidden"; // Блокируем прокрутку страницы
    });

    // Закрытие модального окна по кнопке
    if (closeFeedbackModal) {
      closeFeedbackModal.addEventListener("click", () => {
        feedbackModal.classList.remove("active");
        document.body.style.overflow = ""; // Возвращаем прокрутку страницы
      });
    }

    // Закрытие модального окна по клику вне формы
    feedbackModal.addEventListener("click", (e) => {
      if (e.target === feedbackModal) {
        feedbackModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });

    // Закрытие модального окна по Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && feedbackModal.classList.contains("active")) {
        feedbackModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }
});

// Обработчик для кнопок "Купить" в маркетплейсе
document.addEventListener("DOMContentLoaded", () => {
  const marketplaceBuyButtons = document.querySelectorAll(".marketplace-card__buy-btn");
  const buyModal = document.getElementById("buyModal");
  
  if (marketplaceBuyButtons.length && buyModal) {
    marketplaceBuyButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const plan = button.getAttribute("data-plan");
        // Находим родительскую карточку маркетплейса
        const marketplaceCard = button.closest(".marketplace-card");
        buyModal.classList.add("active");
        document.body.style.overflow = "hidden";
        waitForB24Form().then((form) => {
          if (form) {
            const labels = ['Имя', 'Телефон', 'Email', 'Цена',  'Лицензия'];
            const allInputs = form.querySelectorAll('input');
            const price = allInputs[3];
            const licenseName = allInputs[4];
            price.disabled = true;
            licenseName.disabled = true;

            const b24FormFields = form.querySelectorAll('.b24-form-field');
            b24FormFields.forEach((div, index) => {
                // Проверяем, есть ли уже лейбл в этом поле
                const existingLabel = div.querySelector('.buy-modal-label');
                if (!existingLabel && index < labels.length) {
                    let label = document.createElement('label');
                    label.innerHTML = labels[index];
                    label.classList.add('buy-modal-label');
                    div.prepend(label);
                }
            })

            // Получаем информацию о выбранной лицензии
            // Передаем карточку, если она найдена, иначе план
            const licenseInfo = marketplaceCard ? getLicenseInfo(marketplaceCard) : getLicenseInfo(plan);
            if (price && licenseName && licenseInfo) {
              price.value = licenseInfo.price + ' ' + licenseInfo.periodText;
              licenseName.value = licenseInfo.licenseName + ' ' + licenseInfo.userCount + ' пользователей';
            }
          }
        });
      });
    });
  }
});

// Обработчик для модального окна консультации с экспертом
document.addEventListener("DOMContentLoaded", () => {
  const consultationBtn = document.getElementById("consultationBtn");
  const consultationModal = document.getElementById("consultationModal");
  const closeConsultationModal = document.getElementById("closeConsultationModal");

  if (consultationBtn && consultationModal) {
    consultationBtn.addEventListener("click", () => {
      consultationModal.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    if (closeConsultationModal) {
      closeConsultationModal.addEventListener("click", () => {
        consultationModal.classList.remove("active");
        document.body.style.overflow = "visible";
      });
    }

    consultationModal.addEventListener("click", (e) => {
      if (e.target === consultationModal) {
        consultationModal.classList.remove("active");
        document.body.style.overflow = "visible";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && consultationModal.classList.contains("active")) {
        consultationModal.classList.remove("active");
        document.body.style.overflow = "visible";
      }
    });
  }
});

// Обработчик для модального окна расчета внедрения
document.addEventListener("DOMContentLoaded", () => {
  const calculationBtn = document.getElementById("calculationBtn");
  const calculationModal = document.getElementById("calculationModal");
  const closeCalculationModal = document.getElementById("closeCalculationModal");

  if (calculationBtn && calculationModal) {
    calculationBtn.addEventListener("click", () => {
      calculationModal.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    if (closeCalculationModal) {
      closeCalculationModal.addEventListener("click", () => {
        calculationModal.classList.remove("active");
        document.body.style.overflow = "visible";
      });
    }

    calculationModal.addEventListener("click", (e) => {
      if (e.target === calculationModal) {
        calculationModal.classList.remove("active");
        document.body.style.overflow = "visible";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && calculationModal.classList.contains("active")) {
        calculationModal.classList.remove("active");
        document.body.style.overflow = "visible";
      }
    });
  }
});

// Обработчик для селекта количества пользователей в маркетплейсе
document.addEventListener("DOMContentLoaded", () => {
  const marketplaceUserCountSelect = document.querySelector('.marketplace-user-count-select[data-plan="marketplace-portal"]');
  
  if (marketplaceUserCountSelect) {
    // Цены для корпоративного портала маркетплейса
    const marketplacePortalPrices = {
      '50': { old: 59990, current: 29995 },
      '100': { old: 79990, current: 39995 },
      '250': { old: 99990, current: 49995 },
      '500': { old: 119990, current: 59995 }
    };

    function updateMarketplacePortalPrice() {
      const selectedValue = marketplaceUserCountSelect.value;
      const prices = marketplacePortalPrices[selectedValue];
      
      if (prices) {
        // Находим родительскую карточку
        const marketplaceCard = marketplaceUserCountSelect.closest('.marketplace-card');
        const priceOld = marketplaceCard.querySelector('.marketplace-card__price-old');
        const priceCurrent = marketplaceCard.querySelector('.marketplace-card__subheader-price');
        
        if (priceOld) {
          priceOld.textContent = `${prices.old.toLocaleString('ru-RU')} ₽`;
        }
        if (priceCurrent) {
          priceCurrent.textContent = `${prices.current.toLocaleString('ru-RU')} ₽`;
        }
      }
    }

    marketplaceUserCountSelect.addEventListener('change', updateMarketplacePortalPrice);
    
    // Инициализируем цену при загрузке
    updateMarketplacePortalPrice();
  }
});

// Упрощенный прыгающий кружочек - только базовая анимация по границам

// Интерактивная диаграмма отраслей
document.addEventListener("DOMContentLoaded", () => {
  const chartColumns = document.querySelectorAll(".chart-column");

  // Добавляем hover эффекты для столбцов
  chartColumns.forEach((column) => {
    const bar = column.querySelector(".chart-bar");
    const label = column.querySelector(".chart-label");

    column.addEventListener("mouseenter", () => {
      // Увеличиваем столбец
      bar.style.transform = "scale(1.05)";

      // Подсвечиваем заголовок
      label.style.color = "#ffffff";
      label.style.transform = "scale(1.05)";
    });

    column.addEventListener("mouseleave", () => {
      // Возвращаем к нормальному состоянию
      bar.style.transform = "scale(1)";
      label.style.color = "rgba(255, 255, 255, 0.8)";
      label.style.transform = "scale(1)";
    });
  });

  // Анимация заполнения столбцов при появлении секции в поле зрения
  const industriesSection = document.querySelector(".industries");

  if (industriesSection) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Активируем анимацию для каждого столбца с задержкой
            chartColumns.forEach((column, index) => {
              setTimeout(() => {
                column.classList.add("animate");
              }, index * 300); // Задержка 300ms между столбцами
            });

            // Отключаем наблюдение после активации
            sectionObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.4, // Анимация сработает когда 40% секции будет видно
        rootMargin: "0px 0px -100px 0px",
      }
    );

    sectionObserver.observe(industriesSection);
  }
});

let startX = 0;
let active = 0;
let isDown = false;
const speedDrag = -0.1;
const getZindex = (array, index) =>
  array.map((_, i) =>
    index === i ? array.length : array.length - Math.abs(index - i)
  );
const carousel = document.querySelector(".carousel");
const $items = document.querySelectorAll(".carousel-item");
let progress = (10 * $items.length) / 2;
const displayItems = (item, index, active) => {
  const zIndex = getZindex([...$items], active)[index];
  item.style.setProperty("--zIndex", zIndex);
  item.style.setProperty("--active", (index - active) / $items.length);
  item.style.setProperty("--items", $items.length);
};
const animate = () => {
  progress = Math.max(0, Math.min(progress, $items.length * 10));
  active = Math.floor((progress / ($items.length * 10)) * ($items.length - 1));
  $items.forEach((item, index) => displayItems(item, index, active));
};
animate();
$items.forEach((item, i) => {
  item.addEventListener("click", () => {
    progress = (i / $items.length) * $items.length * 10 + 10;
    animate();
  });
});
const handleMouseMove = (e) => {
  if (!isDown) return;
  const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  const mouseProgress = (x - startX) * speedDrag;
  progress = progress + mouseProgress;
  startX = x;
  animate();
};
const handleMouseDown = (e) => {
  isDown = true;
  startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
};
const handleMouseUp = () => {
  isDown = false;
};
carousel.addEventListener("mousedown", handleMouseDown);
carousel.addEventListener("mousemove", handleMouseMove);
carousel.addEventListener("mouseup", handleMouseUp);
carousel.addEventListener("touchstart", handleMouseDown);
carousel.addEventListener("touchmove", handleMouseMove);
carousel.addEventListener("touchend", handleMouseUp);

// Обработчики для стрелок навигации (только для мобильных)
const carouselPrevBtn = document.getElementById("carouselPrev");
const carouselNextBtn = document.getElementById("carouselNext");

if (carouselPrevBtn && carouselNextBtn) {
  const navigateCarousel = (direction) => {
    const totalItems = $items.length;
    if (direction === "prev") {
      active = active > 0 ? active - 1 : totalItems - 1;
    } else {
      active = active < totalItems - 1 ? active + 1 : 0;
    }
    progress = (active / (totalItems - 1)) * totalItems * 10 + 10;
    animate();
  };

  carouselPrevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    navigateCarousel("prev");
  });

  carouselNextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    navigateCarousel("next");
  });
}

// Бургер меню
document.addEventListener("DOMContentLoaded", () => {
  const burgerMenu = document.querySelector(".burger-menu");
  const button = burgerMenu.querySelector(".burger-menu_button");
  const links = burgerMenu.querySelectorAll(".burger-menu_link");
  const overlay = burgerMenu.querySelector(".burger-menu_overlay");

  if (burgerMenu && button) {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      toggleMenu();
    });

    links.forEach((link) => {
      link.addEventListener("click", () => toggleMenu());
    });

    overlay.addEventListener("click", () => toggleMenu());

    function toggleMenu() {
      burgerMenu.classList.toggle("burger-menu_active");

      if (burgerMenu.classList.contains("burger-menu_active")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "visible";
      }
    }
  }
});

// Функциональность модального окна для кейса клиента
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("caseModal");
  const closeBtn = document.getElementById("closeModal");
  const caseBtns = document.querySelectorAll(".case-btn");
  const prevBtn = document.getElementById("casePrev");
  const nextBtn = document.getElementById("caseNext");
  let currentCaseIndex = -1;

  // Помощник: позиционируем внешние стрелки рядом с контентом
  function positionOutsideArrows() {
    const content = modal && modal.querySelector(".case-modal__content");
    if (!content || !prevBtn || !nextBtn) return;
    const rect = content.getBoundingClientRect();

    // Позиционируем по отношению к видимому окну, без учета скролла в стиле
    prevBtn.style.position = "fixed";
    nextBtn.style.position = "fixed";
    prevBtn.style.top = `${rect.top + rect.height / 2}px`;
    nextBtn.style.top = `${rect.top + rect.height / 2}px`;
    prevBtn.style.left = `${Math.max(16, rect.left - 56)}px`;
    nextBtn.style.left = `${Math.min(
      window.innerWidth - 60,
      rect.right + 12
    )}px`;
  }

  // Функция открытия модального окна
  function openModal(fullReview, fullCase) {
    
    document.getElementById("fullReview").textContent = fullReview;

    // Заполняем слайды кейса
    if (fullCase) {
      // Разбиваем по двойным переносам строк (поддерживаем оба варианта)
      let caseParts;
      if (fullCase.includes("&#10;&#10;")) {
        caseParts = fullCase.split("&#10;&#10;");
      } else {
        caseParts = fullCase.split("\n\n");
      }

      // Заполняем содержимое слайдов
      if (caseParts.length >= 3) {
        // Задача
        const taskContent = caseParts[0]
          .substring(caseParts[0].indexOf(":") + 1)
          .trim();

        document.getElementById("taskContent").textContent = taskContent;

        // Решение
        const solutionContent = caseParts[1]
          .substring(caseParts[1].indexOf(":") + 1)
          .trim();

        document.getElementById("solutionContent").textContent =
          solutionContent;

        // Результат
        const resultContent = caseParts[2]
          .substring(caseParts[2].indexOf(":") + 1)
          .trim();

        document.getElementById("resultContent").textContent = resultContent;
      } else {
        // Попробуем альтернативный способ разбивки
        const altParts = fullCase.split(/(?<=:)\s*\n/);

        if (altParts.length >= 3) {
          document.getElementById("taskContent").textContent = altParts[0]
            .substring(altParts[0].indexOf(":") + 1)
            .trim();
          document.getElementById("solutionContent").textContent =
            altParts[1].trim();
          document.getElementById("resultContent").textContent =
            altParts[2].trim();
        }
      }
    } else {
      document.getElementById("taskContent").textContent = "Кейс в разработке";
      document.getElementById("solutionContent").textContent =
        "Кейс в разработке";
      document.getElementById("resultContent").textContent =
        "Кейс в разработке";
    }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    positionOutsideArrows();
  }

  // Удаляем обработчики слайдера и навигации — всё на одной странице со скроллом

  // Функция закрытия модального окна
  function closeModal() {
    modal.classList.remove("show");
    document.body.style.overflow = "visible";
  }

  // Обработчики для кнопок "Кейс клиента"
  caseBtns.forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Предотвращаем всплытие события для карусели
      currentCaseIndex = index;
      const fullReview = btn.getAttribute("data-review");
      const fullCase = btn.getAttribute("data-case");
      openModal(fullReview, fullCase);
    });
  });

  function openCaseByIndex(index) {
    if (!caseBtns.length) return;
    if (index < 0) index = caseBtns.length - 1;
    if (index >= caseBtns.length) index = 0;
    currentCaseIndex = index;
    const btn = caseBtns[currentCaseIndex];
    const fullReview = btn.getAttribute("data-review");
    const fullCase = btn.getAttribute("data-case");
    openModal(fullReview, fullCase);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openCaseByIndex(currentCaseIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openCaseByIndex(currentCaseIndex + 1);
    });
  }

  // Поддерживаем позицию при ресайзе и скролле
  window.addEventListener("resize", positionOutsideArrows);
  window.addEventListener("scroll", positionOutsideArrows);

  // Закрытие по клику на кнопку закрытия
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  // Закрытие по клику вне модального окна
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Закрытие по нажатию клавиши Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeModal();
    }
  });
});

function waitForB24Form() {
  return new Promise((resolve) => {
    const checkForm = () => {
      const form = document.querySelector(".buy-modal__body .b24-form");
      if (form) {
        resolve(form);
        return;
      }
    };
    checkForm();
  });
}

// Переключение групп маркетплейса (Облако/Коробка)
const marketplaceTabs = document.querySelectorAll(".marketplace-tab");
const marketplaceGroups = document.querySelectorAll(".marketplace-group");

if (marketplaceTabs.length && marketplaceGroups.length) {
  marketplaceTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const group = tab.getAttribute("data-marketplace-group");

      // Убираем активный класс со всех табов
      marketplaceTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Скрываем все группы и показываем нужную
      marketplaceGroups.forEach((g) => {
        if (g.getAttribute("data-marketplace-group") === group) {
          g.classList.add("active");
        } else {
          g.classList.remove("active");
        }
      });
    });
  });
}
