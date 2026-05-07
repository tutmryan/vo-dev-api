/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * This adaptor is from https://github.com/panva/node-oidc-provider/blob/main/example/adapters/redis.js
 */

import type Redis from 'ioredis'
import { isEmpty } from 'lodash'
import type { Adapter, AdapterPayload } from 'oidc-provider'

const grantable = new Set(['AccessToken', 'AuthorizationCode', 'RefreshToken', 'DeviceCode', 'BackchannelAuthenticationRequest'])

const consumable = new Set([
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
  'PushedAuthorizationRequest',
])

function grantKeyFor(id: string) {
  return `grant:${id}`
}

function userCodeKeyFor(userCode: string) {
  return `userCode:${userCode}`
}

function uidKeyFor(uid: string) {
  return `uid:${uid}`
}

class RedisAdapter implements Adapter {
  constructor(
    private name: string,
    private client: Redis,
  ) {}

  async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<undefined | void> {
    const key = this.key(id)
    const store = consumable.has(this.name) ? { payload: JSON.stringify(payload) } : JSON.stringify(payload)

    const pipeline = this.client.pipeline()
    // @ts-ignore
    pipeline[consumable.has(this.name) ? 'hmset' : 'set'](key, store)

    if (expiresIn > 0) {
      pipeline.expire(key, expiresIn)
    }

    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId)
      pipeline.rpush(grantKey, key)
      // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
      // here to trim the list to an appropriate length
      const ttl = await this.client.ttl(grantKey)
      if (expiresIn > ttl) {
        pipeline.expire(grantKey, expiresIn)
      }
    }

    if (payload.userCode) {
      const userCodeKey = userCodeKeyFor(payload.userCode)
      pipeline.set(userCodeKey, id)
      pipeline.expire(userCodeKey, expiresIn)
    }

    if (payload.uid) {
      const uidKey = uidKeyFor(payload.uid)
      pipeline.set(uidKey, id)
      pipeline.expire(uidKey, expiresIn)
    }

    await pipeline.exec()
  }

  async find(id: string): Promise<AdapterPayload | undefined | void> {
    const data: AdapterPayload | string | null = consumable.has(this.name)
      ? await this.client.hgetall(this.key(id))
      : await this.client.get(this.key(id))

    if (!data || isEmpty(data)) {
      return undefined
    }

    if (typeof data === 'string') {
      return JSON.parse(data)
    }
    const { payload, ...rest } = data
    return {
      ...rest,
      // @ts-ignore
      ...JSON.parse(payload),
    }
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined | void> {
    const id = await this.client.get(uidKeyFor(uid))
    if (!id) return undefined
    return this.find(id)
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined | void> {
    const id = await this.client.get(userCodeKeyFor(userCode))
    if (!id) return undefined
    return this.find(id)
  }

  async destroy(id: string): Promise<undefined | void> {
    const key = this.key(id)
    await this.client.del(key)
  }

  async revokeByGrantId(grantId: string): Promise<undefined | void> {
    const pipeline = this.client.pipeline()
    const tokens = await this.client.lrange(grantKeyFor(grantId), 0, -1)
    tokens.forEach((token) => pipeline.del(token))
    pipeline.del(grantKeyFor(grantId))
    await pipeline.exec()
  }

  async consume(id: string): Promise<undefined | void> {
    await this.client.hset(this.key(id), 'consumed', Math.floor(Date.now() / 1000))
  }

  key(id: string) {
    return `${this.name}:${id}`
  }
}

export default RedisAdapter
