"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { navigation } from "@/common";
import { classNames } from "@/utils";
import Link from "next/link";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export function DesktopSidebar() {
  const pathName = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      {/* Sidebar component, swap this element with another sidebar if you like */}
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 bg-clip-text text-xl font-semibold text-transparent">
            Interior Designer
          </h1>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        pathName === item.href
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white",
                        "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-all duration-300"
                      )}
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            {session && (
              <li className="mt-auto">
                <div className="border-t border-gray-700 pt-4">
                  {session.user && (
                    <div className="mb-3 px-2">
                      <div className="flex items-center gap-x-3">
                        {session.user.image && (
                          <img
                            className="h-8 w-8 rounded-full"
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
                    </div>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 transition-all duration-300 hover:bg-gray-800 hover:text-white"
                  >
                    <ArrowRightOnRectangleIcon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    Sign out
                  </button>
                </div>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
