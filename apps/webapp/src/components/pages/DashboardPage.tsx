import { Layout } from "@/components/Layout"
import { SpringIn } from "@/components/SpringIn"
import { useBoostGaugeForToken, useBoostInfo } from "@/hooks/useGauges"
import { useGaugeProfile } from "@/hooks/useGaugeProfiles"
import { useVeBTCLocks, useVeMEZOLocks } from "@/hooks/useLocks"
import {
  type ClaimableBribe,
  useClaimableBribes,
  useClaimBribes,
  useVoteState,
} from "@/hooks/useVoting"
import {
  Button,
  Card,
  HeadingLarge,
  HeadingMedium,
  LabelMedium,
  LabelSmall,
  ParagraphMedium,
  ParagraphSmall,
  Skeleton,
  Tag,
  useStyletron,
} from "@mezo-org/mezo-clay"
import Link from "next/link"
import { useEffect, useMemo } from "react"
import { type Address, formatUnits } from "viem"
import { useAccount } from "wagmi"

function VeBTCLockCard({
  lock,
}: { lock: ReturnType<typeof useVeBTCLocks>["locks"][0] }) {
  const [css, theme] = useStyletron()
  const { hasGauge, gaugeAddress } = useBoostGaugeForToken(lock.tokenId)
  const { boostMultiplier } = useBoostInfo(lock.tokenId)
  const { profile } = useGaugeProfile(gaugeAddress)

  const unlockDate = new Date(Number(lock.end) * 1000)
  const isExpired = unlockDate < new Date()

  return (
    <Card withBorder overrides={{}}>
      <div className={css({ padding: "8px 0" })}>
        {/* Header with Profile Picture, Name, and Status */}
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          })}
        >
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "12px",
            })}
          >
            {/* Profile Picture */}
            <div
              className={css({
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: theme.colors.backgroundSecondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
                border: `1px solid ${theme.colors.borderOpaque}`,
              })}
            >
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={`veBTC #${lock.tokenId.toString()}`}
                  className={css({
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  })}
                />
              ) : (
                <LabelSmall
                  color={theme.colors.contentSecondary}
                  overrides={{
                    Block: {
                      style: { fontSize: "12px" },
                    },
                  }}
                >
                  #{lock.tokenId.toString()}
                </LabelSmall>
              )}
            </div>
            {/* Name and Description */}
            <div
              className={css({
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                minWidth: 0,
              })}
            >
              <LabelMedium
                color={
                  profile?.display_name || profile?.description || profile?.profile_picture_url
                    ? theme.colors.positive
                    : theme.colors.negative
                }
              >
                {profile?.display_name
                  ? profile.display_name
                  : `veBTC #${lock.tokenId.toString()}`}
              </LabelMedium>
              {profile?.description && (
                <ParagraphSmall
                  color={theme.colors.contentSecondary}
                  overrides={{
                    Block: {
                      style: {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "180px",
                        margin: 0,
                      },
                    },
                  }}
                >
                  {profile.description}
                </ParagraphSmall>
              )}
            </div>
          </div>
          <Tag
            color={lock.isPermanent ? "green" : isExpired ? "red" : "yellow"}
          >
            {lock.isPermanent ? "Permanent" : isExpired ? "Expired" : "Active"}
          </Tag>
        </div>

        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
            "@media (max-width: 480px)": {
              gap: "12px",
            },
          })}
        >
          <div>
            <LabelSmall color={theme.colors.contentSecondary}>
              Locked Amount
            </LabelSmall>
            <LabelMedium>
              {formatUnits(lock.amount, 18).slice(0, 10)} BTC
            </LabelMedium>
          </div>
          <div>
            <LabelSmall color={theme.colors.contentSecondary}>
              Voting Power
            </LabelSmall>
            <LabelMedium>
              {formatUnits(lock.votingPower, 18).slice(0, 10)}
            </LabelMedium>
          </div>
          <div>
            <LabelSmall color={theme.colors.contentSecondary}>
              Current Boost
            </LabelSmall>
            <LabelMedium
              color={
                boostMultiplier > 1
                  ? theme.colors.positive
                  : theme.colors.contentPrimary
              }
            >
              {boostMultiplier.toFixed(2)}x
            </LabelMedium>
          </div>
          <div>
            <LabelSmall color={theme.colors.contentSecondary}>
              Gauge
            </LabelSmall>
            {hasGauge && gaugeAddress ? (
              <Link
                href={`/gauges/${gaugeAddress}`}
                className={css({
                  textDecoration: "none",
                  color: theme.colors.accent,
                  ":hover": {
                    textDecoration: "underline",
                  },
                })}
              >
                <LabelMedium color={theme.colors.accent}>
                  View Gauge →
                </LabelMedium>
              </Link>
            ) : (
              <LabelMedium color={theme.colors.contentSecondary}>
                No Gauge
              </LabelMedium>
            )}
          </div>
        </div>

        {!lock.isPermanent && !isExpired && (
          <div
            className={css({
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: `1px solid ${theme.colors.borderOpaque}`,
            })}
          >
            <LabelSmall color={theme.colors.contentSecondary}>
              Unlocks: {unlockDate.toLocaleDateString()}
            </LabelSmall>
          </div>
        )}
      </div>
    </Card>
  )
}

function VeMEZOLockCard({
  lock,
}: {
  lock: ReturnType<typeof useVeMEZOLocks>["locks"][0]
}) {
  const [css, theme] = useStyletron()
  const { usedWeight, canVoteInCurrentEpoch } = useVoteState(lock.tokenId)

  const unlockDate = new Date(Number(lock.end) * 1000)
  const isExpired = unlockDate < new Date()

  return (
    <Card withBorder overrides={{}}>
      <div className={css({ padding: "8px 0" })}>
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          })}
        >
          <div>
            <LabelMedium>veMEZO #{lock.tokenId.toString()}</LabelMedium>
          </div>
          <Tag
            color={lock.isPermanent ? "green" : isExpired ? "red" : "yellow"}
          >
            {lock.isPermanent ? "Permanent" : isExpired ? "Expired" : "Active"}
          </Tag>
        </div>

        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          })}
        >
          <div>
            <LabelSmall color={theme.colors.contentSecondary}>
              Locked Amount
            </LabelSmall>
            <LabelMedium>
              {formatUnits(lock.amount, 18).slice(0, 10)} MEZO
            </LabelMedium>
          </div>
          <div>
            <LabelSmall color={theme.colors.contentSecondary}>
              Voting Power
            </LabelSmall>
            <LabelMedium>
              {formatUnits(lock.votingPower, 18).slice(0, 10)}
            </LabelMedium>
          </div>
          <div>
            <LabelSmall color={theme.colors.contentSecondary}>
              Used Weight
            </LabelSmall>
            <LabelMedium>
              {usedWeight ? formatUnits(usedWeight, 18).slice(0, 10) : "0"}
            </LabelMedium>
          </div>
          <div>
            <LabelSmall color={theme.colors.contentSecondary}>
              Can Vote
            </LabelSmall>
            <LabelMedium
              color={
                canVoteInCurrentEpoch
                  ? theme.colors.positive
                  : theme.colors.warning
              }
            >
              {canVoteInCurrentEpoch ? "Yes" : "Next Epoch"}
            </LabelMedium>
          </div>
        </div>

        {!lock.isPermanent && !isExpired && (
          <div
            className={css({
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: `1px solid ${theme.colors.borderOpaque}`,
            })}
          >
            <LabelSmall color={theme.colors.contentSecondary}>
              Unlocks: {unlockDate.toLocaleDateString()}
            </LabelSmall>
          </div>
        )}
      </div>
    </Card>
  )
}

function ClaimableBribesCard({
  tokenId,
  bribes,
  onClaim,
  isPending,
  isConfirming,
}: {
  tokenId: bigint
  bribes: ClaimableBribe[]
  onClaim: () => void
  isPending: boolean
  isConfirming: boolean
}) {
  const [css, theme] = useStyletron()

  // Group rewards by token across all bribes for this tokenId
  const rewardsByToken = useMemo(() => {
    const map = new Map<
      string,
      { symbol: string; decimals: number; amount: bigint }
    >()
    for (const bribe of bribes) {
      for (const reward of bribe.rewards) {
        const key = reward.tokenAddress.toLowerCase()
        const existing = map.get(key)
        if (existing) {
          existing.amount += reward.earned
        } else {
          map.set(key, {
            symbol: reward.symbol,
            decimals: reward.decimals,
            amount: reward.earned,
          })
        }
      }
    }
    return Array.from(map.values())
  }, [bribes])

  const hasRewards = rewardsByToken.length > 0

  if (!hasRewards) {
    return null
  }

  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "16px 20px",
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: "12px",
        border: `1px solid ${theme.colors.borderOpaque}`,
        "@media (max-width: 600px)": {
          flexDirection: "column",
          alignItems: "stretch",
          gap: "12px",
        },
      })}
    >
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flex: 1,
          minWidth: 0,
          "@media (max-width: 600px)": {
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "8px",
          },
        })}
      >
        <LabelSmall
          color={theme.colors.contentSecondary}
          overrides={{
            Block: {
              style: {
                whiteSpace: "nowrap",
              },
            },
          }}
        >
          veMEZO #{tokenId.toString()}
        </LabelSmall>

        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          })}
        >
          {rewardsByToken.map((reward) => (
            <div
              key={reward.symbol}
              className={css({
                display: "flex",
                alignItems: "baseline",
                gap: "4px",
              })}
            >
              <LabelMedium>
                {Number(formatUnits(reward.amount, reward.decimals)).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}
              </LabelMedium>
              <LabelSmall color={theme.colors.contentSecondary}>
                {reward.symbol}
              </LabelSmall>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={onClaim}
        size="compact"
        isLoading={isPending || isConfirming}
        disabled={isPending || isConfirming}
      >
        {isPending ? "Confirming..." : isConfirming ? "Claiming..." : "Claim"}
      </Button>
    </div>
  )
}

export default function DashboardPage() {
  const [css, theme] = useStyletron()
  const { isConnected } = useAccount()
  const { locks: veBTCLocks, isLoading: isLoadingVeBTC } = useVeBTCLocks()
  const { locks: veMEZOLocks, isLoading: isLoadingVeMEZO } = useVeMEZOLocks()

  const veMEZOTokenIds = useMemo(
    () => veMEZOLocks.map((lock) => lock.tokenId),
    [veMEZOLocks],
  )

  const {
    claimableBribes,
    totalClaimable,
    isLoading: isLoadingBribes,
    refetch: refetchBribes,
  } = useClaimableBribes(veMEZOTokenIds)

  const {
    claimBribes,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
    isSuccess: isClaimSuccess,
  } = useClaimBribes()

  // Refetch bribes after successful claim
  useEffect(() => {
    if (isClaimSuccess) {
      refetchBribes()
    }
  }, [isClaimSuccess, refetchBribes])

  // Group claimable bribes by tokenId
  const bribesGroupedByTokenId = useMemo(() => {
    const map = new Map<string, ClaimableBribe[]>()
    for (const bribe of claimableBribes) {
      const key = bribe.tokenId.toString()
      const existing = map.get(key) ?? []
      existing.push(bribe)
      map.set(key, existing)
    }
    return map
  }, [claimableBribes])

  const handleClaimBribes = (tokenId: bigint) => {
    const bribesForToken = bribesGroupedByTokenId.get(tokenId.toString()) ?? []
    if (bribesForToken.length === 0) return

    const bribesData = bribesForToken.map((bribe) => ({
      bribeAddress: bribe.bribeAddress,
      tokens: bribe.rewards.map((r) => r.tokenAddress),
    }))

    claimBribes(tokenId, bribesData)
  }

  const isLoading = isLoadingVeBTC || isLoadingVeMEZO

  const totalVeBTCVotingPower = veBTCLocks.reduce(
    (acc, lock) => acc + lock.votingPower,
    0n,
  )
  const totalVeMEZOVotingPower = veMEZOLocks.reduce(
    (acc, lock) => acc + lock.votingPower,
    0n,
  )

  const hasClaimableRewards = claimableBribes.length > 0

  return (
    <Layout>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        })}
      >
        <div>
          <HeadingLarge marginBottom="scale300">Dashboard</HeadingLarge>
          <ParagraphMedium color={theme.colors.contentSecondary}>
            Track your veBTC and veMEZO positions
          </ParagraphMedium>
        </div>

        {!isConnected ? (
          <SpringIn delay={0} variant="card">
            <Card withBorder overrides={{}}>
              <div
                className={css({
                  padding: "48px",
                  textAlign: "center",
                })}
              >
                <ParagraphMedium color={theme.colors.contentSecondary}>
                  Connect your wallet to view your dashboard
                </ParagraphMedium>
              </div>
            </Card>
          </SpringIn>
        ) : isLoading ? (
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            })}
          >
            <Skeleton width="100%" height="100px" animation />
            <Skeleton width="100%" height="200px" animation />
            <Skeleton width="100%" height="200px" animation />
          </div>
        ) : (
          <>
            <div
              className={css({
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                "@media (max-width: 1024px)": {
                  gridTemplateColumns: "repeat(2, 1fr)",
                },
                "@media (max-width: 480px)": {
                  gridTemplateColumns: "1fr",
                  gap: "12px",
                },
              })}
            >
              <SpringIn delay={0} variant="card">
                <Card withBorder overrides={{}}>
                  <div className={css({ padding: "8px 0" })}>
                    <LabelSmall color={theme.colors.contentSecondary}>
                      Your veBTC Locks
                    </LabelSmall>
                    <HeadingMedium>{veBTCLocks.length}</HeadingMedium>
                  </div>
                </Card>
              </SpringIn>

              <SpringIn delay={1} variant="card">
                <Card withBorder overrides={{}}>
                  <div className={css({ padding: "8px 0" })}>
                    <LabelSmall color={theme.colors.contentSecondary}>
                      Your veBTC Power
                    </LabelSmall>
                    <HeadingMedium>
                      {formatUnits(totalVeBTCVotingPower, 18).slice(0, 8)}
                    </HeadingMedium>
                  </div>
                </Card>
              </SpringIn>

              <SpringIn delay={2} variant="card">
                <Card withBorder overrides={{}}>
                  <div className={css({ padding: "8px 0" })}>
                    <LabelSmall color={theme.colors.contentSecondary}>
                      Your veMEZO Locks
                    </LabelSmall>
                    <HeadingMedium>{veMEZOLocks.length}</HeadingMedium>
                  </div>
                </Card>
              </SpringIn>

              <SpringIn delay={3} variant="card">
                <Card withBorder overrides={{}}>
                  <div className={css({ padding: "8px 0" })}>
                    <LabelSmall color={theme.colors.contentSecondary}>
                      Your veMEZO Power
                    </LabelSmall>
                    <HeadingMedium>
                      {formatUnits(totalVeMEZOVotingPower, 18).slice(0, 8)}
                    </HeadingMedium>
                  </div>
                </Card>
              </SpringIn>
            </div>

            {/* Claimable Rewards Section */}
            {hasClaimableRewards && (
              <SpringIn delay={4} variant="card">
                <Card withBorder overrides={{}}>
                  <div className={css({ padding: "8px 0" })}>
                    <div
                      className={css({
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                      })}
                    >
                      <div>
                        <LabelMedium>Claimable Rewards</LabelMedium>
                        <LabelSmall color={theme.colors.contentSecondary}>
                          {bribesGroupedByTokenId.size}{" "}
                          {bribesGroupedByTokenId.size === 1 ? "lock" : "locks"}{" "}
                          with rewards
                        </LabelSmall>
                      </div>
                      <div
                        className={css({
                          display: "flex",
                          alignItems: "baseline",
                          gap: "8px",
                        })}
                      >
                        {Array.from(totalClaimable.entries()).map(
                          ([tokenAddr, info]) => (
                            <div
                              key={tokenAddr}
                              className={css({
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                              })}
                            >
                              <HeadingMedium color={theme.colors.positive}>
                                {Number(
                                  formatUnits(info.amount, info.decimals),
                                ).toLocaleString(undefined, {
                                  maximumFractionDigits: 4,
                                })}
                              </HeadingMedium>
                              <LabelSmall color={theme.colors.contentSecondary}>
                                {info.symbol}
                              </LabelSmall>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div
                      className={css({
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      })}
                    >
                      {Array.from(bribesGroupedByTokenId.entries()).map(
                        ([tokenIdStr, bribes]) => (
                          <ClaimableBribesCard
                            key={tokenIdStr}
                            tokenId={BigInt(tokenIdStr)}
                            bribes={bribes}
                            onClaim={() => handleClaimBribes(BigInt(tokenIdStr))}
                            isPending={isClaimPending}
                            isConfirming={isClaimConfirming}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </Card>
              </SpringIn>
            )}

            <SpringIn delay={hasClaimableRewards ? 5 : 4} variant="card">
              <div>
                <HeadingMedium marginBottom="scale500">
                  Your veBTC Locks
                </HeadingMedium>
                {veBTCLocks.length === 0 ? (
                  <Card withBorder overrides={{}}>
                    <div
                      className={css({
                        padding: "32px",
                        textAlign: "center",
                      })}
                    >
                      <ParagraphMedium color={theme.colors.contentSecondary}>
                        No veBTC locks found
                      </ParagraphMedium>
                    </div>
                  </Card>
                ) : (
                  <div
                    className={css({
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(350px, 1fr))",
                      gap: "16px",
                      "@media (max-width: 480px)": {
                        gridTemplateColumns: "1fr",
                        gap: "12px",
                      },
                    })}
                  >
                    {veBTCLocks.map((lock, index) => (
                      <SpringIn key={lock.tokenId.toString()} delay={(hasClaimableRewards ? 6 : 5) + index} variant="card">
                        <VeBTCLockCard lock={lock} />
                      </SpringIn>
                    ))}
                  </div>
                )}
              </div>
            </SpringIn>

            <SpringIn delay={(hasClaimableRewards ? 6 : 5) + veBTCLocks.length} variant="card">
              <div>
                <HeadingMedium marginBottom="scale500">
                  Your veMEZO Locks
                </HeadingMedium>
                {veMEZOLocks.length === 0 ? (
                  <Card withBorder overrides={{}}>
                    <div
                      className={css({
                        padding: "32px",
                        textAlign: "center",
                      })}
                    >
                      <ParagraphMedium color={theme.colors.contentSecondary}>
                        No veMEZO locks found
                      </ParagraphMedium>
                    </div>
                  </Card>
                ) : (
                  <div
                    className={css({
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(350px, 1fr))",
                      gap: "16px",
                      "@media (max-width: 480px)": {
                        gridTemplateColumns: "1fr",
                        gap: "12px",
                      },
                    })}
                  >
                    {veMEZOLocks.map((lock, index) => (
                      <SpringIn key={lock.tokenId.toString()} delay={(hasClaimableRewards ? 7 : 6) + veBTCLocks.length + index} variant="card">
                        <VeMEZOLockCard lock={lock} />
                      </SpringIn>
                    ))}
                  </div>
                )}
              </div>
            </SpringIn>
          </>
        )}
      </div>
    </Layout>
  )
}
