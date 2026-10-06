import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import type { EnvironmentId, ProjectId } from "@t3tools/contracts";
import { useProjects } from "../../state/entities";
import { AppText } from "../../components/AppText";

export function ThreadProjectPicker(props: {
  environmentId: EnvironmentId;
  sourceProjectId: ProjectId;
  action: "Move" | "Fork";
  onSelect: (projectId: ProjectId) => void;
  onClose: () => void;
}) {
  const projects = useProjects().filter((project) => project.environmentId === props.environmentId);
  const [selected, setSelected] = useState(props.sourceProjectId);
  return (
    <Modal visible transparent animationType="slide" onRequestClose={props.onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[80%] rounded-t-2xl bg-background p-5 pb-10">
          <AppText className="text-lg font-semibold">{props.action} thread to project</AppText>
          <AppText>The execution workspace stays unchanged.</AppText>
          <ScrollView>
            {projects.map((project) => (
              <Pressable
                key={project.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === project.id }}
                onPress={() => setSelected(project.id)}
                className="py-3"
              >
                <AppText>
                  {selected === project.id ? "✓ " : ""}
                  {project.title}
                </AppText>
                <AppText className="text-xs text-muted-foreground">{project.workspaceRoot}</AppText>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            disabled={
              !projects.some((project) => project.id === selected) ||
              (props.action === "Move" && selected === props.sourceProjectId)
            }
            onPress={() => props.onSelect(selected)}
            className="py-3"
          >
            <AppText>{props.action}</AppText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={props.onClose} className="py-3">
            <AppText>Cancel</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
