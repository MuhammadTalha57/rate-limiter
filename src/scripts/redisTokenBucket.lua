-- KEYS[1] = the bucket key
-- ARGV[1] = capacity
-- ARGV[2] = refillRate
-- ARGV[3] = now (ms, passed in from Node so both sides agree on "now")

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call("GET", key)
local tokens
local lastUpdated

if bucket then
  local decoded = cjson.decode(bucket)
  tokens = decoded.tokens
  lastUpdated = decoded.lastUpdated
else
  tokens = capacity
  lastUpdated = now
end

local elapsedSeconds = math.floor((now - lastUpdated) / 1000)
local newTokens = math.min(capacity, tokens + refillRate * elapsedSeconds)

local allowed
local remaining

if newTokens >= 1 then
  allowed = true
  remaining = newTokens - 1
  lastUpdated = lastUpdated + (elapsedSeconds * 1000)
else
  allowed = false
  remaining = 0
end

redis.call("SET", key, cjson.encode({tokens = remaining, lastUpdated = lastUpdated}))

return cjson.encode({allowed = allowed, remaining = remaining})