import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SiteSettings } from '../api/settings'
import { fetchAdminSettings, fetchPublicSettings, updateAdminSettings } from '../api/settings'

const publicKey = ['site-settings']
const adminKey = ['admin-site-settings']

export const usePublicSiteSettings = () =>
  useQuery({
    queryKey: publicKey,
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  })

export const useAdminSiteSettings = () =>
  useQuery({
    queryKey: adminKey,
    queryFn: fetchAdminSettings,
    staleTime: 60_000,
  })

export const useUpdateAdminSiteSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(publicKey, data)
      queryClient.setQueryData(adminKey, data)
    },
  })
}
