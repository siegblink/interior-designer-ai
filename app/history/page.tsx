"use client";

import { useState } from "react";
import { History } from "../components/History";
import { useHistory } from "../context/HistoryContext";
import { ConfirmationModal } from "../components/ConfirmationModal";

export default function HistoryPage() {
  const { historyItems, clearHistory, storageError } = useHistory();
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <main className="flex min-h-screen bg-black flex-col py-10 lg:pl-72">
      <div className="mx-4 flex items-center justify-between lg:mx-6 xl:mx-8">
        <h1 className="text-3xl font-bold text-gray-300">Design History</h1>
        {historyItems.length > 0 && (
          <button
            onClick={() => setShowConfirmation(true)}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-red-500"
          >
            Clear History
          </button>
        )}
      </div>

      {storageError && (
        <div className="mx-4 mt-4 rounded-md bg-yellow-50 p-4 lg:mx-6 xl:mx-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                {storageError}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 px-4 lg:px-6 xl:px-8">
        <History items={historyItems} />
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={clearHistory}
        title="Clear History"
        message="Are you sure you want to clear all design history? This action cannot be undone."
        confirmButtonText="Clear History"
        cancelButtonText="Cancel"
      />
    </main>
  );
} 