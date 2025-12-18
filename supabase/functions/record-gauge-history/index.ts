// Supabase Edge Function: record-gauge-history
// Runs daily to snapshot gauge metrics into gauge_history table
// Scheduled via pg_cron: 0 0 * * * (midnight UTC)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  createPublicClient,
  http,
  type Address,
  formatUnits,
} from "https://esm.sh/viem@2"
import {
  BOOST_VOTER_ABI,
  VOTING_ESCROW_ABI,
  NON_STAKING_GAUGE_ABI,
  BRIBE_ABI,
  ERC20_ABI,
  CONTRACTS,
  RPC_URLS,
} from "../_shared/contracts.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

// Constants
const EPOCH_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds
const MEZO_PRICE = 0.22 // Hardcoded for now, could fetch from oracle
const MEZO_TOKEN_ADDRESS = "0x7b7c000000000000000000000000000000000001"
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

// Types
type GaugeData = {
  gauge_address: string
  epoch_start: number
  vemezo_weight: string | null
  vebtc_weight: string | null
  boost_multiplier: number | null
  total_incentives_usd: number | null
  apy: number | null
  unique_voters: number | null
}

// Helper to get current epoch start
function getEpochStart(timestamp: number): bigint {
  return BigInt(Math.floor(timestamp / EPOCH_DURATION) * EPOCH_DURATION)
}

// Main function
Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    console.log("Starting gauge history snapshot...")

    // Get RPC URL from environment or use default
    const rpcUrl = Deno.env.get("MEZO_RPC_URL") || RPC_URLS.testnet
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseKey)
    const publicClient = createPublicClient({
      transport: http(rpcUrl),
    })

    const contracts = CONTRACTS.testnet
    const boostVoterAddress = contracts.boostVoter as Address
    const veBTCAddress = contracts.veBTC as Address

    // Get current epoch start
    const now = Math.floor(Date.now() / 1000)
    const epochStart = getEpochStart(now)

    console.log(`Epoch start: ${epochStart} (${new Date(Number(epochStart) * 1000).toISOString()})`)

    // 1. Get total number of gauges
    const gaugeCount = await publicClient.readContract({
      address: boostVoterAddress,
      abi: BOOST_VOTER_ABI,
      functionName: "length",
    }) as bigint

    console.log(`Found ${gaugeCount} gauges`)

    if (gaugeCount === 0n) {
      return new Response(
        JSON.stringify({ success: true, message: "No gauges to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Fetch all gauge addresses
    const gaugeAddresses: Address[] = []
    for (let i = 0n; i < gaugeCount; i++) {
      const gaugeAddress = await publicClient.readContract({
        address: boostVoterAddress,
        abi: BOOST_VOTER_ABI,
        functionName: "gauges",
        args: [i],
      }) as Address
      gaugeAddresses.push(gaugeAddress)
    }

    console.log(`Fetched ${gaugeAddresses.length} gauge addresses`)

    // 3. Process each gauge
    const gaugeDataList: GaugeData[] = []

    for (const gaugeAddress of gaugeAddresses) {
      try {
        console.log(`Processing gauge: ${gaugeAddress}`)

        // Get veMEZO weight (votes)
        const vemezoWeight = await publicClient.readContract({
          address: boostVoterAddress,
          abi: BOOST_VOTER_ABI,
          functionName: "weights",
          args: [gaugeAddress],
        }) as bigint

        // Get bribe address
        const bribeAddress = await publicClient.readContract({
          address: boostVoterAddress,
          abi: BOOST_VOTER_ABI,
          functionName: "gaugeToBribe",
          args: [gaugeAddress],
        }) as Address

        // Get rewards beneficiary (gauge owner)
        const beneficiary = await publicClient.readContract({
          address: gaugeAddress,
          abi: NON_STAKING_GAUGE_ABI,
          functionName: "rewardsBeneficiary",
        }) as Address

        // Find veBTC token ID for this gauge
        let veBTCTokenId: bigint | undefined
        let vebtcWeight: bigint | undefined
        let boostMultiplier: number | undefined

        if (beneficiary && beneficiary !== ZERO_ADDRESS) {
          // Get beneficiary's veBTC balance
          const veBTCBalance = await publicClient.readContract({
            address: veBTCAddress,
            abi: VOTING_ESCROW_ABI,
            functionName: "balanceOf",
            args: [beneficiary],
          }) as bigint

          // Find which token ID maps to this gauge
          for (let i = 0n; i < veBTCBalance; i++) {
            const tokenId = await publicClient.readContract({
              address: veBTCAddress,
              abi: VOTING_ESCROW_ABI,
              functionName: "ownerToNFTokenIdList",
              args: [beneficiary, i],
            }) as bigint

            const mappedGauge = await publicClient.readContract({
              address: boostVoterAddress,
              abi: BOOST_VOTER_ABI,
              functionName: "boostableTokenIdToGauge",
              args: [tokenId],
            }) as Address

            if (mappedGauge.toLowerCase() === gaugeAddress.toLowerCase()) {
              veBTCTokenId = tokenId
              break
            }
          }

          // Get veBTC voting power and boost if we found the token
          if (veBTCTokenId !== undefined) {
            vebtcWeight = await publicClient.readContract({
              address: veBTCAddress,
              abi: VOTING_ESCROW_ABI,
              functionName: "votingPowerOfNFT",
              args: [veBTCTokenId],
            }) as bigint

            const boost = await publicClient.readContract({
              address: boostVoterAddress,
              abi: BOOST_VOTER_ABI,
              functionName: "getBoost",
              args: [veBTCTokenId],
            }) as bigint

            boostMultiplier = Number(boost) / 1e18
          }
        }

        // Calculate incentives USD
        let totalIncentivesUSD = 0
        const hasBribe = bribeAddress && bribeAddress !== ZERO_ADDRESS

        if (hasBribe) {
          try {
            const rewardsLength = await publicClient.readContract({
              address: bribeAddress,
              abi: BRIBE_ABI,
              functionName: "rewardsListLength",
            }) as bigint

            for (let i = 0n; i < rewardsLength; i++) {
              const tokenAddress = await publicClient.readContract({
                address: bribeAddress,
                abi: BRIBE_ABI,
                functionName: "rewards",
                args: [i],
              }) as Address

              const amount = await publicClient.readContract({
                address: bribeAddress,
                abi: BRIBE_ABI,
                functionName: "tokenRewardsPerEpoch",
                args: [tokenAddress, epochStart],
              }) as bigint

              if (amount > 0n) {
                // Get token decimals
                let decimals = 18
                try {
                  decimals = await publicClient.readContract({
                    address: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "decimals",
                  }) as number
                } catch {
                  // Default to 18 decimals
                }

                const tokenAmount = Number(formatUnits(amount, decimals))
                
                // Determine price (MEZO or BTC-based)
                const isMezo = tokenAddress.toLowerCase() === MEZO_TOKEN_ADDRESS
                // For now, assume BTC price of ~100k - in production, fetch from oracle
                const btcPrice = 100000
                const price = isMezo ? MEZO_PRICE : btcPrice

                totalIncentivesUSD += tokenAmount * price
              }
            }
          } catch (e) {
            console.warn(`Error fetching bribe data for ${gaugeAddress}:`, e)
          }
        }

        // Calculate APY
        let apy: number | null = null
        if (totalIncentivesUSD > 0 && vemezoWeight > 0n) {
          const totalVeMEZOAmount = Number(vemezoWeight) / 1e18
          const totalVeMEZOValueUSD = totalVeMEZOAmount * MEZO_PRICE
          
          if (totalVeMEZOValueUSD > 0) {
            const weeklyReturn = totalIncentivesUSD / totalVeMEZOValueUSD
            const annualReturn = weeklyReturn * 52
            apy = annualReturn * 100
          }
        } else if (totalIncentivesUSD > 0) {
          // Has incentives but no votes = infinite APY
          apy = 999999
        }

        gaugeDataList.push({
          gauge_address: gaugeAddress.toLowerCase(),
          epoch_start: Number(epochStart),
          vemezo_weight: vemezoWeight.toString(),
          vebtc_weight: vebtcWeight?.toString() ?? null,
          boost_multiplier: boostMultiplier ?? null,
          total_incentives_usd: totalIncentivesUSD > 0 ? totalIncentivesUSD : null,
          apy,
          unique_voters: null, // Would need to query events for this
        })

        console.log(`Processed gauge ${gaugeAddress}: veMEZO=${vemezoWeight}, boost=${boostMultiplier}, incentives=$${totalIncentivesUSD.toFixed(2)}`)
      } catch (e) {
        console.error(`Error processing gauge ${gaugeAddress}:`, e)
      }
    }

    // 4. Upsert records into gauge_history
    if (gaugeDataList.length > 0) {
      const { error } = await supabase
        .from("gauge_history")
        .upsert(gaugeDataList, {
          onConflict: "gauge_address,epoch_start",
        })

      if (error) {
        console.error("Error upserting gauge history:", error)
        throw error
      }

      console.log(`Successfully recorded ${gaugeDataList.length} gauge snapshots`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Recorded ${gaugeDataList.length} gauge snapshots`,
        epoch_start: Number(epochStart),
        gauges_processed: gaugeDataList.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in record-gauge-history:", error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

