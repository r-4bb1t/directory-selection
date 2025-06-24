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
    <div className="grid grid-cols-2 gap-4 w-full max-w-4xl h-full py-32">
      <DirectoryBrowser onSelectionChange={handleSelectionChange} />
      <SelectedList included={included} excluded={excluded} />
    </div>
  );
}
