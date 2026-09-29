import React from "react";
import { useSOC } from "../context/SOCContext";
import {
  Search,
  Command,
  RefreshCw,
  Sparkles,
  ChevronRight
} from "lucide-react";

export const TopHeader: React.FC = () => {
  const {
    activeTab,
    searchQuery,
    setSearchQuery,
    navigateTo,
    refreshAll,
    isLoading,
    demoModeActive,
    setDemoModeActive
  } = useSOC();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigateTo("search");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between gap-4 select-none flex-shrink-0">
      {/* Search Input with ⌘ K */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search CVEs, IOCs, IP addresses, hashes, incidents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-[#F4F6F8] border border-transparent rounded-xl pl-9 pr-12 py-2 text-xs text-black placeholder:text-[#94A3B8] font-sans focus:outline-none focus:bg-white focus:border-neutral-300 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-neutral-200 text-[10px] text-[#64748B] font-mono shadow-2xs">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
        {/* Demo Mode Toggle Switch */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDemoModeActive(!demoModeActive)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
              demoModeActive ? "bg-black" : "bg-neutral-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                demoModeActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-black">Demo Mode</span>
        </div>

        {/* System Healthy Status */}
        <div className="flex items-center gap-1.5 text-xs text-[#334155] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>System Healthy</span>
        </div>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-neutral-200 text-black flex items-center justify-center font-bold text-xs border border-neutral-300">
          K
        </div>
      </div>
    </header>
  );
};
export default TopHeader;
