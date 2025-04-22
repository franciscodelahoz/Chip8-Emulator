const configurationSideBar = document.getElementById('configuration-sidebar');
const closeConfigurationSideBarBtn = document.getElementById('close-configurations-button');
const openConfigurationSideBarBtn = document.getElementById('open-configurations-button');

function closeSideMenu(): void {
  if (configurationSideBar) {
    configurationSideBar.classList.remove('active');
  }
}

function openSideMenu(): void {
  if (configurationSideBar) {
    configurationSideBar.classList.toggle('active');
  }
}

function registerCloseSideMenuOnClickOutside(): void {
  if (!configurationSideBar || !openConfigurationSideBarBtn) return;

  document.addEventListener('click', (event) => {
    const target = event.target as Node;

    const isOutside = !configurationSideBar.contains(target)
    && !openConfigurationSideBarBtn.contains(target);

    if (isOutside && configurationSideBar.classList.contains('active')) {
      closeSideMenu();
    }
  });
}

function registerKeyboardHandlers(): void {
  if (!configurationSideBar) return;

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && configurationSideBar.classList.contains('active')) {
      closeSideMenu();
    }
  });
}

function registerSidebarButtonEventHandlers(): void {
  if (!closeConfigurationSideBarBtn || !openConfigurationSideBarBtn) return;

  closeConfigurationSideBarBtn.addEventListener('click', closeSideMenu);
  openConfigurationSideBarBtn.addEventListener('click', openSideMenu);
}

function handleSwipe(touchStartX: number, touchEndX: number): void {
  if (!configurationSideBar) return;

  const minSwipeDistance = 75;

  if (configurationSideBar.classList.contains('active')) {
    const swipeDistance = touchEndX - touchStartX;

    if (swipeDistance >= minSwipeDistance) {
      closeSideMenu();
    }
  }
}

function registerSidebarSwipeHandler(): void {
  if (!configurationSideBar) return;

  let touchStartX: number = 0;
  let touchEndX: number = 0;

  configurationSideBar.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });

  configurationSideBar.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].clientX;
    handleSwipe(touchStartX, touchEndX);
  }, { passive: true });
}

export function initializeSidebarMenuModule(): void {
  registerCloseSideMenuOnClickOutside();
  registerSidebarButtonEventHandlers();
  registerKeyboardHandlers();
  registerSidebarSwipeHandler();
}
