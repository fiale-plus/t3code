import type { ScopedProjectRef, ScopedThreadRef } from "@t3tools/contracts";
import { useCallback } from "react";
import { threadEnvironment } from "../state/threads";
import { useAtomCommand } from "../state/use-atom-command";

/** Organizational placement only; execution workspace is retained by the server. */
export function useMoveThread() {
  const move = useAtomCommand(threadEnvironment.moveProject, { reportFailure: false });
  return useCallback(
    (threadRef: ScopedThreadRef, target: ScopedProjectRef) => {
      if (threadRef.environmentId !== target.environmentId) {
        throw new Error("Threads can only move within their environment.");
      }
      return move({
        environmentId: threadRef.environmentId,
        input: {
          threadId: threadRef.threadId,
          targetProjectId: target.projectId,
        },
      });
    },
    [move],
  );
}
