# USDT Payment System

A simple cryptocurrency payment system for receiving USDT on Binance Smart Chain (BEP20) using Etherscan API.

## Setup Instructions

### 1. Install Dependencies
\`\`\`bash
npm install
# or
pnpm install
\`\`\`

### 2. Configure Environment Variables
Create a `.env.local` file in the project root and add your API keys:

\`\`\`env
ETHERSCAN_API_KEY=your_actual_etherscan_api_key_here
\`\`\`

**Get your API key:**
- Visit [etherscan.io/apis](https://etherscan.io/apis)
- Create account and verify email
- Generate API key
- Your Etherscan API key works for BSCScan too!

**Note:** You can use either `.env` or `.env.local` - both work the same way for local development.

### 3. Start the Application
\`\`\`bash
npm run dev
# or
pnpm dev
\`\`\`

### 4. Test API Connectivity
Visit `http://localhost:3000/api-check` to verify your API key is working.

## Deployment

### For Vercel:
1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard:
   - `ETHERSCAN_API_KEY` = your_actual_api_key

### For other platforms:
Set the `ETHERSCAN_API_KEY` environment variable in your hosting platform.

## Features

- ✅ USDT BEP20 payment processing
- ✅ Real-time payment status checking
- ✅ QR code generation for easy payments
- ✅ Manual transaction verification
- ✅ BSCScan API integration
- ✅ Responsive design

## API Endpoints

- `/api/create-payment` - Create new payment request
- `/api/check-payment` - Check payment status
- `/api/verify-transaction` - Manual transaction verification
- `/api/check-connectivity` - Test API connectivity

## Network Information

- **Network:** Binance Smart Chain (BSC)
- **Chain ID:** 56
- **USDT Contract:** 0x55d398326f99059fF775485246999027B3197955
- **Explorer:** https://bscscan.com

## Troubleshooting

1. **API Key Issues:** Make sure your `.env.local` file is in the project root
2. **Network Errors:** Check `/api-check` for connectivity issues
3. **Manual Verification:** Use manual verification if auto-detection fails

## Security

- Never commit `.env` or `.env.local` files to version control
- Use environment variables for all sensitive data
- Validate all transactions before processing
