const express = require('express');
   const rateLimit = require('express-rate-limit');
   const { fetchWalletData, analyzeWallet, generatePersona, generateBehaviorPatterns, generateInvestmentStyle } = require('./walletAnalyzer');
   const app = express();
   const port = process.env.PORT || 3000;

   // Middleware
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.use(express.static('public'));

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100,
   });
   app.use(limiter);

   app.get('/', (req, res) => {
     res.send(`
       <!DOCTYPE html>
       <html lang="en">
         <head>
           <meta charset="UTF-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <title>Dobby Wallet Personality Analyzer</title>
           <script src="https://cdn.tailwindcss.com"></script>
           <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
           <style>
             .gradient-bg {
               background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
             }
             .card-shadow {
               box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
             }
             .loading-spinner {
               display: none;
               border: 4px solid rgba(255, 255, 255, 0.3);
               border-radius: 50%;
               border-top: 4px solid #3b82f6;
               width: 40px;
               height: 40px;
               animation: spin 1s linear infinite;
               margin: 0 auto;
             }
             @keyframes spin {
               0% { transform: rotate(0deg); }
               100% { transform: rotate(360deg); }
             }
             .fade-in {
               animation: fadeIn 0.5s ease-in;
             }
             @keyframes fadeIn {
               from { opacity: 0; }
               to { opacity: 1; }
             }
             .persona-card {
               transition: all 0.3s ease;
             }
             .persona-card:hover {
               transform: translateY(-5px);
             }
           </style>
         </head>
         <body class="gradient-bg min-h-screen flex items-center justify-center p-4">
           <div class="w-full max-w-md bg-white rounded-xl card-shadow overflow-hidden fade-in">
             <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
               <h1 class="text-2xl font-bold text-center">Dobby Wallet Personality Analyzer</h1>
               <p class="text-center text-blue-100 mt-2">Discover the unique personality behind any Ethereum wallet</p>
             </div>
             <div class="p-6">
               <form id="walletForm" method="POST" class="space-y-5">
                 <div>
                   <label for="walletAddress" class="block text-sm font-medium text-gray-700 mb-1">Ethereum Wallet Address</label>
                   <div class="relative">
                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                       </svg>
                     </div>
                     <input
                       type="text"
                       name="walletAddress"
                       id="walletAddress"
                       placeholder="0x..."
                       required
                       class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     />
                   </div>
                 </div>
                 <button
                   type="submit"
                   id="analyzeBtn"
                   class="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                 >
                   <span id="btnText">Analyze Wallet</span>
                   <svg id="btnSpinner" class="hidden -mr-1 ml-2 h-5 w-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                     <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                 </button>
               </form>
               <div id="error" class="hidden mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r"></div>
             </div>
           </div>
           <script>
             const form = document.getElementById('walletForm');
             const errorDiv = document.getElementById('error');
             const walletInput = document.getElementById('walletAddress');
             const analyzeBtn = document.getElementById('analyzeBtn');
             const btnText = document.getElementById('btnText');
             const btnSpinner = document.getElementById('btnSpinner');

             form.addEventListener('submit', async (e) => {
               e.preventDefault();
               errorDiv.classList.add('hidden');
               errorDiv.textContent = '';

               const walletAddress = walletInput.value.trim();
               if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                 errorDiv.classList.remove('hidden');
                 errorDiv.innerHTML = \`
                   <div class="flex items-center">
                     <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                     </svg>
                     Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)
                   </div>
                 \`;
                 return;
               }

               btnText.textContent = 'Analyzing...';
               btnSpinner.classList.remove('hidden');
               analyzeBtn.disabled = true;

               try {
                 const formData = new FormData();
                 formData.append('walletAddress', walletAddress);
                 console.log('Form data:', formData.get('walletAddress')); // Debug

                 const response = await fetch('/analyze', {
                   method: 'POST',
                   body: new URLSearchParams(formData),
                   headers: {
                     'Content-Type': 'application/x-www-form-urlencoded',
                   },
                 });

                 if (!response.ok) {
                   const errorText = await response.text();
                   throw new Error(errorText.includes('Invalid') ? 'Invalid wallet address' : 'Server error');
                 }

                 const data = await response.text();
                 btnText.textContent = 'Analyze Wallet';
                 btnSpinner.classList.add('hidden');
                 analyzeBtn.disabled = false;
                 document.body.innerHTML = data;
               } catch (err) {
                 btnText.textContent = 'Analyze Wallet';
                 btnSpinner.classList.add('hidden');
                 analyzeBtn.disabled = false;
                 errorDiv.classList.remove('hidden');
                 errorDiv.innerHTML = \`
                   <div class="flex items-center">
                     <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                     </svg>
                     Error: \${err.message || 'Failed to analyze wallet'}
                   </div>
                 \`;
               }
             });
           </script>
         </body>
       </html>
     `);
   });

   app.post('/analyze', async (req, res) => {
     console.log('Request body:', req.body); // Debug
     const { walletAddress } = req.body || {};

     if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
       return res.status(400).send(`
         <!DOCTYPE html>
         <html lang="en">
           <head>
             <meta charset="UTF-8">
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <title>Error | Wallet Analyzer</title>
             <script src="https://cdn.tailwindcss.com"></script>
             <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
           </head>
           <body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
             <div class="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden animate__animated animate__fadeIn">
               <div class="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                 <h1 class="text-2xl font-bold text-center">Error</h1>
               </div>
               <div class="p-6 text-center">
                 <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                   <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                   </svg>
                 </div>
                 <h3 class="text-lg font-medium text-gray-900 mb-2">Invalid Wallet Address</h3>
                 <p class="text-gray-600 mb-6">Please provide a valid Ethereum wallet address (0x followed by 40 hexadecimal characters).</p>
                 <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300">
                   Back to Analyzer
                 </a>
               </div>
             </div>
           </body>
         </html>
       `);
     }

     try {
       const walletData = await fetchWalletData(walletAddress);
       const insights = analyzeWallet(walletData);
       const persona = await generatePersona(insights, walletAddress);
       const behaviorPatterns = await generateBehaviorPatterns(insights, walletAddress);
       const investmentStyle = await generateInvestmentStyle(insights, walletAddress);

       res.send(`
         <!DOCTYPE html>
         <html lang="en">
           <head>
             <meta charset="UTF-8">
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <title>Results | Wallet Analyzer</title>
             <script src="https://cdn.tailwindcss.com"></script>
             <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
           </head>
           <body class="bg-gray-100 min-h-screen p-4">
             <div class="max-w-3xl mx-auto animate__animated animate__fadeIn">
               <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-xl text-white">
                 <h1 class="text-2xl font-bold text-center">Wallet Personality Analysis</h1>
                 <p class="text-center text-blue-100 mt-2">Discover the unique personality behind this Ethereum wallet</p>
               </div>
               <div class="bg-white rounded-b-xl shadow-lg overflow-hidden">
                 <div class="p-6 border-b border-gray-200">
                   <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                     <div>
                       <h2 class="text-lg font-semibold text-gray-900">Wallet Address</h2>
                       <p class="text-gray-600 font-mono break-all">${walletAddress}</p>
                     </div>
                     <span class="mt-2 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                       Crypto Enthusiast
                     </span>
                   </div>
                 </div>
                 <div class="p-6">
                   <h2 class="text-xl font-semibold text-gray-900 mb-4">Key Insights</h2>
                   <div class="grid gap-4 mb-6">
                     ${insights.map(insight => `
                       <div class="flex items-start">
                         <div class="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">
                           <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                           </svg>
                         </div>
                         <p class="ml-3 text-gray-700">${insight}</p>
                       </div>
                     `).join('')}
                   </div>
                   <h2 class="text-xl font-semibold text-gray-900 mb-4">Persona Analysis</h2>
                   <div class="bg-blue-50 rounded-lg p-4 mb-6">
                     <h3 class="font-medium text-blue-800 mb-2">Crypto Personality</h3>
                     <p class="text-blue-700">${persona}</p>
                   </div>
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                     <div class="persona-card bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300">
                       <h3 class="font-medium text-gray-900 mb-2">Behavior Patterns</h3>
                       <p class="text-gray-600">${behaviorPatterns}</p>
                     </div>
                     <div class="persona-card bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300">
                       <h3 class="font-medium text-gray-900 mb-2">Investment Style</h3>
                       <p class="text-gray-600">${investmentStyle}</p>
                     </div>
                   </div>
                 </div>
                 <div class="px-6 py-4 bg-gray-50 text-right">
                   <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300">
                     <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                     </svg>
                     Analyze Another Wallet
                   </a>
                 </div>
               </div>
             </div>
           </body>
         </html>
       `);
     } catch (error) {
       res.status(500).send(`
         <!DOCTYPE html>
         <html lang="en">
           <head>
             <meta charset="UTF-8">
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <title>Error | Dobby Wallet Analyzer</title>
             <script src="https://cdn.tailwindcss.com"></script>
             <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
           </head>
           <body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
             <div class="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden animate__animated animate__fadeIn">
               <div class="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                 <h1 class="text-2xl font-bold text-center">Analysis Failed</h1>
               </div>
               <div class="p-6 text-center">
                 <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                   <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                   </svg>
                 </div>
                 <h3 class="text-lg font-medium text-gray-900 mb-2">Error Analyzing Wallet</h3>
                 <p class="text-gray-600 mb-6">${error.message || 'An unexpected error occurred while analyzing the wallet.'}</p>
                 <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300">
                   Try Again
                 </a>
               </div>
             </div>
           </body>
         </html>
       `);
     }
   });

   app.listen(port, () => {
     console.log(`Server running at http://localhost:${port}`);
   });