import { saveAs } from "file-saver";
import { FaDownload } from "react-icons/fa";
import { useEffect, useState } from "react";

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

  const downloadImage = (imageUrl: string, filename: string) => {
    saveAs(imageUrl, filename);
  };

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
                  <div className="relative">
                    <img
                      src={item.inputImage}
                      alt="Input"
                      className="h-40 w-full rounded object-cover"
                    />
                    <button
                      onClick={() => downloadImage(item.inputImage, `input-${item.id}.png`)}
                      className="group absolute right-1 top-1 rounded bg-yellow-500 p-2 text-black"
                    >
                      <FaDownload className="h-4 w-4 duration-300 group-hover:scale-110" />
                    </button>
                  </div>
                  <div className="relative">
                    <img
                      src={item.outputImage}
                      alt="Output"
                      className="h-40 w-full rounded object-cover"
                    />
                    <button
                      onClick={() => downloadImage(item.outputImage, `output-${item.id}.png`)}
                      className="group absolute right-1 top-1 rounded bg-yellow-500 p-2 text-black"
                    >
                      <FaDownload className="h-4 w-4 duration-300 group-hover:scale-110" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 