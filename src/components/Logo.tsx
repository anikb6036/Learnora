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
  withStrapline = true,
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
        {/* Deep branding Navy Blue Background Card (Squircle) */}
        <rect width="100" height="100" rx="22" fill="#0A2A66" />
        
        {/* Bold White Sans-Serif Capital "L" with precise geometry */}
        <path d="M 24 24 L 36 24 L 36 70 L 54 70 L 54 80 L 24 80 Z" fill="#FFFFFF" />
        
        {/* Lowercase connected "oa" in vibrant brand coral red */}
        <text 
          x="46" 
          y="78" 
          fill="#FF3B5C" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="900" 
          fontSize="33px" 
          letterSpacing="-1.5px"
        >
          oa
        </text>
        
        {/* High-Fidelity White Graduation Cap hovering above "oa" */}
        <path d="M 68 15 L 94 25 L 68 35 L 42 25 Z" fill="#FFFFFF" />
        <path d="M 52 28 Q 68 32 84 28 L 84 34 Q 68 40 52 34 Z" fill="#FFFFFF" />
        
        {/* Hanging Tassel in branding Coral Red matching "oa" */}
        <path d="M 90 23 L 90 35" stroke="#FF3B5C" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="90" cy="39" r="3.5" fill="#FF3B5C" />
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
          <p className={`text-[9px] md:text-[5.5px] tracking-[0.18em] uppercase ${straplineColorClass} font-extrabold mt-1 leading-none`}>
            Learn Beyond Limits
          </p>
        )}
      </div>
    </div>
  );
}
