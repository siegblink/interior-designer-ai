import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

type HeaderProps = {
  onClick(): void;
};

export function Header({ onClick }: HeaderProps) {
  const pathName = usePathname();

  // Set path name for display
  const displayName = pathName === "/" ? "Home" : "History";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 flex items-center gap-x-6 border-b border-gray-800/30 bg-gray-900/50 px-4 py-4 backdrop-blur-xl lg:hidden"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        className="-m-2.5 rounded-lg bg-gray-800/50 p-2.5 text-gray-300 transition-colors duration-200 hover:bg-gray-700/50 hover:text-white lg:hidden"
        onClick={onClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </motion.button>

      <motion.div layout className="flex flex-1 items-center">
        <motion.div
          key={displayName}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="flex items-center rounded-lg bg-gray-800/50 px-3 py-1.5 text-sm font-medium text-white"
        >
          {pathName === "/" ? (
            <>
              <span className="relative mr-2 flex h-2 w-2 rounded-full bg-green-400">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              </span>
              <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Home
              </span>
            </>
          ) : (
            <>
              <span className="relative mr-2 flex h-2 w-2 rounded-full bg-blue-400">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              </span>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                History
              </span>
            </>
          )}
        </motion.div>

        {/* Additional elements for a more high-tech header */}
        <div className="ml-auto flex items-center space-x-4">
          <div className="hidden items-center space-x-1 rounded-lg bg-gray-800/50 px-3 py-1.5 text-xs text-gray-400 sm:flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>AI Processing Ready</span>
          </div>

          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500">
            <span className="text-xs font-bold text-white">AI</span>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
