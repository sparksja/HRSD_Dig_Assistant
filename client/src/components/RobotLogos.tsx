import React from 'react';

interface RobotLogoProps {
  className?: string;
  variant?: number; // 1-10 for different robot designs
}

export const RobotLogo: React.FC<RobotLogoProps> = ({ 
  className = "w-6 h-6", 
  variant = 1 
}) => {
  // Select the appropriate robot logo based on variant
  switch (variant) {
    case 1:
      return <RobotLogo1 className={className} />;
    case 2:
      return <RobotLogo2 className={className} />;
    case 3:
      return <RobotLogo3 className={className} />;
    case 4:
      return <RobotLogo4 className={className} />;
    case 5:
      return <RobotLogo5 className={className} />;
    case 6:
      return <RobotLogo6 className={className} />;
    case 7:
      return <RobotLogo7 className={className} />;
    case 8:
      return <RobotLogo8 className={className} />;
    case 9:
      return <RobotLogo9 className={className} />;
    case 10:
      return <RobotLogo10 className={className} />;
    default:
      return <RobotLogo1 className={className} />;
  }
};

// Robot Logo 1: Simple Square with Round Eyes
const RobotLogo1: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="6" width="16" height="16" rx="2" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <circle cx="12" cy="2" r="1" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <path d="M9 17h6" />
  </svg>
);

// Robot Logo 2: Clean Minimalist Square
const RobotLogo2: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <line x1="8" y1="10" x2="10" y2="10" strokeWidth="2" />
    <line x1="14" y1="10" x2="16" y2="10" strokeWidth="2" />
    <path d="M9,15 L15,15" />
    <path d="M9,17 L15,17" />
    <rect x="8" y="2" width="8" height="3" rx="1" />
    <line x1="12" y1="5" x2="12" y2="2" />
  </svg>
);

// Robot Logo 3: Rounded with Digital Display
const RobotLogo3: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="5" width="18" height="16" rx="5" />
    <line x1="8" y1="5" x2="8" y2="2" />
    <circle cx="8" cy="2" r="1" />
    <line x1="16" y1="5" x2="16" y2="2" />
    <circle cx="16" cy="2" r="1" />
    <rect x="7" y="10" width="4" height="3" rx="1" />
    <rect x="13" y="10" width="4" height="3" rx="1" />
    <path d="M8 17h8" strokeDasharray="2,1" />
    <rect x="1" y="9" width="2" height="6" rx="1" />
    <rect x="21" y="9" width="2" height="6" rx="1" />
  </svg>
);

// Robot Logo 4: Hexagonal Shape
const RobotLogo4: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12,3 L20,8 L20,16 L12,21 L4,16 L4,8 L12,3 Z" />
    <circle cx="9" cy="10" r="1.5" />
    <rect x="13" y="8.5" width="3" height="3" rx="0.5" />
    <path d="M9,15 L10,16 L11,15 L12,16 L13,15 L14,16 L15,15" />
    <line x1="12" y1="3" x2="12" y2="1" />
    <circle cx="12" cy="1" r="0.5" />
  </svg>
);

// Robot Logo 5: Circular with Smile
const RobotLogo5: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="8" />
    <circle cx="9" cy="10" r="1.5" fill="currentColor" />
    <circle cx="15" cy="10" r="1.5" fill="currentColor" />
    <line x1="12" y1="4" x2="12" y2="2" />
    <circle cx="12" cy="1" r="1" />
    <path d="M9,15 Q12,18 15,15" />
    <path d="M2,10 L4,12 L2,14" />
    <path d="M22,10 L20,12 L22,14" />
  </svg>
);

// Robot Logo 6: Modern Rounded Rectangle
const RobotLogo6: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4,8 L4,18 C4,20.2091 5.79086,22 8,22 L16,22 C18.2091,22 20,20.2091 20,18 L20,8 C20,5.79086 18.2091,4 16,4 L8,4 C5.79086,4 4,5.79086 4,8 Z" />
    <circle cx="12" cy="2" r="1.25" />
    <line x1="12" y1="4" x2="12" y2="2" />
    <circle cx="9" cy="11" r="2" />
    <circle cx="15" cy="11" r="2" />
    <path d="M9,17 L15,17" />
    <line x1="4" y1="13" x2="7" y2="13" strokeWidth="1" />
    <line x1="17" y1="13" x2="20" y2="13" strokeWidth="1" />
  </svg>
);

// Robot Logo 7: Tech Display Robot
const RobotLogo7: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <line x1="4" y1="9" x2="20" y2="9" />
    <rect x="8" y="12" width="3" height="4" />
    <rect x="13" y="12" width="3" height="4" />
    <line x1="12" y1="5" x2="12" y2="2" />
    <circle cx="12" cy="2" r="1" />
    <path d="M8 21v1" />
    <path d="M16 21v1" />
  </svg>
);

// Robot Logo 8: Cute Square Robot
const RobotLogo8: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="4" width="14" height="14" rx="4" />
    <circle cx="9" cy="10" r="1.5" />
    <circle cx="15" cy="10" r="1.5" />
    <path d="M9,14 Q12,16 15,14" />
    <rect x="8" y="1" width="8" height="3" rx="1.5" />
    <line x1="12" y1="4" x2="12" y2="1" />
    <line x1="5" y1="18" x2="5" y2="22" />
    <line x1="19" y1="18" x2="19" y2="22" />
  </svg>
);

// Robot Logo 9: Digital Circuit Robot
const RobotLogo9: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="5" width="14" height="14" rx="1" />
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="5" y1="14" x2="19" y2="14" />
    <line x1="9" y1="5" x2="9" y2="19" />
    <line x1="14" y1="5" x2="14" y2="19" />
    <circle cx="12" cy="12" r="2" />
    <line x1="12" y1="5" x2="12" y2="2" />
    <circle cx="12" cy="2" r="1" />
  </svg>
);

// Robot Logo 10: Modern Geometric Robot
const RobotLogo10: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12,4 20,10 20,18 12,22 4,18 4,10" />
    <line x1="8" y1="12" x2="10" y2="12" />
    <line x1="14" y1="12" x2="16" y2="12" />
    <line x1="10" y1="16" x2="14" y2="16" />
    <line x1="12" y1="4" x2="12" y2="2" />
    <circle cx="12" cy="2" r="1" />
  </svg>
);

export default RobotLogo;