import Link from 'next/link';

interface Slide3EssayToolProps {
  onNext: () => void;
}

export default function Slide3EssayTool({ onNext }: Slide3EssayToolProps) {
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
            src="/landing/essaytooldemo (1).webp"
            alt="Essay Tool Demo"
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
            href="/tools/essaytool"
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
              src="/logo/essaytool.webp"
              alt="Essay Tool Icon"
              style={{
                height: '60px',
                width: 'auto',
              }}
              className="responsive-logo"
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
              Essay Tool
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
            Powered by 10,000+ Accepted Essays
          </h4>

          {/* Main Description */}
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
            Our Essay Tool is powered by an extensive dataset of over 10,000+ accepted essays. It provides bespoke, customized guidance for every user profile—from Executive MBA to Entrepreneur—ensuring optimal results for your specific goals.
          </p>

          {/* One-to-One Consultation Heading */}
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
            One-to-One Consultation
          </h5>

          {/* Consultation Description */}
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#86868B',
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            Get personalized guidance with experts, top MBA graduates, and working professionals who understand your unique journey and goals.
          </p>
          
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

      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-logo {
            height: 50px !important;
          }
        }
        
        @media (max-width: 480px) {
          .responsive-logo {
            height: 40px !important;
          }
        }
      `}</style>
    </div>
  );
}