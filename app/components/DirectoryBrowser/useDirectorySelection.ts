import { useState, useMemo, useCallback } from "react";

export const useDirectorySelection = (dir: Dir | undefined) => {
  const [included, setIncluded] = useState<SelectedDir[]>([]);
  const [excluded, setExcluded] = useState<SelectedDir[]>([]);

  const isItemInList = useCallback(
    (itemId: ID, list: SelectedDir[]) =>
      list.some((item) => item.id === itemId),
    []
  );

  const hasChildrenInList = useCallback(
    (parentId: ID, list: SelectedDir[]) =>
      list.some((item) =>
        item.ancestors.some((ancestor) => ancestor.id === parentId)
      ),
    []
  );

  const getCurrentAncestorPath = useCallback(
    () =>
      dir ? [...(dir.ancestors || []), { id: dir.id, name: dir.name }] : [],
    [dir]
  );

  const findEffectiveParentState = useCallback(
    (childId: ID): "include" | "exclude" | "none" => {
      const ancestorPath = getCurrentAncestorPath();

      for (let i = ancestorPath.length - 1; i >= 0; i--) {
        const ancestor = ancestorPath[i];
        if (isItemInList(ancestor.id, excluded)) return "exclude";
        if (isItemInList(ancestor.id, included)) return "include";
      }

      return "none";
    },
    [getCurrentAncestorPath, isItemInList, excluded, included]
  );

  const calculateDirectState = useCallback(
    (child: { id: ID; name: string }) => {
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
        return {
          checked: false,
          indeterminate: hasIncludedChildren,
        };
      }

      if (hasIncludedChildren) {
        return { checked: false, indeterminate: true };
      }

      return null;
    },
    [isItemInList, hasChildrenInList, included, excluded]
  );

  const calculateInheritedState = useCallback(
    (child: { id: ID; name: string }) => {
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
    },
    [findEffectiveParentState, hasChildrenInList, excluded]
  );

  const getCheckboxState = useMemo(() => {
    return (child: { id: ID; name: string }) => {
      const directState = calculateDirectState(child);
      if (directState) return directState;

      return calculateInheritedState(child);
    };
  }, [calculateDirectState, calculateInheritedState]);

  const getParentIndeterminateState = useMemo(() => {
    if (!dir?.children?.length) {
      return { checked: false, indeterminate: false };
    }

    const childStates = dir.children.map((child) => getCheckboxState(child));

    const checkedCount = childStates.filter(
      (state) => state.checked && !state.indeterminate
    ).length;
    const indeterminateCount = childStates.filter(
      (state) => state.indeterminate
    ).length;
    const totalCount = childStates.length;

    if (checkedCount === 0 && indeterminateCount === 0) {
      return { checked: false, indeterminate: false };
    }

    if (checkedCount === totalCount && indeterminateCount === 0) {
      return { checked: true, indeterminate: false };
    }

    return { checked: false, indeterminate: true };
  }, [dir, getCheckboxState]);

  const createChildWithAncestors = useCallback(
    (child: { id: ID; name: string }) => ({
      ...child,
      ancestors: dir ? [...dir.ancestors, { id: dir.id, name: dir.name }] : [],
    }),
    [dir]
  );

  const shouldAddToExcluded = useCallback(
    (childId: ID) => {
      const effectiveState = findEffectiveParentState(childId);
      return effectiveState === "include";
    },
    [findEffectiveParentState]
  );

  const removeAllDescendants = useCallback((parentId: ID) => {
    const filterDescendants = (list: SelectedDir[]) =>
      list.filter(
        (item) =>
          item.id !== parentId &&
          !item.ancestors.some((ancestor) => ancestor.id === parentId)
      );

    setIncluded(filterDescendants);
    setExcluded(filterDescendants);
  }, []);

  const toggleAllChildren = useCallback(
    (checked: boolean) => {
      if (!dir) return;

      const updateList = (
        setter: React.Dispatch<React.SetStateAction<SelectedDir[]>>,
        otherList: SelectedDir[]
      ) => {
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

      const removeChildrenFromList = (
        setter: React.Dispatch<React.SetStateAction<SelectedDir[]>>
      ) => {
        setter((prev) =>
          prev.filter(
            (item) => !dir.children.some((child) => child.id === item.id)
          )
        );
      };

      if (checked) {
        updateList(setIncluded, excluded);
        removeChildrenFromList(setExcluded);
      } else {
        updateList(setExcluded, included);
        removeChildrenFromList(setIncluded);
      }
    },
    [dir, isItemInList, createChildWithAncestors, excluded, included]
  );

  const handleChildCheckboxChange = useCallback(
    (child: { id: ID; name: string }, checked: boolean) => {
      const childWithAncestors = createChildWithAncestors(child);

      if (checked) {
        removeAllDescendants(child.id);

        setExcluded((prev) => prev.filter((item) => item.id !== child.id));

        const effectiveState = findEffectiveParentState(child.id);

        setIncluded((prev) => {
          const filtered = prev.filter((item) => item.id !== child.id);

          if (effectiveState !== "include") {
            return [...filtered, childWithAncestors];
          }
          return filtered;
        });
      } else {
        removeAllDescendants(child.id);

        if (shouldAddToExcluded(child.id)) {
          setExcluded((prev) => {
            if (isItemInList(child.id, prev)) return prev;
            return [...prev, childWithAncestors];
          });
        }
      }
    },
    [
      createChildWithAncestors,
      isItemInList,
      shouldAddToExcluded,
      removeAllDescendants,
      findEffectiveParentState,
    ]
  );

  const handleParentCheckboxChange = useCallback(
    (checked: boolean) => {
      if (!dir) return;

      if (getParentIndeterminateState.indeterminate) {
        removeAllDescendants(dir.id);
        return;
      }

      const parentWithAncestors = {
        id: dir.id,
        name: dir.name,
        ancestors: dir.ancestors,
      } as SelectedDir;

      if (checked) {
        removeAllDescendants(dir.id);
        setIncluded((prev) => {
          if (isItemInList(dir.id, prev)) return prev;
          return [...prev, parentWithAncestors];
        });
        setExcluded((prev) => prev.filter((item) => item.id !== dir.id));
      } else {
        const wasIncluded = isItemInList(dir.id, included);

        removeAllDescendants(dir.id);

        if (!wasIncluded && shouldAddToExcluded(dir.id)) {
          setExcluded((prev) => {
            if (isItemInList(dir.id, prev)) return prev;
            return [...prev, parentWithAncestors];
          });
        }
      }
    },
    [
      dir,
      getParentIndeterminateState,
      removeAllDescendants,
      isItemInList,
      shouldAddToExcluded,
    ]
  );

  return {
    included,
    excluded,
    getCheckboxState,
    getParentIndeterminateState,
    handleChildCheckboxChange,
    handleParentCheckboxChange,
  };
};
