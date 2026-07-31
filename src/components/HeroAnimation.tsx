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
    <div className="flex flex-col items-center justify-center w-full min-h-[110px] sm:min-h-[160px] mb-1">
      <div className="flex flex-col items-center justify-center">
        {/* Top Row: Changing Text + Graphic */}
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-3.5 min-h-[40px] sm:h-[68px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentIndex}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex items-center"
            >
              <h1 className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black tracking-tight ${phases[currentIndex].color}`}>
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
              transition={{ duration: 0.45, ease: 'backOut' }}
              className={`w-8 h-8 xs:w-10 xs:h-10 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-full flex items-center justify-center shrink-0 ${phases[currentIndex].bgColor}`}
            >
              {React.createElement(phases[currentIndex].Icon, { className: `w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${phases[currentIndex].color}` })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Row: Static Text */}
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black tracking-tight text-[#0F1117] dark:text-white mt-0.5 sm:mt-1.5">
          with Learnora.
        </h1>
      </div>
    </div>
  );
}
