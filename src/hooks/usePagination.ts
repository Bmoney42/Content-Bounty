import { useState, useMemo } from 'react'

interface UsePaginationOptions {
  itemsPerPage?: number
  initialPage?: number
}

interface UsePaginationResult<T> {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  paginatedItems: T[]
  setCurrentPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { itemsPerPage = 10, initialPage = 1 } = options
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalItems = items.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Reset to page 1 if current page is greater than total pages
  // (happens when items array changes and becomes smaller)
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems,
    setCurrentPage: goToPage,
    nextPage,
    prevPage,
    goToPage
  }
}