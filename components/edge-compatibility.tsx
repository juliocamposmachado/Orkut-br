'use client'

import { useEdgeCompatibility } from '@/hooks/use-edge-compatibility'

export function EdgeCompatibility() {
  const edgeInfo = useEdgeCompatibility()
  
  return null // This component only runs side effects
}
