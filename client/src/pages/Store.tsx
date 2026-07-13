import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Shirt, Monitor, Coffee, Heart } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const categories = ['All', 'T-Shirts', 'Posters', 'Mugs', 'Caps']

const products = [
  { name: 'NovaFlix Classic Tee', category: 'T-Shirts', price: 29.99, image: null, popular: true },
  { name: 'No Spoilers Hoodie', category: 'T-Shirts', price: 49.99, image: null, popular: false },
  { name: 'Cinephile Cap', category: 'Caps', price: 24.99, image: null, popular: false },
  { name: 'Film Reel Poster', category: 'Posters', price: 19.99, image: null, popular: true },
  { name: 'Indie Film Lover Mug', category: 'Mugs', price: 14.99, image: null, popular: false },
  { name: 'Director\'s Cut Tee', category: 'T-Shirts', price: 34.99, image: null, popular: true },
  { name: 'Retro Cinema Poster', category: 'Posters', price: 24.99, image: null, popular: false },
  { name: 'Film Buff Cap', category: 'Caps', price: 22.99, image: null, popular: false },
]

export default function Store() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category === activeCategory)

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="w-8 h-8 text-accent" />
          <h1 className="text-3xl md:text-section font-bold">Merch Store</h1>
        </div>
        <p className="text-gray-400 text-sm mb-8">Wear your love for cinema</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-accent text-black'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-surface-card border border-white/10 rounded-2xl overflow-hidden hover:border-premium/30 transition-colors"
            >
              <div className="aspect-square bg-gradient-to-br from-surface-secondary to-surface-card flex items-center justify-center">
                <Shirt className="w-16 h-16 text-gray-600 group-hover:text-accent/50 transition-colors" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                  {product.popular && (
                    <Badge variant="accent" className="shrink-0 text-[10px]">
                      Popular
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-accent">${product.price}</span>
                  <button className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="primary" size="sm" className="w-full mt-3">
                  Add to Cart
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
