"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export function TypewriterEffect({
  words,
  className,
  cursorClassName,
}: {
  words: Array<{ text: string; className?: string }>;
  className?: string;
  cursorClassName?: string;
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (currentWordIndex >= words.length) {
      // Reset to first word
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);
      setDisplayText("");
      setIsDeleting(false);
      setIsPaused(false);
      return;
    }

    const currentWord = words[currentWordIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting && !isPaused) {
        // Typing forward
        if (currentCharIndex < currentWord.text.length) {
          setDisplayText(currentWord.text.slice(0, currentCharIndex + 1));
          setCurrentCharIndex((prev) => prev + 1);
        } else {
          // Finished typing, pause before deleting
          setIsPaused(true);
          setTimeout(() => {
            setIsPaused(false);
            setIsDeleting(true);
          }, 3000);
        }
      } else if (isDeleting) {
        // Deleting backwards
        if (currentCharIndex > 0) {
          setDisplayText(currentWord.text.slice(0, currentCharIndex - 1));
          setCurrentCharIndex((prev) => prev - 1);
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => prev + 1);
        }
      }
    }, isDeleting ? 80 : isPaused ? 0 : 150);

    return () => clearTimeout(timeout);
  }, [currentWordIndex, currentCharIndex, isDeleting, words, isPaused]);

  return (
    <div className={cn("text-center text-2xl font-bold", className)}>
      {words.map((word, idx) => {
        return (
          <span
            key={idx}
            className={cn(
              "transition-colors duration-300",
              word.className || className
            )}
          >
            {idx === currentWordIndex ? displayText : word.text}
            {idx === currentWordIndex && (
              <span className={cn("animate-pulse", cursorClassName)}>|</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

