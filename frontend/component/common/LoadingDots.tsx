"use client";

export default function LoadingDots({
  size = "sm",
  color = "gray",
}: {
  size?: "xs" | "sm" | "md";
  color?: "gray" | "white" | "blue";
}) {
  const sizeClass = {
    xs: "w-1 h-1",
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
  }[size];

  const colorClass = {
    gray: "bg-gray-400",
    white: "bg-white",
    blue: "bg-blue-400",
  }[color];

  return (
    <div className="flex items-center gap-1">
      {[0, 150, 300].map((delay, i) => (
        <span
          key={i}
          className={`${sizeClass} ${colorClass} rounded-full`}
          style={{
            animation: "loadingBounce 0.7s ease-in-out infinite",
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes loadingBounce {
          0%, 100% { transform: translateY(2px); opacity: 0.4; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
