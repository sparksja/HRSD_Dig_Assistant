import React from 'react';
import robotLogoImage from "@assets/image_1748035910367.png";

interface RobotLogoProps {
  className?: string;
}

export const RobotLogo: React.FC<RobotLogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <img 
      src={robotLogoImage}
      alt="Robot Logo"
      className={className}
      style={{ 
        objectFit: 'contain'
      }}
    />
  );
};

export default RobotLogo;