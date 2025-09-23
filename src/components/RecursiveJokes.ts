import { createElement } from "../utils/dom";

const recursiveJokes = [
  "Why do programmers prefer recursive functions? Because they can solve their own problems without asking for help!",
  "I was going to tell you a recursive joke... but I'd have to tell you a recursive joke first.",
  "How do you understand recursion? First, understand recursion.",
  "What's a recursive programmer's favorite movie? 'Inception', within 'Inception', within 'Inception'...",
  "Recursive function walks into a bar. Recursive function walks into a bar. Recursive function walks into a bar...",
  "To understand recursion: See 'recursion'.",
  "Hey look! A recursive function! Hey look! A recursive function! Hey look! A recursive function!",
  "Why did the recursive function go to therapy? It had too many self-references!",
  "Recursive functions are like Russian dolls - it's the same thing just getting smaller and smaller until you find a tiny solid one."
];

export function createRecursiveJokeContainer(): HTMLDivElement {
  const randomIndex = Math.floor(Math.random() * recursiveJokes.length);
  const recursiveJoke = recursiveJokes[randomIndex];

  const jokeContainer = createElement('div', {
    className: 'w-full flex justify-center mb-6'
  });

  const jokeText = createElement('div', {
    className: 'text-lg text-[#a788ff] font-mono animate-typewriter w-full opacity-70'
  }, [recursiveJoke]);

  jokeContainer.appendChild(jokeText);
  return jokeContainer;
}


