import React from "react";
import { ScrollView } from "react-native";
import { Chip } from "@components/ui/Chip";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "seeds", label: "Seeds" },
  { id: "fertilizers", label: "Fertilizers" },
  { id: "tools", label: "Tools" },
  { id: "services", label: "Services" },
  { id: "harvest", label: "Harvest" },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-3"
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {CATEGORIES.map((cat) => (
        <Chip
          key={cat.id}
          label={cat.label}
          selected={selected === cat.id}
          onPress={() => onSelect(cat.id)}
          variant="filled"
          className="mr-2"
        />
      ))}
    </ScrollView>
  );
}
