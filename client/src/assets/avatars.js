/**
 * Standard Default Male & Female Vector Avatars
 * Professional, clean SVG Data URIs representing human worker & customer profiles.
 */

// Crisp Neutral Male Avatar (Navy & Teal modern tone)
export const DEFAULT_MALE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-m" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>
    <linearGradient id="skin-m" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E0A97B" />
      <stop offset="100%" stop-color="#CA8A52" />
    </linearGradient>
    <linearGradient id="shirt-m" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A2540" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="60" cy="60" r="60" fill="url(#bg-m)" />
  <!-- Shoulders & Shirt -->
  <path d="M22 108 C 24 82, 42 76, 60 76 C 78 76, 96 82, 98 108 Z" fill="url(#shirt-m)" />
  <!-- Collar -->
  <path d="M50 76 L 60 88 L 70 76 Z" fill="#FFFFFF" opacity="0.9" />
  <!-- Neck -->
  <rect x="52" y="60" width="16" height="20" rx="3" fill="#CA8A52" />
  <!-- Head -->
  <ellipse cx="60" cy="48" rx="20" ry="23" fill="url(#skin-m)" />
  <!-- Hair -->
  <path d="M40 44 C 40 28, 48 24, 60 24 C 72 24, 80 28, 80 44 C 77 34, 70 30, 60 30 C 50 30, 43 34, 40 44 Z" fill="#1E293B" />
  <!-- Ears -->
  <circle cx="39" cy="49" r="4.5" fill="#CA8A52" />
  <circle cx="81" cy="49" r="4.5" fill="#CA8A52" />
</svg>
`)}`;

// Crisp Neutral Female Avatar (Warm Rose & Indigo modern tone)
export const DEFAULT_FEMALE_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-f" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE7F3" />
      <stop offset="100%" stop-color="#FBCFE8" />
    </linearGradient>
    <linearGradient id="skin-f" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E8B288" />
      <stop offset="100%" stop-color="#D49463" />
    </linearGradient>
    <linearGradient id="shirt-f" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#831843" />
      <stop offset="100%" stop-color="#9D174D" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <circle cx="60" cy="60" r="60" fill="url(#bg-f)" />
  <!-- Hair Back -->
  <path d="M34 46 C 32 75, 42 85, 42 85 L 78 85 C 78 85, 88 75, 86 46 Z" fill="#1E293B" />
  <!-- Shoulders & Dress -->
  <path d="M24 108 C 26 84, 44 76, 60 76 C 76 76, 94 84, 96 108 Z" fill="url(#shirt-f)" />
  <!-- Neck -->
  <rect x="53" y="58" width="14" height="20" rx="3" fill="#D49463" />
  <!-- Head -->
  <ellipse cx="60" cy="46" rx="18" ry="21" fill="url(#skin-f)" />
  <!-- Hair Front -->
  <path d="M38 42 C 38 24, 50 20, 60 20 C 70 20, 82 24, 82 42 C 78 30, 68 26, 60 26 C 52 26, 42 30, 38 42 Z" fill="#1E293B" />
  <path d="M38 38 C 42 48, 48 52, 48 52 C 48 52, 44 42, 44 34 Z" fill="#1E293B" />
  <path d="M82 38 C 78 48, 72 52, 72 52 C 72 52, 76 42, 76 34 Z" fill="#1E293B" />
  <!-- Bindi -->
  <circle cx="60" cy="41" r="1.5" fill="#991B1B" />
  <!-- Earrings -->
  <circle cx="41" cy="49" r="2.5" fill="#F59E0B" />
  <circle cx="79" cy="49" r="2.5" fill="#F59E0B" />
</svg>
`)}`;

/**
 * Universal helper to resolve avatar URL based on gender or sakhi status.
 */
export function getAvatar(userOrWorker) {
  if (!userOrWorker) return DEFAULT_MALE_AVATAR;

  // If already custom uploaded image (data URI or Cloudinary/user upload)
  const existing = userOrWorker.avatar || userOrWorker.image || userOrWorker.photoUrl || userOrWorker.img;
  if (existing && !existing.includes("unsplash.com") && !existing.includes("illustrations/")) {
    return existing;
  }

  const gender = (userOrWorker.gender || "").toLowerCase();
  const isSakhi = Boolean(
    userOrWorker.sakhiVerified ||
    userOrWorker.isSakhiVerified ||
    userOrWorker.isSakhi
  );

  const name = (userOrWorker.name || "").toLowerCase();
  const isFemaleName = /devi|kumari|kaur|sharma sunita|sunita|priya|anita|geeta|pooja|rekha|laxmi|meena|sita|radha/i.test(name);

  if (gender === "female" || isSakhi || isFemaleName) {
    return DEFAULT_FEMALE_AVATAR;
  }

  return DEFAULT_MALE_AVATAR;
}
