'use client'

import React from 'react'

interface PhotosSkeletonProps {
  count?: number
  viewMode?: 'grid' | 'list' | 'rich'
}

export default function PhotosSkeleton({ 
  count = 8, 
  viewMode = 'grid' 
}: PhotosSkeletonProps) {
  return (
    <div className={
      viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
        : 'space-y-6'
    }>
      {Array.from({ length: count }, (_, i) => (
        <div 
          key={i} 
          className={`bg-white rounded-lg border animate-pulse ${
            viewMode === 'list' ? 'flex space-x-4 p-4' : 'overflow-hidden'
          }`}
        >
          {/* Image Skeleton */}
          <div className={`${
            viewMode === 'list' ? 'w-48 h-36' : 'aspect-square'
          } bg-gray-200 ${
            viewMode === 'grid' ? 'rounded-t-lg' : 'rounded-lg flex-shrink-0'
          }`}></div>
          
          {/* Content Skeleton */}
          <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1'} space-y-3`}>
            {/* User Info Skeleton */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-2 bg-gray-200 rounded w-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            
            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            
            {/* Description Skeleton */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            
            {/* Tags Skeleton */}
            <div className="flex space-x-2">
              <div className="h-5 bg-gray-200 rounded-full w-16"></div>
              <div className="h-5 bg-gray-200 rounded-full w-20"></div>
              <div className="h-5 bg-gray-200 rounded-full w-14"></div>
            </div>
            
            {/* Stats & Actions Skeleton */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </div>
              
              <div className="flex space-x-1">
                <div className="h-7 bg-gray-200 rounded w-8"></div>
                <div className="h-7 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
            
            {/* File Info Skeleton */}
            <div className="pt-2 border-t">
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
