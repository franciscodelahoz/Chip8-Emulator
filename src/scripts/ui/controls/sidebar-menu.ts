const configurationSideBar = document.getElementById('configuration-sidebar') as HTMLElement | null;
const closeConfigurationSideBarBtn = document.getElementById('close-configurations-button') as HTMLElement | null;
const openConfigurationSideBarBtn = document.getElementById('open-configurations-button') as HTMLElement | null;

function closeSideMenu() {
  if (configurationSideBar) {
    configurationSideBar.classList.remove('active');
  }
}

function openSideMenu() {
  if (configurationSideBar) {
    configurationSideBar.classList.toggle('active');
  }
}

function registerCloseSideMenuOnClickOutside() {
  if (!configurationSideBar || !openConfigurationSideBarBtn) return;

  document.addEventListener('click', (event) => {
    if (
      !configurationSideBar.contains(event.target as Node)
      && !openConfigurationSideBarBtn.contains(event.target as Node)
      && configurationSideBar.classList.contains('active')
    ) {
      configurationSideBar.classList.remove('active');
    }
  });
}

function registerSidebarButtonEventHandlers() {
  if (!closeConfigurationSideBarBtn || !openConfigurationSideBarBtn) return;

  closeConfigurationSideBarBtn.addEventListener('click', closeSideMenu);
  openConfigurationSideBarBtn.addEventListener('click', openSideMenu);
}

export function initializeSidebarMenuModule() {
  registerCloseSideMenuOnClickOutside();
  registerSidebarButtonEventHandlers();
}
