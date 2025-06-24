import { DirectoryHeader } from "./DirectoryHeader";
import { DirectoryItem } from "./DirectoryItem";

interface DirectoryListProps {
  dir: Dir;
  getCheckboxState: (child: { id: ID; name: string }) => { checked: boolean; indeterminate: boolean };
  parentCheckboxState: { checked: boolean; indeterminate: boolean };
  onChildCheckboxChange: (child: { id: ID; name: string }, checked: boolean) => void;
  onParentCheckboxChange: (checked: boolean) => void;
  onNavigate: (id: ID) => void;
}

export const DirectoryList = ({
  dir,
  getCheckboxState,
  parentCheckboxState,
  onChildCheckboxChange,
  onParentCheckboxChange,
  onNavigate,
}: DirectoryListProps) => {
  return (
    <>
      <DirectoryHeader
        dir={dir}
        parentCheckboxState={parentCheckboxState}
        onParentCheckboxChange={onParentCheckboxChange}
        onNavigate={onNavigate}
      />

      {dir.children.map((child) => {
        const checkboxState = getCheckboxState(child);
        return (
          <DirectoryItem
            key={child.id}
            child={child}
            checkboxState={checkboxState}
            onCheckboxChange={onChildCheckboxChange}
            onNavigate={onNavigate}
          />
        );
      })}
    </>
  );
};
