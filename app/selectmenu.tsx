import { Fragment } from "react";
import { classNames } from "@/utils";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

type SelectMenuProps = {
  label: string;
  options: string[];
  selected: string;
  onChange(value: string): void;
};

export function SelectMenu({
  label,
  options,
  selected,
  onChange,
}: SelectMenuProps) {
  return (
    <Listbox value={selected} onChange={onChange}>
      {({ open }) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full md:w-64"
        >
          <Listbox.Label className="mb-2 ml-1 block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-sm font-medium leading-6 text-transparent">
            {label}
          </Listbox.Label>
          <div className="relative mt-1">
            <Listbox.Button className="relative w-full cursor-default rounded-xl bg-gray-900/40 py-2.5 pl-4 pr-10 text-left text-gray-200 shadow-lg ring-1 ring-inset ring-gray-700/50 backdrop-blur-sm transition-all duration-200 hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
              <span className="block truncate font-medium">{selected}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-indigo-400"
                  aria-hidden="true"
                />

                {/* Subtle glow behind the icon */}
                <span className="absolute inset-0 rounded-full bg-indigo-500 opacity-10 blur"></span>
              </span>

              {/* Highlight border effect */}
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-60"></span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-gray-800/50 bg-gray-900/80 py-2 text-gray-200 shadow-xl ring-1 ring-black/5 backdrop-blur-lg focus:outline-none sm:text-sm">
                {options.map((option, index) => (
                  <Listbox.Option
                    key={`${option}_${index}`}
                    value={option}
                    className={({ active }) =>
                      classNames(
                        active
                          ? "bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white"
                          : "text-gray-300",
                        "relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors duration-150"
                      )
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={classNames(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {option}
                        </motion.span>

                        {selected ? (
                          <span
                            className={classNames(
                              active ? "text-white" : "text-indigo-400",
                              "absolute inset-y-0 left-0 flex items-center pl-3"
                            )}
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 15,
                              }}
                              className="relative"
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                              {/* Glow effect for selected item */}
                              <span className="absolute inset-0 rounded-full bg-indigo-400 opacity-40 blur"></span>
                            </motion.div>
                          </span>
                        ) : null}

                        {/* Hover effect line */}
                        {active && (
                          <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-blue-500"></span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </motion.div>
      )}
    </Listbox>
  );
}
