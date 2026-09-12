import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Authentic Circular bKash Logo
 * Matches the official bKash circular app icon:
 * Vibrant magenta circle with origami bird origami facets separated by crisp fold lines.
 */
export const BKashAppLogo: React.FC<LogoProps> = ({ className = '', size = 52 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 rounded-full drop-shadow-md overflow-hidden ${className}`}
    >
      {/* Outer Circular Magenta Background */}
      <circle cx="32" cy="32" r="32" fill="#E2136E" />

      {/* Subtle glossy 3D shine */}
      <circle cx="32" cy="32" r="31" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
      <path
        d="M6 24C12 12 24 5 38 5C48 5 56 9 60 16C50 11 38 10 24 14C14 17 8 21 6 24Z"
        fill="white"
        fillOpacity="0.12"
      />

      {/* bKash White Origami Bird with Fold Creases */}
      <g stroke="#E2136E" strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round">
        {/* Head and Beak facing right */}
        <polygon points="43,26 51,26 43,29" fill="#FFFFFF" />

        {/* Top Wing Facet 1 (Upper Tip) */}
        <polygon points="18,17 31,23 37,25 24,19" fill="#FFFFFF" />

        {/* Top Wing Facet 2 (Main Wing Fold) */}
        <polygon points="18,17 24,19 32,27 24,24" fill="#FFFFFF" fillOpacity="0.95" />

        {/* Wing Back Fold */}
        <polygon points="24,24 32,27 28,34" fill="#FCE4EC" />

        {/* Central Body Fold */}
        <polygon points="31,23 37,25 43,26 43,29 35,33" fill="#FFFFFF" />

        {/* Underwing Diamond */}
        <polygon points="32,27 35,33 30,37 28,34" fill="#FFFFFF" />

        {/* Breast / Neck Fold */}
        <polygon points="43,29 41,36 35,33" fill="#FCE4EC" />

        {/* Lower Body Fold */}
        <polygon points="35,33 41,36 36,43 30,37" fill="#FFFFFF" />

        {/* Tail Feather Upper Facet */}
        <polygon points="28,34 30,37 22,43 20,38" fill="#FFFFFF" />

        {/* Main Tail Wing Point (pointing down-left) */}
        <polygon points="22,43 20,38 15,48 22,45" fill="#FFFFFF" />

        {/* Tail Bottom Crease */}
        <polygon points="22,45 30,37 26,46 15,48" fill="#F8BBD0" />

        {/* Tail to Underbelly connector */}
        <polygon points="30,37 36,43 28,45 26,46" fill="#FCE4EC" />
      </g>
    </svg>
  );
};

/**
 * Authentic Circular Nagad Logo
 * Matches the official Nagad circular app icon:
 * Crisp white circle with the signature red-orange spiral swirl
 * and the iconic Bangladesh Post Office Runner (ডাক হরকরা) in the center.
 */
export const NagadAppLogo: React.FC<LogoProps> = ({ className = '', size = 52 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 rounded-full drop-shadow-md overflow-hidden bg-white ${className}`}
    >
      <defs>
        {/* Nagad Signature Spiral Gradient */}
        <linearGradient id="nagadSwirlGrad" x1="12" y1="50" x2="52" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E52128" />
          <stop offset="35%" stopColor="#F25B26" />
          <stop offset="70%" stopColor="#FA921D" />
          <stop offset="100%" stopColor="#FDB813" />
        </linearGradient>
        <linearGradient id="nagadWingGrad" x1="36" y1="12" x2="52" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDB813" />
          <stop offset="50%" stopColor="#FA921D" />
          <stop offset="100%" stopColor="#E52128" />
        </linearGradient>
      </defs>

      {/* Pure White Circular Base */}
      <circle cx="32" cy="32" r="31.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />

      {/* Outer Vortex Swirl (Red to Orange to Yellow) */}
      <path
        d="M48 18C44 14 38 12 32 12C20.95 12 12 20.95 12 32C12 43.05 20.95 52 32 52C41.5 52 49.5 45.5 51.5 36.5C52.2 33.5 50.8 30.5 48 30.5C45.2 30.5 44 32.5 43.2 34.5C41.2 39.5 36.5 43.5 31 43.5C24.5 43.5 19.5 38.5 19.5 32C19.5 25.5 24.5 20.5 31 20.5C35 20.5 38.5 22.5 40.5 25.5L48 18Z"
        fill="url(#nagadSwirlGrad)"
      />

      {/* Dynamic Upper-Right Flame Crests / Wings */}
      {/* Topmost Feather */}
      <path
        d="M37 13.5C43 14 49 17.5 52 23.5C48 22 43.5 21.5 39 21.8C38.2 19 37.8 16 37 13.5Z"
        fill="#FDB813"
      />
      {/* Middle Feather */}
      <path
        d="M41 19.5C46.5 20.5 51 24.5 53 29C49.5 28 45.5 27.8 42 28.5C41.8 25.2 41.5 22.2 41 19.5Z"
        fill="#FA921D"
      />
      {/* Bottom Feather */}
      <path
        d="M44 26C49 27.5 52 31.5 52.8 35.5C50 34.2 46.8 34 44 34.5C44 31.5 44 28.5 44 26Z"
        fill="#E52128"
      />

      {/* Inner Red Running Mailman (ডাক হরকরা) Silhouette */}
      <g fill="#E52128">
        {/* Head with Turban / Cap */}
        <circle cx="33" cy="24.5" r="2.4" />
        
        {/* Leaning Torso with Running Motion */}
        <path d="M31.2 27.5L34.5 33.5L32.2 34.5L29.5 28.8C30 28.2 30.6 27.8 31.2 27.5Z" />

        {/* Mail Sack / Backpack on Back */}
        <ellipse cx="29.2" cy="29.5" rx="2" ry="2.6" transform="rotate(-20 29.2 29.5)" />

        {/* Right Arm Holding Mail Lance/Spear */}
        <path d="M32.5 29.5L36.5 31L35.5 32.2L31.8 31Z" />

        {/* The Famous Spear / Staff with Bell */}
        <line x1="27" y1="34" x2="41" y2="28.5" stroke="#E52128" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="40.5" cy="29" r="1" />
        <path d="M40.5 29.5L40 31.5L41.5 31.5Z" />

        {/* Front Leg (Forward Step) */}
        <path d="M33.8 33.5L37.5 36.5L36.2 42.5L34.8 42.2L35.8 37.2L32.8 34.8Z" />
        {/* Front Foot */}
        <path d="M36.2 42.5L38.8 43L38.5 44L35 43.5Z" />

        {/* Rear Leg (Kicked Back in Sprint) */}
        <path d="M31 34.2L27 37L24.2 35.5L24.8 34.2L27.2 35.5L30.2 33Z" />
        {/* Rear Foot */}
        <path d="M24.2 35.5L22.5 35L22.8 34L24.5 34.5Z" />
      </g>
    </svg>
  );
};

/**
 * Authentic Circular Binance Logo
 * Matches the official Binance circular app icon:
 * Pitch dark circular background with the vibrant gold/yellow Binance diamond emblem.
 */
export const BinanceAppLogo: React.FC<LogoProps> = ({ className = '', size = 52 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 rounded-full drop-shadow-md overflow-hidden ${className}`}
    >
      {/* Dark Circular Base */}
      <circle cx="32" cy="32" r="32" fill="#181A20" />

      {/* Subtle glossy border */}
      <circle cx="32" cy="32" r="31.2" stroke="#F0B90B" strokeWidth="0.6" strokeOpacity="0.3" />

      {/* Authentic Binance Gold Diamond Emblem */}
      <g fill="#F3BA2F">
        {/* 1. Center Diamond */}
        <polygon points="32,26.8 37.2,32 32,37.2 26.8,32" />

        {/* 2. Top Chevron Bracket */}
        <polygon points="32,14.5 43.2,25.7 38.6,30.3 32,23.7 25.4,30.3 20.8,25.7" />

        {/* 3. Bottom Chevron Bracket */}
        <polygon points="32,49.5 43.2,38.3 38.6,33.7 32,40.3 25.4,33.7 20.8,38.3" />

        {/* 4. Left Diamond */}
        <polygon points="18.2,26.8 23.4,32 18.2,37.2 13,32" />

        {/* 5. Right Diamond */}
        <polygon points="45.8,26.8 51,32 45.8,37.2 40.6,32" />
      </g>
    </svg>
  );
};

/**
 * Unified Payment Method Logo Component
 */
export const PaymentMethodLogo: React.FC<{
  method: 'bKash' | 'Nagad' | 'USDT' | string;
  size?: number;
  className?: string;
}> = ({ method, size = 48, className = '' }) => {
  const norm = (method || '').toLowerCase();
  if (norm.includes('bkash')) {
    return <BKashAppLogo size={size} className={className} />;
  }
  if (norm.includes('nagad')) {
    return <NagadAppLogo size={size} className={className} />;
  }
  return <BinanceAppLogo size={size} className={className} />;
};
