import type { ProjectId, ScopedProjectRef, ScopedThreadRef } from "@t3tools/contracts";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import { useEffect, useState, type DragEvent } from "react";
import { useMoveThread } from "../hooks/useMoveThread";
import { readThreadShell } from "../state/entities";
import { openMoveThreadDialog } from "./MoveThreadDialog";
import { stackedThreadToast, toastManager } from "./ui/toast";

const THREAD_MOVE_TYPE = "application/x-t3-thread-project-move";
// Only accept a drag originating in this client, not a payload supplied by another app.
let draggedThread: ScopedThreadRef | null = null;

function takeDraggedThread() {
  const thread = draggedThread;
  draggedThread = null;
  return thread;
}

export function resolveThreadProjectDropTargets(
  source: ScopedThreadRef & { projectId: ProjectId },
  projects: ReadonlyArray<ScopedProjectRef>,
): ScopedProjectRef[] {
  return projects.filter(
    (project) =>
      project.environmentId === source.environmentId && project.projectId !== source.projectId,
  );
}

export function threadProjectDragProps(threadRef: ScopedThreadRef, disabled: boolean) {
  return {
    draggable: !disabled,
    onDragStart(event: DragEvent<HTMLElement>) {
      if (
        disabled ||
        (event.target instanceof Element &&
          event.target.closest("a, button, input, textarea, select, [contenteditable=true]")) ||
        !readThreadShell(threadRef)
      ) {
        event.preventDefault();
        return;
      }
      draggedThread = threadRef;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(THREAD_MOVE_TYPE, JSON.stringify(threadRef));
      event.stopPropagation();
    },
    onDragEnd() {
      draggedThread = null;
    },
  };
}

export function useThreadProjectDrop(projects: ReadonlyArray<ScopedProjectRef>) {
  const move = useMoveThread();
  const [isDragOver, setIsDragOver] = useState(false);
  useEffect(() => {
    if (!isDragOver) return;
    const clear = () => setIsDragOver(false);
    window.addEventListener("dragend", clear);
    window.addEventListener("drop", clear);
    return () => {
      window.removeEventListener("dragend", clear);
      window.removeEventListener("drop", clear);
    };
  }, [isDragOver]);

  function targets(event: DragEvent<HTMLElement>) {
    if (!draggedThread || !event.dataTransfer.types.includes(THREAD_MOVE_TYPE)) return [];
    const thread = readThreadShell(draggedThread);
    return thread
      ? resolveThreadProjectDropTargets({ ...draggedThread, projectId: thread.projectId }, projects)
      : [];
  }

  return {
    isDragOver,
    dropProps: {
      onDragOver(event: DragEvent<HTMLElement>) {
        if (targets(event).length === 0) {
          setIsDragOver(false);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      },
      onDragLeave(event: DragEvent<HTMLElement>) {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        )
          return;
        setIsDragOver(false);
      },
      onDrop(event: DragEvent<HTMLElement>) {
        const candidates = targets(event);
        setIsDragOver(false);
        if (candidates.length === 0) return;
        const threadRef = takeDraggedThread();
        if (!threadRef) return;
        event.preventDefault();
        event.stopPropagation();
        if (candidates.length > 1) {
          openMoveThreadDialog(
            threadRef,
            candidates.map((project) => project.projectId),
          );
          return;
        }
        void move(threadRef, candidates[0]!).then((result) => {
          if (result._tag !== "Failure" || isAtomCommandInterrupted(result)) return;
          const error = squashAtomCommandFailure(result);
          toastManager.add(
            stackedThreadToast({
              type: "error",
              title: "Could not move thread",
              description: error instanceof Error ? error.message : "An error occurred.",
            }),
          );
        });
      },
    },
  };
}
