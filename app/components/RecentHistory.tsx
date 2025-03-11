import { saveAs } from "file-saver";
import { FaDownload } from "react-icons/fa";
import Link from "next/link";
import { HistoryItem } from "./History";

interface RecentHistoryProps {
  items: HistoryItem[];
}

export function RecentHistory({ items }: RecentHistoryProps) {
  const recentItems = items.slice(0, 3);

  const downloadImage = (imageUrl: string, filename: string) => {
    saveAs(imageUrl, filename);
  };

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-300">Recent Designs</h2>
        <Link
          href="/history"
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          View All History →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recentItems.map((item) => (
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
            <div className="mt-2 text-sm text-gray-400">
              {item.roomType}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 