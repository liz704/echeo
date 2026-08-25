/* import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
/* };*/

/* export default nextConfig;*/
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // "standalone" produit un dossier autonome (.next/standalone) avec un
  // petit serveur node embarqué : image Docker beaucoup plus légère et
  // rapide à démarrer que "next start" sur le projet complet.
  output: "standalone",
};

module.exports = nextConfig;