export const CAPACITY: number = Number(process.env.TOKEN_BUCKET_CAPACITY) ?? 100;
export const REFILL_RATE: number = Number(process.env.TOKEN_BUCKET_REFILL_RATE) ?? 5;