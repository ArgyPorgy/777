import { Router, Request, Response } from 'express';
import { getLeaderboard, getUserRank } from '../utils/gameLogic.js';
import { PaginationSchema } from '../utils/validation.js';
import type { ApiResponse, LeaderboardEntry } from '../types/index.js';

const router = Router();

// Get leaderboard
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse and validate pagination
    const paginationResult = PaginationSchema.safeParse({
      limit: req.query.limit,
      offset: req.query.offset,
    });

    if (!paginationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: paginationResult.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { limit, offset } = paginationResult.data;

    // Get leaderboard entries
    const entries = await getLeaderboard(limit, offset);

    // Include user rank if wallet address provided
    const walletAddress = (req as any).walletAddress;
    let userRank: number | null = null;

    if (walletAddress) {
      userRank = await getUserRank(walletAddress);
    }

    const response: ApiResponse<{
      entries: LeaderboardEntry[];
      userRank: number | null;
      total: number;
    }> = {
      success: true,
      data: {
        entries,
        userRank,
        total: entries.length, // In production, get actual total count
      },
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
});

export default router;



