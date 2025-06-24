"use client";

import { useState } from "react";
import { DirectoryBrowser } from "./components/DirectoryBrowser/DirectoryBrowser";
import SelectedList from "./components/DirectoryBrowser/SelectedList";

export default function Home() {
  const [included, setIncluded] = useState<SelectedDir[]>([]);
  const [excluded, setExcluded] = useState<SelectedDir[]>([]);

  const handleSelectionChange = (newIncluded: SelectedDir[], newExcluded: SelectedDir[]) => {
    setIncluded(newIncluded);
    setExcluded(newExcluded);
  };

  return (
    <>
      <DirectoryBrowser onSelectionChange={handleSelectionChange} />
      <SelectedList included={included} excluded={excluded} />
    </>
  );
}
