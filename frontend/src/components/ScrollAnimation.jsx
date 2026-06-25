import React, { useEffect, useRef, useState } from 'react';

const ScrollAnimation = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);

  // Pre-load all 21 frames on mount
  useEffect(() => {
    const totalFrames = 21;
    let loadedCount = 0;
    const imagesArray = [];

    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalFrames) {
        imagesRef.current = imagesArray;
        setImagesLoaded(true);
        // Draw the first frame once loaded
        drawFrame(0);
      }
    };

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const paddedNum = String(i).padStart(3, '0');
      img.src = `/frames/frame_${paddedNum}.jpg`;
      img.onload = onImageLoad;
      img.onerror = () => {
        console.error(`Failed to load frame ${paddedNum}`);
        // Count as loaded so we don't block
        onImageLoad();
      };
      imagesArray.push(img);
    }
  }, []);

  // Responsive drawing logic
  const drawFrame = (index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = imagesRef.current[index];
    if (!img || !ctx) return;

    // Set canvas dimensions to match viewport/element dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    if (!imgWidth || !imgHeight) return;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, drawX, drawY;

    // Cover logic
    if (imgRatio > canvasRatio) {
      drawHeight = canvas.height;
      drawWidth = canvas.height * imgRatio;
      drawX = (canvas.width - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = canvas.width;
      drawHeight = canvas.width / imgRatio;
      drawX = 0;
      drawY = (canvas.height - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  };

  // Listen to window resize to update canvas dimensions
  useEffect(() => {
    const handleResize = () => {
      if (imagesLoaded && imagesRef.current.length > 0) {
        // Redraw current frame index
        const index = Math.min(20, Math.max(0, currentFrame - 1));
        drawFrame(index);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imagesLoaded, currentFrame]);

  // Track scroll inside the component container
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container || !imagesLoaded || imagesRef.current.length === 0) return;

      const rect = container.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      // Calculate scroll progress (0 to 1) within the container's height
      // The scroll starts when container top reaches top of viewport (rect.top <= 0)
      // The scroll ends when container bottom reaches bottom of viewport
      const totalScrollable = rect.height - viewHeight;
      if (totalScrollable <= 0) return;

      const scrollProgress = -rect.top / totalScrollable;
      const clampedProgress = Math.min(1, Math.max(0, scrollProgress));

      // Map progress to frame index (0 to 20)
      const frameIndex = Math.min(20, Math.max(0, Math.floor(clampedProgress * 21)));
      
      setCurrentFrame(frameIndex + 1);
      drawFrame(frameIndex);
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger scroll check on mount to ensure initial frame is correct
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [imagesLoaded]);

  return (
    <div ref={containerRef} className="scrolly-section" id="scrollytelling">
      <div className="scrolly-sticky">
        <canvas ref={canvasRef} className="scrolly-canvas" />
        <div className="scrolly-overlay" />
        <div className="scrolly-text-container">
          <div className="scrolly-banner">
            <h1>Traditional Themes & Exquisite Details</h1>
            <p>
              Experience the motion of traditional thambulam decoration wheels. Scroll down to see
              how every detail revolves around heritage, elegance, and beauty.
            </p>
          </div>
          <div className="scrolly-instructions">
            <span>Scroll Down to Rotate</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollAnimation;
