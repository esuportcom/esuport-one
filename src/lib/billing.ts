import Stripe from "stripe";export function stripe(){if(!process.env.STRIPE_SECRET_KEY)throw new Error("STRIPE_SECRET_KEY is missing");return new Stripe(process.env.STRIPE_SECRET_KEY)}
export const priceIds:Record<string,string|undefined>={solo:process.env.STRIPE_PRICE_SOLO,team:process.env.STRIPE_PRICE_TEAM,business:process.env.STRIPE_PRICE_BUSINESS};
