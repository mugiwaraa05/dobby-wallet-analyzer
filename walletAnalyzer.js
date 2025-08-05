const Moralis = require('moralis').default;
const { EvmChain } = require('moralis/common-evm-utils');
const axios = require('axios');
require('dotenv').config();

async function fetchWalletData(walletAddress, blockchain = 'ethereum') {
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error('Invalid Ethereum wallet address');
  }

  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
    }

    const chain = blockchain === 'ethereum' ? EvmChain.ETHEREUM : blockchain;
    let balance = [];

    try {
      const tokenResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
        chain,
        address: walletAddress,
      });
      balance = tokenResponse.toJSON().map((token) => ({
        currency: {
          symbol: token.symbol,
          address: token.token_address,
        },
        value: token.balance / Math.pow(10, token.decimals),
      }));
    } catch (error) {
      if (error.message.includes('Cannot fetch token balances as wallet contains over 2000 tokens')) {
        console.warn('Token balance limit exceeded; skipping balances.');
      } else {
        throw error;
      }
    }

    const txResponse = await Moralis.EvmApi.transaction.getWalletTransactions({
      chain,
      address: walletAddress,
      limit: 100,
    });

    return {
      balance,
      transactionCount: txResponse.toJSON().total || 0,
      transactions: txResponse.toJSON().result || [],
    };
  } catch (error) {
    throw new Error(`Failed to fetch wallet data: ${error.message}`);
  }
}

function analyzeWallet(walletData) {
  const { balance, transactionCount, transactions } = walletData;
  const insights = [];

  const governanceTokens = [
    { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
    { symbol: 'AAVE', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
    { symbol: 'COMP', address: '0xc00e94cb662c3520282e6f5717214004a7f26888' },
  ];

  const holdsGovernance = balance.some((b) =>
    governanceTokens.some(
      (token) => token.address.toLowerCase() === (b.currency.address || '').toLowerCase()
    )
  );
  const hasVotingActivity = transactions.some((tx) =>
    tx.to_address?.toLowerCase().includes('0x5e4')
  );
  if (holdsGovernance && !hasVotingActivity) {
    insights.push('You hold governance tokens but never vote.');
  }

  const hasNFTActivity = transactions.some((tx) =>
    tx.to_address?.toLowerCase() === '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'
  );
  if (hasNFTActivity) {
    insights.push('Your NFTs say midlife crisis.');
  }

  if (transactionCount > 100) {
    insights.push('You farm and dump like it’s your religion.');
  }

  if (transactionCount < 10 && balance.length > 0) {
    insights.push('You’re a hodler who treats crypto like a savings account.');
  }

  return insights.length > 0 ? insights : ['Nothing spicy here—just a plain crypto wallet.'];
}

async function generatePersona(insights, walletAddress) {
  const prompt = `
    Yo, Dobby here—crypto’s snarkiest AI. Roast this wallet (${walletAddress}) in one brutal sentence based on these insights: ${JSON.stringify(insights)}. Example: “You hoard governance tokens but dodge votes like a coward.”
  `;

  try {
    const response = await axios.post(
      'https://api.fireworks.ai/inference/v1/chat/completions',
      {
        model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
        max_tokens: 100,
        top_p: 1,
        top_k: 40,
        presence_penalty: 0,
        frequency_penalty: 0,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`Failed to generate persona: ${error.message}`);
  }
}

async function generateBehaviorPatterns(insights, walletAddress) {
  const prompt = `
    Yo, Dobby here—crypto’s snarkiest AI. Describe the behavior patterns of this wallet (${walletAddress}) in one witty sentence based on these insights: ${JSON.stringify(insights)}. Example: “You’re a DeFi cowboy, lassoing smart contracts like there’s no tomorrow.”
  `;

  try {
    const response = await axios.post(
      'https://api.fireworks.ai/inference/v1/chat/completions',
      {
        model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
        max_tokens: 100,
        top_p: 1,
        top_k: 40,
        presence_penalty: 0,
        frequency_penalty: 0,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`Failed to generate behavior patterns: ${error.message}`);
  }
}

async function generateInvestmentStyle(insights, walletAddress) {
  const prompt = `
    Yo, Dobby here—crypto’s snarkiest AI. Describe the investment style of this wallet (${walletAddress}) in one snarky sentence based on these insights: ${JSON.stringify(insights)}. Example: “You HODL like a dragon guarding gold, never letting a single coin slip.”
  `;

  try {
    const response = await axios.post(
      'https://api.fireworks.ai/inference/v1/chat/completions',
      {
        model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
        max_tokens: 100,
        top_p: 1,
        top_k: 40,
        presence_penalty: 0,
        frequency_penalty: 0,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`Failed to generate investment style: ${error.message}`);
  }
}

module.exports = { fetchWalletData, analyzeWallet, generatePersona, generateBehaviorPatterns, generateInvestmentStyle };