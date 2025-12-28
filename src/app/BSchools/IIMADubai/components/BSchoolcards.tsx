import { Clock, MapPin, Briefcase, GraduationCap, TrendingUp } from "lucide-react";

const CARDS = [
  { icon: Clock, title: "12 months", subtitle: "Full-time", color: "bg-green-500/20 border-green-400/30 text-green-400", link: "https://www.iima.ac.in/iima-dubai-campus/academic-dubai/one-year-mba" },
  { icon: MapPin, title: "Dubai DIAC", subtitle: "International Academic City", color: "bg-red-500/20 border-red-400/30 text-red-400", link: "https://www.iima.ac.in/executive-education/iima-dubai-campus" },
  { icon: Briefcase, title: "4+ years", subtitle: "Work experience required", color: "bg-blue-500/20 border-blue-400/30 text-blue-400", link: "https://dubai.iima.ac.in/admissions/main.html" },
  { icon: GraduationCap, title: "IIM A Faculty", subtitle: "World-class teaching", color: "bg-purple-500/20 border-purple-400/30 text-purple-400", link: "https://www.iima.ac.in/faculty-research/faculty-directory" },
  { icon: TrendingUp, title: "Leadership", subtitle: "Strategy & global business", color: "bg-orange-500/20 border-orange-400/30 text-orange-400", link: "https://www.iima.ac.in/executive-education/iima-dubai-campus" },
]; 

export default function BSchoolcards() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {CARDS.map(({ icon: Icon, title, subtitle, color, link }) => (
        <a key={title} href={link} target="_blank" rel="noopener noreferrer" className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-white backdrop-blur-md hover:scale-105 transition-all cursor-pointer ${color}`}>
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15">
            <Icon className="h-5 w-5 text-white/90" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold leading-tight">{title}</div>
            <div className="mt-1 text-sm text-white/80 leading-snug">{subtitle}</div>
          </div>
        </a>
      ))}
    </div>
  );
}