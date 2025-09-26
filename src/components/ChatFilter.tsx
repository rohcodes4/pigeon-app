
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, MessageCircle, Users, Pin, Mail, Smartphone, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "telegram" | "discord" | "unread" | "pinned" | "groups" | "dms";

interface ChatFilterProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const ChatFilter = ({ activeFilter, onFilterChange }: ChatFilterProps) => {
  const filterOptions = [
    { value: "all" as FilterType, label: "All Chats", icon: MessageCircle },
    { value: "telegram" as FilterType, label: "Telegram", icon: Smartphone },
    { value: "discord" as FilterType, label: "Discord", icon: Hash },
    { value: "unread" as FilterType, label: "Unread", icon: Mail },
    { value: "pinned" as FilterType, label: "Pinned", icon: Pin },
    { value: "groups" as FilterType, label: "Groups", icon: Users },
    { value: "dms" as FilterType, label: "Direct Messages", icon: MessageCircle },
  ];

  const activeFilterOption = filterOptions.find(option => option.value === activeFilter);

  return (
    <div className="flex items-center gap-2 p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            {activeFilterOption ? (
              <>
                <activeFilterOption.icon className="w-4 h-4" />
                {activeFilterOption.label}
              </>
            ) : (
              "Filter"
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-white border shadow-lg">
          {filterOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                activeFilter === option.value && "bg-blue-50 text-blue-600"
              )}
            >
              <option.icon className="w-4 h-4" />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeFilter !== "all" && (
        <Badge 
          variant="secondary" 
          className="cursor-pointer hover:bg-gray-200"
          onClick={() => onFilterChange("all")}
        >
          {activeFilterOption?.label} ✕
        </Badge>
      )}
    </div>
  );
};
