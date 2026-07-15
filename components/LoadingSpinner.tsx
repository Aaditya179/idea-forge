interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export default function LoadingSpinner({
  message = "Loading...",
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className={`${sizeMap[size]} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      />
      <p className="text-sm text-text-muted font-medium">{message}</p>
    </div>
  );
}
