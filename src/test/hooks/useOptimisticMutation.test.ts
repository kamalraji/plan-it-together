import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { createListUpdaters } from "@/hooks/useOptimisticMutation";

// Test the list updaters helper
describe("createListUpdaters", () => {
  const updaters = createListUpdaters<{ id: string; name: string }>();

  it("should add item to list", () => {
    const oldData = [{ id: "1", name: "Item 1" }];
    const newItem = { id: "2", name: "Item 2" };
    
    const result = updaters.add(oldData, newItem);
    
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual(newItem);
  });

  it("should update item in list", () => {
    const oldData = [
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
    ];
    
    const result = updaters.update(oldData, { id: "1", name: "Updated" });
    
    expect(result[0].name).toBe("Updated");
    expect(result[1].name).toBe("Item 2");
  });

  it("should remove item from list", () => {
    const oldData = [
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
    ];
    
    const result = updaters.remove(oldData, "1");
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("should reorder items in list", () => {
    const oldData = [
      { id: "1", name: "First" },
      { id: "2", name: "Second" },
      { id: "3", name: "Third" },
    ];
    
    const result = updaters.reorder(oldData, 0, 2);
    
    expect(result[0].id).toBe("2");
    expect(result[1].id).toBe("3");
    expect(result[2].id).toBe("1");
  });

  it("should handle undefined oldData", () => {
    const newItem = { id: "1", name: "New" };
    
    const addResult = updaters.add(undefined, newItem);
    expect(addResult).toHaveLength(1);
    
    const updateResult = updaters.update(undefined, { id: "1", name: "Updated" });
    expect(updateResult).toHaveLength(0);
    
    const removeResult = updaters.remove(undefined, "1");
    expect(removeResult).toHaveLength(0);
  });
});
