"use client";

import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
}

interface SmoothTabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const SmoothTabSwitcher = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = "" 
}: SmoothTabSwitcherProps) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  
  return (
    <div className={`relative bg-purple-100 rounded-full p-1 w-fit mx-auto ${className}`}>
      <div className="flex relative">
        {/* Background indicator */}
        <motion.div
          className="absolute top-1 bottom-1 bg-white rounded-full shadow-lg"
          initial={false}
          animate={{
            left: activeIndex === 0 ? "4px" : "50%",
            right: activeIndex === 0 ? "50%" : "4px",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          style={{ zIndex: 1 }}
        />

        {/* Tab Buttons */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-6 py-3 rounded-full 
                transition-all duration-200 justify-center cursor-pointer
                min-w-[120px] z-10
                ${isActive 
                  ? 'text-purple-700 font-medium' 
                  : 'text-purple-600 hover:text-purple-700'
                }
              `}
              style={{ zIndex: 10 }}
            >
              <span className="text-sm whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SmoothTabSwitcher;