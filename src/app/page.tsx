// Server Component
import AboveTheFold from '@src/sections/landing/AboveTheFold';
import How from '@src/sections/landing/How';
import WhyAdmit55 from '../sections/landing/whyadmit55';
import Testimonial from '../sections/landing/testimonial';
import Footer from '../components/footer/footer';

export default function Page() {
  return (
    <main>
      <AboveTheFold />
      <How />
      <WhyAdmit55 />
      <Testimonial />
      <Footer />
    </main>
  );
}