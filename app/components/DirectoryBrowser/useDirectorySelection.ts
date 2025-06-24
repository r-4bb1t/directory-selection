import { useState, useMemo } from "react";

export const useDirectorySelection = (dir: Dir | undefined) => {
  const [included, setIncluded] = useState<SelectedDir[]>([]);
  const [excluded, setExcluded] = useState<SelectedDir[]>([]);

  const getCheckboxState = useMemo(() => {
    return (child: { id: ID; name: string }) => {
      const isIncluded = included.some((item) => item.id === child.id);
      const isExcluded = excluded.some((item) => item.id === child.id);

      const hasIncludedChildren = included.some((item) => item.ancestors.some((ancestor) => ancestor.id === child.id));
      const hasExcludedChildren = excluded.some((item) => item.ancestors.some((ancestor) => ancestor.id === child.id));

      if (isIncluded) {
        if (hasExcludedChildren) {
          return { checked: true, indeterminate: true };
        }
        return { checked: true, indeterminate: false };
      }

      if (isExcluded) {
        return { checked: false, indeterminate: false };
      }

      if (hasIncludedChildren) {
        return { checked: false, indeterminate: true };
      }

      const childAncestorPath = [...(dir?.ancestors || []), { id: dir?.id, name: dir?.name || "" }];

      let effectiveState: "include" | "exclude" | "none" = "none";

      for (let i = childAncestorPath.length - 1; i >= 0; i--) {
        const ancestor = childAncestorPath[i];
        if (excluded.some((item) => item.id === ancestor.id)) {
          effectiveState = "exclude";
          break;
        }
        if (included.some((item) => item.id === ancestor.id)) {
          effectiveState = "include";
          break;
        }
      }

      if (effectiveState === "exclude") {
        return { checked: false, indeterminate: false };
      } else if (effectiveState === "include") {
        if (hasExcludedChildren) {
          return { checked: true, indeterminate: true };
        }
        return { checked: true, indeterminate: false };
      }

      return { checked: false, indeterminate: false };
    };
  }, [included, excluded, dir]);

  const getParentIndeterminateState = useMemo(() => {
    if (!dir) return { checked: false, indeterminate: false };

    const childStates = dir.children.map((child) => {
      const state = getCheckboxState(child);
      return { checked: state.checked, indeterminate: state.indeterminate };
    });

    const checkedCount = childStates.filter((state) => state.checked && !state.indeterminate).length;
    const indeterminateCount = childStates.filter((state) => state.indeterminate).length;
    const totalCount = childStates.length;

    if (checkedCount === 0 && indeterminateCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (checkedCount === totalCount && indeterminateCount === 0) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  }, [dir, getCheckboxState]);

  const handleChildCheckboxChange = (child: { id: ID; name: string }, checked: boolean) => {
    const childAncestors = dir ? [...dir.ancestors, { id: dir.id, name: dir.name }] : [];
    const childWithAncestors = { ...child, ancestors: childAncestors };

    if (checked) {
      setIncluded((prev) => {
        const alreadyIncluded = prev.some((item) => item.id === child.id);
        if (alreadyIncluded) return prev;
        return [...prev, childWithAncestors];
      });
      setExcluded((prev) => prev.filter((item) => item.id !== child.id));
    } else {
      setIncluded((prev) => prev.filter((item) => item.id !== child.id));

      const childAncestorPath = [...(dir?.ancestors || []), { id: dir?.id, name: dir?.name || "" }];
      let shouldAddToExcluded = false;

      for (let i = childAncestorPath.length - 1; i >= 0; i--) {
        const ancestor = childAncestorPath[i];
        if (excluded.some((item) => item.id === ancestor.id)) {
          break;
        }
        if (included.some((item) => item.id === ancestor.id)) {
          shouldAddToExcluded = true;
          break;
        }
      }

      if (shouldAddToExcluded) {
        setExcluded((prev) => {
          const alreadyExcluded = prev.some((item) => item.id === child.id);
          if (alreadyExcluded) return prev;
          return [...prev, childWithAncestors];
        });
      }
    }
  };

  const handleParentCheckboxChange = (checked: boolean) => {
    if (!dir) return;

    const parentState = getParentIndeterminateState;
    const isIntermediate = parentState.indeterminate;

    if (isIntermediate) {
      const removeDescendants = (id: ID) => {
        setIncluded((prev) =>
          prev.filter((item) => {
            return item.id !== id && !item.ancestors.some((ancestor) => ancestor.id === id);
          })
        );

        setExcluded((prev) =>
          prev.filter((item) => {
            return item.id !== id && !item.ancestors.some((ancestor) => ancestor.id === id);
          })
        );
      };

      removeDescendants(dir.id);
      return;
    }

    if (checked) {
      setIncluded((prev) => {
        const newIncluded = [...prev];
        dir.children.forEach((child) => {
          const alreadyIncluded = newIncluded.some((item) => item.id === child.id);
          const explicitlyExcluded = excluded.some((item) => item.id === child.id);

          if (!alreadyIncluded && !explicitlyExcluded) {
            const childAncestors = [...dir.ancestors, { id: dir.id, name: dir.name }];
            const childWithAncestors = { ...child, ancestors: childAncestors };
            newIncluded.push(childWithAncestors);
          }
        });
        return newIncluded;
      });
      setExcluded((prev) => prev.filter((item) => !dir.children.some((child) => child.id === item.id)));
    } else {
      setExcluded((prev) => {
        const newExcluded = [...prev];
        dir.children.forEach((child) => {
          const alreadyExcluded = newExcluded.some((item) => item.id === child.id);
          const explicitlyIncluded = included.some((item) => item.id === child.id);

          if (!alreadyExcluded && !explicitlyIncluded) {
            const childAncestors = [...dir.ancestors, { id: dir.id, name: dir.name }];
            const childWithAncestors = { ...child, ancestors: childAncestors };
            newExcluded.push(childWithAncestors);
          }
        });
        return newExcluded;
      });
      setIncluded((prev) => prev.filter((item) => !dir.children.some((child) => child.id === item.id)));
    }
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
