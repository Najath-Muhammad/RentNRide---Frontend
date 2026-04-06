// src/components/AdminTable.tsx
import React from "react";
import { ChevronDown, Search, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

interface Column {
  readonly key: string;
  readonly label: string;
}

interface Action {
  label: string;
  onClick: (id: string) => void;
  className?: string;
}

interface Filter {
  readonly key: string;
  readonly label: string;
  readonly options: readonly string[];
}

interface AdminTableProps<T> {
  data: T[];
  columns: readonly Column[];
  title: string;


  searchValue: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;

  filters?: readonly Filter[];
  onFilterChange?: (filterKey: string, value: string) => void;
  activeFilters?: Record<string, string>;

  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;

  actions?: (item: T) => Action[];

  isLoading?: boolean;
}

const AdminTable = <T extends { _id?: string } & Record<string, unknown>>({
  data,
  columns,
  title,
  searchValue,
  onSearch,
  searchPlaceholder = "Search...",
  filters = [],
  onFilterChange,
  activeFilters = {},
  page,
  totalPages,
  onPageChange,
  totalItems,
  actions,
  isLoading = false,
}: AdminTableProps<T>) => {
  const [openDropdowns, setOpenDropdowns] = React.useState<Record<string, boolean>>({});
  const [openActionMenus, setOpenActionMenus] = React.useState<Record<string, boolean>>({});

  // Toggle filter dropdown
  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle action menu dropdown
  const toggleActionMenu = (id: string) => {
    setOpenActionMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Close action menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenActionMenus({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle filter selection
  const handleFilterSelect = (filterKey: string, value: string) => {
    if (onFilterChange) {
      onFilterChange(filterKey, value);
    }
    setOpenDropdowns((prev) => ({ ...prev, [filterKey]: false }));
  };

  // Pagination helpers
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full max-w-md pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Table Body */}
      <main className="flex-1 overflow-auto p-8">
        {/* Filters */}
        {filters.length > 0 && (
          <div className="mb-6 flex gap-4 items-center flex-wrap">
            {filters.map((filter) => (
              <div key={filter.key} className="relative">
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white"
                  onClick={() => toggleDropdown(filter.key)}
                >
                  <span className="text-sm text-gray-700">
                    {filter.label}: {activeFilters[filter.key] || "All"}
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {openDropdowns[filter.key] && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    {["All", ...filter.options].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleFilterSelect(filter.key, option === "All" ? "" : option)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        style={{ borderBottomWidth: 0 }} /* Fixed style from previous potential lint */
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {totalItems !== undefined && (
              <div className="text-sm text-gray-600">
                Showing {data.length} items {totalItems > 0 && `(Total: ${totalItems})`}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}

                  {actions && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={columns.length + (actions ? 1 : 0)}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (actions ? 1 : 0)}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No items found
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr
                      key={item._id || index}
                      className={`hover:bg-gray-50 transition-colors ${item._id && openActionMenus[item._id] ? "relative z-50 bg-gray-50" : ""
                        }`}
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                          {item[column.key] as React.ReactNode}
                        </td>
                      ))}

                      {actions && (
                        <td className="px-6 py-4 text-sm relative">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item._id) toggleActionMenu(item._id);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} className="text-gray-600" />
                            </button>

                            {item._id && openActionMenus[item._id] && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200">
                                {actions(item).length > 0 ? (
                                  actions(item).map((action, i) => (
                                    <button
                                      key={i}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (item._id) action.onClick(item._id);
                                        setOpenActionMenus({});
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b last:border-b-0 ${action.className || "text-gray-700"
                                        }`}
                                    >
                                      {action.label}
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-xs text-center text-gray-400 italic">
                                    No actions available
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={!canGoPrevious}
                  className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm ${canGoPrevious
                    ? "border-gray-300 hover:bg-gray-50 text-gray-700"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`px-3 py-2 border rounded-lg text-sm ${page === pageNum
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-gray-300 hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={!canGoNext}
                  className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm ${canGoNext
                    ? "border-gray-300 hover:bg-gray-50 text-gray-700"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminTable;