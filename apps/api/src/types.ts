import type { Pool } from "pg";

import type { KEKProvider } from "@tomori/crypto";
import type { CrisisCard } from "@tomori/shared";

export type SessionUser = {
  id: string;
  email: string;
  sessionId: string;
};

export type ApiEnv = {
  Variables: {
    requestId: string;
    sessionUser: SessionUser | null;
    pool: Pool;
    kekProvider: KEKProvider;
    crisisCard: CrisisCard;
  };
};
