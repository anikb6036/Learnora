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
  
  // Icon dimensions for onlyIcon
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  // Text font-size mappings for full logo
  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-[72px]',
  };
  
  const capSizes = {
    sm: 'w-7 -mt-2',
    md: 'w-10 -mt-3',
    lg: 'w-16 -mt-5',
    xl: 'w-24 -mt-7',
  };

  // Render the favicon style just for onlyIcon mode
  const renderIcon = () => (
    <div className={`${iconSizes[size]} shrink-0 overflow-hidden transition-transform duration-300 hover:scale-105 rounded-full bg-white flex items-center justify-center p-1shadow-sm ring-1 ring-slate-200 dark:ring-white/10`}>
      <svg viewBox="0 0 100 100" className="w-full h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="90" height="90" rx="18" fill="#142B49" />
        <path d="M 28 30 L 38 30 L 38 65 L 53 65 L 53 74 L 28 74 Z" fill="#FFFFFF" />
        <text x="46" y="74" fill="#ED1C24" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="950" fontSize="34px" letterSpacing="-1.5px">oa</text>
        <path d="M 64 22 L 85 30 L 64 38 L 43 30 Z" fill="#FFFFFF" />
        <path d="M 50 33 Q 64 37 78 33 L 78 40 Q 64 45 50 40 Z" fill="#FFFFFF" />
        <path d="M 82 29 L 82 40" stroke="#ED1C24" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="82" cy="44" r="3.5" fill="#ED1C24" />
      </svg>
    </div>
  );

  if (onlyIcon) {
    return <div className={`inline-flex ${className}`}>{renderIcon()}</div>;
  }

  // Choose colors based on the inverse prop (forced dark container)
  const prefixColorClass = inverse 
    ? 'text-white' 
    : 'text-[#142B49] dark:text-white';
    
  const straplineColorClass = inverse
    ? 'text-slate-300'
    : 'text-[#142B49] dark:text-slate-400';

  return (
    <div className={`flex flex-col items-center justify-center font-sans select-none ${className}`}>
      {/* Structured Wordmark branding with embedded cap */}
      <div className={`relative flex items-center font-black tracking-tight leading-none ${textSizes[size]}`}>
        <span className={`${prefixColorClass} transition-colors`}>Learn</span>
        <span className="text-[#ED1C24] relative">
          {/* Graduation Cap floating exactly over "ora" */}
          <div className={`absolute top-0 right-0 left-0 flex justify-center translate-y-[-70%] pointer-events-none`}>
            <svg viewBox="0 0 100 60" className={`${capSizes[size]} drop-shadow-sm`} fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cap base in Navy */}
              <path d="M 50 10 L 95 24 L 50 38 L 5 24 Z" fill={inverse ? "#FFFFFF" : "#142B49"} />
              <path d="M 22 29 Q 50 36 78 29 L 78 42 Q 50 50 22 42 Z" fill={inverse ? "#FFFFFF" : "#142B49"} />
              {/* Tassel in Coral Red */}
              <path d="M 88 22 L 88 42" stroke="#ED1C24" strokeWidth="3" strokeLinecap="round" />
              <circle cx="88" cy="48" r="4.5" fill="#ED1C24" />
            </svg>
          </div>
          ora
        </span>
      </div>
      
      {withStrapline && (
        <div className="flex items-center gap-2 mt-2 md:mt-3 px-1 w-full max-w-[90%] mx-auto">
          <div className="h-[1px] flex-grow bg-slate-300 dark:bg-slate-700"></div>
          <p className={`text-[6px] md:text-[8px] lg:text-[11px] tracking-[0.25em] lg:tracking-[0.3em] font-bold uppercase ${straplineColorClass} whitespace-nowrap`}>
            LEARN <span className="text-[#ED1C24]">.</span> GROW <span className="text-[#ED1C24]">.</span> SUCCEED <span className="text-[#ED1C24]">.</span>
          </p>
          <div className="h-[1px] flex-grow bg-slate-300 dark:bg-slate-700"></div>
        </div>
      )}
    </div>
  );
}
