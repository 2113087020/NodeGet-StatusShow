export interface NodeMeta {
  name: string
  region: string
  tags: string[]
  hidden: boolean
  virtualization: string
  lat: number | null
  lng: number | null
  order: number
  price: number
  priceUnit: string
  priceCycle: number
  expireTime: string
  trafficLimit: number | null
  trafficUsed: number
  trafficResetDay: number
}
