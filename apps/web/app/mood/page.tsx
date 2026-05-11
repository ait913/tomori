"use client";

import { PageFrame } from "@/components/PageFrame";
import { QuickMoodLog } from "@/components/QuickMoodLog";

export default function MoodPage() {
  return (
    <PageFrame title="気分ログ">
      <QuickMoodLog />
    </PageFrame>
  );
}
