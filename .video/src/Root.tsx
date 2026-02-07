import { Composition } from 'remotion';
import { HeroDemo } from './HeroDemo';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroDemo"
        component={HeroDemo}
        durationInFrames={845}
        fps={30}
        width={1280}
        height={800}
      />
    </>
  );
};
