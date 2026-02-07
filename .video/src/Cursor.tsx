import { interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

interface CursorProps {
  // Array of positions: x, y, frame to arrive, click after stopping, linear for no easing
  path: Array<{ x: number; y: number; frame: number; click?: boolean; linear?: boolean }>;
  size?: number;
}

export const Cursor: React.FC<CursorProps> = ({ path, size = 48 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find current segment
  let currentX = path[0].x;
  let currentY = path[0].y;
  let clickProgress = 0; // 0 = no click, 0-1 = clicking animation

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];

    if (frame >= from.frame && frame <= to.frame) {
      const duration = to.frame - from.frame;
      const elapsed = frame - from.frame;
      const linearProgress = elapsed / duration;

      // Use linear for drag, ease-out cubic for normal moves
      const progress = to.linear ? linearProgress : 1 - Math.pow(1 - linearProgress, 3);

      currentX = interpolate(progress, [0, 1], [from.x, to.x]);
      currentY = interpolate(progress, [0, 1], [from.y, to.y]);
      break;
    } else if (frame > to.frame) {
      currentX = to.x;
      currentY = to.y;

      // Click animation AFTER cursor stops (frames to.frame to to.frame + 12)
      if (to.click) {
        const clickStart = to.frame;
        const clickDuration = 12; // frames for click animation
        const clickEnd = clickStart + clickDuration;

        if (frame >= clickStart && frame <= clickEnd) {
          const clickElapsed = frame - clickStart;
          // Scale down then up: 0->0.5 = scale down, 0.5->1 = scale up
          const t = clickElapsed / clickDuration;
          if (t < 0.4) {
            // Scale down
            clickProgress = t / 0.4;
          } else {
            // Scale back up
            clickProgress = 1 - (t - 0.4) / 0.6;
          }
        }
      }
    }
  }

  // Click scale: 1 -> 0.7 -> 1
  const clickScale = 1 - clickProgress * 0.3;

  return (
    <div
      style={{
        position: 'absolute',
        left: currentX,
        top: currentY,
        transform: `translate(${-size * 0.18}px, ${-size * 0.1}px) scale(${clickScale})`,
        transformOrigin: '18% 10%', // Keep cursor tip fixed during click animation
        pointerEvents: 'none',
        zIndex: 9999,
        filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.4))',
      }}
    >
      {/* Linux-style cursor */}
      <svg width={size} height={size} viewBox="0 0 256 256" fill="none">
        <path
          d="M201.163 133.54L201.149 133.528L201.134 133.515L91.6855 36.4935C86.5144 31.7659 81.4269 27.9549 76.5421 25.525C71.7671 23.1497 66.0861 21.5569 60.4133 23.1213C54.3118 24.8039 50.4875 29.4674 48.3639 34.759C46.3122 39.8715 45.4999 46.2787 45.4999 53.5383L45.4999 200.431V200.493L45.5008 200.555C45.6218 208.862 50.4279 217.843 55.9963 223.894C58.8934 227.043 62.5163 229.986 66.6704 231.742C70.9172 233.537 76.217 234.254 81.4691 231.884C85.7536 229.951 89.6754 226.055 92.8565 222.651C94.6841 220.695 96.8336 218.252 99.0355 215.749C100.71 213.847 102.414 211.91 104.03 210.126C112.189 201.122 121.346 192.286 132.161 187.407C143.013 182.511 155.809 181.375 167.963 181.146C170.959 181.089 173.85 181.087 176.65 181.085H176.663H176.686C179.447 181.083 182.164 181.081 184.662 181.019C189.231 180.906 194.643 180.609 198.777 178.88C208.711 174.723 210.972 163.838 210.753 156.445C210.521 148.596 207.57 139.272 201.163 133.54Z"
          fill="#000"
          stroke="#fff"
          strokeWidth="17"
        />
      </svg>
    </div>
  );
};
