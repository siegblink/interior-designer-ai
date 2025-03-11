import { useEffect, useState } from "react";
import { ImageWithActions } from "./ImageWithActions";

export interface HistoryItem {
  id: string;
  inputImage: string;
  outputImage: string;
  roomType: string;
  theme: string;
  timestamp: number;
}

interface HistoryProps {
  items: HistoryItem[];
}

interface GroupedHistory {
  [key: string]: HistoryItem[];
}

export function History({ items }: HistoryProps) {
  const [groupedItems, setGroupedItems] = useState<GroupedHistory>({});

  useEffect(() => {
    // Group items by room type
    const grouped = items.reduce((acc: GroupedHistory, item) => {
      if (!acc[item.roomType]) {
        acc[item.roomType] = [];
      }
      acc[item.roomType].push(item);
      return acc;
    }, {});

    // Sort items within each group by timestamp (newest first)
    Object.keys(grouped).forEach(roomType => {
      grouped[roomType].sort((a, b) => b.timestamp - a.timestamp);
    });

    setGroupedItems(grouped);
  }, [items]);

  return (
    <div className="space-y-8">
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm font-medium text-yellow-800">
              Note: Images are only stored in your browser session. They will be lost when you close the browser. Use the download button to save images you want to keep.
            </p>
          </div>
        </div>
      </div>

      {Object.entries(groupedItems).map(([roomType, roomItems]) => (
        <div key={roomType} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-300">{roomType}</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roomItems.map((item) => (
              <div key={item.id} className="relative space-y-2 rounded-lg border border-gray-700 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">{item.theme}</span>
                  <span className="text-sm text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ImageWithActions
                    imageUrl={item.inputImage}
                    alt="Input image"
                    filename={`input-${item.id}.png`}
                    containerClassName="relative"
                    imageClassName="h-40 w-full rounded object-cover"
                  />
                  <ImageWithActions
                    imageUrl={item.outputImage}
                    alt="Output image"
                    filename={`output-${item.id}.png`}
                    containerClassName="relative"
                    imageClassName="h-40 w-full rounded object-cover"
                  />
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {item.roomType}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 