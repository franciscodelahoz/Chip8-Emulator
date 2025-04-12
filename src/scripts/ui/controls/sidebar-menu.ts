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

export function initializeSidebarMenuModule(): void {
  registerCloseSideMenuOnClickOutside();
  registerSidebarButtonEventHandlers();
  registerKeyboardHandlers();
}
