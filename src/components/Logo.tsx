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
  
  // Icon dimensions (height-only to allow auto-scaling width)
  const iconSizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  };

  // Text font-size mappings
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  const renderIcon = () => (
    <div className={`${iconSizes[size]} shrink-0 transition-transform duration-300 hover:scale-105`}>
      <svg viewBox="9 3 67 95.5" className="h-full w-auto select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Blue dotted grid pattern for the light blue circular accent */}
          <pattern id="dotGridBlue" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="0.4" fill="#15266F" opacity="0.65" />
          </pattern>
          {/* White/grey dotted grid pattern for the bottom horizontal base element */}
          <pattern id="dotGridGrey" width="2.4" height="2.4" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="0.4" fill="#374151" opacity="0.55" />
          </pattern>
        </defs>

        {/* 1. Underlying Yellow/Golden Vertical Pillar of the 'L' */}
        <rect x="10" y="40" width="27" height="50" fill="#F4B400" />

        {/* 2. Sleek Blue Header Block with Rounded Top-Right Corner */}
        <path d="M 10 4 H 39 A 16 16 0 0 1 55 20 V 40 H 10 Z" fill="#3B82F6" />

        {/* 3. Blue dots rectangular grid */}
        <rect x="24" y="8" width="24" height="32" fill="url(#dotGridBlue)" />

        {/* 4. Light Blue Accent Circle with Dotted Overlays */}
        <circle cx="41.5" cy="20.5" r="15" fill="#93C5FD" />
        <circle cx="41.5" cy="20.5" r="15" fill="url(#dotGridBlue)" />

        {/* 5. Elegant Red Capsule Tombstone on the Upper-Right edge */}
        <path d="M 43.5 40 V 25.5 A 5.5 5.5 0 0 1 54.5 25.5 V 40 Z" fill="#EF4444" />

        {/* 6. Pink/Orchid Left-Aligned Rounded Segment (curves left, flat right) */}
        <path d="M 36.5 41 H 24.5 A 10 10 0 0 0 14.5 51 A 10 10 0 0 0 24.5 61 H 36.5 Z" fill="#D946EF" />

        {/* 7. Multi-Segmented Base Leg Footer of the 'L' */}
        {/* Bottom Red base block */}
        <rect x="10" y="90.5" width="27" height="7" fill="#B91C1C" />
        {/* Bottom Coral-Orange base block */}
        <rect x="37" y="90.5" width="16" height="7" fill="#E15A42" />
        {/* Bottom/Right Golden base block (toe extension) */}
        <rect x="53" y="90.5" width="22" height="7" fill="#FBBF24" />
        <rect x="60.5" y="80.5" width="14.5" height="10" fill="#FBBF24" />

        {/* 8. Rounded Horizontal Base Shape */}
        <path d="M 12.5 72.5 H 50.5 A 11 11 0 0 1 61.5 83.5 V 90.5 H 12.5 Z" fill="#D946EF" />

        {/* 9. Light Grey Semi-circle on the bottom-left of the horizontal base leg */}
        <path d="M 18.5 72.5 A 12 12 0 0 0 42.5 72.5 Z" fill="#E5E7EB" />
        
        {/* 10. Grey dots rectangular grid */}
        <rect x="18.5" y="72.5" width="24" height="12" fill="url(#dotGridGrey)" />
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
    <div className={`flex items-center gap-2 font-sans select-none ${className}`}>
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
