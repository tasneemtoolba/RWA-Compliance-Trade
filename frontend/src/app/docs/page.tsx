export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">How It Works</h1>
        <p className="mt-2 text-slate-600">Private eligibility trading with verifiable enforcement</p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <p className="text-slate-700 mb-4">
          CloakSwap enables compliant trading of tokenized RWAs (Real-World Assets) like gGOLD on Uniswap v4,
          with privacy-preserving eligibility checks. Users prove eligibility through encrypted credentials
          without exposing sensitive data onchain.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">1. User Onboarding</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>User enters non-PII attributes: region, accredited status, max trade bucket, expiry</li>
              <li>Browser encrypts attributes into a bitmap using Zama fhevmjs (client-side)</li>
              <li>Encrypted ciphertext + expiry stored onchain in UserRegistry</li>
              <li>No plaintext attributes are ever stored onchain</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-2">2. Compliance Enforcement</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>Uniswap v4 Hook intercepts swap attempts in <code className="bg-slate-100 px-1 rounded">beforeSwap</code></li>
              <li>Hook reads encrypted profile from UserRegistry</li>
              <li>FHEVerifier checks: <code className="bg-slate-100 px-1 rounded">(userBitmap & ruleMask) == ruleMask</code></li>
              <li>If eligible: swap proceeds ✅</li>
              <li>If not eligible: swap reverts with reason code ❌</li>
              <li>Hook emits <code className="bg-slate-100 px-1 rounded">ComplianceCheck</code> event for audit trail</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-2">3. Cross-Chain Funding</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>Users can deposit funds from any EVM chain via LI.FI Composer</li>
              <li>Route: swap (if needed) → bridge → optional contract call</li>
              <li>Step-by-step execution with receipts for each transaction</li>
              <li>Handles slippage, errors, and gas estimation</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-2">4. ENS Identity & Preferences</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>ENS names displayed for users and issuers</li>
              <li>Trading preferences stored as ENS text records: <code className="bg-slate-100 px-1 rounded">cloakswap:preferredChain</code>, <code className="bg-slate-100 px-1 rounded">cloakswap:preferredToken</code></li>
              <li>Preferences prefill deposit flows and personalize UX</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Privacy Model</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
              <span>✅</span> Onchain (Public)
            </h3>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• Encrypted ciphertext (bytes)</li>
              <li>• Expiry timestamp (uint64)</li>
              <li>• Pool rule mask (uint256)</li>
              <li>• ComplianceCheck events (pass/fail + reason)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
              <span>✅</span> Not Onchain (Private)
            </h3>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• Region (plaintext)</li>
              <li>• Accredited status (plaintext)</li>
              <li>• Max trade bucket (plaintext)</li>
              <li>• User bitmap (plaintext)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Reason Codes</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-mono bg-slate-100 px-2 py-1 rounded">0</span>
            <span>OK - Eligible</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono bg-slate-100 px-2 py-1 rounded">1</span>
            <span>NO_CREDENTIAL - No credential found. Go to Get Verified.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono bg-slate-100 px-2 py-1 rounded">2</span>
            <span>EXPIRED - Credential expired. Re-verify to trade.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono bg-slate-100 px-2 py-1 rounded">3</span>
            <span>NOT_ELIGIBLE - Not eligible for this market.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono bg-slate-100 px-2 py-1 rounded">4</span>
            <span>POOL_NOT_CONFIGURED - Pool not configured.</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Threat Model</h2>
        <div className="space-y-3 text-slate-700">
          <p>
            <strong>What we protect:</strong> User's compliance attributes (region, accredited status, limits)
            are never exposed onchain. Only encrypted ciphertext is stored.
          </p>
          <p>
            <strong>What we reveal:</strong> Pass/fail result and reason codes are public for auditability.
            This is necessary for transparent compliance enforcement.
          </p>
          <p>
            <strong>Verifiability:</strong> All hook decisions are recorded in ComplianceCheck events,
            making the system auditable without revealing private data.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Bounty Alignment</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-link">✅ Uniswap v4 Privacy DeFi</h3>
            <p className="text-sm text-slate-700 mt-1">
              Hook-based privacy-enhancing market structure. Eligibility stored as ciphertext only.
              Hook enforces compliance deterministically. All decisions verifiable via events.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-link">✅ LI.FI Integration</h3>
            <p className="text-sm text-slate-700 mt-1">
              "Deposit from anywhere" flow supporting 2+ EVM chains. Route execution with step receipts.
              Error handling and slippage management.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-link">✅ ENS</h3>
            <p className="text-sm text-slate-700 mt-1">
              ENS name resolution for users and issuers. Creative use: trading preferences stored as
              ENS text records for portable UX across dApps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
