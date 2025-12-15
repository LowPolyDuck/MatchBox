import { Layout } from "@/components/Layout"
import { SpringIn } from "@/components/SpringIn"
import { useBoostGaugeForToken, useBoostInfo } from "@/hooks/useGauges"
import { useGaugeProfile } from "@/hooks/useGaugeProfiles"
import { useVeBTCLocks, useVeMEZOLocks } from "@/hooks/useLocks"
import { useVoteState } from "@/hooks/useVoting"
import {
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
import { formatUnits } from "viem"
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

export default function DashboardPage() {
  const [css, theme] = useStyletron()
  const { isConnected } = useAccount()
  const { locks: veBTCLocks, isLoading: isLoadingVeBTC } = useVeBTCLocks()
  const { locks: veMEZOLocks, isLoading: isLoadingVeMEZO } = useVeMEZOLocks()

  const isLoading = isLoadingVeBTC || isLoadingVeMEZO

  const totalVeBTCVotingPower = veBTCLocks.reduce(
    (acc, lock) => acc + lock.votingPower,
    0n,
  )
  const totalVeMEZOVotingPower = veMEZOLocks.reduce(
    (acc, lock) => acc + lock.votingPower,
    0n,
  )

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

            <SpringIn delay={4} variant="card">
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
                      <SpringIn key={lock.tokenId.toString()} delay={5 + index} variant="card">
                        <VeBTCLockCard lock={lock} />
                      </SpringIn>
                    ))}
                  </div>
                )}
              </div>
            </SpringIn>

            <SpringIn delay={5 + veBTCLocks.length} variant="card">
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
                      <SpringIn key={lock.tokenId.toString()} delay={6 + veBTCLocks.length + index} variant="card">
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
