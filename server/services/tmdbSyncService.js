import pool from '../config/database.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const TMDB = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: { Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}` },
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class TMDBService {
  async syncAllPeople(pages = 50) {
    console.log(`[TMDB Sync] Starting sync of ${pages} pages of popular people...`);
    
    for (let page = 1; page <= pages; page++) {
      try {
        const { data } = await TMDB.get('/person/popular', { 
          params: { language: 'en-US', page } 
        });
        
        for (const person of data.results) {
          await this.syncPerson(person.id);
          await sleep(200);
        }
        console.log(`[TMDB Sync] Completed page ${page}/${pages}`);
      } catch (err) {
        console.error(`[TMDB Sync] Page ${page} failed:`, err.message);
      }
    }
    console.log('[TMDB Sync] Full sync completed');
  }

  async syncPerson(tmdbPersonId) {
    try {
      const { data: details } = await TMDB.get(`/person/${tmdbPersonId}`, {
        params: { language: 'en-US', append_to_response: 'movie_credits,tv_credits' }
      });

      const email = `${slug(details.name)}@novaflix.com`;
      const { rows: existing } = await pool.query(
        'SELECT id FROM users WHERE email = $1', [email]
      );

      let userId = existing[0]?.id;
      if (!userId) {
        const { rows } = await pool.query(
          `INSERT INTO users (id, email, name, role, plan, avatar, bio, email_verified)
           VALUES ($1, $2, $3, 'creator', 'premium', $4, $5, true)
           RETURNING id`,
          [uuidv4(), email, details.name, 
           details.profile_path ? `https://image.tmdb.org/t/p/w500${details.profile_path}` : null, 
           details.biography?.slice(0, 500) || '']
        );
        userId = rows[0].id;
      }

      await pool.query(
        `INSERT INTO creator_profiles (user_id, display_name, bio, avatar, tmdb_person_id, known_for_department)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET 
           display_name = $2, bio = $3, avatar = $4, tmdb_person_id = $5, known_for_department = $6`,
        [userId, details.name, details.biography?.slice(0, 500) || '', 
         details.profile_path ? `https://image.tmdb.org/t/p/w500${details.profile_path}` : null,
         tmdbPersonId, details.known_for_department]
      );

      await this.syncMovieCredits(userId, tmdbPersonId, details.movie_credits);
      await this.syncTVCredits(userId, tmdbPersonId, details.tv_credits);
      await this.buildGraphEdges(userId, tmdbPersonId, details.movie_credits);

    } catch (err) {
      console.error(`[TMDB Sync] Failed to sync person ${tmdbPersonId}:`, err.message);
    }
  }

  async syncMovieCredits(userId, tmdbPersonId, credits) {
    if (!credits) return;
    
    for (const credit of [...(credits.cast || []), ...(credits.crew || [])]) {
      try {
        const movieId = credit.id;
        
        // Store movie link to creator
        await pool.query(
          `INSERT INTO scraped_content_links (tmdb_id, media_type, creator_tmdb_person_id, role, credit_order)
           VALUES ($1, 'movie', $2, $3, $4)
           ON CONFLICT (tmdb_id, media_type, creator_tmdb_person_id) DO UPDATE SET role = $3, credit_order = $4`,
          [movieId, tmdbPersonId, credit.character || credit.job, credit.order || 999]
        );
      } catch (err) {
        console.error(`[TMDB Sync] Failed to sync movie credit ${credit.id}:`, err.message);
      }
    }
  }

  async syncTVCredits(userId, tmdbPersonId, credits) {
    if (!credits) return;
    
    for (const credit of [...(credits.cast || []), ...(credits.crew || [])]) {
      try {
        const tvId = credit.id;
        
        await pool.query(
          `INSERT INTO scraped_content_links (tmdb_id, media_type, creator_tmdb_person_id, role, credit_order)
           VALUES ($1, 'tv', $2, $3, $4)
           ON CONFLICT (tmdb_id, media_type, creator_tmdb_person_id) DO UPDATE SET role = $3, credit_order = $4`,
          [tvId, tmdbPersonId, credit.character || credit.job, credit.order || 999]
        );
      } catch (err) {
        console.error(`[TMDB Sync] Failed to sync TV credit ${credit.id}:`, err.message);
      }
    }
  }

  async buildGraphEdges(userId, tmdbPersonId, movieCredits) {
    if (!movieCredits) return;
    
    const movieIds = new Set([
      ...(movieCredits.cast?.map(c => c.id) || []),
      ...(movieCredits.crew?.map(c => c.id) || [])
    ]);
    
    for (const movieId of movieIds) {
      try {
        const { data: movieCredits } = await TMDB.get(`/movie/${movieId}/credits`);
        const castNames = new Map();
        
        for (const c of movieCredits.cast || []) castNames.set(c.id, c.name);
        for (const c of movieCredits.crew || []) if (!castNames.has(c.id)) castNames.set(c.id, c.name);
        
        const { rows: linked } = await pool.query(
          `SELECT cp.user_id, cp.tmdb_person_id FROM creator_profiles cp WHERE cp.tmdb_person_id = ANY($1)`,
          [Array.from(castNames.keys())]
        );

        for (const linked of linked) {
          await pool.query(
            `INSERT INTO artist_graph (person_a_id, person_b_id, movie_id, movie_title, role_a, role_b)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (person_a_id, person_b_id, movie_id) DO UPDATE SET weight = artist_graph.weight + 1`,
            [userId, linked.user_id, String(movieId), 'Movie', 'Actor', 'Actor']
          );
        }
      } catch (err) {
        console.error(`[TMDB Sync] Graph edge build failed for movie ${movieId}:`, err.message);
      }
    }
  }

  async incrementalSync() {
    console.log('[TMDB Sync] Running incremental sync...');
    try {
      const { data } = await TMDB.get('/person/popular', { params: { page: 1 } });
      for (const person of data.results.slice(0, 20)) {
        await this.syncPerson(person.id);
      }
      console.log('[TMDB Sync] Incremental sync completed');
    } catch (err) {
      console.error('[TMDB Sync] Incremental sync failed:', err.message);
    }
  }
}

export const tmdbSyncService = new TMDBService();