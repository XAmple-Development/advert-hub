
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ListingPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const ListingPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}: ListingPaginationProps) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
      {/* Results Info */}
      <div className="text-gray-300 text-sm">
        Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of {totalItems.toLocaleString()} communities
      </div>

      {/* Pagination */}
      <Pagination>
        <PaginationContent className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={`text-white hover:bg-gray-700/50 rounded-xl ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
          </PaginationItem>

          {getVisiblePages().map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis className="text-gray-400" />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPage === page}
                  className={`text-white hover:bg-gray-700/50 rounded-xl cursor-pointer ${
                    currentPage === page 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                      : ''
                  }`}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext 
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              className={`text-white hover:bg-gray-700/50 rounded-xl ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default ListingPagination;
