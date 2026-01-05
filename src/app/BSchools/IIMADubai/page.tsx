import BSchoolHero from "./components/BSchoolHero";
import AdmissionInfo from "./components/admissioninfo";
import Brochure from "./components/brochure";
import Ideal from "./components/ideal";
import WhatsAppSection from "./components/whatsapp";
import Footer from "@src/components/footer/footer";

export default function Page() {
  return (
    <main>
      <BSchoolHero />
      <AdmissionInfo />
      <Brochure />
      <Ideal />
      <WhatsAppSection />
      <Footer />
    </main>
  );
}
