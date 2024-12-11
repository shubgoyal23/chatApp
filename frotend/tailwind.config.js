/** @type {import('tailwindcss').Config} */
export default {
   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
   theme: {
      extend: {
         colors: {
            gray: {
               100: "#F0F2F5",
            },
         },
      },
      theme: {
         fontFamily: {
            sans: ["Inter", "sans-serif"],
         },
      },
   },
   plugins: [],
   darkMode: ["class"],
};
