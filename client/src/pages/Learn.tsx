import { motion } from 'framer-motion'
import { BookOpen, Play, Clock, Users, Star, Film } from 'lucide-react'
import PremiumBadge from '../components/ui/PremiumBadge'
import Button from '../components/ui/Button'

const courses = [
  {
    title: 'Lighting a Thriller on an Indie Budget',
    instructor: 'Maria Chen',
    lessons: 12,
    duration: '4h 30m',
    students: 2341,
    rating: 4.8,
    category: 'Cinematography',
    premium: false,
  },
  {
    title: 'Advanced Sound Design for Sci-Fi',
    instructor: 'James Park',
    lessons: 8,
    duration: '3h 15m',
    students: 1872,
    rating: 4.7,
    category: 'Sound',
    premium: true,
  },
  {
    title: 'Screenwriting: Structure That Hooks',
    instructor: 'Sarah Mitchell',
    lessons: 15,
    duration: '6h 20m',
    students: 3204,
    rating: 4.9,
    category: 'Writing',
    premium: false,
  },
  {
    title: 'Color Grading Like a Pro',
    instructor: 'David Kim',
    lessons: 10,
    duration: '5h 00m',
    students: 1567,
    rating: 4.6,
    category: 'Post-Production',
    premium: true,
  },
  {
    title: 'Directing Actors: The Invisible Art',
    instructor: 'Ana Rodriguez',
    lessons: 14,
    duration: '4h 45m',
    students: 2893,
    rating: 4.8,
    category: 'Directing',
    premium: false,
  },
  {
    title: 'Production Design on a Shoestring',
    instructor: 'Tom Wells',
    lessons: 9,
    duration: '3h 50m',
    students: 1234,
    rating: 4.5,
    category: 'Design',
    premium: true,
  },
]

const categories = ['All', 'Cinematography', 'Sound', 'Writing', 'Post-Production', 'Directing', 'Design']

export default function Learn() {
  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-accent" />
          <h1 className="text-3xl md:text-section font-bold">E-Learning</h1>
        </div>
        <p className="text-gray-400 text-sm mb-8">
          Master filmmaking from the pros. Exclusive courses taught by industry experts.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-surface-card border border-white/10 rounded-2xl overflow-hidden hover:border-creator/30 transition-colors"
            >
              <div className="aspect-video bg-gradient-to-br from-accent/20 to-surface-secondary flex items-center justify-center relative">
                <Film className="w-12 h-12 text-gray-600 group-hover:text-accent/50 transition-colors" />
                {course.premium && (
                  <div className="absolute top-3 right-3">
                    <PremiumBadge size="sm" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                    <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {course.category}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white leading-snug mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-gray-500 mb-3">by {course.instructor}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" /> {course.lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {course.students}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-premium text-accent" />
                    <span className="text-sm font-semibold text-white">{course.rating}</span>
                  </div>
                  <Button variant={course.premium ? 'primary' : 'secondary'} size="sm">
                    {course.premium ? 'Premium' : 'Enroll Free'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
