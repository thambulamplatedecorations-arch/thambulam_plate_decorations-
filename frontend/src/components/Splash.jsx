import React, { useEffect, useState } from 'react';

const Splash = () => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Stage 1: Trigger fade out after 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // Stage 2: Remove from DOM after transition completes (800ms)
    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`splash-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-logo-wrapper">
        <h1 className="splash-logo">Thambulam</h1>
        <p className="splash-tagline">Plate Decorations</p>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
