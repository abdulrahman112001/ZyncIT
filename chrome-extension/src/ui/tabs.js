/**
 * Tab Management Module
 */

import { tabs, tabContents } from "./dom.js";
import { markAllCallsAsViewed } from "../services/calls.js";

/**
 * Initialize tab switching functionality
 */
export function initTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      tabContents.forEach((content) => {
        content.classList.remove("active");
      });

      document.getElementById(`${tabName}Tab`)?.classList.add("active");

      // Mark all calls as viewed when entering calls tab
      if (tabName === "calls") {
        markAllCallsAsViewed();
      }
    });
  });
}
