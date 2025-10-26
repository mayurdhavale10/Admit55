interface Slide1BookIntroProps {
  onNext: () => void;
}

export default function Slide1BookIntro({ onNext }: Slide1BookIntroProps) {
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
          <a 
            href="https://www.amazon.in/Successful-ISB-Essays-Their-Analysis/dp/1647606160/ref=pd_lpo_d_sccl_1/520-3330192-5619401?pd_rd_w=3VgYi&content-id=amzn1.sym.e0c8139c-1aa1-443c-af8a-145a0481f27c&pf_rd_p=e0c8139c-1aa1-443c-af8a-145a0481f27c&pf_rd_r=VYPQ072V1HSD26385HJC&pd_rd_wg=jyWIe&pd_rd_r=34d02824-1644-494d-995e-698eacd89326&pd_rd_i=1647606160&psc=1"
            target="_blank"
            rel="noopener noreferrer"
            style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src="/how/isbbook.webp"
              alt="ISB Essay Analysis Book"
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </a>
        </div>

        {/* Text on the right */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12 md:pl-8">
          <div 
            style={{
              fontSize: '48px',
              lineHeight: '1.1',
              color: '#86868B',
              fontFamily: `'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif`,
              fontWeight: 600,
              marginBottom: '24px',
              letterSpacing: '-0.01em',
            }}
          >
            We engineered our essay tool using the proven principles and deep analysis of 55 successful ISB application essays
          </div>
          
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