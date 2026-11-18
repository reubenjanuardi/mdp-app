import type { SVGProps } from "react";

import { cn } from "cn";

// Lambang dari menara-digdaya-perkasa-logo.svg (tiga bentuk menara, tanpa tulisan), warna asli logo.
// Logo lengkap dengan tulisan ada di /brand/menara-digdaya-perkasa-logo.svg.
export function MdpMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="152 14 200 172"
      width={200}
      height={172}
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#0D2853"
        d="M248.06 20.97 L160.84 65.70 L160.84 154.07 L192.57 137.80 L192.57 82.25 L248.06 53.79 Z M255.94 20.97 L343.16 65.70 L343.16 154.07 L311.43 137.80 L311.43 82.25 L255.94 53.79 Z"
      />
      <path
        fill="#31547C"
        d="M252.00 74.00 L202.98 99.15 L202.98 130.83 L252.00 105.69 L301.02 130.83 L301.02 99.15 Z"
      />
      <path
        fill="#426C96"
        d="M252.00 118.40 L165.79 162.61 L197.58 178.91 L252.00 151.00 L306.42 178.91 L338.21 162.61 Z"
      />
    </svg>
  );
}

/** Lambang di atas petak putih, agar warna navy logo tetap terbaca di mode gelap. */
export function MdpLogoTile({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/5", className)}
      style={{ width: size, height: size }}
    >
      <MdpMark style={{ width: size * 0.72, height: size * 0.62 }} />
    </span>
  );
}
