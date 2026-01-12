import { Router, Request, Response } from 'express';
import { loadGameState, saveSpin } from '../utils/gameLogic.js';
import { SpinRequestSchema } from '../utils/validation.js';
import type { ApiResponse, GameState, SpinResult } from '../types/index.js';

const router = Router();

// Get game state for a wallet address
router.get('/state', async (req: Request, res: Response): Promise<void> => {
  try {
    const walletAddress = (req as any).walletAddress;

    if (!walletAddress) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing wallet address',
        message: 'Wallet address is required',
      };
      res.status(400).json(response);
      return;
    }

    const gameState = await loadGameState(walletAddress);

    const response: ApiResponse<GameState> = {
      success: true,
      data: gameState,
    };

    res.json(response);
  } catch (error) {
    throw error; // Let error handler deal with it
  }
});

// Save spin result
router.post('/spin', async (req: Request, res: Response): Promise<void> => {
  try {
    const walletAddress = (req as any).walletAddress;

    if (!walletAddress) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing wallet address',
        message: 'Wallet address is required',
      };
      res.status(400).json(response);
      return;
    }

    // Validate request body (symbols are optional - server generates them)
    const bodyResult = SpinRequestSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: bodyResult.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { signature } = bodyResult.data;
    
    // Client symbols are ignored - server generates its own for security
    const dummySymbols: ["7", "7", "7"] = ["7", "7", "7"];

    // Save spin (server generates symbols and calculates payout)
    const result = await saveSpin(walletAddress, dummySymbols, signature);

    const response: ApiResponse<SpinResult> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
});

export default router;


