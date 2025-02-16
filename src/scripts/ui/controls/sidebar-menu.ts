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
    if (
      !configurationSideBar.contains(event.target as Node)
      && !openConfigurationSideBarBtn.contains(event.target as Node)
      && configurationSideBar.classList.contains('active')
    ) {
      configurationSideBar.classList.remove('active');
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
}
