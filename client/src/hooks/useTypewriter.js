import { useEffect, useState } from 'react';

const TYPE_MS = 65; // per character
const HOLD_MS = 1600; // how long the full phrase stays
const DELETE_MS = 30; // per character when erasing

/**
 * Continuously types and erases phrases, one after another.
 *
 * @param {string[]} phrases
 * @returns {{ text: string, phase: 'typing'|'holding'|'deleting' }}
 */
export function useTypewriter(phrases) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('typing');

  useEffect(() => {
    const phrase = phrases[index % phrases.length];
    let timer;

    if (phase === 'typing') {
      if (text.length < phrase.length) {
        timer = setTimeout(() => setText(phrase.slice(0, text.length + 1)), TYPE_MS);
      } else {
        timer = setTimeout(() => setPhase('deleting'), HOLD_MS);
      }
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(phrase.slice(0, text.length - 1)), DELETE_MS);
      } else {
        setIndex((i) => i + 1);
        setPhase('typing');
      }
    }
    return () => clearTimeout(timer);
  }, [text, phase, index, phrases]);

  return { text, phase };
}
