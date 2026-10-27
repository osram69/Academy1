"use client";

import dynamic from "next/dynamic";

// niente rendering sul server: i moduli leggono lingua e storage del browser all'avvio
const ClientApp = dynamic(() => import("./ClientApp"), { ssr: false });

export default function ClientRoot() {
  return <ClientApp />;
}
