import Link from 'next/link'
import type { Product } from '@/lib/catalog'
import { FavoriteIconButton } from './FavoriteIconButton'

interface ProductGridCardProps {
  product: Product
}

export function ProductGridCard({ product }: ProductGridCardProps) {
  return (
    <div className="group relative">
      <FavoriteIconButton productId={product.id} />
      <Link href={`/product/${product.id}`}>
        <div className="cursor-pointer">
          <div className="relative h-56 bg-gray-200 rounded-lg overflow-hidden mb-3">
            <div className="w-full h-full bg-gradient-to-br from-[#C8A97E]/10 to-[#C8A97E]/5 flex items-center justify-center">
              <span className="text-[#C8A97E] text-4xl">✦</span>
            </div>
          </div>
          <h4 className="font-semibold text-[#1F1F1F] group-hover:text-[#C8A97E] transition mb-2">{product.name}</h4>
          <p className="text-[#C8A97E] font-bold mb-1">AED {product.price}</p>
          <p className="text-sm text-[#6B6B6B]">{product.location}</p>
        </div>
      </Link>
    </div>
  )
}
