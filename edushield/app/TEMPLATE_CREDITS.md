# EduShield visual credits

The initial Onda adaptation was based on the MIT-licensed 8B template at https://github.com/8bsite/design-studio-website-template. Its copyright notice is retained in TEMPLATE_LICENSE.txt. The complete reference remains in ../reference/design-studio/.

The current interface is a new system-font, blue/graphite sidebar design developed for EduShield using the apple-design and emil-design-eng skills. It is inspired by interface principles and is not an Apple product, endorsement, or reproduction of a specific Apple screen.

No Apple logos, proprietary SF Symbols assets, or downloaded Apple fonts are included. Icons and the education shield are local SVG. The font stack uses installed platform fonts. The application loads no remote fonts, photos, analytics, GSAP, or Lenis.

The earlier Onda orb remains as an unused historical asset; the active interface does not reference it.

Dark glass card surfaces are adapted from the SignIn1 style reference supplied by the user. Only visual styling is adapted; no reference photos, brand logos, or authentication handlers are included.

Stateful icon treatments are adapted from the Animated State Icons React snippet provided by the user. They are implemented as local SVG and CSS driven by real application state, without Framer Motion, automatic demo timers, or unrelated notification/authentication features.

The Beranda 3D map uses three.js 0.159.0 (`vendor/three.min.js`, the `build/three.min.js` UMD file from the npm package), MIT License, Copyright 2010-2023 Three.js Authors. Source: https://registry.npmjs.org/three/-/three-0.159.0.tgz (project: https://github.com/mrdoob/three.js). It is bundled locally and loaded without network requests. The file is patched: the leading deprecation `console.warn(...)` statement was removed (replaced by `!` so the UMD wrapper still runs as an expression); the `@license` header is unchanged. Patched file SHA-256: 7737cac07d9ea034782aa1b1dd6963959db50fdf54a7f747fd1b3c57a8730f6a.
