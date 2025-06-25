import type { SVGProps } from "react";

export function CricketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m19.67 19.67-4.24-4.24" />
      <path d="m12.39 12.39-2.82 2.82" />
      <path d="M11.71 6.13 5.13 12.7a2.83 2.83 0 0 0 4 4l6.58-6.58a2.83 2.83 0 0 0-4-4Z" />
      <path d="m4.24 19.67 1.41-1.41" />
      <circle cx="16.5" cy="7.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
