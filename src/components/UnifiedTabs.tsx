const tabs = [
    { slug: "ai", title: "AI Summary" },
    { slug: "alpha", title: "Alpha" },
  ];
  
  export const UnifiedTabs = ({ active, onTabChange }) => (
    <div className="flex gap-2 mb-4 mt-3">
      {tabs.map((tab) => (
        <button
          key={tab.slug}
          onClick={() => onTabChange(tab.slug)}
          className={`mx-4 px-1 py-3 text-[#ffffff48] border-b  font-semibold ${
            active === tab.slug
              ? "text-white border-white"
              : "border-transparent"
          }`}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );