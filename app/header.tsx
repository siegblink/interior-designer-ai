import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";

interface HeaderProps {
  onClick: () => void;
}

export function Header({ onClick }: HeaderProps) {
  const pathName = usePathname();
  console.log(pathName);

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 text-sm font-semibold leading-6 text-white">
        {pathName === "/" ? "Home" : "History"}
      </div>
    </div>
  );
}
