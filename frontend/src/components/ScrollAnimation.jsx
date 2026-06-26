import React, { useEffect, useRef, useState } from 'react';

const ScrollAnimation = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Check viewport width for responsive layouts
  useEffect(() => {
    const handleViewportChange = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    return () => window.removeEventListener('resize', handleViewportChange);
  }, []);

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
        // Draw first frame once loaded
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
        onImageLoad();
      };
      imagesArray.push(img);
    }
  }, []);

  // Desktop canvas drawing with programmatic cropping (removes black bars & watermark)
  const drawFrame = (index) => {
    const canvas = canvasRef.current;
    if (!canvas || isMobile) return;

    const ctx = canvas.getContext('2d');
    const img = imagesRef.current[index];
    if (!img || !ctx) return;

    // Set canvas dimensions to match viewport container size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    if (!imgWidth || !imgHeight) return;

    // The raw frame images have thick black bars on the left/right sides.
    // The central vertical video is about 56% of the total width (cropped 22% from left, 22% from right).
    // The Gemini watermark is also in the bottom right corner (inside the black bar), so this crops it out completely.
    const cropLeft = 0.22;
    const cropRight = 0.22;
    const sX = imgWidth * cropLeft;
    const sY = 0;
    const sWidth = imgWidth * (1 - cropLeft - cropRight);
    const sHeight = imgHeight;

    const croppedRatio = sWidth / sHeight;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, drawX, drawY;

    // Cover calculations for the cropped image portion
    if (croppedRatio > canvasRatio) {
      drawHeight = canvas.height;
      drawWidth = canvas.height * croppedRatio;
      drawX = (canvas.width - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = canvas.width;
      drawHeight = canvas.width / croppedRatio;
      drawX = 0;
      drawY = (canvas.height - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the cropped center portion of the image to fill the canvas
    ctx.drawImage(img, sX, sY, sWidth, sHeight, drawX, drawY, drawWidth, drawHeight);
  };

  // Redraw when viewport or frames update
  useEffect(() => {
    if (imagesLoaded && imagesRef.current.length > 0 && !isMobile) {
      const index = Math.min(20, Math.max(0, currentFrame - 1));
      drawFrame(index);
    }
  }, [imagesLoaded, currentFrame, isMobile]);

  // Handle scroll trigger for both Desktop (canvas) & Mobile (image source updates)
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      const totalScrollable = rect.height - viewHeight;
      if (totalScrollable <= 0) return;

      const scrollProgress = -rect.top / totalScrollable;
      const clampedProgress = Math.min(1, Math.max(0, scrollProgress));

      // Map progress to frame index (0 to 20)
      const frameIndex = Math.min(20, Math.max(0, Math.floor(clampedProgress * 21)));
      setCurrentFrame(frameIndex + 1);
      
      if (imagesLoaded && imagesRef.current.length > 0 && !isMobile) {
        drawFrame(frameIndex);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [imagesLoaded, isMobile]);

  const getPaddedFrameString = () => {
    return String(currentFrame).padStart(3, '0');
  };

  return (
    <div ref={containerRef} className="scrolly-section" id="scrollytelling">
      <div className="scrolly-sticky">
        
        {/* Render canvas on Desktop, render optimized image on Mobile */}
        {!isMobile ? (
          <canvas ref={canvasRef} className="scrolly-canvas" />
        ) : (
          <div className="scrolly-mobile-wrapper" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <img 
              src={`/frames/frame_${getPaddedFrameString()}.jpg`} 
              alt="Thambulam Plate Animation" 
              className="scrolly-mobile-img"
            />
          </div>
        )}

        <div className="scrolly-overlay" />

        {/* Dynamic Marketing panels - left/right panels fade in/out at different scroll depths */}
        <div className="scrolly-text-container">
          
          <div className="scrolly-marketing-panels">
            {/* Stage 1: Traditional Betel (Frames 1-5) */}
            <div className={`scrolly-panel left ${currentFrame >= 1 && currentFrame <= 5 ? 'active' : ''}`}>
              <img src="/details/detail_betel.jpg" alt="Betel Leaf Setup" className="scrolly-panel-img" />
              <div className="scrolly-panel-content">
                <span className="scrolly-tag">Authentic Themes</span>
                <h3>Traditional Betel Layouts</h3>
                <p>Layered with hand-plucked green betel leaves, fresh roses, and marigolds to welcome prosperity to your special functions.</p>
              </div>
            </div>

            {/* Stage 2: Exquisite Dolls (Frames 6-11) */}
            <div className={`scrolly-panel right ${currentFrame >= 6 && currentFrame <= 11 ? 'active' : ''}`}>
              <img src="/details/detail_doll.jpg" alt="Saree Doll Setup" className="scrolly-panel-img" />
              <div className="scrolly-panel-content">
                <span className="scrolly-tag">Exquisite Artistry</span>
                <h3>Custom Handpainted Dolls</h3>
                <p>Charming traditional doll figurines dressed in authentic ethnic sarees, bringing cultural storytelling to your platter.</p>
              </div>
            </div>

            {/* Stage 3: Lemons & Prosperity (Frames 12-16) */}
            <div className={`scrolly-panel left ${currentFrame >= 12 && currentFrame <= 16 ? 'active' : ''}`}>
              <img src="/details/detail_lemon.jpg" alt="Lemon and Blossoms Setup" className="scrolly-panel-img" />
              <div className="scrolly-panel-content">
                <span className="scrolly-tag">Premium Quality</span>
                <h3>Citrus & Blossom Setups</h3>
                <p>Arrangements featuring fresh lemons, pure white daisies, and baby's breath detailing, symbolizing energy and growth.</p>
              </div>
            </div>

            {/* Stage 4: Ferris Wheel Carousel / Birdcage (Frames 17-21) */}
            <div className={`scrolly-panel right ${currentFrame >= 17 && currentFrame <= 21 ? 'active' : ''}`}>
              <img src="/details/detail_birdcage.png" alt="Birdcage Carousel Setup" className="scrolly-panel-img" />
              <div className="scrolly-panel-content">
                <span className="scrolly-tag">Modern Innovation</span>
                <h3>Revolving Ferris Wheels</h3>
                <p>Stunning miniature rotating wheels and birdcage baskets, adding interactive charm and motion to the traditional platter.</p>
              </div>
            </div>
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
