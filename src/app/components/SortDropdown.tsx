import { ChevronDown, ArrowUpDown, TrendingUp, TrendingDown, Star } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export type SortOption = 
  | "relevance"
  | "price-low-high"
  | "price-high-low"
  | "rating"
  | "newest"
  | "name";

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions = [
  {
    value: "relevance" as SortOption,
    label: "Relevance",
    icon: ArrowUpDown,
  },
  {
    value: "price-low-high" as SortOption,
    label: "Price: Low to High",
    icon: TrendingUp,
  },
  {
    value: "price-high-low" as SortOption,
    label: "Price: High to Low",
    icon: TrendingDown,
  },
  {
    value: "rating" as SortOption,
    label: "Highest Rated",
    icon: Star,
  },
  {
    value: "newest" as SortOption,
    label: "Newest",
    icon: ArrowUpDown,
  },
  {
    value: "name" as SortOption,
    label: "Name A-Z",
    icon: ArrowUpDown,
  },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const selectedOption = sortOptions.find(option => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[180px]">
          <div className="flex items-center gap-2">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4" />
            )}
            <span>Sort by: {selectedOption?.label}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <option.icon className="h-4 w-4" />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}