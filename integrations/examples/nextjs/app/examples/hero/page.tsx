import { Heroshot } from 'heroshot/next';

export default function HeroPage() {
  return (
    <main>
      <h1>Nested Route Test</h1>
      <p>
        This page is at <code>/examples/hero</code> to test path resolution.
      </p>

      <Heroshot name="Hero" alt="Hero screenshot" />
    </main>
  );
}
