/** Public respond-only Google Form (override with NEXT_PUBLIC_UPGRADE_FORM_URL). */
export const UPGRADE_FORM_URL =
  process.env.NEXT_PUBLIC_UPGRADE_FORM_URL?.trim() ||
  "https://docs.google.com/forms/d/e/1FAIpQLSe6Li4KKsZu8hlCnc_nU1rNh_PAwxUU7p9H8_TDax1iDLuiaQ/viewform";
