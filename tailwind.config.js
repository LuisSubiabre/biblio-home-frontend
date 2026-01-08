// tailwind.config.js
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/(alert|badge|button|card|checkbox|code|dropdown|input|kbd|link|modal|navbar|select|snippet|toggle|toast|ripple|spinner|form|menu|divider|popover|listbox|scroll-shadow).js",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
};