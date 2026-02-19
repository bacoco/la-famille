'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved ? saved === 'dark' : true;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-9 w-9"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
