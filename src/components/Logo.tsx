"use client"

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  const logoSize = {
    sm: 32,
    md: 40,
    lg: 64
  }

  // User's exact SVG logo with cyan gradient fill
  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg
        width={logoSize[size]}
        height={logoSize[size]}
        viewBox="0 0 300 290"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Cyan gradient fill for the entire logo */}
          <linearGradient id="motionCyanFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#7dd3fc', stopOpacity: 1}} />
            <stop offset="25%" style={{stopColor: '#38bdf8', stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: '#0ea5e9', stopOpacity: 1}} />
            <stop offset="75%" style={{stopColor: '#0284c7', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#0369a1', stopOpacity: 1}} />
          </linearGradient>
        </defs>

        <g transform="translate(0,290) scale(0.1,-0.1)">
          <path
            d="M2275 2321 c-127 -71 -250 -141 -275 -157 -60 -38 -61 -67 -3 -109
23 -16 42 -36 42 -43 1 -11 -179 -253 -298 -401 -20 -25 -45 -57 -56 -72 -11
-15 -67 -89 -124 -163 -112 -149 -114 -149 -146 -74 -10 24 -36 81 -58 128
-21 47 -68 153 -104 235 -37 83 -76 160 -87 172 -19 20 -32 22 -158 24 -122 2
-140 1 -158 -16 -24 -22 -20 -5 -124 -435 -46 -190 -114 -470 -151 -623 -84
-343 -92 -317 100 -317 112 0 136 3 153 18 16 13 37 86 92 307 103 418 120
477 135 465 7 -6 38 -66 68 -133 119 -262 186 -396 206 -406 11 -6 27 -8 36
-5 14 6 186 215 410 500 55 70 73 89 79 83 3 -3 -21 -167 -55 -365 -33 -197
-63 -375 -66 -395 -9 -59 15 -69 172 -69 174 0 166 -8 200 210 14 91 32 206
40 255 8 50 23 151 35 225 11 74 25 160 30 190 5 30 12 71 14 90 3 19 10 71
16 115 19 129 13 155 -38 182 -8 4 61 95 75 100 9 3 35 -4 58 -17 47 -25 66
-23 89 12 12 19 138 478 152 555 7 36 -13 63 -44 63 -16 0 -119 -51 -257 -129z
m254 17 c-15 -57 -51 -194 -80 -305 -28 -112 -56 -203 -62 -203 -5 0 -32 16
-59 36 -28 19 -51 34 -53 32 -1 -2 -110 -139 -241 -304 -587 -741 -687 -865
-694 -857 -11 13 -290 622 -290 633 0 5 -3 10 -7 10 -9 0 -34 -93 -144 -545
-44 -181 -81 -330 -82 -332 -1 -1 -66 -3 -145 -5 -110 -2 -141 0 -137 9 5 15
289 1156 311 1254 l16 69 141 0 142 0 144 -325 c79 -179 149 -324 155 -322 11
3 41 41 438 554 l227 292 -70 38 c-62 34 -84 53 -60 53 11 0 542 297 555 310
23 23 22 5 -5 -92z m-328 -819 c-16 -107 -57 -380 -92 -606 l-64 -413 -147 0
-146 0 8 33 c5 17 37 193 70 391 34 197 65 366 68 376 7 17 325 420 329 416 2
-1 -10 -90 -26 -197z"
            fill="url(#motionCyanFill)"
            fillRule="evenodd"
            stroke="none"
          />
        </g>
      </svg>
    </div>
  )
}
