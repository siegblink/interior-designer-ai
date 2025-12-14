import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Transition } from "@headlessui/react";
import { Dialog } from "@headlessui/react";
import { navigation } from "@/common";
import { classNames } from "@/utils";
import { motion } from "framer-motion";

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen(open: boolean): void;
};

export function MobileSidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathName = usePathname();

  // Staggered animation for nav items
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50 lg:hidden"
        onClose={setSidebarOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-500"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-500"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 rounded-full bg-gray-900/50 p-2.5 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Transition.Child>

              {/* Sidebar component */}
              <aside className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900/90 px-6 pb-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
                <div className="flex h-16 shrink-0 items-center">
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent"
                  >
                    Interior Designer
                  </motion.h1>
                </div>

                {/* Decorative element */}
                <div className="px-1">
                  <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80"></div>
                </div>

                <nav className="flex flex-1 flex-col">
                  <motion.ul
                    role="list"
                    className="flex flex-1 flex-col gap-y-7"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <motion.li key={item.name} variants={itemVariants}>
                            <a
                              href={item.href}
                              className={classNames(
                                "group relative flex gap-x-3 overflow-hidden rounded-xl p-2 text-sm font-medium leading-6 transition-all duration-300",
                                pathName === item.href
                                  ? "text-white"
                                  : "text-gray-400 hover:text-gray-200"
                              )}
                            >
                              {pathName === item.href && (
                                <motion.span
                                  layoutId="sidebar-indicator-mobile"
                                  className="absolute inset-0 rounded-xl border border-indigo-700/30 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"
                                  transition={{ type: "spring", bounce: 0.2 }}
                                />
                              )}
                              <span className="relative z-10 flex items-center">
                                <span className="relative mr-3">
                                  <item.icon
                                    className={`h-5 w-5 transition-colors duration-200 ${
                                      pathName === item.href
                                        ? "text-blue-400"
                                        : "text-gray-400 group-hover:text-gray-300"
                                    }`}
                                    aria-hidden="true"
                                  />

                                  {/* Glow effect for active icon */}
                                  {pathName === item.href && (
                                    <span className="absolute inset-0 rounded-full bg-blue-400 opacity-40 blur-sm"></span>
                                  )}
                                </span>

                                {item.name}

                                {/* Active indicator dot */}
                                {pathName === item.href && (
                                  <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"></span>
                                )}
                              </span>
                            </a>
                          </motion.li>
                        ))}
                      </ul>
                    </li>

                    {/* Bottom section with logo/info */}
                    <li className="mt-auto">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-xl bg-gray-800/50 p-4 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500">
                            <span className="text-lg font-bold text-white">
                              AI
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              Interior Designer AI
                            </p>
                            <p className="text-xs text-gray-400">
                              Powered by advanced ML
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </li>
                  </motion.ul>
                </nav>
              </aside>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
