"use client";

import dynamic from "next/dynamic";

const NeuralMission = dynamic(
  () => import("@/components/neural/neural-mission").then((m) => m.NeuralMission),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-full flex items-center justify-center bg-[#04060d]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-primary/30 border-t-primary animate-spin"/>
          <div className="mt-4 eyebrow text-[#9DB7EF]">INICIALIZANDO REDE NEURAL · 3D</div>
        </div>
      </div>
    ),
  },
);

export default function NeuralPage() {
  return <NeuralMission />;
}
