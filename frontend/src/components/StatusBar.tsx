interface UsageBarProps {
  status: "running" | "stopped" | "paused" | "other";
}

function UsageBar({ status }: UsageBarProps) {
  
  // Determine the color based on the status
  let bgColor;
  switch (status) {
    case "running":
      bgColor = "bg-green-500";
      break;
    case "stopped":
      bgColor = "bg-red-500";
      break;
    case "paused":
      bgColor = "bg-yellow-500";
      break;
    default:
      bgColor = "bg-gray-400";
  }

  return (
    <div className="bg-gray-200 h-5 rounded overflow-hidden">
      <div className={`${bgColor} h-full`} style={{ width: widthPercentage }}></div>
    </div>
  );
}

export default UsageBar;
