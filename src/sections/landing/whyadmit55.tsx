'use client';

export default function WhyAdmit55() {
  return (
    <section
      className="relative w-full py-20 px-[6vw]"
      style={{ background: '#EFEFEF' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading: Why Admit55? */}
        <div className="mb-16">
          <h2
            className="text-5xl md:text-6xl font-bold"
            style={{
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textAlign: 'left',
            }}
          >
            <span style={{ color: '#1d1d1f' }}>Why </span>
            <span className="logo-with-brush">
              <span style={{ color: '#A3A3A3', fontWeight: 700, position: 'relative', zIndex: 2 }}>
                Admit55
              </span>
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
                  zIndex: 2,
                }}
              />
            </span>
            <span style={{ color: '#1d1d1f' }}>?</span>
          </h2>
        </div>

        {/* Content Grid: Image on left */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Journey Image with overlaid tool icons */}
          <div className="flex justify-center relative">
            {/* SVG filter for brush effect */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <filter id="brush-filter-journey">
                  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
                  <feGaussianBlur stdDeviation="0.2"/>
                </filter>
              </defs>
            </svg>

            {/* Background journey path */}
            <img
              src="/whyadmit55/journey.webp"
              alt="Journey"
              style={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
            
            {/* ACCEPTED text at top - Brushy style */}
            <div
              className="brush-text-journey"
              style={{
                position: 'absolute',
                top: '2%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '2px',
              }}
            >
              ACCEPTED
            </div>

            {/* Reapplication Tool - Top right */}
            <a 
              href="/tools/reapplicationtool"
              style={{ 
                position: 'absolute', 
                top: '18%', 
                right: '15%', 
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src="/logo/reapplicationtool.webp"
                alt="Reapplication Tool"
                className="journey-icon"
                style={{ 
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
              {/* Reapplication Tool Text */}
              <div
                className="brush-text-journey"
                style={{
                  fontSize: '13px',
                  marginTop: '8px',
                  maxWidth: '150px',
                }}
              >
                stay reassured you got<br/>your other shots too
              </div>
            </a>

            {/* Community Tool - Upper middle LEFT */}
            <a 
              href="/tools/communitytool"
              style={{ 
                position: 'absolute', 
                top: '38%', 
                left: '5%', 
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src="/logo/community.webp"
                alt="Community Tool"
                className="journey-icon"
                style={{ 
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
              {/* Community Tool Text */}
              <div
                className="brush-text-journey"
                style={{
                  fontSize: '13px',
                  marginTop: '8px',
                  maxWidth: '180px',
                }}
              >
                feel confused? connect with<br/>people who are going through<br/>the same journey
              </div>
            </a>

            {/* Essay Tool - Middle right */}
            <a 
              href="/tools/essaytool"
              style={{ 
                position: 'absolute', 
                top: '58%', 
                right: '12%', 
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src="/logo/essaytool.webp"
                alt="Essay Tool"
                className="journey-icon"
                style={{ 
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
              {/* Essay Tool Text */}
              <div
                className="brush-text-journey"
                style={{
                  fontSize: '13px',
                  marginTop: '8px',
                  maxWidth: '150px',
                }}
              >
                ESSAY FORMAT<br/>BY THE BEST
              </div>
            </a>

            {/* Profile Resume Tool - Bottom left */}
            <a 
              href="/tools/profileresumetool"
              style={{ 
                position: 'absolute', 
                top: '78%', 
                left: '5%', 
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src="/logo/profileresumetool.webp"
                alt="Profile Resume Tool"
                className="journey-icon"
                style={{ 
                  width: '100px',
                  height: '100px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
              {/* Profile Resume Tool Text */}
              <div
                className="brush-text-journey"
                style={{
                  fontSize: '13px',
                  marginTop: '8px',
                  maxWidth: '180px',
                }}
              >
                Do your profile evaluation<br/>KNOW WHAT IS BEST FOR YOU
              </div>
            </a>
          </div>

          {/* Right side - Content */}
          <div style={{ paddingLeft: '20px', marginTop: '-100px' }}>
            <h3
              style={{
                fontSize: '42px',
                fontWeight: 700,
                color: '#1d1d1f',
                fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                marginBottom: '24px',
                letterSpacing: '-0.02em',
              }}
            >
              Because we've lived your journey.
            </h3>
            <p
              style={{
                fontSize: '20px',
                lineHeight: '1.6',
                color: '#A3A3A3',
                fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              We know the anxiety, the ambition, and the late nights behind every dream admit.
            </p>
            <p
              style={{
                fontSize: '20px',
                lineHeight: '1.6',
                color: '#A3A3A3',
                fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              Admit55 isn't just a product — it's alive through your journey.
            </p>
            <p
              style={{
                fontSize: '20px',
                lineHeight: '1.6',
                color: '#A3A3A3',
                fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                fontWeight: 700,
                marginBottom: '24px',
              }}
            >
              We walk beside you, guide you, and never let go until you get accepted.
            </p>
            <h3
              style={{
                fontSize: '42px',
                fontWeight: 700,
                color: '#1d1d1f',
                fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                letterSpacing: '-0.02em',
                marginTop: '80px',
              }}
            >
              Our team comprises graduates from
            </h3>
            
            {/* University Logos */}
            <div style={{ 
              display: 'flex', 
              gap: '32px', 
              alignItems: 'center', 
              marginTop: '32px',
              flexWrap: 'wrap',
            }}>
              <img
                src="/whyadmit55/IIMA.webp"
                alt="IIM Ahmedabad"
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <img
                src="/whyadmit55/IIMB.webp"
                alt="IIM Bangalore"
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <img
                src="/whyadmit55/IIMKozhikode.webp"
                alt="IIM Kozhikode"
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <img
                src="/whyadmit55/ISBB.webp"
                alt="ISB Bangalore"
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>
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

        .journey-icon {
          z-index: 2;
        }

        .brush-text-journey {
          font-family: 'Brush Script MT', 'SF Pro Display', cursive, sans-serif;
          color: #1d1d1f;
          font-weight: 700;
          line-height: 1.4;
          letter-spacing: 0.5px;
          filter: contrast(1.2) url('#brush-filter-journey');
          text-shadow: 
            1px 1px 0px rgba(0,0,0,0.1),
            -0.5px -0.5px 0px rgba(0,0,0,0.05);
          z-index: 1;
        }
      `}</style>
    </section>
  );
}