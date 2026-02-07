import { useCurrentFrame, interpolate } from 'remotion';

interface TerminalProps {
  typingStartFrame: number;
  typingEndFrame: number;
  outputStartFrame?: number;
  command: string;
  output?: string[];
}

export const Terminal: React.FC<TerminalProps> = ({
  typingStartFrame,
  typingEndFrame,
  outputStartFrame,
  command,
  output = [],
}) => {
  const frame = useCurrentFrame();

  // Calculate how much of the command to show
  const typingProgress = interpolate(frame, [typingStartFrame, typingEndFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const charsToShow = Math.floor(typingProgress * command.length);
  const visibleCommand = command.slice(0, charsToShow);

  // Blinking cursor - hide when showing output
  const showCursor =
    outputStartFrame && frame >= outputStartFrame
      ? false
      : frame < typingEndFrame || Math.floor(frame / 15) % 2 === 0;

  // Output lines appear one by one after outputStartFrame
  const visibleOutputLines = outputStartFrame
    ? output.slice(0, Math.max(0, Math.floor((frame - outputStartFrame) / 8)))
    : [];

  return (
    <div
      style={{
        width: 750,
        background: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(50, 50, 50, 0.9)',
          gap: 8,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            color: '#888',
            fontSize: 13,
            marginRight: 52,
          }}
        >
          Terminal
        </div>
      </div>

      {/* Terminal content */}
      <div style={{ padding: '28px 32px', minHeight: 420 }}>
        {/* Command line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#28c840', fontSize: 16 }}>$</span>
          <span style={{ color: '#e0e0e0', fontSize: 16 }}>
            {visibleCommand}
            {showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 20,
                  background: '#e0e0e0',
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </span>
        </div>

        {/* Output lines */}
        {visibleOutputLines.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {visibleOutputLines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.startsWith('✓')
                    ? '#28c840'
                    : line.startsWith('●')
                      ? '#888'
                      : '#e0e0e0',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
