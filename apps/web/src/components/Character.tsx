"use client";

import { useAppStore, type OrbState } from "@/store/app";

const ORB_SRC: Record<OrbState, string> = {
  idle: "/character/orb-idle.svg",
  morning: "/character/orb-morning.svg",
  evening: "/character/orb-evening.svg",
  talking: "/character/orb-talking.svg",
  crisis: "/character/orb-crisis.svg"
};

type CharacterProps = {
  state: Exclude<OrbState, "crisis">;
  size?: number;
};

export function Character({ state, size = 192 }: CharacterProps) {
  const crisisOpen = useAppStore((store) => store.crisis.open);
  const actualState = crisisOpen ? "crisis" : state;

  return (
    <div
      className={[
        "relative mx-auto flex items-center justify-center",
        actualState === "talking" ? "animate-[tomori-pulse_1.5s_ease-in-out_infinite]" : "",
        actualState === "morning" ? "animate-[tomori-float_6s_ease-in-out_infinite]" : "",
        actualState === "evening" ? "animate-[tomori-breathe-slow_8s_ease-in-out_infinite]" : "",
        actualState === "idle" ? "animate-[tomori-breathe_4s_ease-in-out_infinite]" : "",
        actualState === "crisis" ? "animate-[tomori-crisis_0.3s_ease-in-out_1]" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,227,176,0.58)_0%,rgba(255,248,238,0)_72%)] blur-2xl" />
      <img alt="tomori orb" className="relative h-full w-full object-contain" loading="eager" src={ORB_SRC[actualState]} />
    </div>
  );
}
