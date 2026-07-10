import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, TrendingUp, Activity, Award, Briefcase, Code2, Target, Sparkles } from 'lucide-react';

const phases = [
  { text: 'Master skills', color: 'text-[#4285F4]', bgColor: 'bg-[#4285F4]/10', Icon: Code2 },
  { text: 'Build careers', color: 'text-[#0F9D58]', bgColor: 'bg-[#0F9D58]/10', Icon: Briefcase },
  { text: 'Track progress', color: 'text-[#F4B400]', bgColor: 'bg-[#F4B400]/10', Icon: Activity },
  { text: 'Ace exams', color: 'text-[#DB4437]', bgColor: 'bg-[#DB4437]/10', Icon: Award },
];

export default function HeroAnimation() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[220px] mb-4">
      <div className="flex flex-col items-center justify-center">
        {/* Top Row: Changing Text + Graphic */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 h-[70px] sm:h-[80px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentIndex}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex items-center"
            >
              <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight ${phases[currentIndex].color}`}>
                {phases[currentIndex].text}
              </h1>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`graphic-${currentIndex}`}
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              transition={{ duration: 0.5, ease: 'backOut' }}
              className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center ${phases[currentIndex].bgColor}`}
            >
              {React.createElement(phases[currentIndex].Icon, { className: `w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ${phases[currentIndex].color}` })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Row: Static Text */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight text-[#1D1D1F] dark:text-white mt-2 sm:mt-3">
          with Learnora.
        </h1>
      </div>
    </div>
  );
}
