import { useQuery } from '@tanstack/react-query'
import { Avatar } from './bits'
import { ini } from '../../lib/format'
import { urlDoAvatar } from '../../features/perfil/api'

/* O bucket de avatares é privado, então a foto precisa de URL assinada. Como
   isso é uma chamada assíncrona por foto, vira componente — assim dá para usar
   dentro de listas, onde um hook solto não caberia. A react-query deduplica
   pela chave, então a mesma foto só é assinada uma vez. */
export function AvatarPerfil({
  nome,
  avatarColor,
  avatarUrl,
  size = 26,
  fontSize = 10,
}: {
  nome: string
  avatarColor: string
  avatarUrl?: string | null
  size?: number
  fontSize?: number
}) {
  const { data: url } = useQuery({
    queryKey: ['avatar', avatarUrl],
    queryFn: () => urlDoAvatar(avatarUrl!),
    enabled: Boolean(avatarUrl),
    staleTime: 1000 * 60 * 60 * 4, // a assinatura vale 8h
  })

  return (
    <Avatar color={avatarColor} src={url} alt="" size={size} fontSize={fontSize}>
      {ini(nome)}
    </Avatar>
  )
}
