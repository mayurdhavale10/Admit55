import './globals.css';
import WebNavbar from '@src/components/navigation/WebNavbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebNavbar />
        {children}
      </body>
    </html>
  );
}
