import { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";
import { resolveThreadProjectDropTargets } from "./Sidebar.threadMove";

const environmentId = EnvironmentId.make("local");
const source = {
  environmentId,
  threadId: ThreadId.make("thread"),
  projectId: ProjectId.make("source"),
};
const destination = { environmentId, projectId: ProjectId.make("destination") };

describe("thread project drop targets", () => {
  it("rejects the current project and cross-environment members of a grouped header", () => {
    expect(
      resolveThreadProjectDropTargets(source, [
        { environmentId, projectId: source.projectId },
        { environmentId: EnvironmentId.make("remote"), projectId: destination.projectId },
      ]),
    ).toEqual([]);
  });

  it("selects the matching environment rather than the first grouped member", () => {
    expect(
      resolveThreadProjectDropTargets(source, [
        { environmentId: EnvironmentId.make("remote"), projectId: destination.projectId },
        destination,
      ]),
    ).toEqual([destination]);
  });

  it("retains every eligible local member so an ambiguous group requires a choice", () => {
    const second = { environmentId, projectId: ProjectId.make("second") };
    expect(resolveThreadProjectDropTargets(source, [destination, second])).toEqual([
      destination,
      second,
    ]);
  });
});
