import { useState, useMemo } from "react";

export const useDirectorySelection = (dir: Dir | undefined) => {
  const [included, setIncluded] = useState<SelectedDir[]>([]);
  const [excluded, setExcluded] = useState<SelectedDir[]>([]);

  const isItemInList = (itemId: ID, list: SelectedDir[]) => list.some((item) => item.id === itemId);

  const hasChildrenInList = (parentId: ID, list: SelectedDir[]) =>
    list.some((item) => item.ancestors.some((ancestor) => ancestor.id === parentId));

  const getCurrentAncestorPath = () => (dir ? [...(dir.ancestors || []), { id: dir.id, name: dir.name }] : []);

  const findEffectiveParentState = (childId: ID): "include" | "exclude" | "none" => {
    const ancestorPath = getCurrentAncestorPath();

    for (let i = ancestorPath.length - 1; i >= 0; i--) {
      const ancestor = ancestorPath[i];
      if (isItemInList(ancestor.id, excluded)) return "exclude";
      if (isItemInList(ancestor.id, included)) return "include";
    }

    return "none";
  };

  const calculateDirectState = (child: { id: ID; name: string }) => {
    const isIncluded = isItemInList(child.id, included);
    const isExcluded = isItemInList(child.id, excluded);
    const hasIncludedChildren = hasChildrenInList(child.id, included);
    const hasExcludedChildren = hasChildrenInList(child.id, excluded);

    if (isIncluded) {
      return {
        checked: true,
        indeterminate: hasExcludedChildren,
      };
    }

    if (isExcluded) {
      return { checked: false, indeterminate: false };
    }

    if (hasIncludedChildren) {
      return { checked: false, indeterminate: true };
    }

    return null;
  };

  const calculateInheritedState = (child: { id: ID; name: string }) => {
    const effectiveState = findEffectiveParentState(child.id);
    const hasExcludedChildren = hasChildrenInList(child.id, excluded);

    switch (effectiveState) {
      case "exclude":
        return { checked: false, indeterminate: false };
      case "include":
        return {
          checked: true,
          indeterminate: hasExcludedChildren,
        };
      default:
        return { checked: false, indeterminate: false };
    }
  };

  const getCheckboxState = useMemo(() => {
    return (child: { id: ID; name: string }) => {
      const directState = calculateDirectState(child);
      if (directState) return directState;

      return calculateInheritedState(child);
    };
  }, [included, excluded, dir]);

  const getParentIndeterminateState = useMemo(() => {
    if (!dir?.children?.length) {
      return { checked: false, indeterminate: false };
    }

    const childStates = dir.children.map((child) => getCheckboxState(child));

    const checkedCount = childStates.filter((state) => state.checked && !state.indeterminate).length;
    const indeterminateCount = childStates.filter((state) => state.indeterminate).length;
    const totalCount = childStates.length;

    if (checkedCount === 0 && indeterminateCount === 0) {
      return { checked: false, indeterminate: false };
    }

    if (checkedCount === totalCount && indeterminateCount === 0) {
      return { checked: true, indeterminate: false };
    }

    return { checked: false, indeterminate: true };
  }, [dir, getCheckboxState]);

  const createChildWithAncestors = (child: { id: ID; name: string }) => ({
    ...child,
    ancestors: dir ? [...dir.ancestors, { id: dir.id, name: dir.name }] : [],
  });

  const shouldAddToExcluded = (childId: ID) => {
    const effectiveState = findEffectiveParentState(childId);
    return effectiveState === "include";
  };

  const handleChildCheckboxChange = (child: { id: ID; name: string }, checked: boolean) => {
    const childWithAncestors = createChildWithAncestors(child);

    if (checked) {
      setIncluded((prev) => {
        if (isItemInList(child.id, prev)) return prev;
        return [...prev, childWithAncestors];
      });
      setExcluded((prev) => prev.filter((item) => item.id !== child.id));
    } else {
      setIncluded((prev) => prev.filter((item) => item.id !== child.id));

      if (shouldAddToExcluded(child.id)) {
        setExcluded((prev) => {
          if (isItemInList(child.id, prev)) return prev;
          return [...prev, childWithAncestors];
        });
      }
    }
  };

  const removeAllDescendants = (parentId: ID) => {
    const filterDescendants = (list: SelectedDir[]) =>
      list.filter((item) => item.id !== parentId && !item.ancestors.some((ancestor) => ancestor.id === parentId));

    setIncluded(filterDescendants);
    setExcluded(filterDescendants);
  };

  const toggleAllChildren = (checked: boolean) => {
    if (!dir) return;

    const updateList = (setter: React.Dispatch<React.SetStateAction<SelectedDir[]>>, otherList: SelectedDir[]) => {
      setter((prev) => {
        const updated = [...prev];

        dir.children.forEach((child) => {
          const alreadyInList = isItemInList(child.id, updated);
          const inOtherList = isItemInList(child.id, otherList);

          if (!alreadyInList && !inOtherList) {
            updated.push(createChildWithAncestors(child));
          }
        });

        return updated;
      });
    };

    const removeChildrenFromList = (setter: React.Dispatch<React.SetStateAction<SelectedDir[]>>) => {
      setter((prev) => prev.filter((item) => !dir.children.some((child) => child.id === item.id)));
    };

    if (checked) {
      updateList(setIncluded, excluded);
      removeChildrenFromList(setExcluded);
    } else {
      updateList(setExcluded, included);
      removeChildrenFromList(setIncluded);
    }
  };

  const handleParentCheckboxChange = (checked: boolean) => {
    if (!dir) return;

    const parentState = getParentIndeterminateState;

    if (parentState.indeterminate) {
      removeAllDescendants(dir.id);
      return;
    }

    toggleAllChildren(checked);
  };

  return {
    included,
    excluded,
    getCheckboxState,
    getParentIndeterminateState,
    handleChildCheckboxChange,
    handleParentCheckboxChange,
  };
};
