import { type GaugeProfile, supabase } from "@/config/supabase"
import { useCallback, useEffect, useState } from "react"
import type { Address } from "viem"

export function useGaugeProfiles(gaugeAddresses: Address[]) {
  const [profiles, setProfiles] = useState<Map<string, GaugeProfile>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    if (gaugeAddresses.length === 0) {
      setProfiles(new Map())
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const { data, error } = await supabase
      .from("gauge_profiles")
      .select("*")
      .in(
        "gauge_address",
        gaugeAddresses.map((a) => a.toLowerCase()),
      )

    if (error) {
      console.error("Error fetching gauge profiles:", error)
      setIsLoading(false)
      return
    }

    const profileMap = new Map<string, GaugeProfile>()
    for (const profile of data ?? []) {
      profileMap.set(profile.gauge_address.toLowerCase(), profile)
    }
    setProfiles(profileMap)
    setIsLoading(false)
  }, [gaugeAddresses])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  return {
    profiles,
    isLoading,
    refetch: fetchProfiles,
  }
}

export function useGaugeProfile(gaugeAddress: Address | undefined) {
  const [profile, setProfile] = useState<GaugeProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!gaugeAddress) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const { data, error } = await supabase
      .from("gauge_profiles")
      .select("*")
      .eq("gauge_address", gaugeAddress.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error("Error fetching gauge profile:", error)
      setIsLoading(false)
      return
    }

    setProfile(data)
    setIsLoading(false)
  }, [gaugeAddress])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    isLoading,
    refetch: fetchProfile,
  }
}

type UpsertGaugeProfileParams = {
  gaugeAddress: Address
  veBTCTokenId: bigint
  ownerAddress: Address
  profilePictureUrl?: string | null
  description?: string | null
}

export function useUpsertGaugeProfile() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const upsertProfile = useCallback(
    async ({
      gaugeAddress,
      veBTCTokenId,
      ownerAddress,
      profilePictureUrl,
      description,
    }: UpsertGaugeProfileParams) => {
      setIsLoading(true)
      setError(null)

      const { data, error: upsertError } = await supabase
        .from("gauge_profiles")
        .upsert(
          {
            gauge_address: gaugeAddress.toLowerCase(),
            vebtc_token_id: veBTCTokenId.toString(),
            owner_address: ownerAddress.toLowerCase(),
            profile_picture_url: profilePictureUrl,
            description,
          },
          {
            onConflict: "gauge_address",
          },
        )
        .select()
        .single()

      if (upsertError) {
        console.error("Error upserting gauge profile:", upsertError)
        setError(new Error(upsertError.message))
        setIsLoading(false)
        return null
      }

      setIsLoading(false)
      return data as GaugeProfile
    },
    [],
  )

  return {
    upsertProfile,
    isLoading,
    error,
  }
}

export function useUploadProfilePicture() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const uploadPicture = useCallback(
    async (gaugeAddress: Address, file: File) => {
      setIsLoading(true)
      setError(null)

      const fileExt = file.name.split(".").pop()
      const fileName = `${gaugeAddress.toLowerCase()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("gauge-avatars")
        .upload(filePath, file, {
          upsert: true,
        })

      if (uploadError) {
        console.error("Error uploading profile picture:", uploadError)
        setError(new Error(uploadError.message))
        setIsLoading(false)
        return null
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("gauge-avatars").getPublicUrl(filePath)

      setIsLoading(false)
      return publicUrl
    },
    [],
  )

  return {
    uploadPicture,
    isLoading,
    error,
  }
}

