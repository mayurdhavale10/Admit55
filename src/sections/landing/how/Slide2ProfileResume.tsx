import Link from 'next/link';

interface Slide2ProfileResumeProps {
  onNext: () => void;
}

export default function Slide2ProfileResume({ onNext }: Slide2ProfileResumeProps) {
  return (
    <div 
      style={{ 
        minWidth: '100%', 
        background: '#F5F5F7',
      }}
    >
      <div className="flex flex-col md:flex-row items-stretch min-h-[600px]">
        {/* Image on the left */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-12">
          <img
            src="/landing/profileresumetooldemo (1).webp"
            alt="Profile Resume Tool Demo"
            style={{
              maxWidth: '100%',
              maxHeight: '500px',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '12px',
            }}
          />
        </div>

        {/* Content on the right */}
        <div className="flex-1 flex flex-col justify-start p-8 md:p-12 md:pl-8 overflow-y-auto">
          {/* Logo and Title */}
          <Link 
            href="/tools/profileresumetool"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              width: 'fit-content',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src="/logo/profileresumetool.webp"
              alt="Profile Resume Tool Icon"
              style={{
                height: '60px',
                width: 'auto',
              }}
            />
            <h3
              style={{
                fontSize: '32px',
                lineHeight: '1.2',
                color: '#1d1d1f',
                fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              Profile Resume Tool
            </h3>
          </Link>

          {/* Main Heading */}
          <h4
            style={{
              fontSize: '28px',
              lineHeight: '1.2',
              color: '#1d1d1f',
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            Evaluate Your Profile Against the Best
          </h4>

          {/* Subheading */}
          <p
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#86868B',
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            You possess the skills and talent; you simply lack the perfect format to represent them. We eliminate this gap.
          </p>

          {/* Convert Weaknesses Heading */}
          <h5
            style={{
              fontSize: '20px',
              lineHeight: '1.3',
              color: '#1d1d1f',
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Convert Your Weaknesses Into Strengths
          </h5>

          {/* Parameters Description */}
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#86868B',
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            We assess your candidacy across 30+ proprietary parameters, including:
          </p>

          {/* Parameters List */}
          <div style={{ marginBottom: '24px' }}>
            {[
              {
                title: 'Academic Excellence',
                details: 'Performance, Standardized Test Scores.'
              },
              {
                title: 'Professional Impact',
                details: 'Work Experience, Career Progression, Achievements & Recognition, Industry Relevance Score.'
              },
              {
                title: 'Leadership & Engagement',
                details: 'Leadership Impact, Extracurricular Depth, Leadership Quotient.'
              },
              {
                title: 'Narrative Strength',
                details: 'Communication Skills, Personal Brand Narrative, Storytelling Coherence, Goal-Profile Fit Index.'
              },
              {
                title: 'Global Readiness',
                details: 'International Exposure, Global Readiness Index.'
              }
            ].map((param, index) => (
              <div key={index} style={{ marginBottom: '12px' }}>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: '#1d1d1f',
                    fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  {param.title}:
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: '#86868B',
                    fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
                    fontWeight: 500,
                  }}
                >
                  {param.details}
                </p>
              </div>
            ))}
          </div>
          
          {/* Arrow Button */}
          <div 
            onClick={onNext}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              marginTop: 'auto',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}