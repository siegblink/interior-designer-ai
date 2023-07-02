import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";

type HeaderProps = {
  onClick(): void;
};

export function Header({ onClick }: HeaderProps) {
  const pathName = usePathname();
  console.log(pathName);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-x-6 bg-gray-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
        onClick={onClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 text-sm font-semibold leading-6 text-white">
        {pathName === "/" ? "Home" : "History"}
      </div>
    </header>
  );
}
