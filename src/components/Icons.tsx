import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...rest }: P, children: ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconPlus = (p: P) => base(p, <path d="M12 5v14M5 12h14" />);
export const IconCheck = (p: P) => base(p, <path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconClose = (p: P) => base(p, <path d="M6 6l12 12M18 6 6 18" />);
export const IconBack = (p: P) => base(p, <path d="m15 5-7 7 7 7" />);
export const IconChevron = (p: P) => base(p, <path d="m9 5 7 7-7 7" />);
export const IconDown = (p: P) => base(p, <path d="m5 9 7 7 7-7" />);
export const IconMore = (p: P) =>
  base(
    p,
    <>
      <circle cx="5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" />
    </>,
  );
/** Chrome's ⋮ menu. */
export const IconMoreVertical = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="5" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="19" r="1.3" fill="currentColor" />
    </>,
  );
/** Safari's share button: a box with an arrow leaving the top. */
export const IconShare = (p: P) => base(p, <path d="M9 9.5H7.5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-7.5a2 2 0 0 0-2-2H15M12 3v11M8.5 6.5 12 3l3.5 3.5" />);
export const IconSearch = (p: P) =>
  base(
    p,
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>,
  );
/** A bumper plate, for the plate calculator. */
export const IconPlate = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>,
  );
export const IconFolder = (p: P) => base(p, <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z" />);
export const IconFolderPlus = (p: P) =>
  base(p, <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7ZM12 10.5v5M9.5 13h5" />);
export const IconTimer = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.5M9.5 2.5h5" />
    </>,
  );
export const IconTrash = (p: P) => base(p, <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />);
export const IconEdit = (p: P) => base(p, <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />);
export const IconSwap = (p: P) => base(p, <path d="M7 4 3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7" />);
export const IconGrip = (p: P) =>
  base(
    p,
    <g fill="currentColor" stroke="none">
      {[6, 12, 18].map((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} />))}
    </g>,
  );
export const IconUp = (p: P) => base(p, <path d="M12 19V5M6 11l6-6 6 6" />);
export const IconArrowDown = (p: P) => base(p, <path d="M12 5v14M6 13l6 6 6-6" />);
export const IconLink = (p: P) =>
  base(p, <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />);
export const IconNote = (p: P) => base(p, <path d="M5 4h14v11l-5 5H5V4ZM14 20v-5h5M9 9h6M9 13h3" />);
export const IconCopy = (p: P) =>
  base(
    p,
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </>,
  );
export const IconPlay = (p: P) => base(p, <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" />);
export const IconPause = (p: P) => base(p, <path d="M8 5v14M16 5v14" strokeWidth={3.5} />);
export const IconSettings = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>,
  );
export const IconBody = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M7.5 9.5h9M12 9.5v5.5M9.2 21 12 15l2.8 6M7.5 9.5 6 15M16.5 9.5 18 15" />
    </>,
  );
export const IconFlame = (p: P) =>
  base(p, <path d="M12 3c.4 3.2 4.5 5.1 4.5 9.7A4.5 4.5 0 0 1 12 17.2a4.5 4.5 0 0 1-4.5-4.5c0-1.9.9-3.1 1.8-4 .3 1.2 1 1.9 1.7 2.2C10.6 8.6 11 5.5 12 3Z" />);
export const IconTrophy = (p: P) =>
  base(p, <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20h7M10 17h4v3h-4z" />);

// Tab bar
export const IconBarbell = (p: P) =>
  base(p, <path d="M2.5 12h19M5.5 8v8M8.5 6.5v11M15.5 6.5v11M18.5 8v8" />);
export const IconHistory = (p: P) =>
  base(
    p,
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" />
      <path d="M3.5 4v4.5H8M12 8v4.5l3 1.5" />
    </>,
  );
export const IconList = (p: P) => base(p, <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />);
export const IconChart = (p: P) => base(p, <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
export const IconCloud = (p: P) => base(p, <path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5Z" />);
export const IconUpload = (p: P) => base(p, <path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />);
export const IconDownload = (p: P) => base(p, <path d="M12 3v12M7 10l5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />);

// Settings sections
export const IconUser = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>,
  );
export const IconPalette = (p: P) =>
  base(
    p,
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.7 0-.9.7-1.6 1.6-1.6h2A3.6 3.6 0 0 0 20.5 11 8.5 8.5 0 0 0 12 3.5Z" />
      <path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01" strokeWidth={2.6} />
    </>,
  );
export const IconAccessibility = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M5 8.5c4.7 1.3 9.3 1.3 14 0M12 9v4.5m0 0-3 6.5m3-6.5 3 6.5" />
    </>,
  );
export const IconGlobe = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9S14.6 18.4 12 21c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z" />
    </>,
  );
export const IconDatabase = (p: P) =>
  base(
    p,
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
      <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
    </>,
  );
export const IconInfo = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6h.01" strokeWidth={2.6} />
    </>,
  );
export const IconRuler = (p: P) =>
  base(p, <path d="m3.5 16.5 13-13 4 4-13 13-4-4ZM8.5 11.5l2 2M11.5 8.5l2 2M5.5 14.5l1.5 1.5" />);
export const IconTarget = (p: P) =>
  base(
    p,
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>,
  );
export const IconVolume = (p: P) => base(p, <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4ZM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />);
export const IconExternal = (p: P) => base(p, <path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />);
