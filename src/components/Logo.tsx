import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withStrapline?: boolean;
  onlyIcon?: boolean;
  inverse?: boolean;
}

export default function Logo({ 
  className = '', 
  size = 'md', 
  withStrapline = false,
  onlyIcon = false,
  inverse = false
}: LogoProps) {
  
  // Icon dimensions
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  // Text font-size mappings
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  const renderIcon = () => (
    <div className={`${iconSizes[size]} shrink-0 shadow-sm rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105`}>
      <svg viewBox="0 0 100 100" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Blue dotted grid pattern for the light blue circular accent */}
          <pattern id="dotGridBlue" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.45" fill="#2563EB" opacity="0.6" />
          </pattern>
          {/* White/grey dotted grid pattern for the bottom horizontal base element */}
          <pattern id="dotGridWhite" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.45" fill="#6B7280" opacity="0.5" />
          </pattern>
        </defs>

        {/* 1. Underlying Yellow/Golden Vertical Pillar of the 'L' */}
        <rect x="13" y="32" width="27" height="48" fill="#FBBF24" />

        {/* 2. Sleek Blue Header Block with Rounded Top-Right Corner */}
        <path d="M 13 8 h 25 a 16 16 0 0 1 16 16 v 14 H 13 z" fill="#3B82F6" />

        {/* 3. Light Blue Accent Circle with Dotted Overlays */}
        <circle cx="40" cy="22" r="13" fill="#93C5FD" />
        <circle cx="40" cy="22" r="13" fill="url(#dotGridBlue)" />

        {/* 4. Elegant Red Capsule Tombstone on the Upper-Right edge */}
        <rect x="42" y="24" width="11" height="15" rx="5.5" fill="#EF4444" />

        {/* 5. Pink/Orchid Left-Aligned Rounded Segment (curves left, flat right) */}
        <path d="M 39 31 a 11.5 11.5 0 0 0 0 23 Z" fill="#D946EF" />

        {/* 6. Multi-Segmented Base Leg Footer of the 'L' */}
        {/* Bottom Red base block */}
        <rect x="13" y="78" width="27" height="14" fill="#B91C1C" />
        {/* Bottom Coral-Orange base block */}
        <rect x="40" y="85" width="16" height="7" fill="#E15A42" />
        {/* Bottom Golden base block & Right yellow square */}
        <rect x="56" y="78" width="21" height="14" fill="#FBBF24" />
        <rect x="56" y="69" width="14" height="14" fill="#FBBF24" />

        {/* 7. Rounded Horizontal Base Shape */}
        <path d="M 16 71 H 49 A 11 11 0 0 1 60 82 v 5 H 16 Z" fill="#A78BFA" />

        {/* 8. Light Grey Semi-circle on the bottom-left of the horizontal base leg */}
        <path d="M 21 71 A 11 11 0 0 0 43 71 Z" fill="#E5E7EB" />
        <rect x="21" y="71" width="22" height="11" fill="url(#dotGridWhite)" />
      </svg>
    </div>
  );

  if (onlyIcon) {
    return <div className={`inline-flex ${className}`}>{renderIcon()}</div>;
  }

  // Choose colors based on the inverse prop (forced dark container)
  const prefixColorClass = inverse 
    ? 'text-white' 
    : 'text-[#0A2A66] dark:text-white';
    
  const straplineColorClass = inverse
    ? 'text-slate-300'
    : 'text-slate-500 dark:text-slate-400';

  return (
    <div className={`flex items-center gap-3 font-sans select-none ${className}`}>
      {/* Sleek brand emblem */}
      {renderIcon()}

      {/* Structured Wordmark branding */}
      <div className="flex flex-col justify-center text-left">
        <div className={`flex items-baseline font-black tracking-tight leading-none ${textSizes[size]}`}>
          <span className={`${prefixColorClass} transition-colors`}>Learn</span>
          <span className="text-[#FF3B5C]">ora</span>
        </div>
        
        {withStrapline && (
          <p className={`text-[5px] md:text-[5.5px] tracking-[0.18em] uppercase ${straplineColorClass} font-extrabold mt-1 leading-none`}>
            Learn Beyond Limits
          </p>
        )}
      </div>
    </div>
  );
}
