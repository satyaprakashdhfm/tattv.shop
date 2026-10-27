import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number): SVGProps<SVGSVGElement> => ({ width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true });

export function InstagramIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24s8.23 3.7 8.23 8.24-3.69 8.24-8.23 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.06 0 1.22.89 2.39 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

export function YouTubeIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="4" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" {...props}>
      <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.87.25-1.46 1.5-1.46h1.6V4.36c-.28-.04-1.23-.12-2.33-.12-2.3 0-3.88 1.4-3.88 3.98v2.2H7.8v3h2.6V21h3.1Z" />
    </svg>
  );
}

/** X (formerly Twitter). */
export function XIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size)} fill="currentColor" {...props}>
      <path d="M17.53 3.5h2.9l-6.34 7.25L21.5 20.5h-5.84l-4.57-5.98-5.24 5.98H2.95l6.78-7.75L2.6 3.5h5.98l4.13 5.46L17.53 3.5Zm-1.02 15.28h1.61L7.74 5.13H6.01l10.5 13.65Z" />
    </svg>
  );
}
