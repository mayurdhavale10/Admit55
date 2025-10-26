'use client';

import { useState, useEffect } from 'react';
import Slide1BookIntro from './how/Slide1BookIntro';
import Slide2ProfileResume from './how/Slide2ProfileResume';
import Slide3EssayTool from './how/Slide3EssayTool';

export default function How() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 6; // Total number of slides
  const autoPlayDelay = 15000; // 15 seconds per slide

  // Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, autoPlayDelay);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section
      className="relative w-full py-20 px-[6vw]"
      style={{ background: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="mb-8">
          <h2
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textAlign: 'left',
              lineHeight: '1.1',
            }}
          >
            <span className="logo-with-brush" style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: '#A3A3A3', fontWeight: 700 }}>Admit55</span>
              <img
                src="/logo/admit55logo.webp"
                alt="Admit55"
                style={{
                  height: '50px',
                  width: 'auto',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  position: 'relative',
                  marginLeft: '8px',
                  marginRight: '8px',
                  zIndex: 2,
                }}
              />
            </span>
            <span style={{ color: '#1d1d1f' }}>is a one-stop solution for your MBA journey.</span>
          </h2>
          
          {/* Subheading */}
          <p
            style={{
              fontSize: '20px',
              lineHeight: '1.6',
              color: '#A3A3A3',
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 700,
            }}
          >
            We have built our tools using custom data, trained with the help of MBA graduates and working professionals from top ISB and IIM institutions.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative mt-24 overflow-hidden" style={{ borderRadius: '24px' }}>
          <div 
            style={{
              display: 'flex',
              transition: 'transform 0.6s ease-in-out',
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {/* Slide 1 - Book Introduction */}
            <Slide1BookIntro onNext={nextSlide} />

            {/* Slide 2 - Profile Resume Tool */}
            <Slide2ProfileResume onNext={nextSlide} />

            {/* Slide 3 - Essay Tool */}
            <Slide3EssayTool onNext={nextSlide} />

            {/* Slide 4 - Reapplication Tool (Placeholder) */}
            <div 
              style={{ 
                minWidth: '100%', 
                background: '#F5F5F7',
              }}
            >
              <div className="flex flex-col justify-center items-center min-h-[600px] p-8 md:p-12">
                <h3
                  style={{
                    fontSize: '56px',
                    lineHeight: '1.1',
                    color: '#1d1d1f',
                    fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Reapplication Tool
                </h3>
                <p style={{ color: '#86868B', marginTop: '20px' }}>Coming soon...</p>
              </div>
            </div>

            {/* Slide 5 - Community Tool (Placeholder) */}
            <div 
              style={{ 
                minWidth: '100%', 
                background: '#F5F5F7',
              }}
            >
              <div className="flex flex-col justify-center items-center min-h-[600px] p-8 md:p-12">
                <h3
                  style={{
                    fontSize: '56px',
                    lineHeight: '1.1',
                    color: '#1d1d1f',
                    fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  Community Tool
                </h3>
                <p style={{ color: '#86868B', marginTop: '20px' }}>Coming soon...</p>
              </div>
            </div>

            {/* Slide 6 - Coming Soon Tools (Placeholder) */}
            <div 
              style={{ 
                minWidth: '100%', 
                background: '#F5F5F7',
              }}
            >
              <div className="flex flex-col justify-center items-center min-h-[600px] p-8 md:p-12">
                <h3
                  style={{
                    fontSize: '56px',
                    lineHeight: '1.1',
                    color: '#1d1d1f',
                    fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  14+ More Tools Coming Soon
                </h3>
                <p style={{ color: '#86868B', marginTop: '20px' }}>Complete one-stop solution</p>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div 
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '12px',
              zIndex: 10,
            }}
          >
            {[...Array(totalSlides)].map((_, index) => (
              <div
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  width: currentSlide === index ? '32px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: currentSlide === index ? '#1d1d1f' : '#86868B',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .logo-with-brush {
          position: relative;
          display: inline-block;
          isolation: isolate;
        }
        
        .logo-with-brush::before {
          content: '';
          position: absolute;
          bottom: 0px;
          left: -10px;
          right: -10px;
          height: 20px;
          background: #FFE500;
          opacity: 0.7;
          border-radius: 50%;
          transform: skewY(-2deg);
          z-index: 0;
        }
      `}</style>
    </section>
  );
}