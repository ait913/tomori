"use client";

import { DialogExperience } from "@/components/DialogExperience";
import { PageFrame } from "@/components/PageFrame";

export default function ChatDialogPage() {
  return (
    <PageFrame title="AI に相談">
      <DialogExperience
        description="任意相談モードです。10 ターンで自動クローズします。"
        mode="talk"
        startLabel="相談を始める"
        title="今の話をそのまま置いてください。"
      />
    </PageFrame>
  );
}
