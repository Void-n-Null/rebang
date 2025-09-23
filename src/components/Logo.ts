import { createElement } from "../utils/dom";

export function createLogo(): HTMLDivElement {
  const logoContainer = createElement('div', {
    className: 'w-32 h-32 mx-auto mb-6 flex items-center justify-center relative transition-transform duration-300'
  });

  const logoImg = createElement('img', {
    src: '/newbang.svg',
    alt: '',
    className: 'w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.6)] [filter:saturate(0.7)_brightness(0.8)]'
  });

  logoContainer.addEventListener('mouseenter', () => {
    logoImg.classList.add('animate-hue-shift');
    logoContainer.classList.add('logo-hover');
  });

  logoContainer.addEventListener('mouseleave', () => {
    logoImg.classList.remove('animate-hue-shift');
    logoContainer.classList.remove('logo-hover');
  });

  logoContainer.appendChild(logoImg);
  return logoContainer;
}


