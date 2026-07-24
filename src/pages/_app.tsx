import type { AppProps } from "next/app";
import { useEffect } from "react";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA installation still works as a normal website if registration fails.
    });
  }, []);

  return <Component {...pageProps} />;
}
