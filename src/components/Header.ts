import { createElement } from "../utils/dom";

export function createHeader(): HTMLDivElement {
  const headerContainer = createElement('div', {
    className: 'mb-8 py-3 px-4 sm:px-10 md:px-20 inline-block w-auto'
  });

  const header = createElement('h1', {
    className: 'text-5xl sm:text-6xl md:text-8xl font-bold py-2 tracking-wider flex items-center justify-center pr-4 text-gray-100'
  });

  const exclamation = createElement('span', {
    className: 'text-5xl sm:text-6xl md:text-8xl font-bold mr-3 relative z-10 [filter:saturate(0.7)_brightness(0.8)] -mt-8 heebo-heading text-gray-100'
  }, ['!']);

  const rebangText = createElement('span', {
    className: 'text-5xl sm:text-6xl md:text-8xl text-gray-100 heebo-heading  pr-2 pb-4 inline-block font-bold [filter:saturate(0.7)_brightness(0.8)]'
  }, ['ReBang']);

  header.appendChild(exclamation);
  header.appendChild(rebangText);
  headerContainer.appendChild(header);
  return headerContainer;
}


