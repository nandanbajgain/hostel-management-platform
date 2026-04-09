import { io, Socket } from 'socket.io-client'

let counsellingSocket: Socket | null = null

export const getCounsellingSocket = (): Socket => {
  if (!counsellingSocket) {
    const baseUrl = import.meta.env.VITE_SOCKET_URL
    counsellingSocket = io(`${baseUrl}/counselling`, {
      auth: { token: localStorage.getItem('accessToken') },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
    })
  }

  return counsellingSocket
}

export const disconnectCounsellingSocket = () => {
  counsellingSocket?.disconnect()
  counsellingSocket = null
}
