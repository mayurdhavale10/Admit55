// Server Component
import AboveTheFold from '@src/sections/landing/AboveTheFold';
import How from '@src/sections/landing/How';
import WhyAdmit55 from '../sections/landing/whyadmit55';
import School from '../sections/landing/school';
import Testimonial from '../sections/landing/testimonial';
import Plan from '@src/sections/landing/plan';
import WhyDiff from '@src/sections/landing/whydiff';
import Guidance from '@src/sections/landing/guidance';
import Footer from '../components/footer/footer';

export default function Page() {
  return (
    <main>
      <AboveTheFold />
    
      <How />
      
      <WhyAdmit55 />
      <School />
      <Testimonial />
      <Plan />
      <WhyDiff />
      <Guidance />
      <Footer />
    </main>
  );
}