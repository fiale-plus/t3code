import { useAtomValue } from "@effect/atom-react";
import { scopeProjectRef, scopeThreadRef } from "@t3tools/client-runtime/environment";
import { squashAtomCommandFailure } from "@t3tools/client-runtime/state/runtime";
import type {
  EnvironmentId,
  ProjectId,
  ScopedProjectRef,
  ScopedThreadRef,
} from "@t3tools/contracts";
import { Atom } from "effect/reactivity";
import { useState } from "react";
import { useMoveThread } from "../hooks/useMoveThread";
import { appAtomRegistry } from "../rpc/atomRegistry";
import { useProjects, useThreadShell } from "../state/entities";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "./ui/dialog";

const moveThreadTarget = Atom.make<{
  threadRef: ScopedThreadRef;
  targetProjectIds?: ReadonlyArray<ProjectId> | undefined;
} | null>(null).pipe(Atom.keepAlive);
export function openMoveThreadDialog(
  threadRef: ScopedThreadRef,
  targetProjectIds?: ReadonlyArray<ProjectId>,
) {
  appAtomRegistry.set(moveThreadTarget, { threadRef, targetProjectIds });
}

export function ThreadProjectDialog(props: {
  environmentId: EnvironmentId;
  sourceProjectId: ProjectId;
  action: "Move" | "Fork";
  targetProjectIds?: ReadonlyArray<ProjectId> | undefined;
  onConfirm: (target: ScopedProjectRef) => Promise<void>;
  onClose: () => void;
}) {
  const projects = useProjects().filter(
    (project) =>
      project.environmentId === props.environmentId &&
      (!props.targetProjectIds || props.targetProjectIds.includes(project.id)),
  );
  const [selected, setSelected] = useState(
    projects.find((project) => project.id === props.sourceProjectId)?.id ??
      projects[0]?.id ??
      props.sourceProjectId,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = projects.find((project) => project.id === selected);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) props.onClose();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{props.action} thread to project</DialogTitle>
          <DialogDescription>
            Choose a project in this environment. The execution workspace stays unchanged.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <label className="flex flex-col gap-2">
            Project
            <select
              value={selected}
              disabled={pending}
              onChange={(event) => {
                const project = projects.find((candidate) => candidate.id === event.target.value);
                if (project) setSelected(project.id);
              }}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} — {project.workspaceRoot}
                </option>
              ))}
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              pending || !target || (props.action === "Move" && selected === props.sourceProjectId)
            }
            onClick={() => {
              if (!target) return;
              setPending(true);
              setError(null);
              void props
                .onConfirm(scopeProjectRef(props.environmentId, target.id))
                .then(props.onClose)
                .catch((cause: unknown) => {
                  setError(
                    cause instanceof Error ? cause.message : "Could not update this thread.",
                  );
                })
                .finally(() => setPending(false));
            }}
          >
            {pending ? "Working…" : props.action}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

/** Mount once in the sidebar shell; actions can originate from any thread menu. */
export function MoveThreadDialogHost() {
  const request = useAtomValue(moveThreadTarget);
  const ref = request?.threadRef ?? null;
  const thread = useThreadShell(ref);
  const move = useMoveThread();
  if (!ref || !thread) return null;
  return (
    <ThreadProjectDialog
      key={`${ref.environmentId}:${ref.threadId}`}
      environmentId={ref.environmentId}
      sourceProjectId={thread.projectId}
      action="Move"
      targetProjectIds={request?.targetProjectIds}
      onClose={() => appAtomRegistry.set(moveThreadTarget, null)}
      onConfirm={async (target) => {
        const result = await move(scopeThreadRef(ref.environmentId, ref.threadId), target);
        if (result._tag === "Failure") throw squashAtomCommandFailure(result);
      }}
    />
  );
}
