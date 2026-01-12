import { Request, Response, NextFunction } from 'express';
import { WalletAddressSchema } from '../utils/validation.js';

// Extract wallet address from query or headers
export function extractWalletAddress(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const address = (req.query.address as string) || 
                  (req.headers['x-wallet-address'] as string);

  if (!address) {
    res.status(400).json({
      success: false,
      error: 'Missing wallet address',
      message: 'Wallet address is required',
    });
    return;
  }

  // Validate address format
  const result = WalletAddressSchema.safeParse(address);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid wallet address',
      message: 'Wallet address format is invalid',
    });
    return;
  }

  // Store in request for later use
  (req as any).walletAddress = result.data.toLowerCase();
  next();
}

// Optional wallet address (for public endpoints like leaderboard)
export function optionalWalletAddress(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const address = (req.query.address as string) || 
                  (req.headers['x-wallet-address'] as string);

  if (address) {
    const result = WalletAddressSchema.safeParse(address);
    if (result.success) {
      (req as any).walletAddress = result.data.toLowerCase();
    }
  }
  next();
}



