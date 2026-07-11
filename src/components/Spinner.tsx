type Props = {
  size?: number;
  label?: string;
  className?: string;
};

export function Spinner({ size = 48, label, className = "" }: Props) {
  return (
    <div
      className={`inline-flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
          style={{ animationDuration: "1s" }}
        />
        <img
          src="/icon-192.png"
          srcSet="/icon-192.png 1x, /icon-512.png 2x"
          alt=""
          aria-hidden="true"
          decoding="async"
          className="absolute inset-0 m-auto animate-pulse object-contain"
          style={{
            width: size * 0.7,
            height: size * 0.7,
          }}
        />
      </div>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}