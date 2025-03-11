import Link from "next/link";
import { HistoryItem } from "./History";
import { useHistory } from "../context/HistoryContext";
import { ImageWithActions } from "./ImageWithActions";

interface RecentHistoryProps {
  items: HistoryItem[];
}

export function RecentHistory({ items }: RecentHistoryProps) {
  const { storageError } = useHistory();
  const recentItems = items.slice(0, 3);

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

      {storageError && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                {storageError}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recentItems.map((item) => (
          <div key={item.id} className="relative space-y-2 rounded-lg border border-gray-700 p-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">{`${item.roomType} - ${item.theme}`}</span>
              <span className="text-sm text-gray-400">
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
            </div>
            
            <div className="space-y-2">
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
          </div>
        ))}
      </div>
    </div>
  );
} 