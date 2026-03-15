"use client";

export default function AnalyticsPanel({ leads = [] }: { leads: any[] }) {
  const high = leads.filter((l) => l.incidents?.impact_level === "High").length;
  const medium = leads.filter((l) => l.incidents?.impact_level === "Medium").length;
  const low = leads.filter((l) => l.incidents?.impact_level === "Low").length;
  const total = leads.length || 1;

  const chartData = [
    { name: "High", value: high, color: "bg-red-500" },
    { name: "Medium", value: medium, color: "bg-orange-500" },
    { name: "Low", value: low, color: "bg-green-500" },
  ];

  const maxVal = Math.max(high, medium, low) || 1;

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col col-span-1 h-full min-h-[300px]">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="font-semibold text-lg text-white">Impact Analytics</h2>
      </div>
      
      {leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-textSecondary text-sm">
          No data to analyze
        </div>
      ) : (
        <div className="flex-1 flex items-end justify-between px-6 pb-2 gap-4">
          {chartData.map((item) => {
            const heightPercent = Math.max((item.value / maxVal) * 100, 5);
            return (
              <div key={item.name} className="flex flex-col items-center w-full gap-2 group">
                <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.value}
                </span>
                <div className="w-full bg-[#2a2a2a] rounded-t-md relative flex items-end h-[180px]">
                  <div 
                    className={`w-full rounded-t-md ${item.color} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.3)]`}
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                </div>
                <span className="text-textSecondary text-sm font-medium mt-2">{item.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
