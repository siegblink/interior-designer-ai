"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { navigation } from "@/common";
import { classNames } from "@/utils";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export function DesktopSidebar() {
  const pathName = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-800/30 bg-gray-900/70 shadow-lg backdrop-blur-xl">
        <div className="flex h-16 shrink-0 items-center px-6">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent drop-shadow-sm"
          >
            Interior Designer
          </motion.h1>
        </div>

        {/* Decorative element */}
        <div className="px-6">
          <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        </div>

        <nav className="flex flex-1 flex-col px-6">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item, index) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={classNames(
                        "group relative flex gap-x-3 overflow-hidden rounded-xl p-2 text-sm font-medium leading-6 transition-all duration-300",
                        pathName === item.href
                          ? "text-white"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      {pathName === item.href && (
                        <motion.span
                          layoutId="sidebar-indicator"
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
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </li>

            {/* User session section - only show when authenticated */}
            {session && (
              <li className="mt-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="border-t border-gray-700 pt-4"
                >
                  {session.user && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mb-3 rounded-xl bg-gray-800/50 p-3 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-x-3">
                        {session.user.image && (
                          <motion.img
                            whileHover={{ scale: 1.1 }}
                            className="h-10 w-10 rounded-full ring-2 ring-indigo-500/50"
                            src={session.user.image}
                            alt={session.user.name || "User"}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {session.user.name || "User"}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    className="group flex w-full gap-x-3 rounded-xl bg-gray-800/50 p-2 text-sm font-semibold leading-6 text-gray-400 backdrop-blur-sm transition-all duration-300 hover:bg-gray-700/50 hover:text-white"
                  >
                    <ArrowRightOnRectangleIcon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    Sign out
                  </motion.button>
                </motion.div>
              </li>
            )}

            {/* Bottom section with logo/info - only show when not authenticated */}
            {!session && (
              <li className="mt-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl bg-gray-800/50 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500">
                      <span className="text-lg font-bold text-white">AI</span>
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
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
