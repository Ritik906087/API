export function getDashboardHtml(apiUrl: string, hasMongo: boolean, hasSupabase: boolean, mongoDbName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloudflare Worker API Gateway</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-500/35 overflow-x-hidden">

  <!-- Main API Header -->
  <header class="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-slate-950 text-base shadow-lg shadow-orange-500/10">
          CF
        </div>
        <div>
          <h1 class="font-bold text-base text-slate-100 tracking-tight flex items-center gap-2">
            Cloudflare Workers REST API
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1"></span>
              Live Gateway
            </span>
          </h1>
          <p class="text-xs text-slate-400 font-mono">MongoDB Atlas & Supabase Integration</p>
        </div>
      </div>
      <div class="flex items-center space-x-4 text-xs font-mono text-slate-400">
        <span class="hidden sm:inline">Deployment Target:</span>
        <span class="bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded border border-indigo-400/15 font-medium">Cloudflare Workers Isolate</span>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Top Configuration Banner -->
    <div class="bg-gradient-to-r from-slate-900 via-slate-900/40 to-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-1">Active Supabase Integration Specs</h2>
          <p class="text-xs text-slate-400 leading-relaxed">
            The backend handles secure verification credentials and connects with custom OTP gateway services.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono text-slate-300">
          <div class="bg-slate-950 px-3 py-1.5 rounded border border-slate-850">
            <span class="text-slate-500 block">SB_PROJECT_URL</span>
            <span class="text-indigo-400 select-all">https://slytlppadlmnnloszuwd.supabase.co</span>
          </div>
          <div class="bg-slate-950 px-3 py-1.5 rounded border border-slate-850">
            <span class="text-slate-500 block">SB_PUBLISHABLE_KEY</span>
            <span class="text-amber-400 select-all">sb_publishable_b17Qw...</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Left sidebar: Connection status & phone SMS OTP interface -->
      <div class="lg:col-span-4 space-y-6">
        
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 class="font-semibold text-sm text-slate-200 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>System Connections</span>
            <button onclick="checkHealth()" class="text-xs text-indigo-400 hover:text-indigo-300 transition duration-150">Refresh</button>
          </h2>
          
          <div class="space-y-4">
            <!-- MongoDB Connection Banner -->
            <div class="p-4 rounded-lg bg-slate-950 border ${hasMongo ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-amber-500/20 bg-amber-950/5'}">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-slate-300">MongoDB Atlas Status</span>
                <span class="inline-block w-2.5 h-2.5 rounded-full ${hasMongo ? 'bg-emerald-500' : 'bg-amber-400'}" id="status-dot-mongo"></span>
              </div>
              <div class="text-xs text-slate-400 mt-1 leading-normal" id="mongo-desc">
                ${hasMongo ? `Connected to <span class="text-slate-200 font-medium">Atlas Cluster</span> (DB: <code>${mongoDbName}</code>)` : 'Running in <span class="text-amber-400 font-medium">In-Memory Sandbox</span>. Set MONGODB_URI in secrets for persistent storage.'}
              </div>
            </div>

            <!-- Supabase Connection Banner -->
            <div class="p-4 rounded-lg bg-slate-950 border ${hasSupabase ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-amber-500/20 bg-amber-950/5'}">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-slate-300">Supabase Secure JWT</span>
                <span class="inline-block w-2.5 h-2.5 rounded-full ${hasSupabase ? 'bg-emerald-500' : 'bg-amber-400'}" id="status-dot-supabase"></span>
              </div>
              <div class="text-xs text-slate-400 mt-1 leading-normal" id="supabase-desc">
                ${hasSupabase ? 'Supabase secret cryptographic decoding is live. Ready to verify signatures.' : 'Supabase Secrets unconfigured. Authenticating with temporary sandbox values.'}
              </div>
            </div>
          </div>
        </div>

        <!-- SMS OTP Auth Simulator and Session Token Generator -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
          
          <h2 class="font-semibold text-sm text-slate-100 flex items-center gap-2 mb-2">
            <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            Phone SMS OTP Auth Engine
          </h2>
          <p class="text-xs text-slate-400 mb-4 leading-relaxed">
            Verify phone access via mock or live SMS messages with custom API gateway endpoints.
          </p>
          
          <div class="space-y-4">
            <!-- Step A: Send OTP -->
            <div class="bg-slate-950 p-3.5 rounded-lg border border-slate-850">
              <span class="text-[10px] font-mono text-indigo-400 block mb-2 font-bold uppercase tracking-wider">Step 1: Get SMS Passcode</span>
              <div class="space-y-3">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">Mobile No (with 91 prefix)</label>
                  <input type="text" id="sms-mobile" value="919060873927" class="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                </div>
                <button onclick="sendOtp()" id="btn-send-sms" class="w-full bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-200 rounded text-xs py-1.5 transition">
                  Trigger OTP SMS Route
                </button>
              </div>
              <div id="otp-hint-box" class="hidden mt-2 p-2 bg-indigo-950/30 border border-indigo-500/10 text-[10px] text-indigo-300 rounded font-mono">
                Generated Code: <span id="hint-code" class="font-bold text-slate-100 block mt-0.5 select-all"></span>
              </div>
            </div>

            <!-- Step B: Verify OTP -->
            <div class="bg-slate-950 p-3.5 rounded-lg border border-slate-850">
              <span class="text-[10px] font-mono text-emerald-400 block mb-2 font-bold uppercase tracking-wider">Step 2: Sign In Verification</span>
              <div class="space-y-3">
                <div>
                  <label class="block text-[10px] text-slate-400 font-semibold mb-1">6-Digit SMS OTP Code</label>
                  <input type="text" id="sms-code" placeholder="803213" class="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                </div>
                <button onclick="verifyOtp()" id="btn-verify-sms" class="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-slate-100 rounded text-xs py-1.5 font-medium transition duration-150">
                  Verify & Sign In Session
                </button>
              </div>
            </div>

            <!-- Results box -->
            <div id="token-badge" class="hidden">
              <label class="block text-[10px] text-slate-400 font-mono mb-1">Injected Authorization Secret Header Key:</label>
              <textarea id="injected-token" readonly class="w-full text-[10px] font-mono leading-normal bg-slate-950 text-indigo-300 p-2 rounded border border-indigo-500/10 max-h-16 resize-none block" onclick="this.select()"></textarea>
              <div class="flex items-center justify-between mt-1 text-[10px]">
                <span class="text-emerald-400 flex items-center gap-1">✔ Header auto-injected</span>
                <button onclick="clearToken()" class="text-rose-400 hover:underline">Clear Token</button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 class="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">How to Deploy</h2>
          <p class="text-xs text-slate-400 mb-2 leading-relaxed">
            Deploy this backend code directly to Cloudflare Edge Nodes worldwide with standard keys:
          </p>
          <pre class="bg-slate-950 p-3 rounded border border-slate-800 text-[10px] text-lime-400 overflow-x-auto leading-normal">
# 1. Install Wrangler CLI
npm i -g wrangler

# 2. Run local development
npx wrangler dev src/worker.ts

# 3. Add Atlas / Supabase bindings
npx wrangler secret put MONGODB_URI
npx wrangler secret put SUPABASE_JWT_SECRET

# 4. Deploy to worldwide edge servers
npx wrangler deploy src/worker.ts</pre>
        </div>
      </div>

      <!-- Live REST Playground -->
      <div class="lg:col-span-8 space-y-6">
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 class="text-lg font-bold text-slate-100">Interactive REST Playground</h2>
              <p class="text-xs text-slate-400">Trigger API endpoints live on the emulator</p>
            </div>
            <span class="text-xs text-slate-400 font-mono" id="sandbox-indicator">Sandbox Active</span>
          </div>

          <!-- Sandbox Forms -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div class="md:col-span-5 space-y-3">
              <label class="block text-xs font-semibold text-slate-400">Endpoint Routing</label>
              
              <div class="space-y-2">
                <button onclick="selectRoute('GET', '/api/health')" id="btn-health" class="w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition border border-indigo-500/30 bg-indigo-500/10 text-slate-100 font-medium">
                  <span class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] rounded uppercase">GET</span>
                    <span>/api/health</span>
                  </span>
                  <span class="text-[10px] text-slate-400">Status</span>
                </button>

                <button onclick="selectRoute('POST', '/api/auth/send-otp')" id="btn-send-otp" class="w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition border border-transparent hover:border-slate-800 bg-slate-950 text-slate-300">
                  <span class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 font-mono text-[10px] rounded uppercase">POST</span>
                    <span>/api/auth/send-otp</span>
                  </span>
                  <span class="text-[10px] text-slate-400">OTP SMS</span>
                </button>

                <button onclick="selectRoute('POST', '/api/auth/verify-otp')" id="btn-verify-otp" class="w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition border border-transparent hover:border-slate-800 bg-slate-950 text-slate-300">
                  <span class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 font-mono text-[10px] rounded uppercase">POST</span>
                    <span>/api/auth/verify-otp</span>
                  </span>
                  <span class="text-[10px] text-slate-400">Verify</span>
                </button>
                
                <button onclick="selectRoute('GET', '/api/items')" id="btn-list" class="w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition border border-transparent hover:border-slate-700 bg-slate-950 text-slate-300">
                  <span class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] rounded uppercase">GET</span>
                    <span>/api/items</span>
                  </span>
                  <span class="text-[10px] text-slate-400">Items</span>
                </button>
                
                <button onclick="selectRoute('POST', '/api/items')" id="btn-create" class="w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition border border-transparent hover:border-slate-700 bg-slate-950 text-slate-300">
                  <span class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-mono text-[10px] rounded uppercase">POST</span>
                    <span>/api/items</span>
                  </span>
                  <span class="text-[10px] text-amber-400 flex items-center gap-0.5">🔒 Auth</span>
                </button>
                
                <button onclick="selectRoute('PUT', '/api/items/')" id="btn-update" class="w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition border border-transparent hover:border-slate-700 bg-slate-950 text-slate-300">
                  <span class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 font-mono text-[10px] rounded uppercase">PUT</span>
                    <span>/api/items/:id</span>
                  </span>
                  <span class="text-[10px] text-amber-400 flex items-center gap-0.5">🔒 Auth</span>
                </button>
                
                <button onclick="selectRoute('DELETE', '/api/items/')" id="btn-delete" class="w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition border border-transparent hover:border-slate-700 bg-slate-950 text-slate-300">
                  <span class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 font-mono text-[10px] rounded uppercase">DELETE</span>
                    <span>/api/items/:id</span>
                  </span>
                  <span class="text-[10px] text-amber-400 flex items-center gap-0.5">🔒 Auth</span>
                </button>
              </div>
            </div>

            <div class="md:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-4">
              <h3 class="font-bold text-xs text-slate-300 tracking-wide uppercase">Request Parameters</h3>
              
              <!-- Item ID input (shown for PUT/DELETE) -->
              <div id="param-id-container" class="hidden">
                <label class="block text-xs text-slate-400 mb-1">Target Item ID (<code>:id</code>)</label>
                <input type="text" id="play-item-id" placeholder="60bf547dcd8f6a00155b93dc" class="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <span class="text-[10px] text-slate-400 block mt-1">Provide an ObjectId segment returned from lists or inserts.</span>
              </div>

              <!-- POST/PUT JSON payload -->
              <div id="param-payload-container" class="hidden">
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs text-slate-400">JSON Payload</label>
                  <button onclick="loadTemplatePay()" class="text-[10px] text-indigo-400 hover:text-indigo-300">Reset Template</button>
                </div>
                <textarea id="play-json-payload" class="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded p-3 text-slate-100 h-32 focus:outline-none focus:ring-1 focus:ring-indigo-500" style="tab-size: 2;"></textarea>
              </div>

              <div class="pt-2 border-t border-slate-850">
                <div class="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span>Authorization Header Status:</span>
                  <span id="auth-status-bar" class="text-rose-400 font-medium">None Included</span>
                </div>
                <button onclick="sendRequest()" class="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium py-2.5 rounded text-xs transition shadow-lg shadow-indigo-600/15">
                  Execute Endpoint
                </button>
              </div>
            </div>
          </div>

          <!-- API HTTP Console Log Output -->
          <div class="border-t border-slate-800 pt-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-xs text-slate-300 tracking-wider uppercase flex items-center gap-2">
                <span>Output Inspector</span>
                <span id="http-status-pill" class="hidden px-2 py-0.5 rounded text-[10px] font-bold"></span>
              </h3>
              <div class="flex items-center space-x-2">
                <button onclick="copyRawResponse()" class="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1">
                  Copy JSON
                </button>
              </div>
            </div>

            <!-- Terminal output representation -->
            <div class="relative bg-slate-950 border border-slate-850 rounded-lg p-4 max-h-[420px] overflow-y-auto font-mono">
              <div class="text-[10px] text-slate-500 mb-2 border-b border-slate-900 pb-2 flex justify-between" id="console-header">
                <span>Request: ---</span>
                <span>Response Time: - ms</span>
              </div>
              <pre id="output-view" class="text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">Click "Execute Endpoint" above to trigger and inspect API payloads natively in this Sandbox.</pre>
            </div>
          </div>

        </div>
      </div>

    </div>
  </main>

  <script>
    let activeMethod = 'GET';
    let activeRoute = '/api/health';
    let injectedToken = '';

    function selectRoute(method, route) {
      activeMethod = method;
      activeRoute = route;

      // Reset buttons styles
      const btns = ['btn-health', 'btn-send-otp', 'btn-verify-otp', 'btn-list', 'btn-create', 'btn-update', 'btn-delete'];
      btns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.className = "w-full flex items-center justify-between p-3 rounded-lg text-left text-xs transition border border-transparent bg-slate-950 text-slate-300";
        }
      });

      // Highlight active button
      let btnId = 'btn-health';
      if(route === '/api/health') btnId = 'btn-health';
      else if(route === '/api/auth/send-otp') btnId = 'btn-send-otp';
      else if(route === '/api/auth/verify-otp') btnId = 'btn-verify-otp';
      else if(route === '/api/items') {
        btnId = method === 'GET' ? 'btn-list' : 'btn-create';
      }
      else if(route.startsWith('/api/items/')) {
        btnId = method === 'PUT' ? 'btn-update' : 'btn-delete';
      }

      const activeBtn = document.getElementById(btnId);
      if (activeBtn) {
        let borderClass = 'border-indigo-500/30 bg-indigo-500/10 text-slate-100';
        if(method === 'POST') borderClass = 'border-blue-500/30 bg-blue-500/10 text-slate-100';
        else if(method === 'PUT') borderClass = 'border-amber-500/30 bg-amber-500/10 text-slate-100';
        else if(method === 'DELETE') borderClass = 'border-rose-500/30 bg-rose-500/10 text-slate-100';
        
        activeBtn.className = "w-full flex items-center justify-between p-3 rounded-lg text-left text-xs font-semibold pb-3 transition border " + borderClass;
      }

      // Hide or show parameter panels
      const idPanel = document.getElementById('param-id-container');
      const payloadPanel = document.getElementById('param-payload-container');

      if (route.startsWith('/api/items/') && (method === 'PUT' || method === 'DELETE')) {
        idPanel.classList.remove('hidden');
      } else {
        idPanel.classList.add('hidden');
      }

      if (method === 'POST' || method === 'PUT') {
        payloadPanel.classList.remove('hidden');
      } else {
        payloadPanel.classList.add('hidden');
      }

      // Prepopulate body templates for specific routes
      loadTemplatePay();
    }

    function loadTemplatePay() {
      const ta = document.getElementById('play-json-payload');
      if (activeRoute === '/api/auth/send-otp') {
        ta.value = JSON.stringify({
          mobileNo: "919060873927"
        }, null, 2);
      } else if (activeRoute === '/api/auth/verify-otp') {
        ta.value = JSON.stringify({
          mobileNo: "919060873927",
          otp: "803213"
        }, null, 2);
      } else {
        ta.value = JSON.stringify({
          title: "Complete Deployment Plan",
          description: "Configure wrangler.toml and push production build to Cloudflare Edge Nodes.",
          category: "Deployment",
          status: "pending"
        }, null, 2);
      }
    }

    async function sendOtp() {
      const mobile = document.getElementById('sms-mobile').value.trim();
      const btn = document.getElementById('btn-send-sms');
      const hint = document.getElementById('otp-hint-box');
      const codeLabel = document.getElementById('hint-code');
      
      btn.disabled = true;
      btn.innerText = "Requesting OTP...";
      hint.style.display = 'none';

      try {
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNo: mobile })
        });
        
        const data = await response.json();
        if (response.ok) {
          btn.innerText = "✓ Sent Successfully";
          hint.classList.remove('hidden');
          hint.style.display = 'block';
          codeLabel.innerText = data.otp || "SMS Sent to SIM successfully";
          
          // Autofill OTP field
          if (data.otp) {
            document.getElementById('sms-code').value = data.otp;
          }
        } else {
          btn.innerText = "Failed";
          alert("Error sending SMS: " + (data.message || data.error));
        }
      } catch (reason) {
        btn.innerText = "Connection Error";
        alert("Fetch error: " + reason);
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.innerText = "Trigger OTP SMS Route";
        }, 3000);
      }
    }

    async function verifyOtp() {
      const mobile = document.getElementById('sms-mobile').value.trim();
      const code = document.getElementById('sms-code').value.trim();
      const btn = document.getElementById('btn-verify-sms');
      
      if (!code) {
        alert("Please enter the 6-digit OTP code first.");
        return;
      }

      btn.disabled = true;
      btn.innerText = "Verifying...";

      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNo: mobile, otp: code })
        });
        
        const data = await response.json();
        if (response.ok) {
          btn.innerText = "✓ Verified Session";
          injectedToken = data.token;
          
          const textElement = document.getElementById('injected-token');
          textElement.value = injectedToken;
          document.getElementById('token-badge').classList.remove('hidden');
          
          const authStatus = document.getElementById('auth-status-bar');
          authStatus.className = "text-emerald-400 font-medium";
          authStatus.innerText = "Bearer (" + mobile + ")";
        } else {
          btn.innerText = "Retry Verification";
          alert("OTP verification failed: " + (data.message || data.error));
        }
      } catch (reason) {
        btn.innerText = "Connection Error";
        alert("Fetch error: " + reason);
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.innerText = "Verify & Sign In Session";
        }, 2000);
      }
    }

    function clearToken() {
      injectedToken = '';
      document.getElementById('injected-token').value = '';
      document.getElementById('token-badge').classList.add('hidden');
      const authStatus = document.getElementById('auth-status-bar');
      authStatus.className = "text-rose-400 font-medium";
      authStatus.innerText = "None Included";
    }

    async function checkHealth() {
      try {
        const r = await fetch('/api/health');
        const data = await r.json();
        
        // Update descriptors
        const mongoDesc = document.getElementById('mongo-desc');
        const mongoDot = document.getElementById('status-dot-mongo');
        if (data.database && data.database.provider !== 'sandbox_in_memory') {
          mongoDesc.innerHTML = 'Connected to <span class="text-emerald-400 font-bold text-emerald-400 select-all">Atlas Cluster</span>.<br><span class="text-slate-500 text-[10px]/normal block font-mono">DB: ' + data.database.database + '</span>';
          mongoDot.className = 'inline-block w-2.5 h-2.5 rounded-full bg-emerald-500';
        } else {
          mongoDesc.innerHTML = 'Running in <span class="text-amber-400 font-medium">In-Memory Sandbox</span>.<br><span class="text-slate-500 text-[10px]/normal block">Set MONGODB_URI in secrets for persistent storage.</span>';
          mongoDot.className = 'inline-block w-2.5 h-2.5 rounded-full bg-amber-400';
        }
        
        const supDesc = document.getElementById('supabase-desc');
        const supDot = document.getElementById('status-dot-supabase');
        if (data.supabase && data.supabase.has_jwt_secret) {
          supDesc.innerHTML = 'Supabase JWT Configured.<br><span class="text-slate-500 text-[10px]/normal block">Active JWT decoding activated.</span>';
          supDot.className = 'inline-block w-2.5 h-2.5 rounded-full bg-emerald-500';
        } else {
          supDesc.innerHTML = 'Supabase Secrets unconfigured.<br><span class="text-slate-500 text-[10px]/normal">Local standard test cell signing configured.</span>';
          supDot.className = 'inline-block w-2.5 h-2.5 rounded-full bg-amber-400';
        }
        
        document.getElementById('sandbox-indicator').innerText = data.database && data.database.provider !== 'sandbox_in_memory' ? "Connected to Cloud Atlas" : "Sandbox Persistent Local Session";
      } catch(e) {}
    }

    async function sendRequest() {
      const outputView = document.getElementById('output-view');
      const consoleHeader = document.getElementById('console-header');
      const pill = document.getElementById('http-status-pill');
      
      outputView.innerText = "Sending request to edge gateway...";
      pill.className = "hidden";
      
      let finalUrl = activeRoute;
      if (activeRoute.endsWith('/')) {
        const itemIdInput = document.getElementById('play-item-id').value.trim();
        if(!itemIdInput) {
          outputView.innerText = "Error: This endpoint is dynamic and requires a target :id. Please specify 'Target Item ID' in the parameters.";
          return;
        }
        finalUrl = activeRoute + itemIdInput;
      }

      const headers = {
        'Accept': 'application/json'
      };

      if (injectedToken) {
        headers['Authorization'] = 'Bearer ' + injectedToken;
      }

      const fetchOptions = {
        method: activeMethod,
        headers: headers
      };

      if (activeMethod === 'POST' || activeMethod === 'PUT') {
        const payloadText = document.getElementById('play-json-payload').value;
        try {
          JSON.parse(payloadText); // validate JSON first
          fetchOptions.body = payloadText;
          headers['Content-Type'] = 'application/json';
        } catch (e) {
          outputView.innerText = "Invalid JSON structure in Payload field: " + e.message;
          return;
        }
      }

      const startTime = performance.now();
      try {
        const res = await fetch(finalUrl, fetchOptions);
        const duration = (performance.now() - startTime).toFixed(1);
        
        pill.classList.remove('hidden');
        pill.innerText = res.status + " " + res.statusText;
        if (res.ok) {
          pill.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
        } else {
          pill.className = "px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20";
        }

        consoleHeader.innerHTML = '<span>Request: <b>' + activeMethod + '</b> ' + finalUrl + '</span><span>Response Time: ' + duration + ' ms</span>';
        
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const jsonVal = await res.json();
          outputView.innerText = JSON.stringify(jsonVal, null, 2);
        } else {
          outputView.innerText = await res.text();
        }
      } catch (err) {
        const duration = (performance.now() - startTime).toFixed(1);
        consoleHeader.innerHTML = '<span>Request: <b>' + activeMethod + '</b> ' + finalUrl + '</span><span>Fatal Error after ' + duration + ' ms</span>';
        outputView.innerText = "System Fetch Failed: \\n" + err.toString() + "\\n\\nIs your server running on port 3000?";
      }
    }

    function copyRawResponse() {
      const outputView = document.getElementById('output-view');
      navigator.clipboard.writeText(outputView.innerText);
    }
    
    // Auto load health on load
    window.onload = function() {
      checkHealth();
      selectRoute('GET', '/api/health');
    }
  </script>
</body>
</html>
`;
}
