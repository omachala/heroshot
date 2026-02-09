import Providers from './providers';

export const metadata = {
  title: 'Heroshot + Next.js Example',
  description: 'Minimal Next.js + Heroshot setup',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
