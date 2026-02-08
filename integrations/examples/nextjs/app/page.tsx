import { Heroshot } from 'heroshot/next';

export default function Home() {
  return (
    <main>
      <h1>Heroshot + Next.js</h1>
      <p>This is a minimal example of heroshot integrated with Next.js.</p>

      <h2>Screenshot Demo</h2>
      <Heroshot name="Hero" alt="Hero screenshot" />

      <p>Toggle dark mode to see the screenshot switch automatically.</p>
    </main>
  );
}
