import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Reveal } from "./reveal";

function setReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as any;
}

describe("Reveal + prefers-reduced-motion", () => {
  beforeEach(() => {
    cleanup();
    // IntersectionObserver isn't in jsdom; provide a no-op so we prove
    // the reduced-motion branch never relies on it.
    (globalThis as any).IntersectionObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
    };
  });

  it("renders content immediately with no transform/transition when reduced motion is on", () => {
    setReducedMotion(true);
    const { container } = render(<Reveal>hello</Reveal>);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.textContent).toBe("hello");
    // Reduced motion returns the plain tag with no inline animation styles.
    expect(el.getAttribute("style")).toBeNull();
  });

  it("applies fade+translate transition styles when reduced motion is off", () => {
    setReducedMotion(false);
    const { container } = render(<Reveal>world</Reveal>);
    const el = container.firstElementChild as HTMLElement;
    // Non-reduced path uses inline styles for opacity + transform + transition.
    expect(el.style.transition).toContain("opacity");
    expect(el.style.transform).toMatch(/translateY/);
  });
});