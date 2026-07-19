import { v4 as uuidv4 } from 'uuid'
import * as db from './db.js'

const postTemplates = [
  "Hey everyone! Just wrapped up an amazing new project. Can't wait to share more details soon!",
  "Thank you all for the incredible support! Your love keeps me going.",
  "Behind the scenes from my latest shoot. Stay tuned for the trailer!",
  "What's your favorite movie of mine? Drop your thoughts below!",
  "Just hit 1 million followers! So grateful for each and every one of you.",
  "New project announcement coming next week. Any guesses?",
  "Throwback to one of my favorite scenes I've ever filmed.",
  "Q&A time! Ask me anything and I'll answer the top questions.",
  "Grateful for this amazing community. You all rock!",
  "Just finished reading an incredible script. Can't say much yet, but stay tuned!",
]

export async function seedCommunities() {
  const actors = await db.getActors(20, 0)
  const creators = await db.getUsersByRole('creator')
  const admins = await db.getUsersByRole('admin')
  const fallbackUser = [...creators, ...admins][0]

  if (!fallbackUser) {
    console.log('No creator or admin user found. Skipping community seeding.')
    return
  }

  const existing = await db.getCommunities()
  const existingNames = new Set(existing.map(c => c.name.toLowerCase()))

  let created = 0
  for (const actor of actors) {
    if (existingNames.has(actor.name.toLowerCase())) continue

    const communityId = uuidv4()
    await db.createCommunity({
      id: communityId,
      name: actor.name,
      description: `A community for fans of ${actor.name}. ${actor.biography ? actor.biography.slice(0, 200) : `Join us to discuss ${actor.name}'s latest projects and performances!`}`,
      avatar: actor.avatar,
      creatorId: fallbackUser.id,
      memberCount: 1,
    })
    await db.joinCommunity(communityId, fallbackUser.id)

    const postCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < postCount; i++) {
      const template = postTemplates[Math.floor(Math.random() * postTemplates.length)]
      await db.createPost({
        id: uuidv4(),
        communityId,
        userId: fallbackUser.id,
        content: template,
      })
    }

    created++
  }

  console.log(`Seeded ${created} communities from actors`)
  process.exit(0)
}

seedCommunities().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})